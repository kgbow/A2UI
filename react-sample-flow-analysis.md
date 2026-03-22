# React 示例流程分析

本文按代码真实实现梳理 `samples/client/react/shell` 的运行流程，目标是帮助你快速搞懂：输入如何进入系统、A2UI 消息如何被处理、React renderer 如何渲染、动作如何回传后端。

## 1. 关键文件地图

### Shell 层

- `samples/client/react/shell/src/main.tsx:20`
  - React 入口，只负责挂载 `<App />`
- `samples/client/react/shell/src/App.tsx:42`
  - React 示例主逻辑：读取配置、创建客户端、提交请求、处理响应、渲染 surfaces
- `samples/client/react/shell/src/client.ts:22`
  - A2A 客户端封装，把文本输入或 `userAction` 发给 agent，再从响应里提取 A2UI 消息
- `samples/client/react/shell/src/configs/types.ts:21`
  - 通用配置接口 `AppConfig`
- `samples/client/react/shell/src/configs/restaurant.ts:18`
  - 当前唯一业务配置：标题、背景、placeholder、loading 文案、serverUrl
- `samples/client/react/shell/src/mock/restaurantMessages.ts:71`
  - mock 模式下返回的 v0.8 A2UI 消息，最适合用来理解消息结构
- `samples/client/react/shell/src/theme/default-theme.ts:154`
  - React shell 的默认主题，主要是视觉层覆盖，不改变协议流程

### React renderer 层

- `renderers/react/src/index.ts:16`
  - 顶层导出当前默认指向 `v0_8`
- `renderers/react/src/v0_8/core/A2UIProvider.tsx:85`
  - Provider：初始化默认 catalog 和样式，创建消息处理器，暴露 actions/store
- `renderers/react/src/v0_8/core/A2UIRenderer.tsx:63`
  - 按 `surfaceId` 渲染单个 surface
- `renderers/react/src/v0_8/core/ComponentNode.tsx:50`
  - 递归渲染组件节点，根据节点类型从 registry 查 React 组件
- `renderers/react/src/v0_8/registry/defaultCatalog.ts:47`
  - 默认组件注册表：Text / Card / Row / Button / TextField 等都在这里注册
- `renderers/react/src/v0_8/registry/ComponentRegistry.ts:41`
  - 组件注册与查找机制，自定义组件扩展点在这里
- `renderers/react/src/v0_8/components/interactive/Button.tsx:29`
  - Button 点击后触发 `sendAction(props.action)`
- `renderers/react/src/v0_8/components/interactive/TextField.tsx:29`
  - TextField 双向绑定 data model，输入变化会更新 renderer 内部状态模型

### 底层共享内核

- `renderers/react/src/v0_8/core/A2UIProvider.tsx:18`
  - React renderer 底层依赖 `@a2ui/web_core` 的 `A2uiMessageProcessor`
- 结论：**React renderer 主要是 React 适配层，协议解析、surface/data model 管理在 `web_core`**

---

## 2. 一次完整交互的调用链

```text
用户在输入框提交文本
  -> App.handleSubmit()
  -> sendAndProcess(body)
  -> A2UIClient.send(body)
  -> A2AClient.sendMessage(...)
  -> agent 返回 A2A Task/message parts
  -> client.ts 提取 data parts 为 ServerToClientMessage[]
  -> App.clearSurfaces()
  -> App.processMessages(response)
  -> A2UIProvider 内部的 A2uiMessageProcessor 处理消息
  -> A2UIRenderer 读取 surface
  -> ComponentNode 递归渲染组件树
  -> 用户点击 Button / 输入 TextField
  -> renderer 生成 userAction 或更新 data model
  -> onAction 回到 App.handleAction()
  -> sendAndProcess(userAction)
  -> 再发回 agent
```

---

## 3. Shell 层流程

## 3.1 入口与配置装载

`App` 在初始化时做了几件事：

- 根据 URL 参数读取 `app`，默认 `restaurant`
  - `samples/client/react/shell/src/App.tsx:44`
- 根据配置创建 `A2UIClient`
  - `samples/client/react/shell/src/App.tsx:49`
- 根据配置设置页面标题和背景
  - `samples/client/react/shell/src/App.tsx:55`
