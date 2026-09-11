import {    createRouter, createWebHistory } from 'vue-router'
//引入createRouter用来const routes和最后的const router = createRouter({联用

const routes =[
    {
        path:'/',
        name:'Home',
        //访问路由以后应该展示的画面
        component:()=>import('@/views/Home.vue')
    },
    {
        path:'/chat',
        name:'Chat',
        component:()=>import('@/views/Chat.vue')
    },
    {
        path:'/profile',
        name:'Profile',
        component:()=>import('@/views/Profile.vue')
    }
    ,
    {
        path:'/detail',
        name:'Detail',
        component:()=>import('@/views/Detail.vue')
    },
      { path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue') },
  { path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue') },
  { path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/Favorites.vue'),
    meta: { needLogin: true } }
]
//创建路由对象
const router = createRouter({
  //代表路由模式 createWebHistory
    history: createWebHistory(),
    //路由的配置，根据上方定义的routes来
    routes
})

// 全局前置守卫：每次路由跳转前都会执行
//如果我在未登录时候直接输入http://localhost:5173/favorites
//进入beforeEach，三个函数自动填好
//to = {
//   path: '/favorites',
//   fullPath: '/favorites',
//   meta: { needLogin: true },   // ← 路由配置里 favorites 写了 meta.needLogin: true
//   name: 'Favorites',
//   ...
// }

// from = { path: '/', ... }   // 从首页过来的


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 如果目标页面需要登录，且没有 token
  if (to.meta.needLogin && !token) {
    // 跳转到登录页，并把原来要去的地址存下来，登录成功后跳回去
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    // 不需要登录 或 已有 token，正常放行
    next()
  }
})
//对外暴露
export default router