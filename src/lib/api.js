import axios from 'axios'
import { reactive } from 'vue'
import { offlineResponse } from './offlineApi'

const requestedMode = String(import.meta.env.VITE_API_MODE || '').toLowerCase()
const validModes = new Set(['offline', 'online', 'auto'])

export const API_MODE = validModes.has(requestedMode)
  ? requestedMode
  : 'offline'

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:8000'
)

export const runtimeInfo = reactive({
  mode: API_MODE,
  source: API_MODE === 'offline' ? 'offline' : 'pending',
  label: API_MODE === 'offline' ? '离线教学模型' : '等待数据源',
})

function markRuntime(source) {
  runtimeInfo.source = source
  runtimeInfo.label = source === 'online'
    ? '在线计算服务'
    : source === 'offline-fallback'
      ? '离线教学模型（自动回退）'
      : '离线教学模型'
}

function offlineAdapter(config) {
  const data = offlineResponse(config)
  if (data === null) {
    return Promise.reject(new Error(`离线教学模型未实现接口：${config.url}`))
  }
  markRuntime('offline')
  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: null,
  })
}

export function apiUrl(path) {
  const base = API_BASE.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

axios.interceptors.request.use(config => {
  if (API_MODE === 'offline') config.adapter = offlineAdapter
  return config
})

axios.interceptors.response.use(
  response => {
    if (API_MODE !== 'offline') markRuntime('online')
    return response
  },
  error => {
    if (API_MODE !== 'auto') return Promise.reject(error)
    const fallback = offlineResponse(error.config)
    if (fallback) {
      markRuntime('offline-fallback')
      return Promise.resolve({
        data: fallback,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
        request: error.request,
      })
    }
    return Promise.reject(error)
  },
)