- 将 `theme` 传入 `A2UIProvider`
  - `samples/client/react/shell/src/App.tsx:87`

当前 `configs` map 只有一个值：

- `samples/client/react/shell/src/App.tsx:33`
- `samples/client/react/shell/src/configs/restaurant.ts:18`

也就是说，这个 React shell 当前本质上是：

**一个通用壳 + 一个 restaurant 配置**

---

## 3.2 用户输入如何变成请求

表单提交入口：

- `samples/client/react/shell/src/App.tsx:208`

它会：

1. 从表单取 `body`
2. 调用 `sendAndProcess(body)`

核心发送逻辑在：

- `samples/client/react/shell/src/App.tsx:170`

---

## 3.3 mock 模式与真实模式

mock 开关来自 URL：

- `samples/client/react/shell/src/App.tsx:38`
- `samples/client/react/shell/src/App.tsx:40`

当 `?mock=true` 时：

- `samples/client/react/shell/src/App.tsx:179`
- `samples/client/react/shell/src/App.tsx:182`

会调用本地 mock 工厂：

- `samples/client/react/shell/src/App.tsx:135`
- `samples/client/react/shell/src/mock/restaurantMessages.ts:71`

否则走真实后端：

- `samples/client/react/shell/src/App.tsx:185`
- `samples/client/react/shell/src/client.ts:57`

这意味着你理解流程时，**最佳起点是先跑 mock 模式**，因为完全不依赖后端。

---

## 4. A2UIClient 真实请求流程

关键文件：

- `samples/client/react/shell/src/client.ts:22`

## 4.1 如何找到 agent

客户端通过 A2A card 初始化：

- `samples/client/react/shell/src/client.ts:40`

```ts
A2AClient.fromCardUrl(`${baseUrl}/.well-known/agent-card.json`)
```

默认后端地址来自：

- `samples/client/react/shell/src/configs/restaurant.ts:55`

当前值为：

```ts
serverUrl: 'http://localhost:10002'
```

所以这个 React 示例默认是连本地 `10002` 端口的餐厅 agent。

---

## 4.2 它发送的不是普通 fetch JSON，而是 A2A message parts

### 文本输入

当用户提交的是字符串时：

- `samples/client/react/shell/src/client.ts:64`

会优先尝试 JSON.parse；
如果不是 JSON，就发：

```ts
{ kind: 'text', text: message }
```

### 动作输入

如果提交的是 `A2UIClientEventMessage`，则发送：

- `samples/client/react/shell/src/client.ts:82`

```ts
{
  kind: 'data',
  data: message,
  mimeType: 'application/json+a2ui'
}
```

这就是为什么点击按钮后，前端能把结构化 `userAction` 发回后端。

---

## 4.3 请求头里显式声明了 A2UI 扩展

- `samples/client/react/shell/src/client.ts:45`

它设置：

```ts
X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.8
```

所以当前 React shell 是围绕：

- **A2A transport**
- **A2UI v0.8**

这条链路设计的。

---

## 4.4 如何从响应中提取 A2UI 消息

- `samples/client/react/shell/src/client.ts:105`

逻辑是：

1. 从 A2A `Task` 里拿 `result.status.message.parts`
2. 只提取 `kind === 'data'` 的 part
3. 转成 `Types.ServerToClientMessage[]`
4. 返回给 `App.sendAndProcess()`

因此，**React shell 并不理解业务语义，它只要求后端返回标准 A2UI 消息数组**。

---

## 5. 消息进入 renderer 后发生什么

## 5.1 Provider 创建全局 A2UI 运行时

- `renderers/react/src/v0_8/core/A2UIProvider.tsx:85`

`A2UIProvider` 做三件事最关键：

### 1) 自动初始化默认 catalog 和样式

- `renderers/react/src/v0_8/core/A2UIProvider.tsx:25`
- `renderers/react/src/v0_8/core/A2UIProvider.tsx:29`
- `renderers/react/src/v0_8/core/A2UIProvider.tsx:86`

也就是首次使用时会自动：

- `initializeDefaultCatalog()`
- `injectStyles()`

### 2) 创建底层消息处理器

