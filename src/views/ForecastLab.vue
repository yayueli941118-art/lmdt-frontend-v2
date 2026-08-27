<template>
  <ExperimentWorkspace
    title="基础预测与情景推演实验室"
    subtitle="先判断 · 再选方法 · 做回测 · 比误差 · 修订结论"
    kicker="推未来 · FORECAST"
    :change-key="changeKey"
    :result-type="submitted ? '统计预测结果' : sourceType"
    :formula="methodMeta.formula"
    assumptions="历史口径在所选训练、测试和预测期内可比较；未来情景由学生显式设定。"
    :source="sourceDescription"
    scope="用于理解基础预测方法、留出回测、误差比较和情景假设。"
    limitation="历史回测最优不保证未来最优；乐观与悲观线是人为情景，不是统计置信区间。"
    :variables="`${targetMeta.label}（${targetMeta.unit}）；测试期 ${testSize}；预测期 ${horizon}`"
    default-basis="默认使用教学示例时间序列与可解释的基础方法。"
    reality-status="仅当学生导入并核实真实历史数据时，输出才可称为基于该数据的统计预测；情景区间仍不是置信区间。"
    :error="workspaceError"
    @reset="resetForecast"
  >
    <template #controls>
      <div class="forecast-controls">
        <section v-if="!submitted" class="prediction-gate">
          <span class="step-label">步骤 1 / 先预测</span>
          <fieldset>
            <legend>你认为未来{{ horizon }}期总体会怎样？</legend>
            <label v-for="item in directions" :key="item.value"><input v-model="initialDirection" type="radio" :value="item.value" />{{ item.label }}</label>
          </fieldset>
          <label><span>写下理由（至少10字）</span><textarea v-model="initialReason" rows="4" placeholder="请引用趋势、机制或情景假设，不要只写直觉。"></textarea></label>
          <button type="button" :disabled="!canSubmitPrediction" @click="submitPrediction">提交第一次判断</button>
        </section>

        <template v-else>
          <div class="initial-note">
            <span>你的第一次判断</span><strong>{{ directionLabel }}</strong><p>{{ initialReason }}</p>
          </div>
          <label class="control-field"><span>预测指标</span><select v-model="target"><option v-for="item in targets" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="control-field"><span>预测方法</span><select v-model="method"><option v-for="(item,key) in forecastMethods" :key="key" :value="key">{{ item.label }}</option></select></label>
          <label v-if="method === 'moving_average'" class="range-field"><span>移动平均窗口 <strong>{{ k }}期</strong></span><input v-model.number="k" type="range" min="2" max="5" step="1" /></label>
          <label class="range-field"><span>留出测试期 <strong>{{ testSize }}期</strong></span><input v-model.number="testSize" type="range" min="2" max="4" step="1" /></label>
          <label class="range-field"><span>未来预测期 <strong>{{ horizon }}期</strong></span><input v-model.number="horizon" type="range" min="2" max="6" step="1" /></label>
          <div class="scenario-pair">
            <label class="range-field"><span>乐观修正 <strong>+{{ optimisticRate }}%</strong></span><input v-model.number="optimisticRate" type="range" min="0" max="15" step="1" /></label>
            <label class="range-field"><span>悲观修正 <strong>{{ pessimisticRate }}%</strong></span><input v-model.number="pessimisticRate" type="range" min="-15" max="0" step="1" /></label>
          </div>
        </template>
      </div>
    </template>

    <template #metrics>
      <div class="metric-strip">
        <article><span>当前方法</span><strong class="metric-text">{{ submitted ? methodMeta.label : '等待第一次判断' }}</strong></article>
        <article><span>MAE</span><strong>{{ submitted && forecast ? forecast.backtest.errors.mae : '—' }}</strong></article>
        <article><span>RMSE</span><strong>{{ submitted && forecast ? forecast.backtest.errors.rmse : '—' }}</strong></article>
        <article><span>MAPE</span><strong>{{ submitted && forecast ? formatMape(forecast.backtest.errors) : '—' }}</strong></article>
      </div>
    </template>

    <template #primary>
      <div class="chart-card">
        <div class="chart-heading">
          <div><span>{{ targetMeta.unit }} · {{ sourceType }}</span><h2>{{ targetMeta.label }}：历史、回测与未来情景</h2></div>
          <RuntimeSourceBadge :type="submitted ? '统计预测结果' : sourceType" />
        </div>
        <div class="chart-frame"><LmdtChart :option="chartOption" aria-label="历史观测、回测预测和未来情景折线图" /></div>
        <p class="scenario-warning">乐观和悲观线来自人为增长修正，不是统计置信区间。</p>
      </div>
    </template>

    <template #change>
      <strong>{{ submitted ? decisionTitle : '先提交你的独立判断' }}</strong>
      <span>{{ submitted ? decisionText : '提交前只显示历史数据，不展示完整预测结论或方法排名。' }}</span>
    </template>

    <template #task>
      <div class="task-copy"><h3>学习闭环</h3><ol><li>先预测并写理由。</li><li>选择基础方法与留出期。</li><li>查看预测值和实际值。</li><li>比较MAE、RMSE、MAPE及有效样本数。</li><li>解释偏差并修改判断。</li><li>形成可验证的决策建议。</li></ol><p>历史拟合最好，不代表未来一定最好。</p></div>
    </template>

    <template #record>
      <div class="record-form">
        <h3>修改判断与实验记录</h3>
        <label><span>偏差解释</span><textarea v-model="deviationExplanation" rows="3"></textarea></label>
        <label><span>修订后的判断</span><textarea v-model="revisedJudgment" rows="3"></textarea></label>
        <label><span>最终决策含义</span><textarea v-model="decisionImplication" rows="3"></textarea></label>
        <div class="record-actions"><button type="button" @click="saveRecord">保存到当前浏览器</button><button type="button" @click="downloadRecord('md')">下载 Markdown</button><button type="button" @click="downloadRecord('json')">下载 JSON</button></div>
        <p v-if="recordSaved" role="status">记录已保存。</p>
      </div>
    </template>

    <template #analysis>
      <div class="analysis-stack">
        <section><h3>四种方法回测比较</h3><div class="method-table" role="table"><div class="table-head" role="row"><span>方法</span><span>MAE</span><span>RMSE</span><span>MAPE</span><span>有效样本</span></div><div v-for="item in methodComparison" :key="item.id" role="row" :class="{ selected: item.id === method }"><strong>{{ item.label }}</strong><span>{{ item.errors.mae }}</span><span>{{ item.errors.rmse }}</span><span>{{ item.errors.mape ?? '不适用' }}</span><span>{{ item.errors.mapeSamples }}/{{ item.errors.samples }}</span></div></div><p>比较用于理解误差，不自动替学生指定“最佳方法”。</p></section>
        <section class="method-boundary"><h3>{{ methodMeta.label }}</h3><p><strong>公式：</strong>{{ methodMeta.formula }}</p><p><strong>边界：</strong>{{ methodMeta.boundary }}</p></section>
        <AiAuditPanel storage-key="lmdtForecastAiAuditRecords" />
      </div>
    </template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AiAuditPanel from '../components/AiAuditPanel.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import LmdtChart from '../components/LmdtChart.vue'
