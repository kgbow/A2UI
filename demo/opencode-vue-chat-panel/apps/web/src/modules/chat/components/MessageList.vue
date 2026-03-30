<script setup lang="ts">
import type { DemoMessage } from "@demo/shared";
import AssistantMessageCard from "./AssistantMessageCard.vue";

defineProps<{
  messages: DemoMessage[];
}>();

const emit = defineEmits<{
  panelAction: [payload: {
    sourceMessageId: string;
    surfaceId: string;
    componentId: string;
    actionName: string;
    formData: Record<string, unknown>;
  }];
}>();
</script>

<template>
  <div class="message-list">
    <template v-for="message in messages" :key="message.id">
      <div v-if="message.role === 'user'" class="user-message">
        {{ message.displayText }}
      </div>
      <AssistantMessageCard
        v-else
        :message="message"
        @panel-action="(payload) => emit('panelAction', payload)"
      />
    </template>
  </div>
</template>
