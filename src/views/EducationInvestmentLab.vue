<template>
  <ExperimentWorkspace
    class="education-investment"
    title="个人教育投资测算"
    subtitle="填投入与收益假设 · 拉观察年限 · 看现金流与回本 · 写下三句判断"
    kicker="CH.04 · 人力资本投资"
    back-to="/lab/individual"
    result-type="教学情景参数"
    formula="第0年差额现金流为0；NPV = Σ ΔCFt / (1+r)^t。折现回收期是累计折现净现金流首次由负转为非负的年份。"
    assumptions="以不投资方案为对照。投入期每年差额现金流 = -直接成本 - 机会成本；回报期每年差额现金流 = 相对对照方案的增量收入。"
    source="《劳动经济学》人力资本投资章节：直接成本、机会成本、现值、回收期与内部收益率。"
    scope="比较自己填写的假设如何影响年度差额现金流和观察期内回本状态。"
    limitation="对个人真实工资、升学结果或投资收益作精确预测；NPV为负也不能推出教育没有价值。"
    variables="金额为元/年；折现率为年率；第0年为决策时点，第1年起逐年投入或获得增量收益。"
    default-basis="所有预设均为假想的教学示例，不是现实工资估计。"
    model-version="education-investment-delta-cf-1.0"
    :change-key="params"
    @reset="resetExample"
  >
    <template #controls>
      <div class="investment-controls">
        <p class="example-label">教学示例 · 假想参数，不是现实收益估计</p>
        <label class="field">我想比较的选择
          <select v-model="projectType" @change="resetExample"><option v-for="name in projectTypes" :key="name">{{ name }}</option></select>
        </label>
        <label v-if="projectType === '自定义'" class="field">自定义名称<input v-model="customName" type="text" maxlength="24" placeholder="例如：转岗学习" /></label>
        <button type="button" class="example-button" @click="resetExample">恢复这组教学示例</button>

        <label class="field">每年直接投入 <span>元/年</span>
          <input v-model.number="params.annualDirectCost" type="number" min="0" max="1000000" step="1000" />
        </label>
        <label class="field">投入几年 <span>{{ params.investmentYears }} 年</span>
          <input v-model.number="params.investmentYears" type="range" min="0" max="10" step="1" />
        </label>
        <label class="field">在校或培训每年少挣的钱 <span>元/年，可填0</span>
          <input v-model.number="params.annualOpportunityCost" type="number" min="0" max="1000000" step="1000" />
        </label>
        <label class="field">投资后每年多挣的钱 <span>元/年</span>
          <input v-model.number="params.annualIncrement" type="number" min="0" max="1000000" step="1000" />
        </label>
        <div class="field discount-field">
          <label for="discount-rate">折现率 <button type="button" class="help-button" aria-label="什么是折现率" :aria-expanded="showDiscountHelp" @click="showDiscountHelp = !showDiscountHelp">?</button><span>{{ (params.discountRate * 100).toFixed(1) }}%/年</span></label>
          <p v-if="showDiscountHelp" class="help-text">未来的一万元，不等于今天的一万元。折现率越高，越靠后的收益，折算成今天的价值越少。这里用于比较不同时间成本和不确定性，不是你个人唯一正确的利率。</p>
          <input id="discount-rate" v-model.number="params.discountRate" type="range" min="0" max="0.2" step="0.005" />
          <div class="rate-options" aria-label="折现率教学情景"><button v-for="rate in [0.03, 0.05, 0.08]" :key="rate" type="button" :class="{ selected: params.discountRate === rate }" @click="params.discountRate = rate">{{ rate * 100 }}% · {{ rate === 0.03 ? '低' : rate === 0.05 ? '中' : '高' }}</button></div>
          <small>三档仅用于时间成本或不确定性的课堂比较，不是利率预测。</small>
        </div>
        <label class="field">观察到第几年 <span>第 {{ params.horizonYears }} 年</span>
          <input v-model.number="params.horizonYears" data-testid="observation-slider" type="range" min="0" max="40" step="1" />
        </label>
        <p class="boundary-note">仅比较当前假设下相对“不投资方案”的金钱差额；NPV为负不等于教育没有价值。</p>

        <section class="judgment" aria-label="我的教育投资判断">
          <h2>我的教育投资判断</h2>
          <label>我原来和现在的选择<textarea v-model="judgment.choice" rows="2" placeholder="原来我会……；现在我会……" /></label>
          <label>最不确定且最影响结果的一个假设<textarea v-model="judgment.uncertainty" rows="2" placeholder="例如：投资后每年增量收入" /></label>
          <label>什么变化会让我改变选择<textarea v-model="judgment.change" rows="2" placeholder="例如：增量收入低于……" /></label>
          <button type="button" class="copy-button" @click="copyJudgment">{{ copyState }}</button>
          <p>输入只在当前页面使用，不向外部服务器发送；离开后不会保存。</p>
        </section>
      </div>
    </template>

    <template #metrics>
      <div class="investment-metrics">
        <div><span>观察期 NPV</span><strong :class="result.npv < 0 ? 'negative' : 'positive'">{{ money(result.npv) }}</strong></div>
        <div><span>折现回收期</span><strong>{{ result.paybackYear === null ? '期内未回本' : `第${result.paybackYear}年` }}</strong></div>
        <div><span>IRR</span><strong>{{ result.irr.value === null ? '不适用' : percent(result.irr.value) }}</strong></div>
      </div>
    </template>

    <template #primary>
      <div class="investment-visual">
        <div class="chart-caption"><strong>年度现金流与折现累计</strong><span>横轴：决策后年份 · 金额单位：元</span></div>
        <LmdtChart class="investment-chart" :option="chartOption" aria-label="逐年差额现金流柱状图与累计折现净现金流曲线" />
        <div class="year-detail" data-testid="year-detail">
          <strong>第 {{ current.year }} 年 · {{ current.phase }}</strong>
          <span>直接投入 {{ money(current.directCost) }}</span>
          <span>机会成本 {{ money(current.opportunityCost) }}</span>
          <span>增量收入 {{ money(current.incrementalEarnings) }}</span>
          <span>当年折现现金流 {{ money(current.discountedCashFlow) }}</span>
          <span>累计折现净现金流 {{ money(current.cumulativeDiscounted) }}</span>
          <span class="payback-note">{{ result.paybackStatus }}</span>
        </div>
      </div>
    </template>

    <template #change>
      教学示例 NPV {{ money(exampleNpv) }} → 当前 {{ money(result.npv) }}。{{ result.wageCrossoverYear === null ? '观察期内没有工资反超年份' : `工资从第${result.wageCrossoverYear}年开始更高` }}，但这不等于已收回投入。{{ result.irr.reason }}
    </template>

    <template #model>
      <p class="model-note">本页计算的是“{{ projectName }} vs 不投资方案”的逐年差额现金流，机会成本已单独计入投入期，不再从增量收入重复扣除。它不同于原“本科对高中”的明瑟工资路径与教育 NPV/IRR，请勿混用数值。</p>
    </template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import LmdtChart from '../components/LmdtChart.vue'
