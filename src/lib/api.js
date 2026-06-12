import axios from 'axios'
import { offlineResponse } from './offlineApi'

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'

export function apiUrl(path) {
  const base = API_BASE.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

axios.interceptors.response.use(
  response => response,
  error => {
    const fallback = offlineResponse(error.config)
    if (fallback) {
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
