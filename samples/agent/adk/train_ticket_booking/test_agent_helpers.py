from google.genai import types

from agent import (
    _extract_final_response_text,
    _get_mock_step_for_query,
    _load_mock_messages,
)


def test_extract_final_response_text_prefers_tagged_non_thought_part():
  parts = [
      types.Part(text="internal reasoning", thought=True),
      types.Part(
          text=(
              "<a2ui-json>[{\"beginRendering\":{\"surfaceId\":\"train-booking-wizard\"}}]"
              "</a2ui-json>"
          )
      ),
  ]

  result = _extract_final_response_text(parts)

  assert result.startswith("<a2ui-json>")
  assert "internal reasoning" not in result


def test_extract_final_response_text_falls_back_to_non_thought_text():
  parts = [
      types.Part(text="internal reasoning", thought=True),
      types.Part(text="plain text fallback"),
  ]

  result = _extract_final_response_text(parts)

  assert result == "plain text fallback"


def test_get_mock_step_for_query_maps_flow_steps():
  assert _get_mock_step_for_query("Book me a train from Shanghai to Beijing") == 1
  assert (
      _get_mock_step_for_query(
          "SEARCH_TRAINS: from=Shanghai to=Beijing date=2026-03-30"
      )
      == 2
  )
  assert _get_mock_step_for_query("SELECT_TRAIN_SEAT: trainId=G101") == 3
  assert _get_mock_step_for_query("CONTINUE_TO_REVIEW: trainId=G101") == 4
  assert _get_mock_step_for_query("CONFIRM_BOOKING: trainId=G101") == 5


def test_load_mock_messages_reads_recorded_json():
  messages = _load_mock_messages(2)

  assert len(messages) >= 2
  assert "beginRendering" in messages[0]
  assert messages[0]["beginRendering"]["surfaceId"] == "train-booking-wizard"
