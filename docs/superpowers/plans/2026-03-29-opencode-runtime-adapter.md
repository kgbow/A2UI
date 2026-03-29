# OpenCode Runtime Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a thin runtime abstraction to the Python agent SDK so an agent instance can run through either Google ADK or `opencode serve`, with streaming support and serial tool calls.

**Architecture:** Introduce a small `a2ui.runtime` package that defines normalized request and event types, a base adapter protocol, and an `AgentRunner`. Wrap the existing ADK path in a Google adapter first, then add an HTTP-based OpenCode adapter that emits the same normalized events. Keep A2UI parsing above the runtime layer so backend differences stay isolated inside adapters.

**Tech Stack:** Python 3.10+, pytest, pytest-asyncio, google-adk, httpx

---

## File Map

- Create: `agent_sdks/python/src/a2ui/runtime/__init__.py`
- Create: `agent_sdks/python/src/a2ui/runtime/types.py`
- Create: `agent_sdks/python/src/a2ui/runtime/runner.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/__init__.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/base.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/google_adk.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/opencode.py`
- Create: `agent_sdks/python/tests/runtime/test_types.py`
- Create: `agent_sdks/python/tests/runtime/test_runner.py`
- Create: `agent_sdks/python/tests/runtime/adapters/test_google_adk.py`
- Create: `agent_sdks/python/tests/runtime/adapters/test_opencode.py`
- Modify: `agent_sdks/python/src/a2ui/__init__.py`
- Modify: `agent_sdks/python/pyproject.toml`

## Task 1: Add runtime package skeleton and normalized types

**Files:**
- Create: `agent_sdks/python/src/a2ui/runtime/__init__.py`
- Create: `agent_sdks/python/src/a2ui/runtime/types.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/__init__.py`
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/base.py`
- Create: `agent_sdks/python/tests/runtime/test_types.py`
- Modify: `agent_sdks/python/src/a2ui/__init__.py`

- [ ] **Step 1: Write the failing type tests**

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest agent_sdks/python/tests/runtime/test_types.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'a2ui.runtime'`

- [ ] **Step 3: Add the runtime package files**

`agent_sdks/python/src/a2ui/runtime/types.py`

```python
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
```

`agent_sdks/python/src/a2ui/runtime/adapters/base.py`

```python
from collections.abc import AsyncIterator
from typing import Protocol

from a2ui.runtime.types import NormalizedEvent, RuntimeRequest, RuntimeResult


class RuntimeAdapter(Protocol):
  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    ...

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    ...
```

`agent_sdks/python/src/a2ui/runtime/__init__.py`

```python
from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult

__all__ = [
    "EventType",
    "NormalizedEvent",
    "RuntimeRequest",
    "RuntimeResult",
]
```

`agent_sdks/python/src/a2ui/runtime/adapters/__init__.py`

```python
from a2ui.runtime.adapters.base import RuntimeAdapter

__all__ = ["RuntimeAdapter"]
```

`agent_sdks/python/src/a2ui/__init__.py`

```python
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from a2ui.runtime import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult

__all__ = [
    "EventType",
    "NormalizedEvent",
    "RuntimeRequest",
    "RuntimeResult",
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest agent_sdks/python/tests/runtime/test_types.py -v`
Expected: PASS for all three tests

- [ ] **Step 5: Commit**

```bash
git add agent_sdks/python/src/a2ui/__init__.py agent_sdks/python/src/a2ui/runtime/__init__.py agent_sdks/python/src/a2ui/runtime/types.py agent_sdks/python/src/a2ui/runtime/adapters/__init__.py agent_sdks/python/src/a2ui/runtime/adapters/base.py agent_sdks/python/tests/runtime/test_types.py
git commit -m "feat: add runtime request and event types"
```

## Task 2: Add AgentRunner and adapter selection

**Files:**
- Create: `agent_sdks/python/src/a2ui/runtime/runner.py`
- Create: `agent_sdks/python/tests/runtime/test_runner.py`

- [ ] **Step 1: Write the failing runner tests**

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest agent_sdks/python/tests/runtime/test_runner.py -v`
Expected: FAIL with `ModuleNotFoundError` for `a2ui.runtime.runner`

- [ ] **Step 3: Implement AgentRunner**

`agent_sdks/python/src/a2ui/runtime/runner.py`

```python
from collections.abc import AsyncIterator

