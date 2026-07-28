<template>
  <ExperimentWorkspace
      class="lab"
      :title="pageTitle"
      :subtitle="pageSubtitle"
      kicker="CH.03 · 劳动力需求"
      :chart-tabs="demandChartTabs"
      v-model:active-chart="activeTab"
      :change-key="[wageInitial, wageNew, productPrice, capital, sigma, productDemandElasticity, capitalFlexibility, laborCostShare, marketFeedback, techType]"
      @reset="resetDemand"
      formula="Q=A[αK^ρ+(1-α)L^ρ]^(1/ρ)，VMP=P×MPL，完全竞争下 VMP=W"
      assumptions="产品与要素市场完全竞争；短期资本固定，长期资本可调；生产函数规模报酬不变。"
      source="教材第三章图3-1至图3-7、图3-11。"
      scope="解释单个企业、市场反馈和长期要素调整下的派生劳动需求。"
      limitation="具体企业的真实招聘人数或行业预测。"
    >
      <template #controls>
        <div class="lab-controls">
          <p class="control-context">{{ activeControlHint }}</p>
          <div class="control-group">
            <label>初始工资 W0 <span class="val">{{ wageInitial }} 元/h</span></label>
            <input type="range" v-model.number="wageInitial" :min="demandWageRange.min" :max="demandWageRange.max" :step="demandWageRange.step">
          </div>
          <div class="control-group">
            <label>新工资 W1 <span class="val">{{ wageNew }} 元/h</span></label>
            <input type="range" v-model.number="wageNew" min="20" max="160" step="2">
          </div>
          <div class="control-group">
            <label>产品价格 P <span class="val">{{ productPrice.toFixed(2) }}</span></label>
            <input type="range" v-model.number="productPrice" min="0.6" max="1.8" step="0.05">
          </div>
          <div class="control-group">
            <label>资本存量 K <span class="val">{{ capital }}</span></label>
            <input type="range" v-model.number="capital" min="200" max="2200" step="50">
          </div>
          <div class="control-group">
            <label>劳动-资本替代弹性 σ <span class="val">{{ sigma.toFixed(2) }}</span></label>
            <input type="range" v-model.number="sigma" min="0.3" max="3" step="0.05">
            <div class="hint">σ 越高，长期调整时资本替代劳动越容易。</div>
          </div>
          <div v-if="activeTab !== 'short'" class="control-group">
            <label>产品需求弹性 <span class="val">{{ productDemandElasticity.toFixed(2) }}</span></label>
            <input type="range" v-model.number="productDemandElasticity" min="0.1" max="2.5" step="0.05">
          </div>
          <div v-if="activeTab === 'long' || activeTab === 'elasticity'" class="control-group">
            <label>资本调整能力 <span class="val">{{ capitalFlexibility.toFixed(2) }}</span></label>
            <input type="range" v-model.number="capitalFlexibility" min="0" max="1" step="0.05">
          </div>
          <div v-if="activeTab === 'long' || activeTab === 'elasticity'" class="control-group">
            <label>劳动成本占比 <span class="val">{{ laborCostShare.toFixed(2) }}</span></label>
            <input type="range" v-model.number="laborCostShare" min="0.05" max="0.9" step="0.05">
          </div>
          <div v-if="activeTab === 'market'" class="control-group">
            <label>市场反馈强度 <span class="val">{{ marketFeedback.toFixed(2) }}</span></label>
            <input type="range" v-model.number="marketFeedback" min="0" max="1" step="0.05">
          </div>
          <div class="control-group">
            <label>技术类型</label>
            <select v-model="techType">
              <option>中性技术</option>
              <option>劳动替代型</option>
              <option>劳动互补型</option>
            </select>
          </div>
          <button class="btn-run" type="button" @click="runDemand" :disabled="loading">
            {{ loading ? '实时更新中...' : '刷新劳动需求' }}
          </button>
          <button class="btn-reset" type="button" @click="resetDemand">恢复默认参数</button>
        </div>
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="企业劳动需求"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="demandConclusion"
          model-version="demand-ces-2.1"
          source-type="教材公式与教学情景参数"
        />
      </template>

      <template #task>
        <LearningTaskCard
          task="先看 VMP 曲线与工资线的交点，再比较单个企业、全市场和长期调整下的劳动需求变化。"
          observe="重点观察工资线移动、VMP 曲线位移，以及长期中替代效应和规模效应如何共同改变用工量。"
          :conclusion="demandConclusion"
        />
      </template>

      <template #metrics>
        <div v-if="result" class="cards-row">
          <div class="stat-card">
            <span class="stat-label">初始雇佣量</span>
            <span class="stat-val">{{ result.short_run.point_a.labor }}</span>
            <span class="stat-sub">A 点：VMP = W0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">短期雇佣量</span>
            <span class="stat-val">{{ result.short_run.point_b.labor }}</span>
            <span class="stat-sub">B 点：资本不变</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">长期雇佣量</span>
            <span class="stat-val">{{ result.long_run.point_c.labor }}</span>
            <span class="stat-sub">C 点：资本与产量调整</span>
          </div>
          <div class="stat-card" :class="{ warn: result.elasticity.long >= 1 }">
            <span class="stat-label">长期需求弹性</span>
            <span class="stat-val">{{ result.elasticity.long }}</span>
            <span class="stat-sub">{{ result.elasticity.label }}</span>
          </div>
        </div>
      </template>

      <template #primary>
        <div v-if="result" class="chart-card main-chart">
          <div class="chart-head">
            <div>
              <h3>{{ activeChartTitle }}</h3>
              <p>{{ activeExplanation }}</p>
            </div>
            <span>{{ activeFigure }}</span>
          </div>
          <v-chart class="workspace-chart-canvas" :option="activeChartOption" autoresize />
        </div>
      </template>

      <template #change>
        {{ activeChangeSummary }}
      </template>

      <template #analysis>
        <div v-if="result" class="lab-results">
          <section class="section-grid">
            <div class="explain-card">
              <h3>读图顺序</h3>
              <div class="read-row">
                <strong>1</strong>
                <span>先问“企业为什么招这个人数”：看 VMP 曲线和工资线交点。</span>
              </div>
              <div class="read-row">
                <strong>2</strong>
                <span>再问“全市场一起调整会怎样”：看产品价格反馈导致 VMP 曲线移动。</span>
              </div>
              <div class="read-row">
                <strong>3</strong>
                <span>最后问“长期为什么更敏感”：看资本替代劳动和产量规模变化。</span>
              </div>
              <p>{{ result.elasticity.diagnosis }}</p>
            </div>
            <div class="chart-card">
              <h3>弹性四因素诊断</h3>
              <v-chart :option="elasticityChartOption" autoresize style="height:300px" />
            </div>
          </section>

          <section class="section-grid">
            <div class="chart-card">
              <h3>短期需求曲线 vs 长期需求曲线</h3>
              <v-chart :option="shortLongChartOption" autoresize style="height:320px" />
            </div>
            <div class="point-stack">
              <div class="point-card">
                <span class="point-badge">短期规则</span>
                <div class="point-row"><span>判断标准</span><span>VMP = W</span></div>
                <div class="point-row"><span>资本</span><span>固定</span></div>
                <div class="point-row"><span>需求变化</span><span>{{ signed(result.short_run.point_b.labor - result.short_run.point_a.labor) }}</span></div>
              </div>
              <div class="point-card">
                <span class="point-badge">长期分解</span>
                <div class="point-row"><span>替代效应</span><span>{{ signed(result.long_run.substitution_effect) }}</span></div>
                <div class="point-row"><span>规模效应</span><span>{{ signed(result.long_run.scale_effect) }}</span></div>
                <div class="point-row"><span>总效应</span><span>{{ signed(result.long_run.total_effect) }}</span></div>
              </div>
            </div>
          </section>

          <p class="policy-note">
            学习提示：劳动需求不是“工资低就无限招人”。企业先比较边际产品价值和工资成本；市场层面还会受到产品价格反馈影响；长期中资本、技术和产量规模都会改变劳动需求弹性。
          </p>
        </div>
      </template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import { createRealtimeScheduler } from '../lib/realtime'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import { sliderRanges } from '../config/sliderRanges'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const route = useRoute()
