<script setup lang="ts">
import { inject } from "vue";
import type { A2uiComponentNode } from "@demo/shared";
import { useA2uiSurface } from "../composables/useA2uiSurface";
import type { A2uiSubmitPayload } from "../components/A2uiRenderer.vue";

const props = defineProps<{
  node: A2uiComponentNode;
}>();

const surface = inject<ReturnType<typeof useA2uiSurface>>("a2uiSurface")!;
const readonly = inject<boolean>("a2uiReadonly", false);
const onSubmit = inject<(payload: A2uiSubmitPayload) => void>("a2uiSubmit");

function handleClick() {
  if (readonly || !onSubmit) return;
  const payload = surface.buildActionPayload(props.node);
  onSubmit(payload);
}
</script>

<template>
  <button
    class="a2ui-button"
    :disabled="readonly"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
