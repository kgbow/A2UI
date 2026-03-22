# React 示例定制指南

本文基于当前仓库里的 React 示例实现，说明：如果你想搞懂并定制一个自己的 React 示例，应该先做哪些事、改哪些文件、每一步解决什么问题。

## 1. 先判断你要定制的是哪一层

在这个仓库里，React 示例通常有三种定制层级。

## A. 只定制业务壳

适合：

- 你要做一个新的 demo 场景
- 现有标准组件够用
- 你只想改标题、背景、loading 文案、agent 地址、mock 数据、页面流程

会改到的地方：

- `samples/client/react/shell/src/configs/*.ts`
- `samples/client/react/shell/src/mock/*.ts`
- `samples/client/react/shell/src/App.tsx:33`

这是**最推荐的起步方式**。

---

## B. 定制消息流程 / 页面编排

适合：

- 你想保留聊天历史
- 你想让多个 surface 同时存在
- 你不想每次响应都 `clearSurfaces()`
- 你想做 sidebar / modal / 多面板布局

会改到的地方：

- `samples/client/react/shell/src/App.tsx:169`
- `samples/client/react/shell/src/App.tsx:189`
- `samples/client/react/shell/src/App.tsx:245`

---

## C. 新增自定义组件

适合：

- 标准组件不够表达你的 UI
- 你需要业务专属节点，例如 Flashcard、地图卡片、时间轴、复杂图表

会改到的地方：

- `renderers/react/src/v0_8/components/**`
- `renderers/react/src/v0_8/registry/defaultCatalog.ts:47`
- `renderers/react/src/v0_8/registry/ComponentRegistry.ts:41`
- 可能还要改 protocol schema / catalog 定义

这层最重，**不要一开始就做**。

---

## 2. 推荐的实施顺序

建议按下面顺序推进，而不是一上来改 renderer。

### 第 1 步：先跑通现有 React shell

```bash
cd samples/client/react/shell && npm install
cd samples/client/react/shell && npm run dev
```

先用 URL 参数 `?mock=true` 看本地 mock 流程。

你此时要验证三件事：

1. 首屏能出现
2. 输入提交后能渲染 restaurant list
3. 点击按钮后能进入 booking form，再提交到 confirmation

如果这一步不顺，不要先去改 renderer。

---

### 第 2 步：先复制一个新的业务配置

当前配置定义在：

- `samples/client/react/shell/src/configs/types.ts:21`
- `samples/client/react/shell/src/configs/restaurant.ts:18`

推荐做法：

1. 新建一个配置文件，比如：
   - `samples/client/react/shell/src/configs/contacts.ts`
2. 复制 `restaurant.ts` 结构
3. 修改：
   - `key`
   - `title`
   - `background`
   - `heroImage`
   - `placeholder`
   - `loadingText`
   - `serverUrl`

然后在：

- `samples/client/react/shell/src/configs/index.ts:16`
- `samples/client/react/shell/src/App.tsx:33`

把新 config 暴露并注册进去。

---

### 第 3 步：先做 mock 消息，不要先接真后端

这是最重要的一步。

新增：

- `samples/client/react/shell/src/mock/contactsMessages.ts`

并在：

- `samples/client/react/shell/src/mock/index.ts:16`

导出。

然后在 `App.tsx` 中按你的业务路由 mock 响应。

参考现有做法：

- `samples/client/react/shell/src/App.tsx:135`
- `samples/client/react/shell/src/mock/restaurantMessages.ts:71`

### 为什么先做 mock

因为它能帮你先验证：

- 你的 A2UI 消息是否合法
- 你的 surface 是否能渲染
- 你的 TextField 是否能更新 data model
- 你的 Button action 是否能回传 context

也就是：

**先验证“前端壳 + renderer + 消息结构”这条链路，再接真实 agent。**

---

### 第 4 步：接入真实 agent

真实调用链在：

- `samples/client/react/shell/src/client.ts:35`
- `samples/client/react/shell/src/client.ts:57`
- `samples/client/react/shell/src/client.ts:92`

你需要确认后端满足这几个条件：

