# @a2ui/web_core v0.9 架构详解

`@a2ui/web_core` 是 A2UI 的框架无关核心库，负责协议消息处理、响应式状态管理和数据绑定。它是所有渲染器（React、Vue、Lit 等）的基础。

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Agent (LLM / 后端服务)                          │
│                                                                     │
│  生成 A2UI JSON 消息 (JSONL 格式)                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ A2uiMessage[]
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Processing Layer (消息处理层)                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  MessageProcessor<Catalog<T>>                                 │  │
│  │                                                               │  │
│  │  processMessages()                                            │  │
│  │    ├── createSurface  → SurfaceGroupModel.addSurface()        │  │
│  │    ├── deleteSurface  → SurfaceGroupModel.deleteSurface()     │  │
│  │    ├── updateComponents → SurfaceModel.componentsModel        │  │
│  │    └── updateDataModel  → SurfaceModel.dataModel              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  State Layer (状态层)                                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SurfaceGroupModel                                            │  │
│  │  ├── surfacesMap: Map<string, SurfaceModel>                  │  │
│  │  ├── onSurfaceCreated: EventSource                           │  │
│  │  ├── onSurfaceDeleted: EventSource                           │  │
│  │  └── onAction: EventSource (聚合所有 Surface 的 action)       │  │
│  │         │                                                     │  │
│  │         ▼                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  SurfaceModel                                           │ │  │
│  │  │  ├── dataModel: DataModel       (响应式数据存储)        │ │  │
│  │  │  ├── componentsModel: SurfaceComponentsModel            │ │  │
│  │  │  │     ├── components: Map<string, ComponentModel>      │ │  │
│  │  │  │     ├── onCreated: EventSource                       │ │  │
│  │  │  │     └── onDeleted: EventSource                       │ │  │
│  │  │  ├── catalog: Catalog<T>         (组件目录)             │ │  │
│  │  │  ├── onAction: EventSource                               │ │  │
│  │  │  └── onError: EventSource                                │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Rendering Layer (渲染层)                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ComponentContext                                             │  │
│  │  ├── componentModel: ComponentModel                          │  │
│  │  ├── dataContext: DataContext         (数据访问上下文)        │  │
│  │  ├── surfaceComponents: SurfaceComponentsModel               │  │
│  │  ├── theme: any                                              │  │
│  │  └── dispatchAction(action) → SurfaceModel.dispatchAction()  │  │
│  │         │                                                     │  │
│  │         ▼                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  DataContext                                            │ │  │
│  │  │  ├── dataModel: DataModel                               │ │  │
│  │  │  ├── functionInvoker: FunctionInvoker                   │ │  │
│  │  │  ├── path: string (当前作用域路径)                       │ │  │
│  │  │  ├── resolveDynamicValue(value) → V                     │ │  │
│  │  │  ├── subscribeDynamicValue(value, onChange) → Sub       │ │  │
│  │  │  ├── resolveSignal(value) → Signal<V>                   │ │  │
│  │  │  ├── set(path, value)                                   │ │  │
│  │  │  └── nested(relativePath) → DataContext                 │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  GenericBinder<T>                                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  Schema Scraping (构建时)                                │ │  │
│  │  │  scrapeSchemaBehavior(zodSchema) → BehaviorNode         │ │  │
│  │  │                                                         │ │  │
│  │  │  BehaviorNode 类型:                                     │ │  │
│  │  │  ├── DYNAMIC     → 订阅 DataModel 路径                 │ │  │
│  │  │  ├── ACTION      → 生成 () => void 闭包                │ │  │
│  │  │  ├── STRUCTURAL  → 模板列表渲染                         │ │  │
│  │  │  ├── CHECKABLE   → 验证规则评估                         │ │  │
│  │  │  ├── STATIC      → 原样传递                             │ │  │
│  │  │  ├── OBJECT      → 递归遍历子属性                       │ │  │
│  │  │  └── ARRAY        → 递归遍历数组元素                     │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  ��� 运行时绑定流程 (resolveAndBind)                          │ │  │
│  │  │                                                         │ │  │
│  │  │  Raw JSON properties                                    │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼ 遍历 BehaviorNode 树                            │ │  │
│  │  │  ┌─────────────┐                                        │ │  │
│  │  │  │ DYNAMIC     │──→ DataContext.subscribeDynamicValue() │ │  │
│  │  │  │ {path:"/x"} │──→ DataModel.getSignal("/x")          │ │  │
│  │  │  └─────────────┘         │                              │ │  │
│  │  │                          ▼                              │ │  │
│  │  │               updateDeepValue() → currentProps          │ │  │
│  │  │                          │                              │ │  │
│  │  │  ┌─────────────┐        ▼                              │ │  │
│  │  │  │ ACTION      │──→ () => dispatchAction(resolved)     │ │  │
│  │  │  │ {event:...} │                                        │ │  │
│  │  │  └─────────────┘                                        │ │  │
│  │  │  ┌─────────────┐                                        │ │  │
│  │  │  │ STRUCTURAL  │──→ [{id, basePath}, ...]              │ │  │
│  │  │  │ {path,cmpId}│                                        │ │  │
│  │  │  └─────────────┘                                        │ │  │
│  │  │  ┌─────────────┐                                        │ │  │
│  │  │  │ CHECKABLE   │──→ isValid + validationErrors          │ │  │
│  │  │  │ [{cond,msg}]│                                        │ │  │
│  │  │  └─────────────┘                                        │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  currentProps: T → notify() → propsListeners           │ │  │
│  │  │       │                                                 │ │  │
│  │  │       ▼                                                 │ │  │
│  │  │  subscribe(listener) ← 框架适配器调用                    │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Framework Adapter Layer (框架适配层)                                │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  React Adapter   │  │  Vue Adapter     │  │  Lit Adapter     │  │
│  │                  │  │                  │  │                  │  │
│  │  useState +      │  │  ref() +         │  │  @property +     │  │
│  │  useEffect →     │  │  watch() →       │  │  @signal →       │  │
│  │  GenericBinder   │  │  GenericBinder   │  │  GenericBinder   │  │
│  │  .subscribe()    │  │  .subscribe()    │  │  .subscribe()    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 五层架构详解

