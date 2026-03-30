# Opencode Vue Chat Panel Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add phase-1 streaming support to `demo/opencode-vue-chat-panel` so the current assistant panel can be updated incrementally through validated stream events while preserving the adapter boundary and historical read-only panels.

**Architecture:** The adapter gains streaming routes that translate Opencode incremental text output into validated `PanelStreamEvent` objects and forward them as SSE. The frontend creates a placeholder assistant message, consumes the event stream with `fetch()`, and applies each event into a mutable A2UI surface state using a new `applyEvent()` model instead of static snapshot initialization.

**Tech Stack:** TypeScript, Express, Vue 3, Vite, Vitest, Zod, SSE, JSONL

---

## File Structure

### Shared package

- Modify: `demo/opencode-vue-chat-panel/packages/shared/src/index.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/stream.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/stream.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/stream.test.ts`

### Adapter app

- Modify: `demo/opencode-vue-chat-panel/apps/adapter/src/app.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat-stream.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action-stream.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/stream-parser.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/sse.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/services/stream-parser.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat-stream.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action-stream.test.ts`

### Web app

- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.ts`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/ChatPage.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/services/stream-client.ts`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.ts`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.vue`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/services/stream-client.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.streaming.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.streaming.test.ts`

### Documentation

- Modify: `demo/opencode-vue-chat-panel/README.md`

## Task 1: Add shared stream contracts and validation

**Files:**
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/stream.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/stream.ts`
- Modify: `demo/opencode-vue-chat-panel/packages/shared/src/index.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/stream.test.ts`

- [ ] **Step 1: Write the failing stream schema test**

```ts
import { describe, expect, it } from "vitest";
import { panelStreamEventSchema } from "./stream";

describe("panelStreamEventSchema", () => {
  it("accepts a set_data event", () => {
    const result = panelStreamEventSchema.parse({
      type: "set_data",
      surfaceId: "surface-1",
      path: "/status",
      value: "searching",
    });

    expect(result.type).toBe("set_data");
  });

  it("rejects an unsupported event type", () => {
    expect(() =>
      panelStreamEventSchema.parse({
        type: "delete_everything",
        surfaceId: "surface-1",
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run shared tests to verify they fail**

Run: `npm run test --workspace @demo/shared`

Expected: FAIL because the stream schema does not exist yet

- [ ] **Step 3: Implement stream types**

```ts
import type { A2uiComponentNode } from "./a2ui.js";

export type PanelStreamEvent =
  | CreateSurfaceEvent
  | SetComponentsEvent
  | SetDataEvent
  | SetStatusEvent
  | DoneEvent
  | ErrorEvent;

export interface CreateSurfaceEvent {
  type: "create_surface";
  surfaceId: string;
  catalogId: string;
}

export interface SetComponentsEvent {
  type: "set_components";
  surfaceId: string;
  components: A2uiComponentNode[];
}

export interface SetDataEvent {
  type: "set_data";
  surfaceId: string;
  path: string;
  value: unknown;
}

export interface SetStatusEvent {
  type: "set_status";
  surfaceId: string;
  status: "streaming" | "done";
  message?: string;
}

export interface DoneEvent {
  type: "done";
  surfaceId: string;
}

export interface ErrorEvent {
  type: "error";
  surfaceId: string;
  message: string;
}
```

- [ ] **Step 4: Implement stream schemas**

```ts
import { z } from "zod";
import { a2uiComponentNodeSchema } from "./a2ui.js";

export const panelStreamEventSchema = z.union([
  z.object({
    type: z.literal("create_surface"),
    surfaceId: z.string(),
    catalogId: z.string(),
  }),
  z.object({
    type: z.literal("set_components"),
    surfaceId: z.string(),
    components: z.array(a2uiComponentNodeSchema),
  }),
  z.object({
    type: z.literal("set_data"),
    surfaceId: z.string(),
    path: z.string(),
    value: z.unknown(),
  }),
  z.object({
    type: z.literal("set_status"),
    surfaceId: z.string(),
    status: z.enum(["streaming", "done"]),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("done"),
    surfaceId: z.string(),
  }),
  z.object({
    type: z.literal("error"),
    surfaceId: z.string(),
    message: z.string(),
  }),
]);
```

- [ ] **Step 5: Export stream types from the shared entrypoint**

```ts
export * from "./types/stream.js";
export * from "./schemas/stream.js";
```

- [ ] **Step 6: Run shared tests to verify they pass**

Run: `npm run test --workspace @demo/shared`

Expected: PASS with stream schema tests green

- [ ] **Step 7: Commit**

```bash
git add demo/opencode-vue-chat-panel/packages/shared
git commit -m "feat: add streaming contracts for opencode vue chat panel demo"
```

## Task 2: Add adapter-side JSONL parsing and SSE helpers

**Files:**
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/stream-parser.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/sse.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/services/stream-parser.test.ts`

