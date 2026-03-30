import { reactive } from "vue";
import type { DemoMessage } from "@demo/shared";

export function createChatStore() {
  const state = reactive({
    sessionId: `demo-session-${Date.now()}`,
    pending: false,
    messages: [] as DemoMessage[],
  });

  function markPanelsReadonly() {
    for (const existing of state.messages) {
      if (existing.role === "assistant" && existing.panelMode === "interactive") {
        existing.panelMode = "readonly";
      }
    }
  }

  function appendAssistantMessage(message: DemoMessage) {
    markPanelsReadonly();
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

export type ChatStore = ReturnType<typeof createChatStore>;
