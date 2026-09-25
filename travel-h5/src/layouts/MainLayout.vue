<template>
  <div class="main-layout">
    <!-- 顶栏 -->
    <header class="topbar" :style="{ height: topbarHeight + 'px' }">
      <!-- 折叠/汉堡按钮 -->
      <el-button
        class="collapse-btn"
        circle
        text
        @click="handleToggleSidebar"
      >
        <el-icon size="20">
          <component :is="isMobile ? 'Expand' : (isCollapsed ? 'Expand' : 'Fold')" />
        </el-icon>
      </el-button>

      <!-- Logo -->
      <div class="logo">
        <el-icon size="22" color="#409EFF"><Suitcase /></el-icon>
        <span class="logo-text" v-show="!isMobile">智能旅游助手</span>
      </div>

      <!-- 右侧操作区 -->
      <div class="topbar-right">
        <el-dropdown trigger="click" @command="handleUserCommand">
          <el-avatar :size="36" :src="userAvatar || undefined" class="user-avatar">{{ userName.charAt(0) }}</el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="layout-body" :style="{ paddingTop: topbarHeight + 'px' }">
      <!-- 侧边栏（PC/平板） -->
      <aside
        v-show="!isMobile"
        class="sidebar"
        :style="{ width: sidebarActualWidth + 'px' }"
      >
        <SidebarMenu
          :menu="sidebarMenu"
          :collapsed="isCollapsed"
          :active="activeMenu"
        />
      </aside>

      <!-- 内容区 -->
      <main
        class="content-area"
        :style="{ marginLeft: !isMobile ? sidebarActualWidth + 'px' : '0' }"
      >
        <router-view />
      </main>
    </div>

    <!-- 手机端抽屉侧边栏 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="220px"
      :show-close="false"
      :with-header="false"
    >
      <SidebarMenu
        :menu="sidebarMenu"
        :collapsed="false"
        :active="activeMenu"
        @select="drawerVisible = false"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Suitcase, Fold, Expand } from '@element-plus/icons-vue'
import { get } from '@/untils/authRequest.js'
import { sidebarMenu } from '@/config/sidebarMenu'
import SidebarMenu from '@/layouts/components/SidebarMenu.vue'

const route = useRoute()
const router = useRouter()

// 布局尺寸常量
const sidebarWidth = 220
const sidebarCollapsedWidth = 64
const topbarHeight = 60

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 移动端抽屉
const isMobile = ref(false)
const drawerVisible = ref(false)

// 窗口宽度
const windowWidth = ref(window.innerWidth)

// 用户头像和昵称（与 Profile.vue 一致）
const userAvatar = ref('')
const userName = ref('游客')

// 响应式检测
const updateBreakpoint = () => {
  windowWidth.value = window.innerWidth
  const wasMobile = isMobile.value
  isMobile.value = windowWidth.value < 768
  // 平板默认折叠
  if (windowWidth.value >= 768 && windowWidth.value < 1200) {
    isCollapsed.value = true
  }
  // PC 默认展开
  if (windowWidth.value >= 1200) {
    isCollapsed.value = false
  }
  // 从手机切换到非手机时关闭抽屉
  if (wasMobile && !isMobile.value) {
    drawerVisible.value = false
  }
}

onMounted(async () => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)

  // 加载用户信息（与 Profile.vue 逻辑一致）
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    userName.value = user.nickname || user.username || '游客'
    userAvatar.value = user.avatar || ''
  }
  try {
    const res = await get('/auth/user')
    if (res.code === 0) {
      userName.value = res.user.nickname || res.user.username || '游客'
      userAvatar.value = res.user.avatar || ''
    }
  } catch (e) { /* 未登录，不影响布局 */ }
})
onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

// 当前激活菜单的路由路径
const activeMenu = computed(() => route.path)

// 侧边栏实际宽度
const sidebarActualWidth = computed(() => {
  if (isMobile.value) return 0
  return isCollapsed.value ? sidebarCollapsedWidth : sidebarWidth
})

// 折叠/展开切换
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理折叠按钮点击
const handleToggleSidebar = () => {
  if (isMobile.value) {
    drawerVisible.value = true
  } else {
    toggleSidebar()
  }
}

// 用户下拉菜单命令处理
const handleUserCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    localStorage.removeItem('token')
    router.push('/login')
  }
}

// provide 给子页面使用
provide('layout', {
  isCollapsed,
  isMobile,
  toggleSidebar,
  sidebarWidth,
  topbarHeight,
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #f0f2f5;
}

/* 顶栏 */
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 8px;
}

.collapse-btn {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.logo-text {
  color: #303133;
  white-space: nowrap;
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff, #36cbcb);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  top: 60px;
  bottom: 0;
  left: 0;
  background: #fff;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 99;
  transition: width 0.3s ease;
}

/* 内容区 */
.content-area {
  padding: 20px;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

/* 兼容旧页面的 page-container 样式 */
.content-area :deep(.page-container) {
  min-height: auto;
  padding-bottom: 0;
}
</style>