### 第一层：消息处理 (Processing)

**核心类**：`MessageProcessor<T>`

负责将 Agent 发送的 JSON 消息转换为内部状态变更。

```
Agent JSON → MessageProcessor.processMessages() → 状态变更
```

支持的消息类型：
| 消息类型 | 作用 | 目标 |
|---------|------|------|
| `createSurface` | 创建一个新的 UI Surface | → `SurfaceGroupModel.addSurface()` |
| `deleteSurface` | 删除一个 Surface | → `SurfaceGroupModel.deleteSurface()` |
| `updateComponents` | 更新/创建/替换组件 | → `SurfaceComponentsModel` |
| `updateDataModel` | 更新数据模型 | → `DataModel.set()` |

消息处理规则：
- 每条消息只能包含一种操作类型
- `updateComponents` 支持组件的创建、属性更新和类型替换
- 组件类型变更时先删除旧组件再创建新组件

### 第二层：状态管理 (State)

#### `SurfaceGroupModel` — 顶层容器

管理所有活跃的 Surface，是整个状态树的根：

```
SurfaceGroupModel
├── surfacesMap: Map<string, SurfaceModel>
├── onSurfaceCreated  → Surface 创建时触发
├── onSurfaceDeleted  → Surface 删除时触发
└── onAction          → 聚合所有 Surface 的用户操作
```

- 自动订阅每个 Surface 的 `onAction` 事件并向上传播
- Surface 删除时自动 dispose 和取消订阅

#### `SurfaceModel` — 单个 UI 表面

一个 Surface 代表一个完整的 UI 界面实例：

```
SurfaceModel
├── id: string
├── catalog: Catalog<T>           — 组件目录（类型定义 + 函数）
├── theme: any                    — 主题配置
├── sendDataModel: boolean        — 是否上报数据模型到 Agent
├── dataModel: DataModel          — 响应式数据存储
├── componentsModel: SurfaceComponentsModel  — 组件集合
├── onAction                       — 用户操作事件
└── onError                        — 错误事件
```

Action 分发流程：
```
用户点击 → Component.dispatchAction()
         → SurfaceModel.dispatchAction()
         → A2uiClientActionSchema.safeParse() (验证)
         → SurfaceGroupModel._onAction.emit()
         → 框架适配器的 onAction 回调
```

#### `DataModel` — 响应式数据存储

基于 JSON Pointer 的树形数据存储，底层使用 `@preact/signals-core`：

```
DataModel
├── get(path) → value              — 读取路径值
├── set(path, value)               — 写入路径值
├── getSignal(path) → Signal<T>    — 获取响应式 Signal
├── subscribe(path, onChange)      — 订阅路径变化
└── dispose()                      — 清理所有 Signal
```

