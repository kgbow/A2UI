import pytest

from a2ui.runtime.adapters.google_adk import GoogleAdkAdapter
from a2ui.runtime.adapters.opencode import OpenCodeAdapter
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


# Real adapter integration tests

class FakeAdkEvent:
  def __init__(self, text: str | None = None, done: bool = False):
    self.text = text
    self.done = done


class FakeAdkExecutor:
  async def run(self, request):
    return [FakeAdkEvent(text="hello from adk"), FakeAdkEvent(done=True)]

  async def stream(self, request):
    yield FakeAdkEvent(text="hello from adk")
    yield FakeAdkEvent(done=True)


class FakeResponse:
  def __init__(self, payload):
    self._payload = payload

  def json(self):
    return self._payload

  def raise_for_status(self):
    return None


class FakeStreamResponse:
  def __init__(self, lines):
    self._lines = lines

  async def __aenter__(self):
    return self

  async def __aexit__(self, exc_type, exc, tb):
    return None

  def raise_for_status(self):
    return None

  async def aiter_lines(self):
    for line in self._lines:
      yield line


class FakeHttpClient:
  async def post(self, url, json):
    return FakeResponse(
        {
            "events": [
                {"type": "text_delta", "content": "hello from opencode"},
                {"type": "message_done"},
            ]
        }
    )

  def stream(self, method, url, json):
    return FakeStreamResponse(
        [
            '{"type":"text_delta","content":"hello from opencode"}',
            '{"type":"message_done"}',
        ]
    )


@pytest.mark.asyncio
async def test_runner_supports_both_backends_with_same_request_shape():
  google_adapter = GoogleAdkAdapter(executor=FakeAdkExecutor())
  opencode_adapter = OpenCodeAdapter(
      base_url="http://localhost:8080",
      http_client=FakeHttpClient(),
  )
  runner = AgentRunner(
      adapters={
          "google_adk": google_adapter,
          "opencode": opencode_adapter,
      }
  )

  google_request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
      metadata={"runtime_kind": "google_adk"},
  )
  opencode_request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
      metadata={"runtime_kind": "opencode"},
  )

  google_result = await runner.run(google_request)
  opencode_result = await runner.run(opencode_request)

  assert google_result.events[-1].type is EventType.MESSAGE_DONE
  assert opencode_result.events[-1].type is EventType.MESSAGE_DONE
