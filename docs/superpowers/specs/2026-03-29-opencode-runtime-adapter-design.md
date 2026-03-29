# OpenCode Runtime Adapter Design

Date: 2026-03-29
Status: Proposed

## Goal

Support both `google-adk` and `opencode serve` as agent runtimes with low integration cost.
Runtime selection should happen per agent instance, not globally and not per request.
The first version must support streaming output.

## Context

The current agent path is built around Google ADK semantics. A2UI itself is not tied to a
single model provider or agent runtime, so the runtime integration point should stay below
the A2UI parsing and rendering pipeline.

`opencode serve` exposes an HTTP interface. That makes it a separate runtime and transport
surface, not a drop-in replacement for ADK APIs. If the codebase talks to `opencode serve`
directly from business logic, backend-specific concerns such as request shaping, streaming,
tool-call mapping, retries, and error translation will leak upward.

## Decision

Introduce a thin runtime abstraction layer with one adapter per backend:

- `GoogleAdkAdapter` wraps the existing ADK execution path.
- `OpenCodeAdapter` talks to `opencode serve` over HTTP.
- `AgentRunner` selects the adapter from the agent instance configuration.

This is intentionally a narrow abstraction. It exists to normalize the execution contract,
not to create a general plugin framework.

## Chosen Scope

- Runtime selection is configured per agent instance.
- The first version supports:
  - non-streaming execution
  - streaming execution
  - serial tool calls
  - session ID passthrough
  - normalized runtime errors
- A2UI extraction, validation, and rendering remain above the runtime layer.

## Rejected Approaches

### 1. Inline backend branching in business logic

Example shape: `if backend == "adk": ... else: ...`

This is fast to start but scales poorly. Streaming, tool calls, error handling, and session
behavior would quickly spread backend-specific branches across the codebase.

### 2. Full provider framework

A large framework that abstracts models, memory, tools, transports, and runtime features is
not justified yet. It increases design and implementation cost before there is evidence that
the extra flexibility is needed.

## Architecture

```text
AgentDefinition
  -> AgentRunner
    -> RuntimeAdapter
      -> GoogleAdkAdapter | OpenCodeAdapter
    -> NormalizedEvent stream or RuntimeResult
  -> A2UI extractor / parser
  -> A2UI validation / rendering pipeline
```

### Responsibilities

#### AgentDefinition

Describes the agent instance:

- `name`
- `instruction`
- `tools`
- `model config`
- `runtime_kind`

The only new required concept is:

```text
runtime_kind = "google_adk" | "opencode"
```

#### AgentRunner

Owns adapter selection and exposes a stable call surface to the rest of the system.

#### RuntimeAdapter

Defines the smallest common contract that both backends must satisfy.

#### GoogleAdkAdapter

Wraps the current ADK-based flow and maps ADK-native outputs into normalized events.

#### OpenCodeAdapter

Calls `opencode serve`, reads HTTP streaming responses, runs the serial tool loop, and maps
all outputs into normalized events.

## Interface Design

The runtime interface should stay minimal:

```python
class RuntimeAdapter(Protocol):
    async def run(self, request: RuntimeRequest) -> RuntimeResult: ...
    async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]: ...
```

### RuntimeRequest

```python
@dataclass
class RuntimeRequest:
    agent_name: str
    instruction: str
    messages: list[Message]
    tools: list[ToolSpec]
    model: str | None = None
    session_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
```

Rules:

- `messages` use an internal message shape, not ADK-native or OpenCode-native objects.
- `tools` use internal `ToolSpec` definitions.
- `metadata` exists as an escape hatch, not a primary integration channel.

### RuntimeResult

```python
@dataclass
class RuntimeResult:
    output_text: str | None
    events: list[NormalizedEvent]
    stop_reason: str | None = None
    raw: Any | None = None
```

`raw` is allowed for debugging but must not become a business-logic dependency.

## Event Model

Streaming compatibility depends on stable semantics more than exhaustive fidelity. The
normalized event set should be intentionally small:

```python
class EventType(StrEnum):
    TEXT_DELTA = "text_delta"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    UI_MESSAGE = "ui_message"
    MESSAGE_DONE = "message_done"
    ERROR = "error"
```

```python
@dataclass
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
```

### Event Rules

- `TEXT_DELTA` is used for streamed text accumulation.
- `TOOL_CALL` and `TOOL_RESULT` must be emitted as a pair from the normalized layer, even if
  a backend does not expose that pairing natively.
- `UI_MESSAGE` is separate from text so A2UI processing can remain structured.
- `MESSAGE_DONE` marks normal completion explicitly.
- `ERROR` is an event, not only an exception path.

