<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar title="我的收藏" left-arrow left-text="返回" @click-left="goBack" />
    </div>
    <div class="page-content">
      <!-- 加载中 -->
      <div v-if="isLoading" class="loading-container">
        <van-loading type="spinner" size="36px">加载中...</van-loading>
      </div>

      <!-- 空状态 -->
      <van-empty v-else-if="list.length === 0" description="还没有收藏行程" >
        <van-button type="primary" round size="small" @click="goHome">去生成行程</van-button>
      </van-empty>

      <!-- 收藏列表 -->
      <div v-else class="favorite-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="card favorite-item"
          @click="viewDetail(item)"
        >
          <div class="item-header">
            <h3 class="item-city">{{ item.city }}</h3>
            <van-tag type="primary" round>{{ item.days }}天行程</van-tag>
          </div>
          <div class="item-info">
            <span class="info-item">
              <van-icon name="gold-coin-o" /> 预算：{{ item.budget }}元
            </span>
            <span class="info-item">
              <van-icon name="clock-o" /> {{ formatTime(item.created_at) }}
            </span>
          </div>
          <div class="item-footer">
            <span class="view-text">点击查看详情</span>
            <van-button
              size="mini"
              type="danger"
              plain
              round
              @click.stop="handleDelete(item.id)"
            >删除</van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { get, post } from '@/untils/authRequest.js'

const router = useRouter()
const list = ref([])
const isLoading = ref(true)

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 获取收藏列表
const fetchList = async () => {
  isLoading.value = true
  try {
    const res = await get('/auth/favorites')
    if (res.code === 0) {
      list.value = res.data
    }
  } catch (err) {
    showToast('获取收藏列表失败')
  } finally {
    isLoading.value = false
  }
}

// 查看详情：把收藏的 plan_data 通过路由传递给 Detail 页
const viewDetail = (item) => {
  // 把行程数据存到 sessionStorage，Detail 页接收后直接展示
  //sessionStorage:
// {
//   'favoritePlan': '{"id":1,"city":"北京","budget":300,"plan_data":{...}}'
//    ────┬──────   ─────────────────────────┬────────────────────────
//       key名                             value值（一串文本）
// }
  sessionStorage.setItem('favoritePlan', JSON.stringify(item))
  router.push({
    path: '/detail',
    query: {
      city: item.city,
      budget: item.budget,
      days: item.days,
      from: 'favorite'
    }
  })
}

// 删除收藏
const handleDelete = (id) => {
  showConfirmDialog({
    title: '提示',
    message: '确定删除这条收藏吗？'
  }).then(async () => {
    try {
      const res = await post('/auth/favorite/delete', { id })
      if (res.code === 0) {
        showToast('删除成功')
        // 从列表中移除
        //.filter() 是数组自带的过滤方法，遍历数组，返回符合条件的项组成新数组。
        //假设
        //list.value = [
//   { id: 1, city: '北京' },    ← 删的是这条（id = 1）
//   { id: 2, city: '上海' },
//   { id: 3, city: '成都' },
// ]
//删 id = 1 后执行 .filter：
// list.value.filter(item => item.id !== 1)
        list.value = list.value.filter(item => item.id !== id)
      }
    } catch (err) {
      showToast('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-content {
  padding-top: 60px;
}

.favorite-list {
  margin-top: 8px;
}

.favorite-item {
  margin-bottom: 12px;
  cursor: pointer;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-city {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.item-info {
  display: flex;
  gap: 16px;
  color: #969799;
  font-size: 13px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.view-text {
  color: #1989fa;
  font-size: 13px;
}
</style>
