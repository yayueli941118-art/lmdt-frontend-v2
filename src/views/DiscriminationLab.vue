<template>
  <div class="lab">
    <header class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span class="chapter-kicker">CH.07 · 劳动力市场歧视</span>
      <h1>歧视机制与工资差距分解</h1>
      <p>贝克尔雇主偏见 · 统计性歧视 · Oaxaca-Blinder 两重与三重分解</p>
    </header>

    <LabDashboardLayout
      :result-type="resultType"
      :formula="formula"
      :assumptions="assumptions"
      source="教材第七章贝克尔偏见模型、统计性歧视与工资差距分解。"
      scope="比较偏见成本、信息不完全与样本工资差距分解的不同机制。"
      limitation="仅凭不可解释差距证明现实中的违法歧视或个体受到歧视。"
    >
      <template #controls>
        <nav class="mechanism-tabs" aria-label="歧视机制页签">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="{ active: mechanismMode === tab.key }"
            @click="mechanismMode = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="mechanismMode === 'becker'" class="lab-controls">
          <div class="control-group">
            <label for="becker-wage">市场月薪 <span>{{ marketWage.toLocaleString() }}元</span></label>
            <input id="becker-wage" v-model.number="marketWage" type="range" min="3000" max="15000" step="100">
          </div>
          <div class="control-group">
            <label for="becker-d">歧视系数 d <span>{{ (discPct / 100).toFixed(2) }}</span></label>
            <input id="becker-d" v-model.number="discPct" type="range" min="0" max="80" step="1">
          </div>
          <div class="control-group">
            <label for="becker-elasticity">劳动需求弹性 <span>{{ demandElasticity.toFixed(1) }}</span></label>
            <input id="becker-elasticity" v-model.number="demandElasticity" type="range" min="0.1" max="3" step="0.1">
          </div>
        </section>

        <section v-else-if="mechanismMode === 'statistical'" class="lab-controls">
          <div class="control-group">
            <label for="individual-signal">个体可观察信号 <span>{{ individualSignal }}</span></label>
            <input id="individual-signal" v-model.number="individualSignal" type="range" min="0" max="100" step="1">
          </div>
          <div class="control-group">
            <label for="group-prior">群体先验 <span>{{ groupPrior }}</span></label>
            <input id="group-prior" v-model.number="groupPrior" type="range" min="0" max="100" step="1">
          </div>
          <div class="control-group">
            <label for="signal-reliability">信号可靠度 λ <span>{{ signalReliability.toFixed(2) }}</span></label>
            <input id="signal-reliability" v-model.number="signalReliability" type="range" min="0" max="1" step="0.05">
          </div>
        </section>

        <section v-else class="lab-controls oaxaca-controls">
          <div class="control-group">
            <label for="synthetic-gap">合成样本工资差异 <span>{{ discPct }}%</span></label>
            <input id="synthetic-gap" v-model.number="discPct" type="range" min="5" max="50" step="1">
          </div>
          <div class="control-group">
            <label for="education-gap">平均教育差距 <span>{{ eduGap }}年</span></label>
            <input id="education-gap" v-model.number="eduGap" type="range" min="0" max="6" step="0.5">
          </div>
          <div class="control-group">
            <label for="decomposition-mode">分解口径</label>
            <select id="decomposition-mode" v-model="decompositionMode">
              <option value="two">教材两重分解</option>
              <option value="three">扩展三重分解</option>
            </select>
          </div>
        </section>
        <button type="button" class="reset-btn" @click="resetDiscrimination">恢复默认参数</button>
      </template>

      <template #task>
        <LearningTaskCard
          :task="learningTask"
          :observe="learningObserve"
          :conclusion="discriminationConclusion"
        />
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="劳动力市场歧视机制"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="discriminationConclusion"
          model-version="discrimination-2.1"
          :source-type="resultType"
        />
      </template>

      <template #metrics>
        <section v-if="mechanismMode === 'becker' && beckerResult" class="metric-grid">
          <article><span>市场月薪</span><strong>{{ marketWage.toLocaleString() }}元</strong></article>
          <article><span>雇主感知工资</span><strong>{{ beckerResult.perceived_wage.toLocaleString() }}元</strong></article>
          <article><span>相对劳动需求</span><strong>{{ beckerResult.relative_labor_demand_pct }}%</strong></article>
          <article><span>效率损失指数</span><strong>{{ beckerResult.efficiency_loss_pct }}%</strong></article>
        </section>
        <section v-else-if="mechanismMode === 'statistical' && statisticalResult" class="metric-grid">
          <article><span>个体信号</span><strong>{{ statisticalResult.signal }}</strong></article>
          <article><span>群体先验</span><strong>{{ statisticalResult.group_prior }}</strong></article>
          <article><span>评价生产率</span><strong>{{ statisticalResult.evaluated_productivity }}</strong></article>
          <article><span>先验权重</span><strong>{{ statisticalResult.prior_weight_pct }}%</strong></article>
        </section>
        <section v-else-if="oaxacaResult && !oaxacaResult.error" class="metric-grid">
          <article><span>总工资差距</span><strong>{{ oaxacaResult.decomposition.total_gap_pct }}%</strong></article>
          <article><span>禀赋效应</span><strong>{{ displayedDecomposition.endowment.toFixed(4) }}</strong></article>
          <article><span>不可解释部分</span><strong>{{ displayedDecomposition.unexplained.toFixed(4) }}</strong></article>
          <article><span>会计恒等式误差</span><strong>{{ identityError.toExponential(1) }}</strong></article>
        </section>
      </template>

      <template #primary>
        <section v-if="mechanismMode !== 'oaxaca'" class="chart-card">
          <h2>{{ mechanismMode === 'becker' ? '歧视系数如何改变感知工资与劳动需求' : '信号可靠度如何改变个体评价' }}</h2>
          <v-chart :option="mechanismOption" autoresize style="height:360px" :aria-label="`${tabs.find(item => item.key === mechanismMode)?.label}机制图`" />
          <p class="model-note">{{ mechanismMode === 'becker' ? beckerResult?.explanation : statisticalResult?.explanation }}</p>
        </section>

        <section v-else-if="oaxacaResult && !oaxacaResult.error" class="oaxaca-grid">
          <article class="chart-card">
            <h2>{{ decompositionMode === 'two' ? '教材两重分解' : '扩展三重分解' }}</h2>
            <v-chart :option="decompositionOption" autoresize style="height:320px" aria-label="Oaxaca工资差距分解图" />
          </article>
          <article class="chart-card">
            <h2>两组明瑟回归系数</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>组别</th><th v-for="name in oaxacaResult.coefficients.coefficient_names" :key="name">{{ name }}</th><th>R²</th></tr>
                </thead>
                <tbody>
                  <tr><td>A组</td><td v-for="(value, index) in oaxacaResult.coefficients.group_a" :key="`a-${index}`">{{ value.toFixed(4) }}</td><td>{{ oaxacaResult.coefficients.r_squared_a }}</td></tr>
                  <tr><td>B组</td><td v-for="(value, index) in oaxacaResult.coefficients.group_b" :key="`b-${index}`">{{ value.toFixed(4) }}</td><td>{{ oaxacaResult.coefficients.r_squared_b }}</td></tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </template>

      <template #secondary>
        <aside class="boundary-note">
          <strong>解释边界：</strong>
          <span v-if="mechanismMode === 'becker'">偏见系数是教材中的行为参数，不能直接从现实工资差距倒推出雇主主观偏见。</span>
          <span v-else-if="mechanismMode === 'statistical'">群体先验并不是个体真实生产率；提高可验证信号质量能降低招聘判断对群体先验的依赖。</span>
          <span v-else>不可解释部分可能包含歧视效应，也可能受到遗漏变量、样本选择和模型设定影响，不能自动等同于歧视。</span>
        </aside>
      </template>
    </LabDashboardLayout>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { apiUrl } from '../lib/api'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import LabDashboardLayout from '../components/LabDashboardLayout.vue'