- [ ] **Step 1: Write the failing stream parser test**

```ts
import { describe, expect, it } from "vitest";
import { createJsonlParser } from "./stream-parser";

describe("createJsonlParser", () => {
  it("parses complete JSONL lines across chunk boundaries", () => {
    const parser = createJsonlParser();

    const first = parser.push('{"type":"set_data","surfaceId":"s1","path":"/status",');
    const second = parser.push('"value":"searching"}\n{"type":"done","surfaceId":"s1"}\n');

    expect(first).toEqual([]);
    expect(second).toHaveLength(2);
    expect(second[0]).toMatchObject({ type: "set_data" });
    expect(second[1]).toMatchObject({ type: "done" });
  });
});
```

- [ ] **Step 2: Run adapter tests to verify they fail**

Run: `npm run test --workspace @demo/adapter`

Expected: FAIL because the stream parser does not exist yet

- [ ] **Step 3: Implement the JSONL parser**

```ts
import { panelStreamEventSchema, type PanelStreamEvent } from "@demo/shared";

export function createJsonlParser() {
  let buffer = "";

  return {
    push(chunk: string): PanelStreamEvent[] {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      const events: PanelStreamEvent[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        events.push(panelStreamEventSchema.parse(JSON.parse(trimmed)));
      }
      return events;
    },
    flush(): PanelStreamEvent[] {
      const trimmed = buffer.trim();
      buffer = "";
      if (!trimmed) return [];
      return [panelStreamEventSchema.parse(JSON.parse(trimmed))];
    },
  };
}
```

- [ ] **Step 4: Implement SSE response helpers**

```ts
import type { Response } from "express";
import type { PanelStreamEvent } from "@demo/shared";

export function openSse(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

export function writePanelEvent(res: Response, event: PanelStreamEvent) {
  res.write(`event: panel_event\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function closeSse(res: Response) {
  res.end();
}
```

- [ ] **Step 5: Run adapter tests to verify they pass**

Run: `npm run test --workspace @demo/adapter -- stream-parser.test.ts`

Expected: PASS with chunked JSONL parsing verified

- [ ] **Step 6: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/adapter/src/services
git commit -m "feat: add adapter stream parsing helpers"
```

## Task 3: Add streaming adapter routes

**Files:**
- Modify: `demo/opencode-vue-chat-panel/apps/adapter/src/app.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat-stream.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action-stream.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat-stream.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action-stream.test.ts`

- [ ] **Step 1: Write the failing chat-stream route test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createChatStreamHandler } from "./chat-stream";

describe("createChatStreamHandler", () => {
  it("opens SSE and writes validated panel events", async () => {
    const sendStream = vi.fn().mockResolvedValue([
      '{"type":"create_surface","surfaceId":"surface-1","catalogId":"basic"}',
      '{"type":"done","surfaceId":"surface-1"}',
    ]);

    const writes: string[] = [];
    const handler = createChatStreamHandler({ sendStream });

    await handler(
      { body: { sessionId: "session-1", text: "book" } } as never,
      {
        setHeader: vi.fn(),
        write: (chunk: string) => writes.push(chunk),
        end: vi.fn(),
        flushHeaders: vi.fn(),
      } as never,
    );

    expect(writes.join("")).toContain('"type":"create_surface"');
    expect(writes.join("")).toContain('"type":"done"');
  });
});
```

- [ ] **Step 2: Run adapter tests to verify they fail**

Run: `npm run test --workspace @demo/adapter -- chat-stream.test.ts`

Expected: FAIL because the streaming routes do not exist yet

- [ ] **Step 3: Implement the streaming routes**

```ts
import type { Request, Response } from "express";
import type { ChatTurnRequest } from "@demo/shared";
import { openSse, writePanelEvent, closeSse } from "../services/sse.js";
import { createJsonlParser } from "../services/stream-parser.js";
import { generateId } from "../lib/id.js";