const isFactorAllocation = computed(() => route.path === '/lab/factor-allocation')
const pageTitle = computed(() => isFactorAllocation.value ? '要素配置沙盘' : '企业劳动需求实验室')
const pageSubtitle = computed(() => isFactorAllocation.value
  ? '用等产量曲线、等成本线和 A→B→C 路径观察长期要素替代与规模效应。'
  : '把教材第三章的 VMP=W、市场调整、长期替代与规模效应、需求弹性做成可操作推导工具。')
const activeTab = ref(isFactorAllocation.value ? 'long' : 'short')
const demandChartTabs = [
  { key: 'short', label: '短期 VMP' },
  { key: 'market', label: '市场调整' },
  { key: 'long', label: '长期需求' },
  { key: 'elasticity', label: '弹性诊断' },
]
const demandWageRange = sliderRanges.demandInitialWage
const wageInitial = ref(demandWageRange.default)
const wageNew = ref(42)
const productPrice = ref(1)
const capital = ref(700)
const sigma = ref(1.2)
const productDemandElasticity = ref(0.8)
const capitalFlexibility = ref(0.55)
const laborCostShare = ref(0.35)
const marketFeedback = ref(0.65)
const techType = ref('中性技术')
const loading = ref(false)
const result = ref(null)

const activeFigure = computed(() => ({
  short: '图3-1 / 图3-2',
  market: '图3-3',
  long: '图3-6 / 图3-7',
  elasticity: '图3-11',
}[activeTab.value]))