关键特性：
- `set()` 自动通知祖先路径和后代路径的 Signal
- 使用 `batch()` 合并多次通知，避免不必要的更新
- 路径格式为 JSON Pointer（如 `/user/name`、`/items/0/price`）

#### `ComponentModel` — 组件状态

```
ComponentModel
├── id: string
├── type: string                   — 组件类型名（如 "Button"、"Text"）
├── properties: Record<string, any> — 原始 JSON 属性
└── onUpdated                       — 属性变更事件
```

#### `SurfaceComponentsModel` — 组件集合

```
SurfaceComponentsModel
├── components: Map<string, ComponentModel>
├── addComponent(model)     — 添加组件
├── removeComponent(id)     — 移除组件
├── get(id) → ComponentModel
├── onCreated               — 组件创建事件
└── onDeleted               — 组件删除事件
```

### 第三层：渲染绑定 (Rendering)

#### `ComponentContext` — 组件渲染上下文

每次渲染一个组件时创建，提供该组件所需的所有运行时信息：

```
ComponentContext
├── componentModel      — 组件自身的状态
├── dataContext         — 数据访问上下文（scoped 到组件位置）
├── surfaceComponents   — 整个 Surface 的组件集合
├── theme               — Surface 主题
└── dispatchAction()    — 操作分发方法
```

#### `DataContext` — 数据作用域

`DataContext` 是 DataModel 的视图层，为每个组件提供独立的数据作用域：

```
DataContext
├── surface             — 所属 Surface
├── path                — 当前作用域的绝对路径
├── dataModel           — 全局 DataModel 引用
├── functionInvoker     — 函数调用执行器
│
├── resolveDynamicValue(value) → V
│   ├── 字面量 → 原值返回
│   ├── {path: "/x"} → DataModel.get(absolutePath)
│   └── {call: "required", args: {...}} → FunctionInvoker
│
├── subscribeDynamicValue(value, onChange) → DataSubscription
│   └── resolveSignal(value) + effect() 监听变化
│
├── resolveSignal(value) → Signal<V>
│   ├── 字面量 → signal(literal)
│   ├── {path: "/x"} → DataModel.getSignal(absolutePath)
│   └── {call: "f", args: {...}} → computed(递归解析)
│
├── set(path, value)    — 写入 DataModel
└── nested(relativePath) → 新的 DataContext（子作用域）
```

嵌套作用域示例（模板列表）：
```
DataContext(path="/")
  └── nested("items") → DataContext(path="/items")
        └── nested("0") → DataContext(path="/items/0")
              └── resolveDynamicValue({path: "name"})
                    → DataModel.get("/items/0/name")
```

#### `GenericBinder<T>` — 通用绑定引擎

`GenericBinder` 是整个渲染系统的核心，它将原始 JSON 属性转换为响应式的、类型安全的组件 props。

**Schema Scraping（构建时）**

分析 Zod Schema，为每个属性确定运行时行为：

```ts
scrapeSchemaBehavior(ButtonApi.schema)
// 结果（简化）：
{
  type: 'OBJECT',
  shape: {
    child:     { type: 'STATIC' },      // 组件 ID，直接传递
    variant:   { type: 'STATIC' },      // 枚举值，直接传递
    action:    { type: 'ACTION' },      // 操作定义 → 生成 () => void
    checks:    { type: 'CHECKABLE' },   // 验证规则 → 评估 isValid
    // ... 以及自动生成的 set* 方法
  }
}
```

Behavior 识别规则：
| Zod Schema 特征 | 识别为 | 运行时行为 |
|----------------|--------|-----------|
| Union 包含 `{event: ...}` | `ACTION` | 生成可调用闭包 `() => void` |
| Union 包含 `{path: ...}` (无 `componentId`) | `DYNAMIC` | 订阅 DataModel 路径 |
| Union 包含 `{componentId, path}` | `STRUCTURAL` | 模板列表，生成 `[{id, basePath}]` |
| 属性名 `checks` | `CHECKABLE` | 评估验证规则，注入 `isValid` |
| `ZodObject` | `OBJECT` | 递归遍历子属性 |
| `ZodArray` | `ARRAY` | 递归遍历数组元素 |
| 其他 | `STATIC` | 原样传递 |

**运行时绑定流程**

