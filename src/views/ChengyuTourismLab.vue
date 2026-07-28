<template>
  <ExperimentWorkspace
      class="lab"
      title="成渝文旅产业实验室"
      subtitle="岗位需求预测 · 技能缺口诊断 · 薪酬吸引力 · 政策情景"
      kicker="应用专题 · 成渝双城经济圈"
      :chart-tabs="tourismChartTabs"
      v-model:active-chart="activeChart"
      :change-key="[city, sector, touristGrowth, digitalLevel, eventIntensity, seasonality, digitalSkill, dataSkill, serviceSkill, planningSkill, mediaSkill, cultureSkill, salary, stability, training, promotion, policy]"
      @reset="resetScenario"
      :result-type="calibration?.status === 'ready' ? '用户导入样本校准后的情景推演' : '教学情景参数推演'"
      formula="岗位热度指数=岗位类型基准×游客增长×数字化×活动强度；吸引力由薪酬与非工资收益加权。"
      :assumptions="calibration?.status === 'ready'
        ? `已使用 ${calibration.sample_size} 条招聘样本校准薪酬参考值与数字化参数，招聘广告数量不等于社会真实岗位需求。`
        : '岗位类型基准和参数权重用于课堂比较，尚未使用学生采集的招聘样本校准。'"
      source="劳动需求、技能匹配与补偿性工资差异机制的成渝文旅应用情景。"
      scope="比较不同城市、业态与政策组合的方向和相对变化。"
      limitation="成渝文旅产业真实岗位数量或财政政策效果的精确预测。"
    >
      <template #controls>
    <aside v-if="calibration?.status === 'ready'" class="calibration-banner">
      <div>
        <strong>已接入报告工作台样本校准</strong>
        <p>
          {{ calibration.sample_size }} 条样本 · 采集期
          {{ calibration.collection_start || '未标注' }} 至 {{ calibration.collection_end || '未标注' }}
          · 薪资缺失 {{ calibration.salary_missing_rate_pct }}%
        </p>
        <small>模型 {{ calibration.model_version }} · 不确定性约 ±{{ calibration.uncertainty_pct }}% · 仅用于相对情景比较</small>
      </div>
      <button type="button" @click="clearCalibration">恢复教学默认值</button>
    </aside>
    <aside v-else class="calibration-banner muted">
      <div>
        <strong>当前使用教学情景参数</strong>
        <p>可在报告工作台导入至少 10 条文旅招聘样本，通过质量检查后校准薪酬参考值与数字化参数。</p>
      </div>
      <router-link to="/report/workbench">前往报告工作台</router-link>
    </aside>
    <nav class="control-mode-tabs" aria-label="参数主题">
      <button
        v-for="item in controlModes"
        :key="item.key"
        type="button"
        :class="{ active: controlMode === item.key }"
        @click="selectControlMode(item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
    <section v-if="controlMode === 'demand'" class="lab-controls">
      <div class="control-group">
        <label>城市</label>
        <select v-model="city">
          <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <div class="control-group wide">
        <label>文旅业态</label>
        <select v-model="sector">
          <option v-for="item in sectorOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <div class="control-group">
        <label>游客增长率 <span class="val">{{ touristGrowth }}%</span></label>
        <input type="range" v-model.number="touristGrowth" min="-10" max="40" step="1">
      </div>
      <div class="control-group">
        <label>数字化水平 <span class="val">{{ digitalLevel }}</span></label>
        <input type="range" v-model.number="digitalLevel" min="0" max="100" step="1">
      </div>
      <div class="control-group">
        <label>会展/活动强度 <span class="val">{{ eventIntensity }}</span></label>
        <input type="range" v-model.number="eventIntensity" min="0" max="100" step="1">
      </div>
      <div class="control-group">
        <label>季节性波动</label>
        <select v-model="seasonality">
          <option value="低">低</option>
          <option value="中">中</option>
          <option value="高">高</option>
        </select>
      </div>
      <button class="btn-run" type="button" @click="run" :disabled="loading">
        {{ loading ? '实时更新中…' : '刷新仿真' }}
      </button>
      <button class="btn-reset" type="button" @click="resetScenario">恢复默认情景</button>
    </section>
    <section v-else-if="controlMode === 'skills'" class="skill-controls">
      <div class="control-group" v-for="skill in skillControls" :key="skill.key">
        <label>{{ skill.label }} <span class="val">{{ skill.model.value }}</span></label>
        <input type="range" v-model.number="skill.model.value" min="0" max="100" step="1">
      </div>
    </section>
    <section v-else-if="controlMode === 'attraction'" class="lab-controls">
      <div class="control-group">
        <label>平均薪酬 <span class="val">{{ salary }} 元/月</span></label>
        <input type="range" v-model.number="salary" :min="salaryRange.min" :max="salaryRange.max" :step="salaryRange.step">
      </div>
      <div class="control-group">
        <label>岗位稳定性 <span class="val">{{ stability }}</span></label>
        <input type="range" v-model.number="stability" min="0" max="100" step="1">
      </div>
      <div class="control-group">
        <label>培训投入 <span class="val">{{ training }}</span></label>
        <input type="range" v-model.number="training" min="0" max="100" step="1">
      </div>
      <div class="control-group">
        <label>晋升空间 <span class="val">{{ promotion }}</span></label>
        <input type="range" v-model.number="promotion" min="0" max="100" step="1">
      </div>
    </section>
    <section v-else class="lab-controls">
      <div class="control-group wide">
        <label>当前政策情景</label>
        <select v-model="policy">
          <option v-for="item in policyOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
    </section>
      </template>

      <template #task>
    <LearningTaskCard
      task="设置城市、业态、游客增长和数字化水平，预测成渝文旅产业不同岗位的需求变化。"
      observe="重点观察数字化水平提高后，数字营销、数据分析、智慧景区运营等岗位是否上升。"
      :conclusion="tourismConclusion"
    />
      </template>

      <template #record>
    <ExperimentRecordPanel
      experiment-name="成渝文旅产业劳动力需求预测"
      :parameters="recordParameters"
      :metrics="recordMetrics"
      :conclusion="tourismConclusion"
      :model-version="result?.calibration?.model_version || 'tourism-scenario-2.1'"
      :source-type="result?.calibration?.result_type || '教学情景参数'"
    />
      </template>

      <template #metrics>
    <section class="cards-row">
      <div class="stat-card">
        <span class="stat-label">样本岗位热度指数</span>
        <span class="stat-val">{{ result?.demand.total || 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">增长最快岗位</span>
        <span class="stat-val small">{{ result?.demand.fastest_job || '待计算' }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">最大技能缺口</span>
        <span class="stat-val small">{{ result?.skills.largest_gap || '待计算' }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">人才吸引力指数</span>
        <span class="stat-val">{{ result?.attraction.index || 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">推荐政策组合</span>
        <span class="stat-val small">{{ result?.policies.recommended || '待计算' }}</span>
      </div>
    </section>
      </template>

      <template #primary>
        <div v-if="activeChart === 'demand'" class="chart-card">
          <h3>不同岗位情景热度</h3>
          <v-chart class="workspace-chart-canvas" :option="demandChart" autoresize />
        </div>
        <div v-else-if="activeChart === 'baseline'" class="chart-card">
          <h3>基准热度 vs 情景热度</h3>
          <v-chart class="workspace-chart-canvas" :option="scenarioDemandChart" autoresize />
        </div>
        <div v-else-if="activeChart === 'skill-compare'" class="chart-card">
          <h3>岗位需求能力 vs 当前供给能力</h3>
          <v-chart class="workspace-chart-canvas" :option="skillCompareChart" autoresize />
        </div>
        <div v-else-if="activeChart === 'skill-gap'" class="chart-card">
          <h3>技能缺口排序</h3>
          <v-chart class="workspace-chart-canvas" :option="skillGapChart" autoresize />
        </div>
        <div v-else-if="activeChart === 'attraction'" class="chart-card gauge-card">
          <h3>人才吸引力指数</h3>
          <v-chart class="workspace-chart-canvas" :option="attractionGauge" autoresize />
        </div>
        <div v-else-if="activeChart === 'salary'" class="chart-card">
          <h3>薪酬调整对吸引力的影响</h3>
          <v-chart class="workspace-chart-canvas" :option="salaryCurveChart" autoresize />
        </div>
        <div v-else class="chart-card">
          <h3>政策情景效果比较</h3>
          <v-chart class="workspace-chart-canvas" :option="policyChart" autoresize />
        </div>
      </template>

      <template #change>
        基准岗位结构 → 当前热度指数 {{ result?.demand.total || 0 }}；
        {{ tourismConclusion || '等待当前情景结果' }}
      </template>

      <template #analysis>
      <div class="advice-list">
        <strong>优先补强方向</strong>
        <p v-for="item in result?.skills.recommendations || []" :key="item">{{ item }}</p>
      </div>
      <p class="policy-note">
        当前应聘热度区间为 {{ result?.attraction.applicant_heat_range || '待计算' }}（相对指数），流失风险为
        {{ result?.attraction.turnover_risk || '待计算' }}。工资决定理论提示：岗位吸引力既来自工资，也来自稳定性、培训和晋升等非工资收益。
      </p>
      <p class="policy-note">
        思考讨论：培训补贴更偏向补齐学习者和劳动者能力，数字化投资会推高数字岗位需求，区域人才流动便利化则有助于缓解成都与重庆之间的人才错配。组合政策通常更适合“需求扩张 + 技能升级”同时发生的文旅场景。
      </p>
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
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import { sliderRanges } from '../config/sliderRanges'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, GaugeChart } from 'echarts/charts'
import { AriaComponent, GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, LineChart, GaugeChart, AriaComponent, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const route = useRoute()
const cityOptions = ['成都', '重庆', '成渝双城联动']
const sectorOptions = ['景区运营', '会展节庆', '研学旅行', '夜间文旅', '数字文博', '智慧景区']
const policyOptions = ['基准情景', '培训补贴', '校企合作', '数字化投资', '区域人才流动便利化', '组合政策']
const CALIBRATION_KEY = 'lmdtTourismCalibration'
const controlMode = ref('demand')
const activeChart = ref('demand')
const controlModes = [
  { key: 'demand', label: '需求' },
  { key: 'skills', label: '技能' },
  { key: 'attraction', label: '薪酬' },
  { key: 'policy', label: '政策' },
]
const tourismChartTabs = [
  { key: 'demand', label: '岗位热度' },
  { key: 'baseline', label: '基准对照' },
  { key: 'skill-compare', label: '技能匹配' },
  { key: 'skill-gap', label: '技能缺口' },
  { key: 'attraction', label: '吸引力' },
  { key: 'salary', label: '薪酬曲线' },
  { key: 'policy', label: '政策比较' },
]

const city = ref('成渝双城联动')
const sector = ref('会展节庆')
const touristGrowth = ref(18)
const digitalLevel = ref(62)
const eventIntensity = ref(70)
const seasonality = ref('中')
const salaryRange = sliderRanges.tourismSalary
const salary = ref(salaryRange.default)
const stability = ref(65)
const training = ref(58)
const promotion = ref(62)
const policy = ref('组合政策')

const digitalSkill = ref(58)
const dataSkill = ref(52)
const serviceSkill = ref(66)
const planningSkill = ref(55)
const mediaSkill = ref(60)
const cultureSkill = ref(64)

const loading = ref(false)
const result = ref(null)
const calibration = ref(null)

const skillControls = [
  { key: 'digital_skill', label: '数字技能水平', model: digitalSkill },
  { key: 'data_skill', label: '数据分析能力', model: dataSkill },
  { key: 'service_skill', label: '服务运营能力', model: serviceSkill },
  { key: 'planning_skill', label: '活动策划能力', model: planningSkill },
  { key: 'media_skill', label: '内容传播/新媒体能力', model: mediaSkill },
  { key: 'culture_skill', label: '文旅知识/地方文化理解', model: cultureSkill },
]

const payload = computed(() => ({
  city: city.value,
  sector: sector.value,
  tourist_growth: touristGrowth.value,
  digital_level: digitalLevel.value,
  event_intensity: eventIntensity.value,
  seasonality: seasonality.value,
  salary: salary.value,
  stability: stability.value,
  training: training.value,
  promotion: promotion.value,
  policy: policy.value,
  digital_skill: digitalSkill.value,
  data_skill: dataSkill.value,
  service_skill: serviceSkill.value,
  planning_skill: planningSkill.value,
  media_skill: mediaSkill.value,
  culture_skill: cultureSkill.value,
  calibration: calibration.value,
}))

const tourismConclusion = computed(() => result.value?.conclusion || '')

const recordParameters = computed(() => ({
  城市: city.value,
  文旅业态: sector.value,
  游客增长率: `${touristGrowth.value}%`,
  数字化水平: digitalLevel.value,
  '会展/活动强度': eventIntensity.value,
  平均薪酬: `${salary.value} 元/月`,
  培训投入: training.value,
  政策情景: policy.value,
  数据来源: calibration.value?.status === 'ready' ? `${calibration.value.sample_size} 条用户导入样本` : '教学情景参数',
}))

const recordMetrics = computed(() => ({
  样本岗位热度指数: result.value?.demand.total || 0,
  增长最快岗位: result.value?.demand.fastest_job || '',
  最大技能缺口: result.value?.skills.largest_gap || '',
  人才吸引力指数: result.value?.attraction.index || 0,
  推荐政策组合: result.value?.policies.recommended || '',
}))

const jobs = computed(() => result.value?.demand.jobs || [])
const skillItems = computed(() => result.value?.skills.items || [])
const policyScenarios = computed(() => result.value?.policies.scenarios || [])

const demandChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  aria: { enabled: true, decal: { show: true } },
  grid: { top: 28, right: 18, bottom: 46, left: 52 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: jobs.value.map(item => item.name), axisLabel: { color: '#94a3b8', interval: 0, rotate: 24 } },
  yAxis: { type: 'value', name: '相对热度', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#94a3b8' } },
  series: [{ name: '情景热度', type: 'bar', data: jobs.value.map(item => item.forecast), itemStyle: { color: '#06b6d4', borderRadius: [5, 5, 0, 0] } }],
}))

const scenarioDemandChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  aria: { enabled: true, decal: { show: true } },
  grid: { top: 42, right: 18, bottom: 46, left: 52 },
  legend: { top: 0, textStyle: { color: '#94a3b8' } },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: jobs.value.map(item => item.name), axisLabel: { color: '#94a3b8', interval: 0, rotate: 24 } },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
  series: [
    { name: '基准热度', type: 'bar', data: jobs.value.map(item => item.baseline), itemStyle: { color: '#334155', borderRadius: [5, 5, 0, 0] } },
    { name: '情景热度', type: 'bar', data: jobs.value.map(item => item.forecast), itemStyle: { color: '#8b5cf6', borderRadius: [5, 5, 0, 0] } },
  ],
}))

const skillCompareChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  grid: { top: 42, right: 24, bottom: 28, left: 136 },
  legend: { top: 0, textStyle: { color: '#94a3b8' } },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'value', max: 100, axisLabel: { color: '#94a3b8' } },
  yAxis: { type: 'category', data: skillItems.value.map(item => item.name), axisLabel: { color: '#94a3b8' } },
  series: [
    { name: '岗位需求能力', type: 'bar', data: skillItems.value.map(item => item.demand), itemStyle: { color: '#06b6d4', borderRadius: [0, 5, 5, 0] } },
    { name: '当前供给能力', type: 'bar', data: skillItems.value.map(item => item.supply), itemStyle: { color: '#f59e0b', borderRadius: [0, 5, 5, 0] } },
  ],
}))

const skillGapChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  grid: { top: 24, right: 24, bottom: 34, left: 128 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
  yAxis: { type: 'category', data: [...skillItems.value].sort((a, b) => a.gap - b.gap).map(item => item.name), axisLabel: { color: '#94a3b8' } },
  series: [{ type: 'bar', data: [...skillItems.value].sort((a, b) => a.gap - b.gap).map(item => item.gap), itemStyle: { color: '#f59e0b', borderRadius: [0, 5, 5, 0] } }],
}))

const attractionGauge = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  series: [{
    type: 'gauge',
    min: 0,
    max: 100,
    progress: { show: true, width: 14, itemStyle: { color: '#06b6d4' } },
    axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(148,163,184,0.18)']] } },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#64748b' } },
    axisLabel: { color: '#94a3b8' },
    pointer: { width: 4 },
    detail: { valueAnimation: true, formatter: '{value}', color: '#f8fafc', fontSize: 32, offsetCenter: [0, '62%'] },
    data: [{ value: result.value?.attraction.index || 0 }],
  }],
}))

