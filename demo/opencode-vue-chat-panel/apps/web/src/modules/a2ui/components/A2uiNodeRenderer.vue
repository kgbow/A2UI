<script setup lang="ts">
import { inject } from "vue";
import { registry } from "../registry/registry";
import { useA2uiSurface } from "../composables/useA2uiSurface";
import type { A2uiComponentNode } from "@demo/shared";

const props = defineProps<{
  nodeId: string;
}>();

const surface = inject<ReturnType<typeof useA2uiSurface>>("a2uiSurface");

const node = (): A2uiComponentNode | undefined => {
  return surface?.getNode(props.nodeId);
};
</script>

<template>
  <component
    v-if="node()"
    :is="registry[node()!.component]"
    :node="node()"
  />
  <div v-else class="a2ui-node-not-found">
    Node not found: {{ nodeId }}
  </div>
</template>
