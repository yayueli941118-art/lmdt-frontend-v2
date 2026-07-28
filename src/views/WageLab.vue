<template>
  <ExperimentWorkspace
      class="lab"
      title="工资决定与工资形式"
      subtitle="工资概念 · 效率工资 · 补偿性差异 · 激励工资 · 工资经验方程"
      kicker="CH.06 · 工资理论"
      :chart-tabs="wageChartTabs"
      v-model:active-chart="activeChart"
      :change-key="[activeTab, referenceWage, theoryWage, effortSensitivity, risk, inconvenience, performanceShare, targetCompletion, education, experience, industry, region]"
      @reset="resetWage"
      :result-type="resultType"
      :formula="modelFormula"
      :assumptions="modelAssumptions"
      source="教材第六章工资概念、工资理论、效率工资与激励工资；工资经验方程交叉映射第四章人力资本。"
      scope="比较工资与努力、流失风险、工作条件补偿和绩效报酬之间的机制关系。"
      limitation="现实行业工资标准、个体工资预测或企业最优薪酬方案。"
    >
      <template #controls>
        <nav class="theory-tabs" aria-label="工资理论页签">
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

        <section v-if="activeTab === 'efficiency'" class="lab-controls">
          <div class="control-group">
            <label for="reference-wage">市场参照月薪 <span>{{ referenceWage.toLocaleString() }}元</span></label>
            <input id="reference-wage" v-model.number="referenceWage" type="range" min="3000" max="12000" step="100">
          </div>
          <div class="control-group">
            <label for="efficiency-wage">企业月薪 <span>{{ theoryWage.toLocaleString() }}元</span></label>
            <input id="efficiency-wage" v-model.number="theoryWage" type="range" min="3000" max="15000" step="100">
          </div>
          <div class="control-group">
            <label for="effort-sensitivity">努力响应强度 <span>{{ effortSensitivity.toFixed(2) }}</span></label>
            <input id="effort-sensitivity" v-model.number="effortSensitivity" type="range" min="0" max="1" step="0.05">
          </div>
          <button type="button" class="btn-run" @click="resetWage">恢复默认参数</button>
        </section>

        <section v-else-if="activeTab === 'compensating'" class="lab-controls">
          <div class="control-group">
            <label for="comp-reference">基准月薪 <span>{{ referenceWage.toLocaleString() }}元</span></label>
            <input id="comp-reference" v-model.number="referenceWage" type="range" min="3000" max="12000" step="100">
          </div>
          <div class="control-group">
            <label for="job-risk">工作风险/不舒适度 <span>{{ risk }}</span></label>
            <input id="job-risk" v-model.number="risk" type="range" min="0" max="100" step="1">
          </div>
          <div class="control-group">
            <label for="job-inconvenience">夜班与时间不便利 <span>{{ inconvenience }}</span></label>
            <input id="job-inconvenience" v-model.number="inconvenience" type="range" min="0" max="100" step="1">
          </div>
          <button type="button" class="btn-run" @click="resetWage">恢复默认参数</button>
        </section>

        <section v-else-if="activeTab === 'incentive'" class="lab-controls">
          <div class="control-group">
            <label for="fixed-wage">固定月薪 <span>{{ theoryWage.toLocaleString() }}元</span></label>
            <input id="fixed-wage" v-model.number="theoryWage" type="range" min="3000" max="15000" step="100">
          </div>
          <div class="control-group">
            <label for="performance-share">绩效浮动比例 <span>{{ performanceShare }}%</span></label>
            <input id="performance-share" v-model.number="performanceShare" type="range" min="0" max="80" step="5">
          </div>
          <div class="control-group">
            <label for="target-completion">目标完成度 <span>{{ targetCompletion }}%</span></label>
            <input id="target-completion" v-model.number="targetCompletion" type="range" min="0" max="150" step="5">
          </div>
          <button type="button" class="btn-run" @click="resetWage">恢复默认参数</button>
        </section>

        <section v-else-if="activeTab === 'mincer'" class="lab-controls mincer-controls">
          <div class="control-group">
            <label for="wage-education">受教育年限 <span>{{ education }}年</span></label>
            <input id="wage-education" v-model.number="education" type="range" min="9" max="22" step="1">
          </div>
          <div class="control-group">
            <label for="wage-experience">工作经验 <span>{{ experience }}年</span></label>
            <input id="wage-experience" v-model.number="experience" type="range" min="0" max="40" step="1">
          </div>
          <div class="control-group">
            <label for="wage-industry">行业情景</label>
            <select id="wage-industry" v-model="industry">
              <option v-for="item in industries" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="control-group">
            <label for="wage-region">地区情景</label>
            <select id="wage-region" v-model="region">
              <option v-for="item in regions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <router-link class="cross-link" to="/lab/individual">进入第4章人力资本实验</router-link>
          <button type="button" class="btn-run" @click="resetWage">恢复默认参数</button>
        </section>
      </template>

      <template #task>
        <LearningTaskCard
          :task="learningTask"
          :observe="learningObserve"
          :conclusion="wageConclusion"
        />
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="工资理论与工资经验方程"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="wageConclusion"
          model-version="wage-theory-2.1"
          :source-type="resultType"
        />
      </template>

      <template #metrics>
        <section v-if="activeTab === 'concepts'" class="concept-grid">
          <article v-for="item in wageConcepts" :key="item.title">
            <span>{{ item.category }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.desc }}</p>
          </article>
        </section>
        <section v-else-if="activeTab === 'mincer' && distribution" class="metric-grid">
          <article><span>合成样本均值</span><strong>{{ distribution.statistics.mean.toLocaleString() }}元</strong></article>
          <article><span>中位数</span><strong>{{ distribution.statistics.median.toLocaleString() }}元</strong></article>
          <article><span>工资样本Gini</span><strong>{{ distribution.statistics.gini }}</strong></article>
          <article><span>P90/P10</span><strong>{{ distribution.statistics.p90_p10_ratio }}倍</strong></article>
        </section>
        <section v-else-if="theoryResult" class="metric-grid">
          <article v-for="item in theoryMetrics" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </section>
      </template>

      <template #primary>
        <section v-if="activeTab === 'concepts'" class="reading-panel">
          <h2>先区分“工资是什么”，再讨论“工资为什么不同”</h2>
          <p>货币工资需要结合价格水平解释实际购买力；计时、计件和绩效工资是不同的支付形式；工资差异还可能来自人力资本、工作条件、制度安排与信息不完全。</p>
        </section>

        <section v-else-if="activeTab === 'mincer' && distribution" class="chart-card">
          <template v-if="activeChart === 'histogram'">
            <h2>1000个合成工资样本分布</h2>
            <v-chart class="workspace-chart-canvas" :option="histogramOption" autoresize aria-label="合成工资样本分布图" />
          </template>
          <template v-else>
            <h2>工资分位数</h2>
            <v-chart class="workspace-chart-canvas" :option="decileOption" autoresize aria-label="工资分位数折线图" />
          </template>
        </section>

        <section v-else-if="theoryResult" class="chart-card">
          <h2>{{ theoryResult.headline }}：参数变化与结果</h2>
          <v-chart class="workspace-chart-canvas" :option="theoryOption" autoresize :aria-label="`${theoryResult.headline}情景曲线`" />
          <p class="model-note">{{ theoryResult.explanation }}</p>
        </section>
      </template>

      <template #change>
        默认参数为基准 → {{ wageConclusion || '选择一个工资理论视角开始比较' }}
      </template>

      <template #analysis>
        <aside v-if="activeTab === 'mincer'" class="boundary-note">
          <strong>章节边界：</strong>
          明瑟工资经验方程用于经验分析教育与经验和工资之间的条件相关关系，主要映射第4章人力资本。行业和地区系数在本页只是教学情景参数，不能当作现实工资溢价估计。
        </aside>
        <aside v-else class="boundary-note">
          <strong>读图提醒：</strong>
          当前曲线表达教材机制和方向，不是企业薪酬处方。真实决策还要考虑生产技术、岗位风险、劳动合同、绩效可测量性和市场制度。
        </aside>
      </template>
  </ExperimentWorkspace>
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
import { createRealtimeScheduler } from '../lib/realtime'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import LearningTaskCard from '../components/LearningTaskCard.vue'

