<script setup lang="ts">
import { ref } from "vue";
import { createChatStore } from "../store/chat-store";
import MessageList from "./MessageList.vue";
import Composer from "./Composer.vue";
import type { DemoMessage } from "@demo/shared";

const store = createChatStore();
const pending = ref(false);

async function sendChat(text: string) {
  pending.value = true;
  try {
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
  } finally {
    pending.value = false;
  }
}

async function handlePanelAction(payload: {
  sourceMessageId: string;
  surfaceId: string;
  componentId: string;
  actionName: string;
  formData: Record<string, unknown>;
}) {
  pending.value = true;
  try {
    const response = await fetch("http://localhost:3000/api/panel-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: store.state.sessionId,
        ...payload,
      }),
    });

    const result = await response.json();
    store.appendAssistantMessage(result.assistantMessage);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main class="chat-page">
    <header class="chat-page__header">
      <h1>Opencode Vue Chat Panel</h1>
      <p>Session: {{ store.state.sessionId }}</p>
    </header>
    <MessageList
      :messages="store.messages"
      @panel-action="handlePanelAction"
    />
    <Composer :disabled="pending" @submit="sendChat" />
  </main>
</template>
