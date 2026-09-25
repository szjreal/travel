<template>
  <div class="register-container">
    <!-- 左侧品牌展示区（CSS @media 控制手机端隐藏） -->
    <div class="brand-side">
      <div class="brand-content">
        <div class="brand-logo">
          <el-icon :size="40" color="#fff"><Suitcase /></el-icon>
          <h1 class="brand-title">智能旅游助手</h1>
        </div>
        <p class="brand-slogan">加入我们，开启智能旅行</p>
        <div class="brand-features">
          <div class="feature-item" v-for="f in features" :key="f.text">
            <span class="feature-icon">{{ f.icon }}</span>
            <span class="feature-text">{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧注册表单区 -->
    <div class="form-side">
      <div class="form-content">
        <h2 class="form-title">创建账号</h2>
        <p class="form-subtitle">注册后即可享受智能旅游服务</p>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          size="large"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名（3-20字符）"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-form-item prop="agree">
            <el-checkbox v-model="formData.agree">
              我已阅读并同意 <el-link type="primary" :underline="false">《用户协议》</el-link>
            </el-checkbox>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            class="register-btn"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form>

        <div class="form-footer">
          已有账号？
          <el-link type="primary" :underline="false" @click="goLogin">去登录</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Suitcase } from '@element-plus/icons-vue'
import { post } from '@/untils/authRequest.js'

const router = useRouter()

const features = [
  { icon: '✨', text: 'AI 智能行程规划' },
  { icon: '🗺️', text: '场景化专家推荐' },
  { icon: '💰', text: '预算可视化分析' },
]

const formRef = ref(null)
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false,
})
const isLoading = ref(false)

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAgree = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  agree: [
    { validator: validateAgree, trigger: 'change' },
  ],
}

const goLogin = () => {
  router.push('/login')
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    isLoading.value = true
    try {
      const res = await post('/auth/register', {
        username: formData.username,
        password: formData.password,
      })

      if (res.code === 0) {
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } else {
        ElMessage.error(res.msg || '注册失败')
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
.register-container {
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

.register-btn {
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
  .register-container {
    flex-direction: column;
  }
  .form-side {
    flex: 1;
  }
}
</style>
