<template>
  <div class="chat-history-page" v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <el-statistic title="总对话数" :value="stats.totalChats">
            <template #prefix><el-icon color="#409eff"><ChatDotRound /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <el-statistic title="本月对话" :value="stats.monthChats" :value-style="{ color: '#67c23a' }">
            <template #prefix><el-icon color="#67c23a"><Calendar /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="scene-card">
          <div class="scene-title"><el-icon color="#e6a23c"><Star /></el-icon> 最常用场景</div>
          <div class="scene-value">{{ stats.topScene }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标题 -->
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">📜</span>
        对话历史
      </h2>
    </div>

    <!-- 搜索与筛选 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索对话标题..."
        clearable
        :prefix-icon="Search"
        style="width: 240px"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
      />
    </div>

    <!-- 对话列表表格 -->
    <el-table
      :data="filteredHistory"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="title" label="对话标题" min-width="200">
        <template #default="{ row }">
          <div class="title-cell">
            <span>{{ row.title }}</span>
            <span class="preview">{{ row.preview }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="场景类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="sceneTypes[row.scene]?.type || ''" size="small">
            {{ sceneTypes[row.scene]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="messageCount" label="消息数" width="80" align="center" />

      <el-table-column prop="createdAt" label="创建时间" width="160" align="center" />

      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="viewChat(row)">查看</el-button>
          <el-popconfirm
            title="确定删除这条对话吗？"
            @confirm="deleteChat(row)"
          >
            <template #reference>
              <el-button size="small" type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有找到匹配的对话记录" />
      </template>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ChatDotRound, Calendar, Star } from '@element-plus/icons-vue'
import { get as authGet, post as authPost } from '@/untils/authRequest.js'

const router = useRouter()

const loading = ref(true)

const stats = ref({ totalChats: 0, monthChats: 0, topScene: '无' })

const sceneTypes = {
  plan:      { label: '行程规划', type: 'primary' },
  food:      { label: '美食探店', type: 'success' },
  budget:    { label: '预算规划', type: 'warning' },
  spot:      { label: '景点推荐', type: 'info' },
  transport: { label: '交通攻略', type: 'info' },
  general:   { label: '普通对话', type: '' },
}

// 辅助函数
const sceneLabelMap = {
  general: '自由对话', ticket: '门票查询', hotel: '酒店推荐',
  route: '路线规划', food: '美食推荐', weather: '天气查询',
  transport: '交通指南', attraction: '景点介绍',
  plan: '行程规划', budget: '预算规划', spot: '景点推荐',
  shopping: '购物指南', insurance: '旅行保险',
}
const formatDateTime = (dateStr) => new Date(dateStr).toLocaleString('zh-CN')

const chatHistory = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

const searchKeyword = ref('')
const dateRange = ref([])

// 前端过滤（搜索+日期）
const filteredHistory = computed(() => {
  let result = chatHistory.value

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase().trim()
    result = result.filter(h =>
      h.title.toLowerCase().includes(kw) ||
      (h.preview && h.preview.toLowerCase().includes(kw))
    )
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(h => {
      const d = (h.rawDate || '').substring(0, 10)
      return d >= start && d <= end
    })
  }

  return result
})

// 加载历史
const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await authGet('/travel/history', { page: currentPage.value, pageSize })
    if (res.code === 0) {
      chatHistory.value = res.data.list.map(s => ({
        id: s.id,
        title: s.title,
        scene: s.scene,
        messageCount: s.message_count,
        createdAt: formatDateTime(s.created_at),
        rawDate: s.created_at,
        preview: '',
      }))
      total.value = res.data.total
    }
  } catch (e) {
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

// 加载统计
const fetchStats = async () => {
  try {
    const res = await authGet('/travel/stats')
    if (res.code === 0) {
      stats.value.totalChats = res.data.chatCount
      stats.value.monthChats = res.data.monthActive
    }
    const rankRes = await authGet('/travel/scene-ranking')
    if (rankRes.code === 0 && rankRes.data.length > 0) {
      stats.value.topScene = sceneLabelMap[rankRes.data[0].scene] || '无'
    }
  } catch (e) { /* 静默 */ }
}

const viewChat = (row) => {
  router.push({ path: '/chat', query: { session: row.id } })
}

const deleteChat = async (row) => {
  try {
    const res = await authPost(`/travel/sessions/${row.id}/delete`, {})
    if (res.code === 0) {
      ElMessage.success('对话已删除')
      fetchHistory()
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchHistory()
}

onMounted(() => {
  fetchHistory()
  fetchStats()
})
</script>

<style scoped>
.chat-history-page { min-height: calc(100vh - 100px); }
.stats-row { margin-bottom: 20px; }
.stats-row .el-card { text-align: center; min-height: 110px; }
.scene-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.scene-value { font-size: 26px; font-weight: 700; color: #e6a23c; }
.section-header { margin-bottom: 16px; }
.section-title { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
.title-icon { font-size: 28px; }
.toolbar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.title-cell { display: flex; flex-direction: column; }
.title-cell .preview { font-size: 12px; color: #909399; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
