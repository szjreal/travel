

<template>
  <div class="app-container">
    <!-- <router-view></router-view>逻辑： 
    拿浏览器当前的 URL 路径，
     去 routes 数组从上到下一条条比对 path，匹配成功，
     就取出这个路由的 component，放到 <router-view> 里面渲染。 -->
    <router-view></router-view>
    <!-- 写个route代表开启路由模式，然后用to属性来指定跳转的path（路由的path） -->
    <van-tabbar v-if="['Home','Chat','Profile'].includes(route.name)" route v-model="active">
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/chat" icon="chat-o">对话</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const active = ref(0)
</script>