const salaryCurveChart = computed(() => {
  const points = Array.from({ length: 9 }, (_, index) => 3000 + index * 1500)
  const values = points.map(value => {
    const wageScore = Math.max(0, Math.min(100, (value - 3000) / 12000 * 100))
    return Math.round(wageScore * 0.38 + stability.value * 0.22 + training.value * 0.2 + promotion.value * 0.2)
  })
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 400,
    grid: { top: 24, right: 22, bottom: 42, left: 48 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: points.map(item => `${item / 1000}k`), axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'line', data: values, smooth: true, lineStyle: { color: '#22c55e', width: 3 }, areaStyle: { color: 'rgba(34,197,94,0.12)' }, itemStyle: { color: '#22c55e' } }],
  }
})

const policyChart = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 400,
  animationDurationUpdate: 400,
  grid: { top: 42, right: 24, bottom: 54, left: 50 },
  legend: { top: 0, textStyle: { color: '#94a3b8' } },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: policyScenarios.value.map(item => item.name), axisLabel: { color: '#94a3b8', interval: 0, rotate: 20 } },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
  series: [
    { name: '岗位供需匹配度', type: 'bar', data: policyScenarios.value.map(item => item.matching), itemStyle: { color: '#06b6d4', borderRadius: [5, 5, 0, 0] } },
    { name: '技能缺口', type: 'bar', data: policyScenarios.value.map(item => item.skill_gap), itemStyle: { color: '#f59e0b', borderRadius: [5, 5, 0, 0] } },
    { name: '人才吸引力', type: 'bar', data: policyScenarios.value.map(item => item.attraction), itemStyle: { color: '#8b5cf6', borderRadius: [5, 5, 0, 0] } },
  ],
}))

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/tourism/chengyu/simulate'), payload.value)
    result.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function clearCalibration() {
  localStorage.removeItem(CALIBRATION_KEY)
  calibration.value = null
  resetScenario()
}

