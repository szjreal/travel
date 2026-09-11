<template>
  <div class="page-container chat-page">
   <div class="page-header">
    <van-nav-bar 
    title="AI旅游助手"
    left-arrow

    left-text="返回"
    @click-left="onBack" />
   </div>
   <div class="chat-container" ref="chatContainer">
   <div v-if="messages.length === 0" class="chat-empty">
  <van-empty 
  description="开始和ai助手对话吧" />
<div class="quick-questions">
  <div class="quick-title">常见问题</div>
  <van-tag v-for="(question,index) in quickQuestions" 
  :key="index" 
  class="quick-tag" 
  size="large"
  mark
  @click="handleClickTag(index)">{{question}}</van-tag>
</div>
</div>
<div v-else class="message-list">
<ChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
<div class="streaming-indicator" v-if="isStreaming">
  <van-loading type="spinner" size="20px" />
  <span>AI 正在生成回复...</span>
</div>
</div>



   </div>
   <div class="chat-input-area">
    <van-field v-model="inputMessage" placeholder="请输入您的问题" :disabled="isStreaming" @keyup.enter="sendMessage" >
     <template #button>
      <van-button v-if="!isStreaming" size="small" type="primary" :disabled="!inputMessage.trim()" @click="sendMessage">发送消息</van-button>
      <van-button v-else size="small" type="danger" @click="stopGenerate">停止生成</van-button>
    </template>
    </van-field>
   </div>

  </div>
</template>
<script setup>
import { ref,onMounted } from 'vue'
import { useRouter ,useRoute } from 'vue-router'
import {fetchStream} from '@/untils/request'
import { showToast } from 'vant'

import ChatBubble from '@/components/ChatBubble.vue'
const chatContainer = ref(null)
const inputMessage = ref('')
const router = useRouter()
const route = useRoute()
const quickQuestions = ref([
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？'
])
const onBack = () => {
  router.back()
}
//发送消息,调用axios的fetchStream函数
const sendMessage = () => {
const msg = inputMessage.value.trim()
if(!msg || isStreaming.value){
  return
}
addUserMessage(msg)
inputMessage.value = ''



//进行流式请求
fetchAIResponse(msg)
 
}
//ai助手是否正在响应中
const isStreaming = ref(false)
//对话记录
//被fetchAIResponse和addUserMessage处理
const messages = ref([])
// 当前流式请求的控制器，用于主动停止生成
const currentController = ref(null)