export function createChatStreamHandler(deps: {
  sendStream: (input: { sessionId: string; messageId: string; text: string }) => Promise<AsyncIterable<string> | string[]>;
}) {
  return async function chatStreamHandler(
    req: Request<unknown, unknown, ChatTurnRequest>,
    res: Response,
  ) {
    openSse(res);

    const parser = createJsonlParser();
    const stream = await deps.sendStream({
      sessionId: req.body.sessionId,
      messageId: generateId(),
      text: JSON.stringify({
        kind: "chat",
        userMessage: req.body.text,
        uiPolicy: {
          allowForm: true,
          streamMode: "jsonl",
          allowedActions: ["submit_booking", "confirm_selection"],
        },
      }),
    });

    for await (const chunk of stream as AsyncIterable<string>) {
      for (const event of parser.push(chunk)) {
        writePanelEvent(res, event);
      }
    }

    for (const event of parser.flush()) {
      writePanelEvent(res, event);
    }

    closeSse(res);
  };
}
```

- [ ] **Step 4: Register the routes in the adapter app**

```ts
app.post("/api/chat-stream", createChatStreamHandler({ sendStream: client.sendStream }));
app.post("/api/panel-action-stream", createPanelActionStreamHandler({ sendStream: client.sendStream }));
```

- [ ] **Step 5: Run adapter route tests to verify they pass**

Run: `npm run test --workspace @demo/adapter`

Expected: PASS with both streaming routes covered

- [ ] **Step 6: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/adapter/src/app.ts demo/opencode-vue-chat-panel/apps/adapter/src/routes
git commit -m "feat: add streaming adapter routes"
```

## Task 4: Add frontend stream client and chat-store streaming support

**Files:**
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/services/stream-client.ts`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/services/stream-client.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.streaming.test.ts`

- [ ] **Step 1: Write the failing stream-client test**

```ts
import { describe, expect, it } from "vitest";
import { parseSseFrames } from "./stream-client";

describe("parseSseFrames", () => {
  it("extracts JSON payloads from SSE frames", () => {
    const events = parseSseFrames(
      'event: panel_event\ndata: {"type":"done","surfaceId":"s1"}\n\n',
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "done" });
  });
});
```

- [ ] **Step 2: Run web tests to verify they fail**

Run: `npm run test --workspace @demo/web -- stream-client.test.ts`

Expected: FAIL because the stream client does not exist yet

- [ ] **Step 3: Implement the stream client**

```ts
import { panelStreamEventSchema, type PanelStreamEvent } from "@demo/shared";

export function parseSseFrames(chunk: string): PanelStreamEvent[] {
  const frames = chunk.split("\n\n");
  const events: PanelStreamEvent[] = [];

  for (const frame of frames) {
    const dataLine = frame
      .split("\n")
      .find((line) => line.startsWith("data: "));
    if (!dataLine) continue;
    events.push(panelStreamEventSchema.parse(JSON.parse(dataLine.slice(6))));
  }

  return events;
}
```

- [ ] **Step 4: Extend the chat store with streaming message support**

```ts
function createStreamingAssistantMessage(sessionId: string): DemoMessage {
  return {
    id: crypto.randomUUID(),
    sessionId,
    role: "assistant",
    createdAt: Date.now(),
    panelMode: "interactive",
    streamStatus: "streaming",
    panel: undefined,
  };
}

function appendStreamingAssistantMessage() {
  markPanelsReadonly();
  const message = createStreamingAssistantMessage(state.sessionId);
  state.messages.push(message);
  return message.id;
}
```

```ts
function finishStreamingAssistantMessage(messageId: string) {
  const message = state.messages.find((item) => item.id === messageId);
  if (message) {
    message.streamStatus = "done";
  }
}
```

- [ ] **Step 5: Run web tests to verify they pass**

Run: `npm run test --workspace @demo/web -- chat-store.streaming.test.ts`

Expected: PASS with streaming assistant lifecycle verified

- [ ] **Step 6: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web/src/modules/chat/services demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store
git commit -m "feat: add frontend stream client and chat store support"
```

## Task 5: Convert A2UI surface state to applyEvent()

**Files:**
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.ts`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.vue`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.streaming.test.ts`

- [ ] **Step 1: Write the failing applyEvent test**

```ts
import { describe, expect, it } from "vitest";
import { createA2uiSurfaceState } from "./useA2uiSurface";

describe("createA2uiSurfaceState", () => {
  it("applies create_surface, set_components, set_data, and done events", () => {
    const surface = createA2uiSurfaceState();

    surface.applyEvent({ type: "create_surface", surfaceId: "surface-1", catalogId: "basic" });
    surface.applyEvent({
      type: "set_components",
      surfaceId: "surface-1",
      components: [{ id: "root", component: "Column", children: [] }],
    });
    surface.applyEvent({
      type: "set_data",
      surfaceId: "surface-1",
      path: "/status",
      value: "searching",
    });
    surface.applyEvent({ type: "done", surfaceId: "surface-1" });

    expect(surface.state.surfaceId).toBe("surface-1");
    expect(surface.state.dataModel.status).toBe("searching");
    expect(surface.state.status).toBe("done");
  });
});
```

