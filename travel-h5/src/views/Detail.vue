<template>
  <div class="page-container">
   <div class="page-header">
    <van-nav-bar fixed 
    left-text="返回" 
    left-arrow
    @click="goBack" 
    :title="formData.city+'行程规划'" />
   </div>
   <div class="page-content">
  <div v-if="isLoading" class="loading-container">
    <van-loading size="48ox" type="spinner">
        正在生成旅游规划
    </van-loading >
  </div>
  <div v-else-if="errorMsg && errorMsg.length > 0">
    <van-button type="primary" @click="fetchTripData">重新生成</van-button>
  
  </div>

 <template v-else-if="tripData && tripData.success !== false">
  <div class="card overview-card">
<div class="trip-header">
  <h2>{{formData.city}}~{{formData.days}}天行程</h2>
  <div class="trip-budget">预算：{{tripData.totalBudget}}元</div>
</div>
  </div>
  <van-collapse v-model="activeDays" class="trip-collapse">
    <van-collapse-item v-for="day in tripData.dailyItinerary" 
    :key="day.day" 
    :title="'第'+day.day+'天'" 
    :name="day.day">
     <div class="day-schedule">
<div class="schedule-section">
  <div class="section-label morning">上午</div>
  <SpotItem :data="day.morning" /> 
</div>
<div class="schedule-section">
  <div class="section-label afternoon">下午</div>
  <SpotItem :data="day.afternoon" /> 
</div>
<div class="schedule-section">
  <div class="section-label evening">晚上</div>
  <SpotItem :data="day.evening" /> 
</div>
     </div>
    </van-collapse-item>
  </van-collapse>
  <div class="card budget-card" v-if="tripData.budgetBreakdown">
    <div class="section-title">预算</div>
 <BudgetTableVue :data="tripData.budgetBreakdown" :total="tripData.totalBudget"></BudgetTableVue>
  </div>
  <div class="card tips-card" v-if="tripData.tips && tripData.tips.length">
    温馨提示
  
 <ul class="tips-list">
<li v-for="(tip,index) in tripData.tips" :key="index">{{tip}}</li>
 </ul></div>

 <div class="card warings-card" v-if="tripData.warnings && tripData.warnings.length">
    <div class="section-title">注意事项

    </div>
    <ul class="warnings-list">
<li v-for="(warning,index) in tripData.warnings" :key="index">{{warning}}</li>
    </ul>
  </div>
</template>
   </div>
   <div class="detail-footer" v-if="tripData && tripData.success !==false">
<div class="footer-buttons">
  <van-button
    :type="isFavorited ? 'warning' : 'default'"
    size="large"
    round
    @click="handleFavorite"
    class="favorite-btn"
  >
    <van-icon
      :name="isFavorited ? 'star' : 'star-o'"
      :color="isFavorited ? '#fff' : '#ee0a24'"
    />
    {{ isFavorited ? '已收藏' : '收藏行程' }}
  </van-button>
  <van-button type="primary" size="large" round @click="goToChat('/chat')" class="primary-button">咨询AI助手</van-button>
</div>
   </div>
  </div>
</template>
<script setup>
import {onMounted} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {post} from '@/untils/request'
import {post as authPost, get as authGet} from '@/untils/authRequest'
import {showToast} from 'vant'
import SpotItem from '../components/SpotItem.vue'
import BudgetTableVue from '../components/BudgetTable.vue'
const route = useRoute()
const router = useRouter()
import { reactive,ref } from 'vue'
const formData = reactive({
  city: '',
  budget: null,
  days:null
})
const activeDays = ref([])
const tripData = ref(null)
const errorMsg = ref('')
//加载状态
const isLoading = ref(true)
// 收藏状态
const isFavorited = ref(false)
//获取行程数据
const fetchTripData = async ()=>{
  const res = await post('recommend',{
    city:formData.city,
    budget:formData.budget,
    days:formData.days
  })
  console.log(res)
  if (res && res.success!==false){
    isLoading.value = false
    tripData.value = res
    // 行程获取成功后，检查收藏状态
    checkFavoriteStatus()
  }else{
    
    errorMsg.value = res.error || '获取行程数据失败'
  }
}

// 检查是否已收藏（已登录才查）
const checkFavoriteStatus = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await authGet('/auth/favorite/check', {
      city: formData.city,
      days: formData.days
    })
    if (res.code === 0) {
      isFavorited.value = res.favorited
    }
  } catch (e) {
    // 401 等错误静默处理，不影响页面
  }
}
// 页面加载时，从 URL 参数中获取目的地、预算、行程天数
onMounted(()=>{
  formData.city = route.query.city
  formData.budget = route.query.budget
  formData.days = route.query.days

  // 如果是从收藏页跳来的，直接用 sessionStorage 里的数据展示，不重新请求 AI
  if (route.query.from === 'favorite') {
    const favoritePlan = sessionStorage.getItem('favoritePlan')
    if (favoritePlan) {
      const plan = JSON.parse(favoritePlan)
      tripData.value = plan.plan_data
      isFavorited.value = true   // 已收藏状态
      isLoading.value = false
      // 用完就清掉，避免下次进来还用旧数据
      sessionStorage.removeItem('favoritePlan')
      return
    }
  }

  if(formData.city && formData.budget && formData.days){
    fetchTripData()
  }
})
const goBack = () => {
  router.back()
}
const goToChat =()=>{
  router.push({
    path:'/chat',
    query:{
      scene:'chat',
      city:formData.city,

    }
  })
}
// 收藏行程
const handleFavorite = async () => {
  // 1. 检查是否登录
  const token = localStorage.getItem('token')
  if (!token) {
    showToast('请先登录后再收藏')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  // 2. 已收藏 → 不再重复操作
  if (isFavorited.value) {
    showToast('已收藏过该行程')
    return
  }
  // 3. 调后端收藏接口
  try {
    const res = await authPost('/auth/favorite', {
      city: formData.city,
      budget: formData.budget,
      days: formData.days,
      plan_data: tripData.value
    })
    if (res.code === 0) {
      // 首次收藏 或 查重命中（已收藏），都把状态置为已收藏
      isFavorited.value = true
      showToast(res.msg)
    } else {
      showToast(res.msg)
    }
  } catch (err) {
    showToast('收藏失败，请稍后重试')
  }
}
</script>
<style scoped>
.page-header {
   height: 50px;
}
.page-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 70px;
}
.card {
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 12px;
}
.page-content {
    padding: 16px;
}
.overview-card {
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-header h2 {
  font-size: 20px;
  color: #323233;
  margin: 0;
}

.trip-budget {
  font-size: 16px;
  color: #ee0a24;
  font-weight: 600;
}

.trip-collapse {
  margin-bottom: 16px;
}

.day-schedule {
  padding: 8px 0;
}

.schedule-section {
  margin-bottom: 16px;
}

.schedule-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 8px;
}

.section-label.morning {
  background: #fff7e6;
  color: #fa8c16;
}

.section-label.afternoon {
  background: #e6f7ff;
  color: #1890ff;
}

.section-label.evening {
  background: #f6ffed;
  color: #52c41a;
}

.budget-card,
.tips-card,
.warnings-card {
  margin-bottom: 16px;
}

.tips-list,
.warnings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li,
.warnings-list li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.tips-list li:last-child,
.warnings-list li:last-child {
  border-bottom: none;
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}

.footer-buttons .favorite-btn {
  flex: 1;
}

.footer-buttons .primary-button {
  flex: 2;
}

.error-card {
  text-align: center;
  padding: 40px 16px;
}
</style>
