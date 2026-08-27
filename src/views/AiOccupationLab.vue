<template>
  <ExperimentWorkspace
    title="AI岗位任务重构实验室"
    subtitle="拆分工作任务 · 识别暴露与互补 · 比较短期和长期就业情景"
    kicker="拆机制 · AI TASKS"
    :classroom-task="classroom.task"
    :classroom-presets="classroom.presets"
    @apply-preset="applyClassroomPreset"
    :chart-tabs="chartTabs"
    :active-chart="activeChart"
    :change-key="changeKey"
    result-type="情景推演结果"
    formula="就业变化 = 替代效应 + 规模效应 + 互补效应 + 新任务效应 - AI成本拖累"
    assumptions="任务结构和AI参数均由学生设定；其他条件在单次比较中保持不变。"
    source="任务模板为教学情景参数；机制来自劳动需求、技术进步和技能互补分析。"
    scope="用于比较AI如何重构任务和技能需求，并讨论就业变化的多重机制。"
    :limitation="result.boundary"
    variables="任务时间占比、AI暴露度、替代强度、生产率、需求扩张、互补性、培训投入，单位均为指数或百分比。"
    default-basis="默认参数用于课堂对照，不来自职业数据库或企业实证估计。"
    reality-status="否。当前结果是人设参数下的情景推演，不是职业消失概率或现实就业预测。"
    @reset="resetAll"
    @update:active-chart="activeChart = $event"
  >
    <template #controls>
      <div class="control-stack">
        <label class="select-field"><span>岗位模板</span><select v-model="occupation" @change="loadTemplate"><option v-for="(_, name) in occupationTemplates" :key="name">{{ name }}</option></select></label>
        <label v-for="control in controls" :key="control.key" class="range-field">
          <span>{{ control.label }} <strong>{{ parameters[control.key] }}{{ control.unit }}</strong></span>
          <input v-model.number="parameters[control.key]" type="range" :min="control.min" :max="control.max" :step="control.step || 1" />
        </label>
        <p class="control-boundary">暴露度表示任务可能受AI影响的程度，不等于岗位被替代概率。</p>
      </div>
    </template>

    <template #metrics>
      <div class="metric-strip">
        <article><span>任务暴露指数</span><strong>{{ result.exposureIndex }}</strong></article>
        <article><span>短期就业指数</span><strong>{{ result.shortTermEmployment }}</strong></article>
        <article><span>长期就业指数</span><strong>{{ result.longTermEmployment }}</strong></article>
        <article><span>优先再培训</span><strong>{{ result.retrainingPriority }}</strong></article>
      </div>
    </template>

    <template #primary>
      <div class="chart-card">
        <div class="chart-heading"><div><span>基准就业=100 · 教学情景</span><h2>{{ chartTitle }}</h2></div><RuntimeSourceBadge type="情景推演结果" /></div>
        <div class="chart-frame"><LmdtChart :option="chartOption" :aria-label="chartTitle" /></div>
      </div>
    </template>

    <template #change><strong>{{ result.conclusion }}</strong><span>高技能变化 {{ signed(result.highSkillChange) }}，低技能变化 {{ signed(result.lowSkillChange) }}；两者方向可能不同。</span></template>

    <template #task>
      <div class="drawer-copy"><h3>学习任务</h3><ol><li>先按真实工作过程修订10项任务和时间占比。</li><li>分别提高替代、需求扩张、互补与培训参数。</li><li>解释为什么“AI暴露高”不必然推出“就业下降”。</li></ol></div>
    </template>

    <template #record>
      <div class="record-box"><h3>实验记录</h3><p>{{ result.conclusion }}</p><button type="button" @click="saveRecord">保存到报告工作台</button><router-link to="/lab/enterprise?preset=ai">带入劳动需求实验</router-link><router-link to="/report/workbench">进入报告工作台</router-link><span v-if="saved">已保存到当前浏览器。</span><span v-else-if="storageMessage" class="storage-error" role="alert">{{ storageMessage }}</span></div>
    </template>

    <template #analysis>
      <div class="analysis-stack">
        <section><h3>任务拆解表</h3><p>时间占比会自动归一化为100%；任务名称、分类、暴露和技能供需均可修改。</p>
          <div class="task-table">
            <div v-for="task in tasks" :key="task.id" class="task-row">
              <input v-model="task.name" aria-label="任务名称" />
              <label>占比<input v-model.number="task.timeShare" type="number" min="0" max="100" /></label>
              <label>暴露<input v-model.number="task.exposure" type="number" min="0" max="100" /></label>
              <select v-model="task.category" aria-label="任务类型"><option value="automation">自动化</option><option value="augmentation">增强</option><option value="human">人类优势</option><option value="newTask">新任务</option></select>
              <label>需求<input v-model.number="task.skillDemand" type="number" min="0" max="100" /></label>
              <label>供给<input v-model.number="task.skillSupply" type="number" min="0" max="100" /></label>
            </div>
          </div>
        </section>
        <section><h3>最大技能缺口</h3><ol><li v-for="item in result.topSkillGaps" :key="item.name">{{ item.name }}：{{ item.gap }}点</li></ol></section>
        <AiAuditPanel storage-key="lmdtAiOccupationAuditRecords" />
      </div>
    </template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AiAuditPanel from '../components/AiAuditPanel.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import LmdtChart from '../components/LmdtChart.vue'
