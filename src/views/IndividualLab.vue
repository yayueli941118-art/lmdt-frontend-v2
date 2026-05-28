<template>
  <div class="lab">
    <!-- Banner -->
    <header class="banner">
      <div>
        <h1>👤 个体职业发展实验室</h1>
        <span class="sub">Human Capital · Mincer Equation</span>
      </div>
      <span class="badge">黎雅月 · 西南交通大学希望学院</span>
    </header>

    <div class="main-grid">
      <!-- 控制台 -->
      <aside class="panel">
        <div class="card">
          <h3>🎛️ 你的人生参数</h3>

          <div class="param">
            <label>🎓 受教育年限 <b>{{ params.edu_years }}</b></label>
            <input type="range" min="9" max="22" v-model.number="params.edu_years" />
            <div class="hint">当前：{{ eduLabel }}</div>
          </div>

          <div class="param">
            <label>📈 职业观察年限</label>
            <input type="range" min="5" max="40" step="5" v-model.number="params.exp_peak" />
            <div class="hint">{{ params.exp_peak }} 年</div>
          </div>

          <div class="param">
            <label>🏋️ 培训投资</label>
            <select v-model="params.train_type">
              <option value="NONE">无额外培训</option>
              <option value="GENERAL">一般培训 (通用技能)</option>
              <option value="SPECIAL">特殊培训 (企业专属)</option>
            </select>
          </div>

          <div class="param">
            <label>⚖️ 市场歧视率 {{ params.disc_rate }}%</label>
            <input type="range" min="0" max="40" v-model.number="params.disc_rate" />
          </div>

          <div class="param">
            <label class="checkbox-label">
              <input type="checkbox" v-model="params.migrate.is_migrate" />
              🏙️ 考虑迁移至一二线城市？
            </label>
          </div>

          <transition name="slide">
            <div v-if="params.migrate.is_migrate" class="migrate-params">
              <div class="param">
                <label>城市月薪优势 {{ params.migrate.wage_diff }}k</label>
                <input type="range" min="2" max="30" v-model.number="params.migrate.wage_diff" />
              </div>
              <div class="param">
                <label>搬迁成本 {{ params.migrate.cost_move }}k</label>
                <input type="range" min="5" max="80" step="5" v-model.number="params.migrate.cost_move" />
              </div>
              <div class="param">
                <label>年度心理成本 {{ params.migrate.cost_psych }}k</label>
                <input type="range" min="0" max="30" v-model.number="params.migrate.cost_psych" />
              </div>
            </div>
          </transition>
        </div>
      </aside>

      <!-- 图表区 -->
      <main class="charts">
        <!-- 指标卡片 -->
        <div class="metric-row" :class="'glow-' + premiumLevel">
          <div class="metric">
            <span class="metric-val">{{ metrics.premium_pct }}<small>%</small></span>
            <span class="metric-label">一生总收入提升</span>
          </div>
          <div class="metric">
            <span class="metric-val">{{ metrics.breakeven_year ?? '—' }}<small v-if="metrics.breakeven_year">年</small></span>
            <span class="metric-label">投资回本</span>
          </div>
          <div class="metric">
            <span class="metric-val">{{ metrics.real_wage_dev ?? '—' }}<small v-if="metrics.real_wage_dev">%</small></span>
            <span class="metric-label">vs 中国基准</span>
          </div>
          <div class="metric" v-if="migNPV">
            <span class="metric-val">{{ migNPV.is_worth ? '✅' : '❌' }}</span>
            <span class="metric-label">{{ migNPV.is_worth ? '值得迁移' : '不建议' }}</span>
          </div>
        </div>

        <!-- 工资曲线 -->
        <div class="chart-card">
          <h3>📈 工资曲线 · 明瑟方程</h3>
          <v-chart :option="wageChartOption" autoresize class="chart" />
        </div>

        <!-- 迁移 NPV -->
        <div class="chart-card" v-if="migNPV">
          <h3>🏙️ 迁移 NPV 评估</h3>
          <v-chart :option="npvChartOption" autoresize class="chart" />
          <div v-if="migNPV.is_worth" class="result success">
            ✅ 第 <b>{{ migNPV.breakeven_year }}</b> 年收回成本，净收益 <b>+{{ migNPV.npv_cumulative[migNPV.npv_cumulative.length-1] }}k</b>
          </div>
          <div v-else class="result danger">
            ❌ 成本过高，{{ migNPV.years.length }} 年内无法回本
          </div>
        </div>

        <!-- 诊断 -->
        <div class="diagnosis" :class="'diag-' + premiumLevel">
          <h3>💡 诊断结论</h3>
          <p>{{ diagnosisText }}</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import axios from 'axios'

