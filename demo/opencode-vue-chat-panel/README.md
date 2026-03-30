# Opencode Vue Chat Panel Demo

一个独立的全栈 TypeScript 示例项目，用来验证下面这条链路：

`Vue 聊天界面 -> TS adapter -> Opencode HTTP session API -> A2UI v0.9 子集面板`

这个 demo 的目标不是完整实现 A2UI，也不是让 Opencode 直接自由输出完整协议，而是验证一条更可控的落地方式：

- 前端只渲染一个受控的 A2UI 子集
- adapter 负责协议边界和结构转换
- Opencode 继续作为通用 agent 使用

## 项目目标

这个 demo 主要验证 3 件事：

1. 真实 Opencode session 能否驱动聊天中的动态面板
2. Vue 能否用自定义组件渲染一个贴近 A2UI v0.9 的最小子集
3. 历史消息中的面板能否保留展示，同时只有最新面板可交互

## 架构概览

```text
Vue Web App -> Adapter API -> Opencode /session/:id/message
             <- Adapter API <-
```

职责分工是固定的：

- `apps/web`
  只负责聊天 UI、消息状态、A2UI 面板渲染
- `apps/adapter`
  只负责调用 Opencode、提取文本输出、生成受控 A2UI payload
- `packages/shared`
  放前后端共享类型、schema、builder

关键原则：

- 前端不直接调用 Opencode
- 前端不直接消费 Opencode 原始输出作为 UI
- adapter 是协议边界

## 目录导览

```text
demo/opencode-vue-chat-panel/
  package.json
  tsconfig.base.json
  vitest.config.ts
  README.md
  apps/
    adapter/
      src/
        app.ts
        config.ts
        lib/
          id.ts
        routes/
          chat.ts
          panel-action.ts
        services/
          agent-output.ts
          demo-message.ts
          opencode-client.ts
    web/
      src/
        App.vue
        main.ts
        styles.css
        modules/
          chat/
            components/
              ChatPage.vue
              MessageList.vue
              AssistantMessageCard.vue
              Composer.vue
              OpencodePartsView.vue
            store/
              chat-store.ts
          a2ui/
            components/
              A2uiRenderer.vue
              A2uiNodeRenderer.vue
            composables/
              useA2uiSurface.ts
            registry/
              registry.ts
            widgets/
              A2uiColumn.vue
              A2uiRow.vue
              A2uiText.vue
              A2uiTextField.vue
              A2uiButton.vue
  packages/
    shared/
      src/
        builders/
          a2ui.ts
        schemas/
          agent.ts
          a2ui.ts
        types/
          agent.ts
          a2ui.ts
          api.ts
          opencode.ts
        index.ts
```

## 从哪里开始读代码

如果你第一次进入这个 demo，建议按这个顺序看：

1. `packages/shared/src/types/api.ts`
   看 demo 自己对前后端通信定义了什么
2. `packages/shared/src/types/agent.ts`
   看 adapter 希望 agent 输出什么结构
3. `packages/shared/src/builders/a2ui.ts`
   看中间结构是怎么变成 A2UI 消息数组的
4. `apps/adapter/src/routes/chat.ts`
   看普通聊天请求怎么映射到 Opencode
5. `apps/adapter/src/routes/panel-action.ts`
   看面板提交怎么回喂给 Opencode
6. `apps/web/src/modules/chat/components/ChatPage.vue`
   看前端消息流怎么接 adapter
7. `apps/web/src/modules/a2ui/composables/useA2uiSurface.ts`
   看面板状态和表单值怎么管理
8. `apps/web/src/modules/a2ui/components/A2uiRenderer.vue`
   看 A2UI 如何渲染成 Vue 组件

## 核心数据流

### 1. 普通聊天请求

用户在前端输入消息后：

1. `Composer.vue` 触发提交
2. `ChatPage.vue` 调用 `POST /api/chat`
3. adapter 在 `routes/chat.ts` 中构造 Opencode 请求
4. `opencode-client.ts` 调真实 `POST /session/:id/message`
5. adapter 从 Opencode 返回的 `parts` 中提取 `text` 内容
6. `agent-output.ts` 负责 parse 成结构化结果
7. `demo-message.ts` 把结果包装成前端可消费的 `DemoMessage`
8. 前端将 assistant message 渲染为文本 + 面板

### 2. 面板提交请求

用户点击按钮后：

1. `A2uiButton.vue` 触发 submit
2. `A2uiRenderer.vue` 向外 emit 面板 payload
3. `AssistantMessageCard.vue` 往上抛 `panelAction`
4. `ChatPage.vue` 调用 `POST /api/panel-action`
5. adapter 在 `routes/panel-action.ts` 中把 action 转成 Opencode 文本请求
6. Opencode 返回下一条 assistant 结果
7. 前端追加新消息，并把旧面板切成只读

## 共享类型层

`packages/shared` 是这个 demo 的稳定边界。

这里主要有三类东西：

- `types/api.ts`
  前端和 adapter 之间的接口
- `types/agent.ts`
  adapter 期望从 agent 文本里解析出的中间结构
- `types/a2ui.ts`
  前端最终要渲染的 A2UI v0.9 子集

这个分层的目的，是避免：

- Vue 直接依赖 Opencode 原始结构
- Opencode 直接自由生成完整 A2UI
- adapter 和前端各自维护一套不一致类型

## Adapter 设计

adapter 是这个 demo 最关键的部分。

### 入口

- `src/app.ts`
  Express 启动文件，挂载 `/api/chat` 和 `/api/panel-action`

### 路由

- `src/routes/chat.ts`
  处理普通聊天消息
