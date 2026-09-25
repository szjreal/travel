<template>
  <div class="login-container">
    <!-- 左侧品牌展示区（CSS @media 控制手机端隐藏） -->
    <div class="brand-side">
      <div class="brand-content">
        <div class="brand-logo">
          <el-icon :size="40" color="#fff"><Suitcase /></el-icon>
          <h1 class="brand-title">智能旅游助手</h1>
        </div>
        <p class="brand-slogan">让 AI 帮你规划每一次旅行</p>
        <div class="brand-features">
          <div class="feature-item" v-for="f in features" :key="f.text">
            <span class="feature-icon">{{ f.icon }}</span>
            <span class="feature-text">{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="form-side">
      <div class="form-content">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-subtitle">请登录您的账号</p>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          size="large"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="formData.remember">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>

          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            class="login-btn"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <div class="form-footer">
          还没账号？
          <el-link type="primary" :underline="false" @click="goRegister">立即注册</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Suitcase } from '@element-plus/icons-vue'
import { post } from '@/untils/authRequest.js'

const router = useRouter()
const route = useRoute()

const features = [
  { icon: '✨', text: 'AI 智能行程规划' },
  { icon: '🗺️', text: '场景化专家推荐' },
  { icon: '💰', text: '预算可视化分析' },
]

const formRef = ref(null)
const formData = reactive({
  username: '',
  password: '',
  remember: false,
})
const isLoading = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const goRegister = () => {
  router.push('/register')
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    isLoading.value = true
    try {
      const res = await post('/auth/login', {
        username: formData.username,
        password: formData.password,
      })

      if (res.code === 0) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))

        ElMessage.success('登录成功')

        const redirect = route.query.redirect
        if (redirect) {
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      } else {
        ElMessage.error(res.msg || '登录失败')
      }
    } catch (err) {
      ElMessage.error('网络错误，请稍后重试')
    } finally {
      isLoading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

/* 左侧品牌区 */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #409eff 0%, #36cbcb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-content {
  max-width: 360px;
  padding: 40px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.brand-slogan {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.feature-icon {
  font-size: 20px;
}

/* 右侧表单区 */
.form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.form-content {
  width: 100%;
  max-width: 380px;
  padding: 40px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px;
}

.form-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 32px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #909399;
}

/* 响应式：手机端隐藏品牌区，表单区全屏 */
@media (max-width: 768px) {
  .brand-side {
    display: none;
  }
  .login-container {
    flex-direction: column;
  }
  .form-side {
    flex: 1;
  }
}
</style>
