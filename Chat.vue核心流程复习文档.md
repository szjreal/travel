# Chat.vue AI 聊天页面核心流程复习文档

> 适用项目：`travel-h5`（前端）+ `travel-serve`（后端）
> 创建时间：2026-09-01

***

## 一、文件索引（复习时对照看）

| 文件                   | 路径                                                  | 角色                                   |
| -------------------- | --------------------------------------------------- | ------------------------------------ |
| Chat.vue             | `d:\code\travel-h5\src\views\Chat.vue`              | 数据管理者：持有 messages、发送消息、调用流式接口        |
| ChatBubble.vue       | `d:\code\travel-h5\src\components\ChatBubble.vue`   | 展示者：接收单条 message props，渲染气泡样式        |
| request.js           | `d:\code\travel-h5\src\untils\request.js`           | 通信搬运工：fetch SSE 流式请求，解析字节→文字→回调      |
| travel.js（后端）        | `d:\code\travel-serve\src\routes\travel.js`         | 路由层：接收 /chat 请求，调用 service，包装 SSE 发送 |
| travelService.js（后端） | `d:\code\travel-serve\src\service\travelService.js` | 服务层：组装 System+历史+当前消息 → 调用大模型流式接口    |

***

## 二、核心数据：`messages` 数组

### 2.1 声明与响应式原理

```javascript
// Chat.vue L85
const messages = ref([])
```

- `ref()` 返回的不是普通数组，而是**被 Proxy 代理过**的响应式对象

- 任何 `push/pop/改属性` 操作都会被 Proxy 拦截 → 通知 Vue 重新渲染

- Vue 怎么知道更新哪些组件？→ **依赖收集**：模板渲染时读取了 messages，Vue 就把"渲染函数"记为 messages 的依赖；数据变了只通知这些依赖

### 2.2 单条消息结构

```javascript
{
  id: 1725177600000,          // Date.now()，唯一标识，v-for 的 key
  role: 'user',               // 'user' = 用户消息，'ai' = AI 助手消息
  content: '北京有哪些景点',    // 消息正文
  timestamp: '2026-09-01T12:00:00.000Z'  // toISOString() 格式化的时间字符串
}
```

### 2.3 渲染链路

```html
<!-- Chat.vue L26 -->
<ChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
```

- v-for 循环 messages 数组，长度=数组长度

- 每项渲染 1 个 ChatBubble 子组件实例，用 msg.id 作为 key（保证同一条消息始终复用同一个 DOM 实例）

- **数组 push 新项** → 新增子组件实例；**数组项的属性被改** → 更新对应子组件的 props，不重建实例（打字机流畅的关键）

***

## 三、用户消息发送完整时序（以发送"北京景点"为例）

### 3.1 触发入口

```
用户回车 或 点"发送消息"按钮
  → 模板 L37: @keyup.enter="sendMessage" / L39: @click="sendMessage"
  → 触发 sendMessage()
```

### 3.2 sendMessage() 四步走（Chat.vue L68-L81）

| 行号  | 代码                                       | 做什么               | 之后的 messages 状态 |
| --- | ---------------------------------------- | ----------------- | --------------- |
| L69 | `const msg = inputMessage.value.trim()`  | 取出用户输入，去空格        | 不变              |
| L70 | `if(!msg \|\| isStreaming.value) return` | 空内容/正在回复中 → 拒绝发送  | 不变              |
| L73 | `addUserMessage(msg)`                    | **调下面这个函数加用户气泡**  | 多了1项用户消息        |
| L74 | `inputMessage.value = ''`                | 清空输入框             | 不变              |
| L79 | `fetchAIResponse(msg)`                   | 调用流式接口拿AI回复（见下一节） | 很快又多1项AI空占位     |

### 3.3 addUserMessage() 具体做了什么（Chat.vue L114-L122）

```javascript
const addUserMessage = (content) => {
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  })
}
```

- 直接 push 一条完整的用户消息对象到 messages

- push 后 Proxy 检测到数组长度+1 → Vue 重新渲染 v-for → 新增 1 个 ChatBubble 实例（key=新id）→ 页面出现用户蓝色气泡

***

## 四、AI 流式回复核心：`fetchAIResponse()`（Chat.vue L124-L200）

### 4.1 六步执行流程

