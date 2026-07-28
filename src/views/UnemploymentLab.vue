<template>
  <div class="lab">
    <header class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span class="chapter-kicker">CH.09 · 失业</span>
      <h1>失业、工作搜寻与匹配</h1>
      <p>存量—流量 · 保留工资 · DMP匹配 · 贝弗里奇曲线 · 最低工资情景</p>
    </header>

    <LabDashboardLayout
      :result-type="resultType"
      :formula="formula"
      :assumptions="assumptions"
      source="教材第九章失业存量—流量、工作搜寻、保留工资、贝弗里奇曲线和DMP匹配模型。"
      scope="比较失业构成、搜寻行为、匹配效率和政策假设的机制影响。"
      limitation="现实地区未来失业率、岗位空缺率或最低工资就业效应的精确预测。"
    >
      <template #controls>
        <nav class="topic-tabs" aria-label="失业主题页签">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="activeTab === 'stock'" class="lab-controls">
          <ControlRange id="natural-rate" v-model="naturalRate" label="基准自然失业率" unit="%" :min="3" :max="8" :step="0.5" />
          <ControlRange id="skill-mismatch" v-model="mismatch" label="技能错配指数" :min="0" :max="2" :step="0.1" />
          <ControlRange id="ai-risk" v-model="aiRisk" label="AI冲击" unit="%" :min="0" :max="100" :step="5" />
          <ControlRange id="demand-shock" v-model="demandShock" label="劳动需求冲击" unit="%" :min="-30" :max="30" :step="5" />
        </section>

        <section v-else-if="activeTab === 'search'" class="lab-controls">
          <ControlRange id="search-benefit" v-model="benefit" label="失业救济" unit="元/月" :min="0" :max="8000" :step="100" />
          <ControlRange id="search-cost" v-model="searchCost" label="每月搜寻成本" unit="元" :min="0" :max="3000" :step="100" />
          <ControlRange id="expected-offer" v-model="expectedOffer" label="预期工资报价" unit="元/月" :min="3000" :max="15000" :step="100" />
          <ControlRange id="search-patience" v-model="patience" label="等待耐心" :min="0" :max="1" :step="0.05" />
        </section>

        <section v-else-if="activeTab === 'dmp'" class="lab-controls">
          <ControlRange id="dmp-u" v-model="dmpUnemployed" label="失业人数" unit="万" :min="20" :max="300" :step="10" />
          <ControlRange id="dmp-v" v-model="dmpVacancies" label="岗位空缺" unit="万" :min="20" :max="300" :step="10" />
          <ControlRange id="dmp-efficiency" v-model="dmpEfficiency" label="匹配效率 m" :min="0.2" :max="1" :step="0.05" />
          <ControlRange id="dmp-separation" v-model="dmpSeparation" label="月岗位分离率" unit="%" :display-value="(dmpSeparation * 100).toFixed(1)" :min="0.005" :max="0.08" :step="0.005" />
        </section>

        <section v-else-if="activeTab === 'beveridge'" class="lab-controls">
          <ControlRange id="bev-mismatch" v-model="mismatch" label="技能错配指数" :min="0" :max="2" :step="0.1" />
          <ControlRange id="bev-ai-risk" v-model="aiRisk" label="AI冲击" unit="%" :min="0" :max="100" :step="5" />
          <label class="toggle-control">
            <input v-model="skillTraining" type="checkbox">
            <span>启用技能重塑情景</span>
          </label>
        </section>

        <section v-else class="lab-controls">
          <ControlRange id="minimum-wage" v-model="minimumWage" label="最低工资" unit="元/小时" :min="15" :max="60" :step="1" />
          <ControlRange id="average-wage" v-model="averageWage" label="平均工资" unit="元/小时" :min="20" :max="150" :step="2" />
          <ControlRange id="employment-count" v-model="employment" label="基准就业人数" unit="万" :min="200" :max="1500" :step="10" />
          <ControlRange id="demand-elasticity" v-model="demandElasticity" label="劳动需求弹性" :display-value="demandElasticity.toFixed(2)" :min="-0.5" :max="-0.05" :step="0.05" />
        </section>

        <button type="button" class="reset-btn" @click="resetCurrent">恢复本页签默认参数</button>
      </template>

      <template #task>
        <LearningTaskCard
          :task="taskCopy.task"
          :observe="taskCopy.observe"
          :conclusion="currentConclusion"
        />
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="失业、工作搜寻与匹配"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="currentConclusion"
          model-version="unemployment-2.1"
          :source-type="resultType"
        />
      </template>

      <template #metrics>
        <section class="metric-grid">
          <article v-for="item in currentMetrics" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </section>
      </template>

      <template #primary>
        <section class="chart-card">
          <h2>{{ chartTitle }}</h2>
          <v-chart :option="currentChart" autoresize style="height:380px" :aria-label="chartTitle" />
          <p class="chart-explanation">{{ chartExplanation }}</p>
        </section>
      </template>

      <template #secondary>
        <section v-if="activeTab === 'stock' && unemploymentResult" class="stock-flow-panel">
          <h2>就业 E、失业 U 与非劳动力 N 的月度流动</h2>
          <div class="flow-grid">
            <article><span>E → U</span><strong>{{ unemploymentResult.stock_flow.separation_rate_pct }}%</strong><small>岗位分离</small></article>
            <article><span>U → E</span><strong>{{ unemploymentResult.stock_flow.job_finding_probability_pct }}%</strong><small>找到工作</small></article>
            <article><span>N → E/U</span><strong>{{ unemploymentResult.stock_flow.participation_entry_pct }}%</strong><small>进入劳动力市场</small></article>
            <article><span>E/U → N</span><strong>{{ unemploymentResult.stock_flow.labor_force_exit_pct }}%</strong><small>退出劳动力市场</small></article>
          </div>
        </section>

        <aside class="boundary-note">
          <strong>解释边界：</strong>{{ boundaryCopy }}
        </aside>
      </template>
    </LabDashboardLayout>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { apiUrl } from '../lib/api'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import LabDashboardLayout from '../components/LabDashboardLayout.vue'