VChart.registerECharts(echarts)

const API = 'http://localhost:8000'

const educationLabelMap = { 9: '初中', 12: '高中', 15: '大专', 16: '本科', 19: '硕士', 22: '博士' }

const params = ref({
  edu_years: 16,
  exp_peak: 40,
  train_type: 'NONE',
  disc_rate: 10,
  migrate: { is_migrate: false, wage_diff: 10, cost_move: 25, cost_psych: 8 },
})

const response = ref(null)
let timer = null

const eduLabel = computed(() => educationLabelMap[params.value.edu_years] || `${params.value.edu_years}年`)
const metrics = computed(() => response.value?.metrics || {})
const migNPV = computed(() => response.value?.migration_npv)
const premiumLevel = computed(() => {
  const p = metrics.value.premium_pct
  if (p === undefined) return 'neutral'
  return p > 80 ? 'high' : p > 30 ? 'mid' : 'low'
})
const diagnosisText = computed(() => {
  const p = metrics.value.premium_pct
  if (p === undefined) return '加载中...'
  if (p > 80) return `🎓 教育回报极高：${educationLabelMap[params.value.edu_years]}带来 ${p}% 终身收入提升。学历信号价值很高。`
  if (p > 30) return `📚 教育回报可观：${educationLabelMap[params.value.edu_years]}带来 ${p}% 提升。关注回本年限。`
  return `⚠️ 教育回报有限：仅 ${p}% 提升。考虑机会成本是否过高。`
})

function fetchData() {
  axios.post(`${API}/api/v1/individual-lab/simulate`, params.value).then(r => response.value = r.data)
}
function debounce() { clearTimeout(timer); timer = setTimeout(fetchData, 300) }
watch(params, debounce, { deep: true })
onMounted(fetchData)

// ECharts: 工资曲线
const wageChartOption = computed(() => {
  if (!response.value) return {}
  const { wage_curves, metrics } = response.value
  const pts = wage_curves.exp_years.map((x, i) => ({ x, w_exp: wage_curves.w_exp[i], w_base: wage_curves.w_base[i], w_disc: wage_curves.w_disc?.[i] }))
  const series = [
    {
      name: '对照组 (高中)',
      type: 'line',
      data: pts.map(p => [p.x, p.w_base]),
      lineStyle: { color: '#94a3b8', type: 'dashed', width: 2 },
      symbol: 'none',
    },
    {
      name: '你的选择',
      type: 'line',
      data: pts.map(p => [p.x, p.w_exp]),
      smooth: true,
      lineStyle: { color: '#3b82f6', width: 3 },
      areaStyle: { color: 'rgba(59, 130, 246, 0.08)' },
      symbol: 'none',
      markLine: metrics.breakeven_year ? {
        silent: true, symbol: 'none',
        label: { formatter: `回本 ≈${metrics.breakeven_year}年`, color: '#10b981', fontWeight: 'bold' },
        lineStyle: { color: '#10b981', type: 'dashed', width: 2 },
        data: [{ xAxis: metrics.breakeven_year }],
      } : undefined,
      markPoint: metrics.breakeven_year ? {
        symbol: 'pin', symbolSize: 36,
        itemStyle: { color: '#10b981' },
        label: { formatter: '回本', color: '#fff', fontSize: 10 },
        data: [{ coord: [metrics.breakeven_year, pts.find(p => p.x >= metrics.breakeven_year)?.w_exp || 0] }],
      } : undefined,
    },
  ]
  if (wage_curves.w_disc) {
    series.push({
      name: `歧视后 (-${params.value.disc_rate}%)`,
      type: 'line',
      data: pts.map(p => [p.x, p.w_disc]),
      lineStyle: { color: '#ef4444', width: 1.5, type: 'dotted' },
      symbol: 'none',
    })
  }
  return {
    backgroundColor: 'transparent',
    animation: true, animationDurationUpdate: 800, animationEasingUpdate: 'cubicOut',
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '3%', containLabel: true },
    xAxis: { type: 'value', name: '工龄 (年)', min: 0, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.2)' } } },
    yAxis: { type: 'value', name: '月工资指数', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.2)' } } },
    series,
  }
})