import LearningTaskCard from '../components/LearningTaskCard.vue'

use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const tabs = [
  { key: 'becker', label: '贝克尔雇主偏见' },
  { key: 'statistical', label: '统计性歧视' },
  { key: 'oaxaca', label: 'Oaxaca-Blinder分解' },
]
const mechanismMode = ref('becker')
const discPct = ref(20)
const eduGap = ref(2)
const marketWage = ref(6000)
const demandElasticity = ref(0.8)
const individualSignal = ref(72)
const groupPrior = ref(60)
const signalReliability = ref(0.55)
const decompositionMode = ref('two')
const beckerResult = ref(null)
const statisticalResult = ref(null)
const oaxacaResult = ref(null)
let timer = null

const resultType = computed(() =>
  mechanismMode.value === 'oaxaca' ? '合成样本真实回归' : '教材机制模拟')
const formula = computed(() => ({
  becker: '雇主感知工资=W(1+d)，d为歧视系数',
  statistical: 'E(productivity|signal)=lambda*signal+(1-lambda)*group prior',
  oaxaca: decompositionMode.value === 'two'
    ? 'Delta lnW=(XB-XA)betaA+XB(betaB-betaA)'
    : 'Delta lnW=(XB-XA)betaA+XA(betaB-betaA)+(XB-XA)(betaB-betaA)',
}[mechanismMode.value]))
const assumptions = computed(() =>
  mechanismMode.value === 'oaxaca'
    ? '两组使用同一组可观测变量；页面生成的合成样本仅用于展示真实回归与会计分解。'
    : '其他生产率与岗位条件保持不变，参数用于比较机制方向。')
