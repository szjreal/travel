<template>
  <div class="discover-page" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <span class="title-icon">🌍</span>
        热门目的地
      </h2>
      <p class="page-desc">探索国内热门旅游城市，找到你的下一个目的地</p>
    </div>

    <!-- 搜索与筛选 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索城市名称..."
        clearable
        :prefix-icon="Search"
        style="width: 240px"
      />
      <el-radio-group v-model="activeCategory">
        <el-radio-button
          v-for="cat in categories"
          :key="cat.value"
          :label="cat.value"
        >
          {{ cat.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 目的地卡片网格 -->
    <el-row :gutter="20" v-if="filteredDestinations.length">
      <el-col
        v-for="dest in filteredDestinations"
        :key="dest.id"
        :xs="24"
        :sm="12"
        :lg="6"
      >
        <el-card class="dest-card" shadow="hover" @click="planTrip(dest)">
          <!-- 图片区 -->
          <div class="dest-image">
            <el-image
              v-if="dest.image"
              :src="dest.image"
              fit="cover"
              class="image"
            />
            <div v-else class="image-placeholder">
              {{ dest.name.charAt(0) }}
            </div>
          </div>

          <!-- 信息区 -->
          <div class="dest-info">
            <div class="dest-header">
              <span class="dest-name">{{ dest.name }}</span>
              <el-rate :model-value="dest.rating" disabled size="small" />
            </div>
            <div class="dest-tags">
              <el-tag
                v-for="tag in dest.tags.slice(0, 3)"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="dest-desc">{{ dest.description }}</div>
            <el-progress
              :percentage="dest.hotIndex"
              :stroke-width="6"
              :show-text="true"
              :format="() => `热门指数 ${dest.hotIndex}`"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空状态 -->
    <el-empty v-else description="没有找到匹配的目的地" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 500)
})

const searchKeyword = ref('')
const activeCategory = ref('all')

// 12 个目的地假数据
// 图片待用户自行添加到 public/cities/ 目录，暂用占位符显示
const destinations = [
  { id: 1,  name: '北京', category: 'culture', rating: 4.8, tags: ['故宫', '长城', '胡同'], description: '中国首都，历史文化底蕴深厚', hotIndex: 95, image: '' },
  { id: 2,  name: '成都', category: 'food',    rating: 4.7, tags: ['熊猫', '火锅', '宽窄巷子'], description: '美食之都，慢生活天堂', hotIndex: 88, image: '' },
  { id: 3,  name: '上海', category: 'culture', rating: 4.6, tags: ['外滩', '迪士尼', '夜景'], description: '国际大都市，东方明珠', hotIndex: 85, image: '' },
  { id: 4,  name: '西安', category: 'culture', rating: 4.7, tags: ['兵马俑', '城墙', '回民街'], description: '十三朝古都，丝路起点', hotIndex: 80, image: '' },
  { id: 5,  name: '杭州', category: 'nature',  rating: 4.5, tags: ['西湖', '灵隐寺', '龙井'], description: '人间天堂，西湖美景', hotIndex: 76, image: '' },
  { id: 6,  name: '厦门', category: 'nature',  rating: 4.6, tags: ['鼓浪屿', '环岛路', '曾厝垵'], description: '海滨花园城市，文艺青年打卡地', hotIndex: 72, image: '' },
  { id: 7,  name: '三亚', category: 'nature',  rating: 4.5, tags: ['亚龙湾', '天涯海角', '潜水'], description: '热带海滨度假胜地', hotIndex: 70, image: '' },
  { id: 8,  name: '丽江', category: 'culture', rating: 4.4, tags: ['古城', '雪山', '纳西族'], description: '纳西古城，高原水乡', hotIndex: 68, image: '' },
  { id: 9,  name: '重庆', category: 'food',    rating: 4.6, tags: ['洪崖洞', '火锅', '轻轨穿楼'], description: '山城雾都，魔幻 3D 城市', hotIndex: 75, image: '' },
  { id: 10, name: '苏州', category: 'culture', rating: 4.5, tags: ['园林', '古镇', '评弹'], description: '江南水乡，园林之城', hotIndex: 65, image: '' },
  { id: 11, name: '青岛', category: 'food',    rating: 4.4, tags: ['啤酒', '海鲜', '栈桥'], description: '海滨城市，啤酒之乡', hotIndex: 60, image: '' },
  { id: 12, name: '大理', category: 'nature',  rating: 4.5, tags: ['洱海', '苍山', '古城'], description: '风花雪月，白族风情', hotIndex: 58, image: '' },
]

// 分类筛选选项
const categories = [
  { label: '全部',     value: 'all' },
  { label: '自然风光', value: 'nature' },
  { label: '人文历史', value: 'culture' },
  { label: '美食之都', value: 'food' },
]

const filteredDestinations = computed(() => {
  let result = destinations

  if (activeCategory.value !== 'all') {
    result = result.filter(d => d.category === activeCategory.value)
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase().trim()
    result = result.filter(d =>
      d.name.toLowerCase().includes(kw) ||
      d.tags.some(t => t.toLowerCase().includes(kw)) ||
      d.description.toLowerCase().includes(kw)
    )
  }

  return result
})

const planTrip = (dest) => {
  router.push({ path: '/chat', query: { city: dest.name } })
}
</script>

<style scoped>
.discover-page {
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

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.dest-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.dest-card:hover {
  transform: translateY(-2px);
}

.dest-image {
  height: 120px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  margin: -20px -20px 12px;
}

.dest-image .image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #409eff, #36cbcb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #fff;
  font-weight: 700;
}

.dest-info {
  padding: 0;
}

.dest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dest-name {
  font-size: 16px;
  font-weight: 600;
}

.dest-tags {
  margin-bottom: 8px;
}

.dest-tags .el-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.dest-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
