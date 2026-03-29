import pytest

from a2ui.runtime.runner import AgentRunner
from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class StubAdapter:
  def __init__(self, label: str):
    self.label = label

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    return RuntimeResult(
        output_text=self.label,
        events=[NormalizedEvent(type=EventType.MESSAGE_DONE)],
        stop_reason="completed",
    )

  async def stream(self, request: RuntimeRequest):
    yield NormalizedEvent(type=EventType.TEXT_DELTA, content=self.label)
    yield NormalizedEvent(type=EventType.MESSAGE_DONE)


@pytest.mark.asyncio
async def test_runner_uses_requested_runtime():
  runner = AgentRunner(
      adapters={
          "google_adk": StubAdapter("adk"),
          "opencode": StubAdapter("opencode"),
      }
  )
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
      metadata={"runtime_kind": "opencode"},
  )

  result = await runner.run(request)

  assert result.output_text == "opencode"


@pytest.mark.asyncio
async def test_runner_stream_forwards_events_in_order():
  runner = AgentRunner(adapters={"google_adk": StubAdapter("adk")})
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
      metadata={"runtime_kind": "google_adk"},
  )

  events = [event async for event in runner.stream(request)]

  assert [event.type for event in events] == [
      EventType.TEXT_DELTA,
      EventType.MESSAGE_DONE,
  ]
  assert events[0].content == "adk"
