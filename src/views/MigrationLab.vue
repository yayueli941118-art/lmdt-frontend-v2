<template>
  <ExperimentWorkspace
      class="lab"
      title="城市迁移决策模拟"
      subtitle="工资溢价 · 一次性成本 · 心理成本 · 家庭联动 · 回本窗口"
      kicker="CH.05 · 劳动力流动"
      :classroom-task="classroom.task"
      :classroom-presets="classroom.presets"
      @apply-preset="applyClassroomPreset"
      :chart-tabs="migrationChartTabs"
      v-model:active-chart="activeChart"
      :change-key="[migrateAge, wDiff, cMove, cPsych, discountRate, employmentProbability, wageGrowth, familyMigrate, spouseLoss]"
      :error="simulationError"
      @reset="resetMigration"
      formula="NPV=-C0+Σ[p×ΔW_t-C_t]/(1+r)^t"
      assumptions="目标地就业概率、工资增长率和成本路径由当前情景给定；60岁为默认观察终点。"
      source="教材第五章劳动力流动的人力资本投资决策框架。"
      scope="比较工资溢价、迁移成本、就业概率和贴现率对迁移选择的影响。"
      limitation="个体真实迁移选择、城市生活质量或未来工资的精确预测。"
    >
      <template #controls>
    <section class="control-band">
      <div class="control-group">
        <label>迁移年龄 <span>{{ migrateAge }} 岁</span></label>
        <input type="range" v-model.number="migrateAge" min="22" max="50" step="1">
      </div>
      <div class="control-group">
        <label>月工资溢价 <span>{{ formatCurrency(wDiff) }}</span></label>
        <input type="range" v-model.number="wDiff" min="0" max="15000" step="500">
      </div>
      <div class="control-group">
        <label>搬迁成本 <span>{{ formatCurrency(cMove) }}</span></label>
        <input type="range" v-model.number="cMove" min="0" max="120000" step="5000">
      </div>
      <div class="control-group">
        <label>心理/适应成本 <span>{{ formatCurrency(cPsych) }}/年</span></label>
        <input type="range" v-model.number="cPsych" min="0" max="50000" step="1000">
      </div>
      <div class="control-group">
        <label>贴现率 <span>{{ (discountRate * 100).toFixed(1) }}%</span></label>
        <input type="range" v-model.number="discountRate" min="0" max="0.15" step="0.005">
      </div>
      <div class="control-group">
        <label>目标地就业概率 <span>{{ Math.round(employmentProbability * 100) }}%</span></label>
        <input type="range" v-model.number="employmentProbability" min="0.4" max="1" step="0.05">
      </div>
      <div class="control-group">
        <label>工资溢价年增长 <span>{{ (wageGrowth * 100).toFixed(1) }}%</span></label>
        <input type="range" v-model.number="wageGrowth" min="-0.05" max="0.08" step="0.005">
      </div>
      <div class="control-group compact">
        <label class="checkbox-label">
          <input type="checkbox" v-model="familyMigrate">
          家庭联合迁移
        </label>
      </div>
      <div v-if="familyMigrate" class="control-group">
        <label>配偶年收入损失 <span>{{ formatCurrency(spouseLoss) }}/年</span></label>
        <input type="range" v-model.number="spouseLoss" min="0" max="120000" step="5000">
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '实时更新中...' : '刷新模拟' }}
      </button>
      <button class="btn-reset" type="button" @click="resetMigration">恢复默认参数</button>
    </section>
      </template>

      <template #task>
    <LearningTaskCard
      task="调整迁移年龄、工资溢价和迁移成本，先判断是否值得迁移。"
      observe="重点看累计 NPV 是否穿过 0 线，以及回本时间是否足够早。"
      :conclusion="migrationConclusion"
    />
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="城市迁移决策"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="migrationConclusion"
          model-version="migration-npv-2.1"
          source-type="教材公式与教学情景参数"
        />
      </template>

      <template #metrics>
    <section v-if="decision" class="metrics-grid">
      <div class="metric-card" :class="{ good: finalNpv > 0, warn: finalNpv <= 0 }">
        <span class="metric-label">最终 NPV</span>
        <strong>{{ formatCurrency(finalNpv) }}</strong>
      </div>
      <div class="metric-card" :class="{ good: paybackYear !== null, warn: paybackYear === null }">
        <span class="metric-label">回本时间</span>
        <strong>{{ paybackLabel }}</strong>
      </div>
      <div class="metric-card">
        <span class="metric-label">年净收益</span>
        <strong>{{ formatCurrency(annualNet) }}</strong>
      </div>
      <div class="metric-card" :class="{ good: wageGap >= requiredMonthlyPremium, warn: wageGap < requiredMonthlyPremium }">
        <span class="metric-label">最低月溢价门槛</span>
        <strong>{{ formatCurrency(requiredMonthlyPremium) }}</strong>
      </div>
    </section>
      </template>

      <template #primary>
        <div v-if="result && activeChart === 'npv'" class="chart-card">
          <h3>累计 NPV：是否越过 0 线</h3>
          <v-chart class="workspace-chart-canvas" :option="npvChart" autoresize />
        </div>
        <div v-else-if="result && activeChart === 'cost'" class="chart-card">
          <h3>成本收益拆解</h3>
          <v-chart class="workspace-chart-canvas" :option="waterfallChart" autoresize />
        </div>
        <div v-else-if="result" class="chart-card">
          <h3>贴现率敏感性：未来收益折现后还剩多少</h3>
          <v-chart class="workspace-chart-canvas" :option="sensitivityChart" autoresize />
        </div>
      </template>

      <template #change>
        0 元迁移门槛 → 当前 NPV {{ formatCurrency(finalNpv) }}；
        {{ decision?.title || '等待计算' }}，{{ paybackLabel }}。
      </template>

      <template #analysis>
    <section v-if="decision" class="threshold-card">
      <div class="threshold-copy">
        <h3>迁移门槛比较</h3>
        <p>
          当前月工资溢价是 <strong>{{ formatCurrency(wageGap) }}</strong>，
          至少需要 <strong>{{ formatCurrency(requiredMonthlyPremium) }}</strong> 才能在 60 岁前覆盖成本。
          差额为
          <strong :class="premiumGap >= 0 ? 'text-good' : 'text-warn'">
            {{ premiumGap >= 0 ? '+' : '' }}{{ formatCurrency(premiumGap) }}
          </strong>。
        </p>
      </div>
      <div class="gauge">
        <div class="gauge-track">
          <div class="gauge-fill" :class="premiumGap >= 0 ? 'fill-good' : 'fill-warn'" :style="{ width: gaugeWidth + '%' }"></div>
          <div class="gauge-marker" :style="{ left: thresholdPosition + '%' }"></div>
        </div>
        <div class="gauge-labels">
          <span>当前溢价</span>
          <span>迁移门槛</span>
        </div>
      </div>
    </section>

    <section v-if="decision" class="teaching-note">
      <strong>思考：</strong>
      迁移不是“工资高就去”，而是空间套利的净现值问题。年轻、工资溢价高、一次性成本低、家庭联动损失小，NPV 曲线更快穿过 0 线；反之，即使工资上涨，也可能因为回收期太短或家庭成本太高而不迁移。
    </section>
      </template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import { createRealtimeScheduler } from '../lib/realtime'
