<template>
  <div class="chat-layout">
    <!-- 左侧会话列表（CSS @media 控制手机端隐藏） -->
    <aside class="session-sidebar">
      <div class="session-header">
        <span class="session-title">对话列表</span>
        <el-button type="primary" size="small" @click="newSession">
          <el-icon><Plus /></el-icon> 新建
        </el-button>
      </div>
      <div class="session-list">
        <div
          v-for="sess in sessionList"
          :key="sess.id"
          class="session-item"
          :class="{ active: sess.id === currentSessionId }"
          @click="switchSession(sess)"
        >
          <div class="sess-title">
            <el-tag size="small" :type="sess.tagType" effect="plain">{{ sess.tag }}</el-tag>
            <span class="sess-name">{{ sess.title }}</span>
            <el-button
              class="sess-delete"
              text
              size="small"
              @click.stop="deleteSession(sess)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="sess-time">{{ sess.time }}</div>
        </div>
      </div>
    </aside>

    <!-- 右侧对话区 -->
    <div class="chat-main">
      <!-- 顶部：标题 + 场景标签 -->
      <div class="chat-header">
        <div class="chat-title">
          <span>🤖 AI 旅游助手</span>
        </div>
        <el-tag v-if="currentScene" type="primary" effect="plain">
          场景: {{ currentSceneLabel }}
        </el-tag>
      </div>

      <!-- 消息列表区 -->
      <div class="message-area" ref="messageContainer">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="chat-empty">
          <el-empty description="开始和 AI 助手对话吧">
            <div class="quick-questions">
              <span class="quick-title">常见问题</span>
              <div class="quick-tags">
                <el-tag
                  v-for="(q, i) in quickQuestions"
                  :key="i"
                  class="quick-tag"
                  effect="plain"
                  @click="handleQuickQuestion(q)"
                >
                  {{ q }}
                </el-tag>
              </div>
            </div>
          </el-empty>
        </div>

        <!-- 消息列表 -->
        <template v-else>
          <ChatBubble
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
          <!-- 流式加载指示器 -->
          <div class="streaming-indicator" v-if="isStreaming">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>AI 正在生成回复...</span>
          </div>
        </template>
      </div>

      <!-- 底部输入区 -->
      <div class="input-area">
        <div class="quick-tags-bar" v-if="messages.length > 0">
          <el-tag
            v-for="q in quickQuestions"
            :key="q"
            size="small"
            class="quick-tag"
            effect="plain"
            @click="handleQuickQuestion(q)"
          >
            {{ q }}
          </el-tag>
        </div>
        <div class="input-row">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="请输入你的问题，按 Enter 发送..."
            :disabled="isStreaming"
            @keyup.enter.prevent="sendMessage"
          />
          <el-button
            v-if="!isStreaming"
            type="primary"
            :disabled="!inputMessage.trim()"
            @click="sendMessage"
          >
            发送
          </el-button>
          <el-button v-else type="danger" @click="stopGenerate">
            停止
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Loading, Close } from '@element-plus/icons-vue'
import { fetchStream } from '@/untils/request'
import { get as authGet, post as authPost } from '@/untils/authRequest.js'
import ChatBubble from '@/components/ChatBubble.vue'

const router = useRouter()
const route = useRoute()

const inputMessage = ref('')
const isStreaming = ref(false)
const messages = ref([])
const currentController = ref(null)
const messageContainer = ref(null)

// 场景定义
const sceneConfig = {
  plan:      { label: '行程规划', prefix: '你是一个专业的行程规划师，请按天安排上午/下午/晚上的详细行程。' },
  food:      { label: '美食探店', prefix: '你是一个当地美食达人，请推荐餐厅、招牌菜和人均价格。' },
  budget:    { label: '预算规划', prefix: '你是一个旅行财务顾问，请拆分交通/住宿/餐饮/门票预算。' },
  spot:      { label: '景点推荐', prefix: '你是一个景点百科专家，请推荐必去景点、门票信息和游览时长。' },
  transport: { label: '交通攻略', prefix: '你是一个出行交通顾问，请对比不同交通方案与价格。' },
  hotel:     { label: '住宿推荐', prefix: '你是一个住宿选择专家，请推荐酒店/民宿及预订建议。' },
  shopping:  { label: '购物指南', prefix: '你是一个购物达人，请推荐购物地点和退税流程。' },
  insurance: { label: '旅行保险', prefix: '你是一个旅行保险顾问，请推荐保险方案和注意事项。' },
}

const currentScene = ref(null)
const currentSceneLabel = ref('')

// 构造发给后端的 message（加场景 prompt 前缀）
const buildMessage = (userMsg) => {
  if (currentScene.value && sceneConfig[currentScene.value]) {
    return `${sceneConfig[currentScene.value].prefix}\n\n用户问题：${userMsg}`
  }
  return userMsg
}

// 快捷问题
const quickQuestions = [
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？',
]

// 辅助函数
const sceneLabelMap = {
  general: '自由对话', ticket: '门票查询', hotel: '酒店推荐',
  route: '路线规划', food: '美食推荐', weather: '天气查询',
  transport: '交通指南', attraction: '景点介绍',
  plan: '行程规划', budget: '预算规划', spot: '景点推荐',
  shopping: '购物指南', insurance: '旅行保险',
}
const tagTypeMap = { primary: 'primary', success: 'success', warning: 'warning', danger: 'danger', info: 'info' }
const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