const activeChartTitle = computed(() => ({
  short: '短期劳动需求：VMP 曲线与工资线相交',
  market: '市场调整：产品价格反馈使 VMP 曲线移动',
  long: '长期劳动需求：替代效应与规模效应',
  elasticity: '需求弹性：为什么有些岗位更敏感',
}[activeTab.value]))

const activeExplanation = computed(() => {
  if (!result.value) return ''
  if (activeTab.value === 'short') return result.value.short_run.rule
  if (activeTab.value === 'market') return result.value.market.explanation
  if (activeTab.value === 'long') return result.value.long_run.explanation
  return result.value.elasticity.diagnosis
})

const activeControlHint = computed(() => ({
  short: '当前参数直接驱动短期 VMP 曲线、工资线与 A/B 均衡点。',
  market: '当前参数直接驱动产品价格反馈、VMP 位移与 B/I 均衡点。',
  long: '当前参数直接驱动要素替代、规模效应与 A→B→C 调整路径。',
  elasticity: '当前参数直接驱动短期和长期需求弹性差异。',
}[activeTab.value]))

const activeChangeSummary = computed(() => {
  if (!result.value) return '等待当前情景计算。'
  if (activeTab.value === 'market') {
    return `产品价格 ${result.value.market.price_initial} → ${result.value.market.price_after}；雇佣量 B点 ${result.value.market.point_b.labor} → I点 ${result.value.market.point_i.labor}。`
  }
  if (activeTab.value === 'long') {
    return `长期调整 A点 ${result.value.long_run.point_a.labor} → B点 ${result.value.long_run.point_b.labor} → C点 ${result.value.long_run.point_c.labor}。`
  }
  if (activeTab.value === 'elasticity') {
    return `短期弹性 ${result.value.elasticity.short} → 长期弹性 ${result.value.elasticity.long}，${result.value.elasticity.label}。`
  }
  return `短期工资变化后，雇佣量 A点 ${result.value.short_run.point_a.labor} → B点 ${result.value.short_run.point_b.labor}。`
})

const demandConclusion = computed(() => {
  if (!result.value) return ''
  const a = result.value.short_run.point_a
  const b = result.value.short_run.point_b
  const c = result.value.long_run.point_c
  return `工资从 ${a.wage} 元/h 变为 ${b.wage} 元/h，短期雇佣量从 ${a.labor} 变为 ${b.labor}，长期调整后为 ${c.labor}。`
})

