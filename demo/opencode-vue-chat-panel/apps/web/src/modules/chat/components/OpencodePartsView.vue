<script setup lang="ts">
defineProps<{
  parts: unknown[];
}>();
</script>

<template>
  <details class="opencode-parts">
    <summary>Raw Parts ({{ parts.length }})</summary>
    <pre>{{ JSON.stringify(parts, null, 2) }}</pre>
  </details>
</template>
