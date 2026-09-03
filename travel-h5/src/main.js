import { createApp } from 'vue'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'
//引入vant组件
import vant from 'vant'
import './style/common.css'

createApp(App).use(router).use(vant).mount('#app')
