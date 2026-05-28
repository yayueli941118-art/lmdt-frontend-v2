<template>
  <div class="macro-lab">
    <!-- ===== 顶部 Banner ===== -->
    <header class="banner">
      <div class="banner-left">
        <h1>🌍 宏观政策实验室</h1>
        <span class="banner-sub">Macro Lab · Beveridge Curve</span>
      </div>
      <div class="banner-right">
        西南交通大学希望学院 · 黎雅月
      </div>
    </header>

    <!-- ===== 主体 ===== -->
    <div class="main-grid">
      <!-- 左侧：市长控制台 -->
      <aside class="control-panel">
        <div class="panel-card">
          <h3>⚙️ 市长控制台</h3>

          <div class="param-group">
            <label>🤖 AI 替代冲击 <span class="param-val">{{ params.ai_risk }}%</span></label>
            <input type="range" min="0" max="100" v-model.number="params.ai_risk" class="slider" />
          </div>

          <div class="param-group">
            <label>🔧 技能错配度 <span class="param-val">{{ params.mismatch_index }}</span></label>
            <input type="range" min="0" max="2" step="0.1" v-model.number="params.mismatch_index" class="slider" />
          </div>

          <div class="param-group">
            <label class="section-label">📋 政策工具箱</label>
            <div class="policy-grid">
              <label class="policy-item" :class="{ active: policySet.has('最低工资调整') }">
                <input type="checkbox" value="最低工资调整" v-model="policySetModel" />
                💰 最低工资
              </label>
              <label class="policy-item" :class="{ active: policySet.has('失业救济金') }">
                <input type="checkbox" value="失业救济金" v-model="policySetModel" />
                🛡️ 救济金
              </label>
              <label class="policy-item highlight" :class="{ active: policySet.has('技能重塑补贴') }">
                <input type="checkbox" value="技能重塑补贴" v-model="policySetModel" />
                🚀 技能重塑
              </label>
            </div>
          </div>

          <div class="diagnosis-box" :class="`diag-${diagnosisLevel}`">
            <div class="diag-label">{{ diagnosisLabel }}</div>
            <div class="diag-text">{{ diagnosisText }}</div>
          </div>
        </div>
      </aside>

      <!-- 右侧：ECharts 图表 -->
      <main class="chart-area">
        <div class="chart-card">
          <v-chart :option="chartOption" autoresize class="chart" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import axios from 'axios'

// 注册 echarts 组件
VChart.registerECharts(echarts)

// ==========================================
// 状态
// ==========================================
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const params = ref({
  ai_risk: 30,
  mismatch_index: 0.8,
})

const policySet = ref(new Set())
const policySetModel = ref([])

// 双向同步 checkbox ↔ Set
watch(policySetModel, (vals) => {
  policySet.value = new Set(vals)
})

const response = ref(null)
const loading = ref(false)
let debounceTimer = null

// ==========================================
// 防抖 API 调用
// ==========================================
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchSimulate, 300)
}

async function fetchSimulate() {
  loading.value = true
  try {
    const { data } = await axios.post(`${API_BASE}/api/v1/macro-lab/simulate`, {
      ai_risk: params.value.ai_risk,
      mismatch_index: params.value.mismatch_index,
      active_policies: [...policySet.value],
    })
    response.value = data
  } catch (err) {
    console.error('API 调用失败:', err.message)
  } finally {
    loading.value = false
  }
}

// 监听参数变化
watch([() => params.value.ai_risk, () => params.value.mismatch_index, policySet], debouncedFetch, { deep: true })

onMounted(fetchSimulate)