import { useSimulationSession } from '../lib/simulationSession'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import { applyPresetValues, classroomProfile } from '../config/classroomExperiments'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, MarkPointComponent, CanvasRenderer])

const classroom = classroomProfile('migration')

const migrateAge = ref(25)
const wDiff = ref(3000)
const cMove = ref(20000)
const cPsych = ref(3000)
const discountRate = ref(0.04)
const employmentProbability = ref(0.9)
const wageGrowth = ref(0.02)
const familyMigrate = ref(false)
const spouseLoss = ref(36000)
const result = ref(null)
const { loading, error: simulationError, runLatest } = useSimulationSession({
  clearResult: () => { result.value = null },
})
const activeChart = ref('npv')
const migrationChartTabs = [
  { key: 'npv', label: '累计 NPV' },
  { key: 'cost', label: '成本收益' },
  { key: 'sensitivity', label: '贴现率敏感性' },
]

const scheduleRun = createRealtimeScheduler(run, 80)
watch([migrateAge, wDiff, cMove, cPsych, discountRate, employmentProbability, wageGrowth, familyMigrate, spouseLoss], scheduleRun)

const migration = computed(() => result.value?.migration || null)
const years = computed(() => migration.value?.years || [])
const npvSeries = computed(() => migration.value?.cumulative_npv || [])
const finalNpv = computed(() => migration.value?.final_npv ?? npvSeries.value.at(-1) ?? 0)
const remainingYears = computed(() => Math.max(60 - migrateAge.value, 1))
const annualGross = computed(() => wDiff.value * 12 * employmentProbability.value)
const annualFamilyCost = computed(() => familyMigrate.value ? spouseLoss.value : 0)
const annualNet = computed(() => annualGross.value - cPsych.value - annualFamilyCost.value)
const totalAnnualCost = computed(() => cPsych.value + annualFamilyCost.value)
const requiredMonthlyPremium = computed(() => migration.value?.required_monthly_premium ?? 0)
const wageGap = computed(() => wDiff.value)
const premiumGap = computed(() => wageGap.value - requiredMonthlyPremium.value)
const paybackYear = computed(() => migration.value?.payback_age ?? null)
const paybackLabel = computed(() => paybackYear.value ? `${paybackYear.value} 岁` : '60岁前未回本')