const learningTask = computed(() => ({
  becker: '调整歧视系数 d，观察雇主感知工资和对同等生产率劳动者的需求如何变化。',
  statistical: '调整个体信号、群体先验和信号可靠度，观察招聘评价如何变化。',
  oaxaca: '调整两组合成样本的工资与教育差距，比较禀赋效应和不可解释部分。',
}[mechanismMode.value]))
const learningObserve = computed(() => ({
  becker: '重点看偏见如何形成额外感知成本和效率损失。',
  statistical: '重点看信息越可靠时，个体评价是否越少依赖群体先验。',
  oaxaca: '重点核对分解项是否严格加总为总工资差距。',
}[mechanismMode.value]))

const displayedDecomposition = computed(() => {
  if (!oaxacaResult.value?.decomposition) return { endowment: 0, coefficient: 0, interaction: 0, unexplained: 0 }
  const item = oaxacaResult.value.decomposition
  return {
    endowment: item.endowment_effect,
    coefficient: item.coefficient_effect,
    interaction: decompositionMode.value === 'three' ? item.interaction_effect : 0,
    unexplained: decompositionMode.value === 'three'
      ? item.coefficient_effect
      : item.coefficient_effect + item.interaction_effect,
  }
})
const identityError = computed(() => {
  if (!oaxacaResult.value?.decomposition) return 0
  const item = oaxacaResult.value.decomposition
  const sum = item.endowment_effect + item.coefficient_effect + item.interaction_effect
  return Math.abs(sum - item.total_gap_ln)
})
const discriminationConclusion = computed(() => {
  if (mechanismMode.value === 'becker') return beckerResult.value?.explanation || ''
  if (mechanismMode.value === 'statistical') return statisticalResult.value?.explanation || ''
  if (!oaxacaResult.value?.decomposition) return ''
  return `当前合成样本总对数工资差距为${oaxacaResult.value.decomposition.total_gap_ln}，会计恒等式误差为${identityError.value.toExponential(1)}。不可解释部分不能自动等同于歧视。`
})
const recordParameters = computed(() => ({
  机制页签: tabs.find(item => item.key === mechanismMode.value)?.label,
  歧视系数或工资差异: discPct.value,
  个体信号: individualSignal.value,
  信号可靠度: signalReliability.value,
  分解口径: decompositionMode.value === 'two' ? '两重' : '三重',
}))
const recordMetrics = computed(() => {
  if (mechanismMode.value === 'becker' && beckerResult.value) {
    return { 雇主感知工资: `${beckerResult.value.perceived_wage}元`, 相对劳动需求: `${beckerResult.value.relative_labor_demand_pct}%` }
  }
  if (mechanismMode.value === 'statistical' && statisticalResult.value) {
    return { 评价生产率: statisticalResult.value.evaluated_productivity, 先验权重: `${statisticalResult.value.prior_weight_pct}%` }
  }
  return oaxacaResult.value?.decomposition ? {
    总工资差距: `${oaxacaResult.value.decomposition.total_gap_pct}%`,
    禀赋效应: displayedDecomposition.value.endowment,
    不可解释部分: displayedDecomposition.value.unexplained,
    恒等式误差: identityError.value,
  } : {}
})