from a2ui.runtime.adapters.base import RuntimeAdapter
from a2ui.runtime.types import NormalizedEvent, RuntimeRequest, RuntimeResult


class AgentRunner:
  def __init__(self, adapters: dict[str, RuntimeAdapter], default_runtime: str = "google_adk"):
    self._adapters = adapters
    self._default_runtime = default_runtime

  def _select_runtime(self, request: RuntimeRequest) -> RuntimeAdapter:
    runtime_kind = request.metadata.get("runtime_kind", self._default_runtime)
    if runtime_kind not in self._adapters:
      raise ValueError(f"Unsupported runtime_kind: {runtime_kind}")
    return self._adapters[runtime_kind]

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    adapter = self._select_runtime(request)
    return await adapter.run(request)

  async def stream(
      self, request: RuntimeRequest
  ) -> AsyncIterator[NormalizedEvent]:
    adapter = self._select_runtime(request)
    async for event in adapter.stream(request):
      yield event
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest agent_sdks/python/tests/runtime/test_runner.py -v`
Expected: PASS for both runner tests

- [ ] **Step 5: Commit**

```bash
git add agent_sdks/python/src/a2ui/runtime/runner.py agent_sdks/python/tests/runtime/test_runner.py
git commit -m "feat: add runtime runner selection"
```

## Task 3: Wrap the current ADK path in a Google adapter

**Files:**
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/google_adk.py`
- Create: `agent_sdks/python/tests/runtime/adapters/test_google_adk.py`

- [ ] **Step 1: Write the failing Google adapter tests**

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_google_adk.py -v`
Expected: FAIL with `ModuleNotFoundError` for `a2ui.runtime.adapters.google_adk`

- [ ] **Step 3: Implement the Google ADK adapter**

`agent_sdks/python/src/a2ui/runtime/adapters/google_adk.py`

```python
from collections.abc import AsyncIterator

from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class GoogleAdkAdapter:
  def __init__(self, executor):
    self._executor = executor

  def _normalize_event(self, raw_event) -> NormalizedEvent:
    if getattr(raw_event, "text", None):
      return NormalizedEvent(
          type=EventType.TEXT_DELTA,
          content=raw_event.text,
          raw=raw_event,
      )
    if getattr(raw_event, "done", False):
      return NormalizedEvent(type=EventType.MESSAGE_DONE, raw=raw_event)
    return NormalizedEvent(
        type=EventType.ERROR,
        error_code="protocol_error",
        error_message="Unsupported ADK event shape",
        raw=raw_event,
    )

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    raw_events = await self._executor.run(request)
    events = [self._normalize_event(raw_event) for raw_event in raw_events]
    output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
    return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed")

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    async for raw_event in self._executor.stream(request):
      yield self._normalize_event(raw_event)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_google_adk.py -v`
Expected: PASS for both Google adapter tests

- [ ] **Step 5: Commit**

```bash
git add agent_sdks/python/src/a2ui/runtime/adapters/google_adk.py agent_sdks/python/tests/runtime/adapters/test_google_adk.py
git commit -m "feat: add google adk runtime adapter"
```

## Task 4: Add OpenCode HTTP adapter with non-streaming and streaming text

**Files:**
- Create: `agent_sdks/python/src/a2ui/runtime/adapters/opencode.py`
- Create: `agent_sdks/python/tests/runtime/adapters/test_opencode.py`
- Modify: `agent_sdks/python/pyproject.toml`

- [ ] **Step 1: Write the failing OpenCode adapter tests**

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_opencode.py -v`
Expected: FAIL with `ModuleNotFoundError` for `a2ui.runtime.adapters.opencode`

- [ ] **Step 3: Add `httpx` to the SDK dependencies**

`agent_sdks/python/pyproject.toml`

```toml
[project]
dependencies = [
  "a2a-sdk>=0.3.0",
  "google-adk>=1.28.0",
  "google-genai>=1.27.0",
  "jsonschema>=4.0.0",
  "httpx>=0.28.0",
]
```

- [ ] **Step 4: Implement the OpenCode adapter**

`agent_sdks/python/src/a2ui/runtime/adapters/opencode.py`

