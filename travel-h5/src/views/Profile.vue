<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <el-card class="user-card" shadow="hover">
      <div class="user-header">
        <div class="avatar-wrap" @click="triggerAvatarInput">
          <el-avatar :size="80" :src="userAvatar || undefined" class="user-avatar">
            {{ userName.charAt(0) }}
          </el-avatar>
          <div class="avatar-overlay">更换</div>
        </div>
        <input type="file" ref="avatarInput" accept="image/*" style="display:none" @change="handleAvatarChange" />

        <div class="user-meta">
          <h2 class="user-name">{{ userName }}</h2>
          <p class="user-desc">{{ userDesc }}</p>
          <p class="user-contact" v-if="userEmail || userPhone">
            <span v-if="userEmail">📧 {{ userEmail }}</span>
            <span v-if="userPhone">📱 {{ userPhone }}</span>
          </p>
          <p class="user-date">注册时间: {{ registerDate }}</p>
        </div>

        <div class="user-stats">
          <el-statistic title="总行程" :value="stats.totalTrips" />
          <el-statistic title="收藏数" :value="stats.favorites" />
          <el-statistic title="对话数" :value="stats.chats" />
        </div>
      </div>
    </el-card>

    <!-- Tab 布局 -->
    <el-card class="tab-card" shadow="never">
      <el-tabs v-model="activeTab">
        <!-- Tab1: 基本信息 -->
        <el-tab-pane label="基本信息" name="info">
          <el-form :model="profileForm" label-width="80px" style="max-width: 500px">
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="3"
                placeholder="介绍一下自己吧"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingProfile" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab2: 账号安全 -->
        <el-tab-pane label="账号安全" name="security">
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" style="max-width: 500px">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingPassword" @click="changePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>


      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get, post } from '@/untils/authRequest.js'

const router = useRouter()
const avatarInput = ref(null)

// 用户信息
const userAvatar = ref('')
const userName = ref('游客')
const userDesc = ref('欢迎使用智能旅游助手')
const userEmail = ref('')
const userPhone = ref('')
const registerDate = ref('—')
const isLoggedIn = ref(false)

// Tab 状态
const activeTab = ref('info')

// 统计数据（初始值归零，onMounted 里从接口拉）
const stats = reactive({
  totalTrips: 0,
  favorites: 0,
  chats: 0,
})

// 基本信息表单
const profileForm = reactive({
  nickname: '',
  email: '',
  phone: '',
  bio: '',
})
const savingProfile = ref(false)

// 密码表单
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const savingPassword = ref(false)

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// onMounted: 获取用户信息 + 统计数据
onMounted(async () => {
  const token = localStorage.getItem('token')

  if (!token) {
    isLoggedIn.value = false
    return
  }

  isLoggedIn.value = true

  // 先从 localStorage 读用户信息立即显示
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    userName.value = user.nickname || user.username
    userAvatar.value = user.avatar || ''
    profileForm.nickname = user.nickname || user.username || ''
    profileForm.email = user.email || ''
    profileForm.phone = user.phone || ''
    profileForm.bio = user.bio || ''
  }

  // 并行拉用户详情 + 统计数据
  try {
    const [userRes, statsRes] = await Promise.allSettled([
      get('/auth/user'),
      get('/travel/stats'),
    ])

    // 用户详情
    if (userRes.status === 'fulfilled' && userRes.value?.code === 0) {
      const u = userRes.value.user
      userName.value = u.nickname || u.username || userName.value
      userAvatar.value = u.avatar || ''
      userDesc.value = u.bio || '欢迎使用智能旅游助手'
      userEmail.value = u.email || ''
      userPhone.value = u.phone || ''
      registerDate.value = u.created_at
        ? new Date(u.created_at).toLocaleDateString('zh-CN')
        : '—'
      localStorage.setItem('user', JSON.stringify(u))
      profileForm.nickname = u.nickname || u.username || ''
      profileForm.email = u.email || ''
      profileForm.phone = u.phone || ''
      profileForm.bio = u.bio || ''
    }

    // 统计数据
    if (statsRes.status === 'fulfilled' && statsRes.value?.code === 0) {
      const d = statsRes.value.data
      stats.chats = d.chatCount || 0
      stats.favorites = d.favoriteCount || 0
      stats.totalTrips = d.chatCount || 0  // 用对话数近似总行程
    }
  } catch (err) {
    console.log('获取 Profile 数据失败', err)
  }
})

// 保存基本信息
const saveProfile = async () => {
  if (!profileForm.nickname.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  if (profileForm.nickname.trim().length < 2 || profileForm.nickname.trim().length > 20) {
    ElMessage.warning('昵称长度需在 2-20 个字符之间')
    return
  }

  savingProfile.value = true
  try {
    const res = await post('/auth/profile', {
      nickname: profileForm.nickname.trim(),
      email: profileForm.email || null,
      phone: profileForm.phone || null,
      bio: profileForm.bio || null,
    })
    if (res.code === 0) {
      userName.value = profileForm.nickname.trim()
      userDesc.value = profileForm.bio || '欢迎使用智能旅游助手'
      userEmail.value = profileForm.email
      userPhone.value = profileForm.phone
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.nickname = profileForm.nickname.trim()
      user.email = profileForm.email
      user.phone = profileForm.phone
      user.bio = profileForm.bio
      localStorage.setItem('user', JSON.stringify(user))
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    savingProfile.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    savingPassword.value = true
    try {
      const res = await post('/auth/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      if (res.code === 0) {
        ElMessage.success('密码修改成功')
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } catch (err) {
      ElMessage.error('修改失败，请稍后重试')
    } finally {
      savingPassword.value = false
    }
  })
}

// 头像上传
const triggerAvatarInput = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  avatarInput.value.click()
}

const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result
    userAvatar.value = base64

    try {
      const res = await post('/auth/avatar', { avatar: base64 })
      if (res.code === 0) {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.avatar = base64
        localStorage.setItem('user', JSON.stringify(user))
        ElMessage.success('头像更换成功')
      } else {
        ElMessage.error(res.msg || '上传失败')
      }
    } catch (err) {
      ElMessage.error('上传失败')
    }
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 100px);
}

/* 用户信息卡片 */
.user-card {
  margin-bottom: 20px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-wrap {
  position: relative;
  cursor: pointer;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 2px 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrap:hover .avatar-overlay {
  opacity: 1;
}

.user-meta {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
}

.user-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 4px;
}

.user-contact {
  font-size: 13px;
  color: #606266;
  margin: 2px 0;
  display: flex;
  gap: 16px;
}

.user-date {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.user-stats {
  display: flex;
  gap: 32px;
}

.user-stats .el-statistic {
  text-align: center;
}

/* Tab 卡片 */
.tab-card {
  min-height: 400px;
}

/* 响应式：手机端统计卡片堆叠 */
@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  .user-stats {
    gap: 20px;
  }
}
</style>
