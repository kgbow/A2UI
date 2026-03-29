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
