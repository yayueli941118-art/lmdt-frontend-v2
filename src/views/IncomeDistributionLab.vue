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
        <span>讨论主题</span>
        <strong>共同富裕不是平均主义，而是机会公平与再分配协调</strong>
      </div>
    </section>

    <LabDashboardLayout
      formula="G=1-2∫L(p)dp；税费筹资总额=转移支付总额"
      assumptions="收入排序后按统一规则征收并向低于均值者转移；预算保持平衡。"
      source="教材第八章洛伦兹曲线、基尼系数与收入再分配。"
      scope="比较技能溢价、收入集中与预算平衡再分配的分配效应。"
      limitation="真实居民收入分布或具体税制的政策效果。"
    >
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
      <button type="button" class="reset-btn" @click="resetDistribution">恢复默认参数</button>
    </div>
      </template>

      <template #record>
        <ExperimentRecordPanel
          experiment-name="收入分配与再分配"
          :parameters="recordParameters"
          :metrics="recordMetrics"
          :conclusion="incomeConclusion"
          model-version="distribution-budget-balanced-2.1"
          source-type="教材公式与合成收入情景"
        />
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
        <span class="panel-label">延伸思考</span>
        <p>可以看到，高质量发展需要效率，也需要通过教育、培训、社会保障和初次分配制度改善，让发展成果更公平地惠及劳动者。</p>
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
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import { simulateDistribution } from '../domain/distribution/model'
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

function resetDistribution() {
  skillPremium.value = 35
  topShareShock.value = 25
  transferIntensity.value = 20
  educationEqualizer.value = 15
}

const distribution = computed(() => simulateDistribution({
  skill_premium: skillPremium.value,
  top_share_shock: topShareShock.value,
  transfer_intensity: transferIntensity.value,
  education_equalizer: educationEqualizer.value,
}))
const incomeSeries = computed(() => distribution.value.series)
const deciles = computed(() => distribution.value.deciles)
const metrics = computed(() => ({
  marketGini: distribution.value.metrics.market_gini.toFixed(3),
  policyGini: distribution.value.metrics.policy_gini.toFixed(3),
  p90p10: distribution.value.metrics.p90_p10.toFixed(2),
  bottomGain: distribution.value.metrics.bottom_gain_pct.toFixed(1),
}))

const incomeConclusion = computed(() => {
  return `当前政策后基尼系数为 ${metrics.value.policyGini}，P90/P10 为 ${metrics.value.p90p10}，低收入组收入提升 ${metrics.value.bottomGain}%。`
})

const recordParameters = computed(() => ({
  '技能溢价': `${skillPremium.value}%`,
  '资本/平台收入集中度': `${topShareShock.value}%`,
  '转移支付强度': `${transferIntensity.value}%`,
  '教育机会改善': `${educationEqualizer.value}%`,
}))

const recordMetrics = computed(() => ({
  '市场收入Gini': metrics.value.marketGini,
  '政策后Gini': metrics.value.policyGini,
  'P90/P10': metrics.value.p90p10,
  '低收入组增益': `${metrics.value.bottomGain}%`,
  '税收/缴款': `${distribution.value.budget.contributions.toLocaleString()} 元`,
  '转移支付': `${distribution.value.budget.transfers.toLocaleString()} 元`,
  '财政净成本': `${distribution.value.budget.net_cost} 元`,
}))

const lorenzOption = computed(() => {
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
      { name: '市场收入', type: 'line', data: distribution.value.lorenz.market, smooth: false, symbol: 'none', lineStyle: { width: 3, color: '#f59e0b' } },
      { name: '政策调节后', type: 'line', data: distribution.value.lorenz.policy, smooth: false, symbol: 'none', lineStyle: { width: 3, color: '#16a34a' }, areaStyle: { color: 'rgba(22, 163, 74, 0.08)' } },
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
.reset-btn { min-height: 40px; align-self: end; padding: 9px 12px; border: 1px solid rgba(148,163,184,.22); border-radius: 7px; color: #cbd5e1; background: #111b2e; cursor: pointer; }
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
