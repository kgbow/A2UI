import pytest

from a2ui.runtime.adapters.opencode import OpenCodeAdapter
from a2ui.runtime.types import EventType, RuntimeRequest


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
  def __init__(self):
    self.stream_lines = [
        '{"type":"text_delta","content":"hel"}',
        '{"type":"text_delta","content":"lo"}',
        '{"type":"message_done"}',
    ]

  async def post(self, url, json):
    return FakeResponse(
        {
            "events": [
                {"type": "text_delta", "content": "hello"},
                {"type": "message_done"},
            ]
        }
    )

  def stream(self, method, url, json):
    return FakeStreamResponse(self.stream_lines)


@pytest.mark.asyncio
async def test_opencode_run_normalizes_json_events():
  adapter = OpenCodeAdapter(base_url="http://localhost:8080", http_client=FakeHttpClient())
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
async def test_opencode_stream_yields_events_in_order():
  adapter = OpenCodeAdapter(base_url="http://localhost:8080", http_client=FakeHttpClient())
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
  )

  events = [event async for event in adapter.stream(request)]

  assert [event.type for event in events] == [
      EventType.TEXT_DELTA,
      EventType.TEXT_DELTA,
      EventType.MESSAGE_DONE,
  ]
  assert "".join(event.content or "" for event in events) == "hello"


class FakeToolClient:
  async def post(self, url, json):
    return FakeResponse(
        {
            "events": [
                {
                    "type": "tool_call",
                    "tool_name": "lookup_weather",
                    "tool_call_id": "tool-1",
                    "tool_args": {"city": "Shanghai"},
                },
                {"type": "text_delta", "content": "Weather ready."},
                {"type": "message_done"},
            ]
        }
    )

  def stream(self, method, url, json):
    return FakeStreamResponse(
        [
            '{"type":"tool_call","tool_name":"lookup_weather","tool_call_id":"tool-1","tool_args":{"city":"Shanghai"}}',
            '{"type":"tool_result","tool_call_id":"tool-1","tool_output":{"forecast":"sunny"}}',
            '{"type":"message_done"}',
        ]
    )


@pytest.mark.asyncio
async def test_opencode_run_normalizes_tool_call_and_result():
  async def lookup_weather(city: str):
    return {"forecast": "sunny", "city": city}

  adapter = OpenCodeAdapter(
      base_url="http://localhost:8080",
      http_client=FakeToolClient(),
      tool_registry={"lookup_weather": lookup_weather},
  )
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[{"name": "lookup_weather"}],
  )

  result = await adapter.run(request)

  assert [event.type for event in result.events] == [
      EventType.TOOL_CALL,
      EventType.TOOL_RESULT,
      EventType.TEXT_DELTA,
      EventType.MESSAGE_DONE,
  ]
  assert result.events[1].tool_output == {"forecast": "sunny", "city": "Shanghai"}


@pytest.mark.asyncio
async def test_opencode_stream_normalizes_transport_error():
  class RaisingClient:
    def stream(self, method, url, json):
      raise RuntimeError("connection dropped")

  adapter = OpenCodeAdapter(base_url="http://localhost:8080", http_client=RaisingClient())
  request = RuntimeRequest(
      agent_name="demo",
      instruction="Be helpful.",
      messages=[],
      tools=[],
  )

  events = [event async for event in adapter.stream(request)]

  assert len(events) == 1
  assert events[0].type is EventType.ERROR
  assert events[0].error_code == "transport_error"