import RuntimeSourceBadge from '../components/RuntimeSourceBadge.vue'
import { DOMAIN_MODEL_FAMILY_VERSION } from '../config/release'
import { calculateIndicators } from '../domain/indicators/model'
import { forecastMethods, runForecast } from '../domain/forecast/model'
import { parseCsv } from '../lib/csv'
import { readJsonStorage, removeJsonStorage, writeJsonStorage } from '../lib/storage'

const directions = [{ value: 'expand', label: '扩张' }, { value: 'stable', label: '稳定' }, { value: 'contract', label: '收缩' }, { value: 'restructure', label: '结构性调整' }]
const targets = [
  { value: 'vacancies', label: '职位空缺', unit: '指数/同口径数量' },
  { value: 'average_wage', label: '平均工资', unit: '元/月' },
  { value: 'employed', label: '就业人口', unit: '同口径人数' },
  { value: 'unemployment_rate', label: '失业率', unit: '%' },
]
const rows = ref([])
const sourceType = ref('教学示例数据')
const target = ref('vacancies')
const method = ref('naive')
const k = ref(3)
const testSize = ref(3)
const horizon = ref(3)
const optimisticRate = ref(6)
const pessimisticRate = ref(-5)
const initialDirection = ref('')
const initialReason = ref('')
const submitted = ref(false)
const deviationExplanation = ref('')
const revisedJudgment = ref('')
const decisionImplication = ref('')
const recordSaved = ref(false)
const storageError = ref('')

