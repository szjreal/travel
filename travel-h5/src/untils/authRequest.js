import axios from 'axios'
import { showToast } from 'vant'
import router from '@/router'

// 1. 创建 axios 实例，baseURL 指向 /api（不带 /travel）
const authRequest = axios.create({
  baseURL: 'http://127.0.0.1:3300/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 2. 请求拦截器：自动在请求头里带 token
authRequest.interceptors.request.use(
  config => {
    // 从 localStorage 拿 token
    const token = localStorage.getItem('token')
    // 如果有 token，加到请求头里
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器：统一处理错误
authRequest.interceptors.response.use(
  response => {
    // 后端返回 { code: 0, data: ... }
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
export function post(url, data) {
  return authRequest.post(url, data)
}

export function get(url, params) {
  return authRequest.get(url, { params })
}