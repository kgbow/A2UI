# 方案一：直接替换为 OpenAI 兼容模型接口

## 1. 目标

在 **不改当前 React shell 协议层** 的前提下，把示例 agent 默认依赖的 Gemini / Vertex 模型调用替换为 **OpenAI 兼容接口**。

也就是保留：

- React shell
- A2A transport
- `/.well-known/agent-card.json`
- A2UI `application/json+a2ui` 返回格式
- 前端 `userAction -> agent -> A2UI` 的交互闭环

只替换后端的 **模型调用层**。

---

## 2. 核心判断

当前 React 示例真正依赖的不是 Gemini，而是 **A2A + A2UI 协议契约**。

关键约束在：

- `samples/client/react/shell/src/client.ts:41`
  - 通过 `A2AClient.fromCardUrl()` 发现 agent
- `samples/client/react/shell/src/client.ts:47`
  - 请求头带 `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.8`
- `samples/client/react/shell/src/client.ts:74`
- `samples/client/react/shell/src/client.ts:88`
  - 前端把结构化消息作为 `application/json+a2ui` 发送
- `samples/client/react/shell/src/client.ts:107`
  - 前端只消费 A2A 返回中的 `data` parts

所以只要你的后端继续提供这套契约，底层模型可以不是 Gemini。

仓库文档也明确说明 agent 可以使用不同 LLM：

- `docs/reference/agents.md:16`
- `docs/introduction/how-to-use.md:42`
- `docs/introduction/how-to-use.md:43`

---

## 3. 适用场景

适合下面这种情况：

- 你已经接受当前 React shell 的 A2A 接入方式
- 你不想改前端 `client.ts`
- 你只想把后端模型换成：
  - OpenAI
  - Azure OpenAI
  - vLLM / LM Studio / One API / FastChat 等 OpenAI 兼容网关
  - 任何提供 OpenAI 风格 `/v1/chat/completions` 或兼容接口的服务

这是 **改动最小、风险最低** 的方案。

---

## 4. 改造后的总体结构

```text
React Shell
  -> A2A client
  -> 你的 A2A Agent 服务
  -> OpenAI-compatible Model API
  -> 模型返回结构化内容 / JSON
  -> Agent 验证并封装为 A2UI
  -> A2A DataPart 返回给前端
  -> React renderer 渲染
```

你保留的是“agent 服务壳”，替换的是“agent 内部怎么调用模型”。

---

## 5. 最推荐的落地方式

## 方案 5.1：保留现有 Python ADK / A2A 壳，只替换模型配置

这是最推荐的做法。

当前样例已经有可替换迹象，例如：

- `samples/agent/adk/contact_lookup/agent.py:121`
- `samples/agent/adk/contact_lookup/agent.py:137`

里面不是直接写死 Gemini SDK，而是：

```python
LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
model=LiteLlm(model=LITELLM_MODEL)
```

这意味着你可以继续保留：

- `samples/agent/adk/contact_lookup/__main__.py:19`
  - A2A server 启动壳
- `samples/agent/adk/contact_lookup/agent.py:103`
  - agent card 输出
- `samples/agent/adk/contact_lookup/agent.py:300`
  - 最终 parts 返回

重点改成：

- 模型名环境变量
- 模型服务 base URL
- API key
- structured output / schema 校验策略

### 推荐环境变量形态

```bash
OPENAI_BASE_URL=http://your-openai-compatible-endpoint/v1
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=qwen-max
```

如果继续走 LiteLLM，则再补一层 provider 对应配置。

---

## 6. 必须保留的后端职责

无论模型怎么换，后端都必须继续做这几件事。

### 6.1 对外仍然暴露 A2A

必须保留：

- `/.well-known/agent-card.json`
- A2A message 接收接口
- A2A task/message/parts 返回格式

否则当前 React shell 无法直接连接。

### 6.2 最终输出仍然是 A2UI

模型的原始输出不能直接丢给前端。

你仍然需要：

1. 解析模型输出
2. 提取 A2UI JSON
3. 校验 schema
4. 封装为 A2A `data` parts
5. 使用 `application/json+a2ui`

### 6.3 继续支持用户动作回传

当前前端会把按钮动作 / 表单提交发回后端。后端需要继续把这些输入视为新的 agent 输入。

也就是保留这条链：

```text
TextField/Button
  -> userAction
  -> A2A message
  -> agent
  -> 新一轮 A2UI 消息
```

---

## 7. 最小实施步骤

## 第 1 步：复制一个现有 ADK 示例作为骨架

建议以这类目录为起点：

- `samples/agent/adk/contact_lookup`
- `samples/agent/adk/restaurant_finder`