- `src/routes/panel-action.ts`
  处理面板按钮提交

### 服务

- `src/services/opencode-client.ts`
  负责调用真实 Opencode 接口
- `src/services/agent-output.ts`
  负责从 `parts` 中提取文本并 parse 成结构化结果
- `src/services/demo-message.ts`
  负责把解析结果变成前端统一的 `DemoMessage`

### 为什么需要 adapter

因为当前设计不希望：

- 前端直接理解 Opencode 的 message/part 细节
- agent 直接自由拼完整 A2UI payload

所以 adapter 负责做两次翻译：

1. `frontend request -> Opencode text request`
2. `Opencode text output -> structured response -> A2UI`

## Web 设计

前端重点不在“通用框架”，而在“一个可控的聊天面板系统”。

### Chat 模块

- `chat-store.ts`
  维护消息列表、sessionId，以及“旧面板只读”的状态逻辑
- `ChatPage.vue`
  页面级入口，负责调 adapter API
- `AssistantMessageCard.vue`
  负责把 assistant message 渲染为文本、面板、原始 parts
- `OpencodePartsView.vue`
  负责把非 text 的原始 part 继续展示出来，便于观察 agent 输出

### A2UI 模块

- `useA2uiSurface.ts`
  负责将 `createSurface/updateComponents/updateDataModel` 组装成前端 surface state
- `A2uiRenderer.vue`
  负责初始化 surface 并递归渲染 root
- `A2uiNodeRenderer.vue`
  根据 `component` 动态分发到 Vue 组件
- `registry.ts`
  维护白名单组件映射
- `widgets/*`
  真正的 Vue 组件实现

## 当前支持的 A2UI 子集

这个 demo 只支持一个非常小的子集。

### 支持的消息

- `createSurface`
- `updateComponents`
- `updateDataModel`

### 支持的组件

- `Column`
- `Row`
- `Text`
- `TextField`
- `Button`

### 支持的关键字段

- `id`
- `component`
- `children`
- `child`
- `text`
- `label`
- `value.path`
- `action.event.name`
- `action.event.context`

### 明确不支持

- 多 surface 联动
- 增量 patch
- 复杂表达式
- 动态 catalog
- Tabs/List/Modal 等复杂组件

## 历史面板与当前面板

这部分是聊天体验的重要约束。

规则是：

- 历史消息中的面板仍然显示
- 但历史面板不允许再次交互
- 只有最新的一个面板保持可交互

这一逻辑主要在 `chat-store.ts` 中控制，而不是交给 agent 或 adapter。

## 真实 Opencode 接入点

当前 demo 默认依赖：

`POST /session/:id/message`

adapter 会把两类输入都映射成 `TextPart`：

- 普通聊天：`kind = "chat"`
- 面板提交：`kind = "ui_action"`

这意味着第一版不要求 Opencode 原生支持更复杂的数据 part。

## 如何调整这个项目

### 如果你想新增一个组件

需要同时改这几处：

1. `packages/shared/src/types/a2ui.ts`
   扩展组件类型
2. `packages/shared/src/schemas/a2ui.ts`
   补运行时校验
3. `apps/web/src/modules/a2ui/registry/registry.ts`
   注册新组件
4. `apps/web/src/modules/a2ui/widgets/`
   添加 Vue 实现
5. 如有需要，修改 `packages/shared/src/builders/a2ui.ts`

### 如果你想改变 agent 输出结构

先改：

1. `packages/shared/src/types/agent.ts`
2. `packages/shared/src/schemas/agent.ts`
3. `apps/adapter/src/services/agent-output.ts`
4. `packages/shared/src/builders/a2ui.ts`

不要先改前端 renderer。

### 如果你想改聊天消息表现

主要看：

1. `apps/web/src/modules/chat/components/AssistantMessageCard.vue`
2. `apps/web/src/modules/chat/components/MessageList.vue`
3. `apps/web/src/modules/chat/store/chat-store.ts`

### 如果你想改 adapter 与 Opencode 的通信方式

主要看：

1. `apps/adapter/src/services/opencode-client.ts`
2. `apps/adapter/src/routes/chat.ts`
3. `apps/adapter/src/routes/panel-action.ts`

## 环境变量

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_BASE_URL` | `http://localhost:4096` | Opencode HTTP server URL |
| `OPENCODE_AGENT` | empty | Agent name to use |
| `OPENCODE_SYSTEM_PROMPT` | built-in default | System prompt used by the adapter |
| `ADAPTER_PORT` | `3000` | Adapter server port |

## 运行方式

### 安装依赖

```bash
cd demo/opencode-vue-chat-panel
npm install
```

### 启动 adapter

```bash
OPENCODE_BASE_URL=http://localhost:4096 npm run dev:adapter
```

### 启动 web

```bash
npm run dev:web
```

打开 `http://localhost:5174`。

## 测试与构建

运行测试：

```bash
npm test
```

运行构建：

```bash
npm run build
```

如果当前环境对 `esbuild` 的子进程有权限限制，`vite/vitest` 可能会因为环境问题失败。这类失败需要和代码本身的 TypeScript 或逻辑错误区分开来看。

## 已知边界

这是一个验证路线的 demo，不是产品化实现。

当前有意保持这些边界：

- 结构尽量清晰，优先可读性
- A2UI 只做最小子集
- adapter 只做一层简单翻译
- 不追完整 Opencode part 语义
- 不追完整 A2UI v0.9 特性覆盖

如果后续要继续演进，建议先保持：

- shared 类型优先收敛
- adapter 继续作为协议边界
- 前端 renderer 继续白名单化
