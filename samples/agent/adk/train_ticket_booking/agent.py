# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os
from collections.abc import AsyncIterable
from pathlib import Path
from typing import Any, Dict, Optional

import jsonschema
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
    DataPart,
    Part,
    TextPart,
)
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from prompt_builder import (
    get_text_prompt,
    ROLE_DESCRIPTION,
    UI_DESCRIPTION,
)
from tools import search_trains, book_train_ticket
from a2ui.core.schema.constants import VERSION_0_8, VERSION_0_9, A2UI_OPEN_TAG, A2UI_CLOSE_TAG
from a2ui.core.schema.manager import A2uiSchemaManager
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.core.schema.common_modifiers import remove_strict_validation
from a2ui.a2a import get_a2ui_agent_extension, parse_response_to_parts

logger = logging.getLogger(__name__)
_MOCK_RESULTS_DIR = Path(__file__).parent / "gen_results"


def _extract_final_response_text(parts: list[types.Part] | None) -> str | None:
  """Extracts the best final text response while ignoring reasoning blocks.

  Prefer the first non-thought text part containing A2UI tags. Fall back to
  joining non-thought text parts if no tagged part is present.
  """
  if not parts:
    return None

  non_thought_texts: list[str] = []
  tagged_texts: list[str] = []

  for part in parts:
    text = getattr(part, "text", None)
    if not text or getattr(part, "thought", False):
      continue
    non_thought_texts.append(text)
    if A2UI_OPEN_TAG in text and A2UI_CLOSE_TAG in text:
      tagged_texts.append(text)

  if tagged_texts:
    return "\n".join(tagged_texts)
  if non_thought_texts:
    return "\n".join(non_thought_texts)
  return None


def _parse_bool_env(value: str | None) -> bool | None:
  """Parses a boolean environment variable value."""
  if value is None:
    return None
  normalized = value.strip().lower()
  if normalized in {"1", "true", "yes", "on"}:
    return True
  if normalized in {"0", "false", "no", "off"}:
    return False
  return None


def _get_mock_step_for_query(query: str) -> int:
  """Maps a query or executor-generated action string to a recorded mock step."""
  normalized = query.strip()
  if normalized.startswith("CONFIRM_BOOKING:"):
    return 5
  if normalized.startswith("CONTINUE_TO_REVIEW:"):
    return 4
  if normalized.startswith("SELECT_TRAIN_SEAT:"):
    return 3
  if normalized.startswith("SEARCH_TRAINS:"):
    return 2
  return 1


def _load_mock_messages(step: int) -> list[dict[str, Any]]:
  """Loads recorded mock A2UI messages from disk."""
  path = _MOCK_RESULTS_DIR / f"{step}.json"
  with path.open(encoding="utf-8") as fh:
    payload = json.load(fh)

  if not isinstance(payload, list):
    raise ValueError(f"Mock payload must be a JSON list: {path}")
  return payload


def _mock_messages_to_parts(messages: list[dict[str, Any]]) -> list[Part]:
  """Converts recorded A2UI messages into A2A data parts."""
  return [Part(root=DataPart(data=message)) for message in messages]


