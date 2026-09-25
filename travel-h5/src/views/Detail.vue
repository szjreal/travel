<template>
  <div class="detail-page" v-loading="isLoading">
    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-text">正在生成旅游规划...</div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="error-state">
      <el-result icon="error" :title="errorMsg">
        <template #extra>
          <el-button type="primary" @click="fetchTripData">重新生成</el-button>
        </template>
      </el-result>
    </div>

    <!-- 行程内容 -->
    <template v-else-if="tripData && tripData.success !== false">
      <!-- 概览卡片 -->
      <el-card class="overview-card" shadow="hover">
        <div class="trip-header">
          <h2>{{ formData.city }} · {{ formData.days }}天行程</h2>
          <span class="trip-budget">预算: ¥{{ tripData.totalBudget }}</span>
        </div>
      </el-card>

      <!-- 每日行程折叠面板 -->
      <el-card class="itinerary-card" shadow="hover">
        <el-collapse v-model="activeDays">
          <el-collapse-item
            v-for="day in tripData.dailyItinerary"
            :key="day.day"
            :title="`第 ${day.day} 天`"
            :name="day.day"
          >
            <div class="day-schedule">
              <div class="schedule-section">
                <el-tag type="warning" effect="plain" size="small">上午</el-tag>
                <SpotItem :data="day.morning" />
              </div>
              <div class="schedule-section">
                <el-tag type="primary" effect="plain" size="small">下午</el-tag>
                <SpotItem :data="day.afternoon" />
              </div>
              <div class="schedule-section">
                <el-tag type="success" effect="plain" size="small">晚上</el-tag>
                <SpotItem :data="day.evening" />
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 预算分解 -->
      <el-card v-if="tripData.budgetBreakdown" class="budget-card" shadow="hover">
        <template #header>💰 预算分解</template>
        <BudgetTable :data="tripData.budgetBreakdown" :total="tripData.totalBudget" />
      </el-card>

      <!-- 温馨提示 -->
      <el-card v-if="tripData.tips && tripData.tips.length" class="tips-card" shadow="hover">
        <template #header>💡 温馨提示</template>
        <ul class="tips-list">
          <li v-for="(tip, i) in tripData.tips" :key="i">{{ tip }}</li>
        </ul>
      </el-card>

      <!-- 注意事项 -->
      <el-card v-if="tripData.warnings && tripData.warnings.length" class="warnings-card" shadow="hover">
        <template #header>⚠️ 注意事项</template>
        <ul class="warnings-list">
          <li v-for="(w, i) in tripData.warnings" :key="i">{{ w }}</li>
        </ul>
      </el-card>

      <!-- 底部操作栏 -->
      <div class="detail-actions">
        <el-button :type="isFavorited ? 'warning' : 'default'" @click="handleFavorite">
          <el-icon><component :is="isFavorited ? 'StarFilled' : 'Star'" /></el-icon>
          {{ isFavorited ? '已收藏' : '收藏行程' }}
        </el-button>
        <el-button type="primary" @click="goToChat">咨询 AI 助手</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { post } from '@/untils/request'
import { post as authPost, get as authGet } from '@/untils/authRequest'
import SpotItem from '@/components/SpotItem.vue'
import BudgetTable from '@/components/BudgetTable.vue'

const route = useRoute()
const router = useRouter()

const formData = reactive({ city: '', budget: null, days: null })
const activeDays = ref([])
const tripData = ref(null)
const errorMsg = ref('')
const isLoading = ref(true)
const isFavorited = ref(false)

// 获取行程数据
const fetchTripData = async () => {
  const res = await post('recommend', {
    city: formData.city,
    budget: formData.budget,
    days: formData.days,
  })
  if (res && res.success !== false) {
    isLoading.value = false
    tripData.value = res
    checkFavoriteStatus()
  } else {
    errorMsg.value = res.error || '获取行程数据失败'
  }
}

// 检查收藏状态
const checkFavoriteStatus = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await authGet('/auth/favorite/check', {
      city: formData.city,
      days: formData.days,
    })
    if (res.code === 0) {
      isFavorited.value = res.favorited
    }
  } catch (e) { /* 静默 */ }
}

// onMounted
onMounted(() => {
  formData.city = route.query.city
  formData.budget = Number(route.query.budget)
  formData.days = Number(route.query.days)

  // 从 PlanWizard 跳转：读取 planResult
  const planResult = sessionStorage.getItem('planResult')
  if (planResult) {
    tripData.value = JSON.parse(planResult)
    isLoading.value = false
    sessionStorage.removeItem('planResult')
    return
  }

  // 从收藏页跳转：读取 favoritePlan
  if (route.query.from === 'favorite') {
    const favoritePlan = sessionStorage.getItem('favoritePlan')
    if (favoritePlan) {
      const plan = JSON.parse(favoritePlan)
      tripData.value = plan.plan_data
      isFavorited.value = true
      isLoading.value = false
      sessionStorage.removeItem('favoritePlan')
      return
    }
  }

  if (formData.city && formData.budget && formData.days) {
    fetchTripData()
  }
})

const goToChat = () => {
  router.push({ path: '/chat', query: { scene: 'chat', city: formData.city } })
}

// 收藏行程
const handleFavorite = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再收藏')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (isFavorited.value) {
    ElMessage.info('已收藏过该行程')
    return
  }
  try {
    const res = await authPost('/auth/favorite', {
      city: formData.city,
      budget: formData.budget,
      days: formData.days,
      plan_data: tripData.value,
    })
    if (res.code === 0) {
      isFavorited.value = true
      ElMessage.success(res.msg)
    } else {
      ElMessage.error(res.msg)
    }
  } catch (err) {
    ElMessage.error('收藏失败，请稍后重试')
  }
}
</script>

<style scoped>
.detail-page { min-height: calc(100vh - 100px); }
.loading-text { text-align: center; padding: 40px; color: #909399; }
.overview-card, .itinerary-card, .budget-card, .tips-card, .warnings-card { margin-bottom: 16px; }
.trip-header { display: flex; justify-content: space-between; align-items: center; }
.trip-header .trip-budget { font-size: 16px; color: #f56c6c; font-weight: 600; }
.day-schedule { padding: 8px 0; }
.schedule-section { margin-bottom: 16px; }
.schedule-section .el-tag { margin-bottom: 8px; }
.tips-list, .warnings-list { list-style: none; padding: 0; margin: 0; }
.tips-list li, .warnings-list li {
  padding: 8px 0; color: #606266; font-size: 14px; border-bottom: 1px solid #f0f2f5;
}
.tips-list li:last-child, .warnings-list li:last-child { border-bottom: none; }
.detail-actions { display: flex; gap: 12px; margin-top: 20px; }
</style>