```python
import json
from collections.abc import AsyncIterator

import httpx

from a2ui.runtime.types import EventType, NormalizedEvent, RuntimeRequest, RuntimeResult


class OpenCodeAdapter:
  def __init__(self, base_url: str, http_client: httpx.AsyncClient | None = None):
    self._base_url = base_url.rstrip("/")
    self._http_client = http_client or httpx.AsyncClient(timeout=30.0)

  def _build_payload(self, request: RuntimeRequest) -> dict:
    return {
        "agent_name": request.agent_name,
        "instruction": request.instruction,
        "messages": request.messages,
        "tools": request.tools,
        "model": request.model,
        "session_id": request.session_id,
        "metadata": request.metadata,
    }

  def _normalize_event(self, raw_event: dict) -> NormalizedEvent:
    event_type = raw_event["type"]
    if event_type == "text_delta":
      return NormalizedEvent(
          type=EventType.TEXT_DELTA,
          content=raw_event.get("content"),
          raw=raw_event,
      )
    if event_type == "message_done":
      return NormalizedEvent(type=EventType.MESSAGE_DONE, raw=raw_event)
    return NormalizedEvent(
        type=EventType.ERROR,
        error_code="protocol_error",
        error_message=f"Unsupported OpenCode event type: {event_type}",
        raw=raw_event,
    )

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    response = await self._http_client.post(
        f"{self._base_url}/run",
        json=self._build_payload(request),
    )
    response.raise_for_status()
    data = response.json()
    events = [self._normalize_event(raw_event) for raw_event in data["events"]]
    output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
    return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed", raw=data)

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    async with self._http_client.stream(
        "POST",
        f"{self._base_url}/stream",
        json=self._build_payload(request),
    ) as response:
      response.raise_for_status()
      async for line in response.aiter_lines():
        if not line:
          continue
        yield self._normalize_event(json.loads(line))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_opencode.py -v`
Expected: PASS for both OpenCode adapter tests

- [ ] **Step 6: Commit**

```bash
git add agent_sdks/python/pyproject.toml agent_sdks/python/src/a2ui/runtime/adapters/opencode.py agent_sdks/python/tests/runtime/adapters/test_opencode.py
git commit -m "feat: add opencode runtime adapter"
```

## Task 5: Add serial tool-call and error normalization to OpenCode

**Files:**
- Modify: `agent_sdks/python/src/a2ui/runtime/adapters/opencode.py`
- Modify: `agent_sdks/python/tests/runtime/adapters/test_opencode.py`

- [ ] **Step 1: Add failing tests for tool calls and transport errors**

```python
import pytest

from a2ui.runtime.types import EventType, RuntimeRequest


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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_opencode.py -v`
Expected: FAIL because `tool_call` and `tool_result` are not yet normalized

- [ ] **Step 3: Extend the OpenCode adapter with tool execution and error mapping**

`agent_sdks/python/src/a2ui/runtime/adapters/opencode.py`

```python
class OpenCodeAdapter:
  def __init__(
      self,
      base_url: str,
      http_client: httpx.AsyncClient | None = None,
      tool_registry: dict[str, callable] | None = None,
  ):
    self._base_url = base_url.rstrip("/")
    self._http_client = http_client or httpx.AsyncClient(timeout=30.0)
    self._tool_registry = tool_registry or {}

  async def _execute_tool(self, raw_event: dict) -> NormalizedEvent:
    tool_name = raw_event["tool_name"]
    tool_call_id = raw_event["tool_call_id"]
    tool_args = raw_event.get("tool_args", {})

    if tool_name not in self._tool_registry:
      return NormalizedEvent(
          type=EventType.ERROR,
          error_code="tool_execution_error",
          error_message=f"Unknown tool: {tool_name}",
          raw=raw_event,
      )

    tool_output = await self._tool_registry[tool_name](**tool_args)
    return NormalizedEvent(
        type=EventType.TOOL_RESULT,
        tool_name=tool_name,
        tool_call_id=tool_call_id,
        tool_args=tool_args,
        tool_output=tool_output,
        raw=raw_event,
    )

  async def _normalize_runtime_events(self, raw_events: list[dict]) -> list[NormalizedEvent]:
    normalized: list[NormalizedEvent] = []
    for raw_event in raw_events:
      event_type = raw_event["type"]
      if event_type == "tool_call":
        normalized.append(
            NormalizedEvent(
                type=EventType.TOOL_CALL,
                tool_name=raw_event["tool_name"],
                tool_call_id=raw_event["tool_call_id"],
                tool_args=raw_event.get("tool_args", {}),
                raw=raw_event,
            )
        )
        normalized.append(await self._execute_tool(raw_event))
        continue
      normalized.append(self._normalize_event(raw_event))
    return normalized

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    try:
      response = await self._http_client.post(
          f"{self._base_url}/run",
          json=self._build_payload(request),
      )
      response.raise_for_status()
      data = response.json()
      events = await self._normalize_runtime_events(data["events"])
      output_text = "".join(event.content or "" for event in events if event.type is EventType.TEXT_DELTA)
      return RuntimeResult(output_text=output_text or None, events=events, stop_reason="completed", raw=data)
    except Exception as exc:
      return RuntimeResult(
          output_text=None,
          events=[
              NormalizedEvent(
                  type=EventType.ERROR,
                  error_code="transport_error",
                  error_message=str(exc),
                  raw=exc,
              )
          ],
          stop_reason="error",
          raw=exc,
      )

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    try:
      async with self._http_client.stream(
          "POST",
          f"{self._base_url}/stream",
          json=self._build_payload(request),
      ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
          if not line:
            continue
          raw_event = json.loads(line)
          if raw_event["type"] == "tool_call":
            yield NormalizedEvent(
                type=EventType.TOOL_CALL,
                tool_name=raw_event["tool_name"],
                tool_call_id=raw_event["tool_call_id"],
                tool_args=raw_event.get("tool_args", {}),
                raw=raw_event,
            )
            yield await self._execute_tool(raw_event)
            continue
          yield self._normalize_event(raw_event)
    except Exception as exc:
      yield NormalizedEvent(
          type=EventType.ERROR,
          error_code="transport_error",
          error_message=str(exc),
          raw=exc,
      )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest agent_sdks/python/tests/runtime/adapters/test_opencode.py -v`