- `renderers/react/src/v0_8/core/A2UIProvider.tsx:88`
- `renderers/react/src/v0_8/core/A2UIProvider.tsx:91`

```ts
processorRef.current = new A2uiMessageProcessor();
```

### 3) 暴露稳定 actions

- `processMessages`
- `setData`
- `dispatch`
- `clearSurfaces`
- `getSurface`
- `getSurfaces`
- `getData`
- `resolvePath`

见：

- `renderers/react/src/v0_8/core/A2UIProvider.tsx:105`

---

## 5.2 App 如何把响应喂给 renderer

- `samples/client/react/shell/src/App.tsx:189`
- `samples/client/react/shell/src/App.tsx:190`

```ts
clearSurfaces();
processMessages(response);
```

这两个调用非常重要，它说明当前 demo 的策略是：

- **每次拿到新响应先清空旧 surfaces**
- **再渲染新的 surface 集合**

所以它现在不是“聊天历史累积式 UI”，而更像“当前视图替换式 UI”。

---

## 5.3 A2UIRenderer 如何渲染 surface

- `renderers/react/src/v0_8/core/A2UIRenderer.tsx:63`

它会：

1. 根据 `surfaceId` 从 store 取 surface
   - `renderers/react/src/v0_8/core/A2UIRenderer.tsx:73`
2. 将 `surface.styles` 转为 CSS 变量
   - `renderers/react/src/v0_8/core/A2UIRenderer.tsx:77`
3. 如果 surface 存在 componentTree，就递归渲染
   - `renderers/react/src/v0_8/core/A2UIRenderer.tsx:135`

Shell 层会遍历当前所有 surfaces：

- `samples/client/react/shell/src/App.tsx:245`
- `samples/client/react/shell/src/App.tsx:308`

```tsx
{surfaceEntries.map(([surfaceId]) => (
  <A2UIRenderer key={surfaceId} surfaceId={surfaceId} />
))}
```

---

## 5.4 ComponentNode 如何把协议节点变成 React 组件

- `renderers/react/src/v0_8/core/ComponentNode.tsx:50`

关键逻辑：

1. 从 node 里拿 `type`
2. 去 registry 查对应 React 组件
   - `renderers/react/src/v0_8/core/ComponentNode.tsx:61`
3. 渲染出该组件
   - `renderers/react/src/v0_8/core/ComponentNode.tsx:82`

默认 catalog 注册在：

- `renderers/react/src/v0_8/registry/defaultCatalog.ts:47`

所以标准组件能直接工作，因为默认已经注册了：

- Text / Image / Icon / Divider / Video / AudioPlayer
- Row / Column / List / Card / Tabs / Modal
- Button / TextField / CheckBox / Slider / DateTimeInput / MultipleChoice

---

## 6. 交互与数据绑定如何工作

## 6.1 Button 点击如何回传 action

- `renderers/react/src/v0_8/components/interactive/Button.tsx:36`

按钮点击时：

```ts
if (props.action) {
  sendAction(props.action);
}
```

也就是说，按钮行为来自 A2UI 节点的 `action` 定义，而不是 React 壳里写死。

mock 中的例子：

- `samples/client/react/shell/src/mock/restaurantMessages.ts:163`

```ts
Button: {
  child: 'book-now-text',
  action: {
    name: 'book_restaurant',
    context: [ ... ]
  }
}
```

---

## 6.2 TextField 如何更新 data model

- `renderers/react/src/v0_8/components/interactive/TextField.tsx:58`
- `renderers/react/src/v0_8/components/interactive/TextField.tsx:68`

当用户输入变化时：

```ts
if (textPath) {
  setValue(textPath, newValue);
}
```

这表示输入值会写回 renderer 内部 data model。

---

## 6.3 action context 如何从 data model 取值

在 booking form 的 mock 里：

- `samples/client/react/shell/src/mock/restaurantMessages.ts:299`

按钮的 context 参数不是字面量，而是 path：

```ts
{ key: 'partySize', value: { path: '/partySize' } }
```

这表示点击时会从当前 surface data model 解析实际值。

这条链路在测试中也被验证：

- `renderers/react/tests/v0_8/integration/actions.test.tsx:150`

测试证明：