function selectControlMode(mode) {
  controlMode.value = mode
  activeChart.value = {
    demand: 'demand',
    skills: 'skill-compare',
    attraction: 'salary',
    policy: 'policy',
  }[mode]
}

function resetScenario() {
  controlMode.value = 'demand'
  activeChart.value = 'demand'
  city.value = '成渝双城联动'
  sector.value = '会展节庆'
  touristGrowth.value = 18
  digitalLevel.value = calibration.value?.parameters?.digital_level || 62
  eventIntensity.value = 70
  seasonality.value = '中'
  salary.value = calibration.value?.parameters?.salary_reference || salaryRange.default
  stability.value = 65
  training.value = 58
  promotion.value = 62
  policy.value = '组合政策'
  run()
}

const scheduleRun = createRealtimeScheduler(run, 80)

watch([
  city, sector, touristGrowth, digitalLevel, eventIntensity, seasonality,
  salary, stability, training, promotion, policy,
  digitalSkill, dataSkill, serviceSkill, planningSkill, mediaSkill, cultureSkill,
], scheduleRun)

onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem(CALIBRATION_KEY) || 'null')
    if (stored?.status === 'ready') {
      calibration.value = stored
      salary.value = stored.parameters?.salary_reference || salaryRange.default
      digitalLevel.value = stored.parameters?.digital_level || 62
    }
  } catch {
    localStorage.removeItem(CALIBRATION_KEY)
  }
  if (route.query.preset === 'digital') {
    sector.value = '数字文博'
    touristGrowth.value = 24
    digitalLevel.value = 86
    eventIntensity.value = 76
    training.value = 72
    policy.value = '数字化投资'
  }
  run()
})
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 72px; }
.lab-header { margin-bottom: 28px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { margin: 12px 0 8px; color: #f8fafc; font-size: 34px; font-weight: 900; }
.lab-header p { margin: 0; color: #94a3b8; line-height: 1.7; }
.calibration-banner { display: flex; justify-content: space-between; gap: 18px; align-items: center; margin-bottom: 14px; padding: 14px 16px; border: 1px solid rgba(34,211,238,.28); border-radius: 8px; background: rgba(6,182,212,.08); }
.calibration-banner strong { color: #e0f2fe; }
.calibration-banner p { margin: 5px 0; color: #cbd5e1; font-size: 13px; line-height: 1.55; }
.calibration-banner small { color: #67e8f9; }
.calibration-banner button, .calibration-banner a { flex: 0 0 auto; padding: 9px 12px; border: 1px solid rgba(103,232,249,.3); border-radius: 7px; color: #cffafe; background: rgba(8,145,178,.16); text-decoration: none; cursor: pointer; }
.calibration-banner.muted { border-color: rgba(148,163,184,.18); background: rgba(30,41,59,.46); }
.calibration-banner.muted small, .calibration-banner.muted strong { color: #cbd5e1; }
.control-mode-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
.control-mode-tabs button { min-height: 34px; border: 1px solid rgba(148,163,184,.16); border-radius: 6px; color: #94a3b8; background: #111b2e; cursor: pointer; }
.control-mode-tabs button.active { color: #ecfeff; border-color: rgba(34,211,238,.42); background: rgba(8,145,178,.2); }
.lab-controls { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 24px; padding: 18px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.12); background: rgba(30,41,59,0.5); }
.lab-controls.compact { margin-bottom: 18px; }
.control-group { flex: 1; min-width: 138px; }
.control-group.wide { min-width: 190px; }
.control-group label { display: block; margin-bottom: 6px; color: #94a3b8; font-size: 13px; font-weight: 700; }
.control-group .val { color: #22d3ee; font-weight: 900; }
.control-group input[type="range"] { width: 100%; }
.control-group select { width: 100%; padding: 9px; border-radius: 9px; border: 1px solid rgba(148,163,184,0.2); color: #e2e8f0; background: #1e293b; }
.btn-run { padding: 11px 22px; border: none; border-radius: 10px; color: #fff; font-weight: 800; cursor: pointer; background: linear-gradient(135deg, #06b6d4, #2563eb); white-space: nowrap; }
.btn-run:disabled { opacity: .55; cursor: not-allowed; }
.btn-reset { padding: 10px 14px; border: 1px solid rgba(148,163,184,.22); border-radius: 7px; color: #cbd5e1; background: #111b2e; cursor: pointer; white-space: nowrap; }
.cards-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 0 0 24px; }
.stat-card { min-width: 0; padding: 16px; border-radius: 8px; text-align: center; background: rgba(30,41,59,0.52); border: 1px solid rgba(148,163,184,0.1); }
.stat-label { display: block; margin-bottom: 7px; color: #64748b; font-size: 12px; font-weight: 700; }
.stat-val { display: block; color: #f8fafc; font-size: 24px; font-weight: 900; }
.stat-val.small { font-size: 16px; line-height: 1.35; }
.section-block { margin-bottom: 26px; padding: 20px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.12); background: rgba(15,23,42,0.36); }
.section-head { display: flex; gap: 13px; align-items: flex-start; margin-bottom: 16px; }
.section-head > span { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; color: #67e8f9; background: rgba(6,182,212,0.12); font-weight: 900; }
.section-head h2 { margin: 0 0 6px; color: #e2e8f0; font-size: 20px; }
.section-head p { margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.65; }
.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.chart-card { min-width: 0; padding: 18px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.1); background: rgba(30,41,59,0.5); }
.chart-card h3 { margin: 0 0 12px; color: #94a3b8; font-size: 14px; }
.skill-controls { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 0; padding: 0; background: transparent; border: 0; }
.advice-list { margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.16); }
.advice-list strong { color: #e0f2fe; }
.advice-list p { margin: 8px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.65; }
.policy-note { margin: 16px 0 0; padding: 14px 16px; border-radius: 12px; color: #cbd5e1; font-size: 14px; line-height: 1.75; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.16); }
@media (max-width: 980px) {
  .cards-row { grid-template-columns: repeat(2, 1fr); }
  .chart-grid, .skill-controls { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .lab { padding: 28px 16px 76px; }
  .lab-header h1 { font-size: 27px; }
  .lab-controls { display: grid; grid-template-columns: 1fr; }
  .calibration-banner { align-items: stretch; flex-direction: column; }
  .cards-row { grid-template-columns: 1fr; }
  .section-block { padding: 16px; }
  .chart-card { padding: 14px; }
}
</style>
