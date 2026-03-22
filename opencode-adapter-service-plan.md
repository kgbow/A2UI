# 方案二：接入 OpenCode，并封装一个协议转换服务

## 1. 目标

把 **OpenCode** 作为实际的 agent / orchestration 引擎使用，但在它前面加一层 **协议适配服务**，让当前 React shell 仍然可以按原样接入。

也就是：

- React shell 继续说 A2A + A2UI
- OpenCode 继续说它自己的输入输出协议
- 适配服务负责做双向转换

这是“**不要求 OpenCode 原生支持 A2A/A2UI**”的集成方式。

---

## 2. 核心判断

如果 OpenCode 本身不能直接提供下面这些能力：

1. `/.well-known/agent-card.json`
2. A2A message 接口
3. `application/json+a2ui` 的 `data` parts 返回
4. `userAction` 回传处理

那它就 **不能直接替换** 当前 React shell 后端。

这时最合理的办法不是改前端，而是加一个 adapter service。

当前 React shell 的硬依赖仍然是：

- `samples/client/react/shell/src/client.ts:41`
- `samples/client/react/shell/src/client.ts:47`
- `samples/client/react/shell/src/client.ts:107`

所以适配服务的本质工作是：

**对前端伪装成 A2A agent，对后端调用 OpenCode。**

---

## 3. 改造后的总体结构

```text
React Shell
  -> A2A client
  -> OpenCode Adapter Service
  -> OpenCode API / CLI / Session Runtime
  -> OpenCode 输出文本 / JSON / 工具结果
  -> Adapter 转成 A2UI
  -> Adapter 封装成 A2A DataPart
  -> React renderer 渲染
```

如果 OpenCode 支持多轮会话，adapter 还要负责维护：

- A2A taskId
- OpenCode sessionId
- 当前 surface / data model / action context

---

## 4. 为什么这个方案值得单独做

适合下面场景：

- 你已经有一个 OpenCode agent，短期不想重写成 A2A agent
- OpenCode 已经有既定工具链 / prompt / workflow
- 你想复用当前 React shell，不想重写前端 renderer
- 你希望未来还能替换成别的 agent runtime，而不影响前端

这个方案的核心收益是：

**把“前端协议”与“后端 agent 实现”彻底解耦。**

---

## 5. Adapter Service 必须承担的职责

## 5.1 暴露 A2A 入口

Adapter 对外必须像一个真的 A2A agent：

- 提供 `/.well-known/agent-card.json`
- 接收 A2A message
- 返回 A2A `Task.status.message.parts`

这样当前 React shell 才能零修改接入。

## 5.2 解析前端输入

前端发来的输入可能有两类：

### 文本输入

```json
{ "kind": "text", "text": "book a table for 2" }
```

### 结构化动作输入

```json
{
  "kind": "data",
  "mimeType": "application/json+a2ui",
  "data": {
    "userAction": { ... }
  }
}
```

Adapter 要把它们转换成 OpenCode 能理解的输入。

---

## 6. Adapter 到 OpenCode 的三种映射方式

## 方案 6.1：让 OpenCode 直接输出完整 A2UI JSON

```text
A2A input -> Adapter -> OpenCode prompt -> OpenCode 返回 A2UI JSON -> Adapter validate -> A2A output
```

### 优点

- 适配层最薄
- 前后端契约最统一

### 缺点

- 非常依赖 OpenCode 的结构化输出稳定性
- UI 稍复杂时，A2UI JSON 容易漂移
- 调试成本高

### 适用

- 你已经验证 OpenCode 很擅长稳定输出 schema JSON

---

## 方案 6.2：让 OpenCode 输出业务 JSON，Adapter 负责组装 A2UI

```text
A2A input -> Adapter -> OpenCode -> 业务 JSON -> Adapter 模板化生成 A2UI -> A2A output
```

例如 OpenCode 输出：

```json
{
  "intent": "restaurant_list",
  "title": "Top 5 Chinese Restaurants in New York",
  "items": [ ... ]
}
```

再由 Adapter 组装成：

- `surfaceUpdate`
- `dataModelUpdate`
- `beginRendering`

### 优点

- 稳定性最高
- UI 演进更可控
- schema 校验更简单
- 更适合生产化

### 缺点

- Adapter 逻辑更多
- 你要维护业务 JSON -> A2UI 的映射模板

### 适用

- 你希望 UI 一致性和稳定性高于“模型自由生成 UI”

> **推荐优先使用这个子方案。**

---

## 方案 6.3：OpenCode 只输出文本，Adapter 走规则模板

```text
A2A input -> Adapter -> OpenCode -> 文本 / tool result -> Adapter 根据规则选固定 A2UI 模板
```

### 优点

- 最稳
- 最容易做错误兜底

### 缺点

- 灵活性最低
- UI 变化需要更多工程代码

### 适用

- 业务流程固定，比如搜索 -> 表单 -> 确认 三段式流程

---

## 7. 推荐的总体实现策略

推荐优先做：

**OpenCode 输出业务 JSON，Adapter 负责转成 A2UI。**

原因：

- 对 OpenCode 的约束比“直接产 A2UI”小
- Adapter 能统一管理 catalog / schema / UI 版本
- 后续换模型或换 agent runtime，前端完全不用改
- 更符合 SRP：
  - OpenCode 负责推理和业务决策
  - Adapter 负责协议与 UI 编排

---

## 8. Adapter Service 的内部模块建议