import LearningTaskCard from '../components/LearningTaskCard.vue'

use([BarChart, LineChart, GridComponent, LegendComponent, MarkPointComponent, TooltipComponent, CanvasRenderer])

const route = useRoute()
const ControlRange = defineComponent({
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    modelValue: { type: Number, required: true },
    displayValue: { type: [String, Number], default: null },
    unit: { type: String, default: '' },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'control-group' }, [
      h('label', { for: props.id }, [
        props.label,
        h('span', `${props.displayValue ?? props.modelValue}${props.unit}`),
      ]),
      h('input', {
        id: props.id,
        type: 'range',
        min: props.min,
        max: props.max,
        step: props.step,
        value: props.modelValue,
        onInput: event => emit('update:modelValue', Number(event.target.value)),
      }),
    ])
  },
})

const tabs = [
  { key: 'stock', label: '失业类型与存量流量' },
  { key: 'search', label: '工作搜寻与保留工资' },
  { key: 'dmp', label: 'DMP匹配' },
  { key: 'beveridge', label: '贝弗里奇曲线' },
  { key: 'minimum', label: '最低工资情景' },
]
const activeTab = ref('stock')
const naturalRate = ref(5)
const mismatch = ref(0.8)
const aiRisk = ref(30)
const demandShock = ref(0)
const benefit = ref(2500)
const searchCost = ref(800)
const expectedOffer = ref(6500)
const patience = ref(0.45)
const dmpUnemployed = ref(120)
const dmpVacancies = ref(80)
const dmpEfficiency = ref(0.65)
const dmpSeparation = ref(0.025)
const skillTraining = ref(false)
const minimumWage = ref(28)
const averageWage = ref(54)
const employment = ref(870)
const demandElasticity = ref(-0.15)
const unemploymentResult = ref(null)
const searchResult = ref(null)
const dmpResult = ref(null)
const beveridgeResult = ref(null)
const minimumWageResult = ref(null)
let timer = null

const resultType = computed(() =>
  activeTab.value === 'minimum' ? '教学情景参数' : '教材机制模拟')
