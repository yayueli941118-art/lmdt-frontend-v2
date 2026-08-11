<template>
  <ExperimentWorkspace
    title="劳动力市场数据分析中心"
    subtitle="导入时间序列 · 核查数据质量 · 计算指标 · 解释趋势与边界"
    kicker="看市场 · DATA"
    :change-key="changeKey"
    :result-type="sourceType"
    :formula="currentMeta.formula"
    assumptions="各期间及分组使用一致统计口径；缺失值不自动填补。"
    :source="sourceDescription"
    scope="用于宏观、行业或职业时间序列的结构、趋势和比较分析。"
    :limitation="currentMeta.boundary"
    :variables="`${currentMeta.numerator}；${currentMeta.denominator}；单位 ${currentMeta.unit}`"
    default-basis="默认加载明确标注的教学示例数据，学生可替换为自行核实的数据。"
    :reality-status="realityStatus"
    @reset="loadTeachingSample"
  >
    <template #controls>
      <div class="control-stack">
        <section class="control-section">
          <span class="section-label">数据入口</span>
          <a class="template-link" :href="templateUrl" download>下载时间序列CSV模板</a>
          <label class="file-control">
            <span>导入CSV文件</span>
            <input type="file" accept=".csv,text/csv" @change="importFile" />
          </label>
          <button type="button" class="secondary-button" @click="loadTeachingSample">载入教学示例</button>
        </section>

        <section class="control-section">
          <label class="field-control">
            <span>分析指标</span>
            <select v-model="indicator">
              <option v-for="(meta, key) in indicatorMeta" :key="key" :value="key">{{ meta.label }}</option>
            </select>
          </label>
          <div class="formula-box">
            <strong>{{ currentMeta.label }}</strong>
            <span>{{ currentMeta.formula }}</span>
            <small>单位：{{ currentMeta.unit }}</small>
          </div>
        </section>

        <section class="quality-compact" :class="`grade-${quality.grade}`">
          <div><span>数据质量</span><strong>{{ quality.grade }}级</strong></div>
          <p>{{ quality.canAnalyze ? '可继续分析；仍需阅读警告与口径。' : '存在阻断错误，图表不会伪造缺失结果。' }}</p>
          <dl>
            <div><dt>记录</dt><dd>{{ rows.length }}</dd></div>
            <div><dt>错误</dt><dd>{{ totalErrors }}</dd></div>
            <div><dt>警告</dt><dd>{{ quality.warnings.length }}</dd></div>
          </dl>
        </section>
      </div>
    </template>

    <template #metrics>
      <div class="metric-strip">
        <article><span>最新期间</span><strong>{{ latest?.period || '—' }}</strong></article>
        <article><span>{{ currentMeta.label }}</span><strong>{{ formatValue(latest?.[indicator]) }}</strong></article>
        <article><span>较上期</span><strong :class="changeTone">{{ changeLabel }}</strong></article>
        <article><span>来源口径</span><strong class="metric-text">{{ sourceType }}</strong></article>
      </div>
    </template>

    <template #primary>
      <div class="chart-card main-chart">
        <div class="chart-heading">
          <div><span>{{ currentMeta.unit }} · {{ rows.length }}期</span><h2>{{ currentMeta.label }}趋势</h2></div>
          <RuntimeSourceBadge :type="sourceType" />
        </div>
        <div v-if="quality.canAnalyze" class="chart-frame">
          <LmdtChart :option="chartOption" :aria-label="`${currentMeta.label}时间序列图`" />
        </div>
        <div v-else class="blocked-state" role="status">
          <strong>数据质量检查未通过</strong>
          <span>请在“更多分析”中定位阻断行；系统不会自动补值或继续计算。</span>
        </div>
      </div>
    </template>

    <template #change>
      <strong>{{ feedbackTitle }}</strong>
      <span>{{ feedbackText }}</span>
    </template>

    <template #task>
      <div class="task-copy">
        <h3>本次任务</h3>
        <p>先检查来源、日期、单位和错误清单，再选择一个指标，用公式解释最近一期变化。</p>
        <ol><li>指出分子和分母。</li><li>描述趋势，不急于解释原因。</li><li>写出一项能够得出的结论和一项不能推出的结论。</li></ol>
      </div>
    </template>

    <template #analysis>
      <div class="analysis-stack">
        <section>
          <h3>数据质量清单</h3>
          <div v-if="!totalErrors && !quality.warnings.length" class="quality-pass">未发现结构错误；仍需人工核实数据来源与口径。</div>
          <ul class="issue-list">
            <li v-for="issue in importErrors" :key="`import-${issue.row}-${issue.code}`"><strong>导入错误 · 第{{ issue.row }}行</strong><span>{{ issue.message }}</span></li>
            <li v-for="issue in quality.errors" :key="`error-${issue.row}-${issue.code}`"><strong>阻断错误 · {{ issue.row ? `第${issue.row}行` : '文件级' }}</strong><span>{{ issue.message }}</span></li>
            <li v-for="issue in quality.warnings" :key="`warning-${issue.row}-${issue.code}`" class="warning"><strong>警告 · {{ issue.row ? `第${issue.row}行` : '文件级' }}</strong><span>{{ issue.message }}</span></li>
          </ul>
        </section>
        <section class="indicator-boundary">
          <h3>指标解释边界</h3>
          <dl><div><dt>公式</dt><dd>{{ currentMeta.formula }}</dd></div><div><dt>可以说明</dt><dd>{{ currentMeta.conclusion }}</dd></div><div><dt>不能推出</dt><dd>{{ currentMeta.boundary }}</dd></div></dl>
        </section>
        <AiAuditPanel storage-key="lmdtMarketAiAuditRecords" />
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
import { calculateIndicators, indicatorMeta, validateTimeSeries } from '../domain/indicators/model'
import { parseCsv } from '../lib/csv'