use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const tabs = [
  { key: 'concepts', label: '工资概念与形式' },
  { key: 'efficiency', label: '效率工资' },
  { key: 'compensating', label: '补偿性差异' },
  { key: 'incentive', label: '激励工资' },
  { key: 'mincer', label: '工资经验方程' },
]
const activeTab = ref('efficiency')
const activeChart = ref('histogram')
const wageChartTabs = computed(() => activeTab.value === 'mincer'
  ? [
      { key: 'histogram', label: '工资分布' },
      { key: 'decile', label: '工资分位数' },
    ]
  : [])
const referenceWage = ref(6000)
const theoryWage = ref(7200)
const effortSensitivity = ref(0.35)
const risk = ref(35)
const inconvenience = ref(25)
const performanceShare = ref(25)
const targetCompletion = ref(90)
const theoryResult = ref(null)
const education = ref(16)
const experience = ref(5)
const industry = ref('信息技术')
const region = ref('一线城市')
const distribution = ref(null)
const mincer = ref(null)

const industries = ['信息技术', '金融业', '制造业', '建筑业', '批发零售', '住宿餐饮', '教育', '医疗', '交通运输', '农业']
const regions = ['一线城市', '新一线城市', '二线城市', '三线及以下']
const wageConcepts = [
  { category: '计量口径', title: '货币工资与实际工资', desc: '货币工资是名义支付额，实际工资还要结合价格水平和可购买的商品服务解释。' },
  { category: '支付形式', title: '计时工资与计件工资', desc: '计时工资按劳动时间支付，计件工资按可观察产出支付，两者承担的风险和激励结构不同。' },
  { category: '报酬边界', title: '工资与劳动报酬', desc: '劳动报酬还可能包括奖金、津贴、福利、培训和晋升机会，不能只看基本工资。' },
  { category: '制度条件', title: '最低工资与集体协商', desc: '制度会影响工资底线和议价过程，效果取决于覆盖范围、执行和劳动需求条件。' },
]