// ==========================================
// ECharts 配置
// ==========================================
const chartOption = computed(() => {
  if (!response.value) return {}

  const { curve_points, u_current, v_current, u_natural } = response.value

  // 理想基准曲线 (k=20)
  const idealPoints = []
  for (let u = 0.5; u <= 14; u += 0.27) {
    idealPoints.push({ value: [u, +(20 / u).toFixed(3)] })
  }

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDurationUpdate: 800,
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#64748b' } },
    },
    legend: {
      data: ['理想高效市场', '当前贝弗里奇曲线', '当前决策点', '自然失业率'],
      bottom: 0,
      textStyle: { color: '#94a3b8' },
    },
    grid: { left: '5%', right: '5%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '失业率 U (%)',
      min: 0,
      max: 15,
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      name: '职位空缺率 V (%)',
      min: 0,
      max: 35,
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
      axisLabel: { color: '#94a3b8' },
    },
    series: [
      {
        name: '理想高效市场',
        type: 'line',
        data: idealPoints,
        lineStyle: { color: '#475569', type: 'dashed', width: 1.5 },
        symbol: 'none',
      },
      {
        name: '当前贝弗里奇曲线',
        type: 'line',
        data: curve_points.map(p => ({ value: [p.u, p.v] })),
        smooth: true,
        lineStyle: {
          color: '#6366f1',
          width: 3,
          shadowBlur: 15,
          shadowColor: 'rgba(99, 102, 241, 0.8)',
        },
        symbol: 'none',
      },
      {
        name: '当前决策点',
        type: 'effectScatter',
        data: [{ value: [u_current, v_current] }],
        symbolSize: 16,
        showEffectOn: 'render',
        rippleEffect: { scale: 5, period: 4, brushType: 'stroke' },
        itemStyle: {
          color: '#ef4444',
          shadowBlur: 10,
          shadowColor: 'rgba(239, 68, 68, 0.6)',
        },
        label: {
          show: true,
          formatter: '📍',
          position: 'top',
          color: '#ef4444',
          fontSize: 18,
        },
      },
      {
        name: '自然失业率',
        type: 'effectScatter',
        data: [{ value: [u_natural, 2.5] }],
        symbolSize: 14,
        rippleEffect: { scale: 3, period: 5, brushType: 'stroke' },
        itemStyle: { color: '#10b981' },
        symbol: 'diamond',
        label: {
          show: true,
          formatter: '自然率',
          position: 'bottom',
          color: '#10b981',
          fontSize: 11,
        },
      },
    ],
  }
})

// ==========================================
// 诊断状态映射
// ==========================================
const diagnosisLevel = computed(() => response.value?.diagnosis_level || 'SAFE')
const diagnosisText = computed(() => response.value?.diagnosis_text || '正在加载...')

const diagnosisLabel = computed(() => {
  const map = { SAFE: '✅ 运行正常', WARNING: '⚠️ 预警', DANGER: '🚨 危险', SUCCESS: '🚀 政策奏效' }
  return map[diagnosisLevel.value] || '...'
})
</script>

<style scoped>
.macro-lab {
  min-height: 100vh;
  background: #0b0f19;
}

.banner {
  background: linear-gradient(135deg, #4c1d95 0%, #6366f1 100%);
  color: white;
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}
.banner h1 { font-size: 20px; font-weight: 800; }
.banner-sub { font-size: 13px; opacity: 0.8; display: block; margin-top: 2px; }
.banner-right { font-size: 13px; opacity: 0.7; padding: 4px 14px; background: rgba(255,255,255,0.12); border-radius: 16px; }

.main-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 0;
  height: calc(100vh - 72px);
}

.control-panel {
  background: #0f1420;
  border-right: 1px solid rgba(99, 102, 241, 0.1);
  overflow-y: auto;
  padding: 20px;
}

.panel-card h3 {
  color: #e2e8f0;
  font-size: 18px;
  margin-bottom: 20px;
  border-left: 3px solid #6366f1;
  padding-left: 10px;
}

.param-group {
  margin-bottom: 22px;
}
.param-group label {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 6px;
}
.param-val {
  color: #6366f1;
  font-weight: 700;
  font-size: 16px;
}
.section-label {
  color: #cbd5e1 !important;
  font-weight: 600;
  margin-bottom: 8px;
}

.slider {
  width: 100%;
  accent-color: #6366f1;
  height: 6px;
}

.policy-grid { display: flex; flex-direction: column; gap: 8px; }
.policy-item {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.15);
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}
.policy-item:hover { border-color: rgba(99, 102, 241, 0.4); }
.policy-item.active { background: rgba(99, 102, 241, 0.15); border-color: #6366f1; color: #e2e8f0; }
.policy-item:not(.active) input { opacity: 0.4; }

.diagnosis-box {
  margin-top: 20px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.5s;
}
.diag-SAFE { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); }
.diag-WARNING { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.3); }
.diag-DANGER { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
.diag-SUCCESS { background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.3); }
.diag-label { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.diag-SAFE .diag-label { color: #10b981; }
.diag-WARNING .diag-label { color: #f59e0b; }
.diag-DANGER .diag-label { color: #ef4444; }
.diag-SUCCESS .diag-label { color: #818cf8; }
.diag-text { font-size: 13px; color: #94a3b8; line-height: 1.5; }

.chart-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.chart-card {
  width: 100%;
  height: 100%;
  background: rgba(15, 20, 32, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  padding: 20px;
}
.chart { width: 100%; height: 100%; }
</style>