```
1. 构造: GenericBinder(context, schema)
   ├── scrapeSchemaBehavior(schema) → behaviorTree
   └── resolveInitialProps() → 同步解析初始属性值

2. subscribe(listener) → 首次调用时触发 connect()
   ├── 订阅 componentModel.onUpdated → rebuildAllBindings()
   └── rebuildAllBindings()
       ├── 清理旧的 dataListeners
       ├── resolveAndBind(rawProps, behaviorTree, [])
       │   ├── DYNAMIC → subscribeDynamicValue() + onChange → updateDeepValue
       │   ├── ACTION → () => dispatchAction(resolveDeepSync(rawAction))
       │   ├── STRUCTURAL → subscribeDynamicValue() → [{id, basePath}]
       │   ├── CHECKABLE → 逐条评估条件 → isValid + validationErrors
       │   ├── OBJECT → 递归 + 自动生成 set* 方法
       │   ├── ARRAY → 递归每个元素
       │   └── STATIC → 原值
       └── notify() → listener(currentProps)

3. DataModel 变更 → Signal 更新 → effect() → onChange → updateDeepValue → notify()
```

**类型转换过程**：

```
原始 JSON (Agent 发送)                    解析后的 Props (组件接收)
─────────────────────                     ────────────────────────
{ text: { path: "/title" } }        →    { text: "Hello World" }     // DYNAMIC
{ action: { event: {...} } }        →    { action: () => void }      // ACTION
{ children: { path: "/items",       →    { children: [{ id: "tpl",   // STRUCTURAL
    componentId: "tpl" } }                   basePath: "/items/0" }] }
{ checks: [{ condition: {...},       →    { isValid: true,            // CHECKABLE
    message: "Required" }] }                 validationErrors: [] }
{ variant: "primary" }              →    { variant: "primary" }      // STATIC
                                         + setText("new value")      // 自动生成 setter
```

### 第四层：目录系统 (Catalog)

#### `Catalog<T>` — 组件与函数注册表

```ts
class Catalog<T extends ComponentApi> {
  id: string                    // Catalog URI 标识符
  components: Map<string, T>    // 组件类型名 → 组件实现
  functions: Map<string, FunctionDefinition>  // 函数名 → 函数定义
  invoker: FunctionInvoker      // 函数执行器
  themeSchema?: ZodSchema       // 可选的主题 Schema
}
```

#### `FunctionInvoker` — 函数调用执行器

执行 A2UI 协议中定义的验证和转换函数：

```ts
// 内置函数 (BASIC_FUNCTIONS)
required(value)          → boolean    // 非空检查
length(value, min?, max?) → boolean   // 长度检查
and(values: boolean[])   → boolean    // 逻辑与
or(values: boolean[])    → boolean    // 逻辑或
not(value: boolean)      → boolean    // 逻辑非
formatDate(value, fmt)   → string     // 日期格式化
```

### 第五层：Schema 系统

#### 双用途 Zod Schema

A2UI 的 Zod Schema 同时服务于两个目的：

1. **消息验证**：运行时验证 Agent 发送的消息格式
2. **绑定分析**：`GenericBinder` 通过分析 Schema 树结构确定属性的运行时行为

```
Schema 文件结构:
v0_9/
├── schema/
│   ├── server-to-client.ts    ← A2uiMessage 联合类型
│   │   ├── CreateSurfaceMessage
│   │   ├── UpdateComponentsMessage
│   │   ├── UpdateDataModelMessage
│   │   └── DeleteSurfaceMessage
│   ├── client-to-server.ts    ← A2uiClientAction 客户端→Agent
│   ├── client-capabilities.ts ← 客户端能力声明
│   └── common-types.ts        ← 共享类型
│       ├── DynamicString = z.string() | DataBindingSchema
│       ├── DataBindingSchema = { path: z.string() }
│       ├── FunctionCall = { call: z.string(), args: z.record(...) }
│       ├── Action = { event: ... } | { functionCall: ... }
│       └── ChildList = z.array(z.string()) | { path, componentId }
└── basic_catalog/
    ├── text.ts          ← TextApi (Zod Schema + 元数据)
    ├── button.ts        ← ButtonApi
    ├── ...18 个组件
    └── functions.ts     ← BASIC_FUNCTIONS
```

## 数据流完整路径

以一个带数据绑定的按钮为例，追踪从 Agent 消息到用户交互的完整数据流：

