import axios from 'axios'
import { showToast } from 'vant'
import router from '@/router'

// 1. 创建 axios 实例，baseURL 指向 /api（不带 /travel）
// ② axios 发真实 HTTP 请求                        
//  POST http://127.0.0.1:3300/api/auth/login      
//  Body: { username, password }  
//这一步axios自动把前端的url拼接上去 
const authRequest = axios.create({
  baseURL: 'http://127.0.0.1:3300/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 2. 请求拦截器：用来发送请求前，选择是否带 token，然后发给后端
//interceptors是拦截器集合，包含request拦截器和response拦截器
//use(fn1, fn2) —— 注册拦截函数
//fn1 是成功回调，fn2 是失败回调
//config 就是快递单（包含 url、method、headers、data 等）
//有token就加到请求头里，没有就直接发送
authRequest.interceptors.request.use(
  config => {
    // 从 localStorage 拿 token
    const token = localStorage.getItem('token')
    // 如果有 token，加到请求头里
    //config.headers.Authorization = 'Bearer ' + token这句话意思是
    //往http请求的最后一行加上Authorization: Bearer + token 的组合
    //'Bearer '是固定前缀，token是jwt.sign得到的token(在guth.js#96)

    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },//fn2 是失败回调
  error => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器：统一处理错误
//接收后端返回的响应数据
//会包装成response对象
//response = {
//   data: { code: 0, token: "...", user: {...} },  // 后端真正返回的内容
//   status: 200,
//   statusText: "OK",
//   headers: {...},
//   config: {...}
// }
authRequest.interceptors.response.use(
  response => {
    // 后端返回 { code: 0, token: "...", user: {...} }
    return response.data
  },
  error => {
    // 如果是 401（未登录或 token 过期）
    if (error.response?.status === 401) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

// 4. 封装请求方法
//authRequest 是 axios创建出来的实例
//自带post和get方法，直接调用即可
//返回值：Promise 对象，解析出后端返回的 JSON 数据
//上面post是自己封装的，下面post是axios自带的
export function post(url, data) {
  //data部分，调用axios自带的post方法，自动放进请求体body里
  //url部分，axios自动拼接到baseurl后面
  //后端用req.body 接收数据
  return authRequest.post(url, data)
}

export function get(url, params) {
  //调用axios自带的get方法，把params拼到 URL 的 ? 后面
  //后端用req.query 接收数据
  return authRequest.get(url, { params })
}