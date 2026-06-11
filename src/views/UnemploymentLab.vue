<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>📉 失业经济学</h1>
      <p>摩擦性/结构性/周期性失业分解 · 自然失业率 · 最低工资冲击 · 贝弗里奇曲线</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>自然失业率 <span class="val">{{ naturalRate }}%</span></label>
        <input type="range" v-model.number="naturalRate" min="3" max="8" step="0.5">
      </div>
      <div class="control-group">
        <label>最低工资 <span class="val">{{ minWage }}元/h</span></label>
        <input type="range" v-model.number="minWage" min="15" max="60" step="1">
      </div>
      <div class="control-group">
        <label>失业救济 <span class="val">{{ benefit }}元/月</span></label>
        <input type="range" v-model.number="benefit" min="1000" max="6000" step="200">
      </div>
      <div class="control-group">
        <label>技能错配 <span class="val">{{ mismatch }}</span></label>
        <input type="range" v-model.number="mismatch" min="0" max="2" step="0.1">
      </div>
      <div class="control-group">
        <label>AI冲击 <span class="val">{{ aiRisk }}%</span></label>
        <input type="range" v-model.number="aiRisk" min="0" max="100" step="5">
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '…' : '▶ 失业率模拟' }}
      </button>
    </div>

    <div v-if="result" class="lab-results">
      <div class="cards-row">
        <div class="stat-card" v-for="(v,k) in result.breakdown" :key="k">
          <span class="stat-label">{{ {frictional:'摩擦性',structural:'结构性',minimum_wage_effect:'最低工资',technological:'技术性',cyclical:'周期性'}[k] || k }}</span>
          <span class="stat-val">{{ v }}%</span>
        </div>
      </div>

      <div class="chart-card">
        <h3>失业率动态收敛 (48个月)</h3>
        <v-chart :option="uChart" autoresize style="height:280px" />
      </div>

      <!-- 最低工资冲击 -->
      <div class="section-divider"><span>⚡ 最低工资冲击分析</span></div>
      <div class="lab-controls">
        <div class="control-group">
          <label>平均工资 <span class="val">{{ avgWage }}元/h</span></label>
          <input type="range" v-model.number="avgWage" min="20" max="150" step="2">
        </div>
        <div class="control-group">
          <label>就业人数 <span class="val">{{ employment }}万</span></label>
          <input type="range" v-model.number="employment" min="100" max="5000" step="50">
        </div>
        <button class="btn-run" style="background:linear-gradient(135deg,#ef4444,#dc2626)" @click="runMinWage" :disabled="loading2">
          {{ loading2 ? '…' : '▶ 冲击分析' }}
        </button>
      </div>

      <div v-if="mwResult" class="cards-row">
        <div class="stat-card">
          <span class="stat-label">Kaitz指数</span>
          <span class="stat-val">{{ mwResult.kaitz_index }}</span>
        </div>
        <div class="stat-card" :class="mwResult.employment_change_pct < 0 ? 'warn' : ''">
          <span class="stat-label">就业变化</span>
          <span class="stat-val">{{ mwResult.employment_change_pct > 0 ? '+' : '' }}{{ mwResult.employment_change_pct }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">受影响工人</span>
          <span class="stat-val">{{ mwResult.affected_worker_pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const naturalRate = ref(5); const minWage = ref(28); const benefit = ref(2500); const mismatch = ref(0.8); const aiRisk = ref(30)
const loading = ref(false); const result = ref(null)
const avgWage = ref(54); const employment = ref(870)
const loading2 = ref(false); const mwResult = ref(null)

const uChart = computed(() => {
  if (!result.value) return {}
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { name: '月', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, data: result.value.time_series.months.map(String) },
    yAxis: { name: '失业率%', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'line', data: result.value.time_series.unemployment_rate, lineStyle: { color: '#ef4444', width: 2 }, areaStyle: { color: 'rgba(239,68,68,0.1)' }, symbol: 'none' }]
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(`${API}/api/v2/macro/unemployment`, {
      natural_rate: naturalRate.value, min_wage: minWage.value,
      unemployment_benefit: benefit.value, skill_mismatch: mismatch.value,
      ai_risk: aiRisk.value, labor_demand_shock: 0
    })
    result.value = data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}

async function runMinWage() {
  loading2.value = true
  try {
    const { data } = await axios.post(`${API}/api/v2/macro/min-wage-impact`, {
      min_wage: minWage.value, avg_wage: avgWage.value, employment: employment.value
    })
    mwResult.value = data
  } catch(e) { console.error(e) }
  finally { loading2.value = false }
}
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }
.lab-controls { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 100px; }
.control-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.control-group label .val { color: #ef4444; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.btn-run { padding: 10px 24px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(239,68,68,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }
.cards-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 12px; text-align: center; }
.stat-card.warn { border-color: rgba(239,68,68,0.3); }
.stat-label { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; }
.stat-val { font-size: 20px; font-weight: 900; color: #f1f5f9; display: block; }
.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }
.section-divider { display: flex; align-items: center; gap: 16px; margin: 36px 0 20px; color: #94a3b8; font-size: 15px; font-weight: 700; }
.section-divider::after { content: ''; flex: 1; height: 1px; background: rgba(148,163,184,0.08); }
@media (max-width: 768px) { .cards-row { grid-template-columns: repeat(2, 1fr); } }
</style>
