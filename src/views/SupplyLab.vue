<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>劳动供给决策</h1>
      <p>把教材中的预算线、无差异曲线、收入效应、替代效应和向后弯曲劳动供给曲线做成可操作动态图。</p>
    </div>

    <LabDashboardLayout>
      <template #controls>
        <div class="lab-controls">
          <div class="control-group wide">
            <label>教材图模式</label>
            <select v-model="scenarioMode" @change="applyScenarioPreset">
              <option value="income">图2-9 非劳动收入增加</option>
              <option value="moreWork">图2-10 工资率上升，工作时数递增</option>
              <option value="lessWork">图2-11 工资率上升，工作时数递减</option>
            </select>
          </div>
          <div class="control-group">
            <label>初始工资率 W1 <span class="val">{{ wageInitial }} 元/小时</span></label>
            <input type="range" v-model.number="wageInitial" min="10" max="120" step="2">
          </div>
          <div class="control-group">
            <label>新工资率 W2 <span class="val">{{ wageNew }} 元/小时</span></label>
            <input type="range" v-model.number="wageNew" min="12" max="200" step="2">
          </div>
          <div class="control-group">
            <label>非劳动收入 <span class="val">{{ nonLaborIncome }} 元</span></label>
            <input type="range" v-model.number="nonLaborIncome" min="0" max="800" step="20">
          </div>
          <div class="control-group">
            <label>新增非劳动收入 ΔY <span class="val">{{ nonLaborShock }} 元</span></label>
            <input type="range" v-model.number="nonLaborShock" min="0" max="900" step="20">
          </div>
          <div class="control-group">
            <label>闲暇偏好 β <span class="val">{{ beta.toFixed(2) }}</span></label>
            <input type="range" v-model.number="beta" min="0.15" max="0.85" step="0.01">
            <div class="hint">β 越大，越重视闲暇；无差异曲线更容易向右移动。</div>
          </div>
          <div class="control-group">
            <label>收入效应强度 <span class="val">{{ incomeEffectStrength.toFixed(2) }}</span></label>
            <input type="range" v-model.number="incomeEffectStrength" min="0" max="1" step="0.01">
            <div class="hint">越高越容易出现图2-11的工作时数递减。</div>
          </div>
          <button class="btn-run" type="button" @click="run" :disabled="loading">
            {{ loading ? '实时更新中...' : '刷新教材图' }}
          </button>
        </div>
      </template>

      <template #task>
        <LearningTaskCard
          task="先观察预算线如何移动，再观察均衡点如何从 A 移到 B、C 或 Z，最后判断工作时数为什么变化。"
          observe="重点看工资率变化时预算线是旋转，非劳动收入增加时预算线是平行上移；再比较替代效应和收入效应谁更强。"
          :conclusion="supplyConclusion"
        />
      </template>

      <template #metrics>
        <div v-if="result" class="cards-row">
          <div class="stat-card">
            <span class="stat-label">初始工作时数</span>
            <span class="stat-val">{{ result.point_A.labor_hours }}h</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">新均衡工作时数</span>
            <span class="stat-val">{{ activeFinalPoint.labor_hours }}h</span>
          </div>
          <div class="stat-card" :class="{ warn: netChange < 0 }">
            <span class="stat-label">工作时数变化</span>
            <span class="stat-val" :class="netChange >= 0 ? 'up' : 'down'">{{ signed(netChange) }}h</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">当前教材结论</span>
            <span class="stat-val small">{{ scenarioLabel }}</span>
          </div>
        </div>
      </template>

      <template #primary>
        <div v-if="result" class="chart-card main-chart">
          <div class="chart-head">
            <div>
              <h3>教材动态图：预算线与无差异曲线</h3>
              <p>{{ scenarioExplanation }}</p>
            </div>
            <span>{{ scenarioFigure }}</span>
          </div>
          <v-chart :option="choiceChartOption" autoresize style="height:430px" />
        </div>
      </template>

      <template #secondary>
        <div v-if="result" class="lab-results">
          <section class="section-grid">
            <div class="chart-card">
              <h3>效应分解：从教材图读出工作时数变化</h3>
              <v-chart :option="effectChartOption" autoresize style="height:300px" />
            </div>
            <div class="explain-card">
              <h3>怎么读这张图</h3>
              <div class="read-row">
                <strong>A</strong>
                <span>原预算线与原无差异曲线相切，得到初始工作时数。</span>
              </div>
              <div class="read-row">
                <strong>B</strong>
                <span>补偿预算线上的中间点，用来单独观察替代效应。</span>
              </div>
              <div class="read-row">
                <strong>C / Z</strong>
                <span>C 表示工资变化后的新均衡，Z 表示非劳动收入增加后的新均衡。</span>
              </div>
              <p>{{ readingNote }}</p>
            </div>
          </section>

          <section class="section-grid">
            <div class="chart-card">
              <h3>劳动供给曲线：由一组教材均衡点生成</h3>
              <v-chart :option="supplyCurveOption" autoresize style="height:320px" />
            </div>
            <div class="point-stack">
              <div class="point-card">
                <span class="point-badge">A 原均衡</span>
                <div class="point-row"><span>闲暇</span><span>{{ result.point_A.leisure_hours }}h</span></div>
                <div class="point-row"><span>工作</span><span>{{ result.point_A.labor_hours }}h</span></div>
                <div class="point-row"><span>收入</span><span>{{ result.point_A.consumption }}元</span></div>
              </div>
              <div class="point-card dim">
                <span class="point-badge">B 替代效应点</span>
                <div class="point-row"><span>闲暇</span><span>{{ result.point_B.leisure_hours }}h</span></div>
                <div class="point-row"><span>工作</span><span>{{ result.point_B.labor_hours }}h</span></div>
                <div class="point-row"><span>收入</span><span>{{ result.point_B.consumption }}元</span></div>
              </div>
              <div class="point-card">
                <span class="point-badge">{{ scenarioMode === 'income' ? 'Z 收入平移后' : 'C 新均衡' }}</span>
                <div class="point-row"><span>闲暇</span><span>{{ activeFinalPoint.leisure_hours }}h</span></div>
                <div class="point-row"><span>工作</span><span>{{ activeFinalPoint.labor_hours }}h</span></div>
                <div class="point-row"><span>收入</span><span>{{ activeFinalPoint.consumption }}元</span></div>
              </div>
            </div>
          </section>

          <p class="policy-note">
            学习提示：这个实验不是记住“工资涨就一定多工作”，而是看清预算线、无差异曲线和均衡点如何共同决定劳动供给。工资率提高会同时产生替代效应和收入效应，非劳动收入增加则主要通过收入效应减少劳动供给。
          </p>
        </div>
      </template>
    </LabDashboardLayout>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import LabDashboardLayout from '../components/LabDashboardLayout.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const scenarioMode = ref('moreWork')
