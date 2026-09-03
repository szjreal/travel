<template>
  <div class="page-container">
    <div class="page-header">
  <van-nav-bar
  title="智能旅游助手"/>
  </div>
  <div class="page-content">
  <van-notice-bar
  left-icon="info-o"
  text="基于ai的智能旅游助手，帮助您更方便地规划您的旅游行程。"
/>
<div class="card search-card">
  <div class="section-title">
    规划你的旅程
  </div>
      <!--  is-link 表示展示右侧的箭头并可点击 -->
         <!-- @click="showCityPicker=true"表示点击以后变成true，弹出选择器 -->
          <!-- 变成true以后van-popup 通过 v-model:show 感知到 show=true，
           然后Popup 内部执行「弹出动作」，弹窗内容 van-picker 渲染出来 -->
    <van-field 
    v-model="formData.city"
    @click="showCityPicker=true"
     label="目的地" 
     readonly
    placeholder="请选择城市" 
     is-link
    style="margin-bottom: 12px;
    border-radius: 8px;
    background-color: #f7f8fa;
    
       "/>
       <van-field
       v-model="formData.budget"
       label="预算(元)"
       placeholder="请输入预算"
       type="number"
       :border="false"
       style="margin-bottom: 12px;
       border-radius: 8px;
       background-color: #f7f8fa;
       "/>
       <van-field
       v-model="formData.days"
       label="行程天数"
       placeholder="请输入行程天数"
       type="digit"
       :border="false"
       style="margin-bottom: 12px;
       border-radius: 8px;
       background-color: #f7f8fa;
       "/>
       <van-button
       size="large"
       round
       :loading="isLoading"
       type="primary"
       @click="handleSubmit"
       >
        提交
       </van-button>
</div>
<div class="card quick-actions">
    <div class="section-title">
   快捷入口
  </div>
  <!-- gutter 表示网格之间的间距，默认px -->
  <!-- column-num 表示每行显示的网格数量 -->
  <van-grid :gutter="12" :column-num="2">
  <van-grid-item @click="goPage('/chat')" icon="chat-o" text="AI 对话" />
  <van-grid-item @click="goPage('/profile')" icon="user-o" text="我的" />

</van-grid>
</div>
<div class="card popular-destinations">
  <div class="section-title">
   热门目的地
  </div>
  <van-grid :gutter="8" :column-num="4">
    <!-- 点击以后通过selectedCity方法把item赋值给formData.city -->
     <!-- :class="{'active':item==formData.city}表示如果item等于formData.city，就添加active类名， -->
  <van-grid-item @click="selectedCity(item)" v-for="(item,index) in popularCities" :key="index" :text="item" >
    <div class="city-tag" :class="{'active':item==formData.city}">{{ item }}</div>
  </van-grid-item>
</van-grid>
  </div>
  <!--  van-popup 表示弹窗选择器（底部弹出一个背景） -->
    <!-- van-picker 表示选择器（内容） -->
      <!-- 在上面点击目的地，showCityPicker后变成true，然后van-popup 通过 v-model:show 感知到 show=true，
           然后Popup 内部执行「弹出动作」，弹窗内容 van-picker 渲染出来 -->
  <van-popup
    v-model:show="showCityPicker"
    position="bottom"
   round
  >
  <!-- van-picker 组件规定了 columns 必须是对象数组格式：要包含text和value属性，纯粹是为了满足 van-picker 对数据格式的硬性要求。
  { text: '北京',  value: '北京'  },
  { text: '上海',  value: '上海'  },
  { text: '广州',  value: '广州'  },
  -->
   <!-- 所以需要用cityColumns数组来整理allCities数组，每个对象包含text和value属性 -->
   <!-- @confirm 表示定义一个选择确认事件 -->
   <!-- @cancel 表示定义一个选择取消事件 -->
    <van-picker
    title="请选择目的地"
      v-model="cityPickerValue"
      :columns="cityColumns"
      @confirm="handleCityConfirm"
      @cancel="showCityPicker=false"
    />
  </van-popup>
</div>
  </div>
</template>
<script setup>
import { reactive,ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

const showCityPicker = ref(false)
const cityPickerValue = ref([])
const allCities = ref([
'北京','上海','广州','深圳','重庆','天津','武汉','成都','西安','杭州',
'南京','苏州','郑州','长沙','青岛','沈阳','宁波','无锡','厦门','福州',
'济南','哈尔滨','长春','太原','石家庄','南昌','合肥','贵阳','昆明','南宁',
'呼和浩特','银川','乌鲁木齐','拉萨','香港','澳门','台北','大连','佛山','东莞'
])
const popularCities = ref(['北京','上海','广州','深圳','重庆','天津','武汉','成都'])

//.map() 的作用是：遍历数组每一项，对每项执行一次函数，把返回值收集成新数组
// 流程：
// '北京'  →  { text: '北京',  value: '北京'  }
// '上海'  →  { text: '上海',  value: '上海'  }
// '广州'  →  { text: '广州',  value: '广州'  }
const cityColumns =allCities.value.map(item=>({
  text:item, // item 就是 '北京' 这个字符串
  value:item// 又用了一次同一个字符串
}))
// 处理选择确认
// handleCityConfirm = ({ 里面可以放三个参数：selectedIndex, selectedOptions(里面是数组),selectedValues  })
const handleCityConfirm = ({ selectedValues }) => {
  formData.city = selectedValues[0]
  showCityPicker.value = false
}

const formData = reactive({
  city: '',
  budget: null,
  days:null
})
const isLoading = ref(false)
// 提交表单
const handleSubmit = async () => {
  isLoading.value = true
  //判断目的地
  if(!formData.city){
   showToast('请选择目的地')
   return
  }
  //判断预算
  if(!formData.budget || formData.budget<=100){
   showToast('请输入大于100元的预算，不能小于100元')
   return
  }
  //判断行程天数
  if(!formData.days || formData.days<1 || formData.days>30){
   showToast('请输入行程天数，不能小于1天或大于30天')
   return
  }
  router.push({
    path:'/detail',
    //让url携带city目的地，budget预算，days行程天数参数
    query:{
      city:formData.city,
      budget:formData.budget,
      days:formData.days
    }
  })
}
const goPage = (path) => {
  router.push(path)
}
const selectedCity = (city) => {
  formData.city = city
  showCityPicker.value = false
}
</script>
<style scoped>
.search-card {
  margin-bottom: 16px;
}
.city-tag {
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #f7f8fa;
  color: #666;
  transition: all 0.3s;
  font-size: 14px;
}
.active {
  background-color: #007AFF;
  color: #fff;
}

</style>
