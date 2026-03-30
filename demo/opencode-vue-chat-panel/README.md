# Opencode Vue Chat Panel Demo

A standalone full-stack TypeScript demo that shows how to embed an interactive A2UI-driven panel inside a chat conversation backed by a real Opencode agent over HTTP.

## Prerequisites

- Node.js 20+
- Access to a running Opencode HTTP server

## Architecture

```
Vue Chat Demo -> TS Adapter -> Opencode Session API
                <- TS Adapter <-
```

The adapter is the protocol boundary. The Vue app never calls Opencode directly and never interprets raw Opencode output as renderable UI.

## Project Structure

```
demo/opencode-vue-chat-panel/
├── package.json              # Root workspace config
├── tsconfig.base.json        # Shared TypeScript config
├── apps/
│   ├── adapter/              # Express adapter service
│   │   └── src/
│   │       ├── app.ts        # Express server entry point
│   │       ├── config.ts     # Environment configuration
│   │       ├── routes/       # HTTP route handlers
│   │       └── services/     # Opencode client, parsing logic
│   └── web/                  # Vue web app
│       └── src/
│           ├── main.ts       # Vue entry point
│           ├── App.vue       # Root component
│           ├── styles.css    # Global styles
│           └── modules/
│               ├── chat/     # Chat UI components and store
│               └── a2ui/     # A2UI renderer components
└── packages/
    └── shared/               # Shared types and schemas
        └── src/
            ├── types/        # TypeScript interfaces
            ├── schemas/      # Zod validation schemas
            └── builders/     # A2UI message builders
```

## Run

```bash
cd demo/opencode-vue-chat-panel
npm install
```

Start the adapter:

```bash
OPENCODE_BASE_URL=http://localhost:4096 npm run dev:adapter
```

In another terminal, start the web app:

```bash
npm run dev:web
```

Open http://localhost:5174.

## API Endpoints

### POST /api/chat

Send a chat message to the Opencode session.

**Request:**
```json
{
  "sessionId": "demo-session-123",
  "text": "Help me book a restaurant"
}
```

**Response:**
```json
{
  "sessionId": "demo-session-123",
  "userMessage": { "id": "...", "displayText": "Help me book a restaurant", ... },
  "assistantMessage": { "id": "...", "displayText": "...", "panel": { ... }, ... }
}
```

### POST /api/panel-action

Submit a panel action (form submission).

**Request:**
```json
{
  "sessionId": "demo-session-123",
  "sourceMessageId": "assistant-msg-id",
  "surfaceId": "surface-1",
  "componentId": "submit-button",
  "actionName": "submit_booking",
  "formData": { "partySize": "4", "date": "tonight 7pm" }
}
```

**Response:**
```json
{
  "sessionId": "demo-session-123",
  "assistantMessage": { "id": "...", "displayText": "...", ... }
}
```

## A2UI Subset

This demo supports a constrained subset of A2UI v0.9:

### Supported Components
- `Column` - Vertical layout container
- `Row` - Horizontal layout container
- `Text` - Static text display
- `TextField` - Text input field
- `Button` - Action trigger

### Supported Messages
- `createSurface` - Initialize a UI surface
- `updateComponents` - Define component tree
- `updateDataModel` - Set data values

### Supported Actions
- `submit_booking` - Form submission action
- `confirm_selection` - Confirmation action

## Development

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_BASE_URL` | `http://localhost:4096` | Opencode HTTP server URL |
| `OPENCODE_AGENT` | - | Agent name to use |
| `OPENCODE_SYSTEM_PROMPT` | (built-in) | System prompt for the agent |
| `ADAPTER_PORT` | `3000` | Adapter server port |

## How It Works

1. User sends a chat message through the Vue app
2. Web app calls `POST /api/chat` on the adapter
3. Adapter constructs an Opencode message for the current session
4. Opencode returns `{ info, parts }`
5. Adapter extracts text parts and parses structured JSON
6. If structured output includes `uiIntent`, adapter builds A2UI panel messages
7. Frontend renders the assistant message with an interactive panel
8. When user submits the panel, it becomes read-only and a new assistant message appears