const wageInitial = ref(28)
const wageNew = ref(64)
const nonLaborIncome = ref(60)
const nonLaborShock = ref(160)
const beta = ref(0.3)
const incomeEffectStrength = ref(0.02)
const timeEndowment = ref(24)
const loading = ref(false)
const result = ref(null)
let debounceTimer = null

const scenarioFigure = computed(() => ({
  income: '对应图2-9',
  moreWork: '对应图2-10',
  lessWork: '对应图2-11',
}[scenarioMode.value]))

const scenarioLabel = computed(() => ({
  income: '收入效应',
  moreWork: '替代效应主导',
  lessWork: '收入效应主导',
}[scenarioMode.value]))

const activeFinalPoint = computed(() => {
  if (!result.value) return {}
  return scenarioMode.value === 'income' ? result.value.point_Z : result.value.point_C
})

const netChange = computed(() => {
  if (!result.value) return 0
  return Number((activeFinalPoint.value.labor_hours - result.value.point_A.labor_hours).toFixed(2))
})

const scenarioExplanation = computed(() => {
  if (!result.value) return ''
  if (scenarioMode.value === 'income') return result.value.textbook.income_shift
  if (scenarioMode.value === 'moreWork') return result.value.textbook.wage_increase_more_work
  return result.value.textbook.wage_increase_less_work
})

