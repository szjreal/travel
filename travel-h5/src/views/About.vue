<template>
  <div class="about-page">
    <!-- Block 1: 系统介绍 -->
    <el-card class="about-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" color="#409EFF"><InfoFilled /></el-icon>
          <span class="card-title">关于智能旅游助手</span>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="系统名称">智能旅游助手</el-descriptions-item>
        <el-descriptions-item label="系统描述">
          基于 AI 的智能旅游规划平台，帮助用户快速生成行程、推荐景点美食、规划预算
        </el-descriptions-item>
        <el-descriptions-item label="核心能力">
          <el-tag
            v-for="cap in capabilities"
            :key="cap"
            class="cap-tag"
            type="primary"
            effect="plain"
          >
            {{ cap }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Block 2: 技术栈 -->
    <el-card class="about-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" color="#409EFF"><Cpu /></el-icon>
          <span class="card-title">技术栈</span>
        </div>
      </template>
      <el-table :data="techStack" border stripe style="width: 100%">
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column prop="tech" label="技术" width="150" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="desc" label="说明" />
      </el-table>
    </el-card>

    <!-- Block 3: 架构图 -->
    <el-card class="about-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" color="#409EFF"><Box /></el-icon>
          <span class="card-title">系统架构</span>
        </div>
      </template>
      <pre class="arch-tree">{{ archTree }}</pre>
    </el-card>

    <!-- Block 4: 功能模块清单 -->
    <el-card class="about-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" color="#409EFF"><Grid /></el-icon>
          <span class="card-title">功能模块</span>
        </div>
      </template>
      <el-table :data="modules" border stripe style="width: 100%">
        <el-table-column prop="name" label="模块" width="120" />
        <el-table-column prop="route" label="路由" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已有' ? 'success' : (row.status === '本轮实现' ? 'primary' : 'info')" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="说明" />
      </el-table>
    </el-card>

    <!-- Block 5: 版本信息 -->
    <el-card class="about-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon :size="20" color="#409EFF"><Document /></el-icon>
          <span class="card-title">版本信息</span>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="当前版本">v2.0.0-alpha</el-descriptions-item>
        <el-descriptions-item label="迁移阶段">第一轮：框架切换 + 布局 + 路由 + About</el-descriptions-item>
        <el-descriptions-item label="上一版本">v1.0.0 (Vant 移动端)</el-descriptions-item>
        <el-descriptions-item label="最后更新">2026-09-24</el-descriptions-item>
        <el-descriptions-item label="技术负责人">旅游助手前端重构团队</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import {
  InfoFilled, Cpu, Box, Grid, Document,
} from '@element-plus/icons-vue'

const capabilities = [
  'AI 对话规划',
  '场景化推荐',
  '行程时间线',
  '预算可视化',
  '收藏管理',
]

const techStack = [
  { category: '框架',       tech: 'Vue 3',         version: '3.5.x',   desc: '渐进式前端框架' },
  { category: '构建工具',   tech: 'Vite',          version: '8.x',     desc: '下一代前端构建工具' },
  { category: 'UI 组件库',  tech: 'Element Plus',  version: '2.x',     desc: 'PC Web 端组件库（迁移目标）' },
  { category: '路由',       tech: 'Vue Router',    version: '4.x',     desc: '官方路由管理器' },
  { category: 'HTTP',       tech: 'Axios',         version: '1.x',     desc: 'HTTP 请求库' },
  { category: '旧 UI 库',   tech: 'Vant 4',        version: '4.10.x',  desc: '移动端组件库（共存期保留）' },
]

const archTree = `App.vue
└── MainLayout.vue
    ├── TopBar
    │   ├── Logo
    │   ├── SearchInput (el-input)
    │   ├── ThemeToggle (el-button)
    │   ├── Notification (el-badge + el-button)
    │   └── UserAvatar (el-avatar + el-dropdown)
    ├── SidebarMenu.vue
    │   └── el-menu → el-menu-item-group → el-menu-item
    └── <router-view>  （页面内容）
        ├── Dashboard.vue        (/dashboard)
        ├── Chat.vue             (/chat)
        ├── Detail.vue           (/detail)
        ├── Scene.vue            (/scene)        [占位]
        ├── Discover.vue         (/discover)     [占位]
        ├── Tips.vue             (/tips)         [占位]
        ├── ChatHistory.vue      (/chat-history) [占位]
        ├── Favorites.vue        (/favorites)
        ├── Profile.vue          (/profile)
        └── About.vue            (/about)`

const modules = [
  { name: '首页仪表盘', route: '/dashboard',    status: '占位',     desc: '数据概览、快捷入口、对话趋势' },
  { name: 'AI 对话',    route: '/chat',         status: '已有',     desc: '与 AI 助手对话，支持场景模式切换' },
  { name: '行程规划',   route: '/detail',       status: '已有',     desc: '查看行程时间线、预算分配、每日花费' },
  { name: '场景助手',   route: '/scene',        status: '占位',     desc: '行程规划/美食探店/预算规划等场景选择' },
  { name: '热门目的地', route: '/discover',     status: '占位',     desc: '热门城市排行、推荐' },
  { name: '旅行攻略',   route: '/tips',         status: '占位',     desc: '攻略文章列表' },
  { name: '我的收藏',   route: '/favorites',    status: '已有',     desc: '收藏的行程管理，支持搜索/编辑/删除' },
  { name: '历史对话',   route: '/chat-history', status: '占位',     desc: '对话历史记录查看与回放' },
  { name: '个人信息',   route: '/profile',      status: '已有',     desc: '用户资料编辑' },
  { name: '关于系统',   route: '/about',        status: '本轮实现', desc: '系统信息展示' },
]
</script>

<style scoped>
.about-page {
  max-width: 900px;
  margin: 0 auto;
}

.about-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.cap-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.arch-tree {
  font-family: 'Courier New', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}
</style>
