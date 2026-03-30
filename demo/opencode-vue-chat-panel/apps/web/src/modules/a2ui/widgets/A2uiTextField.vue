<script setup lang="ts">
import { inject, computed } from "vue";
import type { A2uiComponentNode } from "@demo/shared";
import { useA2uiSurface } from "../composables/useA2uiSurface";

const props = defineProps<{
  node: A2uiComponentNode;
}>();

const surface = inject<ReturnType<typeof useA2uiSurface>>("a2uiSurface")!;
const readonly = inject<boolean>("a2uiReadonly", false);

const fieldKey = computed(() => {
  const path = props.node.value?.path;
  return path ? path.replace(/^\//, "") : "";
});

const fieldValue = computed({
  get: () => {
    return String(surface.getValue(props.node.value) ?? "");
  },
  set: (val: string) => {
    if (fieldKey.value) {
      surface.setDraftValue(fieldKey.value, val);
    }
  },
});
</script>

<template>
  <div class="a2ui-textfield">
    <label v-if="node.label">{{ node.label }}</label>
    <input
      v-model="fieldValue"
      :disabled="readonly"
      type="text"
    />
  </div>
</template>
