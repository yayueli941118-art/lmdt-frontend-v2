<template>
  <div class="lab income-lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <div class="chapter-kicker">Ch.08 · 收入分配</div>
      <h1>收入分配实验室</h1>
      <p>把洛伦兹曲线、基尼系数、技能溢价与再分配政策放到同一个沙盘里，让“不平等”从抽象概念变成可观察的曲线移动。</p>
    </div>

    <section class="teaching-strip">
      <div>
        <span>核心问题</span>
        <strong>技术进步为什么可能扩大收入差距？</strong>
      </div>
      <div>
        <span>模型抓手</span>
        <strong>技能溢价 → 分位收入 → 洛伦兹曲线 → 基尼系数</strong>
      </div>
      <div>
        <span>思政落点</span>
        <strong>共同富裕不是平均主义，而是机会公平与再分配协调</strong>
      </div>
    </section>

    <LabDashboardLayout>
      <template #controls>
    <div class="lab-controls">
      <div class="control-group">
        <label>技能溢价 <span class="val">{{ skillPremium }}%</span></label>
        <input type="range" v-model.number="skillPremium" min="0" max="80" step="5">
      </div>
      <div class="control-group">
        <label>资本/平台收入集中度 <span class="val">{{ topShareShock }}%</span></label>
        <input type="range" v-model.number="topShareShock" min="0" max="70" step="5">
      </div>
      <div class="control-group">
        <label>转移支付强度 <span class="val">{{ transferIntensity }}%</span></label>
        <input type="range" v-model.number="transferIntensity" min="0" max="60" step="5">
      </div>
      <div class="control-group">
        <label>教育机会改善 <span class="val">{{ educationEqualizer }}%</span></label>
        <input type="range" v-model.number="educationEqualizer" min="0" max="60" step="5">
      </div>
    </div>
      </template>

      <template #task>
    <LearningTaskCard
      task="调整技能溢价、收入集中度和再分配政策，观察收入分配是否更均衡。"
      observe="重点看洛伦兹曲线、基尼系数和低收入组增益。"
      :conclusion="incomeConclusion"
    />
      </template>

      <template #metrics>
    <div class="cards-row">
      <div class="stat-card">
        <span class="stat-label">市场收入 Gini</span>
        <span class="stat-val">{{ metrics.marketGini }}</span>
      </div>
      <div class="stat-card accent">
        <span class="stat-label">政策后 Gini</span>
        <span class="stat-val">{{ metrics.policyGini }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">P90 / P10</span>
        <span class="stat-val">{{ metrics.p90p10 }}</span>
      </div>
      <div class="stat-card good">
        <span class="stat-label">低收入组增益</span>
        <span class="stat-val">+{{ metrics.bottomGain }}%</span>
      </div>
    </div>
      </template>

      <template #primary>
    <div class="lab-results two-col">
      <div class="chart-card">
        <h3>洛伦兹曲线：市场分配 vs 政策调节后</h3>
        <v-chart :option="lorenzOption" autoresize style="height:340px" />
      </div>
      <div class="chart-card">
        <h3>十分位收入结构</h3>
        <v-chart :option="decileOption" autoresize style="height:340px" />
      </div>
    </div>
      </template>

      <template #secondary>
    <section class="insight-panel">
      <div>
        <span class="panel-label">观察提示</span>
        <p>当技能溢价和平台收入集中度上升时，曲线向右下方弯曲，说明同样比例人口获得的累计收入下降；提高教育机会与转移支付会把曲线推回平等线附近。</p>
      </div>
      <div>
        <span class="panel-label">价值引导</span>
        <p>学生可以看到，高质量发展需要效率，也需要通过教育、培训、社会保障和初次分配制度改善，让发展成果更公平地惠及劳动者。</p>
      </div>
    </section>
      </template>
    </LabDashboardLayout>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import LabDashboardLayout from '../components/LabDashboardLayout.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const skillPremium = ref(35)
const topShareShock = ref(25)
const transferIntensity = ref(20)
const educationEqualizer = ref(15)

function baseIncome(i) {
  const rank = (i + 1) / 400
  const educationBoost = rank > 0.55 ? 1 + skillPremium.value / 100 : 1
  const topBoost = rank > 0.9 ? 1 + topShareShock.value / 55 : 1
  const opportunity = rank < 0.45 ? 1 + educationEqualizer.value / 180 : 1
  const wave = 1 + 0.08 * Math.sin(i * 1.73)
  return 3600 * (0.7 + rank * 1.9) * educationBoost * topBoost * opportunity * wave
}

const incomeSeries = computed(() => {
  const market = Array.from({ length: 400 }, (_, i) => baseIncome(i)).sort((a, b) => a - b)
  const average = market.reduce((a, b) => a + b, 0) / market.length
  const policy = market.map((income) => {
    const contribution = Math.max(0, income - average) * transferIntensity.value / 100 * 0.28
    const supplement = Math.max(0, average - income) * transferIntensity.value / 100 * 0.34
    return income - contribution + supplement
  }).sort((a, b) => a - b)
  return { market, policy }
})

function gini(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const weighted = sorted.reduce((acc, val, idx) => acc + (idx + 1) * val, 0)
  return (2 * weighted) / (n * sum) - (n + 1) / n
}

function quantile(values, q) {
  const index = Math.floor((values.length - 1) * q)
  return values[index]
}

function lorenz(values) {
  const total = values.reduce((a, b) => a + b, 0)
  let cumulative = 0
  const points = [[0, 0]]
  values.forEach((value, index) => {
    cumulative += value
    if ((index + 1) % 20 === 0) {
      points.push([+(((index + 1) / values.length) * 100).toFixed(1), +((cumulative / total) * 100).toFixed(1)])
    }
  })
  return points
}

const deciles = computed(() => {
  const { market, policy } = incomeSeries.value
  return Array.from({ length: 10 }, (_, i) => {
    const start = i * 40
    const end = start + 40
    const marketAvg = market.slice(start, end).reduce((a, b) => a + b, 0) / 40
    const policyAvg = policy.slice(start, end).reduce((a, b) => a + b, 0) / 40
    return { label: `D${i + 1}`, market: Math.round(marketAvg), policy: Math.round(policyAvg) }
  })
})

const metrics = computed(() => {
  const { market, policy } = incomeSeries.value
  const bottomMarket = deciles.value[0].market
  const bottomPolicy = deciles.value[0].policy
  return {
    marketGini: gini(market).toFixed(3),
    policyGini: gini(policy).toFixed(3),
    p90p10: (quantile(policy, 0.9) / quantile(policy, 0.1)).toFixed(2),
    bottomGain: (((bottomPolicy / bottomMarket) - 1) * 100).toFixed(1),
  }
})

const incomeConclusion = computed(() => {
  return `当前政策后基尼系数为 ${metrics.value.policyGini}，P90/P10 为 ${metrics.value.p90p10}，低收入组收入提升 ${metrics.value.bottomGain}%。`
})

const lorenzOption = computed(() => {
  const { market, policy } = incomeSeries.value
  return {
    backgroundColor: 'transparent',
    color: ['#16a34a', '#2563eb', '#94a3b8'],
    grid: { left: 48, right: 22, top: 36, bottom: 42 },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: '#64748b' } },
    xAxis: { name: '累计人口(%)', min: 0, max: 100, axisLabel: { color: '#64748b' } },
    yAxis: { name: '累计收入(%)', min: 0, max: 100, axisLabel: { color: '#64748b' } },
    series: [
      { name: '完全平等线', type: 'line', data: [[0, 0], [100, 100]], symbol: 'none', lineStyle: { type: 'dashed', color: '#94a3b8' } },
      { name: '市场收入', type: 'line', data: lorenz(market), smooth: true, symbol: 'none', lineStyle: { width: 3, color: '#f59e0b' } },
      { name: '政策调节后', type: 'line', data: lorenz(policy), smooth: true, symbol: 'none', lineStyle: { width: 3, color: '#16a34a' }, areaStyle: { color: 'rgba(22, 163, 74, 0.08)' } },
    ],
  }
})

