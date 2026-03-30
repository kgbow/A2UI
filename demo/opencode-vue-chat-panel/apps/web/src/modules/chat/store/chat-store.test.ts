import { describe, expect, it } from "vitest";
import { createChatStore } from "./chat-store.js";
import type { DemoMessage } from "@demo/shared";

describe("createChatStore", () => {
  it("marks older panels readonly when a new interactive panel is appended", () => {
    const store = createChatStore();

    const msg1: DemoMessage = {
      id: "a1",
      sessionId: "s1",
      role: "assistant",
      createdAt: 1,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    };

    const msg2: DemoMessage = {
      id: "a2",
      sessionId: "s1",
      role: "assistant",
      createdAt: 2,
      panelMode: "interactive",
      panel: { source: "a2ui", messages: [] },
    };

    store.appendAssistantMessage(msg1);
    store.appendAssistantMessage(msg2);

    expect(store.messages[0]?.panelMode).toBe("readonly");
    expect(store.messages[1]?.panelMode).toBe("interactive");
  });
});