// ECharts: 迁移 NPV
const npvChartOption = computed(() => {
  if (!migNPV.value) return {}
  const data = migNPV.value.npv_cumulative.map((v, i) => [migNPV.value.years[i], v])
  return {
    backgroundColor: 'transparent',
    animation: true, animationDurationUpdate: 800, animationEasingUpdate: 'cubicOut',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: migNPV.value.years.map(String), axisLine: { lineStyle: { color: '#334155' } } },
    yAxis: { type: 'value', name: '累计 NPV (k)', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.2)' } } },
    series: [{
      type: 'bar',
      data: data.map(d => ({ value: d, itemStyle: { color: d[1] >= 0 ? '#10b981' : '#ef4444' } })),
      markLine: migNPV.value.breakeven_year ? {
        silent: true, symbol: 'none',
        label: { formatter: `命运反超`, color: '#10b981', fontWeight: 'bold' },
        lineStyle: { color: '#10b981', type: 'dashed', width: 2 },
        data: [{ xAxis: String(migNPV.value.breakeven_year - 1) }],
      } : undefined,
    }],
  }
})
</script>

<style scoped>
.lab { min-height: 100vh; background: #0b0f19; color: #e2e8f0; }
.banner { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 20px rgba(37,99,235,0.3); }
.banner h1 { font-size: 20px; font-weight: 800; }
.sub { font-size: 13px; opacity: 0.8; display: block; }
.badge { font-size: 13px; opacity: 0.8; background: rgba(255,255,255,0.12); padding: 4px 14px; border-radius: 16px; }

.main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 0; height: calc(100vh - 72px); }
.panel { background: #0f1420; border-right: 1px solid rgba(37,99,235,0.15); overflow-y: auto; padding: 20px; }
.card h3 { font-size: 17px; margin-bottom: 18px; border-left: 3px solid #3b82f6; padding-left: 10px; color: #e2e8f0; }

.param { margin-bottom: 16px; }
.param label { display: flex; justify-content: space-between; font-size: 14px; color: #94a3b8; margin-bottom: 4px; }
.param label b { color: #3b82f6; }
.param input[type="range"] { width: 100%; accent-color: #3b82f6; }
.param select { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; }
.hint { font-size: 12px; color: #64748b; margin-top: 2px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #e2e8f0 !important; font-weight: 600; }
.checkbox-label input { accent-color: #3b82f6; }

.migrate-params { padding: 12px; background: rgba(37,99,235,0.06); border-radius: 8px; border: 1px solid rgba(37,99,235,0.2); margin-top: 8px; }
.slide-enter-active { transition: all 0.3s ease-out; }
.slide-leave-active { transition: all 0.2s ease-in; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }

.charts { overflow-y: auto; padding: 20px; }
.metric-row { display: flex; gap: 16px; margin-bottom: 20px; padding: 16px; border-radius: 10px; background: rgba(15,20,32,0.8); border: 1px solid rgba(37,99,235,0.1); transition: all 0.5s; }
.metric-row.glow-high { border-color: rgba(16,185,129,0.4); box-shadow: 0 0 12px rgba(16,185,129,0.15); }
.metric-row.glow-low { border-color: rgba(239,68,68,0.4); box-shadow: 0 0 12px rgba(239,68,68,0.15); }
.metric { flex: 1; text-align: center; }
.metric-val { font-size: 28px; font-weight: 900; color: #e2e8f0; }
.metric-val small { font-size: 16px; color: #64748b; }
.metric-label { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }

.chart-card { background: rgba(15,20,32,0.6); border: 1px solid rgba(37,99,235,0.1); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.chart-card h3 { font-size: 17px; margin-bottom: 12px; color: #e2e8f0; }
.chart { height: 380px; }
.result { padding: 10px 14px; border-radius: 8px; margin-top: 10px; font-size: 14px; }
.result.success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.result.danger { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

.diagnosis { padding: 16px 20px; border-radius: 10px; border: 1px solid transparent; }
.diagnosis h3 { font-size: 16px; margin-bottom: 6px; }
.diagnosis p { font-size: 14px; color: #cbd5e1; line-height: 1.6; }
.diag-high { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.3); }
.diag-high h3 { color: #10b981; }
.diag-mid { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3); }
.diag-mid h3 { color: #3b82f6; }
.diag-low { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.3); }
.diag-low h3 { color: #ef4444; }
</style>
