<script setup lang="ts">
import { inject } from "vue";
import type { A2uiComponentNode } from "@demo/shared";
import { useA2uiSurface } from "../composables/useA2uiSurface";

const props = defineProps<{
  node: A2uiComponentNode;
}>();

const surface = inject<ReturnType<typeof useA2uiSurface>>("a2uiSurface")!;

const text = (): string => {
  const ref = props.node.text;
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return String(surface.getValue(ref) ?? "");
};
</script>

<template>
  <span class="a2ui-text">{{ text() }}</span>
</template>
