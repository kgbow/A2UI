# Opencode Vue Chat Panel Streaming Design

## Goal

Extend `demo/opencode-vue-chat-panel` from request-response panel rendering to incremental streaming updates so the current assistant message can update its panel progressively while the agent is still producing output.

The design keeps the existing adapter boundary and introduces a streaming event model instead of letting the frontend consume raw Opencode output directly.

## Non-Goals

- Full A2UI patch semantics
- Multiple concurrent interactive streaming panels
- Generic runtime support for arbitrary component tree mutations
- Replacing the existing non-streaming endpoints
- Product-grade conflict resolution between server updates and in-progress user edits

## Existing Baseline

The current demo works like this:

1. Vue sends a request to the adapter.
2. Adapter sends one Opencode message.
3. Adapter waits for the full response.
4. Adapter parses structured text.
5. Adapter returns one normalized assistant message with an optional A2UI snapshot.
6. Frontend renders the final panel snapshot.

This gives a stable static panel, but not progressive UI updates.

## Streaming Architecture

The streaming version keeps the same top-level boundaries:

```text
Vue Web -> Adapter -> Opencode
         <- Adapter <-
```

But the transport shape changes:

- Agent output becomes a JSONL event stream
- Adapter converts JSONL into validated streaming events
- Adapter forwards those events to the browser as SSE
- Frontend applies events incrementally to the current panel state

Recommended data flow:

```text
Opencode text stream -> JSONL events -> Adapter validation -> SSE -> Vue store -> A2UI surface applyEvent()
```

## Why JSONL + SSE

### JSONL for agent output

Each event is emitted as one complete JSON object on its own line. This avoids partial-JSON parsing problems and lets the adapter process events incrementally.

### SSE for browser delivery

The browser only needs server-to-client streaming for this phase. SSE is simpler than WebSocket and aligns well with progressive UI delivery from the adapter.

The browser should not connect to Opencode directly.

## Incremental Event Model

The first phase uses a deliberately small event vocabulary.

### Event Types

```ts
type PanelStreamEvent =
  | CreateSurfaceEvent
  | SetComponentsEvent
  | SetDataEvent
  | SetStatusEvent
  | DoneEvent
  | ErrorEvent
```

```ts
interface CreateSurfaceEvent {
  type: "create_surface"
  surfaceId: string
  catalogId: string
}

interface SetComponentsEvent {
  type: "set_components"
  surfaceId: string
  components: A2uiComponentNode[]
}

interface SetDataEvent {
  type: "set_data"
  surfaceId: string
  path: string
  value: unknown
}

interface SetStatusEvent {
  type: "set_status"
  surfaceId: string
  status: "streaming" | "done"
  message?: string
}

interface DoneEvent {
  type: "done"
  surfaceId: string
}

interface ErrorEvent {
  type: "error"
  surfaceId: string
  message: string
}
```

## Phase 1 Constraints

To keep the implementation stable, the first phase enforces these rules:

- Only one surface per streamed assistant message
- `create_surface` appears at most once
- `set_components` appears at most once
- After `set_components`, only `set_data`, `set_status`, `done`, and `error` are expected
- The component tree is initialized once and then treated as fixed
- Progressive updates happen in the data model only
- Historical panels remain visible but read-only
- The current panel becomes read-only immediately after submit

This provides a useful streaming UX without introducing generalized tree patching yet.

## Example JSONL Stream

```jsonl
{"type":"create_surface","surfaceId":"booking-panel","catalogId":"basic"}
{"type":"set_components","surfaceId":"booking-panel","components":[{"id":"root","component":"Column","children":["title","status","partySize","reservationTime","submit"]},{"id":"title","component":"Text","text":"餐厅预订"},{"id":"status","component":"Text","text":{"path":"/status"}},{"id":"partySize","component":"TextField","label":"人数","value":{"path":"/partySize"}},{"id":"reservationTime","component":"TextField","label":"时间","value":{"path":"/reservationTime"}},{"id":"submit","component":"Button","child":"submit-text","action":{"event":{"name":"submit_booking"}}},{"id":"submit-text","component":"Text","text":"提交"}]}
{"type":"set_data","surfaceId":"booking-panel","path":"/status","value":"正在理解需求"}
{"type":"set_data","surfaceId":"booking-panel","path":"/status","value":"正在搜索餐厅"}
{"type":"set_data","surfaceId":"booking-panel","path":"/partySize","value":"4"}
{"type":"set_data","surfaceId":"booking-panel","path":"/reservationTime","value":"今晚 7 点"}
{"type":"done","surfaceId":"booking-panel"}
```

## Agent Prompting Strategy

The agent must be explicitly instructed to emit JSONL rather than a final JSON object.

Required prompt constraints:

- Output JSONL only
- Each line must be one complete JSON object
- No markdown
- No explanatory text
- No partial JSON fragments
- Only allowed event types may be emitted
- If a panel is needed, emit `create_surface` first
- Emit `set_components` exactly once
- Stream incremental `set_data` events after initialization
- Finish with `done`

Strongly recommended extra rule for phase 1:

