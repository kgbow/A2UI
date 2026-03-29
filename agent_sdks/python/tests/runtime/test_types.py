from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


def test_runtime_request_defaults():
  request = RuntimeRequest(
      agent_name="demo-agent",
      instruction="Be helpful.",
      messages=[{"role": "user", "content": "hello"}],
      tools=[],
  )

  assert request.model is None
  assert request.session_id is None
  assert request.metadata == {}


def test_normalized_event_error_factory_shape():
  event = NormalizedEvent(
      type=EventType.ERROR,
      error_code="timeout",
      error_message="request timed out",
  )

  assert event.type is EventType.ERROR
  assert event.error_code == "timeout"
  assert event.error_message == "request timed out"


def test_runtime_result_keeps_events():
  event = NormalizedEvent(type=EventType.MESSAGE_DONE)
  result = RuntimeResult(output_text="done", events=[event], stop_reason="completed")

  assert result.output_text == "done"
  assert result.events == [event]
  assert result.stop_reason == "completed"