const formula = computed(() => ({
  stock: 'u*=s/(s+f)，失业存量由流入与流出共同决定',
  search: '接受报价当且仅当 W_offer >= W_reservation',
  dmp: 'M=mU^alpha V^(1-alpha)，theta=V/U',
  beveridge: '稳态匹配条件决定 u 与 v 的反向关系',
  minimum: 'Kaitz=最低工资/平均工资，Delta L/L=elasticity*工资约束幅度',
}[activeTab.value]))
const assumptions = computed(() => ({
  stock: '流入流出率按月计量；摩擦性、结构性和周期性机制分别计算。',
  search: '工资报价分布与搜寻成本在单次情景中稳定。',
  dmp: '匹配函数给出连续时间风险率，页面显示值转换为单月概率。',
  beveridge: '技能错配改变整条曲线，需求侧冲击主要使运行点沿曲线移动。',
  minimum: '就业结果取决于用户选择的劳动需求弹性，不引用无来源的国家基准。',
}[activeTab.value]))
const taskCopy = computed(() => ({
  stock: { task: '调整技能错配、AI冲击和需求冲击，比较失业构成与存量流动。', observe: '重点区分自然失业、摩擦性失业和结构性失业，避免重复计数。' },
  search: { task: '调整救济、搜寻成本和工资报价，观察保留工资与搜寻期限。', observe: '重点看救济提高后，保留工资和接受报价概率如何变化。' },
  dmp: { task: '调整失业人数、岗位空缺和匹配效率，观察稳态失业率。', observe: '重点看风险率如何转换为0%至100%的单月概率。' },
  beveridge: { task: '调整技能错配与AI冲击，区分沿曲线移动和整条曲线外移。', observe: '重点比较基准曲线、当前曲线和当前运行点。' },
  minimum: { task: '调整最低工资、平均工资和需求弹性，比较就业变化情景。', observe: '重点看Kaitz指数和弹性假设如何共同影响结果区间。' },
}[activeTab.value]))

const currentConclusion = computed(() => {
  if (activeTab.value === 'stock' && unemploymentResult.value) {
    const entries = Object.entries(unemploymentResult.value.breakdown).sort((a, b) => b[1] - a[1])
    const label = { frictional: '摩擦性', structural: '结构性', minimum_wage_effect: '最低工资', technological: '技术性', cyclical: '周期性' }[entries[0][0]]
    return `当前情景下${label}因素贡献最高，模型总失业率为${unemploymentResult.value.total_unemployment_rate}%。`
  }
  if (activeTab.value === 'search') return searchResult.value?.explanation || ''
  if (activeTab.value === 'dmp') return dmpResult.value?.diagnosis || ''
  if (activeTab.value === 'beveridge') return beveridgeResult.value?.diagnosis_text || ''
  if (minimumWageResult.value) return `当前Kaitz指数为${minimumWageResult.value.kaitz_index}，在需求弹性${demandElasticity.value}的教学假设下，就业变化为${minimumWageResult.value.employment_change_pct}%。`
  return ''
})

const currentMetrics = computed(() => {
  if (activeTab.value === 'stock' && unemploymentResult.value) {
    return [
      { label: '模型总失业率', value: `${unemploymentResult.value.total_unemployment_rate}%` },
      { label: '自然失业机制', value: `${unemploymentResult.value.natural_unemployment_rate}%` },
      { label: '求职成功概率', value: `${unemploymentResult.value.stock_flow.job_finding_probability_pct}%` },
      { label: '岗位分离率', value: `${unemploymentResult.value.stock_flow.separation_rate_pct}%` },
    ]
  }
  if (activeTab.value === 'search' && searchResult.value) {
    return [
      { label: '保留工资', value: `${searchResult.value.reservation_wage.toLocaleString()}元` },
      { label: '接受报价概率', value: `${searchResult.value.acceptance_probability_pct}%` },
      { label: '预期搜寻期限', value: `${searchResult.value.expected_search_duration_months}个月` },
      { label: '预期工资报价', value: `${expectedOffer.value.toLocaleString()}元` },
    ]
  }
  if (activeTab.value === 'dmp' && dmpResult.value) {
    return [
      { label: '市场紧张度 θ', value: dmpResult.value.theta },
      { label: '单月求职成功概率', value: `${dmpResult.value.job_finding_rate}%` },
      { label: '单月岗位填补概率', value: `${dmpResult.value.vacancy_filling_rate}%` },
      { label: '稳态失业率', value: `${dmpResult.value.steady_unemployment_rate}%` },
    ]
  }
  if (activeTab.value === 'beveridge' && beveridgeResult.value) {
    return [
      { label: '当前失业率', value: `${beveridgeResult.value.u_current}%` },
      { label: '当前空缺率', value: `${beveridgeResult.value.v_current}%` },
      { label: '自然失业率', value: `${beveridgeResult.value.u_natural}%` },
      { label: '变化类型', value: beveridgeResult.value.movement_type },
    ]
  }
  if (minimumWageResult.value) {
    return [
      { label: 'Kaitz指数', value: minimumWageResult.value.kaitz_index },
      { label: '就业变化', value: `${minimumWageResult.value.employment_change_pct}%` },
      { label: '情景就业人数', value: `${minimumWageResult.value.predicted_employment}万` },
      { label: '需求弹性假设', value: demandElasticity.value.toFixed(2) },
    ]
  }
  return []
})