```
fetchAIResponse("北京景点")
  │
  ├─① isStreaming.value = true
  │    输入框 disabled、按钮变"停止生成"、loading 显示
  │
  ├─② messages.value.push({ id:.., role:'ai', content:'', timestamp:... })
  │    【关键】push 一条 content 为空的 AI 占位消息！
  │    Proxy 检测 → 新增 1 个 ChatBubble（空气泡，但盒子已占位置）
  │    messages.value 现在有 2 项：[用户消息, 空AI消息]
  │
  ├─③ const history = buildHistory()
  │    整理干净的历史对话发给后端（下节详解）
  │
  ├─④ fetchStream('chat', { message: userMsg, history }, onChunk, onError, onComplete, onAbort)
  │    发起流式请求，传 4 个回调函数
  │    （回调不是立刻执行，由 request.js 在合适时机调用）
  │
  ├─⑤ 流式数据不断到达 → 反复触发 onChunk → 改 messages[1].content → 同一个 ChatBubble 不断刷新文字
  │
  └─⑥ 传输结束 onComplete: isStreaming=false，loading 消失
```

### 4.2 关于 userMsg 变量名（参数传递链）

```
用户输入存在 inputMessage.value = "北京景点"
  → sendMessage() L69: const msg = inputMessage.value.trim()        msg = "北京景点"
  → sendMessage() L79: fetchAIResponse(msg)                         实参传 msg
  → fetchAIResponse() L124: const fetchAIResponse = (userMsg)=>{}   形参用 userMsg 接住
  → fetchAIResponse() L144: { message: userMsg, history }           组装请求体

userMsg 只是形参名字，可以叫 question/text/xxx，值始终是用户输入的内容。
左边的 message 是和后端约定的字段名（travel.js L54 解构用的），不能改。
```

***

## 五、`buildHistory()` 的作用（Chat.vue L93-L100）

```javascript
const buildHistory = () => {
  return messages.value
    .filter(msg => msg.content && msg.content.trim() !== '')
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))
}
```

### 5.1 为什么不能直接发 messages.value？两个原因

#### 原因1：空 AI 占位消息在数组里了（filter 解决）

buildHistory 是在 fetchAIResponse 的**第②步 push 空气泡之后**才调用的，此时：

```
messages.value = [
  { role:'user', content:'之前的对话' },
  { role:'ai',   content:'之前的回答' },
  { role:'user', content:'北京景点' },
  { role:'ai',   content:'' }       ← 刚push的空占位！
]
```

如果直接发，第4条 role='ai' content='' 也会发给大模型 → 大模型以为"AI说了空话" → 回复质量下降甚至出错。

`.filter(msg => msg.content && ...)` 把 content 是空的全部干掉，只留有真实内容的消息。

#### 原因2：去掉多余字段 id/timestamp（map 解决）

直接发 messages.value 会把：

- `id`（前端本地用的时间戳）

- `timestamp`（前端浏览器本地时间）

这些后端完全不需要的字段一起带过去。后果：

- 后端开严格字段校验（class-validator/Joi unknown(false)）直接报错

- 以后加前端专用字段（isRead、edited、attachments 等）会泄露或污染数据库

- 违反接口契约

`.map()` 只保留 `{role, content}`，干净、契约明确。

### 5.2 buildHistory 前后对比

| 状态                     | 内容                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 原 messages.value（4项）   | `[{id,role:'user',content:'...',ts}, {id,role:'ai',content:'...',ts}, {id,role:'user',content:'北京景点',ts}, {id,role:'ai',content:'',ts}]` |
| .filter 之后（3项）         | 去掉第4条空的，剩3项                                                                                                                              |
| .map 之后（3项，最终 history） | `[{role:'user',content:'...'}, {role:'ai',content:'...'}, {role:'user',content:'北京景点'}]`                                                 |

***

## 六、空 AI 占位消息（第②步 push）的必要性

### 6.1 如果不先 push，第一片数据到了才 push，会怎样？

```
有占位（现在的写法）：
  点发送 → 立刻出现用户气泡 + 空气泡 + loading → 然后空气泡里一个个冒字
  ✅ 用户马上看到反馈，知道"请求已发出，AI在处理"

无占位（删除L127-132）：
  点发送 → 只有用户气泡 + loading → 等 50-500ms → AI气泡突然蹦出来
  ❌ 用户会疑惑"发出去了吗？没反应啊？" → 卡顿感、心理不安全感
```