import RuntimeSourceBadge from '../components/RuntimeSourceBadge.vue'
import { analyzeOccupationTasks, occupationTemplates } from '../domain/aiImpact/model'
import { readJsonStorage, writeJsonStorage } from '../lib/storage'
import { applyPresetValues, classroomProfile } from '../config/classroomExperiments'

const classroom = classroomProfile('aiOccupation')

const chartTabs = [{ key: 'tasks', label: '任务结构' }, { key: 'effects', label: '就业效应' }, { key: 'skills', label: '技能缺口' }]
const activeChart = ref('tasks')
const occupation = ref('人力资源专员')
const tasks = ref(cloneTemplate(occupation.value))
const saved = ref(false)
const storageMessage = ref('')
const parameters = reactive({ baselineEmployment: 100, taskSubstitution: 55, aiProductivity: 50, demandExpansion: 45, complementarity: 60, trainingInvestment: 50, aiCost: 35 })
const controls = [
  { key: 'taskSubstitution', label: '任务替代强度', min: 0, max: 100, unit: '' },
  { key: 'aiProductivity', label: 'AI生产率提升', min: 0, max: 100, unit: '' },
  { key: 'demandExpansion', label: '产品需求扩张', min: 0, max: 100, unit: '' },
  { key: 'complementarity', label: '人机技能互补', min: 0, max: 100, unit: '' },
  { key: 'trainingInvestment', label: '再培训投入', min: 0, max: 100, unit: '' },
  { key: 'aiCost', label: 'AI采用成本', min: 0, max: 100, unit: '' },
]
const result = computed(() => analyzeOccupationTasks(tasks.value, parameters))
const changeKey = computed(() => JSON.stringify([parameters, tasks.value, activeChart.value]))
const chartTitle = computed(() => ({ tasks: '任务类型与标准化时间占比', effects: '替代、规模、互补与新任务效应', skills: '任务技能需求与当前供给' })[activeChart.value])
const categoryLabels = { automation: '自动化', augmentation: '增强', human: '人类优势', newTask: '新任务' }

