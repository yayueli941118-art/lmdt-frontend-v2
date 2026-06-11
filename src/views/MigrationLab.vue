<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>✈️ 劳动力流动 — 迁移决策仿真</h1>
      <p>NPV 迁移模型 · 配偶损失 · 家庭联合迁移 · 户籍制度壁垒</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>受教育年限 <span class="val">{{ edu }}</span></label>
        <input type="range" v-model.number="edu" min="9" max="22" step="1">
      </div>
      <div class="control-group">
        <label>预期工龄 <span class="val">{{ expPeak }}</span></label>
        <input type="range" v-model.number="expPeak" min="10" max="45" step="1">
      </div>
      <div class="control-group">
        <label>培训类型</label>
        <select v-model="trainType"><option>无培训</option><option>一般培训</option><option>特殊培训</option></select>
      </div>
      <div class="control-group">
        <label>歧视系数 <span class="val">{{ disc }}%</span></label>
        <input type="range" v-model.number="disc" min="0" max="40" step="1">
      </div>
    </div>
    <div class="lab-controls">
      <div class="control-group">
        <label>迁移年龄 <span class="val">{{ migrateAge }}</span></label>
        <input type="range" v-model.number="migrateAge" min="22" max="50" step="1">
      </div>
      <div class="control-group">
        <label>工资差 <span class="val">{{ wDiff }}元</span></label>
        <input type="range" v-model.number="wDiff" min="500" max="15000" step="500">
      </div>
      <div class="control-group">
        <label>搬迁成本 <span class="val">{{ cMove }}元</span></label>
        <input type="range" v-model.number="cMove" min="5000" max="100000" step="5000">
      </div>
      <div class="control-group">
        <label><input type="checkbox" v-model="familyMigrate"> 家庭联合迁移</label>
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '计算中…' : '▶ 模拟 NPV 迁移' }}
      </button>
    </div>

    <div v-if="result" class="lab-results">
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">终身溢价</span>
          <span class="stat-val">{{ result.metrics?.lifetime_premium_pct }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">回本年龄</span>
          <span class="stat-val">{{ result.metrics?.breakeven_age ?? '未回本' }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">IRR</span>
          <span class="stat-val">{{ result.metrics?.irr_pct }}%</span>
        </div>
        <div class="stat-card" :class="result.migration?.is_worth_it ? '' : 'warn'">
          <span class="stat-label">迁移决策</span>
          <span class="stat-val">{{ result.migration?.is_worth_it ? '✅ 值得' : '❌ 不值得' }}</span>
        </div>
      </div>

      <div class="chart-card">
        <h3>终身工资曲线</h3>
        <v-chart :option="wageChart" autoresize style="height:300px" />
      </div>

      <div v-if="result.migration?.is_calculated" class="chart-card">
        <h3>迁移累计 NPV</h3>
        <v-chart :option="npvChart" autoresize style="height:260px" />
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
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const edu = ref(16); const expPeak = ref(30); const trainType = ref('一般培训'); const disc = ref(10)
const migrateAge = ref(25); const wDiff = ref(3000); const cMove = ref(20000); const familyMigrate = ref(false)
const loading = ref(false); const result = ref(null)

const wageChart = computed(() => {
  if (!result.value) return {}
  const d = result.value
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    legend: { textStyle: { color: '#666' }, data: ['基准(高中)', '教育投资', '歧视后'] },
    xAxis: { name: '年龄', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, data: d.charts?.age_years || [] },
    yAxis: { name: '工资/年', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [
      { name: '基准(高中)', type: 'line', data: d.charts?.wage_curve_baseline || [], lineStyle: { color: '#64748b', width: 1.5 }, symbol: 'none' },
      { name: '教育投资', type: 'line', data: d.charts?.wage_curve_selected_gross || [], lineStyle: { color: '#06b6d4', width: 2 }, symbol: 'none', areaStyle: { color: 'rgba(6,182,212,0.06)' } },
      { name: '歧视后', type: 'line', data: d.charts?.wage_curve_disc || [], lineStyle: { color: '#ef4444', width: 1.5, type: 'dashed' }, symbol: 'none' },
    ]
  }
})

const npvChart = computed(() => {
  if (!result.value?.migration?.years) return {}
  const m = result.value.migration
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { name: '年龄', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, data: m.years || [] },
    yAxis: { name: '累计NPV(元)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'line', data: m.cumulative_npv || [], lineStyle: { color: '#f59e0b', width: 2 }, areaStyle: { color: m.is_worth_it ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.06)' }, symbol: 'none' }]
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(`${API}/api/v2/micro/simulate`, {
      edu: edu.value, exp_peak: expPeak.value, train_type: trainType.value,
      disc: disc.value, migrate: true, migrate_age: migrateAge.value,
      w_diff: wDiff.value, c_move: cMove.value, c_psych: 3000,
      family_migrate: familyMigrate.value, spouse_loss: 3.0
    })
    result.value = data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }
.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 120px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #8b5cf6; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.control-group select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.2); background: #1e293b; color: #e2e8f0; font-size: 13px; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(139,92,246,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }
.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-card.warn { border-color: rgba(239,68,68,0.3); }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { font-size: 22px; font-weight: 900; color: #f1f5f9; display: block; }
.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }
@media (max-width: 768px) { .cards-row { grid-template-columns: repeat(2, 1fr); } }
</style>