const supplyConclusion = computed(() => {
  if (!result.value) return ''
  if (scenarioMode.value === 'income') {
    return `非劳动收入增加 ${nonLaborShock.value} 元后，工作时数从 ${result.value.point_A.labor_hours}h 变为 ${result.value.point_Z.labor_hours}h，预算线平行上移，体现图2-9的收入效应。`
  }
  const direction = netChange.value >= 0 ? '增加' : '减少'
  return `工资率从 ${wageInitial.value} 元/小时提高到 ${wageNew.value} 元/小时，工作时数${direction} ${Math.abs(netChange.value)}h；当前为${result.value.effects.dominant_effect}。`
})

const readingNote = computed(() => {
  if (!result.value) return ''
  if (scenarioMode.value === 'income') {
    return `从 A 到 Z 的变化为 ${signed(result.value.effects.non_labor_income_effect_hours)}h，说明闲暇作为正常品时，非劳动收入上升会降低劳动供给。`
  }
  return `从 A 到 B 是替代效应 ${signed(result.value.effects.substitution_effect_hours)}h，从 B 到 C 是收入效应 ${signed(result.value.effects.income_effect_hours)}h，合计为 ${signed(result.value.effects.total_effect_hours)}h。`
})

function signed(value) {
  const n = Number(value || 0)
  return `${n > 0 ? '+' : ''}${Number(n.toFixed(2))}`
}

function applyScenarioPreset() {
  if (scenarioMode.value === 'income') {
    wageInitial.value = 36
    wageNew.value = 36
    nonLaborIncome.value = 80
    nonLaborShock.value = 220
    beta.value = 0.38
    incomeEffectStrength.value = 0.25
  } else if (scenarioMode.value === 'moreWork') {
    wageInitial.value = 28
    wageNew.value = 64
    nonLaborIncome.value = 60
    nonLaborShock.value = 120
    beta.value = 0.3
    incomeEffectStrength.value = 0.02
  } else {
    wageInitial.value = 36
    wageNew.value = 116
    nonLaborIncome.value = 120
    nonLaborShock.value = 120
    beta.value = 0.42
    incomeEffectStrength.value = 0.9
  }
}

function budgetSeries(name, data, color, dashed = false) {
  return {
    name,
    type: 'line',
    data,
    symbol: 'none',
    lineStyle: { color, width: 2, type: dashed ? 'dashed' : 'solid' },
  }
}

function pointSeries(point, color) {
  return {
    name: point.label,
    type: 'scatter',
    data: [[point.leisure_hours, point.consumption]],
    symbolSize: 13,
    itemStyle: { color },
    label: { show: true, formatter: point.label, color: '#f8fafc', fontWeight: 800, position: 'top' },
  }
}

function indifferenceCurve(point, betaValue) {
  const utility = point.utility
  const maxIncome = Math.max(result.value.point_A.consumption, result.value.point_C.consumption, result.value.point_Z.consumption) * 1.3
  const data = []
  for (let x = 0.8; x <= timeEndowment.value; x += 0.35) {
    const y = (utility / (x ** betaValue)) ** (1 / (1 - betaValue))
    if (Number.isFinite(y) && y <= maxIncome) data.push([Number(x.toFixed(2)), Number(y.toFixed(2))])
  }
  return data
}