1. TextField 更新 data model
2. Button 点击读取 path 绑定值
3. `onAction` 收到已解析的 `context`

---

## 6.4 renderer 的 action 怎么回到 shell

Shell 中：

- `samples/client/react/shell/src/App.tsx:76`
- `samples/client/react/shell/src/App.tsx:79`

`A2UIProvider` 收到 `onAction={handleAction}`，而 `handleAction` 会调用：

```ts
sendAndProcessRef.current(actionMessage)
```

也就是：

**组件 -> renderer dispatch -> App.handleAction -> A2UIClient.send(actionMessage) -> 后端**

---

## 7. mock 消息最值得先看什么

如果你想最快看懂 A2UI v0.8 在 React 示例里的使用方式，最值得先看的是：

- `samples/client/react/shell/src/mock/restaurantMessages.ts:71`
- `samples/client/react/shell/src/mock/restaurantMessages.ts:216`

它完整演示了三类消息：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`

以及两种关键交互：

- 从列表点击按钮，进入 booking form
- 表单字段写 data model，再通过 button action 提交

这个文件几乎就是“React 示例协议流”的最小教材。

---

## 8. 当前 React 示例的边界与限制

基于代码，当前示例有几个非常明确的边界：

### 1) 当前默认还是 v0.8

- `renderers/react/src/index.ts:16`

顶层导出仍然直接指向 `v0_8`。

### 2) 当前只有 restaurant 这个配置

- `samples/client/react/shell/src/App.tsx:33`

所以要扩展新 demo，最直接的方式不是重写 App，而是新增 config + mock/agent 响应。

### 3) 当前是“结果替换式”而不是“聊天历史累积式”

- `samples/client/react/shell/src/App.tsx:189`

因为每次请求前都 `clearSurfaces()`。

### 4) 这个示例更像“通用壳”，业务语义在消息里，不在组件里

餐厅搜索、订位这些业务流程并不写死在 React renderer 内，而主要写在：

- 后端 agent 返回的 A2UI 消息
- 或本地 mock 消息工厂

---

## 9. 推荐阅读顺序

如果你的目标是快速上手，推荐按这个顺序读：

### 第一轮：只看壳层

1. `samples/client/react/shell/src/App.tsx:42`
2. `samples/client/react/shell/src/client.ts:22`
3. `samples/client/react/shell/src/configs/restaurant.ts:18`
4. `samples/client/react/shell/src/mock/restaurantMessages.ts:71`

### 第二轮：看 renderer 主链路

1. `renderers/react/src/v0_8/core/A2UIProvider.tsx:85`
2. `renderers/react/src/v0_8/core/A2UIRenderer.tsx:63`
3. `renderers/react/src/v0_8/core/ComponentNode.tsx:50`
4. `renderers/react/src/v0_8/registry/defaultCatalog.ts:47`

### 第三轮：看交互落地

1. `renderers/react/src/v0_8/components/interactive/Button.tsx:29`
2. `renderers/react/src/v0_8/components/interactive/TextField.tsx:29`
3. `renderers/react/tests/v0_8/integration/actions.test.tsx:34`

---

## 10. 最小验证命令

### 只跑 React shell

```bash
cd samples/client/react/shell && npm install
cd samples/client/react/shell && npm run dev
```

### 跑真实餐厅 agent（仓库现有示例）

```bash
cd samples/agent/adk/restaurant_finder && uv run .
```

### React renderer 自测

```bash
cd renderers/web_core && npm install && npm run build
cd renderers/react && npm install
cd renderers/react && npm test
```

### 跑单个 React 测试

```bash
cd renderers/react && npx vitest run "tests/v0_8/integration/actions.test.tsx"
```

---

## 11. 一句话总结

这个 React 示例的本质不是“一个写死业务页面”，而是：

**一个负责转发输入/动作的 React 壳，配合一个把 A2UI v0.8 消息转成 React 组件树的 renderer。**

所以要搞懂它，重点不是先研究 CSS，而是先研究：

- `App.tsx` 怎么收发消息
- `client.ts` 怎么走 A2A
- `mock/restaurantMessages.ts` 怎么组织协议消息
- `A2UIProvider -> A2UIRenderer -> ComponentNode` 怎么把协议落成 UI