// 【新增-对话记忆】构造发给后端的历史记录
// 作用：把当前页面上已有的对话消息整理成后端能识别的简化格式
// 过滤掉空内容（比如流式输出时占位的空 AI 消息），避免把空消息发给大模型
// 只取 role 和 content 两个字段，role 仍是 'user' 或 'ai'，后端会据此转换成 LangChain 的消息类型
//// 瘦身前
// { id:1724923100000, role:'user', content:'北京有哪些景点？', timestamp:'...' }
// // 瘦身后
// { role:'user', content:'北京有哪些景点？' }
const buildHistory = () => {
  //messages是addUserMessage和fetchAIResponse组合以后的结果数组
 
  //把content字段为空的项过滤掉，避免把空消息发给大模型
  //filter 的回调函数，作用是判断每条消息要不要保留。返回 true 就保留，false 就过滤掉。
  //.filter(item => item.content)       // 叫 item
  //这是js的回调函数，用来遍历拿到每一个数据，msg是自己定义的回调函数
     return messages.value.filter(msg => msg.content && msg.content.trim() !== '')
    // 只取 role 和 content 两个字段
    //返回一个新数组给const history = buildHistory()用
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))
}
//点击标签
const handleClickTag = (index) => {
  const msg = quickQuestions.value[index]
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: msg,
    timestamp: new Date().toISOString()
  })
  // 触发 AI 流式回复
  fetchAIResponse(msg)
}
//用户发送消息
const addUserMessage = (content) =>{
  messages.value.push({
  id: Date.now(),
  role: 'user',
  content,
  //toISOString() 方法返回当前时间戳，格式为 ISO 8601 字符串，包含时区信息
  timestamp:new Date().toISOString()
  })
}
//获取ai响应
//userMsg是sendMessage传过去的msg
const fetchAIResponse = (userMsg) =>{
  isStreaming.value = true
  //push 一个空的 AI 消息占位
  messages.value.push({
    id: Date.now() + 1,
    role: 'ai',
    //下面的lastMsg.content = fullResponse改变content的值
    content: '',
    timestamp:new Date().toISOString()
  })
  //声明一个局部变量，用于累加所有收到的文本片段
 let fullResponse =''

  // 【新增-对话记忆】在发请求前，先取出当前完整的历史对话
  // 注意：此时 messages.value 里已经包含了用户刚发出的这一条（因为 sendMessage 里先调 addUserMessage 再调 fetchAIResponse）
  // 但还包含上面刚 push 的空 AI 占位消息，buildHistory 里的 filter 会把它过滤掉
  const history = buildHistory()

  //调用axios的fetchStream函数
  //userMsg是形参，指的是sendMessage中的msg
  // 【修改-对话记忆】把 history 一起发给后端，让大模型能看到之前的对话
   fetchStream('chat',{message:userMsg, history},
   //onChunk：分片处理逻辑
 //request.js 解析并回调（request.js:54-72)

//JavaScript

//const {done, value} = await reader.read()
// value 是二进制数据

////const chunk = decoder.decode(value, {stream:true})
// chunk = "data: {"type":"chunk","content":"北"}"

//const lines = chunk.split('\n').filter(line => line.trim())
// lines = ['data: {"type":"chunk","content":"北"}']

//for(const line of lines) {
 // const jsonstr = line.replace(/^data:\s*/, '').trim()
  // jsonstr = '{"type":"chunk","content":"北"}'

  //const jsonData = JSON.parse(jsonstr)
  // jsonData = {type: 'chunk', content: '北'}

 // if(jsonData.type === 'chunk'){
    //onChunk(jsonData.content)  // ← 调用 Chat.vue 的回调，传入 "北"
 // }
 //chunk是最终要显示在页面上的文本片段
   (chunk)=>{// ← 此时 chunk = "北"
    fullResponse += chunk// ← fullResponse = "" + "北" = "北"
    //情况二：引用类型（对象、数组、函数）
    //例子：let arr = [{name:'张三'}, {name:'李四'}]
    //     let x   = arr[0]    // 赋值：把 arr[0] 的值 给 x
    //相当于把messages.value[messages.value.length -1]的地址赋值给lastMsg
    const lastMsg= messages.value[messages.value.length -1]
    if(lastMsg && lastMsg.role ==='ai'){
//messages.value = [
//   { id:1694156800000, role:'user', content:'北京有哪些景点？', ... },
//   { id:1694156800001, role:'ai',   content:'故',              ... }   // ← 改了
// ]
lastMsg.content = fullResponse
    }
    scrollToBottom()
  },
  //onError：流式请求出错
  (errorMsg)=>{
    const lastMsg =messages.value[messages.value.length -1]
    if (lastMsg && lastMsg.role ==='ai'){
      lastMsg.content =`抱歉，ai发生错误：${errorMsg}`
    }
    isStreaming.value =false
    showToast('ai回复失败')
    scrollToBottom()

  },
  //onComplete：ai返回完成
  ()=>{
    isStreaming.value =false
    currentController.value = null
    scrollToBottom()
  },
  //onAbort：拿到 controller，存起来供停止按钮调用
  //fetchStream 创建 controller 后立刻调 onAbort 把它传给 Chat.vue。
  // 现在用户点停止按钮时，能拿到这个 controller 调 abort()
  (controller)=>{
    currentController.value = controller
  })
}

// 停止生成
const stopGenerate = () => {
  if (currentController.value) {
    currentController.value.abort()
    currentController.value = null
  }
  isStreaming.value = false
  // 如果最后一条 AI 消息是空的，移除掉
  //取 messages.value 数组的最后一个元素位置，即空 AI 占位消息
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg && lastMsg.role === 'ai' && (!lastMsg.content || lastMsg.content.trim() === '')) {
    messages.value.pop()
  }
  showToast('已停止生成')
}
//置底的方法
const scrollToBottom = () => {
  if(chatContainer.value){
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
onMounted(() => {
  if(route.query.scene === 'chat' && route.query.city){
    inputMessage.value =`我想了解${route.query.city}的旅游景点`
  }
})
</script>
<style scoped>
.page-header {
  height: 50px;
}
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 0px !important;
}

.chat-container {
  height: 650px;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 120px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #999;
  font-size: 14px;
}

.chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.chat-input-area :deep(.van-field) {
  background: #f7f8fa;
  border-radius: 20px;
  padding: 8px 16px;
}
</style>
