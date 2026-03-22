# OpenCode Adapter Sample

A minimal TypeScript A2A adapter for the React shell sample.

## Commands

```bash
cd samples/agent/opencode_adapter && npm install
cd samples/agent/opencode_adapter && npm run dev
cd samples/agent/opencode_adapter && npm run typecheck
cd samples/agent/opencode_adapter && npm run build
cd samples/agent/opencode_adapter && npm test
```

## OpenCode serve

Start OpenCode in headless mode first:

```bash
opencode serve --port 4096
```

Then start the adapter. You can override the OpenCode base URL with `OPENCODE_SERVER_URL`.

```bash
cd samples/agent/opencode_adapter && OPENCODE_SERVER_URL=http://127.0.0.1:4096 npm run dev
```

## What it does

- Serves `/.well-known/agent-card.json`
- Serves `/a2a/jsonrpc`
- Accepts text or A2UI `userAction` input
- Returns full A2UI v0.8 snapshots in `Task.status.message.parts`
- Calls OpenCode over HTTP via `opencode serve`
- If OpenCode returns plain text, the adapter renders a fallback text surface
- If OpenCode returns an assistant error, the adapter renders an error surface

## Current flow

- Text input -> forwarded to OpenCode as plain text
- `userAction` -> forwarded to OpenCode as JSON text payload
- OpenCode JSON text with `intent` -> mapped into A2UI views
- Plain text -> fallback text surface
- Errors -> fallback error surface
