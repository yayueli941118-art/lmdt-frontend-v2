<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>🚫 劳动力市场歧视</h1>
      <p>Oaxaca-Blinder 工资分解 · 三因素分解（禀赋/系数/交互） · 贝克尔偏见模型</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>歧视程度 <span class="val">{{ discPct }}%</span></label>
        <input type="range" v-model.number="discPct" min="5" max="50" step="1">
        <div class="hint">A组工资降低百分比</div>
      </div>
      <div class="control-group">
        <label>教育差距 <span class="val">{{ eduGap }}年</span></label>
        <input type="range" v-model.number="eduGap" min="0" max="6" step="0.5">
        <div class="hint">A组与B组的平均受教育年限差异</div>
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '计算中…' : '▶ 运行 Oaxaca-Blinder 分解' }}
      </button>
    </div>

    <div v-if="result" class="lab-results">
      <!-- 总览 -->
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">工资差距</span>
          <span class="stat-val">{{ result.decomposition.total_gap_pct }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">可解释部分</span>
          <span class="stat-val">{{ result.decomposition.explained_pct }}%</span>
        </div>
        <div class="stat-card warn">
          <span class="stat-label">不可解释（歧视）</span>
          <span class="stat-val">{{ result.decomposition.unexplained_pct }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">方向</span>
          <span class="stat-val">{{ result.decomposition.gap_direction }}</span>
        </div>
      </div>

      <!-- 分解柱状图 -->
      <div class="chart-card">
        <h3>工资差异分解（三因素）</h3>
        <v-chart :option="decompChart" autoresize style="height:300px" />
      </div>

      <!-- 按变量分解 -->
      <div class="chart-card">
        <h3>按变量逐项分解</h3>
        <v-chart :option="varChart" autoresize style="height:280px" />
      </div>

      <!-- 组对比 -->
      <div class="group-compare">
        <div class="group-card">
          <h4>A组（劣势组）</h4>
          <div class="group-stat">平均月薪: <strong>{{ result.group_a.mean_wage }}元</strong></div>
          <div class="group-stat">平均教育: <strong>{{ result.group_a.mean_edu }}年</strong></div>
          <div class="group-stat">平均工龄: <strong>{{ result.group_a.mean_exp }}年</strong></div>
        </div>
        <div class="vs-tag">VS</div>
        <div class="group-card">
          <h4>B组（优势组）</h4>
          <div class="group-stat">平均月薪: <strong>{{ result.group_b.mean_wage }}元</strong></div>
          <div class="group-stat">平均教育: <strong>{{ result.group_b.mean_edu }}年</strong></div>
          <div class="group-stat">平均工龄: <strong>{{ result.group_b.mean_exp }}年</strong></div>
        </div>
      </div>

      <!-- 系数 -->
      <div class="chart-card">
        <h3>明瑟方程系数对比</h3>
        <table class="coef-table">
          <thead><tr><th></th><th v-for="n in result.coefficients.coefficient_names" :key="n">{{ n }}</th><th>R²</th></tr></thead>
          <tbody>
            <tr><td>A组</td><td v-for="(c,i) in result.coefficients.group_a" :key="i">{{ c.toFixed(4) }}</td><td>{{ result.coefficients.r_squared_a }}</td></tr>
            <tr><td>B组</td><td v-for="(c,i) in result.coefficients.group_b" :key="i">{{ c.toFixed(4) }}</td><td>{{ result.coefficients.r_squared_b }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const discPct = ref(20)
const eduGap = ref(2)
const loading = ref(false)
const result = ref(null)

const decompChart = computed(() => {
  if (!result.value) return {}
  const d = result.value.decomposition
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: ['禀赋效应', '系数效应', '交互效应'], axisLabel: { color: '#666' } },
    yAxis: { name: 'log wage gap', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'bar', data: [
        { value: d.endowment_effect, itemStyle: { color: '#06b6d4' } },
        { value: d.coefficient_effect, itemStyle: { color: '#ef4444' } },
        { value: d.interaction_effect, itemStyle: { color: '#8b5cf6' } }
      ],
    }]
  }
})

const varChart = computed(() => {
  if (!result.value) return {}
  const vars = result.value.by_variable.filter(v => v.variable !== '常数项')
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    legend: { textStyle: { color: '#666' }, data: ['禀赋', '系数', '交互'] },
    xAxis: { type: 'category', data: vars.map(v => v.variable), axisLabel: { color: '#666', fontSize: 11 } },
    yAxis: { nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [
      { name: '禀赋', type: 'bar', stack: 'x', data: vars.map(v => v.endowment), itemStyle: { color: '#06b6d4' } },
      { name: '系数', type: 'bar', stack: 'x', data: vars.map(v => v.coefficient), itemStyle: { color: '#ef4444' } },
      { name: '交互', type: 'bar', stack: 'x', data: vars.map(v => v.interaction), itemStyle: { color: '#8b5cf6' } },
    ]
  }
})

function generateData() {
  const n = 10
  const eduA = Array(n).fill(0).map(() => Math.round(12 + Math.random() * (16 - 12 - eduGap.value)))
  const eduB = Array(n).fill(0).map(() => Math.round(12 + Math.random() * (16 - 12 + eduGap.value * 0.5)))
  const expA = Array(n).fill(0).map(() => Math.round(3 + Math.random() * 15))
  const expB = Array(n).fill(0).map(() => Math.round(3 + Math.random() * 15))
  const baseA = 5000, baseB = 6000
  const wageA = eduA.map((e,i) => Math.round((baseA + e * 200 + expA[i] * 150) * (1 - discPct.value / 100)))
  const wageB = eduB.map((e,i) => Math.round(baseB + e * 350 + expB[i] * 200))
  return { group_a_wages: wageA, group_b_wages: wageB, group_a_edu: eduA, group_b_edu: eduB, group_a_exp: expA, group_b_exp: expB }
}

async function run() {
  loading.value = true
  try {
    const payload = generateData()
    const { data } = await axios.post(`${API}/api/v2/discrimination/decompose`, payload)
    result.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }

.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 180px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #ef4444; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.control-group .hint { font-size: 11px; color: #64748b; margin-top: 4px; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(239,68,68,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }

.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-card.warn { border-color: rgba(239,68,68,0.3); }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { font-size: 24px; font-weight: 900; color: #f1f5f9; display: block; }

.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }

.group-compare { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
.group-card { flex: 1; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; }
.group-card h4 { margin: 0 0 10px; font-size: 15px; color: #94a3b8; }
.group-stat { font-size: 13px; color: #94a3b8; padding: 3px 0; }
.group-stat strong { color: #e2e8f0; font-weight: 700; }
.vs-tag { font-size: 18px; color: #64748b; font-weight: 800; flex-shrink: 0; }

.coef-table { width: 100%; border-collapse: collapse; }
.coef-table th, .coef-table td { padding: 8px 12px; text-align: right; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(148,163,184,0.06); }
.coef-table th:first-child, .coef-table td:first-child { text-align: left; color: #3b82f6; font-weight: 700; }
@media (max-width: 768px) { .cards-row { grid-template-columns: repeat(2, 1fr); } .group-compare { flex-direction: column; } }
</style>
