<template>
  <div class="register-container">
    <!-- 左侧品牌展示区（CSS @media 控制手机端隐藏） -->
    <div class="brand-side">
      <!-- 装饰性光斑 -->
      <span class="blob blob-1"></span>
      <span class="blob blob-2"></span>
      <span class="blob blob-3"></span>

      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-badge">
            <el-icon :size="30" color="#fff"><Suitcase /></el-icon>
          </div>
          <h1 class="brand-title">智能旅游助手</h1>
        </div>
        <p class="brand-slogan">加入我们，开启一场由 AI 定制的智能旅行</p>
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
        <!-- 手机端顶部品牌标识 -->
        <div class="mobile-brand">
          <div class="logo-badge logo-badge--sm">
            <el-icon :size="24" color="#fff"><Suitcase /></el-icon>
          </div>
          <span class="mobile-brand-name">智能旅游助手</span>
        </div>

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
  position: relative;
  flex: 1.1;
  overflow: hidden;
  background: linear-gradient(135deg, #4776e6 0%, #409eff 45%, #36cbcb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* 装饰光斑 */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.35;
  pointer-events: none;
}
.blob-1 {
  width: 360px;
  height: 360px;
  top: -120px;
  right: -80px;
  background: radial-gradient(circle at 30% 30%, #ffffff, transparent 70%);
  animation: float 9s ease-in-out infinite;
}
.blob-2 {
  width: 260px;
  height: 260px;
  bottom: -90px;
  left: -60px;
  background: radial-gradient(circle at 30% 30%, #b3e5ff, transparent 70%);
  animation: float 11s ease-in-out infinite reverse;
}
.blob-3 {
  width: 180px;
  height: 180px;
  top: 40%;
  left: 20%;
  background: radial-gradient(circle at 30% 30%, #7ef0e0, transparent 70%);
  animation: float 13s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-26px) translateX(14px); }
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 380px;
  padding: 40px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.logo-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.logo-badge--sm {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.brand-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
}

.brand-slogan {
  font-size: 16px;
  line-height: 1.7;
  opacity: 0.92;
  margin-bottom: 44px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 15px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  transition: transform 0.25s ease, background 0.25s ease;
}
.feature-item:hover {
  transform: translateX(6px);
  background: rgba(255, 255, 255, 0.2);
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
  animation: rise 0.5s ease both;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 手机端顶部品牌标识（桌面端隐藏） */
.mobile-brand {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.mobile-brand .logo-badge {
  background: linear-gradient(135deg, #409eff, #36cbcb);
  border: none;
}
.mobile-brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.form-title {
  font-size: 26px;
  font-weight: 800;
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
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border: none;
  background: linear-gradient(135deg, #409eff 0%, #36cbcb 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(64, 158, 255, 0.35);
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #909399;
}

/* 输入框圆角微调 */
.form-content :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
}
.form-content :deep(.el-form-item) {
  margin-bottom: 22px;
}

/* 响应式：手机端隐藏品牌区，表单区全屏 */
@media (max-width: 768px) {
  .brand-side {
    display: none;
  }
  .register-container {
    flex-direction: column;
    background: #fff;
  }
  .form-side {
    flex: 1;
  }
  .mobile-brand {
    display: flex;
  }
  .form-content {
    padding: 32px 24px;
  }
}
</style>
