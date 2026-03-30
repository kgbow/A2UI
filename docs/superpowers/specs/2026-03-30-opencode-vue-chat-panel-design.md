# Opencode Vue Chat Panel Demo Design

## Goal

Build an independent full-stack TypeScript demo under the repository root that shows how to embed an interactive A2UI-driven panel inside a chat conversation backed by a real Opencode agent over HTTP.

The demo should validate three things:

1. A real Opencode chat session can drive dynamic UI generation.
2. A Vue client can render a controlled A2UI v0.9-compatible subset with custom components.
3. Historical panels can remain visible while only the latest panel stays interactive.

## Scope

### In Scope

- A new standalone demo project under `demo/opencode-vue-chat-panel`
- A Vue web app for chat UI and panel rendering
- A TypeScript adapter service between the web app and Opencode
- Shared TypeScript types and runtime schemas
- Real Opencode integration via `POST /session/:id/message`
- A minimal A2UI v0.9-compatible subset
- One active interactive panel at a time
- Historical panels rendered in read-only mode

### Out of Scope

- Modifying existing official Lit samples
- Full A2UI v0.9 support
- Multiple simultaneous interactive panels
- Incremental A2UI patch application
- Complex expressions, functions, or dynamic catalog loading
- Rich support for every Opencode part type beyond display preservation

## Project Layout

The demo will live in a dedicated root-level directory:

`demo/opencode-vue-chat-panel`

Recommended structure:

```text
demo/opencode-vue-chat-panel/
  package.json
  tsconfig.base.json
  apps/
    web/
    adapter/
  packages/
    shared/
```

### apps/web

Vue app responsible for:

- chat message list
- input composer
- assistant message rendering
- A2UI panel rendering
- historical panel read-only behavior

### apps/adapter

TypeScript service responsible for:

- calling the real Opencode HTTP API
- injecting system prompts
- translating chat input and panel actions into Opencode messages
- extracting text output from Opencode parts
- parsing structured agent output
- building a constrained A2UI payload

### packages/shared

Shared TypeScript source for:

- adapter API contracts
- A2UI subset types
- structured agent response types
- `zod` schemas

## Architecture

The system uses an adapter-driven design.

```text
Vue Chat Demo -> TS Adapter -> Opencode Session API
                <- TS Adapter <-
```

The adapter is the protocol boundary. The Vue app never calls Opencode directly and never interprets raw Opencode output as renderable UI.

The adapter has two translation responsibilities:

1. Translate frontend requests into Opencode `TextPart` messages.
2. Translate Opencode text output into a controlled A2UI subset.

## Message Lifecycle

### Standard Chat Turn

1. User submits chat input in the Vue app.
2. Web app calls `POST /api/chat` on the adapter.
3. Adapter constructs an Opencode message for the current session.
4. Opencode returns `{ info, parts }`.
5. Adapter preserves the full raw response.
6. Adapter extracts all `type: "text"` parts and concatenates them.
7. Adapter attempts to parse the concatenated text into a structured agent response.
8. If parsing succeeds and `uiIntent` exists, adapter builds an A2UI payload.
9. Adapter returns a normalized assistant message to the frontend.
10. Frontend renders the assistant message, showing a concise text region and the generated panel.

### Panel Action Turn

1. User fills form inputs locally in the current interactive panel.
2. User clicks the panel button.
3. Web app marks the current panel read-only.
4. Web app calls `POST /api/panel-action` on the adapter with `actionName` and `formData`.
5. Adapter translates that request into an Opencode `TextPart`.
6. Opencode returns the next assistant result.
7. Adapter normalizes the response in the same way as a standard chat turn.
8. Frontend appends the new assistant message and makes only the newest panel interactive.

## Frontend Design

The demo is a single-page chat interface.

### Page Regions

- Header: session metadata and connection state
- Message list: user and assistant messages
- Composer: plain text user input

### Assistant Message Rendering

Each assistant message card contains:

- preserved raw Opencode parts for visibility
- a concise display text region
- an optional A2UI panel region

When a panel exists, it becomes the primary content region for that assistant message.

### Panel Interactivity Rules

- Only the newest assistant message with a panel is interactive.
- All previous panels remain visible.
- Previous panels render with disabled inputs and disabled or hidden buttons.
- When a panel action is submitted, that panel immediately becomes read-only before the next message arrives.

## Frontend Components

Suggested module structure:

```text
apps/web/src/
  modules/chat/
    components/
      ChatPage.vue
      MessageList.vue
      AssistantMessageCard.vue
      ChatMessageA2uiPanel.vue
      Composer.vue
      OpencodePartsView.vue
  modules/a2ui/
    components/
      A2uiRenderer.vue
      A2uiNodeRenderer.vue
    composables/
      useA2uiSurface.ts
    registry/
      registry.ts
    widgets/
      A2uiColumn.vue
      A2uiRow.vue
      A2uiText.vue
      A2uiTextField.vue
      A2uiButton.vue
    types/
      a2ui.ts
```

## A2UI Subset

The demo should stay close to official A2UI v0.9 field names while supporting only a narrow subset.

### Supported Messages

- `createSurface`
- `updateComponents`
- `updateDataModel`

