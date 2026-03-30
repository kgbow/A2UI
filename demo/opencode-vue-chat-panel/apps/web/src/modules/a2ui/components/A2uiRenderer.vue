<script setup lang="ts">
import { provide } from "vue";
import { useA2uiSurface } from "../composables/useA2uiSurface";
import A2uiNodeRenderer from "./A2uiNodeRenderer.vue";
import type { A2uiServerMessage } from "@demo/shared";

export interface A2uiSubmitPayload {
  surfaceId: string;
  componentId: string;
  actionName: string;
  formData: Record<string, unknown>;
}

const props = defineProps<{
  messages: A2uiServerMessage[];
  readonly?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: A2uiSubmitPayload];
}>();

const surface = useA2uiSurface(props.messages);

provide("a2uiSurface", surface);
provide("a2uiReadonly", props.readonly ?? false);
provide("a2uiSubmit", (payload: A2uiSubmitPayload) => emit("submit", payload));
</script>

<template>
  <div class="a2ui-panel" :class="{ 'a2ui-panel--readonly': readonly }">
    <A2uiNodeRenderer v-if="surface.rootNode" :node-id="surface.rootNode.id" />
  </div>
</template>