const indicatorRows = computed(() => calculateIndicators(rows.value).series)
const targetMeta = computed(() => targets.find(item => item.value === target.value))
const values = computed(() => indicatorRows.value.map(row => Number(row[target.value])).filter(Number.isFinite))
const periods = computed(() => indicatorRows.value.filter(row => Number.isFinite(Number(row[target.value]))).map(row => row.period))
const methodMeta = computed(() => forecastMethods[method.value])
const forecastError = computed(() => values.value.length < 4 ? '预测至少需要 4 期有效历史数据，请返回数据分析中心补充或修正数据。' : '')
const workspaceError = computed(() => forecastError.value || storageError.value)
const forecast = computed(() => forecastError.value ? null : runForecast(values.value, { method: method.value, k: k.value, testSize: testSize.value, horizon: horizon.value, optimisticRate: optimisticRate.value, pessimisticRate: pessimisticRate.value }))
const methodComparison = computed(() => forecastError.value ? [] : Object.entries(forecastMethods).map(([id, meta]) => ({ id, label: meta.label, errors: runForecast(values.value, { method: id, k: k.value, testSize: testSize.value, horizon: horizon.value }).backtest.errors })))
const canSubmitPrediction = computed(() => !forecastError.value && initialDirection.value && initialReason.value.trim().length >= 10)
const directionLabel = computed(() => directions.find(item => item.value === initialDirection.value)?.label || '')
const changeKey = computed(() => `${submitted.value}-${target.value}-${method.value}-${k.value}-${testSize.value}-${horizon.value}-${optimisticRate.value}-${pessimisticRate.value}`)
const sourceDescription = computed(() => sourceType.value === '用户导入数据' ? '来自数据分析中心中由用户导入并保存在当前浏览器的时间序列。' : '内置教学示例时间序列，不对应现实地区。')
const decisionTitle = computed(() => forecast.value ? `基准情景未来${horizon.value}期为 ${forecast.value.future.baseline.at(-1)?.toLocaleString('zh-CN')}` : '历史数据不足')
const decisionText = computed(() => forecast.value ? `${methodMeta.value.label}在留出期的 MAE 为 ${forecast.value.backtest.errors.mae}。请比较你的“${directionLabel.value}”判断，解释偏差后再形成决策。` : forecastError.value)

const chartOption = computed(() => {
  const futureLabels = Array.from({ length: horizon.value }, (_, index) => `未来${index + 1}`)
  const xData = [...periods.value, ...futureLabels]
  const history = [...values.value, ...Array(horizon.value).fill(null)]
  if (!submitted.value || !forecast.value) return baseChart(xData, [{ name: sourceType.value, type: 'line', data: history, symbolSize: 7, lineStyle: { width: 3 } }])
  const split = forecast.value.splitIndex
  const fitted = [...forecast.value.fitted, ...Array(horizon.value).fill(null)]
  const testPrediction = Array(periods.value.length).fill(null)
  forecast.value.backtest.predictions.forEach((value, index) => { testPrediction[split + index] = value })
  const futurePrefix = Array(periods.value.length - 1).fill(null)
  const anchor = values.value.at(-1)
  const withFuture = data => [...futurePrefix, anchor, ...data]
  return baseChart(xData, [
    { name: '历史观测', type: 'line', data: history, symbolSize: 6, lineStyle: { width: 3 }, color: '#94a3b8' },
    { name: '历史拟合', type: 'line', data: fitted, showSymbol: false, lineStyle: { width: 2, type: 'dashed' }, color: '#22d3ee' },
    { name: '测试期预测', type: 'line', data: testPrediction, symbolSize: 8, lineStyle: { width: 3 }, color: '#f59e0b', markLine: { symbol: 'none', label: { color: '#cbd5e1', formatter: '训练 / 测试分界' }, lineStyle: { color: '#64748b', type: 'dashed' }, data: [{ xAxis: periods.value[split] }] } },
    { name: '未来基准预测', type: 'line', data: withFuture(forecast.value.future.baseline), symbolSize: 7, lineStyle: { width: 3 }, color: '#3b82f6' },
    { name: '人为乐观情景', type: 'line', data: withFuture(forecast.value.future.optimistic), showSymbol: false, lineStyle: { width: 2, type: 'dotted' }, color: '#34d399' },
    { name: '人为悲观情景', type: 'line', data: withFuture(forecast.value.future.pessimistic), showSymbol: false, lineStyle: { width: 2, type: 'dotted' }, color: '#f87171' },
  ])
})