const rows = ref([])
const indicator = ref('unemployment_rate')
const sourceType = ref('教学示例数据')
const importErrors = ref([])
const templateUrl = `${import.meta.env.BASE_URL}data/labor-market-timeseries-template.csv`

const quality = computed(() => validateTimeSeries(rows.value))
const analytics = computed(() => calculateIndicators(rows.value))
const currentMeta = computed(() => indicatorMeta[indicator.value])
const points = computed(() => analytics.value.series.filter(row => row[indicator.value] !== null))
const latest = computed(() => points.value.at(-1))
const previous = computed(() => points.value.at(-2))
const totalErrors = computed(() => quality.value.errors.length + importErrors.value.length)
const change = computed(() => latest.value && previous.value ? latest.value[indicator.value] - previous.value[indicator.value] : null)
const changeKey = computed(() => `${indicator.value}-${latest.value?.[indicator.value]}-${quality.value.grade}`)
const changeTone = computed(() => change.value > 0 ? 'up' : change.value < 0 ? 'down' : '')
const changeLabel = computed(() => change.value === null ? '缺少可比期' : `${change.value > 0 ? '+' : ''}${change.value.toFixed(2)} ${currentMeta.value.unit}`)
const sourceDescription = computed(() => sourceType.value === '用户导入数据'
  ? '当前浏览器中由用户导入的CSV；来源、日期和口径由使用者负责核实。'
  : '系统内置的教学示例数据，不对应现实地区。')
const realityStatus = computed(() => sourceType.value === '用户导入数据'
  ? '只有在来源、日期、样本范围和统计口径均经核实后，才可作为历史数据分析；本页本身不保证数据真实性。'
  : '否。当前为教学示例数据分析。')
const feedbackTitle = computed(() => quality.value.canAnalyze ? `${currentMeta.value.label}已按公式计算` : '先修复数据，再解释趋势')
const feedbackText = computed(() => quality.value.canAnalyze
  ? `${currentMeta.value.conclusion} ${currentMeta.value.boundary}`
  : `当前有 ${totalErrors.value} 项阻断错误；系统没有静默填补或伪造缺失数据。`)

