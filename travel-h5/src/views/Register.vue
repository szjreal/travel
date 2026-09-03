<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar title="注册" left-arrow left-text="返回" @click-left="onBack" />
    </div>
    <div class="page-content">
      <div class="register-logo">
        <van-icon name="add-square-o" size="64px" color="#1989fa" />
        <h2 class="register-title">创建账号</h2>
        <p class="register-subtitle">注册后即可享受智能旅游服务</p>
      </div>

      <div class="card register-form">
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
          :border="false"
          style="margin-bottom: 12px; border-radius: 8px; background-color: #f7f8fa;"
        />
        <van-field
          v-model="formData.confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          type="password"
          clearable
          @keyup.enter="handleRegister"
          :border="false"
          style="margin-bottom: 16px; border-radius: 8px; background-color: #f7f8fa;"
        />
        <van-button
          size="large"
          round
          type="primary"
          :loading="isLoading"
          @click="handleRegister"
        >
          注册
        </van-button>

        <div class="register-footer">
          已有账号？
          <span class="link" @click="goLogin">去登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { post } from '@/untils/authRequest.js'

const router = useRouter()

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})
const isLoading = ref(false)

// 返回上一页
const onBack = () => {
  router.back()
}

// 跳登录页
const goLogin = () => {
  router.push('/login')
}

// 注册
const handleRegister = async () => {
  // 1. 校验
  if (!formData.username) {
    showToast('请输入用户名')
    return
  }
  if (!formData.password) {
    showToast('请输入密码')
    return
  }
  if (formData.password !== formData.confirmPassword) {
    showToast('两次密码不一致')
    return
  }

  // 2. 调接口
  isLoading.value = true
  try {
    const res = await post('/auth/register', {
      username: formData.username,
      password: formData.password
    })

    // 3. 判断返回结果
    if (res.code === 0) {
      showToast('注册成功')
      // 注册成功后跳登录页
      router.push('/login')
    } else {
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
.register-logo {
  text-align: center;
  padding: 40px 0 20px;
}

.register-title {
  font-size: 22px;
  color: #323233;
  margin: 12px 0 6px;
}

.register-subtitle {
  font-size: 14px;
  color: #969799;
}

.register-form {
  margin-top: 20px;
}

.register-footer {
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