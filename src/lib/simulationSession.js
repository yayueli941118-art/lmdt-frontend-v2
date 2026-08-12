import { ref } from 'vue'

function errorMessage(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  return '当前情景计算失败，请检查参数后重试。'
}

export function useSimulationSession({ clearResult } = {}) {
  const loading = ref(false)
  const error = ref('')
  let sequence = 0

  async function runLatest(request, commit) {
    const requestId = ++sequence
    loading.value = true
    error.value = ''
    try {
      const value = await request()
      if (requestId !== sequence) return false
      await commit(value)
      return true
    } catch (cause) {
      if (requestId !== sequence) return false
      error.value = errorMessage(cause)
      clearResult?.()
      return false
    } finally {
      if (requestId === sequence) loading.value = false
    }
  }

  function cancel() {
    sequence += 1
    loading.value = false
  }

  return { loading, error, runLatest, cancel }
}
