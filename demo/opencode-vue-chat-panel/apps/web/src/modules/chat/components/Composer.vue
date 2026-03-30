<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [text: string];
}>();

const value = ref("");

function onSubmit() {
  const text = value.value.trim();
  if (!text) return;
  emit("submit", text);
  value.value = "";
}
</script>

<template>
  <form class="composer" @submit.prevent="onSubmit">
    <input
      v-model="value"
      :disabled="disabled"
      placeholder="Send a message"
    />
    <button type="submit" :disabled="disabled || !value.trim()">
      Send
    </button>
  </form>
</template>
