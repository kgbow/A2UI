from collections.abc import AsyncIterator

from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class GoogleAdkAdapter:
  def __init__(self, executor):
    self._executor = executor

  def _normalize_event(self, raw_event) -> NormalizedEvent:
    if getattr(raw_event, "text", None):
      return NormalizedEvent(
          type=EventType.TEXT_DELTA,
          content=raw_event.text,
          raw=raw_event,
      )
    if getattr(raw_event, "done", False):
      return NormalizedEvent(type=EventType.MESSAGE_DONE, raw=raw_event)
    return NormalizedEvent(
        type=EventType.ERROR,
        error_code="protocol_error",
        error_message="Unsupported ADK event shape",
        raw=raw_event,
    )

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    raw_events = await self._executor.run(request)
    events = [self._normalize_event(raw_event) for raw_event in raw_events]
    output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
    return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed")

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    async for raw_event in self._executor.stream(request):
      yield self._normalize_event(raw_event)