### 6.2 配合 ChatBubble 渲染细节

空气泡 push 后，ChatBubble 里两处判断让它"占位置但不显示内容"：

- **v-if="message.content"**（ChatBubble.vue L6）→ content 空，不渲染文字

- **showTime = timestamp && content**（ChatBubble.vue L27）→ content 空，不显示时间戳

所以空气泡的结果是：**CSS 盒子撑开占了位置（flex 布局有 min-height），里面没文字没时间**。当第一片数据到了，content 从 '' → 非空，两处判断同时通过，文字和时间一起显示出来，语义完整。

### 6.3 简化 onChunk 逻辑

先占位后，onChunk 永远只需"拿最后一条，改它的 content"。
如果不先占位，onChunk 得每一片都判断"最后一条是不是AI消息 → 不是就 push 新的 → 是就改"，多了 if/else，逻辑变绕。

***

## 七、流式回调 `(chunk) => {...}` 完整解析（Chat.vue L170-L178）

### 7.1 chunk 从哪来？数据旅行图

```
【后端 travelService L255】
  streamCallback(content);        content = "北"
   ↓
【后端 travel.js L71】
  stream.send({type:'chunk', content: chunk});
  → 发到网络上的字符串 = 'data: {"type":"chunk","content":"北"}\n\n'
   ↓
【前端 request.js L88】
  const {done, value} = await reader.read();  value 是二进制 Uint8Array
   ↓
【request.js L95】
  const chunk = decoder.decode(value, {stream:true});
  chunk = 'data: {"type":"chunk","content":"北"}\n\n'
   ↓
【request.js L97】
  const lines = chunk.split('\n').filter(...)
   ↓
【request.js L107】
  const jsonstr = line.replace(/^data:\s*/, '').trim()
  jsonstr = '{"type":"chunk","content":"北"}'
   ↓
【request.js L110】
  const jsonData = JSON.parse(jsonstr);
  jsonData = { type: 'chunk', content: '北' }
   ↓
【request.js L118⭐关键调用】
  onChunk(jsonData.content);
  → 执行权跳回 Chat.vue 传进来的那个 (chunk)=>{} 回调
  → 形参 chunk = jsonData.content = "北"
```

### 7.2 onChunk 三行代码逐运算拆解

```javascript
// ====== 前置状态 ======
// fullResponse 声明在 fetchAIResponse L134: let fullResponse = ''
// 这是第一次进 onChunk，fullResponse 还是空字符串
// messages.value = [
//   0: {id:100, role:'user', content:'北京景点', timestamp:'...'}  地址#A01
//   1: {id:101, role:'ai',   content:'',         timestamp:'...'}  地址#A02
// ]
// fullResponse = ""
// chunk = "北"

// ====== 第1行 ======
const lastMsg = messages.value[messages.value.length - 1]
// 计算：
//   messages.value.length = 2
//   2 - 1 = 1            ← 数组最后一个的下标
//   messages.value[1] = {id:101, role:'ai', ...} 对象的"钥匙(地址)#A02"
//   lastMsg = #A02 钥匙的副本（和 messages.value[1] 指向同一个储物柜！）
//
// ⚠️ 重要：对象是引用类型，这里不是复制对象，是复制"地址钥匙"。
//   改 lastMsg.content = xxx 等于改 messages.value[1].content

// ====== 第2行 ======
if (lastMsg && lastMsg.role === 'ai')
// 两道保险：
//  条件1 lastMsg：防止数组为空时 messages.value[-1]=undefined 导致后续 TypeError
//    数组空 → lastMsg=undefined → 条件假 → 跳过，不崩
//  条件2 lastMsg.role==='ai'：防止异常情况下(如连发)最后一条其实是用户消息，误把AI文字写到用户气泡里
//    role='user' → 条件假 → 跳过，不写错对象
//  两道都真 → 进入大括号执行
//
// 我们的例子：
//   lastMsg = {role:'ai'...} → truthy
//   lastMsg.role = 'ai' === 'ai' → true
//   两个条件都真 → 进入

// ====== 第3行 ======
  lastMsg.content = fullResponse
// 此时 fullResponse = "" + "北"（上一行 fullResponse += chunk 的结果）
// 用钥匙 #A02 打开储物柜，找到 content 字段 → 从 '' 改成 '北'
// 因为 messages.value[1] 也拿着 #A02 钥匙，所以它看到的 content 也变了！
// 然后 Proxy 检测到 messages.value[1].content 被修改 → Vue 找到 ChatBubble key=101
//   → 更新子组件 props → 气泡文字从空→"北" → 页面更新
```

