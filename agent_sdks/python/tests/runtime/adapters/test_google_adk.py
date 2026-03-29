import pytest

from a2ui.runtime.adapters.google_adk import GoogleAdkAdapter
from a2ui.runtime.types import EventType, RuntimeRequest


class FakeAdkEvent:
  def __init__(self, text: str | None = None, done: bool = False):
    self.text = text
    self.done = done


class FakeAdkExecutor:
  async def run(self, request):
    return [FakeAdkEvent(text="hello"), FakeAdkEvent(done=True)]

  async def stream(self, request):
    yield FakeAdkEvent(text="hello")
    yield FakeAdkEvent(done=True)


@pytest.mark.asyncio
async def test_google_adapter_run_normalizes_events():
  adapter = GoogleAdkAdapter(executor=FakeAdkExecutor())
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
  )

  result = await adapter.run(request)

  assert result.output_text == "hello"
  assert [event.type for event in result.events] == [
      EventType.TEXT_DELTA,
      EventType.MESSAGE_DONE,
  ]


@pytest.mark.asyncio
async def test_google_adapter_stream_yields_text_then_done():
  adapter = GoogleAdkAdapter(executor=FakeAdkExecutor())
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
  )

  events = [event async for event in adapter.stream(request)]

  assert events[0].type is EventType.TEXT_DELTA
  assert events[0].content == "hello"
  assert events[1].type is EventType.MESSAGE_DONE