### Supported Components

- `Column`
- `Row`
- `Text`
- `TextField`
- `Button`

### Supported Fields

- `id`
- `component`
- `children`
- `child`
- `text`
- `label`
- `value.path`
- `action.event.name`
- `action.event.context`

### Deliberately Unsupported

- multiple surfaces
- incremental patches
- expression execution
- custom functions
- modal, tabs, list, and other advanced components

## Adapter API

The frontend only talks to the adapter.

### POST /api/chat

Request:

```ts
interface ChatTurnRequest {
  sessionId: string
  text: string
}
```

Response:

```ts
interface ChatTurnResponse {
  sessionId: string
  userMessage: DemoMessage
  assistantMessage: DemoMessage
}
```

### POST /api/panel-action

Request:

```ts
interface PanelActionRequest {
  sessionId: string
  sourceMessageId: string
  surfaceId: string
  componentId: string
  actionName: string
  formData: Record<string, unknown>
}
```

Response:

```ts
interface PanelActionResponse {
  sessionId: string
  assistantMessage: DemoMessage
}
```

## Shared Message Model

The web app consumes normalized demo messages instead of Opencode-native messages.

```ts
interface DemoMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  createdAt: number
  displayText?: string
  raw?: {
    info: unknown
    parts: unknown[]
  }
  panel?: DemoPanel
  panelMode?: "interactive" | "readonly"
}

interface DemoPanel {
  source: "a2ui"
  messages: A2uiServerMessage[]
}
```

## Opencode Integration

The demo integrates with the real Opencode API endpoint:

`POST /session/:id/message`

The adapter should use this single endpoint for both standard chat turns and panel action turns.

### Standard Chat Mapping

The adapter wraps user input into a single `TextPart`.

The `text` content is structured JSON encoded as a string:

```json
{
  "kind": "chat",
  "userMessage": "Help me book a restaurant",
  "uiPolicy": {
    "allowForm": true,
    "allowedActions": ["submit_booking", "confirm_selection"],
    "maxFields": 6,
    "supportedInputTypes": ["text"]
  }
}
```

### Panel Action Mapping

The adapter wraps panel actions into another `TextPart`.

```json
{
  "kind": "ui_action",
  "actionName": "submit_booking",
  "formData": {
    "partySize": "4",
    "reservationTime": "tonight 7pm"
  }
}
```

### Response Extraction

The adapter preserves all returned Opencode parts for display.

Only `type: "text"` parts are concatenated and fed into the structured parsing step that drives panel generation.

## Structured Agent Response

Opencode should be instructed to return a constrained JSON object encoded as plain text.

```ts
interface AgentStructuredResponse {
  replyText: string
  uiIntent?: AgentUiIntent
}

interface AgentUiIntent {
  type: "form"
  title: string
  description?: string
  submitLabel: string
  submitAction: "submit_booking" | "confirm_selection"
  fields: AgentUiField[]
}

interface AgentUiField {
  name: string
  label: string
  inputType: "text"
  required?: boolean
  defaultValue?: string
  placeholder?: string
}
```

The adapter should validate this structure with `zod`.

## A2UI Builder Rules

The adapter, not Opencode, is responsible for converting `AgentUiIntent` into A2UI.

Mapping rules:

- `title` becomes a `Text` node
- `description`, if used, becomes another `Text` node
- every field becomes a `TextField`
- submit becomes a `Button` with a child `Text`
- the top-level layout becomes a `Column`

This mapping should stay fixed so the frontend behavior remains predictable.

## Error Handling

### Adapter Parsing Failures

If Opencode output cannot be parsed as structured JSON:

- keep the assistant message
- keep raw parts
- render plain text only
- do not emit a panel

### Validation Failures

If structured output fails schema validation:

- drop `uiIntent`
- keep `replyText`
- log the validation issue in adapter logs

### Unsupported Actions

If the agent emits an unsupported action name:

- drop the panel
- return text only

### Frontend Rendering Failures

If an unknown node type appears:

- render a visible unsupported-node placeholder in development
- avoid breaking the rest of the surface

## Testing Strategy

### Shared

- schema validation tests
- A2UI builder tests

### Adapter

- Opencode response parsing tests
- invalid JSON fallback tests
- invalid `uiIntent` downgrade tests
- chat request mapping tests
- panel action mapping tests

### Web

- A2UI renderer tests for supported nodes
- only-latest-panel-interactive state tests
- read-only historical panel tests
- panel action submission tests

## Implementation Phases

### Phase 1

- scaffold monorepo demo structure
- define shared types and schemas
- implement adapter with mockable Opencode client

### Phase 2

- wire adapter to real Opencode endpoint
- implement Vue chat UI
- implement A2UI renderer for supported nodes

### Phase 3

- implement panel action submission
- implement historical read-only behavior
- add tests and docs

## Success Criteria

The demo is successful when:

1. A user can send a chat message through the Vue app to a real Opencode session.
2. A structured Opencode response can be converted into an A2UI panel.
3. The current assistant panel is interactive.
4. Submitting that panel creates the next assistant turn.
5. Previous panels remain visible but no longer interactive.