### 7.3 scrollToBottom()

```javascript
// Chat.vue L217-L221
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
```

每次 onChunk 和 onComplete 后调用，把聊天容器滚动条拉到最底，新冒出来的字始终可见。

***

## 八、ChatBubble.vue 渲染配合（ChatBubble.vue L1-L36）

### 8.1 接收 props

```javascript
const props = defineProps({
  message: { type: Object, required: true }
})
```

只读，不持有数据。父组件 v-for 循环把单条消息传给它。

### 8.2 三个 computed

| computed     | 代码                                          | 作用        | 空气泡时的结果                   | 有内容时的结果           |
| ------------ | ------------------------------------------- | --------- | ------------------------- | ----------------- |
| messageClass | `role==='user'?'user-message':'ai-message'` | 设置气泡靠左/靠右 | `'ai-message'`（靠左，透明底深灰字） | 同左                |
| showTime     | `timestamp && content`                      | 要不要显示时间戳  | `false`（content 空）→ 不渲染时间 | `true` → 渲染 HH:mm |
| formatTime   | ISO 字符串 → HH:mm                             | 格式化时间     | ''                        | '20:00'           |

### 8.3 模板关键判断

```html
<!-- L4 用户消息直接显示 -->
<div v-if="role==='user'">{{ content }}</div>

<!-- L5-L7 AI消息：content 空时，template v-if 不渲染任何文字 -->
<div v-else>
  <template v-if="message.content">{{ message.content }}</template>
</div>
```

### 8.4 流式过程中同一个 ChatBubble 实例的状态变化

```
push 空气泡时（content=''）：
  ChatBubble 实例 #key=101 被创建
    messageClass = ai-message → 靠左盒子
    showTime = false → 没时间
    template v-if = false → 无文字
    页面效果：左边一个"空盒子"占位

第1片数据到（content='北'）：
  同一个实例 #key=101，Vue 只更新 props.message.content
    messageClass = 没变
    showTime = true（content 有了）→ 时间戳突然出现
    template v-if = true → 文字 '北' 被渲染
    页面效果：空气泡里冒出第一个字 + 时间

后续每片：
  同一个实例 props.content 不断更新 → 文字不断变长 → 盒子高度变化 → 滚动条下拉
  ✅ 全程不销毁重建组件，只有文字变化，所以打字机效果丝滑
```

***

## 九、Vue 响应式原理（Proxy + 依赖收集）

### 9.1 ref() 做了什么

`messages = ref([])` 返回的是带 getter/setter 的对象：

- 读 `messages.value` → get() 里偷偷记录"谁在读我"（依赖收集）

- 改 `messages.value = xxx` → set() 里通知所有依赖"该更新了"

- `messages.value` 里面真正的数组和数组里面的对象都被 Proxy 包装

### 9.2 Proxy 怎么工作

```javascript
// 简化版 Proxy 演示
const 间谍数组 = new Proxy(原始数组, {
  set(target, key, value) {
    console.log('🕵️ 有人改了下标', key, '=', value)
    target[key] = value
    console.log('   → 通知Vue：去重新渲染！')
    return true
  },
  get(target, key) {
    console.log('🕵️ 有人读了下标', key)
    // 顺便把读取者（渲染函数）记到依赖表里
    return target[key]
  }
})
```

任何 push/pop/改属性都会先经过 Proxy 间谍 → Vue 立刻知情。

### 9.3 依赖收集与触发四步

```
① 组件首次渲染 → 执行渲染函数 → 模板 v-for 读 messages.value
   → Proxy.get 被触发 → Vue 记下：Chat.vue 渲染函数 依赖于 messages

② 用户代码 push/改 messages.value[i].content
   → Proxy.set 被触发

③ Vue 查依赖表 → 找到 Chat.vue 渲染函数
   → 把"重新渲染Chat.vue"放进下一个微任务队列（批量异步）

④ 浏览器空闲时执行：重跑渲染函数 → 生成新虚拟DOM → Diff 对比旧虚拟DOM
   → 只把变化的部分（比如气泡里的文字节点）更新到真实 DOM
   （不是整个页面重绘，性能好）
```