const recordParameters = computed(() => ({
  主题页签: tabs.find(item => item.key === activeTab.value)?.label,
  自然失业率: `${naturalRate.value}%`,
  技能错配: mismatch.value,
  AI冲击: `${aiRisk.value}%`,
  失业救济: `${benefit.value}元/月`,
  匹配效率: dmpEfficiency.value,
  最低工资: `${minimumWage.value}元/小时`,
}))
const recordMetrics = computed(() =>
  Object.fromEntries(currentMetrics.value.map(item => [item.label, item.value])))

const chartTitle = computed(() => ({
  stock: '失业率向当前情景稳态收敛（48个月）',
  search: '工资报价与接受概率',
  dmp: '匹配效率提高如何改变求职概率与稳态失业率',
  beveridge: '基准曲线、当前曲线与运行点',
  minimum: '不同劳动需求弹性下的就业变化',
}[activeTab.value]))
const chartExplanation = computed(() => ({
  stock: '曲线展示初始冲击逐步收敛到当前结构性、摩擦性和周期性因素共同决定的水平。',
  search: '报价越高于保留工资，接受概率越高；保留工资并不是法定最低工资。',
  dmp: '图中概率由连续时间风险率转换得到，因此始终位于0%至100%之间。',
  beveridge: '沿曲线移动主要反映总需求变化；匹配效率和技能错配会改变整条曲线的位置。',
  minimum: '不同柱形代表不同劳动需求弹性假设，不能把单一参数结果当作现实预测。',
}[activeTab.value]))
const boundaryCopy = computed(() => ({
  stock: '自然失业率是摩擦性与结构性机制的综合结果，页面没有把它再次作为摩擦性失业叠加。',
  search: '保留工资取决于偏好、救济、搜寻成本和报价预期，不是对劳动者“懒惰”的价值判断。',
  dmp: '匹配量不超过当期失业者和岗位空缺的可匹配存量。',
  beveridge: '曲线是教材机制模拟，不是官方统计数据拟合。',
  minimum: '没有可靠地区估计时，页面只做弹性情景比较，不提供所谓国家标准答案。',
}[activeTab.value]))

