/**
 * A2UI Demo Examples
 *
 * Each example is an object with:
 * - name: display name
 * - description: what it demonstrates
 * - jsonl: string of newline-delimited JSON messages (one A2UI message per line)
 */

export interface DemoExample {
  name: string;
  description: string;
  jsonl: string;
}

// Helper: convert an array of message objects into JSONL string
function toJsonl(messages: object[]): string {
  return messages.map(m => JSON.stringify(m)).join('\n');
}

// ============================================================
// Example 1: Hello World (simplest possible)
// ============================================================
const helloWorld: DemoExample = {
  name: 'Hello World',
  description: '最基本的示例 — 一个静态文本卡片',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-hello',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-hello',
        components: [
          { id: 'root', component: 'Card', child: 'col' },
          {
            id: 'col',
            component: 'Column',
            children: ['title', 'body', 'btn-wrap'],
            align: 'center',
          },
          { id: 'title', component: 'Text', text: '👋 Hello from A2UI', variant: 'h2' },
          { id: 'body', component: 'Text', text: '这是一个使用 @a2ui/vue 渲染器生成的界面。', variant: 'body' },
          { id: 'btn-text', component: 'Text', text: '点击我' },
          { id: 'btn-wrap', component: 'Button', child: 'btn-text', action: { event: { name: 'hello_click', context: {} } } },
        ],
      },
    },
  ]),
};

// ============================================================
// Example 2: Flight Status (data binding + functions)
// ============================================================
const flightStatus: DemoExample = {
  name: '航班状态',
  description: '数据绑定、日期格式化函数、布局组件',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-flight',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-flight',
        components: [
          { id: 'root', component: 'Card', child: 'col' },
          { id: 'col', component: 'Column', children: ['header', 'route', 'divider', 'times'], align: 'stretch' },
          { id: 'header', component: 'Row', children: ['icon', 'number'], align: 'center' },
          { id: 'icon', component: 'Icon', name: 'send' },
          { id: 'number', component: 'Text', text: { path: '/flightNumber' }, variant: 'h3' },
          { id: 'route', component: 'Row', children: ['origin', 'arrow', 'dest'], align: 'center' },
          { id: 'origin', component: 'Text', text: { path: '/origin' }, variant: 'h2' },
          { id: 'arrow', component: 'Text', text: '→', variant: 'h2' },
          { id: 'dest', component: 'Text', text: { path: '/destination' }, variant: 'h2' },
          { id: 'divider', component: 'Divider' },
          { id: 'times', component: 'Row', children: ['dep-col', 'status-col', 'arr-col'], justify: 'spaceBetween' },
          { id: 'dep-col', component: 'Column', children: ['dep-label', 'dep-time'], align: 'start' },
          { id: 'dep-label', component: 'Text', text: '出发', variant: 'caption' },
          { id: 'dep-time', component: 'Text', text: { path: '/departureTime' }, variant: 'h3' },
          { id: 'status-col', component: 'Column', children: ['status-label', 'status-val'], align: 'center' },
          { id: 'status-label', component: 'Text', text: '状态', variant: 'caption' },
          { id: 'status-val', component: 'Text', text: { path: '/status' }, variant: 'body' },
          { id: 'arr-col', component: 'Column', children: ['arr-label', 'arr-time'], align: 'end' },
          { id: 'arr-label', component: 'Text', text: '到达', variant: 'caption' },
          { id: 'arr-time', component: 'Text', text: { path: '/arrivalTime' }, variant: 'h3' },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'demo-flight',
        value: {
          flightNumber: 'CA 981',
          origin: '北京',
          destination: '纽约',
          departureTime: '08:30',
          status: '准时',
          arrivalTime: '10:45',
        },
      },
    },
  ]),
};

// ============================================================
// Example 3: Login Form (validation + actions)
// ============================================================
const loginForm: DemoExample = {
  name: '登录表单',
  description: '表单验证、TextField、Button action 事件',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-login',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-login',
        components: [
          { id: 'root', component: 'Card', child: 'col' },
          { id: 'col', component: 'Column', children: ['title', 'email', 'password', 'login-btn'], align: 'stretch' },
          { id: 'title', component: 'Text', text: '欢迎回来', variant: 'h2' },
          {
            id: 'email',
            component: 'TextField',
            value: { path: '/email' },
            label: '邮箱',
            checks: [
              { condition: { call: 'required', args: { value: { path: '/email' } } }, message: '邮箱不能为空' },
            ],
          },
          {
            id: 'password',
            component: 'TextField',
            value: { path: '/password' },
            label: '密码',
            variant: 'obscured',
            checks: [
              { condition: { call: 'required', args: { value: { path: '/password' } } }, message: '密码不能为空' },
              { condition: { call: 'length', args: { value: { path: '/password' }, min: 6 } }, message: '密码至少6位' },
            ],
          },
          { id: 'btn-text', component: 'Text', text: '登录' },
          {
            id: 'login-btn',
            component: 'Button',
            child: 'btn-text',
            variant: 'primary',
            checks: [
              {
                condition: { call: 'and', args: { values: [{ call: 'required', args: { value: { path: '/email' } } }, { call: 'length', args: { value: { path: '/password' }, min: 6 } }] } },
                message: '请修正错误后登录',
              },
            ],
            action: { event: { name: 'login', context: { email: { path: '/email' } } } },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'demo-login',
        value: { email: '', password: '' },
      },
    },
  ]),
};