const chartOption = computed(() => ({
  animationDuration: 420,
  color: ['#38bdf8', '#f59e0b'],
  grid: { left: 58, right: 28, top: 42, bottom: 44 },
  tooltip: { trigger: 'axis', valueFormatter: value => value === null ? '缺失' : `${value} ${currentMeta.value.unit}` },
  legend: { top: 2, textStyle: { color: '#cbd5e1' } },
  xAxis: { type: 'category', name: '期间', data: points.value.map(row => row.period), axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#475569' } } },
  yAxis: { type: 'value', name: currentMeta.value.unit, scale: indicator.value.includes('rate') || indicator.value.includes('share'), min: indicator.value.includes('rate') || indicator.value.includes('share') ? 0 : undefined, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.14)' } } },
  series: [{ name: currentMeta.value.label, type: 'line', smooth: false, symbolSize: 8, data: points.value.map(row => row[indicator.value]), lineStyle: { width: 3 }, areaStyle: { opacity: .08 } }],
}))

onMounted(async () => {
  const saved = localStorage.getItem('lmdtMarketTimeseries')
  if (saved) {
    try { rows.value = JSON.parse(saved); sourceType.value = '用户导入数据'; return } catch { /* load sample below */ }
  }
  await loadTeachingSample()
})

async function loadTeachingSample() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/teaching-sample-timeseries.csv`)
  const parsed = parseCsv(await response.text())
  rows.value = parsed.rows
  importErrors.value = parsed.errors
  sourceType.value = '教学示例数据'
  localStorage.removeItem('lmdtMarketTimeseries')
}

async function importFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const parsed = parseCsv(await file.text())
  rows.value = parsed.rows
  importErrors.value = parsed.errors
  sourceType.value = '用户导入数据'
  localStorage.setItem('lmdtMarketTimeseries', JSON.stringify(parsed.rows))
  event.target.value = ''
}

function formatValue(value) {
  return value === null || value === undefined ? '—' : `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}${currentMeta.value.unit}`
}
</script>

<style scoped>
.control-stack, .analysis-stack { display: grid; gap: 16px; }
.control-section { display: grid; gap: 10px; padding-bottom: 15px; border-bottom: 1px solid rgba(148,163,184,.14); }
.section-label { color: #7dd3fc; font-size: 11px; font-weight: 850; text-transform: uppercase; }
.template-link, .secondary-button { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; border: 1px solid #334155; border-radius: 6px; color: #dbeafe; background: #111b2e; text-decoration: none; font-weight: 750; cursor: pointer; }
.file-control, .field-control { display: grid; gap: 7px; color: #cbd5e1; font-size: 13px; font-weight: 750; }
.file-control input { width: 100%; color: #94a3b8; font-size: 12px; }
.field-control select { min-height: 40px; padding: 0 10px; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; background: #0f172a; }
.formula-box { display: grid; gap: 5px; padding: 11px; border-left: 3px solid #38bdf8; background: rgba(14,116,144,.1); }
.formula-box strong { font-size: 13px; }.formula-box span,.formula-box small { color: #94a3b8; font-size: 12px; line-height: 1.45; }
.quality-compact { padding: 13px; border: 1px solid #334155; border-radius: 7px; background: #111b2e; }
.quality-compact > div { display: flex; align-items: center; justify-content: space-between; }.quality-compact strong { color: #86efac; font-size: 20px; }.quality-compact p { margin: 6px 0 10px; color: #94a3b8; font-size: 12px; line-height: 1.45; }
.quality-compact dl { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; }.quality-compact dl div { padding: 7px; background: #0f172a; text-align: center; }.quality-compact dt { color: #64748b; font-size: 10px; }.quality-compact dd { margin: 2px 0 0; color: #e2e8f0; font-weight: 850; }.grade-D strong { color: #fca5a5; }
.metric-strip { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; width: 100%; }.metric-strip article { min-width: 0; padding: 10px 12px; border: 1px solid rgba(148,163,184,.13); border-radius: 6px; background: #111b2e; }.metric-strip span { display: block; color: #7f8da3; font-size: 11px; }.metric-strip strong { display: block; margin-top: 5px; overflow: hidden; color: #f8fafc; font-size: 19px; text-overflow: ellipsis; white-space: nowrap; }.metric-strip .metric-text { font-size: 14px; }.metric-strip .up { color: #fbbf24; }.metric-strip .down { color: #7dd3fc; }
.chart-card { height: 100%; display: grid; grid-template-rows: auto 1fr; padding: 14px; border: 1px solid rgba(148,163,184,.14); border-radius: 7px; background: #111b2e; }.chart-heading { display: flex; justify-content: space-between; gap: 16px; align-items: start; }.chart-heading span { color: #64748b; font-size: 11px; }.chart-heading h2 { margin: 3px 0 0; font-size: 17px; }.chart-frame { min-height: 0; }.blocked-state { display: grid; place-content: center; gap: 8px; text-align: center; color: #fca5a5; }.blocked-state span { color: #94a3b8; }
.task-copy { color: #cbd5e1; line-height: 1.7; }.task-copy ol { padding-left: 22px; }
.analysis-stack > section { padding-bottom: 16px; border-bottom: 1px solid #263449; }.analysis-stack h3 { margin: 0 0 10px; }.quality-pass { color: #86efac; }.issue-list { display: grid; gap: 7px; padding: 0; list-style: none; }.issue-list li { display: grid; gap: 3px; padding: 9px; border-left: 3px solid #f87171; background: rgba(127,29,29,.12); }.issue-list li.warning { border-color: #fbbf24; background: rgba(120,53,15,.12); }.issue-list strong { font-size: 12px; }.issue-list span { color: #cbd5e1; font-size: 12px; }.indicator-boundary dl { display: grid; gap: 8px; }.indicator-boundary dl div { display: grid; grid-template-columns: 90px 1fr; gap: 12px; }.indicator-boundary dt { color: #7dd3fc; font-weight: 800; }.indicator-boundary dd { margin: 0; color: #cbd5e1; }
@media (max-width: 760px) { .metric-strip { grid-template-columns: repeat(2,1fr); }.metric-strip strong { font-size: 15px; } }
</style>