const recordParameters = computed(() => ({
  '教材图模式': activeFigure.value,
  '初始工资W0': `${wageInitial.value} 元/小时`,
  '新工资W1': `${wageNew.value} 元/小时`,
  '资本存量K': capital.value,
  '替代弹性σ': sigma.value.toFixed(2),
  '技术类型': techType.value,
}))

const recordMetrics = computed(() => result.value ? ({
  '初始雇佣量': result.value.short_run.point_a.labor,
  '短期雇佣量': result.value.short_run.point_b.labor,
  '长期雇佣量': result.value.long_run.point_c.labor,
  '长期需求弹性': result.value.elasticity.long,
}) : ({}))

const activeChartOption = computed(() => {
  if (!result.value) return {}
  if (activeTab.value === 'market') return marketChartOption.value
  if (activeTab.value === 'long') return longPathChartOption.value
  if (activeTab.value === 'elasticity') return elasticityTypeChartOption.value
  return shortRunChartOption.value
})

function signed(value) {
  const n = Number(value || 0)
  return `${n > 0 ? '+' : ''}${Number(n.toFixed(2))}`
}

function wageLine(name, wage, maxLabor, color, dashed = false) {
  return {
    name,
    type: 'line',
    data: [[0, wage], [maxLabor, wage]],
    symbol: 'none',
    lineStyle: { color, width: 2, type: dashed ? 'dashed' : 'solid' },
  }
}

function pointSeries(point, color) {
  return {
    name: point.label,
    type: 'scatter',
    data: [[point.labor, point.wage]],
    symbolSize: 13,
    itemStyle: { color },
    label: { show: true, formatter: point.label, position: 'top', color: '#f8fafc', fontWeight: 800 },
  }
}

function baseDemandAxes(series) {
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 400,
    color: ['#38bdf8', '#22c55e', '#f59e0b'],
    legend: { top: 0, textStyle: { color: '#94a3b8' } },
    tooltip: { trigger: 'axis' },
    grid: { top: 46, right: 24, bottom: 42, left: 58 },
    xAxis: {
      name: '劳动数量 L',
      min: 0,
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } },
    },
    yAxis: {
      name: '工资率 W / VMP',
      min: 0,
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } },
    },
    series,
  }
}

const shortRunChartOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.short_run
  const maxLabor = Math.max(...d.labor_grid)
  return baseDemandAxes([
    { name: 'VMP=P×MP', type: 'line', data: d.labor_grid.map((L, i) => [L, d.vmp[i]]), smooth: true, symbol: 'none', lineStyle: { color: '#38bdf8', width: 3 } },
    wageLine('W0', d.wage_initial, maxLabor, '#f59e0b'),
    wageLine('W1', d.wage_new, maxLabor, '#22c55e', true),
    pointSeries(d.point_a, '#f59e0b'),
    pointSeries(d.point_b, '#22c55e'),
  ])
})

const marketChartOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.market
  const grid = result.value.short_run.labor_grid
  const maxLabor = Math.max(...grid)
  return baseDemandAxes([
    { name: '原 VMP', type: 'line', data: grid.map((L, i) => [L, d.vmp_initial[i]]), smooth: true, symbol: 'none', lineStyle: { color: '#38bdf8', width: 3 } },
    { name: '市场调整后 VMP', type: 'line', data: grid.map((L, i) => [L, d.vmp_adjusted[i]]), smooth: true, symbol: 'none', lineStyle: { color: '#22c55e', width: 3 } },
    wageLine('W1', d.point_b.wage, maxLabor, '#f59e0b'),
    pointSeries(d.point_b, '#a78bfa'),
    pointSeries(d.point_i, '#22c55e'),
  ])
})

const longPathChartOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.long_run
  const iso1 = d.isoquants.initial.labor.map((L, i) => [L, d.isoquants.initial.capital[i]])
  const iso2 = d.isoquants.new.labor.map((L, i) => [L, d.isoquants.new.capital[i]])
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 400,
    color: ['#38bdf8', '#22c55e', '#f59e0b'],
    legend: { top: 0, textStyle: { color: '#94a3b8' } },
    tooltip: { trigger: 'axis' },
    grid: { top: 46, right: 24, bottom: 42, left: 58 },
    xAxis: { name: '劳动数量 L', min: 0, nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    yAxis: { name: '资本 K', min: 0, nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    series: [
      { name: '等产量曲线 Q0', type: 'line', data: iso1, smooth: true, symbol: 'none', lineStyle: { color: '#64748b', width: 2 } },
      { name: '等产量曲线 Q1', type: 'line', data: iso2, smooth: true, symbol: 'none', lineStyle: { color: '#94a3b8', width: 2, type: 'dashed' } },
      { name: '长期调整路径 A→B→C', type: 'line', data: [[d.point_a.labor, d.point_a.capital], [d.point_b.labor, d.point_b.capital], [d.point_c.labor, d.point_c.capital]], symbolSize: 12, lineStyle: { color: '#22c55e', width: 3 }, itemStyle: { color: '#22c55e' }, label: { show: true, formatter: p => ['A', 'B', 'C'][p.dataIndex], position: 'top', color: '#f8fafc', fontWeight: 800 } },
    ],
  }
})

const elasticityTypeChartOption = computed(() => {
  if (!result.value) return {}
  const x = [80, 140, 220, 300, 380]
  return baseDemandAxes([
    { name: '|ed|<1 刚性需求', type: 'line', data: x.map((L, i) => [L, 125 - i * 9]), symbol: 'none', lineStyle: { color: '#38bdf8', width: 3 } },
    { name: '|ed|>1 弹性需求', type: 'line', data: x.map((L, i) => [L, 145 - i * 24]), symbol: 'none', lineStyle: { color: '#f59e0b', width: 3 } },
    { name: '当前长期需求', type: 'line', data: result.value.long_run.long_curve.labor.map((L, i) => [L, result.value.long_run.long_curve.wages[i]]), symbol: 'none', smooth: true, lineStyle: { color: '#22c55e', width: 3 } },
  ])
})

const shortLongChartOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.long_run
  return baseDemandAxes([
    { name: '短期需求 Ds', type: 'line', data: d.short_curve.labor.map((L, i) => [L, d.short_curve.wages[i]]), symbol: 'none', smooth: true, lineStyle: { color: '#38bdf8', width: 3 } },
    { name: '长期需求 DL', type: 'line', data: d.long_curve.labor.map((L, i) => [L, d.long_curve.wages[i]]), symbol: 'none', smooth: true, lineStyle: { color: '#22c55e', width: 3 } },
  ])
})

const elasticityChartOption = computed(() => {
  if (!result.value) return {}
  const items = result.value.elasticity.factors
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 400,
    grid: { top: 22, right: 20, bottom: 36, left: 92 },
    tooltip: { trigger: 'axis' },
    xAxis: { max: 100, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    yAxis: { type: 'category', data: items.map(i => i.name), axisLabel: { color: '#94a3b8' } },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      itemStyle: { color: '#06b6d4', borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', color: '#e2e8f0', formatter: p => `${p.value}` },
    }],
  }
})

async function runDemand() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/demand/textbook'), {
      wage_initial: wageInitial.value,
      wage_new: wageNew.value,
      product_price: productPrice.value,
      capital: capital.value,
      sigma: sigma.value,
      product_demand_elasticity: productDemandElasticity.value,
      capital_flexibility: capitalFlexibility.value,
      labor_cost_share: laborCostShare.value,
      market_feedback: marketFeedback.value,
      tech_type: techType.value,
    })
    result.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetDemand() {
  activeTab.value = isFactorAllocation.value ? 'long' : 'short'
  wageInitial.value = demandWageRange.default
  wageNew.value = 42
  productPrice.value = 1
  capital.value = 700
  sigma.value = 1.2
  productDemandElasticity.value = 0.8
  capitalFlexibility.value = 0.55
  laborCostShare.value = 0.35
  marketFeedback.value = 0.65
  techType.value = '中性技术'
  runDemand()
}

const scheduleDemand = createRealtimeScheduler(runDemand, 80)