- Use a fixed component tree and stream only data updates after initialization

## Shared Package Changes

Add streaming types and schemas to `packages/shared`.

### New files

- `packages/shared/src/types/stream.ts`
- `packages/shared/src/schemas/stream.ts`

### Responsibilities

- `types/stream.ts`: defines the streaming event contracts
- `schemas/stream.ts`: validates JSONL lines before they enter adapter or frontend state

The shared package remains the stable contract boundary for:

- frontend <-> adapter API
- adapter internal stream validation
- frontend panel update semantics

## Adapter Changes

The adapter should keep existing request-response routes and add streaming routes in parallel.

### New routes

- `POST /api/chat-stream`
- `POST /api/panel-action-stream`

These routes should return `text/event-stream`.

### New adapter services

- `services/stream-parser.ts`
  - receives streamed text
  - buffers chunks
  - splits JSONL lines
  - parses and validates each line
- `services/sse.ts`
  - writes validated events to the browser in SSE format

### Adapter responsibilities in streaming mode

1. Start a streamed Opencode request
2. Read incremental output chunks
3. Reassemble JSONL lines
4. Parse and validate each event
5. Emit validated SSE messages to the browser
6. Emit `done` or `error`

### SSE shape

Recommended SSE event format:

```text
event: panel_event
data: {"type":"set_data","surfaceId":"booking-panel","path":"/status","value":"正在搜索"}

event: panel_event
data: {"type":"done","surfaceId":"booking-panel"}
```

## Frontend Changes

The frontend needs to move from snapshot initialization to event application.

### Chat store changes

The store should support:

- inserting a placeholder assistant message for a new stream
- applying panel events to an existing assistant message
- marking previous interactive panels read-only
- marking the current message as `streaming`, `done`, or `error`

Recommended additional state:

```ts
interface StreamingAssistantState {
  messageId: string
  surfaceId?: string
  streamStatus: "streaming" | "done" | "error"
}
```

### Demo message shape

The normalized assistant message should keep its existing shape but support streaming lifecycle fields:

```ts
interface DemoMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  createdAt: number
  displayText?: string
  raw?: {
    info?: unknown
    parts?: unknown[]
  }
  panel?: DemoPanel
  panelMode?: "interactive" | "readonly"
  streamStatus?: "idle" | "streaming" | "done" | "error"
}
```

### Demo panel shape

For streaming, the frontend should store the current surface snapshot, not only an immutable message array.

```ts
interface DemoPanel {
  source: "a2ui"
  surface: {
    surfaceId: string
    catalogId: string
    components: Record<string, A2uiComponentNode>
    dataModel: Record<string, unknown>
    formDraft: Record<string, unknown>
    status: "idle" | "streaming" | "done" | "error"
  }
}
```

## A2UI Surface State Changes

`useA2uiSurface.ts` should evolve from snapshot-only initialization to an event-driven surface state manager.

Current pattern:

- initialize once from `A2uiServerMessage[]`

Target pattern:

- create an empty surface state
- apply events incrementally with `applyEvent(event)`

Recommended surface API:

```ts
const surface = createA2uiSurfaceState()
surface.applyEvent(event)
```

### Phase 1 event handling

- `create_surface`: initialize `surfaceId`, `catalogId`, `status`
- `set_components`: replace component map
- `set_data`: update one data-model path
- `set_status`: update surface status and optional status text
- `done`: mark surface complete
- `error`: mark surface failed and preserve error text

## Transport Choice in the Browser

Use streamed `fetch()` first instead of native `EventSource`.

Reason:

- request body is easier to send
- chat submission and panel submission already use `POST`
- no extra stream bootstrap route is required

The browser should:

1. `POST` to the streaming route
2. read `response.body`
3. decode SSE frames
4. parse `data:` payload
5. apply validated events to the current assistant message

## Historical Panels

Streaming does not change the historical panel policy.

Rules remain:

- old panels are still rendered
- old panels are read-only
- only the latest panel may be interactive
- when the user submits the current panel, it becomes read-only immediately before the next stream proceeds

## Future Phases

### Phase 2

Add limited component-tree mutation:

- `upsert_components`
- `append_child`
- `replace_children`

### Phase 3

Add more complete patch semantics:

- node removal
- rollback handling
- user-edit conflict policies
- generalized streaming layouts

These phases should only happen after phase 1 is stable.

## Complexity Assessment

### Phase 1 complexity

Medium.

Main work:

- streaming parser in adapter
- SSE forwarding
- frontend store support for streaming assistant messages
- event-driven `applyEvent()` surface logic

### Phase 2+ complexity

Medium-high to high.

The complexity increase comes from:

- event ordering
- node existence dependencies
- tree mutation semantics
- intermediate invalid UI states
- conflicts between streaming updates and user edits

## Recommendation

Implement streaming in a narrow first phase:

- JSONL from the agent
- validated event stream in the adapter
- SSE to the frontend
- fixed component tree
- incremental `set_data` only

This gives strong UX value with manageable implementation cost and preserves the adapter as the clean protocol boundary.