Expected event ordering:

```text
TEXT_DELTA*
TOOL_CALL?
TOOL_RESULT?
TEXT_DELTA*
UI_MESSAGE*
MESSAGE_DONE | ERROR
```

Not every event type must appear in every run, but ordering must stay stable.

## A2UI Boundary

A2UI remains outside the runtime adapters.

The correct layering is:

```text
RuntimeAdapter
  -> NormalizedEvent stream
  -> A2UI extractor / parser
  -> UI_MESSAGE
```

This prevents backend adapters from learning A2UI protocol details and keeps future runtime
expansion isolated from UI protocol concerns.

## Streaming Strategy

The adapter streaming contract is limited to:

- converting backend-native stream frames into normalized events
- preserving deterministic ordering and completion semantics

The goal is predictable behavior, not maximum backend feature exposure.

## Tool Call Strategy

Tooling is normalized around internal `ToolSpec` definitions.

### When the backend supports native tools

The adapter maps internal tool definitions into the backend's native tool format and converts
native tool events back into `TOOL_CALL` and `TOOL_RESULT`.

### When the backend does not support native tools cleanly

The adapter may implement a controlled text-to-tool protocol, where the model emits a
structured tool request that the adapter intercepts, executes, and feeds back into the model.

### First-Version Constraint

Only serial tool calls are supported:

```text
model output -> optional tool call -> execute tool -> append tool result -> continue model
```

The first version does not support parallel or nested tool execution trees.

## Session Strategy

Session identity belongs in `RuntimeRequest.session_id`, but session semantics remain
backend-local.

Rules:

- Session IDs are passed through when possible.
- The system does not guarantee cross-runtime native session compatibility.
- Switching an agent instance from one runtime to another should be treated as a new backend
  session unless context is restored by replaying prior messages.

This keeps session handling tractable and avoids expensive attempts to unify incompatible
memory models.

## Error Handling

Adapters should normalize errors into a limited set:

- `transport_error`
- `timeout`
- `protocol_error`
- `tool_execution_error`
- `model_error`

Backend-native payloads may be preserved in `raw`, but upstream logic should branch on the
normalized error code only.

## Proposed File Layout

```text
agent_sdks/python/src/a2ui/runtime/
  types.py
  runner.py
  adapters/
    base.py
    google_adk.py
    opencode.py
```

## Migration Plan

### Phase 1: Introduce runtime types and base adapter

- Add `RuntimeRequest`, `RuntimeResult`, `NormalizedEvent`, and `RuntimeAdapter`.
- No behavioral changes yet.

### Phase 2: Wrap the existing ADK path

- Move current ADK execution behind `GoogleAdkAdapter`.
- Keep ADK as the default runtime.

### Phase 3: Add runner-based runtime selection

- Route execution through `AgentRunner`.
- Read `runtime_kind` from the agent instance definition.

### Phase 4: Add OpenCode execution

- Implement `OpenCodeAdapter.run()`.
- Implement `OpenCodeAdapter.stream()` with normalized text and completion events.

### Phase 5: Add serial tool loop to OpenCode

- Support internal tool definitions.
- Emit normalized `TOOL_CALL` and `TOOL_RESULT`.

## Non-Goals

The first version explicitly does not attempt to:

- unify all backend-specific advanced features
- support parallel tool calls
- guarantee native session continuity across runtimes
- expose OpenCode-specific HTTP structures to business logic
- introduce a large provider or plugin framework

## Testing Strategy

Testing should focus on contract behavior, not backend internals.

- Unit-test event normalization for both adapters.
- Unit-test stream ordering guarantees.
- Unit-test serial tool loop behavior.
- Unit-test error normalization.
- Add at least one integration test per runtime path through `AgentRunner`.

The highest-value tests assert that downstream code sees the same normalized behavior from
both backends for equivalent scenarios.

## Risks

### 1. OpenCode stream semantics may not align neatly with ADK

Mitigation: keep the normalized event model narrow and adapt backend-specific quirks inside
the adapter.

### 2. Tool-call semantics may differ materially between runtimes

Mitigation: support a serial fallback loop and avoid overcommitting to native parity.

### 3. Metadata escape hatch may become a dumping ground

Mitigation: keep `metadata` optional and require justification before adding stable behavior
through it.

## Recommendation

Proceed with a thin runtime abstraction, keep ADK as the baseline implementation, and add an
OpenCode HTTP adapter that supports streaming and serial tools. This gives the project
practical multi-runtime support without forcing a broad rewrite or premature framework design.
