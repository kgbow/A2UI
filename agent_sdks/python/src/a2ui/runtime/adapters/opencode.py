import json
from collections.abc import AsyncIterator

import httpx

from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class OpenCodeAdapter:
  def __init__(self, base_url: str, http_client: httpx.AsyncClient | None = None):
    self._base_url = base_url.rstrip("/")
    self._http_client = http_client or httpx.AsyncClient(timeout=30.0)

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

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    response = await self._http_client.post(
        f"{self._base_url}/run",
        json=self._build_payload(request),
    )
    response.raise_for_status()
    data = response.json()
    events = [self._normalize_event(raw_event) for raw_event in data["events"]]
    output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
    return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed", raw=data)

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    async with self._http_client.stream(
        "POST",
        f"{self._base_url}/stream",
        json=self._build_payload(request),
    ) as response:
      response.raise_for_status()
      async for line in response.aiter_lines():
        if not line:
          continue
        yield self._normalize_event(json.loads(line))