const resultType = computed(() =>
  activeTab.value === 'mincer' ? '合成工资样本与教学情景参数' : '教材机制模拟')
const modelFormula = computed(() => ({
  concepts: '实际工资=货币工资/价格水平',
  efficiency: 'effort=e(W/W_ref)，turnover=t(W/W_ref)',
  compensating: '所需工资=参照工资+工作条件补偿',
  incentive: '总报酬=固定工资+绩效浮动报酬',
  mincer: 'ln(W)=beta0+beta1*S+beta2*Exp+beta3*Exp^2',
}[activeTab.value]))
const modelAssumptions = computed(() =>
  activeTab.value === 'mincer'
    ? '1000个样本由确定性教学公式合成；行业和地区系数未用现实数据估计。'
    : '其他岗位特征保持不变，单次情景只比较所选工资机制的方向。')
const learningTask = computed(() => ({
  concepts: '区分工资计量口径和支付形式，判断同一“工资”数字背后可能包含哪些报酬项目。',
  efficiency: '调整企业工资与市场参照工资，观察努力指数和流失风险如何同时变化。',
  compensating: '提高工作风险或时间不便利程度，观察所需工资补偿如何变化。',
  incentive: '调整绩效浮动比例与目标完成度，比较固定报酬和浮动报酬的组合。',
  mincer: '调整教育、经验、行业和地区情景，观察合成工资分布如何变化。',
}[activeTab.value]))
const learningObserve = computed(() => ({
  concepts: '重点区分名义与实际、固定与浮动、现金与非现金报酬。',
  efficiency: '重点看更高工资是否同时提高努力指数并降低流失风险。',
  compensating: '重点看工资差异是否来自工作条件，而不只是劳动者能力。',
  incentive: '重点看浮动报酬如何提高激励，同时把风险转移给劳动者。',
  mincer: '重点看条件相关关系和合成分布，不把情景系数误读为现实估计。',
}[activeTab.value]))

const theoryMetrics = computed(() => {
  if (!theoryResult.value) return []
  const labels = {
    wage: '企业月薪',
    effort_index: '努力/生产率指数',
    turnover_risk: '流失风险',
    wage_premium_pct: '工资溢价',
    reference_wage: '基准月薪',
    required_wage: '所需月薪',
    compensation: '条件补偿',
    fixed_wage: '固定月薪',
    performance_pay: '绩效报酬',
    total_pay: '总报酬',
  }
  return Object.entries(theoryResult.value.metrics).map(([key, value]) => ({
    label: labels[key] || key,
    value: /wage|pay|compensation/.test(key)
      ? `${Number(value).toLocaleString()}元`
      : /pct|risk/.test(key) ? `${value}%` : value,
  }))
})