理由：

- 已经有 A2A server
- 已经有 agent card
- 已经有 A2UI schema / parse / validate 流程
- 已经有前端现成接入方式

## 第 2 步：替换模型调用层

把现在默认的 Gemini / LiteLLM 配置替换为你的 OpenAI 兼容模型服务。

可选做法：

### 做法 A：继续用 LiteLLM

优点：

- 改动最小
- 很多 OpenAI-compatible provider 可直接接入
- 和现有 sample 风格一致

### 做法 B：直接改用 OpenAI SDK / 兼容 SDK

优点：

- 依赖更清晰
- 对你自己的服务更可控

代价：

- 你需要自己维护 prompt、response parsing、重试等逻辑

## 第 3 步：约束模型输出格式

建议不要让模型自由输出整段文本后再“猜 JSON”。

推荐至少做到：

- 固定分隔符或固定 JSON 区块
- 要求最终输出为 A2UI 消息数组
- 在服务端做 JSON parse
- 在服务端做 schema validate
- 失败时重试或降级为纯文本

仓库里的 agent development 文档也强调了：

- `docs/guides/agent-development.md:93`
- `docs/guides/agent-development.md:174`

## 第 4 步：继续返回 A2A DataPart

前端读取的是 A2A response 里的 `data` part，而不是普通字符串。

所以最终返回要保持为：

```json
{
  "kind": "data",
  "mimeType": "application/json+a2ui",
  "data": [ ... A2UI messages ... ]
}
```

## 第 5 步：把 React shell 的 `serverUrl` 指到你的新服务

需要改的通常只是配置值，例如：

- `samples/client/react/shell/src/configs/*.ts`

如果地址不变，前端甚至可以完全不改。

---

## 8. 推荐的目录职责划分

如果你在仓库内落地一个新的 agent，建议职责这样分：

```text
custom_agent/
  __main__.py            # A2A server 入口
  agent.py               # agent 主逻辑
  prompt.py              # system prompt / few-shot examples
  a2ui_schema.py         # A2UI schema / catalog prompt 片段
  parser.py              # 模型输出解析
  validator.py           # schema 校验
  transport.py           # A2A response 封装
```

重点是把“模型调用”和“协议封装”分开，避免所有逻辑塞进一个文件。

---

## 9. 这个方案的优点

- **前端基本不动**
- 保留现成 React shell
- 保留 `userAction` 回传机制
- 保留多轮 UI 更新能力
- 只替换模型供应商，迁移成本最低
- 可先用 mock 对齐 A2UI，再接真实模型

---

## 10. 这个方案的风险

### 10.1 OpenAI-compatible 不代表行为完全兼容

很多兼容接口只兼容 HTTP 形状，不完全兼容：

- tool call 语义
- structured output
- JSON mode
- streaming chunk 格式

所以要优先验证：

- JSON 输出稳定性
- 最大 token
- 中文 prompt 质量
- 多轮上下文长度

### 10.2 让模型直接生成完整 A2UI，稳定性可能一般

如果 UI 复杂，模型直接吐完整 A2UI JSON 可能不稳定。

更稳的折中方式是：

- 模型返回业务 JSON
- 服务端再映射成固定 A2UI 模板

但这属于进一步工程化，不是最小替换路径。

### 10.3 现有 sample 里有 Gemini 环境变量检查

例如：

- `samples/agent/adk/contact_lookup/__main__.py:43`

如果你是从 sample 复制代码，要删掉或改掉这类 Gemini 专属启动检查，否则会把无关约束保留下来。

---

## 11. 推荐的验证顺序

### 阶段 1：先不接真实模型

先手写一个固定 A2UI response，验证：

- agent-card 可访问
- React shell 能连上
- A2A DataPart 能渲染
- 动作回传闭环正常

### 阶段 2：接 OpenAI-compatible 模型

验证：

- 文本输入能生成合法 A2UI
- 表单提交动作能生成下一轮合法 A2UI
- schema 校验失败时有降级路径

### 阶段 3：再优化 prompt / 模板

只在协议链路稳定后，再调：

- prompt
- few-shot 示例
- retry 策略
- 结构化输出模式

---

## 12. 最终结论

这是当前仓库里 **最值得优先尝试** 的方案。

一句话概括：

**保留 A2A agent 外壳和 A2UI 返回契约，只把内部模型调用从 Gemini 换成 OpenAI-compatible 接口。**

它最符合 KISS / YAGNI：

- KISS：前端不动，协议不动，只换模型层
- YAGNI：不额外引入 transport 改造或适配服务
- DRY：复用现成 A2A / agent-card / A2UI 骨架
- SRP：模型调用层与协议层分离
