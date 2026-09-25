<template>
  <div class="chat-bubble" :class="messageClass">
    <!-- 头像 -->
    <div class="bubble-avatar">
      <el-avatar v-if="message.role === 'ai'" :size="36" class="ai-avatar">🤖</el-avatar>
      <el-avatar v-else :size="36" class="user-avatar">我</el-avatar>
    </div>

    <!-- 气泡内容 -->
    <div class="bubble-body">
      <div class="bubble-content">
        <!-- 用户消息：纯文本 -->
        <div v-if="message.role === 'user'" class="msg-text">{{ message.content }}</div>
        <!-- AI 消息：Markdown 渲染 -->
        <div v-else class="msg-text ai-text" v-html="renderedContent"></div>
      </div>
      <div class="message-time" v-if="showTime">{{ formatTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const messageClass = computed(() =>
  props.message.role === 'user' ? 'user-message' : 'ai-message'
)

const showTime = computed(() =>
  props.message.timestamp && props.message.content
)

const formatTime = computed(() => {
  if (!props.message.timestamp) return ''
  const date = new Date(props.message.timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
})

// 简单 Markdown 渲染（正则替换，不引入第三方库）
const renderMarkdown = (text) => {
  if (!text) return ''

  // 1. 转义 HTML 特殊字符（防 XSS）
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. 代码块 ```...```
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="md-code"><code>$2</code></pre>')

  // 3. 标题 ## 和 ###
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')

  // 4. 粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 5. 斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 6. 无序列表 - item
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="md-ul">$1</ul>')

  // 7. 段落（连续两个换行 → 段落分隔）
  html = html.replace(/\n\n/g, '</p><p>')

  return `<p>${html}</p>`
}

// AI 消息渲染 Markdown，用户消息直接返回
const renderedContent = computed(() => {
  if (props.message.role === 'ai' && props.message.content) {
    return renderMarkdown(props.message.content)
  }
  return props.message.content || ''
})
</script>

<style scoped>
.chat-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.user-message {
  flex-direction: row-reverse;
}

/* 头像 */
.bubble-avatar {
  flex-shrink: 0;
}

.ai-avatar {
  background: linear-gradient(135deg, #409eff, #36cbcb);
  color: #fff;
}

.user-avatar {
  background: #e6a23c;
  color: #fff;
}

/* 气泡 */
.bubble-body {
  max-width: 70%;
}

.bubble-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.user-message .bubble-content {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-message .bubble-content {
  background: #fff;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
  padding: 0 4px;
}

.user-message .message-time {
  text-align: right;
}

/* Markdown 样式 */
.ai-text :deep(.md-h3) { font-size: 15px; font-weight: 600; margin: 8px 0 4px; }
.ai-text :deep(.md-h4) { font-size: 14px; font-weight: 600; margin: 6px 0 2px; }
.ai-text :deep(.md-ul) { padding-left: 20px; margin: 4px 0; }
.ai-text :deep(.md-ul li) { margin-bottom: 2px; }
.ai-text :deep(.md-code) {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  margin: 8px 0;
  overflow-x: auto;
}
.ai-text :deep(strong) { color: #409eff; }
.ai-text :deep(p) { margin: 4px 0; }
</style>
