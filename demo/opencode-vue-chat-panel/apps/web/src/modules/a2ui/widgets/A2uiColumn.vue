<script setup lang="ts">
import A2uiNodeRenderer from "../components/A2uiNodeRenderer.vue";
import type { A2uiComponentNode } from "@demo/shared";

defineProps<{
  node: A2uiComponentNode;
}>();
</script>

<template>
  <div class="a2ui-column">
    <A2uiNodeRenderer
      v-for="childId in node.children ?? []"
      :key="childId"
      :node-id="childId"
    />
  </div>
</template>
