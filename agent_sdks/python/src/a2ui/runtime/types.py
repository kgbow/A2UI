from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

Message = dict[str, Any]
ToolSpec = dict[str, Any]


class EventType(StrEnum):
  TEXT_DELTA = "text_delta"
  TOOL_CALL = "tool_call"
  TOOL_RESULT = "tool_result"
  UI_MESSAGE = "ui_message"
  MESSAGE_DONE = "message_done"
  ERROR = "error"


@dataclass(slots=True)
class RuntimeRequest:
  agent_name: str
  instruction: str
  messages: list[Message]
  tools: list[ToolSpec]
  model: str | None = None
  session_id: str | None = None
  metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class NormalizedEvent:
  type: EventType
  index: int | None = None
  content: str | None = None
  tool_name: str | None = None
  tool_call_id: str | None = None
  tool_args: dict[str, Any] | None = None
  tool_output: Any | None = None
  ui_payload: dict[str, Any] | list[dict[str, Any]] | None = None
  error_code: str | None = None
  error_message: str | None = None
  raw: Any | None = None


@dataclass(slots=True)
class RuntimeResult:
  output_text: str | None
  events: list[NormalizedEvent]
  stop_reason: str | None = None
  raw: Any | None = None