const wageConclusion = computed(() => {
  if (activeTab.value === 'concepts') return '先明确工资口径和支付形式，才能比较工资水平与工资差异。'
  if (activeTab.value === 'mincer' && distribution.value) {
    return `当前教学参数生成1000个合成样本，月薪中位数为${distribution.value.statistics.median.toLocaleString()}元，P90/P10为${distribution.value.statistics.p90_p10_ratio}倍。`
  }
  return theoryResult.value?.explanation || ''
})

const recordParameters = computed(() => {
  if (activeTab.value === 'mincer') {
    return { 页签: '工资经验方程', 受教育年限: `${education.value}年`, 工作经验: `${experience.value}年`, 行业情景: industry.value, 地区情景: region.value }
  }
  return {
    页签: tabs.find(item => item.key === activeTab.value)?.label,
    市场参照月薪: `${referenceWage.value}元`,
    企业或固定月薪: `${theoryWage.value}元`,
    工作风险: risk.value,
    绩效浮动比例: `${performanceShare.value}%`,
  }
})
const recordMetrics = computed(() => {
  if (activeTab.value === 'mincer' && distribution.value) {
    return {
      合成样本中位数: `${distribution.value.statistics.median}元`,
      工资样本Gini: distribution.value.statistics.gini,
      'P90/P10': `${distribution.value.statistics.p90_p10_ratio}倍`,
    }
  }
  return Object.fromEntries(theoryMetrics.value.map(item => [item.label, item.value]))
})

const theoryOption = computed(() => {
  if (!theoryResult.value) return {}
  const chart = theoryResult.value.chart
  const series = [{
    name: chart.primary_name,
    type: 'line',
    data: chart.primary,
    symbolSize: 6,
    lineStyle: { color: '#f59e0b', width: 3 },
    itemStyle: { color: '#f59e0b' },
  }]
  if (chart.secondary) {
    series.push({
      name: chart.secondary_name,
      type: 'line',
      data: chart.secondary,
      symbolSize: 6,
      lineStyle: { color: '#06b6d4', width: 3 },
      itemStyle: { color: '#06b6d4' },
    })
  }
  return {
    animationDuration: 500,
    animationDurationUpdate: 400,
    grid: { top: 48, right: 24, bottom: 48, left: 62 },
    legend: { top: 0, textStyle: { color: '#94a3b8' } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: chart.x, name: activeTab.value === 'efficiency' ? '月薪(元)' : activeTab.value === 'compensating' ? '风险指数' : '绩效比例(%)', axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.12)' } } },
    series,
  }
})

const histogramOption = computed(() => {
  if (!distribution.value) return {}
  return {
    animationDuration: 500,
    animationDurationUpdate: 400,
    grid: { top: 28, right: 20, bottom: 70, left: 58 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: distribution.value.distribution.bins.map(value => Math.round(value).toLocaleString()), axisLabel: { color: '#94a3b8', rotate: 35, interval: 1 }, name: '月薪区间起点' },
    yAxis: { type: 'value', name: '合成样本频数', axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'bar', data: distribution.value.distribution.frequencies, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } }],
  }
})

