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

import logging

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (
    DataPart,
    Part,
    Task,
    TaskState,
    TextPart,
    UnsupportedOperationError,
)
from a2a.utils import (
    new_agent_parts_message,
    new_agent_text_message,
    new_task,
)
from a2a.utils.errors import ServerError
from a2ui.a2a import try_activate_a2ui_extension
from agent import TrainTicketBookingAgent

logger = logging.getLogger(__name__)


def _build_query_from_ui_event(action: str, ctx: dict) -> str:
  """Builds a query string from a UI event action and context."""
  if action == "search_trains":
    return (
        "SEARCH_TRAINS: "
        f"from={ctx.get('fromStation')} "
        f"to={ctx.get('toStation')} "
        f"date={ctx.get('departureDate')} "
        f"time={ctx.get('timePreference')} "
        f"type={ctx.get('trainType')}"
    )
  if action == "select_train_seat":
    return (
        "SELECT_TRAIN_SEAT: "
        f"trainId={ctx.get('trainId')} "
        f"trainNumber={ctx.get('trainNumber')} "
        f"seatType={ctx.get('seatType')} "
        f"departureTime={ctx.get('departureTime')} "
        f"arrivalTime={ctx.get('arrivalTime')} "
        f"finalPrice={ctx.get('finalPrice')}"
    )
  if action == "continue_to_review":
    return (
        "CONTINUE_TO_REVIEW: "
        f"trainId={ctx.get('trainId')} "
        f"trainNumber={ctx.get('trainNumber')} "
        f"seatType={ctx.get('seatType')} "
        f"passengerName={ctx.get('passengerName')} "
        f"passengerId={ctx.get('passengerId')} "
        f"phoneNumber={ctx.get('phoneNumber')} "
        f"finalPrice={ctx.get('finalPrice')}"
    )
  if action == "confirm_booking":
    return (
        "CONFIRM_BOOKING: "
        f"trainId={ctx.get('trainId')} "
        f"seatType={ctx.get('seatType')} "
        f"passengerName={ctx.get('passengerName')} "
        f"passengerId={ctx.get('passengerId')} "
        f"phoneNumber={ctx.get('phoneNumber')}"
    )
  return f"UNKNOWN_UI_EVENT: action={action} context={ctx}"


class TrainTicketBookingAgentExecutor(AgentExecutor):
  """Train Ticket Booking AgentExecutor Example."""

  def __init__(self, agent: TrainTicketBookingAgent):
    self._agent = agent

  async def execute(
      self,
      context: RequestContext,
      event_queue: EventQueue,
  ) -> None:
    query = ""
    ui_event_part = None
    action = None

    logger.info(f"--- Client requested extensions: {context.requested_extensions} ---")
    active_ui_version = try_activate_a2ui_extension(context, self._agent.agent_card)

    # Determine which agent to use based on whether the a2ui extension is active.
    if active_ui_version:
      logger.info("--- AGENT_EXECUTOR: A2UI extension is active. Using UI agent. ---")
    else:
      logger.info(
          "--- AGENT_EXECUTOR: A2UI extension is not active. Using text agent. ---"
      )

    if context.message and context.message.parts:
      logger.info(
          f"--- AGENT_EXECUTOR: Processing {len(context.message.parts)} message"
          " parts ---"
      )
      for i, part in enumerate(context.message.parts):
        if isinstance(part.root, DataPart):
          if "userAction" in part.root.data:
            logger.info(f"  Part {i}: Found a2ui UI ClientEvent payload.")
            ui_event_part = part.root.data["userAction"]
          else:
            logger.info(f"  Part {i}: DataPart (data: {part.root.data})")
        elif isinstance(part.root, TextPart):
          logger.info(f"  Part {i}: TextPart (text: {part.root.text})")
        else:
          logger.info(f"  Part {i}: Unknown part type ({type(part.root)})")

    if ui_event_part:
      logger.info(f"Received a2ui ClientEvent: {ui_event_part}")
      action = ui_event_part.get("actionName")
      ctx = ui_event_part.get("context", {})
      query = _build_query_from_ui_event(action, ctx)
    else:
      logger.info("No a2ui UI event part found. Falling back to text input.")
      query = context.get_user_input()

    logger.info(f"--- AGENT_EXECUTOR: Final query for LLM: '{query}' ---")

    task = context.current_task

    if not task:
      task = new_task(context.message)
      await event_queue.enqueue_event(task)
    updater = TaskUpdater(event_queue, task.id, task.context_id)

    async for item in self._agent.stream(query, task.context_id, active_ui_version):
      is_task_complete = item["is_task_complete"]
      if not is_task_complete:
        await updater.update_status(
            TaskState.working,
            new_agent_text_message(item["updates"], task.context_id, task.id),
        )
        continue

      # Only mark as completed after confirm_booking
      final_state = (
          TaskState.completed
          if action == "confirm_booking"
          else TaskState.input_required
      )

      final_parts = item["parts"]

      logger.info("--- FINAL PARTS TO BE SENT ---")
      for i, part in enumerate(final_parts):
        logger.info(f"  - Part {i}: Type = {type(part.root)}")
        if isinstance(part.root, TextPart):
          logger.info(f"    - Text: {part.root.text[:200]}...")
        elif isinstance(part.root, DataPart):
          logger.info(f"    - Data: {str(part.root.data)[:200]}...")
      logger.info("-----------------------------")

      await updater.update_status(
          final_state,
          new_agent_parts_message(final_parts, task.context_id, task.id),
          final=(final_state == TaskState.completed),
      )
      break

  async def cancel(
      self, request: RequestContext, event_queue: EventQueue
  ) -> Task | None:
    raise ServerError(error=UnsupportedOperationError())
