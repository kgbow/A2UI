# @a2ui/vue

Vue 3 渲染器，用于渲染 [A2UI (Agent-to-User Interface)](https://a2ui.org/) v0.9 协议生成的界面。

利用 Vue 原生响应式特性 (`ref` / `watch` / `computed`)，将 `@a2ui/web_core` 的 `GenericBinder` 订阅机制桥接到 Vue 的响应式系统，不使用 signal 暴露给上层。

## 安装

```bash
npm install @a2ui/vue
# peer dependency
npm install vue@^3.3.0
```

## 快速开始

### 1. 最简用法

```vue
<script setup lang="ts">
import { useA2uiRenderer, basicCatalog, A2uiSurface } from '@a2ui/vue'

const { processMessages, surfaces, onAction } = useA2uiRenderer([basicCatalog])

// 监听用户操作
onAction((action) => {
  console.log('User action:', action)
  // 将 action 发送到你的 Agent 后端
})

// 处理从 Agent 收到的 A2UI 消息（JSONL 格式，每行一条 JSON）
function handleAgentResponse(jsonlText: string) {
  const messages = jsonlText
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
  processMessages(messages)
}
</script>

<template>
  <div v-for="surface in Array.from(surfaces.values())" :key="surface.id">
    <A2uiSurface :surface="surface" />
  </div>
</template>
```

### 2. 完整 Demo 示例

`renderers/vue/demo/` 目录包含一个可运行的示例程序：

- **左侧面板**：JSONL 编辑器 + 示例选择器
- **右侧面板**：渐进式增量渲染 A2UI 界面
- **底部面板**：Action 事件日志

```bash
cd renderers/vue/demo
npm install
npm run dev
```

## 核心 API

### `useA2uiRenderer(catalogs)`

Vue composable，封装 `MessageProcessor`，提供响应式的 A2UI 渲染状态。

```ts
import { useA2uiRenderer, basicCatalog } from '@a2ui/vue'

const {
  processMessages,  // (messages: A2uiClientMessage[]) => void — 处理 A2UI 消息
  surfaces,         // Ref<Map<string, SurfaceModel>> — 响应式的 Surface 映射
  surfaceGroup,     // SurfaceGroupModel — 底层模型，高级用法
  onAction,         // (handler) => () => void — 订阅用户操作事件
} = useA2uiRenderer([basicCatalog])
```

**参数**：
- `catalogs`: `Catalog<VueComponentImplementation>[]` — 组件目录数组，通常为 `[basicCatalog]`

**返回值**：
| 属性 | 类型 | 说明 |
|------|------|------|
| `processMessages` | `(messages) => void` | 处理来自 Agent 的 A2UI 消息列表 |
| `surfaces` | `Ref<Map<string, SurfaceModel>>` | 响应式 Surface 集合，随消息自动增删 |
| `surfaceGroup` | `SurfaceGroupModel` | 底层状态模型 |
| `onAction` | `(handler) => unsubscribe` | 订阅所有 Surface 的用户操作事件 |

### `<A2uiSurface>`

便捷组件，渲染一个完整的 A2UI Surface。

```vue
<A2uiSurface :surface="surfaceModel" />
```

**Props**：
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `surface` | `SurfaceModel<VueComponentImplementation>` | 是 | 由 `useA2uiRenderer` 提供的 Surface 模型 |

内部使用 `DeferredChild` 递归渲染组件树，未到达的组件显示 `[Loading...]` 占位符。

### `<DeferredChild>`

底层渲染组件，订阅组件的存在状态并按需渲染。

```vue
<DeferredChild
  :surface="surfaceModel"
  id="root"
  basePath="/"
/>
```

**Props**：
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `surface` | `SurfaceModel` | 是 | 所属 Surface |
| `id` | `string` | 是 | 组件 ID |
| `basePath` | `string` | 是 | 数据模型的基准路径 |

## 组件目录 (Catalog)

### `basicCatalog`

预置的 18 个基础组件，覆盖常见 UI 需求：

| 组件 | 说明 | 备注 |
|------|------|------|
| `Text` | 文本显示 | 支持 `h1`~`h6`、`body`、`caption`、`body` (markdown) 变体 |
| `Image` | 图片 | 支持 URL 和 base64 |
| `Icon` | 图标 | 支持 Material Icon 名称和 SVG path 对象 |
| `Video` | 视频 | |
| `AudioPlayer` | 音频播放器 | |
| `Row` | 水平布局 | `align`、`justify` 控制对齐 |
| `Column` | 垂直布局 | `align`、`justify` 控制对齐 |
| `List` | 列表 | 支持静态和模板（数据驱动）两种模式 |
| `Card` | 卡片容器 | |
| `Tabs` | 标签页 | |
| `Divider` | 分割线 | |
| `Modal` | 模态框 | 使用 Vue `Teleport` 到 body |
| `Button` | 按钮 | 支持 `primary`、`secondary`、`outlined` 变体，带 Action 事件 |
| `TextField` | 文本输入 | 支持验证规则 (`checks`) |
| `CheckBox` | 复选框 | |
| `ChoicePicker` | 选择器 | 支持 `chips` 样式、`mutuallyExclusive` 单选模式 |
| `Slider` | 滑块 | |
| `DateTimeInput` | 日期时间输入 | |

## 自定义组件

### 使用 `createComponentImplementation`

将一个 Vue 组件注册为 A2UI 组件，自动获得数据绑定和 Action 解析：

```ts
import { createComponentImplementation, type VueA2uiComponentProps } from '@a2ui/vue'
import { TextApi } from '@a2ui/web_core/v0_9/basic_catalog'
import { defineComponent, h } from 'vue'

const MyTextRender = defineComponent({
  name: 'MyTextRender',
  props: {
    props: Object,
    buildChild: Function,
    context: Object,
  },
  setup(props: VueA2uiComponentProps<{ text: string; variant?: string }>) {
    return () => h('span', { class: `text-${props.props.variant || 'body'}` }, props.props.text)
  },
})

const myTextImpl = createComponentImplementation(TextApi, MyTextRender)
```

### 使用 `createBinderlessComponentImplementation`

对于需要自定义绑定逻辑的组件（如纯展示组件）：

```ts
import { createBinderlessComponentImplementation } from '@a2ui/vue'

const myImpl = createBinderlessComponentImplementation(SomeApi, MyVueComponent)
```

### 组装自定义 Catalog

```ts
import { Catalog } from '@a2ui/vue'
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog'

const myCatalog = new Catalog(
  'https://example.com/my-catalog.json',
  [
    myTextImpl,
    // ... 其他组件实现
  ],
  BASIC_FUNCTIONS, // 可选：内置验证函数
)
```

## 增量渲染

A2UI 协议天然支持增量更新。每条 JSONL 消息独立处理，可以逐条发送实现渐进式渲染：

```ts
// 逐条处理消息，每条之间有延迟
for (const message of messages) {
  processMessages([message])
  await nextTick()
  await new Promise(r => setTimeout(r, 400))
}
```

典型流程：
1. `createSurface` — 创建 Surface
2. `updateComponents` — 定义组件树（可多次，后续消息替换/新增组件）
3. `updateDataModel` — 填充数据（可在组件定义之前或之后）
4. 用户交互 → `onAction` 回调 → 发送到 Agent → Agent 回复新消息 → 回到步骤 2/3

## 消息格式示例

### Hello World

```jsonl
{"version":"v0.9","createSurface":{"surfaceId":"hello","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}
{"version":"v0.9","updateComponents":{"surfaceId":"hello","components":[{"id":"root","component":"Card","child":"col"},{"id":"col","component":"Column","children":["title","body"]},{"id":"title","component":"Text","text":"Hello!","variant":"h2"},{"id":"body","component":"Text","text":"Welcome to A2UI.","variant":"body"}]}}
```

### 带数据绑定的航班状态

```jsonl
{"version":"v0.9","createSurface":{"surfaceId":"flight","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json","sendDataModel":true}}
{"version":"v0.9","updateComponents":{"surfaceId":"flight","components":[{"id":"root","component":"Card","child":"col"},{"id":"col","component":"Column","children":["number","route"],"align":"stretch"},{"id":"number","component":"Text","text":{"path":"/flightNumber"},"variant":"h3"},{"id":"route","component":"Row","children":["origin","arrow","dest"],"align":"center"},{"id":"origin","component":"Text","text":{"path":"/origin"},"variant":"h2"},{"id":"arrow","component":"Text","text":"→","variant":"h2"},{"id":"dest","component":"Text","text":{"path":"/destination"},"variant":"h2"}]}}
{"version":"v0.9","updateDataModel":{"surfaceId":"flight","value":{"flightNumber":"CA 981","origin":"北京","destination":"纽约"}}}
```

## 架构：Vue 适配层

```
┌─────────────────────────────────────────────────────────┐
│  Vue Application                                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  useA2uiRenderer([basicCatalog])                  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  MessageProcessor (web_core)                │  │  │
│  │  │  processMessages → SurfaceGroupModel        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │          │                                        │  │
│  │          ▼ onSurfaceCreated / onSurfaceDeleted    │  │
│  │  surfaces: Ref<Map<string, SurfaceModel>>         │  │
│  └───────────────────────────────────────────────────┘  │
│          │                                              │
│          ▼                                              │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │  <A2uiSurface>       │  │  onAction handler      │  │
│  │  ┌────────────────┐  │  │                        │  │
│  │  │ DeferredChild  │  │  │  用户点击按钮 →        │  │
│  │  │  ┌───────────┐ │  │  │  action → Agent 后端  │  │
│  │  │  │ Resolved  │ │  │  │                        │  │
│  │  │  │  Child    │ │  │  └────────────────────────┘  │
│  │  │  └───────────┘ │  │                              │
│  │  └────────────────┘  │                              │
│  └──────────────────────┘                              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  createComponentImplementation (adapter.ts)       │  │
│  │                                                   │  │
│  │  GenericBinder.subscribe(callback)                │  │
│  │       │                                           │  │
│  │       ▼ Vue ref() + watch() bridge                │  │
│  │  resolvedProps: Ref<ResolvedProps>                │  │
│  │       │                                           │  │
│  │       ▼                                           │  │
│  │  RenderComponent (你的 Vue 组件)                   │  │
│  │    receives: { props, buildChild, context }        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 关键桥接机制

**adapter.ts** 是核心适配层，将 `web_core` 的订阅式 `GenericBinder` 桥接到 Vue 响应式：

1. **`GenericBinder.subscribe()` → `ref()`**：Binder 的属性变更回调直接写入 Vue `ref`
2. **`watch(() => props.context)`**：监听 context 对象引用变化，自动重建 binder
3. **初始快照同步**：`binder.snapshot` 解决 `subscribe()` 首次通知丢失的竞态问题

```ts
// adapter.ts 核心逻辑（简化）
function createBinder(ctx) {
  binder = new GenericBinder(ctx, api.schema)
  subscription = binder.subscribe(newProps => {
    resolvedProps.value = {...newProps}  // → 触发 Vue 响应式更新
  })
  // 同步初始快照
  const snapshot = binder.snapshot
  if (snapshot) resolvedProps.value = {...snapshot}
}

createBinder(props.context)                    // 初始化
watch(() => props.context, createBinder)       // context 变化时重建
onUnmounted(() => { binder.dispose() })        // 清理
```

## TypeScript 类型

```ts
import type {
  VueComponentImplementation,   // 组件实现类型（含 Vue Component）
  VueA2uiComponentProps,        // 组件 props 类型
  ResolveVueProps,              // 从 Api 推导完整 props 类型
} from '@a2ui/vue'

// 从 web_core 重导出的类型
import type {
  ComponentContext,
  SurfaceModel,
  SurfaceGroupModel,
  ComponentModel,
  A2uiClientMessage,
} from '@a2ui/vue'
```

## 构建与开发

```bash
# 安装依赖
npm install

# 构建（ESM + CJS + .d.ts）
npm run build

# 开发模式（监听变化）
npm run dev

# 类型检查
npm run typecheck
```

构建产物：
- `dist/index.js` / `dist/index.cjs` — 主入口
- `dist/v0_9/index.js` / `dist/v0_9/index.cjs` — v0.9 入口
- `dist/*.d.ts` — TypeScript 类型声明

## 依赖关系

```
@a2ui/vue
├── vue (peer) ^3.3.0
├── @a2ui/web_core ^0.9.0
│   ├── @preact/signals-core  ← 内部使用，不暴露给 Vue 层
│   ├── zod                    ← Schema 验证
│   └── date-fns               ← 日期格式化函数
└── markdown-it ^14.0.0        ← Text body 变体的 Markdown 渲染
```

## License

Apache-2.0
