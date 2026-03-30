# Opencode Vue Chat Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone full-stack TypeScript demo under `demo/opencode-vue-chat-panel` that uses a real Opencode session to drive a Vue chat UI with an embedded A2UI v0.9-compatible panel.

**Architecture:** The demo is split into three workspaces: a Vue web app, an Express-based adapter, and a shared TypeScript package containing API contracts, structured agent schemas, and the constrained A2UI subset. The adapter is the only component that talks to Opencode; it converts frontend chat and panel-action requests into Opencode `TextPart` payloads and converts Opencode text output into normalized demo messages plus a generated A2UI panel.

**Tech Stack:** TypeScript, npm workspaces, Vue 3, Vite, Express, Vitest, Zod

---

## File Structure

### Demo root

- Create: `demo/opencode-vue-chat-panel/package.json`
- Create: `demo/opencode-vue-chat-panel/tsconfig.base.json`

### Shared package

- Create: `demo/opencode-vue-chat-panel/packages/shared/package.json`
- Create: `demo/opencode-vue-chat-panel/packages/shared/tsconfig.json`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/index.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/opencode.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/api.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/a2ui.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/agent.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/agent.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/a2ui.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/builders/a2ui.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/builders/a2ui.test.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/agent.test.ts`

### Adapter app

- Create: `demo/opencode-vue-chat-panel/apps/adapter/package.json`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/tsconfig.json`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/app.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/config.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/opencode-client.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/agent-output.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/demo-message.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/lib/id.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/services/agent-output.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action.test.ts`

### Web app

- Create: `demo/opencode-vue-chat-panel/apps/web/package.json`
- Create: `demo/opencode-vue-chat-panel/apps/web/tsconfig.json`
- Create: `demo/opencode-vue-chat-panel/apps/web/vite.config.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/index.html`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/main.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/App.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/styles.css`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/ChatPage.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/MessageList.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/AssistantMessageCard.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/OpencodePartsView.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/Composer.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiNodeRenderer.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/registry/registry.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiColumn.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiRow.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiText.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiTextField.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiButton.vue`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.test.ts`

### Documentation

- Create: `demo/opencode-vue-chat-panel/README.md`

## Task 1: Scaffold the demo workspace

**Files:**
- Create: `demo/opencode-vue-chat-panel/package.json`
- Create: `demo/opencode-vue-chat-panel/tsconfig.base.json`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/package.json`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/tsconfig.json`
- Create: `demo/opencode-vue-chat-panel/apps/web/package.json`
- Create: `demo/opencode-vue-chat-panel/apps/web/tsconfig.json`
- Create: `demo/opencode-vue-chat-panel/apps/web/vite.config.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/index.html`
- Create: `demo/opencode-vue-chat-panel/packages/shared/package.json`
- Create: `demo/opencode-vue-chat-panel/packages/shared/tsconfig.json`

- [ ] **Step 1: Create the demo root workspace files**

```json
{
  "name": "opencode-vue-chat-panel",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "dev:web": "npm run dev --workspace @demo/web",
    "dev:adapter": "npm run dev --workspace @demo/adapter"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@demo/shared": [
        "packages/shared/src/index.ts"
      ]
    }
  }
}
```

- [ ] **Step 2: Add the shared package manifests**

```json
{
  "name": "@demo/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "vitest": "^3.0.8"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": [
    "src"
  ]
}
```

- [ ] **Step 3: Add the adapter package manifests**

```json
{
  "name": "@demo/adapter",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/app.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@demo/shared": "0.0.1",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.1",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2",
    "vitest": "^3.0.8"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": [
    "src"
  ]
}
```

- [ ] **Step 4: Add the web package manifests**

```json
{
  "name": "@demo/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "test": "vitest run"
  },
  "dependencies": {
    "@demo/shared": "0.0.1",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.2",
    "vite": "^6.2.2",
    "vitest": "^3.0.8"
  }
}
```

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
  },
});
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Opencode Vue Chat Panel</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Install workspace dependencies**

Run: `npm install`

Expected: workspace install completes with `package-lock.json` created under `demo/opencode-vue-chat-panel`

- [ ] **Step 6: Verify empty workspace build wiring**