1. 有 `/.well-known/agent-card.json`
2. 能接收 A2A message
3. 能返回 `Task.status.message.parts`
4. 返回的 `data` parts 中放的是 A2UI 消息
5. 当前如果沿用现有 React 示例，最好保持 **v0.8** 语义

如果后端不走 A2A，这个 shell 的 `client.ts` 就得重写成你的 transport 适配层。

---

### 第 5 步：最后才考虑自定义组件

如果标准组件不够用，再做这一层。

当前默认组件注册在：

- `renderers/react/src/v0_8/registry/defaultCatalog.ts:47`

动态渲染入口在：

- `renderers/react/src/v0_8/core/ComponentNode.tsx:61`

这意味着自定义组件最小要做三件事：

1. 写 React 组件实现
2. 注册到 `ComponentRegistry`
3. 让消息里的组件类型能命中该注册项

如果你还想让 agent 规范地产生这种组件，最好还要补 catalog/schema，而不是只在前端偷偷加一个名字。

---

## 3. 推荐的最小文件改动清单

假设你要做一个 `contacts` 示例，最小建议如下。

## 3.1 壳层文件

### 新增

- `samples/client/react/shell/src/configs/contacts.ts`
- `samples/client/react/shell/src/mock/contactsMessages.ts`

### 修改

- `samples/client/react/shell/src/configs/index.ts`
- `samples/client/react/shell/src/mock/index.ts`
- `samples/client/react/shell/src/App.tsx`

### 可选

- `samples/client/react/shell/src/App.css`
- `samples/client/react/shell/src/theme/default-theme.ts`

---

## 3.2 如果要加自定义组件

### 新增

- `renderers/react/src/v0_8/components/<category>/ContactCard.tsx`

### 修改

- `renderers/react/src/v0_8/registry/defaultCatalog.ts`
- 如果需要导出，也可能改：
  - `renderers/react/src/v0_8/index.ts`

### 测试建议补齐

- `renderers/react/tests/v0_8/unit/components/ContactCard.test.tsx`
- 可能再补一条 integration test

---

## 4. 推荐骨架：新增一个业务示例时怎么组织

推荐最小骨架如下：

```text
samples/client/react/shell/src/
  configs/
    index.ts
    restaurant.ts
    contacts.ts              # 新增
  mock/
    index.ts
    restaurantMessages.ts
    contactsMessages.ts      # 新增
  App.tsx                    # 注册 contacts config，并决定 mock 路由
  client.ts                  # 如 transport 不变，通常不用改
  App.css                    # 如页面布局要变，再改
  theme/default-theme.ts     # 如只调视觉风格，再改
```

### 这套骨架的职责分工

- `configs/*.ts`
  - 壳层配置：标题、地址、视觉参数、默认文案
- `mock/*.ts`
  - 业务消息样例：最适合先验证协议设计
- `App.tsx`
  - 把输入、mock/真实响应、surface 渲染串起来
- `client.ts`
  - transport 适配层，不承载业务 UI 逻辑

---

## 5. 一个建议的最小闭环

不要一开始就做复杂流程，先完成下面这个最小闭环。

## 阶段 1：静态 surface

目标：

- 输入任意文本后，渲染一张固定卡片列表

你需要：

- 一组 `surfaceUpdate + dataModelUpdate + beginRendering`
- 至少用到 `Column / Card / Text / Button`

完成标志：

- 页面可渲染
- 结构正确

---

## 阶段 2：一个输入控件 + 一个按钮动作

目标：

- 用户能输入表单字段
- 点击按钮能回传 `userAction`

你需要：

- `TextField` 绑定一个 path
- `Button.action.context` 至少有一个 path 值

参考：

- `samples/client/react/shell/src/mock/restaurantMessages.ts:264`
- `samples/client/react/shell/src/mock/restaurantMessages.ts:294`

完成标志：

- 输入值进入 data model
- 点击按钮时 context 里能拿到最新值

---

## 阶段 3：接真实 agent

目标：

- 让 mock 流程切换为真实后端响应

完成标志：

- 真实 agent 返回的 A2UI 消息能替代本地 mock
- 不需要再靠前端拼装业务响应

---

## 6. 如果你要改成“聊天式示例”，需要动哪里

当前 shell 每次处理响应都：

