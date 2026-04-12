<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useA2uiRenderer, basicCatalog, A2uiSurface } from '@a2ui/vue'
import { examples } from './examples'

// ── Renderer ──
const { processMessages, surfaces, onAction } = useA2uiRenderer([basicCatalog])

// ── State ──
const jsonlInput = ref('')
const selectedIndex = ref(0)
const actionLog = ref<{ time: string; action: any }[]>([])
const renderError = ref('')
const isStreaming = ref(false)
const actionLogEl = ref<HTMLDivElement | null>(null)

// ── Load example ──
function loadExample(idx: number) {
  selectedIndex.value = idx
  jsonlInput.value = examples[idx].jsonl
  actionLog.value = []
  renderError.value = ''
}

// Load first example
loadExample(0)

// ── Parse + Render ──
function parseJsonl(text: string): any[] {
  const lines = text.split('\n').filter(l => l.trim())
  const messages: any[] = []
  for (const line of lines) {
    try {
      messages.push(JSON.parse(line))
    } catch {
      throw new Error(`Invalid JSON line: ${line.slice(0, 60)}...`)
    }
  }
  return messages
}

function renderAll() {
  renderError.value = ''
  actionLog.value = []
  try {
    const messages = parseJsonl(jsonlInput.value)
    processMessages(messages)
  } catch (e: any) {
    renderError.value = e.message
  }
}

async function renderStreaming() {
  renderError.value = ''
  actionLog.value = []
  isStreaming.value = true

  try {
    const messages = parseJsonl(jsonlInput.value)
    for (const msg of messages) {
      processMessages([msg])
      await nextTick()
      await new Promise(r => setTimeout(r, 400))
    }
  } catch (e: any) {
    renderError.value = e.message
  }

  isStreaming.value = false
}

// ── Action handler ──
onAction((action: any) => {
  actionLog.value.push({
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    action,
  })
  nextTick(() => {
    if (actionLogEl.value) {
      actionLogEl.value.scrollTop = actionLogEl.value.scrollHeight
    }
  })
})

// ── Computed ──
const surfaceArray = computed(() => Array.from(surfaces.value.values()))
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="header-title">A2UI Vue Renderer Demo</h1>
      <span class="header-badge">v0.9</span>
    </header>

    <div class="main">
      <!-- Left: Editor -->
      <div class="left">
        <div class="example-bar">
          <label class="example-label">示例:</label>
          <select
            class="example-select"
            :value="selectedIndex"
            @change="loadExample(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="(ex, i) in examples" :key="i" :value="i">
              {{ ex.name }}
            </option>
          </select>
        </div>
        <div class="example-desc">{{ examples[selectedIndex]?.description }}</div>

        <textarea
          class="editor"
          v-model="jsonlInput"
          spellcheck="false"
          placeholder="在此输入 JSONL 格式的 A2UI 消息（每行一条 JSON）"
        />

        <div class="controls">
          <button class="btn btn-primary" @click="renderAll" :disabled="isStreaming">
            全量渲染
          </button>
          <button class="btn btn-secondary" @click="renderStreaming" :disabled="isStreaming">
            {{ isStreaming ? '渲染中...' : '增量渲染' }}
          </button>
          <button class="btn btn-ghost" @click="jsonlInput = ''; actionLog = []; renderError = ''">
            清空
          </button>
        </div>
      </div>

      <!-- Right: Renderer + Action log -->
      <div class="right">
        <div class="render-area">
          <div v-if="renderError" class="error">{{ renderError }}</div>
          <div v-if="surfaceArray.length === 0 && !renderError" class="empty">
            在左侧输入 JSONL 消息，然后点击渲染按钮
          </div>
          <div v-for="surface in surfaceArray" :key="surface.id" class="surface-container">
            <A2uiSurface :surface="surface" />
          </div>
        </div>

        <div class="action-panel">
          <div class="action-header">
            Action 事件 <span class="action-count">{{ actionLog.length }}</span>
          </div>
          <div class="action-log" ref="actionLogEl">
            <div v-if="actionLog.length === 0" class="action-empty">
              用户交互事件会显示在这里
            </div>
            <div
              v-for="(entry, i) in actionLog"
              :key="i"
              class="action-entry"
            >
              <span class="action-time">{{ entry.time }}</span>
              <pre class="action-json">{{ JSON.stringify(entry.action, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  color: #1a1a2e;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}
.header-title { font-size: 18px; font-weight: 600; }
.header-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  font-weight: 500;
}

.main { display: flex; flex: 1; overflow: hidden; }

.left {
  width: 45%;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  background: #fff;
}

.example-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.example-label { font-size: 13px; font-weight: 600; white-space: nowrap; }
.example-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: #fafafa;
  cursor: pointer;
}
.example-desc {
  padding: 6px 16px;
  font-size: 12px;
  color: #888;
  background: #f8f8f8;
  border-bottom: 1px solid #f0f0f0;
}

.editor {
  flex: 1;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #2d2d2d;
  background: #fafbfc;
}

.controls {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.btn {
  padding: 7px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #4361ee; color: white; }
.btn-primary:hover:not(:disabled) { background: #3a56d4; }
.btn-secondary { background: #7209b7; color: white; }
.btn-secondary:hover:not(:disabled) { background: #6308a0; }
.btn-ghost { background: #f0f0f0; color: #555; }
.btn-ghost:hover:not(:disabled) { background: #e0e0e0; }

.right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.render-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f0f2f5;
}
.surface-container { max-width: 600px; margin: 0 auto; }

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
  font-size: 14px;
}
.error {
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #cf1322;
  font-size: 13px;
  font-family: monospace;
}

.action-panel {
  height: 220px;
  display: flex;
  flex-direction: column;
  border-top: 2px solid #e0e0e0;
  background: #1a1a2e;
}
.action-header {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  background: rgba(255,255,255,0.05);
}
.action-count {
  display: inline-block;
  background: #4361ee;
  color: white;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 6px;
}
.action-log { flex: 1; overflow-y: auto; padding: 8px 16px; }
.action-empty { color: #555; font-size: 12px; padding: 20px 0; text-align: center; }
.action-entry {
  margin-bottom: 6px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.action-time {
  color: #888;
  font-size: 11px;
  font-family: monospace;
  white-space: nowrap;
  padding-top: 2px;
}
.action-json {
  color: #a5d6ff;
  font-size: 11.5px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
