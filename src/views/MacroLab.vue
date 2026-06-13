<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>🌍 宏观政策实验室</h1>
      <p>贝弗里奇曲线 · 结构性失业诊断 · AI 冲击 · 政策组合实验</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>AI冲击 <span class="val">{{ aiRisk }}%</span></label>
        <input type="range" v-model.number="aiRisk" min="0" max="100" step="5">
      </div>
      <div class="control-group">
        <label>技能错配指数 <span class="val">{{ mismatchIndex }}</span></label>
        <input type="range" v-model.number="mismatchIndex" min="0" max="2" step="0.1">
      </div>
      <div class="control-group">
        <label>激活政策</label>
        <div class="policy-checks">
          <label v-for="p in policies" :key="p.value" class="policy-check">
            <input type="checkbox" :value="p.value" v-model="activePolicies"> {{ p.label }}
          </label>
        </div>
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '实时更新中…' : '刷新贝弗里奇模拟' }}
      </button>
    </div>

    <div v-if="result" class="lab-results">
      <!-- 诊断卡 -->
      <div class="diagnosis-card" :class="'diag-' + result.diagnosis_level.toLowerCase()">
        <span class="diag-level">{{ result.diagnosis_level }}</span>
        <span class="diag-text">{{ result.diagnosis_text }}</span>
      </div>

      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">当前失业率</span>
          <span class="stat-val">{{ result.u_current }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">当前空缺率</span>
          <span class="stat-val">{{ result.v_current }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">自然失业率</span>
          <span class="stat-val">{{ result.u_natural }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">错配缺口</span>
          <span class="stat-val">{{ (result.u_current - result.u_natural).toFixed(1) }}%</span>
        </div>
      </div>

      <div class="chart-card">
        <h3>贝弗里奇曲线 (UV图)</h3>
        <v-chart :option="beveridgeChart" autoresize style="height:340px" />
      </div>

      <p class="policy-note">
        思考：贝弗里奇曲线外移时，问题往往不只是“岗位少”，还包括技能、地区和信息错配。就业优先政策的落点，可以具体化为培训补贴、公共就业服务和岗位信息平台。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])


const aiRisk = ref(30); const mismatchIndex = ref(0.5); const loading = ref(false); const result = ref(null)
const policies = [
  { value: '最低工资调整', label: '最低工资调整' },
  { value: '失业救济金', label: '失业救济金' },
  { value: '技能重塑补贴', label: '技能重塑补贴' },
]
const activePolicies = ref([])
let debounceTimer = null

const beveridgeChart = computed(() => {
  if (!result.value) return {}
  const pts = result.value.curve_points
  return {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 55 },
    xAxis: { name: '失业率 u (%)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    yAxis: { name: '空缺率 v (%)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'line', data: pts.map(p => [p.u, p.v]),
      smooth: true, lineStyle: { color: '#8b5cf6', width: 2 },
      areaStyle: { color: 'rgba(139,92,246,0.06)' }, symbol: 'none',
      markPoint: {
        data: [{ coord: [result.value.u_current, result.value.v_current], name: '当前', symbol: 'pin', symbolSize: 30, itemStyle: { color: '#ef4444' } }],
        label: { fontSize: 11 }
      }
    }]
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/macro/beveridge'), {
      ai_risk: aiRisk.value, mismatch_index: mismatchIndex.value, active_policies: activePolicies.value
    })
    result.value = data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}

function scheduleRun() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(run, 220)
}

watch([aiRisk, mismatchIndex, activePolicies], scheduleRun, { deep: true })
onMounted(run)
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }
.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 140px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #8b5cf6; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.policy-checks { display: flex; flex-direction: column; gap: 4px; }
.policy-check { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; cursor: pointer; }
.policy-check input { accent-color: #8b5cf6; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(139,92,246,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }
.diagnosis-card { padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
.diag-safe { background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); }
.diag-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
.diag-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
.diag-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }
.diag-level { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
.diag-safe .diag-level { background: rgba(6,182,212,0.2); color: #06b6d4; }
.diag-warning .diag-level { background: rgba(245,158,11,0.2); color: #f59e0b; }
.diag-danger .diag-level { background: rgba(239,68,68,0.2); color: #ef4444; }
.diag-success .diag-level { background: rgba(34,197,94,0.2); color: #22c55e; }
.diag-text { font-size: 13px; color: #94a3b8; }
.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { font-size: 22px; font-weight: 900; color: #f1f5f9; display: block; }
.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }
.policy-note { margin: -8px 0 24px; color: #94a3b8; font-size: 13px; line-height: 1.8; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.16); border-radius: 12px; padding: 14px 16px; }
@media (max-width: 768px) { .lab { padding: 28px 16px; } .lab-header h1 { font-size: 26px; } .lab-controls { display: grid; grid-template-columns: 1fr; } .diagnosis-card { align-items: flex-start; flex-direction: column; } .cards-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .cards-row { grid-template-columns: 1fr; } .chart-card { padding: 14px; } }
</style>
