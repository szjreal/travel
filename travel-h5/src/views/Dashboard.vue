<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 欢迎卡片 -->
    <div class="welcome-banner">
      <div>
        <h2>欢迎回来，{{ userName }}！👋</h2>
        <p>今天想去哪里旅行？让 AI 帮你规划吧</p>
      </div>
      <div class="welcome-date">{{ todayDate }}</div>
    </div>

    <!-- 统计卡片行 -->
    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in stats" :key="stat.label" :xs="12" :sm="8" :lg="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-num" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>📈 近7天对话趋势</template>
          <div v-if="chatTrend.length" class="bar-chart">
            <div v-for="day in chatTrend" :key="day.label" class="bar-col">
              <div class="bar-value">{{ day.value }}</div>
              <div class="bar" :style="{ height: (day.value / maxTrend * 100) + '%' }"></div>
              <div class="bar-label">{{ day.label }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无对话数据" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>🗺️ 热门场景排行</template>
          <div v-if="sceneRanking.length">
            <div v-for="scene in sceneRanking" :key="scene.name" class="rank-item">
              <span class="rank-name">{{ scene.name }}</span>
              <el-progress :percentage="scene.percent" :stroke-width="14" :show-text="false" />
              <span class="rank-count">{{ scene.count }}次</span>
            </div>
          </div>
          <el-empty v-else description="暂无场景数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 + 最近对话 -->
    <el-row :gutter="16">
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>⚡ 快捷操作</template>
          <div v-for="action in quickActions" :key="action.text" class="quick-btn" @click="$router.push(action.route)">
            <span class="action-icon">{{ action.icon }}</span>
            <div>
              <div class="action-text">{{ action.text }}</div>
              <div class="action-desc">{{ action.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-flex">
              <span>📋 最近对话</span>
              <el-link type="primary" :underline="false" @click="$router.push('/chat-history')">全部记录</el-link>
            </div>
          </template>
          <div v-if="recentChats.length">
            <div v-for="chat in recentChats" :key="chat.id" class="recent-item" @click="$router.push('/chat')">
              <el-tag size="small" :type="chat.tagType" effect="plain">{{ chat.tag }}</el-tag>
              <span class="recent-title">{{ chat.title }}</span>
              <span class="recent-time">{{ chat.time }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无最近对话" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get as authGet } from '@/untils/authRequest.js'

const loading = ref(true)
const userName = ref('游客')
const todayDate = ref(new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
}))

const stats = ref([
  { icon: '💬', value: 0, label: '对话次数', color: '#409eff' },
  { icon: '⭐', value: 0, label: '收藏行程', color: '#e6a23c' },
  { icon: '🏙️', value: 0, label: '覆盖城市', color: '#67c23a' },
  { icon: '📅', value: 0, label: '本月活跃', color: '#f56c6c' },
  { icon: '🎫', value: 0, label: '景点查询', color: '#909399' },
])

const chatTrend = ref([])
const sceneRanking = ref([])
const recentChats = ref([])

const quickActions = [
  { icon: '💬', text: '开始 AI 对话', desc: '和 AI 助手自由聊天', route: '/chat' },
  { icon: '🗺️', text: '规划行程', desc: '智能生成旅行计划', route: '/plan-wizard' },
  { icon: '⭐', text: '查看收藏', desc: '我收藏的行程', route: '/favorites' },
  { icon: '🤖', text: '场景助手', desc: '选择场景开始体验', route: '/scene' },
]

const maxTrend = computed(() => Math.max(...chatTrend.value.map(d => d.value), 1))

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

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) { loading.value = false; return }

  const [userRes, statsRes, trendRes, sceneRes, recentRes] = await Promise.allSettled([
    authGet('/auth/user'),
    authGet('/travel/stats'),
    authGet('/travel/chat-trend'),
    authGet('/travel/scene-ranking'),
    authGet('/travel/recent-chats'),
  ])

  if (userRes.status === 'fulfilled' && userRes.value?.code === 0) {
    userName.value = userRes.value.user.nickname || userRes.value.user.username || '游客'
  }

  if (statsRes.status === 'fulfilled' && statsRes.value?.code === 0) {
    const d = statsRes.value.data
    stats.value[0].value = d.chatCount
    stats.value[1].value = d.favoriteCount
    stats.value[2].value = d.cityCount
    stats.value[3].value = d.monthActive
    stats.value[4].value = d.spotCount
  }

  if (trendRes.status === 'fulfilled' && trendRes.value?.code === 0) {
    chatTrend.value = trendRes.value.data.map(item => ({
      label: new Date(item.date).toLocaleDateString('zh-CN', { weekday: 'short' }),
      value: item.count,
    }))
  }

  if (sceneRes.status === 'fulfilled' && sceneRes.value?.code === 0) {
    sceneRanking.value = sceneRes.value.data.map(item => ({
      name: sceneLabelMap[item.scene] || item.scene,
      percent: item.percent,
      count: item.count,
    }))
  }

  if (recentRes.status === 'fulfilled' && recentRes.value?.code === 0) {
    recentChats.value = recentRes.value.data.map(item => ({
      id: item.id,
      tag: item.tag || '对话',
      tagType: tagTypeMap[item.tag_type] || 'primary',
      title: item.title,
      time: formatRelativeTime(item.updated_at),
    }))
  }

  loading.value = false
})
</script>

<style scoped>
.dashboard-page { min-height: calc(100vh - 100px); }
.welcome-banner {
  background: linear-gradient(135deg, #409eff 0%, #36cbcb 100%);
  border-radius: 12px; padding: 24px 32px; color: #fff;
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.welcome-banner h2 { font-size: 22px; margin: 0 0 6px; }
.welcome-banner p { opacity: 0.85; font-size: 14px; margin: 0; }
.welcome-date { font-size: 13px; opacity: 0.7; }
.stats-row { margin-bottom: 20px; }
.stat-card { text-align: center; margin-bottom: 16px; }
.stat-icon { font-size: 32px; margin-bottom: 8px; }
.stat-num { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: #909399; }
.chart-row { margin-bottom: 20px; }
.bar-chart { display: flex; gap: 16px; align-items: flex-end; height: 200px; padding: 16px 0; }
.bar-col { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; }
.bar { border-radius: 4px 4px 0 0; background: linear-gradient(180deg, #409eff, #79bbff); min-height: 4px; transition: height 0.3s; }
.bar-value { font-size: 13px; color: #606266; margin-bottom: 4px; }
.bar-label { font-size: 12px; color: #909399; margin-top: 6px; }
.rank-item { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.rank-name { width: 70px; font-size: 14px; }
.rank-count { font-size: 12px; color: #909399; width: 40px; text-align: right; }
.quick-btn {
  display: flex; align-items: center; gap: 10px; padding: 14px;
  background: #f5f7fa; border-radius: 8px; cursor: pointer;
  transition: all 0.2s; margin-bottom: 10px;
}
.quick-btn:hover { background: #ecf5ff; }
.action-icon { font-size: 24px; }
.action-text { font-size: 14px; font-weight: 500; }
.action-desc { font-size: 12px; color: #909399; }
.recent-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid #f0f2f5; cursor: pointer;
}
.recent-item:last-child { border-bottom: none; }
.recent-title { flex: 1; font-size: 14px; }
.recent-time { font-size: 12px; color: #c0c4cc; }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; }
</style>