const decision = computed(() => {
  if (!result.value) return null
  if (finalNpv.value > 0 && paybackYear.value && paybackYear.value - migrateAge.value <= 5) {
    return {
      level: 'strong',
      title: '建议迁移',
      reason: `预计 ${paybackYear.value} 岁回本，回本期较短，后续工作年限足以累积正收益。`,
    }
  }
  if (finalNpv.value > 0) {
    return {
      level: 'watch',
      title: '可以迁移，但要看风险承受力',
      reason: `最终 NPV 为正，但回本偏慢。适合稳定岗位、低不确定性、家庭成本可控的情境。`,
    }
  }
  return {
    level: 'avoid',
    title: '暂不建议迁移',
    reason: `当前工资溢价不足以覆盖搬迁、适应和家庭联动成本，60 岁前累计 NPV 仍为负。`,
  }
})

const migrationConclusion = computed(() => {
  if (!decision.value) return ''
  return `${decision.value.title}：${decision.value.reason}`
})

const recordParameters = computed(() => ({
  '迁移年龄': `${migrateAge.value} 岁`,
  '月工资溢价': formatCurrency(wDiff.value),
  '搬迁成本': formatCurrency(cMove.value),
  '贴现率': `${(discountRate.value * 100).toFixed(1)}%`,
  '目标地就业概率': `${Math.round(employmentProbability.value * 100)}%`,
  '家庭联合迁移': familyMigrate.value ? '是' : '否',
}))

const recordMetrics = computed(() => result.value ? ({
  '最终NPV': formatCurrency(finalNpv.value),
  '回本年龄': paybackLabel.value,
  '最低月溢价': formatCurrency(requiredMonthlyPremium.value),
  '内部收益率': migration.value?.irr_pct === null ? '观察期内无有效IRR' : `${migration.value?.irr_pct}%`,
}) : ({}))

const decisionClass = computed(() => `decision-${decision.value?.level || 'watch'}`)
const gaugeWidth = computed(() => Math.min(100, Math.max(6, (wageGap.value / Math.max(requiredMonthlyPremium.value * 1.4, 1)) * 100)))
const thresholdPosition = computed(() => Math.min(92, Math.max(8, (requiredMonthlyPremium.value / Math.max(requiredMonthlyPremium.value * 1.4, 1)) * 100)))

const npvChart = computed(() => {
  const data = years.value.map((year, i) => [year, npvSeries.value[i]])
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 400,
    grid: { top: 34, right: 28, bottom: 34, left: 70 },
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const point = params[0]
        return `${point.value[0]} 岁<br/>累计 NPV：${formatCurrency(point.value[1])}`
      },
    },
    xAxis: { type: 'value', min: migrateAge.value, max: 60, name: '年龄', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.08)' } } },
    yAxis: { type: 'value', name: '累计NPV', axisLabel: { color: '#94a3b8', formatter: v => `${Math.round(v / 10000)}万` }, nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.08)' } } },
    series: [{
      name: '累计 NPV',
      type: 'line',
      smooth: true,
      data,
      symbol: 'none',
      lineStyle: { color: finalNpv.value >= 0 ? '#10b981' : '#ef4444', width: 3 },
      areaStyle: { color: finalNpv.value >= 0 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.10)' },
      markLine: {
        symbol: 'none',
        data: [
          { yAxis: 0, lineStyle: { color: '#f8fafc', width: 1.5, type: 'dashed' }, label: { formatter: 'NPV=0 决策线', color: '#cbd5e1' } },
        ],
      },
      markPoint: paybackYear.value ? {
        data: [{ coord: [paybackYear.value, 0], name: '回本', value: '回本', itemStyle: { color: '#f59e0b' } }],
        label: { formatter: `${paybackYear.value}岁回本`, color: '#fff', fontWeight: 700 },
      } : undefined,
    }],
  }
})

const waterfallChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  grid: { top: 34, right: 20, bottom: 40, left: 70 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: { type: 'category', data: ['工资溢价', '心理成本', familyMigrate.value ? '家庭损失' : '家庭损失', '搬迁成本', '最终NPV'], axisLabel: { color: '#94a3b8' } },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8', formatter: v => `${Math.round(v / 10000)}万` }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.08)' } } },
  series: [{
    type: 'bar',
    data: [
      { value: expectedWagePv.value, itemStyle: { color: '#10b981' } },
      { value: -psychCostPv.value, itemStyle: { color: '#f59e0b' } },
      { value: -familyCostPv.value, itemStyle: { color: '#f97316' } },
      { value: -cMove.value, itemStyle: { color: '#ef4444' } },
      { value: finalNpv.value, itemStyle: { color: finalNpv.value >= 0 ? '#06b6d4' : '#ef4444' } },
    ],
    label: { show: true, position: 'top', color: '#cbd5e1', formatter: p => formatCurrency(p.value) },
  }],
}))

const expectedWagePv = computed(() => years.value.reduce((sum, _, index) =>
  sum + (wDiff.value * 12 * employmentProbability.value * ((1 + wageGrowth.value) ** index))
  / ((1 + discountRate.value) ** (index + 1)), 0))
const psychCostPv = computed(() => years.value.reduce((sum, _, index) =>
  sum + cPsych.value / ((1 + discountRate.value) ** (index + 1)), 0))
const familyCostPv = computed(() => years.value.reduce((sum, _, index) =>
  sum + annualFamilyCost.value / ((1 + discountRate.value) ** (index + 1)), 0))

const sensitivityChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  grid: { top: 30, right: 24, bottom: 42, left: 70 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    name: '贴现率',
    data: (migration.value?.sensitivity || []).map(item => `${Math.round(item.discount_rate * 100)}%`),
    axisLabel: { color: '#94a3b8' },
  },
  yAxis: {
    type: 'value',
    name: '最终NPV',
    axisLabel: { color: '#94a3b8', formatter: value => `${Math.round(value / 10000)}万` },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,.08)' } },
  },
  series: [{
    type: 'line',
    data: (migration.value?.sensitivity || []).map(item => item.npv),
    symbolSize: 8,
    lineStyle: { color: '#a78bfa', width: 3 },
    itemStyle: { color: '#a78bfa' },
  }],
}))

async function run() {
  await runLatest(
    () => axios.post(apiUrl('/api/v2/migration/npv'), {
      migrate_age: migrateAge.value,
      w_diff: wDiff.value,
      c_move: cMove.value,
      c_psych: cPsych.value,
      family_migrate: familyMigrate.value,
      spouse_loss: spouseLoss.value,
      discount_rate: discountRate.value,
      employment_probability: employmentProbability.value,
      wage_growth: wageGrowth.value,
    }),
    ({ data }) => { result.value = data },
  )
}

function resetMigration() {
  migrateAge.value = 25
  wDiff.value = 3000
  cMove.value = 20000
  cPsych.value = 3000
  discountRate.value = 0.04
  employmentProbability.value = 0.9
  wageGrowth.value = 0.02
  familyMigrate.value = false
  spouseLoss.value = 36000
  run()
}

function applyClassroomPreset(preset) {
  applyPresetValues(preset, {
    migrateAge, wDiff, cMove, cPsych, discountRate, employmentProbability,
    wageGrowth, familyMigrate, spouseLoss,
  })
  if (preset.chart) activeChart.value = preset.chart
  run()
}