watch([wageInitial, wageNew, productPrice, capital, sigma, productDemandElasticity, capitalFlexibility, laborCostShare, marketFeedback, techType], scheduleDemand)
onMounted(runDemand)
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; transition: color .2s; }
.back-link:hover { color: #94a3b8; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; max-width: 900px; line-height: 1.7; }
.lab-controls { display: grid; gap: 14px; padding: 18px; background: rgba(30,41,59,.5); border: 1px solid rgba(148,163,184,.1); border-radius: 16px; }
.control-group { min-width: 0; }
.control-context { margin: 0; color: #cbd5e1; font-size: 12px; line-height: 1.55; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #06b6d4; font-weight: 800; }
.control-group input[type="range"], .control-group select { width: 100%; }
.control-group select { padding: 9px 10px; border-radius: 8px; border: 1px solid rgba(148,163,184,.2); background: #1e293b; color: #e2e8f0; }
.hint { margin-top: 4px; color: #64748b; font-size: 11px; line-height: 1.5; }
.tab-buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tab-buttons button { min-height: 36px; border: 1px solid rgba(148,163,184,.16); border-radius: 9px; background: rgba(15,23,42,.72); color: #94a3b8; font-weight: 800; cursor: pointer; }
.tab-buttons button.active { border-color: rgba(6,182,212,.45); color: #e0f2fe; background: rgba(6,182,212,.14); }
.btn-run { padding: 12px 18px; border: none; border-radius: 10px; background: linear-gradient(135deg,#06b6d4,#2563eb); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; }
.btn-run:disabled { opacity: .55; cursor: not-allowed; }
.btn-reset { padding: 11px 14px; border: 1px solid rgba(148,163,184,.22); border-radius: 7px; color: #cbd5e1; background: #111b2e; cursor: pointer; }
.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card, .chart-card, .explain-card, .point-card { background: rgba(30,41,59,.5); border: 1px solid rgba(148,163,184,.1); border-radius: 14px; }
.stat-card { padding: 15px; text-align: center; }
.stat-card.warn { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.06); }
.stat-label { display: block; color: #64748b; font-size: 12px; margin-bottom: 6px; }
.stat-val { display: block; color: #f8fafc; font-size: 23px; line-height: 1.15; font-weight: 900; }
.stat-sub { display: block; color: #94a3b8; font-size: 12px; margin-top: 5px; }
.chart-card { padding: 18px; min-width: 0; }
.chart-card h3, .explain-card h3 { margin: 0 0 10px; color: #cbd5e1; font-size: 15px; }
.chart-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 4px; }
.chart-head p { margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.7; }
.chart-head span { flex: 0 0 auto; color: #67e8f9; font-size: 12px; font-weight: 800; border: 1px solid rgba(6,182,212,.28); border-radius: 999px; padding: 5px 9px; }
.lab-results { display: grid; gap: 18px; }
.section-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 16px; align-items: stretch; }
.explain-card { padding: 18px; }
.read-row { display: grid; grid-template-columns: 32px 1fr; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(148,163,184,.08); color: #94a3b8; font-size: 13px; line-height: 1.65; }
.read-row strong { color: #67e8f9; font-size: 16px; }
.explain-card p { margin: 14px 0 0; color: #e2e8f0; line-height: 1.7; font-size: 13px; }
.point-stack { display: grid; gap: 12px; }
.point-card { padding: 14px; }
.point-badge { display: block; color: #67e8f9; font-size: 12px; font-weight: 800; margin-bottom: 8px; }
.point-row { display: flex; justify-content: space-between; gap: 10px; color: #94a3b8; font-size: 13px; padding: 4px 0; }
.point-row span:last-child { color: #f8fafc; font-weight: 800; }
.policy-note { margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.8; background: rgba(14,165,233,.08); border: 1px solid rgba(14,165,233,.16); border-radius: 12px; padding: 14px 16px; }
@media (max-width: 900px) {
  .section-grid { grid-template-columns: 1fr; }
  .cards-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .lab { padding: 28px 16px; }
  .lab-header h1 { font-size: 26px; }
  .cards-row, .tab-buttons { grid-template-columns: 1fr; }
  .chart-card, .explain-card { padding: 14px; }
  .chart-head { display: grid; }
}
</style>