const currentChart = computed(() => {
  if (activeTab.value === 'stock' && unemploymentResult.value) {
    return lineOption(
      unemploymentResult.value.time_series.months,
      [{ name: '失业率', data: unemploymentResult.value.time_series.unemployment_rate, color: '#ef4444' }],
      '月',
      '失业率(%)',
    )
  }
  if (activeTab.value === 'search' && searchResult.value) {
    return lineOption(
      searchResult.value.curve.map(item => item.offer),
      [{ name: '接受概率', data: searchResult.value.curve.map(item => item.acceptance_probability_pct), color: '#8b5cf6' }],
      '工资报价(元/月)',
      '接受概率(%)',
    )
  }
  if (activeTab.value === 'dmp' && dmpResult.value) {
    return lineOption(
      dmpResult.value.curve.map(item => item.matching_efficiency),
      [
        { name: '求职成功概率', data: dmpResult.value.curve.map(item => item.job_finding_rate), color: '#06b6d4' },
        { name: '稳态失业率', data: dmpResult.value.curve.map(item => item.steady_unemployment_rate), color: '#f59e0b' },
      ],
      '匹配效率',
      '比率(%)',
    )
  }
  if (activeTab.value === 'beveridge' && beveridgeResult.value) {
    return {
      animationDuration: 500,
      grid: { top: 48, right: 24, bottom: 46, left: 62 },
      legend: { top: 0, textStyle: { color: '#94a3b8' } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', min: 0, max: 15, name: '失业率u(%)', axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', min: 0, max: 15, name: '空缺率v(%)', axisLabel: { color: '#94a3b8' } },
      series: [
        { name: '基准曲线', type: 'line', data: beveridgeResult.value.baseline_curve_points.map(item => [item.u, item.v]), symbol: 'none', lineStyle: { color: '#64748b', type: 'dashed', width: 2 } },
        {
          name: '当前曲线',
          type: 'line',
          data: beveridgeResult.value.curve_points.map(item => [item.u, item.v]),
          symbol: 'none',
          lineStyle: { color: '#8b5cf6', width: 3 },
          markPoint: { data: [{ coord: [beveridgeResult.value.u_current, beveridgeResult.value.v_current], name: '当前运行点', symbol: 'pin', symbolSize: 36, itemStyle: { color: '#ef4444' } }] },
        },
      ],
    }
  }
  if (minimumWageResult.value) {
    return {
      animationDuration: 500,
      grid: { top: 28, right: 24, bottom: 46, left: 62 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: minimumWageResult.value.scenarios.map(item => item.elasticity), name: '劳动需求弹性', axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', name: '就业变化(%)', axisLabel: { color: '#94a3b8' } },
      series: [{ type: 'bar', data: minimumWageResult.value.scenarios.map(item => item.employment_change_pct), itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } }],
    }
  }
  return {}
})

function lineOption(x, series, xName, yName) {
  return {
    animationDuration: 500,
    grid: { top: 48, right: 24, bottom: 48, left: 62 },
    legend: { top: 0, textStyle: { color: '#94a3b8' } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: x, name: xName, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', name: yName, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.12)' } } },
    series: series.map(item => ({ name: item.name, type: 'line', data: item.data, symbol: 'none', lineStyle: { color: item.color, width: 3 }, itemStyle: { color: item.color } })),
  }
}

async function runAll() {
  const [unemployment, search, dmp, beveridge, minimum] = await Promise.all([
    axios.post(apiUrl('/api/v2/macro/unemployment'), {
      natural_rate: naturalRate.value,
      min_wage: minimumWage.value,
      unemployment_benefit: benefit.value,
      skill_mismatch: mismatch.value,
      ai_risk: aiRisk.value,
      labor_demand_shock: demandShock.value,
    }),
    axios.post(apiUrl('/api/v2/macro/search'), {
      benefit: benefit.value,
      search_cost: searchCost.value,
      expected_offer: expectedOffer.value,
      patience: patience.value,
    }),
    axios.post(apiUrl('/api/v2/macro/dmp'), {
      unemployed: dmpUnemployed.value,
      vacancies: dmpVacancies.value,
      matching_efficiency: dmpEfficiency.value,
      separation_rate: dmpSeparation.value,
      alpha: 0.5,
    }),
    axios.post(apiUrl('/api/v2/macro/beveridge'), {
      mismatch_index: mismatch.value,
      ai_risk: aiRisk.value,
      active_policies: skillTraining.value ? ['技能重塑补贴'] : [],
    }),
    axios.post(apiUrl('/api/v2/macro/min-wage-impact'), {
      min_wage: minimumWage.value,
      avg_wage: averageWage.value,
      employment: employment.value,
      demand_elasticity: demandElasticity.value,
    }),
  ])
  unemploymentResult.value = unemployment.data
  searchResult.value = search.data
  dmpResult.value = dmp.data
  beveridgeResult.value = beveridge.data
  minimumWageResult.value = minimum.data
}

function scheduleRun() {
  clearTimeout(timer)
  timer = setTimeout(runAll, 180)
}