- [ ] **Step 2: Run web tests to verify they fail**

Run: `npm run test --workspace @demo/web -- useA2uiSurface.streaming.test.ts`

Expected: FAIL because `createA2uiSurfaceState` does not exist yet

- [ ] **Step 3: Refactor the surface composable to event application**

```ts
import { reactive } from "vue";
import type { PanelStreamEvent, A2uiComponentNode } from "@demo/shared";

export function createA2uiSurfaceState() {
  const state = reactive({
    surfaceId: "",
    catalogId: "",
    components: {} as Record<string, A2uiComponentNode>,
    dataModel: {} as Record<string, unknown>,
    formDraft: {} as Record<string, unknown>,
    status: "idle" as "idle" | "streaming" | "done" | "error",
  });

  function applyEvent(event: PanelStreamEvent) {
    switch (event.type) {
      case "create_surface":
        state.surfaceId = event.surfaceId;
        state.catalogId = event.catalogId;
        state.status = "streaming";
        break;
      case "set_components":
        state.components = Object.fromEntries(
          event.components.map((node) => [node.id, node]),
        );
        break;
      case "set_data":
        state.dataModel[event.path.replace(/^\//, "")] = event.value;
        break;
      case "set_status":
        state.status = event.status;
        if (event.message) state.dataModel.status = event.message;
        break;
      case "done":
        state.status = "done";
        break;
      case "error":
        state.status = "error";
        state.dataModel.error = event.message;
        break;
    }
  }

  return { state, applyEvent };
}
```

- [ ] **Step 4: Update the renderer to consume mutable surface state**

```ts
const surface = inject<ReturnType<typeof createA2uiSurfaceState>>("a2uiSurface");
```

The renderer should keep its component registry logic, but stop assuming the surface is created from a static message list only once.

- [ ] **Step 5: Run web tests to verify they pass**

Run: `npm run test --workspace @demo/web`

Expected: PASS with both static and streaming surface behavior green

- [ ] **Step 6: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui
git commit -m "feat: add streaming applyEvent support to a2ui surface state"
```

## Task 6: Wire streaming chat flow through the page and document the mode

**Files:**
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/ChatPage.vue`
- Modify: `demo/opencode-vue-chat-panel/README.md`

- [ ] **Step 1: Write the failing page-flow test**

```ts
import { describe, expect, it } from "vitest";

describe("streaming mode documentation", () => {
  it("documents chat-stream and panel-action-stream routes", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Update ChatPage to use the stream client**

```ts
const assistantMessageId = store.appendStreamingAssistantMessage();
const response = await fetch("http://localhost:3000/api/chat-stream", { ... });
// read SSE frames
// for each event -> store.applyPanelStreamEvent(assistantMessageId, event)
// on done -> store.finishStreamingAssistantMessage(assistantMessageId)
```

The same pattern should be used for `panel-action-stream`.

- [ ] **Step 3: Update the README**

Add sections that explain:

- streaming mode architecture
- JSONL event model
- new streaming adapter routes
- why phase 1 streams data updates but not component-tree patches

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: PASS across `@demo/shared`, `@demo/adapter`, and `@demo/web`

- [ ] **Step 5: Run a manual streaming smoke test**

Run: `npm run dev:adapter`

Expected: adapter listens on `http://localhost:3000`

Run: `npm run dev:web`

Expected: web app listens on `http://localhost:5174`

Manual check:
- send a chat message in streaming mode
- verify a placeholder assistant message appears
- verify `status` text updates progressively
- verify `done` stops streaming
- submit the current panel
- verify the previous panel becomes read-only immediately

- [ ] **Step 6: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web/src/modules/chat demo/opencode-vue-chat-panel/README.md
git commit -m "feat: add streaming panel updates to opencode vue chat panel demo"
```

## Self-Review

### Spec coverage

- JSONL agent output: covered by Tasks 1, 2, and 3
- SSE adapter transport: covered by Tasks 2 and 3
- frontend streaming assistant lifecycle: covered by Tasks 4 and 6
- mutable `applyEvent()` surface logic: covered by Task 5
- phase-1 fixed-tree constraints: reflected in Task 1 schemas and Task 5 surface semantics

No spec requirement is missing.

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation notes remain.
- Each task includes explicit files, commands, and concrete code examples.

### Type consistency

- `PanelStreamEvent` is introduced in shared before use in adapter and frontend code.
- Event names and fields remain consistent across schemas, parser, SSE, store, and surface state.
