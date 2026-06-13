<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>🏭 企业市场实验室</h1>
      <p>CES 劳动需求曲线 · 希克斯-马歇尔派生需求定律 · 替代弹性对就业的影响</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>资本存量 K <span class="val">{{ K }}</span></label>
        <input type="range" v-model.number="K" min="100" max="3000" step="50">
      </div>
      <div class="control-group">
        <label>替代弹性 σ <span class="val">{{ sigma }}</span></label>
        <input type="range" v-model.number="sigma" min="0.3" max="3" step="0.1">
        <div class="hint">σ>1 劳动易替代 · σ<1 劳动难替代</div>
      </div>
      <div class="control-group">
        <label>技术类型</label>
        <select v-model="techType">
          <option>中性技术</option>
          <option>劳动替代型</option>
          <option>劳动互补型</option>
        </select>
      </div>
      <button class="btn-run" @click="runDemand" :disabled="loading">
        {{ loading ? '实时更新中…' : '刷新需求曲线' }}
      </button>
    </div>

    <div v-if="demandResult" class="lab-results">
      <div class="chart-card">
        <h3>劳动需求曲线 (VMP)</h3>
        <v-chart :option="demandChart" autoresize style="height:320px" />
      </div>

      <div class="cards-row">
        <div class="stat-card" v-for="eq in demandResult.equilibria.slice(0,4)" :key="eq.wage">
          <span class="stat-label">均衡点</span>
          <span class="stat-val">{{ eq.wage }}元/h</span>
          <span class="stat-sub">{{ eq.labor_hours }}人</span>
        </div>
      </div>
    </div>

    <!-- 要素配置 -->
    <div class="section-divider">
      <span>🏗️ 要素配置沙盘</span>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>劳动力 L <span class="val">{{ L }}</span></label>
        <input type="range" v-model.number="L" min="10" max="500" step="10">
      </div>
      <div class="control-group">
        <label>资本范围 <span class="val">100~{{ Kmax }}</span></label>
        <input type="range" v-model.number="Kmax" min="500" max="5000" step="100">
      </div>
      <button class="btn-run" style="background:linear-gradient(135deg,#06b6d4,#0891b2)" @click="runFactor" :disabled="loading2">
        {{ loading2 ? '实时更新中…' : '刷新要素配置' }}
      </button>
    </div>

    <div v-if="factorResult" class="lab-results">
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">最优 K/L 比</span>
          <span class="stat-val">{{ factorResult.optimal_k_l }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">最大产出</span>
          <span class="stat-val">{{ Math.max(...factorResult.output).toFixed(0) }}</span>
        </div>
      </div>
      <div class="chart-card">
        <h3>产出 & 边际产品 vs 资本投入</h3>
        <v-chart :option="factorChart" autoresize style="height:300px" />
      </div>

      <p class="policy-note">
        课堂追问：技术进步不只是“机器替代人”。当资本和劳动形成互补，企业的关键选择会转向岗位再设计、技能培训和人机协同，让效率提升转化为更高质量的就业。
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
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])


const K = ref(500); const sigma = ref(1.2); const techType = ref('中性技术'); const loading = ref(false)
const L = ref(100); const Kmax = ref(2000); const loading2 = ref(false)
const demandResult = ref(null); const factorResult = ref(null)
let demandTimer = null
let factorTimer = null

const demandChart = computed(() => {
  if (!demandResult.value) return {}
  const d = demandResult.value
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 30, bottom: 30, left: 60 },
    xAxis: { name: '劳动需求 (人)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    yAxis: { name: '工资率', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, inverse: true },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'line', data: d.labor_demand.map((ld, i) => [ld, d.wages[i]]),
      smooth: true, lineStyle: { color: '#3b82f6', width: 2 },
      areaStyle: { color: 'rgba(59,130,246,0.06)' },
      symbol: 'none'
    }]
  }
})

const factorChart = computed(() => {
  if (!factorResult.value) return {}
  const r = factorResult.value
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 60, bottom: 30, left: 50 },
    legend: { textStyle: { color: '#666' }, data: ['产出', 'MPL', 'MPK'] },
    xAxis: { name: '资本 K', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, data: r.capital.map(String) },
    yAxis: [{ type: 'value', name: '产出', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
            { type: 'value', name: '边际产品', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } }],
    tooltip: { trigger: 'axis' },
    series: [
      { name: '产出', type: 'bar', data: r.output, itemStyle: { color: 'rgba(59,130,246,0.3)' } },
      { name: 'MPL', type: 'line', yAxisIndex: 1, data: r.mpl, lineStyle: { color: '#06b6d4', width: 2 }, symbol: 'none' },
      { name: 'MPK', type: 'line', yAxisIndex: 1, data: r.mpk, lineStyle: { color: '#f59e0b', width: 2 }, symbol: 'none' },
    ]
  }
})

async function runDemand() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/demand/curve'), {
      K: K.value, sigma: sigma.value, prod_price: 1.0, tech_type: techType.value
    })
    demandResult.value = data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}

async function runFactor() {
  loading2.value = true
  try {
    const kv = Array.from({length: 20}, (_, i) => Math.round(100 + (Kmax.value - 100) * i / 19))
    const { data } = await axios.post(apiUrl('/api/v2/demand/factor-allocation'), {
      L: L.value, K_values: kv, sigma: sigma.value
    })
    factorResult.value = data
  } catch(e) { console.error(e) }
  finally { loading2.value = false }
}

function scheduleDemand() {
  clearTimeout(demandTimer)
  demandTimer = setTimeout(runDemand, 220)
}

function scheduleFactor() {
  clearTimeout(factorTimer)
  factorTimer = setTimeout(runFactor, 220)
}

watch([K, sigma, techType], scheduleDemand)
watch([L, Kmax, sigma], scheduleFactor)
onMounted(() => {
  runDemand()
  runFactor()
})
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }

.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 150px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #06b6d4; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.control-group select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.2); background: #1e293b; color: #e2e8f0; font-size: 13px; }
.control-group .hint { font-size: 11px; color: #64748b; margin-top: 4px; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(6,182,212,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }

.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
.stat-val { font-size: 22px; font-weight: 900; color: #f1f5f9; display: block; }
.stat-sub { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }

.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }

.section-divider { display: flex; align-items: center; gap: 16px; margin: 48px 0 24px; color: #94a3b8; font-size: 15px; font-weight: 700; }
.section-divider::after { content: ''; flex: 1; height: 1px; background: rgba(148,163,184,0.08); }
.policy-note { margin: -8px 0 24px; color: #94a3b8; font-size: 13px; line-height: 1.8; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.16); border-radius: 12px; padding: 14px 16px; }

@media (max-width: 768px) { .lab { padding: 28px 16px; } .lab-header h1 { font-size: 26px; } .lab-controls { display: grid; grid-template-columns: 1fr; } .cards-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .cards-row { grid-template-columns: 1fr; } .chart-card { padding: 14px; } }
</style>