- `samples/client/react/shell/src/App.tsx:189`

```ts
clearSurfaces();
processMessages(response);
```

这意味着老的 surfaces 会被清掉。

如果你要做聊天式或多轮累积式 UI，通常要考虑：

1. 去掉或有条件执行 `clearSurfaces()`
2. 让 `surfaceId` 在不同轮次保持稳定或按消息分配
3. 在壳层同时管理聊天文本消息和 A2UI surfaces
4. 可能需要在页面结构上区分：
   - message list
   - current interactive surface
   - modal / side panel

这已经属于“定制流程层”，比只换 config 要重很多。

---

## 7. 如果你要加自定义组件，正确姿势是什么

## 7.1 不要先做的事

不建议一开始就：

- 直接改 `ComponentNode`
- 在壳层硬编码某个业务组件
- 跳过消息层，直接在 React 页面里写业务 JSX

因为这样会绕开 A2UI 的核心价值：

**消息驱动 UI，而不是壳层写死 UI。**

---

## 7.2 建议做法

### 第一步：先问自己是不是只要主题差异

如果只是视觉风格不同，优先改：

- `samples/client/react/shell/src/theme/default-theme.ts:154`

而不是新增组件。

### 第二步：如果语义真的不同，再加组件

例如标准 `Card + Text + Button` 已无法表达你的业务对象，这时才加新的 `ContactCard` / `Timeline` / `MapPanel`。

### 第三步：最好同步考虑 catalog/schema

否则前端虽然能渲染，但 agent 侧没有稳定契约，后续会变成“前后端靠约定俗成猜名字”。

---

## 8. 推荐学习/实施顺序

如果你的目标是“尽快落地自己的 React 示例”，推荐这条顺序：

### 第 1 天

1. 跑起 `samples/client/react/shell`
2. 用 `?mock=true` 跑通现有 restaurant 流程
3. 阅读：
   - `samples/client/react/shell/src/App.tsx:42`
   - `samples/client/react/shell/src/client.ts:22`
   - `samples/client/react/shell/src/mock/restaurantMessages.ts:71`

### 第 2 天

1. 新建一个 config
2. 新建一组 mock messages
3. 让新的业务示例在 mock 模式跑起来

### 第 3 天

1. 接真实 agent
2. 补最小测试
3. 如果必要，再讨论自定义组件

---

## 9. 你最值得优先验证的检查清单

## 壳层检查

- [ ] 新 config 已注册到 `App.tsx`
- [ ] `serverUrl` 指向正确 agent
- [ ] 首屏标题/背景/placeholder 已切换

## 协议检查

- [ ] mock 消息是合法的 v0.8 结构
- [ ] 至少包含 `surfaceUpdate` / `dataModelUpdate` / `beginRendering`
- [ ] surfaceId 与 root 组件引用正确

## 交互检查

- [ ] TextField 的 `path` 能写入 data model
- [ ] Button 的 `action.name` 正确
- [ ] Button 的 `context.path` 能解析到最新输入值

## 真实链路检查

- [ ] agent-card 可访问
- [ ] A2A 返回里含有 data parts
- [ ] 返回结果能被 `client.ts` 提取成 `ServerToClientMessage[]`

---

## 10. 最实用的命令

### React shell

```bash
cd samples/client/react/shell && npm install
cd samples/client/react/shell && npm run dev
```

### React renderer 测试

```bash
cd renderers/web_core && npm install && npm run build
cd renderers/react && npm install
cd renderers/react && npm test
```

### 跑单个 action 测试

```bash
cd renderers/react && npx vitest run "tests/v0_8/integration/actions.test.tsx"
```

### 跑现成 restaurant agent

```bash
cd samples/agent/adk/restaurant_finder && uv run .
```

---

## 11. 最后建议

如果你的目标是“尽快定制一个自己的 React 示例”，最佳策略是：

1. **先不碰 renderer**
2. **先用 config + mock messages 跑出自己的业务流**
3. **确认标准组件够不够用**
4. **只有在表达能力不够时，再扩展 registry 和组件**

这样最符合当前仓库的设计，也最省返工。

一句话说：

**先把你的业务翻译成 A2UI 消息，再决定是否需要改 React renderer。**