Run: `npm run build`

Expected: build may fail because app sources do not exist yet; package scripts resolve without workspace errors

- [ ] **Step 7: Commit**

```bash
git add demo/opencode-vue-chat-panel/package.json demo/opencode-vue-chat-panel/tsconfig.base.json demo/opencode-vue-chat-panel/apps demo/opencode-vue-chat-panel/packages
git commit -m "chore: scaffold opencode vue chat panel workspace"
```

## Task 2: Build shared contracts, schemas, and the A2UI builder

**Files:**
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/index.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/opencode.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/api.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/a2ui.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/types/agent.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/agent.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/a2ui.ts`
- Create: `demo/opencode-vue-chat-panel/packages/shared/src/builders/a2ui.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/builders/a2ui.test.ts`
- Test: `demo/opencode-vue-chat-panel/packages/shared/src/schemas/agent.test.ts`

- [ ] **Step 1: Write the failing builder and schema tests**

```ts
import { describe, expect, it } from "vitest";
import { buildFormSurface } from "./a2ui";

describe("buildFormSurface", () => {
  it("builds a createSurface + updateComponents + updateDataModel sequence", () => {
    const messages = buildFormSurface("surface-1", {
      type: "form",
      title: "Restaurant booking",
      submitLabel: "Submit",
      submitAction: "submit_booking",
      fields: [
        {
          name: "partySize",
          label: "Party Size",
          inputType: "text",
          defaultValue: "2",
        },
      ],
    });

    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveProperty("createSurface.surfaceId", "surface-1");
    expect(messages[1]).toHaveProperty("updateComponents.components.0.component", "Column");
    expect(messages[2]).toHaveProperty("updateDataModel.value.partySize", "2");
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { agentStructuredResponseSchema } from "./agent";

describe("agentStructuredResponseSchema", () => {
  it("accepts a valid response with a form intent", () => {
    const result = agentStructuredResponseSchema.parse({
      replyText: "Please fill in this form.",
      uiIntent: {
        type: "form",
        title: "Booking",
        submitLabel: "Submit",
        submitAction: "submit_booking",
        fields: [
          {
            name: "partySize",
            label: "Party Size",
            inputType: "text",
          },
        ],
      },
    });

    expect(result.uiIntent?.fields[0]?.name).toBe("partySize");
  });

  it("rejects unsupported submit actions", () => {
    expect(() =>
      agentStructuredResponseSchema.parse({
        replyText: "Bad response",
        uiIntent: {
          type: "form",
          title: "Booking",
          submitLabel: "Submit",
          submitAction: "delete_everything",
          fields: [],
        },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run shared tests to verify they fail**

Run: `npm run test --workspace @demo/shared`

Expected: FAIL because `buildFormSurface` and schemas do not exist yet

- [ ] **Step 3: Implement shared types and schemas**

```ts
export interface TextPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "text";
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OpencodeResponse {
  info: unknown;
  parts: Array<TextPart | Record<string, unknown>>;
}
```

```ts
export type A2uiComponentType = "Column" | "Row" | "Text" | "TextField" | "Button";

export interface A2uiComponentNode {
  id: string;
  component: A2uiComponentType;
  children?: string[];
  child?: string;
  text?: string | { path: string };
  label?: string;
  value?: { path: string };
  action?: {
    event: {
      name: "submit_booking" | "confirm_selection";
      context?: Record<string, { path: string }>;
    };
  };
}
```

```ts
import { z } from "zod";

export const agentUiFieldSchema = z.object({
  name: z.string().min(1).max(40).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(40),
  inputType: z.literal("text"),
  required: z.boolean().optional(),
  defaultValue: z.string().max(200).optional(),
  placeholder: z.string().max(80).optional(),
});

export const agentUiIntentSchema = z.object({
  type: z.literal("form"),
  title: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  submitLabel: z.string().min(1).max(30),
  submitAction: z.enum(["submit_booking", "confirm_selection"]),
  fields: z.array(agentUiFieldSchema).min(1).max(6),
});

export const agentStructuredResponseSchema = z.object({
  replyText: z.string().min(1).max(2000),
  uiIntent: agentUiIntentSchema.optional(),
});
```

- [ ] **Step 4: Implement the A2UI builder**

```ts
import type { AgentUiIntent, A2uiServerMessage, A2uiComponentNode } from "../index";

const BASIC_CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";

export function buildFormSurface(
  surfaceId: string,
  ui: AgentUiIntent,
): A2uiServerMessage[] {
  const fieldNodes: A2uiComponentNode[] = ui.fields.map((field) => ({
    id: `field-${field.name}`,
    component: "TextField",
    label: field.label,
    value: { path: `/${field.name}` },
  }));

  const components: A2uiComponentNode[] = [
    {
      id: "root",
      component: "Column",
      children: [
        "title",
        ...fieldNodes.map((field) => field.id),
        "submit-button",
      ],
    },
    {
      id: "title",
      component: "Text",
      text: { path: "/title" },
    },
    ...fieldNodes,
    {
      id: "submit-button",
      component: "Button",
      child: "submit-text",
      action: {
        event: {
          name: ui.submitAction,
        },
      },
    },
    {
      id: "submit-text",
      component: "Text",
      text: ui.submitLabel,
    },
  ];

  const value: Record<string, unknown> = { title: ui.title };
  for (const field of ui.fields) {
    value[field.name] = field.defaultValue ?? "";
  }

  return [
    {
      version: "v0.9",
      createSurface: {
        surfaceId,
        catalogId: BASIC_CATALOG_ID,
      },
    },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components,
      },
    },
    {
      version: "v0.9",
      updateDataModel: {
        surfaceId,
        path: "/",
        value,
      },
    },
  ];
}
```

- [ ] **Step 5: Export the shared entrypoint**

```ts
export * from "./types/opencode";
export * from "./types/api";
export * from "./types/a2ui";
export * from "./types/agent";
export * from "./schemas/agent";
export * from "./schemas/a2ui";
export * from "./builders/a2ui";
```

- [ ] **Step 6: Run shared tests to verify they pass**

Run: `npm run test --workspace @demo/shared`

Expected: PASS with schema and builder tests green

- [ ] **Step 7: Commit**

```bash
git add demo/opencode-vue-chat-panel/packages/shared
git commit -m "feat: add shared contracts for opencode vue chat panel demo"
```

## Task 3: Implement the adapter service and request mapping

**Files:**
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/app.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/config.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/opencode-client.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/agent-output.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/services/demo-message.ts`
- Create: `demo/opencode-vue-chat-panel/apps/adapter/src/lib/id.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/services/agent-output.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/chat.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/adapter/src/routes/panel-action.test.ts`

- [ ] **Step 1: Write failing adapter parsing tests**

```ts
import { describe, expect, it } from "vitest";
import { parseAgentStructuredText } from "./agent-output";

describe("parseAgentStructuredText", () => {
  it("returns structured output when the text is valid JSON", () => {
    const result = parseAgentStructuredText([
      "{\"replyText\":\"hello\",\"uiIntent\":{\"type\":\"form\",\"title\":\"Booking\",\"submitLabel\":\"Submit\",\"submitAction\":\"submit_booking\",\"fields\":[{\"name\":\"partySize\",\"label\":\"Party Size\",\"inputType\":\"text\"}]}}",
    ]);

    expect(result.replyText).toBe("hello");
    expect(result.uiIntent?.title).toBe("Booking");
  });

  it("falls back to plain text when JSON parsing fails", () => {
    const result = parseAgentStructuredText(["plain text reply"]);
    expect(result.replyText).toBe("plain text reply");
    expect(result.uiIntent).toBeUndefined();
  });
});
```

- [ ] **Step 2: Write failing route tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { createChatHandler } from "./chat";

describe("createChatHandler", () => {
  it("returns an assistant message with a panel when the agent output includes uiIntent", async () => {
    const handler = createChatHandler({
      sendMessage: vi.fn().mockResolvedValue({
        info: { id: "assistant-1" },
        parts: [
          {
            id: "part-1",
            sessionID: "session-1",
            messageID: "assistant-1",
            type: "text",
            text: "{\"replyText\":\"Please fill in this form.\",\"uiIntent\":{\"type\":\"form\",\"title\":\"Booking\",\"submitLabel\":\"Submit\",\"submitAction\":\"submit_booking\",\"fields\":[{\"name\":\"partySize\",\"label\":\"Party Size\",\"inputType\":\"text\"}]}}",
          },
        ],
      }),
    });

    const json = vi.fn();
    await handler(
      { body: { sessionId: "session-1", text: "book" } } as never,
      { json } as never,
    );

    expect(json).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run adapter tests to verify they fail**

Run: `npm run test --workspace @demo/adapter`

Expected: FAIL because the adapter source files do not exist yet

- [ ] **Step 4: Implement the Opencode client**

```ts
import type { OpencodeResponse, TextPart } from "@demo/shared";

export interface OpencodeClient {
  sendMessage(input: {
    sessionId: string;
    messageId: string;
    text: string;
  }): Promise<OpencodeResponse>;
}

export function createOpencodeClient(config: {
  baseUrl: string;
  agent?: string;
  system: string;
}): OpencodeClient {
  return {
    async sendMessage({ sessionId, messageId, text }) {
      const part: TextPart = {
        id: `${messageId}-part`,
        sessionID: sessionId,
        messageID: messageId,
        type: "text",
        text,
      };

      const response = await fetch(`${config.baseUrl}/session/${sessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageID: messageId,
          agent: config.agent,
          system: config.system,
          parts: [part],
        }),
      });

      return (await response.json()) as OpencodeResponse;
    },
  };
}
```

- [ ] **Step 5: Implement agent text extraction and parsing**

```ts
import {
  agentStructuredResponseSchema,
  type AgentStructuredResponse,
  type OpencodeResponse,
} from "@demo/shared";

export function extractTextParts(response: OpencodeResponse): string[] {
  return response.parts
    .filter((part): part is { type: "text"; text: string } => {
      return typeof part === "object" && part !== null && part.type === "text" && typeof part.text === "string";
    })
    .map((part) => part.text);
}

export function parseAgentStructuredText(textParts: string[]): AgentStructuredResponse {
  const combined = textParts.join("\n").trim();

  try {
    return agentStructuredResponseSchema.parse(JSON.parse(combined));
  } catch {
    return {
      replyText: combined || "The assistant returned no text output.",
    };
  }
}
```

- [ ] **Step 6: Implement normalized demo message creation**

```ts
import { buildFormSurface, type AgentStructuredResponse, type DemoMessage, type OpencodeResponse } from "@demo/shared";

export function buildAssistantDemoMessage(input: {
  sessionId: string;
  parsed: AgentStructuredResponse;
  response: OpencodeResponse;
  panelMode: "interactive" | "readonly";
}): DemoMessage {
  const { sessionId, parsed, response, panelMode } = input;
  const messageId = String((response.info as { id?: string })?.id ?? crypto.randomUUID());

  return {
    id: messageId,
    sessionId,
    role: "assistant",
    createdAt: Date.now(),
    displayText: parsed.replyText,
    raw: {
      info: response.info,
      parts: response.parts,
    },
    panel: parsed.uiIntent
      ? {
          source: "a2ui",
          messages: buildFormSurface(`surface-${messageId}`, parsed.uiIntent),
        }
      : undefined,
    panelMode,
  };
}
```

- [ ] **Step 7: Implement the chat and panel-action routes**

```ts
import type { Request, Response } from "express";
import type { ChatTurnRequest, ChatTurnResponse } from "@demo/shared";
import { extractTextParts, parseAgentStructuredText } from "../services/agent-output";
import { buildAssistantDemoMessage } from "../services/demo-message";

export function createChatHandler(deps: {
  sendMessage: (input: { sessionId: string; messageId: string; text: string }) => Promise<any>;
}) {
  return async function chatHandler(
    req: Request<unknown, unknown, ChatTurnRequest>,
    res: Response<ChatTurnResponse>,
  ) {
    const userMessageId = crypto.randomUUID();
    const response = await deps.sendMessage({
      sessionId: req.body.sessionId,
      messageId: userMessageId,
      text: JSON.stringify({
        kind: "chat",
        userMessage: req.body.text,
        uiPolicy: {
          allowForm: true,
          allowedActions: ["submit_booking", "confirm_selection"],
          maxFields: 6,
          supportedInputTypes: ["text"],
        },
      }),
    });

    const parsed = parseAgentStructuredText(extractTextParts(response));

    res.json({
      sessionId: req.body.sessionId,
      userMessage: {
        id: userMessageId,
        sessionId: req.body.sessionId,
        role: "user",
        createdAt: Date.now(),
        displayText: req.body.text,
      },
      assistantMessage: buildAssistantDemoMessage({
        sessionId: req.body.sessionId,
        parsed,
        response,
        panelMode: "interactive",
      }),
    });
  };
}
```

- [ ] **Step 8: Implement the Express server**

```ts
import express from "express";
import { createOpencodeClient } from "./services/opencode-client";
import { createChatHandler } from "./routes/chat";
import { createPanelActionHandler } from "./routes/panel-action";

const app = express();
app.use(express.json());

const client = createOpencodeClient({
  baseUrl: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
  agent: process.env.OPENCODE_AGENT,
  system: process.env.OPENCODE_SYSTEM_PROMPT ?? "Return valid JSON only.",
});

app.post("/api/chat", createChatHandler({ sendMessage: client.sendMessage }));
app.post("/api/panel-action", createPanelActionHandler({ sendMessage: client.sendMessage }));

app.listen(3000, () => {
  console.log("Adapter listening on http://localhost:3000");
});
```

- [ ] **Step 9: Run adapter tests to verify they pass**

Run: `npm run test --workspace @demo/adapter`

Expected: PASS with parsing and route coverage green

- [ ] **Step 10: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/adapter
git commit -m "feat: add opencode adapter for vue chat panel demo"
```

## Task 4: Implement the Vue chat shell and message state

**Files:**
- Create: `demo/opencode-vue-chat-panel/apps/web/src/main.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/App.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/styles.css`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/ChatPage.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/MessageList.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/AssistantMessageCard.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/OpencodePartsView.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/Composer.vue`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/store/chat-store.test.ts`

- [ ] **Step 1: Write the failing chat store test**

```ts
import { describe, expect, it } from "vitest";
import { createChatStore } from "./chat-store";

describe("createChatStore", () => {
  it("marks older panels readonly when a new interactive panel is appended", () => {
    const store = createChatStore();

    store.appendAssistantMessage({
      id: "a1",
      sessionId: "s1",
      role: "assistant",
      createdAt: 1,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    });

    store.appendAssistantMessage({
      id: "a2",
      sessionId: "s1",
      role: "assistant",
      createdAt: 2,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    });

    expect(store.messages[0]?.panelMode).toBe("readonly");
    expect(store.messages[1]?.panelMode).toBe("interactive");
  });
});
```

- [ ] **Step 2: Run web tests to verify they fail**

Run: `npm run test --workspace @demo/web`

Expected: FAIL because the chat store and Vue files do not exist yet

- [ ] **Step 3: Implement the chat store**

```ts
import { reactive } from "vue";
import type { DemoMessage } from "@demo/shared";

export function createChatStore() {
  const state = reactive({
    sessionId: "demo-session",
    pending: false,
    messages: [] as DemoMessage[],
  });

  function appendAssistantMessage(message: DemoMessage) {
    for (const existing of state.messages) {
      if (existing.role === "assistant" && existing.panelMode === "interactive") {
        existing.panelMode = "readonly";
      }
    }
    state.messages.push(message);
  }

  function appendTurn(userMessage: DemoMessage, assistantMessage: DemoMessage) {
    state.messages.push(userMessage);
    appendAssistantMessage(assistantMessage);
  }

  return {
    state,
    messages: state.messages,
    appendAssistantMessage,
    appendTurn,
  };
}
```

- [ ] **Step 4: Implement the shell Vue entrypoints**

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";

createApp(App).mount("#app");
```

```vue
<script setup lang="ts">
import ChatPage from "./modules/chat/components/ChatPage.vue";
</script>

<template>
  <ChatPage />
</template>
```

- [ ] **Step 5: Implement the chat UI shell**

```vue
<script setup lang="ts">
import { createChatStore } from "../store/chat-store";
import MessageList from "./MessageList.vue";
import Composer from "./Composer.vue";

const store = createChatStore();
</script>

<template>
  <main class="chat-page">
    <header class="chat-page__header">
      <h1>Opencode Vue Chat Panel</h1>
      <p>Session: {{ store.state.sessionId }}</p>
    </header>
    <MessageList :messages="store.messages" />
    <Composer />
  </main>
</template>
```

- [ ] **Step 6: Run the chat store test to verify it passes**

Run: `npm run test --workspace @demo/web -- chat-store.test.ts`

Expected: PASS with read-only panel transition verified

- [ ] **Step 7: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web/src/main.ts demo/opencode-vue-chat-panel/apps/web/src/App.vue demo/opencode-vue-chat-panel/apps/web/src/styles.css demo/opencode-vue-chat-panel/apps/web/src/modules/chat
git commit -m "feat: add vue chat shell for opencode demo"
```

## Task 5: Implement the A2UI renderer and panel submission flow

**Files:**
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiNodeRenderer.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/registry/registry.ts`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiColumn.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiRow.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiText.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiTextField.vue`
- Create: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/widgets/A2uiButton.vue`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/AssistantMessageCard.vue`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/composables/useA2uiSurface.test.ts`
- Test: `demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui/components/A2uiRenderer.test.ts`

- [ ] **Step 1: Write the failing surface composable and renderer tests**

```ts
import { describe, expect, it } from "vitest";
import { useA2uiSurface } from "./useA2uiSurface";

describe("useA2uiSurface", () => {
  it("returns merged form data when building an action payload", () => {
    const surface = useA2uiSurface([
      {
        version: "v0.9",
        createSurface: { surfaceId: "surface-1", catalogId: "catalog" },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "surface-1",
          components: [
            { id: "root", component: "Column", children: ["field-partySize", "submit-button"] },
            { id: "field-partySize", component: "TextField", label: "Party Size", value: { path: "/partySize" } },
            { id: "submit-button", component: "Button", child: "submit-text", action: { event: { name: "submit_booking" } } },
            { id: "submit-text", component: "Text", text: "Submit" },
          ],
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "surface-1",
          path: "/",
          value: { partySize: "2" },
        },
      },
    ]);

    surface.setDraftValue("partySize", "4");

    expect(surface.buildActionPayload(surface.getNode("submit-button")!)).toMatchObject({
      actionName: "submit_booking",
      formData: { partySize: "4" },
    });
  });
});
```

- [ ] **Step 2: Run web tests to verify they fail**

Run: `npm run test --workspace @demo/web -- useA2uiSurface.test.ts`

Expected: FAIL because the renderer files do not exist yet

- [ ] **Step 3: Implement the A2UI surface composable**

```ts
import { computed, reactive } from "vue";
import type { A2uiComponentNode, A2uiServerMessage } from "@demo/shared";

function pathToKey(path: string) {
  return path.replace(/^\//, "");
}

export function useA2uiSurface(messages: A2uiServerMessage[]) {
  const state = reactive({
    surfaceId: "",
    catalogId: "",
    components: {} as Record<string, A2uiComponentNode>,
    dataModel: {} as Record<string, unknown>,
    formDraft: {} as Record<string, unknown>,
  });

  for (const message of messages) {
    if ("createSurface" in message) {
      state.surfaceId = message.createSurface.surfaceId;
      state.catalogId = message.createSurface.catalogId;
    }
    if ("updateComponents" in message) {
      state.components = Object.fromEntries(
        message.updateComponents.components.map((node) => [node.id, node]),
      );
    }
    if ("updateDataModel" in message) {
      state.dataModel = { ...message.updateDataModel.value };
      state.formDraft = {};
    }
  }

  return {
    state,
    rootNode: computed(() => state.components.root),
    getNode(id: string) {
      return state.components[id];
    },
    getValue(ref?: { path: string } | string) {
      if (!ref) return undefined;
      if (typeof ref === "string") return ref;
      const key = pathToKey(ref.path);
      return key in state.formDraft ? state.formDraft[key] : state.dataModel[key];
    },
    setDraftValue(name: string, value: unknown) {
      state.formDraft[name] = value;
    },
    buildActionPayload(node: A2uiComponentNode) {
      return {
        surfaceId: state.surfaceId,
        componentId: node.id,
        actionName: node.action?.event.name ?? "submit_booking",
        formData: {
          ...state.dataModel,
          ...state.formDraft,
        },
      };
    },
  };
}
```

- [ ] **Step 4: Implement the registry and widget components**

```ts
import A2uiColumn from "../widgets/A2uiColumn.vue";
import A2uiRow from "../widgets/A2uiRow.vue";
import A2uiText from "../widgets/A2uiText.vue";
import A2uiTextField from "../widgets/A2uiTextField.vue";
import A2uiButton from "../widgets/A2uiButton.vue";

export const registry = {
  Column: A2uiColumn,
  Row: A2uiRow,
  Text: A2uiText,
  TextField: A2uiTextField,
  Button: A2uiButton,
} as const;
```

```vue
<script setup lang="ts">
import A2uiNodeRenderer from "../components/A2uiNodeRenderer.vue";
defineProps<{ node: { children?: string[] } }>();
</script>

<template>
  <div class="a2ui-column">
    <A2uiNodeRenderer v-for="childId in node.children ?? []" :key="childId" :node-id="childId" />
  </div>
</template>
```

- [ ] **Step 5: Implement the renderer container and node renderer**

```vue
<script setup lang="ts">
import { provide } from "vue";
import { useA2uiSurface } from "../composables/useA2uiSurface";
import A2uiNodeRenderer from "./A2uiNodeRenderer.vue";
import type { A2uiServerMessage } from "@demo/shared";

const props = defineProps<{
  messages: A2uiServerMessage[];
  readonly?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { surfaceId: string; componentId: string; actionName: string; formData: Record<string, unknown> }];
}>();

const surface = useA2uiSurface(props.messages);
provide("a2uiSurface", surface);
provide("a2uiReadonly", props.readonly ?? false);
provide("a2uiSubmit", (payload: ReturnType<typeof surface.buildActionPayload>) => emit("submit", payload));
</script>

<template>
  <A2uiNodeRenderer v-if="surface.rootNode" :node-id="surface.rootNode.id" />
</template>
```

- [ ] **Step 6: Wire the panel into assistant message rendering**

```vue
<script setup lang="ts">
import A2uiRenderer from "../../a2ui/components/A2uiRenderer.vue";
import type { DemoMessage } from "@demo/shared";

defineProps<{
  message: DemoMessage;
}>();
</script>

<template>
  <article class="assistant-message-card">
    <p v-if="message.displayText" class="assistant-message-card__text">
      {{ message.displayText }}
    </p>
    <A2uiRenderer
      v-if="message.panel"
      :messages="message.panel.messages"
      :readonly="message.panelMode === 'readonly'"
    />
  </article>
</template>
```

- [ ] **Step 7: Run renderer tests to verify they pass**

Run: `npm run test --workspace @demo/web`

Expected: PASS with surface state and rendering tests green

- [ ] **Step 8: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web/src/modules/a2ui demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/AssistantMessageCard.vue
git commit -m "feat: add a2ui renderer for opencode vue chat panel demo"
```

## Task 6: Connect the composer and panel actions to the adapter, then document the demo

**Files:**
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/ChatPage.vue`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/Composer.vue`
- Modify: `demo/opencode-vue-chat-panel/apps/web/src/modules/chat/components/AssistantMessageCard.vue`
- Create: `demo/opencode-vue-chat-panel/README.md`

- [ ] **Step 1: Write the failing integration-oriented store test**

```ts
import { describe, expect, it } from "vitest";
import { createChatStore } from "../store/chat-store";

describe("chat action flow", () => {
  it("marks the current panel readonly before appending the next assistant message", () => {
    const store = createChatStore();
    store.appendAssistantMessage({
      id: "a1",
      sessionId: "s1",
      role: "assistant",
      createdAt: 1,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    });

    store.messages[0]!.panelMode = "readonly";
    store.appendAssistantMessage({
      id: "a2",
      sessionId: "s1",
      role: "assistant",
      createdAt: 2,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    });

    expect(store.messages.map((message) => message.panelMode)).toEqual(["readonly", "interactive"]);
  });
});
```

- [ ] **Step 2: Implement chat submission from the composer**

```vue
<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  submit: [text: string];
}>();

const value = ref("");

function onSubmit() {
  const text = value.value.trim();
  if (!text) return;
  emit("submit", text);
  value.value = "";
}
</script>

<template>
  <form class="composer" @submit.prevent="onSubmit">
    <input v-model="value" placeholder="Send a message" />
    <button type="submit">Send</button>
  </form>
</template>
```

- [ ] **Step 3: Implement API calls in the chat page**

```vue
<script setup lang="ts">
import { createChatStore } from "../store/chat-store";
import MessageList from "./MessageList.vue";
import Composer from "./Composer.vue";

const store = createChatStore();

async function sendChat(text: string) {
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: store.state.sessionId,
      text,
    }),
  });

  const result = await response.json();
  store.appendTurn(result.userMessage, result.assistantMessage);
}
</script>
```

- [ ] **Step 4: Implement panel action submission**

```vue
<script setup lang="ts">
import A2uiRenderer from "../../a2ui/components/A2uiRenderer.vue";
import type { DemoMessage } from "@demo/shared";

const props = defineProps<{
  message: DemoMessage;
}>();

const emit = defineEmits<{
  panelAction: [payload: { sourceMessageId: string; surfaceId: string; componentId: string; actionName: string; formData: Record<string, unknown> }];
}>();
</script>

<template>
  <article class="assistant-message-card">
    <p v-if="message.displayText">{{ message.displayText }}</p>
    <A2uiRenderer
      v-if="message.panel"
      :messages="message.panel.messages"
      :readonly="message.panelMode === 'readonly'"
      @submit="(payload) => emit('panelAction', { sourceMessageId: message.id, ...payload })"
    />
  </article>
</template>
```

- [ ] **Step 5: Add README run instructions**

````md
# Opencode Vue Chat Panel Demo

## Prerequisites

- Node.js 20+
- Access to a running Opencode HTTP server

## Run

```bash
cd demo/opencode-vue-chat-panel
npm install
OPENCODE_BASE_URL=http://localhost:4096 npm run dev:adapter
```

In another terminal:

```bash
cd demo/opencode-vue-chat-panel
npm run dev:web
```

Open `http://localhost:5174`.
````

- [ ] **Step 6: Run the full test suite**

Run: `npm test`

Expected: PASS across `@demo/shared`, `@demo/adapter`, and `@demo/web`

- [ ] **Step 7: Run a manual smoke test**

Run: `npm run dev:adapter`

Expected: adapter listens on `http://localhost:3000`

Run: `npm run dev:web`

Expected: web app listens on `http://localhost:5174`

Manual check:
- send a chat message
- verify assistant response appears
- verify a panel renders when structured output is returned
- submit panel
- verify old panel becomes read-only and a new assistant message appears

- [ ] **Step 8: Commit**

```bash
git add demo/opencode-vue-chat-panel/apps/web demo/opencode-vue-chat-panel/README.md
git commit -m "feat: connect opencode vue chat panel demo end to end"
```

## Self-Review

### Spec coverage

- Independent full-stack TS demo: covered by Tasks 1 through 6
- Real Opencode integration: covered by Task 3
- Vue chat UI and panel rendering: covered by Tasks 4 and 5
- Historical read-only panels: covered by Tasks 4, 5, and 6
- A2UI v0.9-compatible subset: covered by Task 2 and Task 5
- Adapter-only Opencode boundary: covered by Task 3 and Task 6

No uncovered spec requirement remains.

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation notes remain.
- Each task includes explicit files, commands, and concrete code snippets.

### Type consistency

- `DemoMessage`, `AgentStructuredResponse`, `A2uiServerMessage`, and route request types are defined in `@demo/shared` before being consumed elsewhere.
- Supported action names remain limited to `"submit_booking"` and `"confirm_selection"` across schemas, builder logic, and renderer behavior.
