<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar title="登录" left-arrow left-text="返回" @click-left="onBack" />
    </div>
    <div class="page-content">
      <div class="login-logo">
        <van-icon name="user-circle-o" size="64px" color="#1989fa" />
        <h2 class="login-title">智能旅游助手</h2>
        <p class="login-subtitle">欢迎回来，请登录您的账号</p>
      </div>

      <div class="card login-form">
        <van-field
          v-model="formData.username"
          label="用户名"
          placeholder="请输入用户名"
          clearable
          :border="false"
          style="margin-bottom: 12px; border-radius: 8px; background-color: #f7f8fa;"
        />
        <van-field
          v-model="formData.password"
          label="密码"
          placeholder="请输入密码"
          type="password"
          clearable
          @keyup.enter="handleLogin"
          :border="false"
          style="margin-bottom: 16px; border-radius: 8px; background-color: #f7f8fa;"
        />
        <van-button
          size="large"
          round
          type="primary"
          :loading="isLoading"
          @click="handleLogin"
        >
          登录
        </van-button>

        <div class="login-footer">
          还没有账号？
          <span class="link" @click="goRegister">立即注册</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

import { showToast } from 'vant'
import { post } from '@/untils/authRequest.js'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// 表单数据
const formData = reactive({
  username: '',
  password: ''
})
const isLoading = ref(false)

// 返回上一页
const onBack = () => {
  router.back()
}

// 跳注册页
const goRegister = () => {
  router.push('/register')
}

// 登录
const handleLogin = async () => {
  // 1. 校验
  if (!formData.username) {
    showToast('请输入用户名')
    return
  }
  if (!formData.password) {
    showToast('请输入密码')
    return
  }

  // 2. 调接口
  isLoading.value = true
  try {
  
    const res = await post('/auth/login', {
      username: formData.username,
      password: formData.password
    })

   if (res.code === 0) {
  // 登录成功：存 token 和 user
  // setItem存  getItem 取  removeItem删
localStorage.setItem('token', res.token)
  localStorage.setItem('user', JSON.stringify(res.user))
 showToast('登录成功')
// 判断是否要跳回原页面
//很重要
//第一种情况，如果在profile页面点击去登陆，直接跳转到http://localhost:5173/login，然后输入用户名和密码以后点击登录，经过路由守卫，虽然没有token，但也没有to.meta.needLogin，于是放行，于是就没有 route.query.redirect，于是跳回/profile。
//第二种情况，直接输入http://localhost:5173/favorites，经过路由守卫，符合to.meta.needLogin && !token，于是组合成/login?redirect=/favorites，经过const redirect = route.query.redirect
//if (redirect) {
 // router.push(redirect)  ，就返回/favorites
const redirect = route.query.redirect
if (redirect) {
  router.push(redirect)      // 跳回登录前想去的页面
} else {
  router.push('/profile')   // 没指定就跳个人页
}
}else {
      showToast(res.msg)
    }
  } catch (err) {
    showToast('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-logo {
  text-align: center;
  padding: 40px 0 20px;
}

.login-title {
  font-size: 22px;
  color: #323233;
  margin: 12px 0 6px;
}

.login-subtitle {
  font-size: 14px;
  color: #969799;
}

.login-form {
  margin-top: 20px;
}

.login-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #969799;
}

.link {
  color: #1989fa;
  margin-left: 4px;
}
</style>