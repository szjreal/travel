import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ---- 布局路由（带 MainLayout） ----
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      // 首页：PC 端重定向到 /dashboard
      { path: '', redirect: '/dashboard' },
      // 保留的现有页面
      { path: 'chat',         name: 'Chat',         component: () => import('@/views/Chat.vue') },
      { path: 'profile',      name: 'Profile',      component: () => import('@/views/Profile.vue') },
      { path: 'detail',       name: 'Detail',       component: () => import('@/views/Detail.vue') },
      { path: 'favorites',    name: 'Favorites',    component: () => import('@/views/Favorites.vue'), meta: { needLogin: true } },
      // 新增页面
      { path: 'dashboard',    name: 'Dashboard',    component: () => import('@/views/Dashboard.vue') },
      { path: 'scene',        name: 'Scene',        component: () => import('@/views/Scene.vue') },
      { path: 'discover',     name: 'Discover',     component: () => import('@/views/Discover.vue') },
      { path: 'tips',         name: 'Tips',         component: () => import('@/views/Tips.vue') },
      { path: 'chat-history', name: 'ChatHistory',  component: () => import('@/views/ChatHistory.vue') },
      { path: 'about',        name: 'About',        component: () => import('@/views/About.vue') },
      { path: 'plan-wizard',  name: 'PlanWizard',   component: () => import('@/views/PlanWizard.vue') },
    ]
  },
  // ---- 独立路由（无布局） ----
  { path: '/login',    name: 'Login',    component: () => import('@/views/Login.vue'),    meta: { layout: 'none' } },
  { path: '/register', name: 'Register', component: () => import('@/views/Register.vue'), meta: { layout: 'none' } },
  // ---- 404 兜底 ----
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 需要登录但未登录 → 跳登录页
  if (to.meta.needLogin && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录还去登录/注册页 → 跳仪表盘
  if (token && ['Login', 'Register'].includes(to.name)) {
    next('/dashboard')
    return
  }

  next()
})

export default router