***

## 十、`fetchStream` 函数签名与四个回调（request.js L54-L152）

```javascript
export async function fetchStream(
  url,          // 'chat' → 拼到 baseURL 后面
  data,         // { message: '北京景点', history: [...] }
  onChunk,      // 每收到1段文字 → 调用 onChunk('北') / onChunk('京必去')
  onError,      // 出错 → 调用 onError('错误信息')
  onComplete,   // 全部传输完毕 → 调用 onComplete()
  onAbort       // 初始化好 AbortController → 调用 onAbort(controller)
) { ... }
```

### 10.1 四个回调对应 Chat.vue 里做的事

| 回调         | Chat.vue 里的代码 | 作用                                                                  |
| ---------- | ------------- | ------------------------------------------------------------------- |
| onChunk    | L170-178      | 累加 fullResponse → 改 messages 最后一条AI的 content → 滚到底                  |
| onError    | L180-188      | 把最后一条AI气泡改成"抱歉，AI发生错误：xxx" + 关 streaming + toast                    |
| onComplete | L191-195      | 关 streaming、清 controller、滚到底                                        |
| onAbort    | L197-199      | 把 controller 存到 currentController.value，供 stopGenerate 按钮调用 abort() |

### 10.2 AbortController 怎么停止生成

```javascript
// request.js L59 创建
const controller = new AbortController()
// request.js L61-63 交给外面
if (onAbort) onAbort(controller)
// request.js L75 绑定到 fetch
signal: controller.signal

// 用户点"停止生成"（Chat.vue L203-215）→ currentController.value.abort()
// fetch 立刻中断，request.js catch 里判断 error.name==='AbortError' 就 return 不当错处理
```

***

## 十一、后端接收与处理（配合理解为什么传 message + history）

### 11.1 路由层 travel.js L34-L76

```javascript
const {message, history = []} = req.body;   // L54：按字段名解构
if(!message) return 400 '参数错误';          // L56-60：message 必传

const stream = createStreamResponse(res);
const result = await travelService.chat(message, history, (chunk)=>{
  stream.send({type:'chunk', content:chunk});  // L71：包装成 SSE data 行发回去
});
stream.send({type:'complete', data:result});
stream.end();
```

### 11.2 服务层 travelService.chat() L205-L269

```javascript
async chat(message, history, streamCallback) {
  const messages = [
    new SystemMessage('你是旅游规划师...')    // L208：系统人设提示词
  ];

  // L216-225：把 history 里的每条转成 LangChain 消息对象
  if (Array.isArray(history)) {
    for (const msg of history) {
      if (msg.role === 'user') messages.push(new HumanMessage(msg.content));
      if (msg.role === 'ai')   messages.push(new AIMessage(msg.content));
    }
  }

  // L228⭐：最后追加当前新问题
  messages.push(new HumanMessage(message));

  // 此时 messages 完整顺序：
  //   [System, 历史用户1, 历史AI1, 历史用户2, 历史AI2, ... , 本次用户问题]
  //   ↑ 严格 user→ai→user→ai 交替，大模型才能理解对话上下文

  const stream = await this.llm.stream(messages);  // L240：调用大模型流式
  for await (const chunk of stream) {               // L244：循环读每一片
    fullResponse += chunk.content;
    streamCallback(chunk.content);                  // L255：调路由层回调
  }
}
```

**message 和 history 的分工（这就是前端要两个都传的原因）：**

- `history`：之前的所有对话，后端遍历转成 Human/AIMessage 塞到大模型上下文

- `message`：用户本次的新问题，后端**单独**在最后 `push(new HumanMessage(message))`

虽然 history 的最后一条其实就是本次用户消息（因为 buildHistory 在 addUserMessage 之后、空AI占位被过滤掉的情况下执行），但**后端代码的设计是两个参数各司其职**，前端按约定传即可。

***

## 十二、完整全链路时序图（一个用户消息的生命周期）

