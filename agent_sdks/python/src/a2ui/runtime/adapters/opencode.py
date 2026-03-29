import json
from collections.abc import AsyncIterator

import httpx

from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class OpenCodeAdapter:
  def __init__(
      self,
      base_url: str,
      http_client: httpx.AsyncClient | None = None,
      tool_registry: dict[str, callable] | None = None,
  ):
    self._base_url = base_url.rstrip("/")
    self._http_client = http_client or httpx.AsyncClient(timeout=30.0)
    self._tool_registry = tool_registry or {}

  def _build_payload(self, request: RuntimeRequest) -> dict:
    return {
        "agent_name": request.agent_name,
        "instruction": request.instruction,
        "messages": request.messages,
        "tools": request.tools,
        "model": request.model,
        "session_id": request.session_id,
        "metadata": request.metadata,
    }

  def _normalize_event(self, raw_event: dict) -> NormalizedEvent:
    event_type = raw_event["type"]
    if event_type == "text_delta":
      return NormalizedEvent(
          type=EventType.TEXT_DELTA,
          content=raw_event.get("content"),
          raw=raw_event,
      )
    if event_type == "message_done":
      return NormalizedEvent(type=EventType.MESSAGE_DONE, raw=raw_event)
    return NormalizedEvent(
        type=EventType.ERROR,
        error_code="protocol_error",
        error_message=f"Unsupported OpenCode event type: {event_type}",
        raw=raw_event,
    )

  async def _execute_tool(self, raw_event: dict) -> NormalizedEvent:
    tool_name = raw_event["tool_name"]
    tool_call_id = raw_event["tool_call_id"]
    tool_args = raw_event.get("tool_args", {})

    if tool_name not in self._tool_registry:
      return NormalizedEvent(
          type=EventType.ERROR,
          error_code="tool_execution_error",
          error_message=f"Unknown tool: {tool_name}",
          raw=raw_event,
      )

    tool_output = await self._tool_registry[tool_name](**tool_args)
    return NormalizedEvent(
        type=EventType.TOOL_RESULT,
        tool_name=tool_name,
        tool_call_id=tool_call_id,
        tool_args=tool_args,
        tool_output=tool_output,
        raw=raw_event,
    )

  async def _normalize_runtime_events(self, raw_events: list[dict]) -> list[NormalizedEvent]:
    normalized: list[NormalizedEvent] = []
    for raw_event in raw_events:
      event_type = raw_event["type"]
      if event_type == "tool_call":
        normalized.append(
            NormalizedEvent(
                type=EventType.TOOL_CALL,
                tool_name=raw_event["tool_name"],
                tool_call_id=raw_event["tool_call_id"],
                tool_args=raw_event.get("tool_args", {}),
                raw=raw_event,
            )
        )
        normalized.append(await self._execute_tool(raw_event))
        continue
      normalized.append(self._normalize_event(raw_event))
    return normalized

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    try:
      response = await self._http_client.post(
          f"{self._base_url}/run",
          json=self._build_payload(request),
      )
      response.raise_for_status()
      data = response.json()
      events = await self._normalize_runtime_events(data["events"])
      output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
      return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed", raw=data)
    except Exception as exc:
      return RuntimeResult(
          output_text=None,
          events=[
              NormalizedEvent(
                  type=EventType.ERROR,
                  error_code="transport_error",
                  error_message=str(exc),
                  raw=exc,
              )
          ],
          stop_reason="error",
          raw=exc,
      )

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    try:
      async with self._http_client.stream(
          "POST",
          f"{self._base_url}/stream",
          json=self._build_payload(request),
      ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
          if not line:
            continue
          raw_event = json.loads(line)
          if raw_event["type"] == "tool_call":
            yield NormalizedEvent(
                type=EventType.TOOL_CALL,
                tool_name=raw_event["tool_name"],
                tool_call_id=raw_event["tool_call_id"],
                tool_args=raw_event.get("tool_args", {}),
                raw=raw_event,
            )
            yield await self._execute_tool(raw_event)
            continue
          yield self._normalize_event(raw_event)
    except Exception as exc:
      yield NormalizedEvent(
          type=EventType.ERROR,
          error_code="transport_error",
          error_message=str(exc),
          raw=exc,
      )