```text
opencode_adapter/
  server.ts / server.py        # HTTP/A2A 服务入口
  agent_card.ts                # agent-card 生成
  a2a_handler.ts               # A2A request/response 封装
  session_store.ts             # taskId <-> sessionId 映射
  opencode_client.ts           # 调用 OpenCode API / CLI / SDK
  prompt_builder.ts            # 给 OpenCode 的提示词与 schema 约束
  response_parser.ts           # 解析 OpenCode 输出
  a2ui_mapper.ts               # 业务 JSON -> A2UI
  validator.ts                 # A2UI schema 校验
  action_mapper.ts             # userAction -> OpenCode 输入映射
```

### 模块职责

- `opencode_client`
  - 屏蔽 OpenCode 的调用细节
- `a2ui_mapper`
  - 屏蔽前端 renderer 所需协议细节
- `a2a_handler`
  - 屏蔽 React shell 对接要求

这样以后换成别的 agent runtime，只要替换 `opencode_client`。

---

## 9. Adapter 的核心请求流程

## 9.1 文本消息流程

```text
1. React shell 发文本到 A2A
2. Adapter 收到 message.parts
3. Adapter 提取文本内容
4. Adapter 调用 OpenCode
5. OpenCode 返回文本 / JSON / tool result
6. Adapter 解析结果
7. Adapter 生成合法 A2UI
8. Adapter 封装为 A2A DataPart 返回
```

## 9.2 用户动作流程

```text
1. React shell 点击 Button
2. 前端发送 userAction 到 Adapter
3. Adapter 把 action.name + context 转成 OpenCode 输入
4. OpenCode 返回下一步业务结果
5. Adapter 生成下一轮 A2UI
6. React renderer 更新 UI
```

---

## 10. Action 映射建议

A2UI 前端动作一般长这样：

```json
{
  "name": "confirm_booking",
  "context": {
    "date": "2026-03-22",
    "partySize": 2
  }
}
```

建议 Adapter 不要把它原样字符串拼给 OpenCode，而是先标准化成内部事件：

```json
{
  "type": "ui_action",
  "action": "confirm_booking",
  "payload": {
    "date": "2026-03-22",
    "partySize": 2
  }
}
```

这样做的好处：

- OpenCode 的 prompt 更稳定
- 以后换协议不影响内部事件模型
- Adapter 可以统一做校验和审计

---

## 11. Session / State 建议

如果 OpenCode 自身支持 session，Adapter 需要维护映射：

```text
A2A taskId -> OpenCode sessionId
```

至少要记录：

- 当前会话 ID
- 最近一次用户输入
- 最近一次 action
- 当前业务阶段
- 当前 surface 版本（如果需要调试）

否则多轮交互很容易乱。

---

## 12. 错误处理与降级策略

Adapter 比直接接模型更需要明确降级策略。

### 推荐的 3 层兜底

#### 第 1 层：OpenCode 输出合法业务 JSON
- 正常生成 A2UI

#### 第 2 层：OpenCode 只输出文本
- Adapter 返回简单文本型 A2UI
- 例如只渲染 `Text + Button`

#### 第 3 层：OpenCode 调用失败
- Adapter 返回纯文本错误响应
- 同时保持 A2A envelope 合法

这样前端不会因为一次异常直接白屏。

---

## 13. 需要前端改吗？

### 理想情况：不需要

如果 Adapter 完整模拟现有 A2A agent：

- 前端只改 `serverUrl`
- 或者甚至只替换配置文件里的地址

通常变更点只会在：

- `samples/client/react/shell/src/configs/*.ts`

### 只有在以下情况才需要改前端

- 你不想提供 A2A agent-card
- 你想让前端直接连 OpenCode 自己的协议
- 你想改成 SSE / REST / MCP

那就得改：

- `samples/client/react/shell/src/client.ts`

这个就不属于本方案的推荐路径了。

---

## 14. 这个方案的优点

- 前端可继续复用
- OpenCode 可继续复用
- 协议边界清晰
- 后续可替换任何 agent runtime
- 更适合多团队协作：
  - 前端管 A2UI
  - 后端管 agent
  - adapter 管协议

---

## 15. 这个方案的成本

- 需要额外维护一个服务
- 会多一跳网络 / 进程调用
- session 映射和错误处理更复杂
- 如果 OpenCode 输出不稳定，adapter 逻辑会变重

所以它不是最省事方案，但它是 **最解耦** 的方案。

---

## 16. 推荐实施顺序

## 第 1 步：先做一个最小 Adapter 壳

只实现：

- `agent-card`
- 接收文本输入
- 返回固定 A2UI

先证明 React shell 能连上。

## 第 2 步：接入 OpenCode 文本输入

让 Adapter 能把用户文本转发给 OpenCode，并把结果做最简单转换。

## 第 3 步：支持 `userAction`

把按钮动作、表单 context 映射成 OpenCode 可处理的内部事件。

## 第 4 步：再做复杂业务 JSON -> A2UI 模板

比如：

- 列表页
- 表单页
- 确认页
- 多 surface / modal

## 第 5 步：最后再考虑让 OpenCode 直接产完整 A2UI

只有在你确认结构化输出非常稳定时，再把 UI 生成权更多交给 OpenCode。

---

## 17. 最终结论

如果你的真实目标是：

- 后端继续使用 OpenCode
- 前端继续使用当前 React shell
- 两边都不想大改

那么最合理的路线是：

**增加一个 OpenCode Adapter Service，对前端提供 A2A/A2UI，对后端调用 OpenCode，并负责协议转换。**

它最符合这类异构系统接入场景。

一句话概括：

**不要让 React shell 直接理解 OpenCode；让一个适配层同时理解 React shell 的 A2A/A2UI 和 OpenCode 的原生协议。**

它体现的原则是：

- KISS：前端不改协议，后端不重写 runtime
- YAGNI：不先重写整个系统，只加一层 adapter
- DRY：复用已有 React shell 和已有 OpenCode
- SRP：协议转换、业务推理、UI 渲染三层职责分离