function baseChart(xData, series) {
  return { animationDuration: 420, grid: { left: 62, right: 24, top: 56, bottom: 46 }, tooltip: { trigger: 'axis' }, legend: { top: 4, type: 'scroll', textStyle: { color: '#cbd5e1' } }, xAxis: { type: 'category', data: xData, axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } } }, yAxis: { type: 'value', name: targetMeta.value.unit, scale: target.value !== 'unemployment_rate', min: target.value === 'unemployment_rate' ? 0 : undefined, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.14)' } } }, series }
}

onMounted(async () => {
  const marketSaved = readJsonStorage('lmdtMarketTimeseries', null)
  if (Array.isArray(marketSaved)) { rows.value = marketSaved; sourceType.value = '用户导入数据' } else await loadSample()
  const state = readJsonStorage('lmdtForecastDraft', null)
  if (state) { initialDirection.value = state.initialDirection || ''; initialReason.value = state.initialReason || ''; submitted.value = Boolean(state.submitted) }
})

async function loadSample() { const response = await fetch(`${import.meta.env.BASE_URL}data/teaching-sample-timeseries.csv`); rows.value = parseCsv(await response.text()).rows }
function submitPrediction() { if (!canSubmitPrediction.value) return; submitted.value = true; const outcome = writeJsonStorage('lmdtForecastDraft', { initialDirection: initialDirection.value, initialReason: initialReason.value.trim(), submitted: true }, { version: 1 }); storageError.value = outcome.message }
function resetForecast() { method.value = 'naive'; k.value = 3; testSize.value = 3; horizon.value = 3; optimisticRate.value = 6; pessimisticRate.value = -5; initialDirection.value = ''; initialReason.value = ''; submitted.value = false; storageError.value = ''; removeJsonStorage('lmdtForecastDraft') }
function formatMape(errors) { return errors.mape === null ? `不适用（0/${errors.samples}）` : `${errors.mape}%（${errors.mapeSamples}/${errors.samples}）` }
function recordPayload() { return { experiment: '基础预测与情景推演', target: targetMeta.value.label, sourceType: sourceType.value, initialPrediction: directionLabel.value, initialReason: initialReason.value, method: methodMeta.value.label, parameters: { k: k.value, testSize: testSize.value, horizon: horizon.value, optimisticRate: optimisticRate.value, pessimisticRate: pessimisticRate.value }, errors: forecast.value.backtest.errors, future: forecast.value.future, deviationExplanation: deviationExplanation.value, revisedJudgment: revisedJudgment.value, decisionImplication: decisionImplication.value, createdAt: new Date().toISOString(), modelVersion: DOMAIN_MODEL_FAMILY_VERSION } }
function saveRecord() { const records = readJsonStorage('lmdtForecastRecords', []); const outcome = writeJsonStorage('lmdtForecastRecords', [...(Array.isArray(records) ? records : []), recordPayload()].slice(-50), { version: 1 }); recordSaved.value = outcome.ok; storageError.value = outcome.message }
function downloadRecord(format) { const data = recordPayload(); const content = format === 'json' ? JSON.stringify(data, null, 2) : `# 基础预测实验记录\n\n- 指标：${data.target}\n- 来源：${data.sourceType}\n- 第一次判断：${data.initialPrediction}\n- 理由：${data.initialReason}\n- 方法：${data.method}\n- MAE：${data.errors.mae}\n- RMSE：${data.errors.rmse}\n- MAPE：${data.errors.mape ?? '不适用'}\n\n## 偏差解释\n${data.deviationExplanation || '待填写'}\n\n## 修订判断\n${data.revisedJudgment || '待填写'}\n\n## 决策含义\n${data.decisionImplication || '待填写'}\n`; const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `lmdt-forecast-record.${format}`; a.click(); URL.revokeObjectURL(url) }
</script>