Expected: PASS for text, tool-call, and transport-error tests

- [ ] **Step 5: Commit**

```bash
git add agent_sdks/python/src/a2ui/runtime/adapters/opencode.py agent_sdks/python/tests/runtime/adapters/test_opencode.py
git commit -m "feat: add opencode tool loop and error normalization"
```

## Task 6: Verify the runner works end-to-end across both runtimes

**Files:**
- Modify: `agent_sdks/python/tests/runtime/test_runner.py`

- [ ] **Step 1: Add an end-to-end runner integration test**

```python
import pytest

from a2ui.runtime.adapters.google_adk import GoogleAdkAdapter
from a2ui.runtime.adapters.opencode import OpenCodeAdapter
from a2ui.runtime.runner import AgentRunner
from a2ui.runtime.types import EventType, RuntimeRequest


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
```

- [ ] **Step 2: Run the focused runner test suite**

Run: `uv run pytest agent_sdks/python/tests/runtime/test_runner.py -v`
Expected: PASS for all runner tests, including the cross-runtime integration case

- [ ] **Step 3: Run the full runtime test suite**

Run: `uv run pytest agent_sdks/python/tests/runtime -v`
Expected: PASS for all runtime tests

- [ ] **Step 4: Run the existing Python SDK tests to catch regressions**

Run: `uv run pytest agent_sdks/python/tests -v`
Expected: PASS for existing parser, schema, A2A, ADK extension, and new runtime tests

- [ ] **Step 5: Commit**

```bash
git add agent_sdks/python/tests/runtime/test_runner.py
git commit -m "test: verify runtime adapters through agent runner"
```

## Self-Review

### Spec coverage

- Runtime abstraction layer: covered in Tasks 1 and 2.
- Google ADK adapter: covered in Task 3.
- OpenCode HTTP adapter: covered in Task 4.
- Streaming support: covered in Tasks 3, 4, and 6.
- Serial tool calls: covered in Task 5.
- Session ID passthrough: included in `RuntimeRequest` in Task 1 and request payload building in Task 4.
- Normalized errors: covered in Task 5.
- A2UI staying above runtime: preserved by limiting plan scope to runtime files only.

### Placeholder scan

- No `TODO`, `TBD`, or deferred “implement later” language remains in the task steps.
- Each code-changing step includes concrete code blocks.
- Each test step includes exact commands and expected outcomes.

### Type consistency

- `RuntimeRequest`, `NormalizedEvent`, `RuntimeResult`, and `EventType` are introduced once in Task 1 and reused consistently later.
- `runtime_kind` is consistently carried through `request.metadata`.
- `GoogleAdkAdapter`, `OpenCodeAdapter`, and `AgentRunner` names match across tasks and tests.