const mechanismOption = computed(() => {
  if (mechanismMode.value === 'becker' && beckerResult.value) {
    return {
      animationDuration: 500,
      grid: { top: 48, right: 30, bottom: 44, left: 62 },
      legend: { top: 0, textStyle: { color: '#94a3b8' } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: beckerResult.value.curve.map(item => item.coefficient), name: '歧视系数 d', axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
      series: [
        { name: '感知工资(百元)', type: 'line', data: beckerResult.value.curve.map(item => item.perceived_wage / 100), lineStyle: { color: '#ef4444', width: 3 } },
        { name: '相对劳动需求(%)', type: 'line', data: beckerResult.value.curve.map(item => item.labor_demand_pct), lineStyle: { color: '#06b6d4', width: 3 } },
      ],
    }
  }
  if (!statisticalResult.value) return {}
  return {
    animationDuration: 500,
    grid: { top: 34, right: 24, bottom: 44, left: 58 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: statisticalResult.value.curve.map(item => item.reliability), name: '信号可靠度 λ', axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', min: 0, max: 100, name: '评价生产率', axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'line', data: statisticalResult.value.curve.map(item => item.evaluated_productivity), lineStyle: { color: '#8b5cf6', width: 3 }, areaStyle: { color: 'rgba(139,92,246,.1)' } }],
  }
})

const decompositionOption = computed(() => {
  const item = displayedDecomposition.value
  const labels = decompositionMode.value === 'two'
    ? ['禀赋效应', '不可解释部分']
    : ['禀赋效应', '系数效应', '交互效应']
  const values = decompositionMode.value === 'two'
    ? [item.endowment, item.unexplained]
    : [item.endowment, item.coefficient, item.interaction]
  return {
    animationDuration: 500,
    grid: { top: 28, right: 20, bottom: 42, left: 62 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', name: '对数工资差距', axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'bar', data: values, itemStyle: { color: params => ['#06b6d4', '#ef4444', '#8b5cf6'][params.dataIndex], borderRadius: [4, 4, 0, 0] } }],
  }
})

function generateData() {
  const count = 16
  const wave = index => (Math.sin(index * 1.91) + 1) / 2
  const educationA = Array.from({ length: count }, (_, index) => Math.round(12 + wave(index) * Math.max(0, 4 - eduGap.value)))
  const educationB = Array.from({ length: count }, (_, index) => Math.round(12 + eduGap.value + wave(index + 3) * 4))
  const experienceA = Array.from({ length: count }, (_, index) => Math.round(3 + wave(index + 7) * 15))
  const experienceB = Array.from({ length: count }, (_, index) => Math.round(3 + wave(index + 11) * 15))
  const wageA = educationA.map((value, index) =>
    Math.round((5000 + value * 220 + experienceA[index] * 150) * (1 - discPct.value / 100)))
  const wageB = educationB.map((value, index) =>
    Math.round(5600 + value * 330 + experienceB[index] * 190))
  return {
    group_a_wages: wageA,
    group_b_wages: wageB,
    group_a_edu: educationA,
    group_b_edu: educationB,
    group_a_exp: experienceA,
    group_b_exp: experienceB,
  }
}

async function run() {
  const [becker, statistical, oaxaca] = await Promise.all([
    axios.post(apiUrl('/api/v2/discrimination/becker'), {
      market_wage: marketWage.value,
      discrimination_coefficient: discPct.value / 100,
      demand_elasticity: demandElasticity.value,
    }),
    axios.post(apiUrl('/api/v2/discrimination/statistical'), {
      signal: individualSignal.value,
      group_prior: groupPrior.value,
      signal_reliability: signalReliability.value,
    }),
    axios.post(apiUrl('/api/v2/discrimination/decompose'), generateData()),
  ])
  beckerResult.value = becker.data
  statisticalResult.value = statistical.data
  oaxacaResult.value = oaxaca.data
}

function resetDiscrimination() {
  discPct.value = 20
  eduGap.value = 2
  marketWage.value = 6000
  demandElasticity.value = 0.8
  individualSignal.value = 72
  groupPrior.value = 60
  signalReliability.value = 0.55
  decompositionMode.value = 'two'
  run()
}

function scheduleRun() {
  clearTimeout(timer)
  timer = setTimeout(run, 180)
}

watch([
  discPct,
  eduGap,
  marketWage,
  demandElasticity,
  individualSignal,
  groupPrior,
  signalReliability,
], scheduleRun)
onMounted(run)
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 72px; }
.lab-header { margin-bottom: 24px; }
.back-link { color: #94a3b8; text-decoration: none; font-size: 14px; }
.chapter-kicker { display: block; margin-top: 18px; color: #ef4444; font-size: 12px; font-weight: 800; }
.lab-header h1 { margin: 7px 0; color: #f8fafc; font-size: 34px; font-weight: 900; }
.lab-header p { margin: 0; color: #94a3b8; line-height: 1.7; }
.mechanism-tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px; }
.mechanism-tabs button { min-height: 40px; flex: 0 0 auto; padding: 9px 14px; border: 1px solid rgba(148,163,184,.18); border-radius: 7px; color: #cbd5e1; background: rgba(30,41,59,.66); cursor: pointer; font-weight: 750; }
.mechanism-tabs button.active { color: #fff; border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.15); }
.lab-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; padding: 18px; margin-bottom: 22px; border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.52); }
.control-group label { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: #cbd5e1; font-size: 14px; }
.control-group label span { color: #f87171; font-weight: 800; }
.control-group input[type="range"] { width: 100%; accent-color: #ef4444; }
.control-group select { width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid rgba(148,163,184,.25); border-radius: 6px; color: #e2e8f0; background: #1e293b; }
.reset-btn { margin-bottom: 18px; padding: 10px 13px; border: 1px solid rgba(148,163,184,.22); border-radius: 7px; color: #cbd5e1; background: #111b2e; cursor: pointer; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
.metric-grid article, .chart-card, .boundary-note { min-width: 0; border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.5); }
.metric-grid article { padding: 16px; }
.metric-grid span { color: #94a3b8; font-size: 12px; }
.metric-grid strong { display: block; margin-top: 7px; color: #f8fafc; font-size: 21px; overflow-wrap: anywhere; }
.chart-card { padding: 18px; }
.chart-card h2 { margin: 0 0 12px; color: #e2e8f0; font-size: 18px; }
.model-note, .boundary-note { color: #cbd5e1; font-size: 14px; line-height: 1.75; }
.model-note { margin: 8px 0 0; padding: 13px 15px; background: rgba(239,68,68,.07); border-left: 3px solid #ef4444; }
.oaxaca-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 560px; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid rgba(148,163,184,.1); color: #cbd5e1; font-size: 12px; text-align: right; }
th:first-child, td:first-child { text-align: left; color: #67e8f9; }
.boundary-note { display: block; margin-top: 18px; padding: 16px; }
.boundary-note strong { color: #f8fafc; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #67e8f9; outline-offset: 2px; }
@media (max-width: 900px) {
  .lab-controls, .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .oaxaca-grid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .lab { padding: 28px 16px 88px; }
  .lab-header h1 { font-size: 28px; }
  .lab-controls, .metric-grid { grid-template-columns: 1fr; }
}
</style>