import { EDUCATION_EXAMPLES, simulateEducationInvestment } from '../domain/educationInvestment/model'

const projectTypes = Object.keys(EDUCATION_EXAMPLES)
const projectType = ref('考研')
const customName = ref('')
const projectName = computed(() => projectType.value === '自定义' ? customName.value.trim() || '自定义教育投资' : projectType.value)
const params = reactive({ ...EDUCATION_EXAMPLES.考研 })
const judgment = reactive({ choice: '', uncertainty: '', change: '' })
const showDiscountHelp = ref(false)
const copyState = ref('复制我的教育投资判断')
const result = computed(() => simulateEducationInvestment(params))
const current = computed(() => result.value.rows.at(-1))
const exampleNpv = computed(() => simulateEducationInvestment({ ...EDUCATION_EXAMPLES[projectType.value], horizonYears: params.horizonYears }).npv)
const money = value => `${Math.round(value).toLocaleString('zh-CN')}元`
const percent = value => `${(value * 100).toFixed(2)}%`

function resetExample() {
  Object.assign(params, EDUCATION_EXAMPLES[projectType.value])
}

const chartOption = computed(() => {
  const rows = result.value.rows
  const years = rows.map(row => `${row.year}`)
  const investing = Math.min(result.value.assumptions.investmentYears, result.value.assumptions.horizonYears)
  const phases = []
  if (investing > 0) phases.push([{ name: '投入期', xAxis: '1', itemStyle: { color: 'rgba(245,158,11,.08)' } }, { xAxis: `${investing}` }])
  if (result.value.assumptions.horizonYears > investing) phases.push([{ name: '回报期', xAxis: `${investing + 1}`, itemStyle: { color: 'rgba(20,184,166,.06)' } }, { xAxis: `${result.value.assumptions.horizonYears}` }])
  return {
    animationDuration: 350,
    animationDurationUpdate: 350,
    backgroundColor: 'transparent',
    color: ['#f59e0b', '#22d3ee'],
    grid: { top: 34, right: 55, bottom: 34, left: 55, containLabel: false },
    legend: { top: 3, textStyle: { color: '#cbd5e1', fontSize: 11 } },
    tooltip: { trigger: 'axis', confine: true, formatter: items => {
      const row = rows[items[0].dataIndex]
      return `第${row.year}年 · ${row.phase}<br/>直接投入：${money(row.directCost)}<br/>机会成本：${money(row.opportunityCost)}<br/>增量收入：${money(row.incrementalEarnings)}<br/>当年差额现金流：${money(row.cashFlow)}<br/>当年折现现金流：${money(row.discountedCashFlow)}<br/>累计折现净现金流：${money(row.cumulativeDiscounted)}`
    } },
    xAxis: { type: 'category', data: years, name: '年', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8', interval: 'auto' }, axisLine: { lineStyle: { color: '#64748b' } } },
    yAxis: [
      { type: 'value', axisLabel: { color: '#fbbf24', formatter: value => `${Number((value / 10000).toFixed(1))}万` }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.14)' } } },
      { type: 'value', axisLabel: { color: '#67e8f9', formatter: value => `${Number((value / 10000).toFixed(1))}万` }, splitLine: { show: false } },
    ],
    series: [
      { name: '逐年差额现金流', type: 'bar', yAxisIndex: 0, data: rows.map(row => row.cashFlow), barMaxWidth: 20, itemStyle: { color: item => item.value < 0 ? '#f59e0b' : '#10b981' }, markArea: { silent: true, label: { color: '#94a3b8', fontSize: 10 }, data: phases }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#cbd5e1', width: 1 }, data: [{ yAxis: 0 }] } },
      { name: '累计折现净现金流', type: 'line', yAxisIndex: 1, data: rows.map(row => row.cumulativeDiscounted), smooth: false, showSymbol: rows.length < 12, symbolSize: 6, lineStyle: { width: 3 }, areaStyle: { color: 'rgba(34,211,238,.08)' }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#cbd5e1', width: 1, type: 'dashed' }, data: [{ yAxis: 0 }] } },
    ],
  }
})

async function copyJudgment() {
  const a = result.value.assumptions
  const lines = [
    `我的教育投资判断：${projectName.value} vs 不投资方案`,
    '教学情景，不是现实预测。',
    `口径：第0年为决策起点；投入期每年差额现金流=-直接投入-机会成本，回报期=相对不投资方案的每年增量收入；NPV=ΣΔCFt/(1+r)^t。`,
    `参数：每年直接投入${money(a.annualDirectCost)}，投入${a.investmentYears}年，每年机会成本${money(a.annualOpportunityCost)}，投资后每年增量收入${money(a.annualIncrement)}，折现率${percent(a.discountRate)}，观察至第${a.horizonYears}年。`,
    `结果：NPV ${money(result.value.npv)}；${result.value.paybackStatus}；IRR ${result.value.irr.value === null ? result.value.irr.reason : percent(result.value.irr.value)}。`,
    `1. 我原来和现在的选择：${judgment.choice.trim() || '（待填写）'}`,
    `2. 最不确定且最影响结果的一个假设：${judgment.uncertainty.trim() || '（待填写）'}`,
    `3. 什么变化会让我改变选择：${judgment.change.trim() || '（待填写）'}`,
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyState.value = '已复制判断'
  } catch {
    copyState.value = '复制失败，请检查浏览器权限'
  }
}
</script>

<style scoped>
.education-investment { --ink: #e2e8f0; }
.investment-controls { display: grid; gap: 12px; color: var(--ink); }
.example-label { margin: 0; padding: 9px 11px; border-left: 3px solid #f59e0b; color: #fcd34d; background: #172337; font-size: 12px; line-height: 1.4; }
.field, .judgment label { display: grid; gap: 6px; color: #dbeafe; font-size: 13px; font-weight: 700; }
.field > span, .field > label span { color: #67e8f9; font-weight: 800; }
.field input:not([type="range"]), .field select, .judgment textarea { width: 100%; min-height: 37px; padding: 7px 9px; border: 1px solid #475569; border-radius: 5px; outline: none; color: #f8fafc; background: #101c2e; font: inherit; }
.field input:focus, .field select:focus, .judgment textarea:focus { border-color: #22d3ee; }
.field input[type="range"] { width: 100%; margin: 3px 0; accent-color: #06b6d4; }
.example-button, .copy-button { min-height: 35px; border: 1px solid #0e7490; border-radius: 5px; color: #ecfeff; background: #0e5667; font-weight: 800; cursor: pointer; }
.discount-field > label { display: flex; align-items: center; gap: 6px; }
.discount-field > label span { margin-left: auto; }
.help-button { width: 20px; height: 20px; border: 1px solid #64748b; border-radius: 50%; color: #e2e8f0; background: transparent; cursor: pointer; }
.help-text, .discount-field small { margin: 0; color: #a5b4c7; font-size: 12px; font-weight: 400; line-height: 1.5; }
.rate-options { display: flex; gap: 5px; }
.rate-options button { flex: 1; min-height: 32px; border: 1px solid #475569; border-radius: 5px; color: #cbd5e1; background: #132238; cursor: pointer; }
.rate-options button.selected { border-color: #22d3ee; color: #ecfeff; background: #0e5667; }
.judgment { display: grid; gap: 10px; padding-top: 12px; border-top: 1px solid #334155; }
.boundary-note { margin: 0; color: #a5b4c7; font-size: 12px; line-height: 1.5; }
.judgment h2 { margin: 0; font-size: 15px; }
.judgment textarea { resize: vertical; line-height: 1.4; }
.judgment p { margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5; }
.investment-metrics { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
.investment-metrics > div { min-width: 0; min-height: 65px; display: grid; gap: 4px; padding: 9px 12px; border: 1px solid #2b4056; border-radius: 7px; background: #18263a; }
.investment-metrics span { color: #a5b4c7; font-size: 12px; }
.investment-metrics strong { overflow: hidden; color: #f8fafc; font-size: 19px; text-overflow: ellipsis; white-space: nowrap; }
.investment-metrics .positive { color: #5eead4; }.investment-metrics .negative { color: #fca5a5; }
.investment-visual { height: 100%; min-height: 0; display: grid; grid-template-rows: auto minmax(0,1fr) auto; padding: 10px 12px; border: 1px solid #2b4056; border-radius: 7px; background: #18263a; }
.chart-caption { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; font-size: 13px; }.chart-caption span { color: #94a3b8; font-size: 11px; }
.investment-chart { min-height: 0 !important; }
.year-detail { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 5px 10px; padding: 8px 0 0; border-top: 1px solid #334155; color: #cbd5e1; font-size: 11px; line-height: 1.35; }
.year-detail > * { min-width: 0; }.year-detail strong { color: #67e8f9; }.year-detail .payback-note { color: #fcd34d; }
.model-note { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.55; }
@media (max-width: 820px) { .investment-visual { padding: 7px 8px; }.chart-caption { font-size: 11px; }.chart-caption span { font-size: 10px; }.year-detail { grid-template-columns: repeat(2,minmax(0,1fr)); font-size: 11px; gap: 3px 7px; }.investment-metrics > div { min-height: 55px; padding: 6px; }.investment-metrics strong { font-size: 14px; }.investment-metrics span { font-size: 10px; } }
@media (max-width: 420px) { .investment-visual { padding: 6px; }.chart-caption { flex-wrap: wrap; gap: 0 6px; }.year-detail { font-size: 11px; }.investment-metrics { gap: 4px; }.investment-metrics strong { font-size: 12px; } }
</style>