function formatCurrency(value) {
  const abs = Math.abs(Math.round(value || 0))
  const sign = value < 0 ? '-' : ''
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(abs >= 100000 ? 1 : 2)}万`
  return `${sign}${abs.toLocaleString('zh-CN')}元`
}

onMounted(run)
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 56px; color: #f1f5f9; }
.lab-header { margin-bottom: 28px; }
.back-link { color: #94a3b8; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 34px; font-weight: 900; margin: 12px 0 8px; letter-spacing: 0; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }
.control-band { display: grid; grid-template-columns: 1fr; gap: 14px; align-items: end; width: 100%; min-width: 0; box-sizing: border-box; padding: 18px; background: rgba(30,41,59,.62); border: 1px solid rgba(148,163,184,.12); border-radius: 14px; margin-bottom: 20px; overflow: hidden; }
.control-group { min-width: 0; }
.control-group label { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 6px 12px; color: #cbd5e1; font-size: 13px; line-height: 1.45; margin-bottom: 7px; }
.control-group label span { color: #a78bfa; font-weight: 800; }
.control-group input[type="range"] { width: 100%; accent-color: #8b5cf6; }
.control-group.compact { display: flex; align-items: center; min-height: 54px; }
.checkbox-label { justify-content: flex-start !important; align-items: center; color: #e2e8f0 !important; margin: 0 !important; }
.checkbox-label input { accent-color: #8b5cf6; }
.btn-run { width: 100%; min-width: 0; height: 42px; border: none; border-radius: 10px; padding: 0 18px; color: #fff; background: linear-gradient(135deg, #8b5cf6, #2563eb); font-weight: 800; cursor: pointer; }
.btn-run:disabled { opacity: .55; cursor: not-allowed; }
.btn-reset { width: 100%; min-height: 42px; border: 1px solid rgba(148,163,184,.22); border-radius: 7px; color: #cbd5e1; background: #111b2e; cursor: pointer; }
.decision-panel { display: flex; justify-content: space-between; gap: 20px; align-items: center; border-radius: 14px; padding: 22px 24px; margin-bottom: 16px; border: 1px solid; }
.decision-strong { background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.32); }
.decision-watch { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.32); }
.decision-avoid { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.32); }
.decision-eyebrow { color: #94a3b8; font-size: 12px; font-weight: 800; letter-spacing: 0; }
.decision-panel h2 { margin: 6px 0 8px; font-size: 28px; }
.decision-panel p { margin: 0; color: #cbd5e1; line-height: 1.7; }
.decision-score { text-align: right; flex-shrink: 0; }
.decision-score span { display: block; font-size: 30px; font-weight: 900; }
.decision-score small { color: #94a3b8; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.metric-card { background: rgba(30,41,59,.58); border: 1px solid rgba(148,163,184,.12); border-radius: 12px; padding: 16px; }
.metric-card.good { border-color: rgba(16,185,129,.32); }
.metric-card.warn { border-color: rgba(239,68,68,.32); }
.metric-label { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 8px; }
.metric-card strong { display: block; font-size: 23px; }
.threshold-card { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; align-items: center; padding: 18px 20px; background: rgba(15,23,42,.7); border: 1px solid rgba(148,163,184,.12); border-radius: 14px; margin-bottom: 16px; }
.threshold-copy h3 { margin: 0 0 8px; font-size: 18px; }
.threshold-copy p { margin: 0; color: #cbd5e1; line-height: 1.7; }
.text-good { color: #10b981; }
.text-warn { color: #f87171; }
.gauge-track { position: relative; height: 16px; border-radius: 999px; background: rgba(148,163,184,.16); overflow: hidden; }
.gauge-fill { height: 100%; border-radius: 999px; }
.fill-good { background: linear-gradient(90deg, #06b6d4, #10b981); }
.fill-warn { background: linear-gradient(90deg, #f59e0b, #ef4444); }
.gauge-marker { position: absolute; top: -4px; width: 3px; height: 24px; background: #f8fafc; border-radius: 2px; box-shadow: 0 0 0 3px rgba(248,250,252,.12); }
.gauge-labels { display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; margin-top: 8px; }
.chart-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 16px; margin-bottom: 16px; }
.chart-card { background: rgba(30,41,59,.58); border: 1px solid rgba(148,163,184,.12); border-radius: 14px; padding: 18px; min-width: 0; }
.sensitivity-card { margin-bottom: 16px; }
.chart-card h3 { margin: 0 0 10px; color: #cbd5e1; font-size: 15px; }
.teaching-note { padding: 16px 18px; border-radius: 12px; color: #cbd5e1; line-height: 1.8; background: rgba(6,182,212,.08); border: 1px solid rgba(6,182,212,.18); }
.teaching-note strong { color: #f8fafc; }
@media (max-width: 900px) {
  .control-band, .metrics-grid, .threshold-card, .chart-grid { grid-template-columns: 1fr; }
  .decision-panel { align-items: flex-start; flex-direction: column; }
  .decision-score { text-align: left; }
}
</style>
