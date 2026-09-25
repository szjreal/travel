<template>
  <div class="scene-page" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <span class="title-icon">🤖</span>
        智能场景助手
      </h2>
      <p class="page-desc">选择一个场景，AI 会以对应专家身份为你服务</p>
    </div>

    <!-- 场景卡片网格 -->
    <el-row :gutter="20" v-if="scenes.length">
      <el-col
        v-for="scene in scenes"
        :key="scene.id"
        :xs="24"
        :sm="12"
        :lg="6"
      >
        <div
          class="scene-card"
          :style="{ '--theme-bg': colorThemes[scene.color].bg, '--theme-text': colorThemes[scene.color].text }"
          @click="startScene(scene)"
        >
          <!-- 热门标签 -->
          <el-tag v-if="scene.tag" class="card-tag" size="small" effect="plain">
            {{ scene.tag }}
          </el-tag>

          <!-- 图标 -->
          <div class="icon-wrap">{{ scene.icon }}</div>

          <!-- 标题 -->
          <h3 class="scene-title">{{ scene.title }}</h3>

          <!-- 描述 -->
          <p class="scene-desc">{{ scene.description }}</p>

          <!-- 按钮 -->
          <el-button class="start-btn" round @click.stop="startScene(scene)">
            开始体验 →
          </el-button>
        </div>
      </el-col>
    </el-row>

    <!-- 空状态兜底 -->
    <el-empty v-else description="暂无可用场景" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 500)
})

// 8 个场景定义
const scenes = [
  {
    id: 'plan',
    title: '行程规划',
    icon: '🗺️',
    description: '专业行程规划师，按天安排上午/下午/晚上详细行程',
    color: 'blue',
    tag: '热门',
  },
  {
    id: 'food',
    title: '美食探店',
    icon: '🍜',
    description: '当地美食达人，推荐餐厅、招牌菜、人均价格',
    color: 'green',
    tag: '热门',
  },
  {
    id: 'budget',
    title: '预算规划',
    icon: '💰',
    description: '旅行财务顾问，拆分交通/住宿/餐饮/门票预算',
    color: 'orange',
  },
  {
    id: 'spot',
    title: '景点推荐',
    icon: '🏛️',
    description: '景点百科专家，推荐必去景点、门票信息、游览时长',
    color: 'purple',
  },
  {
    id: 'transport',
    title: '交通攻略',
    icon: '🚄',
    description: '出行交通顾问，对比飞机/高铁/自驾方案与价格',
    color: 'cyan',
  },
  {
    id: 'hotel',
    title: '住宿推荐',
    icon: '🏨',
    description: '住宿选择专家，推荐酒店/民宿/青旅及预订建议',
    color: 'red',
  },
  {
    id: 'shopping',
    title: '购物指南',
    icon: '🛍️',
    description: '购物达人，推荐购物地点、退税流程、伴手礼',
    color: 'indigo',
  },
  {
    id: 'insurance',
    title: '旅行保险',
    icon: '🛡️',
    description: '旅行保险顾问，推荐保险方案、理赔流程、注意事项',
    color: 'pink',
  },
]

// 色彩主题映射
const colorThemes = {
  blue:    { bg: '#ecf5ff', text: '#409eff' },
  green:   { bg: '#f0f9eb', text: '#67c23a' },
  orange:  { bg: '#fdf6ec', text: '#e6a23c' },
  purple:  { bg: '#f4e4ec', text: '#a855f7' },
  cyan:    { bg: '#e8f5f5', text: '#13c2c2' },
  red:     { bg: '#fef0f0', text: '#f56c6c' },
  indigo:  { bg: '#e8eaf6', text: '#5c6bc0' },
  pink:    { bg: '#fce4ec', text: '#ec407a' },
}

const startScene = (scene) => {
  router.push({
    path: '/chat',
    query: { scene: scene.id },
  })
}
</script>

<style scoped>
.scene-page {
  min-height: calc(100vh - 100px);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}

.title-icon {
  font-size: 28px;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.scene-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.scene-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--theme-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
}

.scene-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
}

.scene-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.start-btn {
  background: var(--theme-bg) !important;
  color: var(--theme-text) !important;
  border: none !important;
  font-size: 13px;
  font-weight: 500;
}

.start-btn:hover {
  opacity: 0.85;
}
</style>