const choiceChartOption = computed(() => {
  if (!result.value) return {}
  const lines = result.value.budget_lines
  const series = [
    budgetSeries('AB 原预算线', lines.initial, '#38bdf8'),
  ]
  if (scenarioMode.value === 'income') {
    series.push(budgetSeries('CD 非劳动收入增加后', lines.non_labor, '#22c55e'))
    series.push(pointSeries(result.value.point_A, '#f59e0b'), pointSeries(result.value.point_Z, '#22c55e'))
  } else {
    series.push(budgetSeries('AC 新工资率预算线', lines.new_wage, '#22c55e'))
    series.push(budgetSeries('补偿预算线', lines.compensated, '#94a3b8', true))
    series.push(pointSeries(result.value.point_A, '#f59e0b'), pointSeries(result.value.point_B, '#a78bfa'), pointSeries(result.value.point_C, '#22c55e'))
  }
  series.push(
    { name: 'I1 原无差异曲线', type: 'line', data: indifferenceCurve(result.value.point_A, beta.value), symbol: 'none', smooth: true, lineStyle: { color: '#f97316', width: 2 } },
    { name: 'I2 新无差异曲线', type: 'line', data: indifferenceCurve(activeFinalPoint.value, beta.value), symbol: 'none', smooth: true, lineStyle: { color: '#eab308', width: 2 } },
  )
  return {
    backgroundColor: 'transparent',
    color: ['#38bdf8', '#22c55e', '#94a3b8', '#f59e0b'],
    legend: { top: 0, textStyle: { color: '#94a3b8' } },
    tooltip: { trigger: 'axis' },
    grid: { top: 46, right: 24, bottom: 44, left: 62 },
    xAxis: {
      name: '闲暇时间 L（小时，越往右工作越少）',
      min: 0,
      max: timeEndowment.value,
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } },
    },
    yAxis: {
      name: '收入 Y（元）',
      min: 0,
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } },
    },
    series,
  }
})

const effectChartOption = computed(() => {
  if (!result.value) return {}
  const e = result.value.effects
  const data = scenarioMode.value === 'income'
    ? [{ name: '非劳动收入效应', value: e.non_labor_income_effect_hours }]
    : [
        { name: '替代效应 A→B', value: e.substitution_effect_hours },
        { name: '收入效应 B→C', value: e.income_effect_hours },
        { name: '总效应 A→C', value: e.total_effect_hours },
      ]
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 18, bottom: 36, left: 56 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#94a3b8' } },
    yAxis: { name: '工作时数变化', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: { color: params => params.value >= 0 ? '#06b6d4' : '#f59e0b', borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', color: '#e2e8f0', formatter: p => `${signed(p.value)}h` },
    }],
  }
})

const supplyCurveOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.supply_curve
  const markPoint = [
    { coord: [result.value.point_A.wage, result.value.point_A.labor_hours], name: 'A', symbol: 'circle', symbolSize: 10, itemStyle: { color: '#f59e0b' } },
    { coord: [result.value.point_C.wage, result.value.point_C.labor_hours], name: 'C', symbol: 'circle', symbolSize: 10, itemStyle: { color: '#22c55e' } },
  ]
  if (d.backward_bending_point) {
    markPoint.push({ coord: [d.backward_bending_point.wage, d.backward_bending_point.labor_hours], name: '拐点', symbol: 'pin', symbolSize: 36, itemStyle: { color: '#ef4444' } })
  }
  return {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 36, left: 54 },
    tooltip: { trigger: 'axis' },
    xAxis: { name: '工资率 W', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' } },
    yAxis: { name: '工作时数 H', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    series: [{
      name: '劳动供给',
      type: 'line',
      data: d.wages.map((w, i) => [w, d.labor_hours[i]]),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#3b82f6', width: 3 },
      areaStyle: { color: 'rgba(59,130,246,.1)' },
      markPoint: { data: markPoint, label: { color: '#fff', fontSize: 11 } },
    }],
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/supply/decompose'), {
      wage_initial: wageInitial.value,
      wage_new: wageNew.value,
      beta: beta.value,
      non_labor_income: nonLaborIncome.value,
      non_labor_shock: nonLaborShock.value,
      income_effect_strength: incomeEffectStrength.value,
      T: timeEndowment.value,
    })
    result.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function scheduleRun() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(run, 220)
}