// 会话列表（API 加载）
const sessionList = ref([])
const currentSessionId = ref(null)

// 刷新会话列表
const refreshSessionList = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await authGet('/travel/sessions')
    if (res.code === 0) {
      sessionList.value = res.data.map(s => ({
        id: s.id,
        title: s.title,
        tag: s.tag || sceneLabelMap[s.scene] || '对话',
        tagType: tagTypeMap[s.tag_type] || 'primary',
        time: formatRelativeTime(s.updated_at) + ` · ${s.message_count}条消息`,
      }))
    }
  } catch (e) { /* 静默 */ }
}

const newSession = () => {
  messages.value = []
  currentScene.value = null
  currentSceneLabel.value = ''
  currentSessionId.value = null
}

const switchSession = async (sess) => {
  currentSessionId.value = sess.id
  await loadSessionHistory(sess.id)
}

const deleteSession = async (sess) => {
  try {
    const res = await authPost(`/travel/sessions/${sess.id}/delete`)
    if (res.code === 0) {
      sessionList.value = sessionList.value.filter(s => s.id !== sess.id)
      if (currentSessionId.value === sess.id) {
        currentSessionId.value = null
        messages.value = []
      }
      ElMessage.success('已删除')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const loadSessionHistory = async (sessionId) => {
  try {
    const res = await authGet(`/travel/sessions/${sessionId}/messages`)
    if (res.code === 0) {
      messages.value = res.data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      }))
    }
  } catch (e) {
    ElMessage.error('加载历史消息失败')
  }
}

// 发送消息
const sendMessage = () => {
  const msg = inputMessage.value.trim()
  if (!msg || isStreaming.value) return

  addUserMessage(msg)
  inputMessage.value = ''
  fetchAIResponse(msg)
}

// 添加用户消息
const addUserMessage = (content) => {
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  })
}

// 构建历史（保留原有逻辑）
const buildHistory = () => {
  return messages.value
    .filter(msg => msg.content && msg.content.trim() !== '')
    .map(msg => ({ role: msg.role, content: msg.content }))
}

// 获取 AI 响应（SSE 流式）
const fetchAIResponse = (userMsg) => {
  isStreaming.value = true

  // AI 消息占位
  messages.value.push({
    id: Date.now() + 1,
    role: 'ai',
    content: '',
    timestamp: new Date().toISOString(),
  })

  let fullResponse = ''
  const history = buildHistory()

  // 构造发给后端的 message（加场景 prompt 前缀）
  const apiMessage = buildMessage(userMsg)

  fetchStream('chat', {
    message: apiMessage,
    history,
    session_id: currentSessionId.value,
    scene: currentScene.value || 'general',
  },
    // onChunk
    (chunk) => {
      fullResponse += chunk
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'ai') {
        lastMsg.content = fullResponse
      }
      scrollToBottom()
    },
    // onError
    (errorMsg) => {
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'ai') {
        lastMsg.content = `抱歉，AI 发生错误：${errorMsg}`
      }
      isStreaming.value = false
      ElMessage.error('AI 回复失败')
      scrollToBottom()
    },
    // onComplete
    () => {
      isStreaming.value = false
      currentController.value = null
      scrollToBottom()
    },
    // onAbort
    (controller) => {
      currentController.value = controller
    },
    // onSession
    (sessionId) => {
      currentSessionId.value = sessionId
      refreshSessionList()
    }
  )
}

// 停止生成（保留原有逻辑）
const stopGenerate = () => {
  if (currentController.value) {
    currentController.value.abort()
    currentController.value = null
  }
  isStreaming.value = false
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg && lastMsg.role === 'ai' && (!lastMsg.content || lastMsg.content.trim() === '')) {
    messages.value.pop()
  }
  ElMessage.info('已停止生成')
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 快捷问题点击
const handleQuickQuestion = (question) => {
  addUserMessage(question)
  fetchAIResponse(question)
}

// Query 参数处理
onMounted(async () => {
  // 加载会话列表
  await refreshSessionList()

  const { scene, city, session } = route.query

  if (scene && sceneConfig[scene]) {
    currentScene.value = scene
    currentSceneLabel.value = sceneConfig[scene].label
  }

  if (city) {
    inputMessage.value = `我想了解${city}的旅游景点，请帮我规划一下。`
  }

  if (session) {
    await loadSessionHistory(session)
  }
})
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: calc(100vh - 60px - 40px);
}

/* 会话列表栏 */
.session-sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.session-header {
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-title {
  font-size: 16px;
  font-weight: 600;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #ecf5ff;
}

.sess-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.sess-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sess-time {
  font-size: 12px;
  color: #c0c4cc;
}

.sess-delete {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .sess-delete {
  opacity: 1;
}

/* 对话区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.chat-header {
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 24px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #909399;
  display: block;
  margin-bottom: 12px;
}

.quick-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-tag {
  cursor: pointer;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #909399;
  font-size: 14px;
}

/* 输入区 */
.input-area {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.quick-tags-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-row .el-input {
  flex: 1;
}

/* 响应式：手机端隐藏会话列表 */
@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }
  .session-sidebar {
    display: none;
  }
}
</style>