const decileOption = computed(() => {
  if (!distribution.value) return {}
  return {
    animationDuration: 500,
    animationDurationUpdate: 400,
    grid: { top: 28, right: 20, bottom: 44, left: 62 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: distribution.value.deciles.map(item => `P${item.percentile}`), axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', name: '月薪(元)', axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'line', data: distribution.value.deciles.map(item => item.value), lineStyle: { color: '#06b6d4', width: 3 }, itemStyle: { color: '#06b6d4' } }],
  }
})

async function runTheory() {
  if (activeTab.value === 'concepts' || activeTab.value === 'mincer') return
  const { data } = await axios.post(apiUrl('/api/v2/wage/theory'), {
    mode: activeTab.value,
    reference_wage: referenceWage.value,
    wage: theoryWage.value,
    effort_sensitivity: effortSensitivity.value,
    risk: risk.value,
    inconvenience: inconvenience.value,
    performance_share: performanceShare.value,
    target_completion: targetCompletion.value,
  })
  theoryResult.value = data
}

async function runMincer() {
  const [distributionResponse, mincerResponse] = await Promise.all([
    axios.post(apiUrl('/api/v2/wage/distribution'), {
      edu_years: education.value,
      exp_years: experience.value,
      industry: industry.value,
      region: region.value,
    }),
    axios.post(apiUrl('/api/v2/wage/mincer'), {
      edu_years: education.value,
      exp_years: experience.value,
      gender: 'all',
      ownership: 'all',
      union_member: false,
    }),
  ])
  distribution.value = distributionResponse.data
  mincer.value = mincerResponse.data
}

function resetWage() {
  referenceWage.value = 6000
  theoryWage.value = 7200
  effortSensitivity.value = 0.35
  risk.value = 35
  inconvenience.value = 25
  performanceShare.value = 25
  targetCompletion.value = 90
  education.value = 16
  experience.value = 5
  industry.value = '信息技术'
  region.value = '一线城市'
  runTheory()
  runMincer()
}

const schedule = createRealtimeScheduler(
  () => (activeTab.value === 'mincer' ? runMincer() : runTheory()),
  80,
)

watch([
  activeTab,
  referenceWage,
  theoryWage,
  effortSensitivity,
  risk,
  inconvenience,
  performanceShare,
  targetCompletion,
  education,
  experience,
  industry,
  region,
], schedule)

onMounted(() => {
  runTheory()
  runMincer()
})
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 72px; }
.lab-header { margin-bottom: 24px; }
.back-link { color: #94a3b8; text-decoration: none; font-size: 14px; }
.chapter-kicker { display: block; margin-top: 18px; color: #f59e0b; font-size: 12px; font-weight: 800; }
.lab-header h1 { margin: 7px 0; color: #f8fafc; font-size: 34px; font-weight: 900; }
.lab-header p { margin: 0; color: #94a3b8; line-height: 1.7; }
.theory-tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px; padding-bottom: 3px; }
.theory-tabs button { min-height: 40px; flex: 0 0 auto; padding: 9px 14px; border: 1px solid rgba(148,163,184,.18); border-radius: 7px; color: #cbd5e1; background: rgba(30,41,59,.66); cursor: pointer; font-weight: 750; }
.theory-tabs button.active { color: #fff7ed; border-color: rgba(245,158,11,.55); background: rgba(245,158,11,.16); }
.lab-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: 16px; padding: 18px; margin-bottom: 22px; border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.52); }
.mincer-controls { grid-template-columns: repeat(4, minmax(0, 1fr)) auto; }
.control-group { min-width: 0; }
.control-group label { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: #cbd5e1; font-size: 14px; }
.control-group label span { color: #f59e0b; font-weight: 800; }
.control-group input[type="range"] { width: 100%; accent-color: #f59e0b; }
.control-group select { width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid rgba(148,163,184,.25); border-radius: 6px; color: #e2e8f0; background: #1e293b; }
.btn-run, .cross-link { min-height: 42px; padding: 10px 18px; border: 0; border-radius: 7px; color: #fff; background: #d97706; cursor: pointer; font-weight: 800; text-decoration: none; white-space: nowrap; }
.cross-link { display: inline-flex; align-items: center; background: #2563eb; }
.concept-grid, .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
.concept-grid article, .metric-grid article, .chart-card, .reading-panel, .boundary-note { border: 1px solid rgba(148,163,184,.12); border-radius: 8px; background: rgba(30,41,59,.5); }
.concept-grid article, .metric-grid article { min-width: 0; padding: 16px; }
.concept-grid span, .metric-grid span { color: #94a3b8; font-size: 12px; }
.concept-grid h2 { margin: 7px 0; color: #f8fafc; font-size: 17px; }
.concept-grid p, .reading-panel p, .model-note, .boundary-note { color: #cbd5e1; font-size: 14px; line-height: 1.75; }
.metric-grid strong { display: block; margin-top: 7px; color: #f8fafc; font-size: 22px; overflow-wrap: anywhere; }
.reading-panel { padding: 22px; }
.reading-panel h2, .chart-card h2 { margin: 0 0 10px; color: #e2e8f0; font-size: 18px; }
.chart-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; }
.chart-card { min-width: 0; padding: 18px; }
.model-note { margin: 8px 0 0; padding: 13px 15px; background: rgba(245,158,11,.08); border-left: 3px solid #f59e0b; }
.boundary-note { display: block; margin-top: 18px; padding: 16px; }
.boundary-note strong { color: #f8fafc; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #67e8f9; outline-offset: 2px; }
@media (max-width: 980px) {
  .lab-controls, .mincer-controls, .concept-grid, .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .lab { padding: 28px 16px 88px; }
  .lab-header h1 { font-size: 28px; }
  .lab-controls, .mincer-controls, .concept-grid, .metric-grid { grid-template-columns: 1fr; }
  .btn-run, .cross-link { justify-content: center; width: 100%; }
}
</style>