```
用户在输入框敲"北京景点" → 点发送
  │
  ├─ Chat.vue sendMessage()
  │    ① const msg = "北京景点"
  │    ② addUserMessage(msg)
  │         messages.push({id:100, role:'user', content:'北京景点', ts})
  │           → Proxy 检测数组+1 → Vue 渲染 v-for → 创建 ChatBubble#100（蓝色气泡）✅
  │    ③ inputMessage.value = ''
  │    ④ fetchAIResponse(msg)
  │         │
  │         ├─ isStreaming.value = true → 输入框禁用、按钮变"停止"、loading显示
  │         │
  │         ├─ messages.push({id:101, role:'ai', content:'', ts})  空气泡
  │         │     → Proxy 检测数组+1 → Vue 渲染 v-for → 创建 ChatBubble#101（空气泡）
  │         │       ChatBubble#101: showTime=false，v-if(content)=false → 盒子空着 ✅
  │         │
  │         ├─ buildHistory()
  │         │     .filter → 去掉 id=101 的空AI
  │         │     .map    → 只留 role+content
  │         │     history = [{role:'user', content:'北京景点'}]
  │         │
  │         └─ fetchStream('chat', {message:"北京景点", history}, onChunk, onErr, onDone, onAbort)
  │              │
  │              ├─ request.js fetch 发 POST 给后端
  │              │    POST /api/travel/chat
  │              │    body: {"message":"北京景点","history":[{"role":"user","content":"北京景点"}]}
  │              │
  │              ▼
  │         后端 travel.js:
  │           解构 {message, history}
  │           travelService.chat(message, history, cb)
  │             → System + 转 history → push new HumanMessage(message)
  │             → 调大模型 stream()
  │             → for await (const chunk of stream) 循环
  │
  │         后端 ←→ 大模型：流式返回 token
  │           第1片 "北"       → cb("北")       → stream.send({type:chunk, content:"北"})
  │           第2片 "京必去"   → cb("京必去")   → stream.send({type:chunk, content:"京必去"})
  │           第3片 "故宫和长城" → cb(...)      → stream.send(...)
  │           完毕 → stream.send(complete) → stream.end()
  │              │
  │              ├─ request.js while(reader.read()) 逐片接：
  │              │    decode → split lines → parse JSON → onChunk(jsonData.content)
  │              │
  │              ▼ 调用 Chat.vue onChunk 回调（控制权回到前端）
  │
  │         Chat.vue onChunk("北"):
  │           fullResponse = "北"
  │           lastMsg = messages.value[1] → 拿到 id=101 那把钥匙
  │           if (ok) lastMsg.content = "北"
  │             → Proxy.set 触发 → Vue 更新 ChatBubble#101 props
  │               ChatBubble#101: content='北' → showTime=true → 显示"北"+时间 ✅
  │           scrollToBottom()
  │
  │         Chat.vue onChunk("京必去"):
  │           fullResponse = "北京必去"
  │           lastMsg.content = "北京必去"
  │             → 同一个 ChatBubble#101 props 再更新 → 文字变成"北京必去" ✅
  │           scrollToBottom()
  │
  │         Chat.vue onChunk("故宫和长城"):
  │           fullResponse = "北京必去故宫和长城"
  │           lastMsg.content = "北京必去故宫和长城"
  │             → ChatBubble#101 显示完整句子 ✅
  │           scrollToBottom()
  │
  │         request.js 读到 {type:'complete'} 或流结束
  │           → 调用 onComplete()
  │
  │         Chat.vue onComplete():
  │           isStreaming.value = false → 按钮恢复"发送"、loading隐藏
  │           currentController.value = null
  │           scrollToBottom()
  │
  └─ 结束 ✅ 等待用户下一次输入
```

***

## 十三、关键代码行号速查表（Ctrl+G 跳）

### 前端 Chat.vue

| 功能                       | 行号        | 行号   |
| ------------------------ | --------- | ---- |
| 声明 messages（响应式数组）       | L85       | —    |
| 声明 isStreaming           | L83       | —    |
| 声明 currentController     | L87       | —    |
| v-for 渲染 ChatBubble      | L26       | —    |
| sendMessage() 入口函数       | L68-L81   | L68  |
| addUserMessage() 加用户消息   | L114-L122 | L114 |
| buildHistory() 整理历史      | L93-L100  | L93  |
| fetchAIResponse() 主函数    | L124-L200 | L124 |
| push 空 AI 占位消息           | L127-L132 | L127 |
| fetchStream() 调用 & 4 个回调 | L144-L199 | L144 |
| onChunk 回调（打字机核心）        | L170-L178 | L170 |
| onError 回调               | L180-L188 | L180 |
| onComplete 回调            | L191-L195 | L191 |
| onAbort 回调               | L197-L199 | L197 |
| stopGenerate() 停止生成      | L203-L215 | L203 |
| scrollToBottom()         | L217-L221 | L217 |