const decileOption = computed(() => ({
  backgroundColor: 'transparent',
  color: ['#f59e0b', '#16a34a'],
  grid: { left: 54, right: 20, top: 38, bottom: 42 },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { color: '#64748b' } },
  xAxis: { data: deciles.value.map(d => d.label), axisLabel: { color: '#64748b' } },
  yAxis: { name: '月收入(元)', axisLabel: { color: '#64748b' } },
  series: [
    { name: '市场收入', type: 'bar', data: deciles.value.map(d => d.market), itemStyle: { borderRadius: [4, 4, 0, 0] } },
    { name: '政策后', type: 'bar', data: deciles.value.map(d => d.policy), itemStyle: { borderRadius: [4, 4, 0, 0] } },
  ],
}))
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px 72px; }
.lab-header { margin-bottom: 24px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.chapter-kicker { margin-top: 18px; color: #16a34a; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
.lab-header h1 { color: #f8fafc; font-size: 34px; margin: 8px 0; font-weight: 900; }
.lab-header p { color: #94a3b8; max-width: 760px; line-height: 1.7; margin: 0; }
.teaching-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.teaching-strip div, .insight-panel, .lab-controls, .stat-card, .chart-card {
  background: rgba(248, 250, 252, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
}
.teaching-strip div { padding: 14px 16px; }
.teaching-strip span, .panel-label, .stat-label { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 6px; }
.teaching-strip strong { color: #e2e8f0; font-size: 14px; line-height: 1.5; }
.lab-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; padding: 18px; margin-bottom: 18px; }
.control-group label { display: flex; justify-content: space-between; gap: 12px; color: #cbd5e1; font-size: 13px; margin-bottom: 8px; }
.val { color: #22c55e; font-weight: 800; }
input[type="range"] { width: 100%; accent-color: #16a34a; }
.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.stat-card { padding: 16px; }
.stat-card.accent { border-color: rgba(34, 197, 94, 0.35); }
.stat-card.good { border-color: rgba(59, 130, 246, 0.28); }
.stat-val { display: block; color: #f8fafc; font-size: 28px; font-weight: 900; }
.two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; }
.chart-card { padding: 18px; }
.chart-card h3 { color: #cbd5e1; font-size: 14px; margin: 0 0 12px; }
.insight-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 18px; margin-top: 18px; }
.insight-panel p { color: #cbd5e1; line-height: 1.7; margin: 0; font-size: 14px; }
@media (max-width: 900px) {
  .teaching-strip, .lab-controls, .cards-row, .two-col, .insight-panel { grid-template-columns: 1fr; }
}
</style>
