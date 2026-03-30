<script setup lang="ts">
import A2uiRenderer from "../../a2ui/components/A2uiRenderer.vue";
import OpencodePartsView from "./OpencodePartsView.vue";
import type { DemoMessage } from "@demo/shared";

const props = defineProps<{
  message: DemoMessage;
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

function handleSubmit(payload: {
  surfaceId: string;
  componentId: string;
  actionName: string;
  formData: Record<string, unknown>;
}) {
  emit("panelAction", {
    sourceMessageId: props.message.id,
    ...payload,
  });
}
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
      @submit="handleSubmit"
    />
    <OpencodePartsView
      v-if="message.raw"
      :parts="message.raw.parts"
    />
  </article>
</template>
