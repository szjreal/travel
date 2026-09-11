<template>
  <div class="profile-container">
    <van-nav-bar 
      title="我的" 
      left-text="" 
      :left-arrow="true"
      @click-left="goBack"
    />
    
    <!-- 用户信息区域 -->
    <div class="user-info">
      

<div
  title="点击更换头像"
  style="cursor: pointer"
  @click="triggerAvatarInput"
>
  <van-image :src="userAvatar" round class="avatar" />
</div>

<!-- 任何 <input type="file"> 元素被点击时，浏览器就会调用操作系统的文件选择对话框。 -->
<input
  type="file"
  ref="avatarInput"
  accept="image/*"
  style="display: none"
  @change="handleAvatarChange"
/>

      <div class="user-details">
        <h2 class="user-name">{{ userName }}</h2>
        <p class="user-desc">欢迎使用智能旅游助手</p>
      </div>
    </div>
    
    <!-- 功能菜单 -->
    <div class="menu-section">
      <h3 class="menu-title">我的服务</h3>
      <van-cell-group>
        <van-cell
          :title="isLoggedIn ? '我的收藏' : '我的收藏'"
          is-link
          :icon="isLoggedIn ? 'star-o' : 'lock'"
          :class="{ 'disabled-cell': !isLoggedIn }"
          @click="handleFavoriteClick"
        />
        <van-cell
          title="修改昵称"
          is-link
          :icon="isLoggedIn ? 'edit' : 'lock'"
          :class="{ 'disabled-cell': !isLoggedIn }"
          @click="handleNicknameClick"
        />
      </van-cell-group>
    </div>
    
    <!-- 关于我们 -->
    <div class="menu-section">
      <h3 class="menu-title">关于</h3>
      <van-cell-group>
        <van-cell 
          title="关于我们" 
          is-link 
          @click="showAboutDialog"
        />
        <van-cell 
          title="版本信息" 
          value="v1.0.0"
        />
      </van-cell-group>
    </div>
    
    <!-- 关于我们对话框 -->
    <van-dialog 
      v-model:show="aboutDialogVisible" 
      title="关于我们"
      show-cancel-button
    >
      <div class="about-content">
        <p>智能旅游助手 v1.0.0</p>
        <p class="mt-2">基于 AI 技术的智能旅游规划平台</p>
        <p class="mt-2">为您提供个性化的旅游行程推荐和实时旅游咨询服务</p>
        <p class="mt-4 text-center">© 2026 智能旅游助手</p>
      </div>
    </van-dialog>

    <!-- 修改昵称弹窗 -->
    <!-- nicknameDialogVisible控制弹窗显示/隐藏，true=显示，false=隐藏 -->
    <van-dialog
      v-model:show="nicknameDialogVisible"
      title="修改昵称"
      show-cancel-button
      :before-close="onNicknameConfirm"
    >
      <div style="padding: 16px;">
        <van-field
          v-model="nicknameInput"
          placeholder="请输入新昵称（2-20个字符）"
          clearable
          maxlength="20"
          style="background-color: #f7f8fa; border-radius: 8px;"
        />
      </div>
    </van-dialog>

    <!-- 退出登录 -->
<div class="menu-section" v-if="isLoggedIn">
  <van-cell-group>
    <van-cell 
      title="退出登录" 
      is-link 
      icon="cross"
      @click="handleLogout"
    />
  </van-cell-group>
</div>

<!-- 未登录时显示登录按钮 -->
<div class="menu-section" v-else>
  <van-cell-group>
    <van-cell 
      title="去登录" 
      is-link 
      icon="user-o"
      @click="goLogin"
    />
  </van-cell-group>
</div>
  </div>
</template>

<script setup>
import { ref ,onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { get, post } from '@/untils/authRequest.js'   
const router = useRouter()
const avatarInput = ref(null)   // 绑定隐藏的 input 元素
// 用户信息
const userAvatar = ref('https://img.yzcdn.cn/vant/cat.jpeg')
const userName = ref('游客')
const isLoggedIn = ref(false)   // 新增：是否已登录
// 对话框状态
const aboutDialogVisible = ref(false)
// 修改昵称弹窗状态
const nicknameDialogVisible = ref(false)
const nicknameInput = ref('')

// 显示关于我们对话框
const showAboutDialog = () => {
  aboutDialogVisible.value = true
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  
  // 1. 没 token → 未登录状态，什么都不做
  if (!token) {
    isLoggedIn.value = false
    return
  }
  
  // 2. 有 token → 先从 localStorage 读用户信息立即显示
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    // 优先显示昵称，没有昵称才显示用户名
    userName.value = user.nickname || user.username
    userAvatar.value = user.avatar
    isLoggedIn.value = true
  }
  
  // 3. 有第二步保底，调接口拉最新数据覆盖第二步的用户信息
  try {
    const res = await get('/auth/user')
    if (res.code === 0) {
      // 优先显示昵称，没有昵称才显示用户名
      userName.value = res.user.nickname || res.user.username
      userAvatar.value = res.user.avatar
      // 更新 localStorage
      localStorage.setItem('user', JSON.stringify(res.user))
    }
  } catch (err) {
    // 401 错误会被 authRequest.js 的响应拦截器自动处理（清 token + 跳登录页）
    console.log('获取用户信息失败', err)
  }
})

