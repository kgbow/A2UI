from google.genai import types

from agent import _extract_final_response_text


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