```
1. Agent 发送:
   {"version":"v0.9","createSurface":{"surfaceId":"s1","catalogId":"...","sendDataModel":true}}
   {"version":"v0.9","updateComponents":{"surfaceId":"s1","components":[
     {"id":"root","component":"Button","child":"label",
      "action":{"event":{"name":"click","context":{"count":{"path":"/count"}}}}},
     {"id":"label","component":"Text","text":{"path":"/label"}}
   ]}}
   {"version":"v0.9","updateDataModel":{"surfaceId":"s1","value":{"count":0,"label":"Click me"}}}

2. 消息处理:
   MessageProcessor.processMessages(messages)
   ├── createSurface → new SurfaceModel("s1", catalog) → SurfaceGroupModel.addSurface()
   │                   → onSurfaceCreated 事件 → Vue ref 更新 → A2uiSurface 渲染
   ├── updateComponents → new ComponentModel("root","Button",{action:...})
   │                   → SurfaceComponentsModel.addComponent()
   │                   → onCreated 事件 → DeferredChild 检测到组件
   │                   → ComponentContext 创建 → GenericBinder 初始化
   │                   → Schema scraping: action → ACTION, (无 DYNAMIC 属性)
   │                   → resolveAndBind: action → () => dispatchAction(...)
   │                   → currentProps = { action: [Function], child: "label" }
   │                   → notify() → Vue ref 更新 → Button 组件重渲染
   └── updateDataModel → DataModel.set("/", {count:0, label:"Click me"})
                       → Signals 更新 → GenericBinder 的 DYNAMIC 属性变更
                       → label 组件: text ref 从 "Loading..." → "Click me"

3. 用户点击按钮:
   Button onClick → props.action() (GenericBinder 生成的闭包)
   → ComponentContext.dispatchAction({event:{name:"click",context:{count:0}}})
   → SurfaceModel.dispatchAction()
   → A2uiClientActionSchema.safeParse() 验证
   → SurfaceGroupModel._onAction.emit()
   → useA2uiRenderer 的 onAction 回调
   → 应用代码将 action 发送给 Agent

4. Agent 回复:
   {"version":"v0.9","updateDataModel":{"surfaceId":"s1","value":{"count":1,"label":"Clicked!"}}}
   → DataModel.set("/", {...})
   → Signal 更新 → GenericBinder 的 subscribeDynamicValue onChange
   → currentProps 更新 → notify() → Vue ref → Button/Text 重渲染
```

## 目录结构

```
web_core/src/v0_9/
├── index.ts                    # 公共 API 导出
├── errors.ts                   # 自定义错误类型
├── processing/
│   └── message-processor.ts    # MessageProcessor — 消息处理
├── state/
│   ├── data-model.ts           # DataModel — 响应式数据存储
│   ├── component-model.ts      # ComponentModel — 单个组件状态
│   ├── surface-components-model.ts  # SurfaceComponentsModel — 组件集合
│   ├── surface-model.ts        # SurfaceModel — Surface 状态
│   └── surface-group-model.ts  # SurfaceGroupModel — Surface 集合
├── rendering/
│   ├── component-context.ts    # ComponentContext — 渲染上下文
│   ├── data-context.ts         # DataContext — 数据作用域
│   └── generic-binder.ts       # GenericBinder — 通用绑定引擎
├── catalog/
│   ├── types.ts                # Catalog、ComponentApi 类型
│   └── function_invoker.ts     # FunctionInvoker — 函数调用
├── schema/
│   ├── server-to-client.ts     # 服务端→客户端消息 Schema
│   ├── client-to-server.ts     # 客户端→服务端消息 Schema
│   ├── client-capabilities.ts  # 客户端能力声明 Schema
│   ├── common-types.ts         # 共享类型定义
│   └── index.ts                # Schema 导出
├── basic_catalog/
│   ├── text.ts ... button.ts   # 18 个组件的 Api 定义
│   ├── functions.ts            # BASIC_FUNCTIONS
│   └── index.ts                # basicCatalog 默认实例
├── common/
│   └── events.ts               # EventEmitter / EventSource / Subscription
├── reactivity/
│   └── signals.ts              # Signal 工具函数
└── schemas/
    └── server_to_client.json   # JSON Schema (用于 LLM 提示)
```

## 设计哲学

1. **框架无关**：`web_core` 不依赖任何 UI 框架，所有渲染逻辑通过 `GenericBinder.subscribe()` 的回调接口暴露
2. **Schema 驱动**：组件的行为（数据绑定、Action、验证）完全由 Zod Schema 决定，无需硬编码
3. **响应式内核**：内部使用 `@preact/signals-core` 实现细粒度响应式，但对外不暴露 Signal
4. **增量更新**：消息逐条处理，支持渐进式渲染，组件可随时创建、替换或删除
5. **安全验证**：所有 Agent 消息经过 Schema 验证，Action 输出经过 `A2uiClientActionSchema` 校验