const chartOption = computed(() => {
  const common = { animationDuration: 380, color: ['#38bdf8', '#f59e0b', '#22c55e', '#a78bfa'], grid: { left: 120, right: 35, top: 45, bottom: 42 }, tooltip: { trigger: 'axis' }, legend: { top: 4, textStyle: { color: '#cbd5e1' } }, xAxis: { axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.14)' } } } }
  if (activeChart.value === 'effects') return { ...common, xAxis: { ...common.xAxis, type: 'category', data: ['替代', '规模', '互补', '新任务', 'AI成本', '短期就业', '长期就业'] }, yAxis: { type: 'value', name: '就业指数变化', axisLabel: { color: '#94a3b8' } }, series: [{ type: 'bar', name: '相对基准变化', data: [...Object.values(result.value.effects), result.value.shortTermEmployment - 100, result.value.longTermEmployment - 100].map(value => ({ value, itemStyle: { color: value < 0 ? '#f87171' : '#22c55e' } })) }] }
  if (activeChart.value === 'skills') return { ...common, yAxis: { type: 'category', inverse: true, data: result.value.tasks.map(item => item.name), axisLabel: { color: '#cbd5e1', width: 100, overflow: 'truncate' } }, xAxis: { ...common.xAxis, type: 'value', min: 0, max: 100, name: '能力指数' }, series: [{ type: 'bar', name: '岗位需求', data: result.value.tasks.map(item => item.skillDemand) }, { type: 'bar', name: '当前供给', data: result.value.tasks.map(item => item.skillSupply) }] }
  const shareMax = Math.max(20, Math.ceil(Math.max(...result.value.tasks.map(item => item.normalizedShare)) / 5) * 5)
  return { ...common, yAxis: { type: 'category', inverse: true, data: result.value.tasks.map(item => item.name), axisLabel: { color: '#cbd5e1', width: 100, overflow: 'truncate' } }, xAxis: { ...common.xAxis, type: 'value', min: 0, max: shareMax, interval: 5, name: '标准化占比(%)' }, series: Object.entries(categoryLabels).map(([key, label]) => ({ type: 'bar', stack: 'task', name: label, barMaxWidth: 20, label: { show: true, position: 'right', color: '#cbd5e1', formatter: p => p.value ? `${p.value}%` : '' }, data: result.value.tasks.map(item => item.category === key ? item.normalizedShare : 0) })) }
})

const savedDraft = readJsonStorage('lmdtAiOccupationDraft', null)
if (savedDraft && occupationTemplates[savedDraft.occupation] && Array.isArray(savedDraft.tasks)) {
  occupation.value = savedDraft.occupation
  tasks.value = savedDraft.tasks
  Object.assign(parameters, savedDraft.parameters || {})
}

watch([tasks, () => ({ ...parameters })], () => {
  saved.value = false
  const outcome = writeJsonStorage('lmdtAiOccupationDraft', { occupation: occupation.value, tasks: tasks.value, parameters }, { version: 1 })
  storageMessage.value = outcome.message
}, { deep: true })

function cloneTemplate(name) { return JSON.parse(JSON.stringify(occupationTemplates[name])) }
function loadTemplate() { tasks.value = cloneTemplate(occupation.value) }
function resetAll() { occupation.value = '人力资源专员'; tasks.value = cloneTemplate(occupation.value); Object.assign(parameters, { baselineEmployment: 100, taskSubstitution: 55, aiProductivity: 50, demandExpansion: 45, complementarity: 60, trainingInvestment: 50, aiCost: 35 }); activeChart.value = 'tasks' }
function applyClassroomPreset(preset) {
  applyPresetValues(preset, {
    occupation: value => { occupation.value = value; tasks.value = cloneTemplate(value) },
    taskSubstitution: value => { parameters.taskSubstitution = value },
    aiProductivity: value => { parameters.aiProductivity = value },
    demandExpansion: value => { parameters.demandExpansion = value },
    complementarity: value => { parameters.complementarity = value },
    trainingInvestment: value => { parameters.trainingInvestment = value },
    aiCost: value => { parameters.aiCost = value },
  })
  if (preset.chart) activeChart.value = preset.chart
}
function signed(value) { return `${value > 0 ? '+' : ''}${value}` }
function saveRecord() {
  const key = 'lmdtReportExperimentRecords'
  const stored = readJsonStorage(key, [])
  const records = Array.isArray(stored) ? stored : []
  const createdAt = new Date().toISOString()
  const record = {
    id: `ai-occupation-${Date.now()}`,
    experimentName: 'AI岗位任务重构',
    parameters: {
      岗位: occupation.value,
      替代强度: parameters.taskSubstitution,
      需求扩张: parameters.demandExpansion,
      互补性: parameters.complementarity,
      培训投入: parameters.trainingInvestment,
    },
    metrics: {
      任务暴露指数: result.value.exposureIndex,
      短期就业指数: result.value.shortTermEmployment,
      长期就业指数: result.value.longTermEmployment,
      最大技能缺口: result.value.topSkillGaps[0]?.name || '无',
    },
    conclusion: result.value.conclusion,
    initialPrediction: '',
    initialReason: '',
    baselineResult: null,
    counterfactualResult: null,
    studentExplanation: '',
    ruleFeedback: null,
    revisedExplanation: '',
    modelVersion: 'ai-occupation-3.0',
    dataSourceType: '教学情景参数',
    createdAt,
    timestamp: createdAt,
  }
  const recordOutcome = writeJsonStorage(key, [record, ...records].slice(0, 30), { version: 2 })
  const scenarioOutcome = writeJsonStorage('lmdtAiDemandScenario', { ...parameters, occupation: occupation.value, result: result.value }, { version: 1 })
  saved.value = recordOutcome.ok && scenarioOutcome.ok
  storageMessage.value = recordOutcome.message || scenarioOutcome.message
}
</script>

<style scoped>
.control-stack,.analysis-stack { display:grid; gap:14px; }.select-field,.range-field { display:grid; gap:7px; color:#cbd5e1; font-size:13px; font-weight:700 }.select-field select { min-height:40px; padding:0 10px; border:1px solid #334155; border-radius:6px; color:#f8fafc; background:#0f172a }.range-field span { display:flex; justify-content:space-between; gap:8px }.range-field strong { color:#7dd3fc }.range-field input { width:100%; accent-color:#38bdf8 }.control-boundary { margin:0; padding:10px; border-left:3px solid #fb923c; color:#fed7aa; background:rgba(251,146,60,.08); font-size:12px; line-height:1.5 }
.metric-strip { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px }.metric-strip article { min-width:0; padding:10px 12px; border:1px solid rgba(148,163,184,.14); border-radius:6px; background:#111b2e }.metric-strip span { display:block; color:#7f8da3; font-size:11px }.metric-strip strong { display:block; margin-top:4px; color:#f8fafc; font-size:20px }
.chart-card { height:100%; display:grid; grid-template-rows:auto minmax(0,1fr); padding:14px; border:1px solid rgba(148,163,184,.14); border-radius:7px; background:#111b2e }.chart-heading { display:flex; justify-content:space-between; gap:14px }.chart-heading span { color:#64748b; font-size:11px }.chart-heading h2 { margin:3px 0 0; font-size:17px }.chart-frame { min-height:0 }.drawer-copy,.record-box { display:grid; gap:12px; color:#cbd5e1; line-height:1.7 }.record-box button,.record-box a { min-height:40px; display:inline-flex; align-items:center; justify-content:center; padding:0 14px; border:1px solid #2563eb; border-radius:6px; color:#eff6ff; background:#1d4ed8; text-decoration:none; font-weight:800 }.record-box span { color:#86efac }.analysis-stack section { padding-bottom:14px; border-bottom:1px solid #263449 }.task-table { display:grid; gap:8px }.task-row { display:grid; grid-template-columns:minmax(150px,2fr) repeat(2,74px) 110px repeat(2,74px); gap:6px; padding:8px; border:1px solid #263449; background:#0f172a }.task-row label { display:grid; gap:3px; color:#64748b; font-size:10px }.task-row input,.task-row select { min-width:0; min-height:34px; padding:5px 7px; border:1px solid #334155; border-radius:4px; color:#e2e8f0; background:#111b2e }
.record-box .storage-error { color:#fca5a5; }
@media(max-width:760px){.metric-strip{grid-template-columns:repeat(2,1fr)}.task-row{grid-template-columns:1fr 1fr}.task-row>input{grid-column:1/-1}.metric-strip strong{font-size:16px}}
</style>