class TrainTicketBookingAgent:
  """An agent that helps users book train tickets."""

  SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

  def __init__(self, base_url: str):
    self.base_url = base_url
    self._agent_name = "Train Ticket Booking Agent"
    self._user_id = "remote_agent"
    self._mode = os.getenv("TRAIN_TICKET_MODE", "live").strip().lower()

    self._litellm_model: Optional[str] = None
    self._litellm_kwargs = {}
    self._text_runner: Optional[Runner] = None

    self._schema_managers: Dict[str, A2uiSchemaManager] = {}
    self._ui_runners: Dict[str, Runner] = {}

    for version in [VERSION_0_8, VERSION_0_9]:
      schema_manager = self._build_schema_manager(version)
      self._schema_managers[version] = schema_manager

    if self._mode != "mock":
      # Build OpenAI-compatible LLM configuration
      self._litellm_model = os.getenv("OPENAI_MODEL", "openai/gpt-4.1-mini")
      if os.getenv("OPENAI_BASE_URL"):
        self._litellm_kwargs["api_base"] = os.getenv("OPENAI_BASE_URL")
      if os.getenv("OPENAI_API_KEY"):
        self._litellm_kwargs["api_key"] = os.getenv("OPENAI_API_KEY")
      if os.getenv("OPENAI_REASONING_EFFORT"):
        self._litellm_kwargs["reasoning_effort"] = os.getenv(
            "OPENAI_REASONING_EFFORT"
        )
      thinking_type = os.getenv("OPENAI_THINKING_TYPE")
      if thinking_type:
        thinking_config: dict[str, Any] = {"type": thinking_type}
        clear_thinking = _parse_bool_env(
            os.getenv("OPENAI_THINKING_CLEAR_THINKING")
        )
        if clear_thinking is not None:
          thinking_config["clear_thinking"] = clear_thinking
        self._litellm_kwargs["thinking"] = thinking_config
        self._litellm_kwargs["allowed_openai_params"] = [
            "thinking",
            "reasoning_effort",
        ]

      self._text_runner = self._build_runner(self._build_llm_agent())
      for version, schema_manager in self._schema_managers.items():
        agent = self._build_llm_agent(schema_manager)
        self._ui_runners[version] = self._build_runner(agent)

    self._agent_card = self._build_agent_card()

  @property
  def agent_card(self) -> AgentCard:
    return self._agent_card

  def _build_schema_manager(self, version: str) -> A2uiSchemaManager:
    return A2uiSchemaManager(
        version=version,
        catalogs=[
            BasicCatalog.get_config(
                version=version, examples_path=f"examples/{version}"
            )
        ],
        schema_modifiers=[remove_strict_validation],
    )

  def _build_agent_card(self) -> AgentCard:
    extensions = []
    if self._schema_managers:
      for version, sm in self._schema_managers.items():
        ext = get_a2ui_agent_extension(
            version,
            sm.accepts_inline_catalogs,
            sm.supported_catalog_ids,
        )
        extensions.append(ext)

    capabilities = AgentCapabilities(
        streaming=True,
        extensions=extensions,
    )
    skill = AgentSkill(
        id="book_train_ticket",
        name="Train Ticket Booking Tool",
        description="Helps search trains and complete a mock train ticket booking flow.",
        tags=["train", "ticket", "booking"],
        examples=["Book me a high-speed train from Shanghai to Beijing tomorrow morning"],
    )

    return AgentCard(
        name="Train Ticket Booking Agent",
        description="This agent helps users search for trains and book tickets.",
        url=self.base_url,
        version="1.0.0",
        default_input_modes=TrainTicketBookingAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=TrainTicketBookingAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
        skills=[skill],
    )

  def _build_runner(self, agent: LlmAgent) -> Runner:
    return Runner(
        app_name=self._agent_name,
        agent=agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

  def get_processing_message(self) -> str:
    return "Processing your train booking request..."

  def _build_llm_agent(
      self, schema_manager: Optional[A2uiSchemaManager] = None
  ) -> LlmAgent:
    """Builds the LLM agent for the train ticket booking agent."""
    version_specific_ui_description = UI_DESCRIPTION
    if schema_manager:
      version = getattr(schema_manager, "version", "")
      if version == VERSION_0_8:
        version_specific_ui_description += """
- You are generating for A2UI v0.8.
- Prefer the exact v0.8 examples over any custom structure.
- For the train results step, keep the explicit card-and-button structure from the v0.8 example.
"""
    instruction = (
        schema_manager.generate_system_prompt(
            role_description=ROLE_DESCRIPTION,
            ui_description=version_specific_ui_description,
            include_schema=True,
            include_examples=True,
            validate_examples=False,  # Skip validation due to schema resolution issues
        )
        if schema_manager
        else get_text_prompt()
    )

    return LlmAgent(
        model=LiteLlm(model=self._litellm_model, **self._litellm_kwargs),
        name="train_ticket_booking_agent",
        description="An agent that helps users search for trains and book tickets.",
        instruction=instruction,
        tools=[search_trains, book_train_ticket],
    )

  async def stream(
      self, query, session_id, ui_version: Optional[str] = None
  ) -> AsyncIterable[dict[str, Any]]:
    if self._mode == "mock":
      if not ui_version:
        yield {
            "is_task_complete": True,
            "parts": [
                Part(
                    root=TextPart(
                        text=(
                            "Train ticket booking mock mode is only available when"
                            " the A2UI extension is active."
                        )
                    )
                )
            ],
        }
        return

      step = _get_mock_step_for_query(query)
      logger.info("--- TrainTicketBookingAgent.stream: mock mode step %s ---", step)
      yield {
          "is_task_complete": True,
          "parts": _mock_messages_to_parts(_load_mock_messages(step)),
      }
      return

    session_state = {"base_url": self.base_url}

    # Determine which runner to use based on whether the a2ui extension is active.
    if ui_version:
      runner = self._ui_runners[ui_version]
      schema_manager = self._schema_managers[ui_version]
      selected_catalog = (
          schema_manager.get_selected_catalog() if schema_manager else None
      )
    else:
      runner = self._text_runner
      schema_manager = None
      selected_catalog = None

    session = await runner.session_service.get_session(
        app_name=self._agent_name,
        user_id=self._user_id,
        session_id=session_id,
    )
    if session is None:
      session = await runner.session_service.create_session(
          app_name=self._agent_name,
          user_id=self._user_id,
          state=session_state,
          session_id=session_id,
      )
    elif "base_url" not in session.state:
      session.state["base_url"] = self.base_url

    # --- Begin: UI Validation and Retry Logic ---
    max_retries = 1  # Total 2 attempts
    attempt = 0
    current_query_text = query

    # Ensure schema was loaded
    if ui_version and (not selected_catalog or not selected_catalog.catalog_schema):
      logger.error(
          "--- TrainTicketBookingAgent.stream: A2UI_SCHEMA is not loaded. "
          "Cannot perform UI validation. ---"
      )
      yield {
          "is_task_complete": True,
          "parts": [
              Part(
                  root=TextPart(
                      text=(
                          "I'm sorry, I'm facing an internal configuration error with"
                          " my UI components. Please contact support."
                      )
                  )
              )
          ],
      }
      return

    while attempt <= max_retries:
      attempt += 1
      logger.info(
          f"--- TrainTicketBookingAgent.stream: Attempt {attempt}/{max_retries + 1} "
          f"for session {session_id} ---"
      )

      current_message = types.Content(
          role="user", parts=[types.Part.from_text(text=current_query_text)]
      )
      final_response_content = None

      async for event in runner.run_async(
          user_id=self._user_id,
          session_id=session.id,
          new_message=current_message,
      ):
        logger.info(f"Event from runner: {event}")
        if event.is_final_response():
          if event.content and event.content.parts:
            final_response_content = _extract_final_response_text(
                event.content.parts
            )
          break  # Got the final response, stop consuming events
        else:
          logger.info(f"Intermediate event: {event}")
          # Yield intermediate updates on every attempt
          yield {
              "is_task_complete": False,
              "updates": self.get_processing_message(),
          }

      if final_response_content is None:
        logger.warning(
            "--- TrainTicketBookingAgent.stream: Received no final response content from"
            f" runner (Attempt {attempt}). ---"
        )
        if attempt <= max_retries:
          current_query_text = (
              "I received no response. Please try again."
              f"Please retry the original request: '{query}'"
          )
          continue  # Go to next retry
        else:
          # Retries exhausted on no-response
          final_response_content = (
              "I'm sorry, I encountered an error and couldn't process your request."
          )
          # Fall through to send this as a text-only error

      is_valid = False
      error_message = ""

      if ui_version:
        logger.info(
            "--- TrainTicketBookingAgent.stream: Validating UI response (Attempt"
            f" {attempt})... ---"
        )
        try:
          from a2ui.core.parser.parser import parse_response
          response_parts = parse_response(final_response_content)

          for part in response_parts:
            if not part.a2ui_json:
              continue

            parsed_json_data = part.a2ui_json

            # --- Validation Steps ---
            logger.info(
                "--- TrainTicketBookingAgent.stream: Validating against A2UI_SCHEMA... ---"
            )
            selected_catalog.validator.validate(parsed_json_data)
            # --- End Validation Steps ---

            logger.info(
                "--- TrainTicketBookingAgent.stream: UI JSON successfully parsed AND validated"
                f" against schema. Validation OK (Attempt {attempt}). ---"
            )
            is_valid = True

        except (
            ValueError,
            json.JSONDecodeError,
            jsonschema.exceptions.ValidationError,
        ) as e:
          logger.warning(
              f"--- TrainTicketBookingAgent.stream: A2UI validation failed: {e} (Attempt"
              f" {attempt}) ---"
          )
          logger.warning(
              f"--- Failed response content: {final_response_content[:500]}... ---"
          )
          error_message = f"Validation failed: {e}."

      else:  # Not using UI, so text is always "valid"
        is_valid = True

      if is_valid:
        logger.info(
            "--- TrainTicketBookingAgent.stream: Response is valid. Sending final response"
            f" (Attempt {attempt}). ---"
        )
        final_parts = parse_response_to_parts(
            final_response_content, fallback_text="OK."
        )

        yield {
            "is_task_complete": True,
            "parts": final_parts,
        }
        return  # We're done, exit the generator

      # --- If we're here, it means validation failed ---

      if attempt <= max_retries:
        logger.warning(
            f"--- TrainTicketBookingAgent.stream: Retrying... ({attempt}/{max_retries + 1}) ---"
        )
        # Prepare the query for the retry
        current_query_text = (
            f"Your previous response was invalid. {error_message} You MUST generate a"
            " valid response that strictly follows the A2UI JSON SCHEMA. The response"
            " MUST be a JSON list of A2UI messages. Ensure each JSON part is wrapped in"
            f" '{A2UI_OPEN_TAG}' and '{A2UI_CLOSE_TAG}' tags. Please retry the"
            f" original request: '{query}'"
        )
        # Loop continues...

    # --- If we're here, it means we've exhausted retries ---
    logger.error(
        "--- TrainTicketBookingAgent.stream: Max retries exhausted. Sending text-only"
        " error. ---"
    )
    yield {
        "is_task_complete": True,
        "parts": [
            Part(
                root=TextPart(
                    text=(
                        "I'm sorry, I'm having trouble generating the interface for"
                        " that request right now. Please try again in a moment."
                    )
                )
            )
        ],
    }
    # --- End: UI Validation and Retry Logic ---