<style scoped>
.forecast-controls, .analysis-stack { display: grid; gap: 14px; }.prediction-gate { display: grid; gap: 13px; }.step-label { color: #7dd3fc; font-size: 11px; font-weight: 850; }.prediction-gate fieldset { display: grid; grid-template-columns: repeat(2,1fr); gap: 7px; border: 0; }.prediction-gate legend { grid-column: 1/-1; margin-bottom: 7px; color: #e2e8f0; font-size: 13px; font-weight: 750; }.prediction-gate fieldset label { min-height: 38px; padding: 9px; border: 1px solid #334155; border-radius: 6px; color: #cbd5e1; font-size: 13px; }.prediction-gate label:not(fieldset label), .record-form label { display: grid; gap: 7px; color: #cbd5e1; font-size: 13px; font-weight: 750; }.prediction-gate textarea,.record-form textarea { width: 100%; padding: 9px; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; background: #0f172a; font: inherit; resize: vertical; }.prediction-gate button,.record-actions button { min-height: 40px; border: 0; border-radius: 6px; color: white; background: #2563eb; font-weight: 800; cursor: pointer; }.prediction-gate button:disabled { opacity: .45; cursor: not-allowed; }.initial-note { padding: 11px; border-left: 3px solid #38bdf8; background: rgba(14,116,144,.1); }.initial-note span { display: block; color: #7dd3fc; font-size: 11px; }.initial-note strong { display: block; margin-top: 4px; }.initial-note p { margin: 5px 0 0; color: #cbd5e1; font-size: 12px; line-height: 1.45; }.control-field,.range-field { display: grid; gap: 7px; color: #cbd5e1; font-size: 13px; }.control-field select { min-height: 38px; padding: 0 9px; border: 1px solid #334155; border-radius: 6px; color: white; background: #0f172a; }.range-field span { display: flex; justify-content: space-between; }.range-field strong { color: #7dd3fc; }.range-field input { accent-color: #3b82f6; }.scenario-pair { display: grid; gap: 12px; padding-top: 12px; border-top: 1px solid #263449; }
.metric-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; width: 100%; }.metric-strip article { min-width: 0; padding: 10px 12px; border: 1px solid rgba(148,163,184,.13); border-radius: 6px; background: #111b2e; }.metric-strip span { color: #7f8da3; font-size: 11px; }.metric-strip strong { display: block; margin-top: 5px; color: #f8fafc; font-size: 19px; }.metric-strip .metric-text { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.chart-card { height: 100%; display: grid; grid-template-rows: auto 1fr auto; min-height: 0; padding: 14px; border: 1px solid rgba(148,163,184,.14); border-radius: 7px; background: #111b2e; }.chart-heading { display: flex; justify-content: space-between; gap: 14px; align-items: start; }.chart-heading > div > span { color: #64748b; font-size: 11px; }.chart-heading h2 { margin: 3px 0 0; font-size: 17px; }.chart-frame { min-height: 0; }.scenario-warning { margin: 0; color: #fcd34d; font-size: 11px; text-align: right; }.task-copy { color: #cbd5e1; line-height: 1.7; }.task-copy ol { padding-left: 22px; }.record-form { display: grid; gap: 12px; }.record-actions { display: flex; flex-wrap: wrap; gap: 8px; }.record-actions button { padding: 0 13px; }.record-form > p { color: #86efac; }.analysis-stack > section { padding-bottom: 15px; border-bottom: 1px solid #263449; }.analysis-stack h3 { margin: 0 0 10px; }.method-table { display: grid; gap: 4px; }.method-table > div { display: grid; grid-template-columns: 1.5fr repeat(4,1fr); gap: 8px; padding: 8px; color: #cbd5e1; font-size: 12px; }.method-table .table-head { color: #7f8da3; font-weight: 800; }.method-table .selected { background: rgba(37,99,235,.13); }.analysis-stack p { color: #94a3b8; line-height: 1.55; }
@media (max-width:760px){.metric-strip{grid-template-columns:repeat(2,1fr)}.method-table>div{grid-template-columns:1.5fr repeat(2,1fr)}.method-table>div span:nth-child(n+4){display:none}}
</style>