watch([wageInitial, wageNew, beta, nonLaborIncome, nonLaborShock, incomeEffectStrength], scheduleRun)
onMounted(run)
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; transition: color .2s; }
.back-link:hover { color: #94a3b8; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; max-width: 880px; line-height: 1.7; }
.lab-controls { display: grid; gap: 14px; padding: 18px; background: rgba(30,41,59,.5); border: 1px solid rgba(148,163,184,.1); border-radius: 16px; }
.control-group { min-width: 0; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #38bdf8; font-weight: 800; }
.control-group input[type="range"], .control-group select { width: 100%; }
.control-group select { padding: 9px 10px; border-radius: 8px; border: 1px solid rgba(148,163,184,.2); background: #1e293b; color: #e2e8f0; }
.hint { margin-top: 4px; font-size: 11px; line-height: 1.5; color: #64748b; }
.btn-run { padding: 12px 18px; border: none; border-radius: 10px; background: linear-gradient(135deg,#3b82f6,#2563eb); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; }
.btn-run:disabled { opacity: .55; cursor: not-allowed; }
.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card, .chart-card, .explain-card, .point-card { background: rgba(30,41,59,.5); border: 1px solid rgba(148,163,184,.1); border-radius: 14px; }
.stat-card { padding: 15px; text-align: center; }
.stat-card.warn { border-color: rgba(245,158,11,.35); }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { display: block; font-size: 23px; line-height: 1.15; font-weight: 900; color: #f1f5f9; }
.stat-val.small { font-size: 15px; color: #cbd5e1; }
.stat-val.up { color: #06b6d4; }
.stat-val.down { color: #f59e0b; }
.chart-card { padding: 18px; min-width: 0; }
.main-chart { overflow: hidden; }
.chart-card h3, .explain-card h3 { margin: 0 0 10px; color: #cbd5e1; font-size: 15px; }
.chart-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 4px; }
.chart-head p { margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.7; }
.chart-head span { flex: 0 0 auto; color: #38bdf8; font-size: 12px; font-weight: 800; border: 1px solid rgba(56,189,248,.28); border-radius: 999px; padding: 5px 9px; }
.lab-results { display: grid; gap: 18px; }
.section-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr); gap: 16px; align-items: stretch; }
.explain-card { padding: 18px; }
.read-row { display: grid; grid-template-columns: 34px 1fr; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(148,163,184,.08); color: #94a3b8; font-size: 13px; line-height: 1.65; }
.read-row strong { color: #38bdf8; font-size: 16px; }
.explain-card p { margin: 14px 0 0; color: #e2e8f0; line-height: 1.7; font-size: 13px; }
.point-stack { display: grid; gap: 12px; }
.point-card { padding: 14px; }
.point-card.dim { opacity: .78; }
.point-badge { display: block; font-size: 12px; color: #38bdf8; font-weight: 800; margin-bottom: 8px; }
.point-row { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; color: #94a3b8; font-size: 13px; }
.point-row span:last-child { color: #f8fafc; font-weight: 700; }
.policy-note { margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.8; background: rgba(14,165,233,.08); border: 1px solid rgba(14,165,233,.16); border-radius: 12px; padding: 14px 16px; }
@media (max-width: 900px) {
  .section-grid { grid-template-columns: 1fr; }
  .cards-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .lab { padding: 28px 16px; }
  .lab-header h1 { font-size: 26px; }
  .cards-row { grid-template-columns: 1fr; }
  .chart-card, .explain-card { padding: 14px; }
  .chart-head { display: grid; }
}
</style>
