<template>
  <div class="pk-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2 class="page-title">
        <span class="title-icon">🏆</span>
        目的地PK
      </h2>
      <p class="page-desc">选择两个城市，让AI帮你全方位对比分析</p>
    </div>

    <!-- 城市选择区 -->
    <el-card class="select-card" shadow="hover">
      <div class="select-area">
        <el-select
          v-model="cityA"
          filterable
          size="large"
          placeholder="选择城市A"
          class="city-select"
        >
          <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
        </el-select>

        <div class="vs-badge">
          <span class="vs-text">VS</span>
        </div>

        <el-select
          v-model="cityB"
          filterable
          size="large"
          placeholder="选择城市B"
          class="city-select"
        >
          <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </div>

      <!-- 相同城市提示 -->
      <div v-if="cityA && cityB && cityA === cityB" class="same-city-warn">
        <el-text type="warning">⚠️ 请选择两个不同的城市</el-text>
      </div>

      <!-- 操作按钮 -->
      <div class="action-area">
        <el-button
          type="primary"
          size="large"
          :disabled="!canStart"
          :loading="isStreaming"
          @click="startPK"
        >
          {{ isStreaming ? 'AI分析中...' : '开始PK' }}
        </el-button>
        <el-button v-if="isStreaming" type="danger" size="large" @click="stopPK">
          停止
        </el-button>
      </div>
    </el-card>

    <!-- 结果展示区 -->
    <el-card class="result-card" shadow="hover">
      <template #header>
        <div class="result-header" v-if="result">
          <el-tag type="danger" effect="dark" size="large">{{ cityA }}</el-tag>
          <span class="vs-label">⚡ VS ⚡</span>
          <el-tag type="warning" effect="dark" size="large">{{ cityB }}</el-tag>
        </div>
        <span v-else>对比结果</span>
      </template>

      <div v-if="result" class="result-content" v-html="renderedResult"></div>
      <div v-else-if="isStreaming" class="result-content streaming-placeholder">
        AI 正在分析中<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <el-empty v-else description="选择两个城市开始PK对比" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStream } from '@/untils/request.js'

// 城市列表
const cityOptions = [
  '北京', '上海', '成都', '西安', '杭州', '厦门',
  '三亚', '丽江', '重庆', '苏州', '青岛', '大理',
]

// 选择状态
const cityA = ref('')
const cityB = ref('')

// 结果与流式状态
const result = ref('')
const isStreaming = ref(false)
const currentController = ref(null)

// 是否可以开始
const canStart = computed(() => {
  return cityA.value && cityB.value && cityA.value !== cityB.value && !isStreaming.value
})

// Prompt 构造
const buildPrompt = (a, b) => {
  return `请对比分析${a}和${b}这两个旅游目的地，从以下6个维度进行详细对比：

1. 🍜 美食特色（1-10分）
2. 🏛 景点丰富度（1-10分）
3. 🚄 交通便利性（1-10分）
4. 🏨 住宿性价比（1-10分）
5. 💰 消费水平（1-10分，分数越高代表越实惠）
6. 🌤 最佳旅行季节

每个维度请给出两个城市的评分和简要说明。最后给出总体推荐建议，说明哪个城市更适合什么样的旅行者。请用markdown格式输出，用##标记每个维度标题。`
}

// Markdown 渲染（正则实现，先转义HTML防XSS）
const renderMarkdown = (text) => {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="md-ul">$1</ul>')
  html = html.replace(/\n\n/g, '</p><p>')
  return `<p>${html}</p>`
}

const renderedResult = computed(() => renderMarkdown(result.value))

// 开始PK
const startPK = () => {
  if (!canStart.value) return

  result.value = ''
  isStreaming.value = true

  const prompt = buildPrompt(cityA.value, cityB.value)

  fetchStream('chat', { message: prompt, scene: 'pk' },
    // onChunk
    (chunk) => {
      result.value += chunk
    },
    // onError
    (errorMsg) => {
      isStreaming.value = false
      ElMessage.error('AI分析失败：' + errorMsg)
    },
    // onComplete
    () => {
      isStreaming.value = false
      currentController.value = null
    },
    // onAbort
    (controller) => {
      currentController.value = controller
    },
  )
}

// 停止PK
const stopPK = () => {
  if (currentController.value) {
    currentController.value.abort()
    currentController.value = null
  }
  isStreaming.value = false
  ElMessage.info('已停止分析')
}
</script>

<style scoped>
.pk-page { min-height: calc(100vh - 100px); }

.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0 0 8px; }
.title-icon { font-size: 28px; }
.page-desc { font-size: 14px; color: #909399; margin: 0; }

/* 选择卡片 */
.select-card { margin-bottom: 20px; }
.select-area {
  display: flex; align-items: center; gap: 16px; justify-content: center;
  flex-wrap: wrap;
}
.city-select { width: 200px; }

/* VS 徽章 */
.vs-badge {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #f56c6c, #f89898);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  animation: pulse 2s infinite;
}
.vs-text {
  color: #fff; font-size: 18px; font-weight: 700; font-style: italic;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.same-city-warn { text-align: center; margin-top: 12px; }

.action-area {
  display: flex; gap: 12px; justify-content: center; margin-top: 20px;
}

/* 结果卡片 */
.result-card { min-height: 300px; }
.result-header {
  display: flex; align-items: center; gap: 12px; justify-content: center;
}
.vs-label { font-size: 16px; font-weight: 700; color: #f56c6c; }

.result-content {
  font-size: 14px; line-height: 1.8; color: #303133;
}
.result-content :deep(.md-h3) {
  font-size: 16px; font-weight: 600; margin: 16px 0 8px;
  padding-bottom: 4px; border-bottom: 2px solid #409eff; color: #409eff;
}
.result-content :deep(.md-h4) { font-size: 14px; font-weight: 600; margin: 12px 0 4px; color: #303133; }
.result-content :deep(strong) { color: #409eff; }
.result-content :deep(em) { color: #e6a23c; }
.result-content :deep(.md-ul) { padding-left: 20px; margin: 4px 0; }
.result-content :deep(.md-ul li) { margin-bottom: 4px; }
.result-content :deep(p) { margin: 4px 0; }

.streaming-placeholder { color: #909399; text-align: center; padding: 40px 0; }
.dot { animation: bounce 1.4s infinite; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

/* 响应式 */
@media (max-width: 768px) {
  .select-area { flex-direction: column; }
  .city-select { width: 100%; max-width: 300px; }
}
</style>