### 前端 ChatBubble.vue

| 功能                   | 行号               |
| -------------------- | ---------------- |
| 用户/AI 气泡内容 v-if 判断   | L4-L7            |
| 时间戳显示 v-if 判断        | L9               |
| messageClass 气泡左右    | L23-L25          |
| showTime 时间显示开关      | L27-L29          |
| formatTime 时间格式化     | L31-L35          |
| .user-message 样式靠右蓝底 | L45-L48, L63-L67 |
| .ai-message 样式靠左透明底  | L50-L53, L69-L73 |

### 前端 request.js

| 功能                                      | 行号        |
| --------------------------------------- | --------- |
| fetchStream 函数签名（4 个回调参数）               | L54       |
| new AbortController + onAbort 回调        | L59-L63   |
| fetch 发起请求 + signal 绑定                  | L65-L76   |
| reader.read() + TextDecoder.decode 解码   | L81-L96   |
| 行分割 + data: 前缀处理                        | L97-L110  |
| ⭐ onChunk(jsonData.content) 调用（chunk来源） | L117-L119 |
| onComplete / onError 分发                 | L124-L132 |
| AbortError 忽略处理                         | L145-L147 |

### 后端

| 功能                                    | 文件+行号                      |
| ------------------------------------- | -------------------------- |
| /chat 路由 + 解构 {message,history}       | travel.js L34, L54         |
| 调 travelService.chat() + 包装 SSE chunk | travel.js L70-L73          |
| TravelService.chat() 函数签名             | travelService.js L205      |
| SystemMessage 人设提示词                   | travelService.js L208      |
| history 转 HumanMessage/AIMessage 循环   | travelService.js L216-L225 |
| 最后 push 当前 message（新问题）               | travelService.js L228      |
| 大模型 stream() + for await 循环           | travelService.js L240-L257 |
| streamCallback(content) 回调路由层         | travelService.js L255      |

***

## 十四、常见疑问速答

| 问                                              | 答                                                                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| buildHistory 之后为啥还单独传 message？                 | 后端设计：history 放旧对话，message 是本次新问题，后端 L228 单独 `push(new HumanMessage(message))`。按约定传。                                                 |
| 空 AI 占位能不能不 push，第一片到了再 push？                  | 技术上能，但用户会看到 50-500ms"没反应"的空窗期，体验差；且 onChunk 逻辑得多写 if/else 判断要不要新建。                                                                  |
| buildHistory 的 .map 去掉 id/timestamp 不做行不行？     | 现在没开严格校验的后端能跑，但以后后端加 Joi.unknown(false) 或前端加新字段（isRead/edited等）就炸。一行代码的保险，强烈建议留。                                                    |
| lastMsg.content = fullResponse 为什么改了 messages？ | 对象是引用类型。`const lastMsg = messages.value[i]` 复制的是**对象地址钥匙**，不是复制对象本身。改 lastMsg 就是改同一个储物柜里的东西。                                        |
| if(lastMsg && lastMsg.role==='ai') 两个条件分别防什么？  | `lastMsg`：数组为空时（取到 undefined）防止后续读 .role 报 TypeError；`role==='ai'`：异常场景下防止把 AI 文字写到用户消息上。双重保险。                                      |
| Vue 怎么知道 messages 变了要重新渲染？                     | ref() 套了 Proxy 间谍。你 push/改属性时 Proxy 拦截住，查依赖表找到依赖这个数据的"Chat.vue渲染函数"，放入微任务队列批量重渲染。然后虚拟DOM Diff 只改变化的文字节点。                            |
| chunk 参数从哪来的？                                  | request.js L118：`onChunk(jsonData.content)` —— 从后端 SSE 行解析出的 JSON 对象里取 content 字段，作为实参传给 Chat.vue 传进来的回调函数，Chat.vue 里用形参名 chunk 接住。 |

