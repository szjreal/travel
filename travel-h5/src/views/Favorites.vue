<template>
  <div class="favorites-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header-flex">
          <span>我的收藏</span>
          <span class="count-text" v-if="!isLoading">共 {{ list.length }} 条</span>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-if="isLoading" v-loading="true" class="loading-area"></div>

      <!-- 空状态 -->
      <el-empty v-else-if="list.length === 0" description="还没有收藏行程">
        <el-button type="primary" @click="$router.push('/plan-wizard')">去生成行程</el-button>
      </el-empty>

      <!-- 收藏列表 -->
      <div v-else class="favorite-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="favorite-item"
          @click="viewDetail(item)"
        >
          <div class="item-header">
            <h3 class="item-city">{{ item.city }}</h3>
            <el-tag type="primary" size="small">{{ item.days }}天行程</el-tag>
          </div>
          <div class="item-info">
            <span class="info-item">
              <el-icon><Money /></el-icon> 预算: ¥{{ item.budget }}
            </span>
            <span class="info-item">
              <el-icon><Calendar /></el-icon> {{ formatTime(item.created_at) }}
            </span>
          </div>
          <div class="item-footer">
            <span class="view-text">点击查看详情</span>
            <el-button size="small" type="danger" plain @click.stop="handleDelete(item.id)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, Calendar } from '@element-plus/icons-vue'
import { get, post } from '@/untils/authRequest.js'

const router = useRouter()
const list = ref([])
const isLoading = ref(true)

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
    ElMessage.error('获取收藏列表失败')
  } finally {
    isLoading.value = false
  }
}

// 查看详情
const viewDetail = (item) => {
  sessionStorage.setItem('favoritePlan', JSON.stringify(item))
  router.push({
    path: '/detail',
    query: {
      city: item.city,
      budget: item.budget,
      days: item.days,
      from: 'favorite',
    },
  })
}

// 删除收藏
const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除这条收藏吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res = await post('/auth/favorite/delete', { id })
      if (res.code === 0) {
        ElMessage.success('删除成功')
        list.value = list.value.filter(item => item.id !== id)
      }
    } catch (err) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.favorites-page { min-height: calc(100vh - 100px); }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; }
.count-text { font-size: 13px; color: #909399; font-weight: normal; }
.loading-area { height: 200px; }
.favorite-item {
  padding: 16px; border-radius: 8px; background: #f9fafc;
  margin-bottom: 12px; cursor: pointer; transition: background 0.2s;
}
.favorite-item:hover { background: #ecf5ff; }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.item-city { font-size: 18px; font-weight: 600; margin: 0; }
.item-info { display: flex; gap: 16px; color: #909399; font-size: 13px; margin-bottom: 10px; }
.info-item { display: flex; align-items: center; gap: 4px; }
.item-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f0f2f5; }
.view-text { color: #409eff; font-size: 13px; }
</style>