// ============================================================
// Example 4: Coffee Order (templated list + currency)
// ============================================================
const coffeeOrder: DemoExample = {
  name: '咖啡订单',
  description: '模板列表、数据驱动渲染、货币格式化',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-coffee',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-coffee',
        components: [
          { id: 'root', component: 'Card', child: 'col' },
          { id: 'col', component: 'Column', children: ['header', 'items', 'divider', 'total-row', 'actions'], align: 'stretch' },
          { id: 'header', component: 'Row', children: ['icon', 'store'], align: 'center' },
          { id: 'icon', component: 'Icon', name: 'favorite' },
          { id: 'store', component: 'Text', text: { path: '/storeName' }, variant: 'h3' },
          {
            id: 'items',
            component: 'Column',
            children: { path: '/items', componentId: 'item-tpl' },
          },
          { id: 'item-tpl', component: 'Row', children: ['item-name', 'item-price'], justify: 'spaceBetween' },
          { id: 'item-name', component: 'Text', text: { path: 'name' }, variant: 'body' },
          { id: 'item-price', component: 'Text', text: { path: 'price' }, variant: 'body' },
          { id: 'divider', component: 'Divider' },
          { id: 'total-row', component: 'Row', children: ['total-label', 'total-val'], justify: 'spaceBetween' },
          { id: 'total-label', component: 'Text', text: '合计', variant: 'h4' },
          { id: 'total-val', component: 'Text', text: { path: '/total' }, variant: 'h4' },
          { id: 'actions', component: 'Row', children: ['buy-btn'] },
          { id: 'buy-text', component: 'Text', text: '去支付' },
          { id: 'buy-btn', component: 'Button', child: 'buy-text', variant: 'primary', action: { event: { name: 'purchase', context: {} } } },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'demo-coffee',
        value: {
          storeName: '日出咖啡 ☀️',
          items: [
            { name: '燕麦拿铁', price: '¥32' },
            { name: '巧克力可颂', price: '¥18' },
          ],
          total: '¥50',
        },
      },
    },
  ]),
};

// ============================================================
// Example 5: Incremental Dashboard (progressive rendering)
// ============================================================
const incrementalDashboard: DemoExample = {
  name: '渐进式仪表盘',
  description: '多步 JSONL 演示增量渲染 — 先占位，再替换为真实内容',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-dashboard',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-dashboard',
        components: [
          { id: 'root', component: 'Column', children: ['header', 'grid'], align: 'stretch' },
          { id: 'header', component: 'Text', text: '📊 系统仪表盘', variant: 'h2' },
          { id: 'grid', component: 'Row', children: ['left', 'right'] },
          { id: 'left', component: 'Column', children: ['loading-a'] },
          { id: 'right', component: 'Column', children: ['loading-b'] },
          { id: 'loading-a', component: 'Text', text: '⏳ 加载分析数据...', variant: 'caption' },
          { id: 'loading-b', component: 'Text', text: '⏳ 加载日志...', variant: 'caption' },
        ],
      },
    },
    // Step 2: replace left panel with real content
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-dashboard',
        components: [
          { id: 'left', component: 'Column', children: ['stats-card'] },
          { id: 'stats-card', component: 'Card', child: 'stats-col' },
          { id: 'stats-col', component: 'Column', children: ['stats-title', 'stats-val'], align: 'center' },
          { id: 'stats-title', component: 'Text', text: '活跃用户', variant: 'caption' },
          { id: 'stats-val', component: 'Text', text: { path: '/activeUsers' }, variant: 'h1' },
        ],
      },
    },
    // Step 3: replace right panel with real content
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-dashboard',
        components: [
          { id: 'right', component: 'Column', children: ['logs-list'] },
          {
            id: 'logs-list',
            component: 'List',
            children: { path: '/logs', componentId: 'log-tpl' },
          },
          { id: 'log-tpl', component: 'Text', text: { path: 'message' }, variant: 'caption' },
        ],
      },
    },
    // Step 4: populate data
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'demo-dashboard',
        value: {
          activeUsers: '1,234',
          logs: [
            { message: '✅ 系统启动完成' },
            { message: '✅ 所有服务正常运行' },
            { message: '⏳ 等待用户操作...' },
          ],
        },
      },
    },
  ]),
};

// ============================================================
// Example 6: Choice Picker
// ============================================================
const choicePicker: DemoExample = {
  name: '选项选择器',
  description: 'ChoicePicker 多选/单选、chips 样式',
  jsonl: toJsonl([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'demo-choice',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'demo-choice',
        components: [
          { id: 'root', component: 'Card', child: 'col' },
          { id: 'col', component: 'Column', children: ['title', 'toppings', 'size'], align: 'stretch' },
          { id: 'title', component: 'Text', text: '🍕 定制披萨', variant: 'h2' },
          {
            id: 'toppings',
            component: 'ChoicePicker',
            value: { path: '/toppings' },
            label: '选择配料',
            displayStyle: 'chips',
            options: [
              { label: '芝士', value: 'cheese' },
              { label: '蘑菇', value: 'mushroom' },
              { label: '橄榄', value: 'olive' },
              { label: '辣椒', value: 'pepper' },
            ],
          },
          {
            id: 'size',
            component: 'ChoicePicker',
            value: { path: '/size' },
            label: '选择尺寸',
            variant: 'mutuallyExclusive',
            options: [
              { label: '小份', value: 'S' },
              { label: '中份', value: 'M' },
              { label: '大份', value: 'L' },
            ],
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'demo-choice',
        value: { toppings: ['cheese'], size: ['M'] },
      },
    },
  ]),
};

export const examples: DemoExample[] = [
  helloWorld,
  flightStatus,
  loginForm,
  coffeeOrder,
  incrementalDashboard,
  choicePicker,
];