const handleLogout = () => {
  // 清掉 localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // 重置页面状态
  userName.value = '游客'
  userAvatar.value = 'https://img.yzcdn.cn/vant/cat.jpeg'
  isLoggedIn.value = false
  showToast('已退出登录')
}

// 返回上一页
const goBack = () => {
  router.back()
}



// 去登录页
const goLogin = () => {
  router.push('/login')
}

// 我的收藏
const handleFavoriteClick = () => {
  if (!isLoggedIn.value) {
    showToast('请先登录后查看')
    router.push('/login')
    return
  }
  router.push('/favorites')
}

// 修改昵称
const handleNicknameClick = () => {
  if (!isLoggedIn.value) {
    showToast('请先登录后操作')
    router.push('/login')
    return
  }
  // 打开弹窗时，把当前昵称（或用户名）填进去方便修改
  //|| 的规则：从左到右找第一个有值的，找到就停。
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  nicknameInput.value = user.nickname || user.username || ''
  nicknameDialogVisible.value = true
}

// 确认修改昵称（before-close 钩子，返回 false 阻止关闭）
//参数 action是 before-close 钩子，Vant 在你点弹窗按钮时自动调用它，
// 并传一个 action 参数告诉你点的是哪个按钮：confirm 或 cancel
const onNicknameConfirm = async (action) => {
  // 点取消直接关闭
  //return true = 允许弹窗关闭
  if (action !== 'confirm') return true
  //.trim() 去掉首尾空格
  const val = nicknameInput.value.trim()
  if (!val) {
    showToast('昵称不能为空')
    return false
  }
  if (val.length < 2 || val.length > 20) {
    showToast('昵称长度需在 2-20 个字符之间')
    return false
  }
  try {
    const res = await post('/auth/nickname', { nickname: val })
    if (res.code === 0) {
      // 更新页面显示
      userName.value = val
      // 更新 localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.nickname = val
      localStorage.setItem('user', JSON.stringify(user))
      showToast('昵称修改成功')
      return true
    } else {
      showToast(res.msg)
      return false
    }
  } catch (err) {
    showToast('修改失败，请稍后重试')
    return false
  }
}

// 点击头像 → 触发隐藏的文件选择框
const triggerAvatarInput = () => {
  if (!isLoggedIn.value) {
    showToast('请先登录')
    return
  }
  avatarInput.value.click()
}

// 选好文件后触发
//参数 e 是 事件对象（Event），由浏览器在触发 change 时自动传入
const handleAvatarChange = async (e) => {
  //e.target 就是那个 <input type="file">。
  //.files 是用户选中的文件列表（FileList），即使 multiple 没开，也是数组形式，取 [0]
  const file = e.target.files[0]
  //用户点了"取消"没选任何文件时,退出不报错
  if (!file) return

  // 转成 base64 字符串
  //  创建文件读取器对象
  //FileReader 是浏览器内置的文件读取 API，专门用来读取用户本地文件。
  const reader = new FileReader()
  //读取完成后的回调
  //onload 是一个事件处理属性，当文件读取完成时自动触发。
  //回调函数里的 ev 是另一个事件对象，包含读取结果
  //等下方的  reader.readAsDataURL(file) 读取完成后，才会触发 onload 事件。
  reader.onload = async (ev) => {
    //ev.target 指向 reader 这个读取器对象。
    //ev.target.result 是读取完成后的结果，这里是一个 base64 字符串。
    //形如data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
    //FileReader 这个对象有一个内置属性叫 result，专门用来存放读取结果。
    const base64 = ev.target.result

    // 先立刻显示在页面上（用户不用等）
    //直接把 base64 赋值给它，Vue 会立刻刷新页面上的头像
    userAvatar.value = base64

    // 再发给后端存数据库
    try {
      const res = await post('/auth/avatar', { avatar: base64 })
      if (res.code === 0) {
        // 更新 localStorage，刷新不丢
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.avatar = base64
        localStorage.setItem('user', JSON.stringify(user))
        showToast('头像更换成功')
      } else {
        showToast(res.msg)
      }
    } catch (err) {
      showToast('上传失败')
    }
  }
  reader.readAsDataURL(file)

  // 重置 input，否则下次选同一张图不触发 change
  e.target.value = ''
}
</script>

<style scoped>
.profile-container {
  padding-bottom: 50px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #1989fa 0%, #36cbcb 100%);
  color: white;
}

.avatar {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details {
  margin-left: 20px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.user-desc {
  font-size: 14px;
  opacity: 0.9;
}

.menu-section {
  margin-top: 15px;
  background-color: white;
  border-radius: 12px;
  margin: 15px 10px 0;
  overflow: hidden;
}

.menu-title {
  font-size: 14px;
  color: #646566;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

/* 未登录时菜单置灰 */
.disabled-cell {
  opacity: 0.5;
}

.disabled-cell :deep(.van-cell__right-icon) {
  display: none;
}

.about-content {
  text-align: center;
  line-height: 1.6;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}
</style>