function resetCurrent() {
  const resets = {
    stock: () => { naturalRate.value = 5; mismatch.value = 0.8; aiRisk.value = 30; demandShock.value = 0 },
    search: () => { benefit.value = 2500; searchCost.value = 800; expectedOffer.value = 6500; patience.value = 0.45 },
    dmp: () => { dmpUnemployed.value = 120; dmpVacancies.value = 80; dmpEfficiency.value = 0.65; dmpSeparation.value = 0.025 },
    beveridge: () => { mismatch.value = 0.8; aiRisk.value = 30; skillTraining.value = false },
    minimum: () => { minimumWage.value = 28; averageWage.value = 54; employment.value = 870; demandElasticity.value = -0.15 },
  }
  resets[activeTab.value]()
}

watch([
  naturalRate,
  mismatch,
  aiRisk,
  demandShock,
  benefit,
  searchCost,
  expectedOffer,
  patience,
  dmpUnemployed,
  dmpVacancies,
  dmpEfficiency,
  dmpSeparation,
  skillTraining,
  minimumWage,
  averageWage,
  employment,
  demandElasticity,
], scheduleRun)
onMounted(() => {
  if (route.query.preset === 'structural') {
    activeTab.value = 'beveridge'
    mismatch.value = 1.6
    aiRisk.value = 60
    skillTraining.value = false
  }
  runAll()
})
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 72px; }
.lab-header { margin-bottom: 24px; }
.back-link { color: #94a3b8; text-decoration: none; font-size: 14px; }
.chapter-kicker { display: block; margin-top: 18px; color: #ef4444; font-size: 12px; font-weight: 800; }
.lab-header h1 { margin: 7px 0; color: #f8fafc; font-size: 34px; font-weight: 900; }
.lab-header p { margin: 0; color: #94a3b8; line-height: 1.7; }
.topic-tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px; }
.topic-tabs button { min-height: 40px; flex: 0 0 auto; padding: 9px 14px; border: 1px solid rgba(148,163,184,.18); border-radius: 7px; color: #cbd5e1; background: rgba(30,41,59,.66); cursor: pointer; font-weight: 750; }
.topic-tabs button.active { color: #fff; border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.15); }
.lab-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; gap: 16px; padding: 18px; margin-bottom: 12px; border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.52); }
:deep(.control-group) { min-width: 0; }
:deep(.control-group label) { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: #cbd5e1; font-size: 14px; }
:deep(.control-group label span) { color: #f87171; font-weight: 800; }
:deep(.control-group input[type="range"]) { width: 100%; accent-color: #ef4444; }
.toggle-control { display: flex; align-items: center; gap: 10px; min-height: 44px; color: #e2e8f0; }
.toggle-control input { width: 18px; height: 18px; accent-color: #22c55e; }
.reset-btn { margin-bottom: 22px; padding: 9px 13px; border: 1px solid rgba(148,163,184,.2); border-radius: 6px; color: #cbd5e1; background: rgba(15,23,42,.7); cursor: pointer; }
.metric-grid, .flow-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
.metric-grid article, .flow-grid article, .chart-card, .stock-flow-panel, .boundary-note { min-width: 0; border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.5); }
.metric-grid article, .flow-grid article { padding: 16px; }
.metric-grid span, .flow-grid span, .flow-grid small { color: #94a3b8; font-size: 12px; }
.metric-grid strong, .flow-grid strong { display: block; margin: 7px 0; color: #f8fafc; font-size: 21px; overflow-wrap: anywhere; }
.chart-card { padding: 18px; }
.chart-card h2, .stock-flow-panel h2 { margin: 0 0 12px; color: #e2e8f0; font-size: 18px; }
.chart-explanation, .boundary-note { color: #cbd5e1; font-size: 14px; line-height: 1.75; }
.chart-explanation { margin: 6px 0 0; padding: 13px 15px; background: rgba(6,182,212,.07); border-left: 3px solid #06b6d4; }
.stock-flow-panel { margin-top: 18px; padding: 18px; }
.flow-grid { margin: 0; }
.boundary-note { display: block; margin-top: 18px; padding: 16px; }
.boundary-note strong { color: #f8fafc; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #67e8f9; outline-offset: 2px; }
@media (max-width: 900px) {
  .lab-controls, .metric-grid, .flow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px) {
  .lab { padding: 28px 16px 88px; }
  .lab-header h1 { font-size: 28px; }
  .lab-controls, .metric-grid, .flow-grid { grid-template-columns: 1fr; }
}
</style>
