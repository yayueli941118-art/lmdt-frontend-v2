<template>
  <div class="ind-lab">
    <!-- ===== 预测门禁 ===== -->
    <section v-if="!gateUnlocked" class="gate-section">
      <div class="gate-card">
        <div class="gate-icon">
          <svg viewBox="0 0 48 48"><path d="M24 4 L44 14 L44 34 L24 44 L4 34 L4 14 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="24" y="30" text-anchor="middle" fill="currentColor" font-size="18" font-weight="800">?</text></svg>
        </div>
        <h2 class="gate-title">在进入实验室之前，先做一个预测</h2>
        <p class="gate-question">假设你选择攻读 4 年本科（而非高中毕业直接工作）：<br/><strong>一生的总收入大约会增加多少？</strong></p>

        <div class="gate-options">
          <button
            v-for="(opt, i) in gateOptions"
            :key="i"
            class="gate-option"
            :class="{ 'gate-option-selected': gateChoice === i, 'gate-option-correct': gateSubmitted && i === gateCorrect, 'gate-option-wrong': gateSubmitted && gateChoice === i && i !== gateCorrect }"
            :disabled="gateSubmitted"
            @click="gateChoice = i"
          >
            <span class="gate-option-letter">{{ ['A', 'B', 'C', 'D'][i] }}</span>
            <span class="gate-option-text">{{ opt }}</span>
          </button>
        </div>

        <button
          v-if="!gateSubmitted"
          class="gate-submit"
          :disabled="gateChoice === null"
          @click="submitGate"
        >提交预测</button>

        <div v-if="gateSubmitted" class="gate-feedback" :class="{ 'gate-feedback-correct': gateChoice === gateCorrect, 'gate-feedback-wrong': gateChoice !== gateCorrect }">
          <template v-if="gateChoice === gateCorrect">
            🎯 <strong>直觉很成熟！</strong>教育确实是人力资本投资回报最高的路径之一。
          </template>
          <template v-else>
            💡 正确答案是 <strong>D：60%–80%</strong>。根据明瑟方程的长期追踪数据，本科学历的一生总收入溢价通常在 60%–80% 之间。
          </template>
          <button class="gate-enter" @click="unlockGate">进入实验室 →</button>
        </div>
      </div>
    </section>

    <!-- ===== 主面板（门禁解锁后可见） ===== -->
    <template v-if="gateUnlocked">
      <!-- 控制面板 -->
      <section class="control-section">
        <div class="control-header">
          <h2>🧬 明瑟方程 · 个体职业实验室</h2>
          <span class="control-sub">调整参数，观察工资曲线与一生总收入的实时变化</span>
        </div>

        <div class="control-grid">
          <!-- 教育年限 -->
          <div class="control-item">
            <label class="control-label">
              <span class="control-label-icon">🎓</span> 受教育年限
              <span class="control-value">{{ eduLabels[params.edu] || params.edu + '年' }}</span>
            </label>
            <div class="slider-wrap">
              <span class="slider-min">初中</span>
              <input type="range" v-model.number="params.edu" min="9" max="22" step="1" @input="debounceFetch" class="slider" />
              <span class="slider-max">博士</span>
            </div>
          </div>

          <!-- 培训类型 -->
          <div class="control-item">
            <label class="control-label">
              <span class="control-label-icon">📚</span> 培训投资类型
            </label>
            <div class="radio-group">
              <label v-for="t in trainTypes" :key="t" class="radio-item" :class="{ 'radio-active': params.train_type === t }">
                <input type="radio" v-model="params.train_type" :value="t" @change="debounceFetch" />
                <span>{{ t }}</span>
              </label>
            </div>
          </div>

          <!-- 歧视系数 -->
          <div class="control-item">
            <label class="control-label">
              <span class="control-label-icon">⚠️</span> 市场歧视折损
              <span class="control-value">{{ params.disc }}%</span>
            </label>
            <div class="slider-wrap">
              <span class="slider-min">0%</span>
              <input type="range" v-model.number="params.disc" min="0" max="50" step="1" @input="debounceFetch" class="slider slider-red" />
              <span class="slider-max">50%</span>
            </div>
          </div>

          <!-- 工龄峰值 -->
          <div class="control-item">
            <label class="control-label">
              <span class="control-label-icon">📈</span> 职业生涯观察年限
              <span class="control-value">{{ params.exp_peak }} 年</span>
            </label>
            <div class="slider-wrap">
              <span class="slider-min">5年</span>
              <input type="range" v-model.number="params.exp_peak" min="5" max="40" step="1" @input="debounceFetch" class="slider" />
              <span class="slider-max">40年</span>
            </div>
          </div>

          <!-- 城市迁移开关 -->
          <div class="control-item">
            <label class="control-label">
              <span class="control-label-icon">✈️</span> 城市迁移模拟
            </label>
            <label class="toggle-wrap">
              <input type="checkbox" v-model="params.migrate" @change="debounceFetch" class="toggle-input" />
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-text">{{ params.migrate ? '已开启' : '已关闭' }}</span>
            </label>
          </div>

          <!-- 迁移参数（仅开启时显示） -->
          <template v-if="params.migrate">
            <div class="control-item">
              <label class="control-label">
                <span class="control-label-icon">💰</span> 城市月薪溢价
                <span class="control-value">{{ params.w_diff }}k/月</span>
              </label>
              <input type="range" v-model.number="params.w_diff" min="2" max="30" step="1" @input="debounceFetch" class="slider slider-gold" />
            </div>
            <div class="control-item">
              <label class="control-label">
                <span class="control-label-icon">🚚</span> 搬迁成本
                <span class="control-value">{{ params.c_move }}k</span>
              </label>
              <input type="range" v-model.number="params.c_move" min="5" max="80" step="1" @input="debounceFetch" class="slider" />
            </div>
            <div class="control-item">
              <label class="control-label">
                <span class="control-label-icon">💆</span> 年心理适应成本
                <span class="control-value">{{ params.c_psych }}k/年</span>
              </label>
              <input type="range" v-model.number="params.c_psych" min="0" max="30" step="1" @input="debounceFetch" class="slider" />
            </div>
          </template>
        </div>
      </section>

      <!-- 指标卡片 -->
      <section v-if="response" class="metrics-row">
        <div class="metric-card">
          <span class="metric-label">一生总收入溢价</span>
          <span class="metric-value metric-blue" :class="{ 'metric-negative': response.metrics.lifetime_premium_pct < 0 }">
            {{ response.metrics.lifetime_premium_pct >= 0 ? '+' : '' }}{{ response.metrics.lifetime_premium_pct }}%
          </span>
          <span class="metric-note">vs 高中毕业对照组</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">歧视折损率</span>
          <span class="metric-value metric-red">{{ response.metrics.discrimination_loss_pct }}%</span>
          <span class="metric-note">当前市场歧视强度</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">vs 中国实际基准</span>
          <span class="metric-value" :class="response.metrics.vs_china_baseline_pct >= 0 ? 'metric-green' : 'metric-red'">
            {{ response.metrics.vs_china_baseline_pct >= 0 ? '+' : '' }}{{ response.metrics.vs_china_baseline_pct }}%
          </span>
          <span class="metric-note">基准月薪 ¥{{ response.metrics.china_baseline_value.toLocaleString() }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">教育投资回本年限</span>
          <span class="metric-value metric-green">
            {{ response.metrics.breakeven_year !== null ? response.metrics.breakeven_year + ' 年' : '未回本' }}
          </span>
          <span class="metric-note">{{ response.metrics.breakeven_year !== null ? '越过财务盈亏线' : '投资尚未回收' }}</span>
        </div>
      </section>

      <!-- 明瑟工资曲线图表 -->
      <section class="chart-section">
        <div ref="chartDom" class="chart-container"></div>

        <div class="chart-legend-custom">
          <span class="legend-item legend-baseline"><i></i> 对照组（高中毕业）</span>
          <span class="legend-item legend-selected"><i></i> 选择组（当前学历）</span>
          <span class="legend-item legend-disc" v-if="params.disc > 0"><i></i> 歧视受损轨迹</span>
          <span class="legend-item legend-be" v-if="response?.metrics?.breakeven_year !== null"><i></i> 投资回本点</span>
        </div>
      </section>

      <!-- 迁移 NPV 面板 -->
      <section v-if="params.migrate && response?.migration?.is_calculated" class="migration-section">
        <h3>✈️ 城市迁移 · 净现值累积曲线</h3>
        <div :class="response.migration.is_worth_it ? 'migration-worth' : 'migration-not-worth'">
          {{ response.migration.is_worth_it ? '✅ 迁移决策值得 — 净现值为正' : '❌ 迁移决策不值得 — 净现值为负' }}
        </div>
        <div ref="migChartDom" class="chart-container chart-container-mig"></div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ── 预测门禁 ──────────────────────────────────
const gateOptions = ['10%–20%', '30%–50%', '50%–60%', '60%–80%']
const gateCorrect = 3  // D
const gateUnlocked = ref(false)
const gateChoice = ref(null)
const gateSubmitted = ref(false)

const submitGate = () => {
  if (gateChoice.value === null) return
  gateSubmitted.value = true
}
const unlockGate = () => {
  gateUnlocked.value = true
}

// ── 参数状态 ──────────────────────────────────
const eduLabels = { 9: '初中', 12: '高中', 16: '本科', 19: '硕士', 22: '博士' }
const trainTypes = ['无额外培训', '一般培训 (通用技能)', '特殊培训 (企业专属技能)']

const params = reactive({
  edu: 16,
  exp_peak: 40,
  train_type: '无额外培训',
  disc: 10.0,
  migrate: false,
  w_diff: 10.0,
  c_move: 25.0,
  c_psych: 8.0,
})

const response = ref(null)
const loading = ref(false)

// ── 300ms 防抖 ────────────────────────────────
let debounceTimer = null
const debounceFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchData, 300)
}

// ── API 调用 ──────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const { data } = await axios.post(`${API}/api/v1/individual-lab/simulate`, { ...params })
    response.value = data
    await nextTick()
    renderChart()
    if (params.migrate) renderMigChart()
  } catch (e) {
    console.error('API error:', e)
  } finally {
    loading.value = false
  }
}

// ── ECharts 图表 ──────────────────────────────
const chartDom = ref(null)
const migChartDom = ref(null)
let chartInstance = null
let migChartInstance = null

const renderChart = () => {
  if (!chartDom.value || !response.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom.value)
  }

  const d = response.value
  const yrs = d.charts.experience_years
  const be = d.metrics.breakeven_year

  const series = [
    // 对照组 - 虚线工业灰
    {
      name: '对照组（高中毕业）',
      type: 'line',
      data: d.charts.wage_curve_baseline,
      lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' },
      itemStyle: { color: '#94a3b8' },
      symbol: 'none',
      smooth: true,
    },
    // 选择组 - 加粗电光蓝
    {
      name: '选择组（当前学历）',
      type: 'line',
      data: d.charts.wage_curve_selected,
      lineStyle: { width: 3, color: '#2563eb' },
      itemStyle: { color: '#2563eb' },
      symbol: 'none',
      smooth: true,
      areaStyle: { color: 'rgba(37, 99, 235, 0.05)' },
    },
  ]

  // 歧视轨迹 - 红色点线 + 面积填充
  if (params.disc > 0) {
    series.push({
      name: '歧视受损轨迹',
      type: 'line',
      data: d.charts.wage_curve_disc,
      lineStyle: { type: 'dotted', width: 2, color: '#ef4444' },
      itemStyle: { color: '#ef4444' },
      symbol: 'none',
      smooth: true,
      areaStyle: {
        color: 'rgba(239, 68, 68, 0.08)',
        origin: d.charts.wage_curve_selected,
      },
    })
  }

  // 投资回本点标记
  if (be !== null) {
    const beIdx = yrs.indexOf(be)
    if (beIdx >= 0) {
      const beVal = d.charts.wage_curve_selected[beIdx]
      series.push({
        name: '投资回本点',
        type: 'scatter',
        data: [[be, beVal]],
        symbol: 'pin',
        symbolSize: 40,
        itemStyle: { color: '#10b981' },
        label: {
          show: true,
          formatter: `回本 (${be}年)`,
          position: 'top',
          distance: 12,
          color: '#10b981',
          fontSize: 13,
          fontWeight: 700,
        },
        z: 10,
      })
    }
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', top: 40, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      name: '工龄 (年)',
      nameTextStyle: { color: '#94a3b8', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
    },
    yAxis: {
      type: 'value',
      name: '月工资指数',
      nameTextStyle: { color: '#94a3b8', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      textStyle: { color: '#f1f5f9', fontSize: 13 },
    },
    series,
  }

  chartInstance.setOption(option, true)
}

// ── 迁移 NPV 图表 ─────────────────────────────
const renderMigChart = () => {
  if (!migChartDom.value || !response.value?.migration?.is_calculated) return
  if (!migChartInstance) {
    migChartInstance = echarts.init(migChartDom.value)
  }

  const m = response.value.migration
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      name: '年份',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
    },
    yAxis: {
      type: 'value',
      name: '累计净现值 (k)',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
    },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(148,163,184,0.2)', textStyle: { color: '#f1f5f9' } },
    series: [{
      name: '迁移 NPV',
      type: 'line',
      data: m.cumulative_npv,
      lineStyle: { width: 2.5, color: '#f59e0b' },
      itemStyle: { color: '#f59e0b' },
      areaStyle: { color: 'rgba(245, 158, 11, 0.08)' },
      smooth: true,
      symbol: 'none',
    }],
  }

  migChartInstance.setOption(option, true)
}

// ── 窗口 resize ───────────────────────────────
const handleResize = () => {
  chartInstance?.resize()
  migChartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  migChartInstance?.dispose()
})

// ── 门禁解锁后自动请求数据 ────────────────────
watch(gateUnlocked, (val) => {
  if (val) {
    nextTick(() => { debounceFetch() })
  }
})
</script>

<style scoped>
/* ========================================
   INDIVIDUAL LAB — Design System
   Dark theme, Prediction Gate, Glass cards
   ======================================== */

.ind-lab {
  --bg-primary: #0f172a;
  --bg-card: rgba(30, 41, 59, 0.55);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-subtle: rgba(148, 163, 184, 0.1);

  background: var(--bg-primary);
  min-height: 100vh; color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding-bottom: 60px;
}

/* ── 预测门禁 ─────────────────────────────── */
.gate-section {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.gate-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
  border-radius: 24px; padding: 48px 40px;
  max-width: 640px; width: 100%; text-align: center;
}
.gate-icon {
  width: 56px; height: 56px; margin: 0 auto 24px;
  color: var(--accent-blue, #3b82f6);
}
.gate-title {
  font-size: 24px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.5px;
}
.gate-question {
  font-size: 17px; color: var(--text-secondary); line-height: 1.7; margin: 0 0 32px;
}
.gate-question strong { color: var(--text-primary); }

.gate-options {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px;
}
.gate-option {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-subtle); border-radius: 12px;
  padding: 14px 16px; cursor: pointer;
  font-size: 15px; color: var(--text-secondary);
  transition: all 0.2s; text-align: left; font-family: inherit;
}
.gate-option:hover:not(:disabled) {
  background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25);
}
.gate-option-selected {
  background: rgba(59,130,246,0.12) !important;
  border-color: rgba(59,130,246,0.4) !important; color: var(--text-primary);
}
.gate-option-correct {
  background: rgba(16,185,129,0.12) !important;
  border-color: rgba(16,185,129,0.4) !important; color: #10b981;
}
.gate-option-wrong {
  background: rgba(239,68,68,0.08) !important;
  border-color: rgba(239,68,68,0.3) !important; color: #ef4444;
  opacity: 0.7;
}
.gate-option-letter {
  font-weight: 900; font-size: 13px;
  background: rgba(255,255,255,0.06); border-radius: 6px;
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gate-option:disabled { cursor: default; }

.gate-submit {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white; border: none; border-radius: 12px;
  padding: 14px 40px; font-size: 16px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(59,130,246,0.3);
}
.gate-submit:hover:not(:disabled) {
  box-shadow: 0 12px 32px rgba(59,130,246,0.45); transform: translateY(-1px);
}
.gate-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.gate-feedback {
  margin-top: 24px; padding: 20px; border-radius: 12px;
  font-size: 15px; color: var(--text-secondary); line-height: 1.7;
}
.gate-feedback-correct { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); }
.gate-feedback-wrong { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); }
.gate-enter {
  display: inline-block; margin-top: 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white; border: none; border-radius: 10px;
  padding: 10px 28px; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
}

/* ── 控制面板 ─────────────────────────────── */
.control-section {
  max-width: 1200px; margin: 40px auto 0; padding: 0 24px;
}
.control-header {
  text-align: center; margin-bottom: 32px;
}
.control-header h2 { font-size: 28px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
.control-sub { font-size: 15px; color: var(--text-secondary); }

.control-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.control-item {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 20px;
}
.control-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; color: var(--text-secondary);
  margin-bottom: 12px;
}
.control-label-icon { font-size: 16px; }
.control-value {
  margin-left: auto;
  background: rgba(59,130,246,0.1); color: #60a5fa;
  padding: 2px 10px; border-radius: 6px; font-size: 13px; font-weight: 700;
}
.slider-wrap {
  display: flex; align-items: center; gap: 8px;
}
.slider-min, .slider-max { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }

.slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 6px; border-radius: 6px;
  background: rgba(148,163,184,0.15); outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
  background: #3b82f6; cursor: pointer;
  box-shadow: 0 0 8px rgba(59,130,246,0.4);
}
.slider-red::-webkit-slider-thumb { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }
.slider-gold::-webkit-slider-thumb { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.4); }

/* ── 培训选择 ─────────────────────────────── */
.radio-group { display: flex; flex-direction: column; gap: 6px; }
.radio-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  font-size: 13px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.02); border: 1px solid transparent;
}
.radio-item:hover { background: rgba(59,130,246,0.06); }
.radio-active {
  background: rgba(59,130,246,0.1) !important;
  border-color: rgba(59,130,246,0.25) !important;
  color: #60a5fa;
}
.radio-item input { accent-color: #3b82f6; }

/* ── 迁移开关 ─────────────────────────────── */
.toggle-wrap {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
}
.toggle-input { display: none; }
.toggle-track {
  width: 44px; height: 24px; border-radius: 24px;
  background: rgba(148,163,184,0.2);
  position: relative; transition: all 0.3s;
}
.toggle-input:checked + .toggle-track { background: #3b82f6; }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 20px; height: 20px; border-radius: 50%;
  background: white; transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.toggle-input:checked + .toggle-track .toggle-thumb { left: 22px; }
.toggle-text { font-size: 13px; color: var(--text-secondary); }

/* ── 指标行 ───────────────────────────────── */
.metrics-row {
  max-width: 1200px; margin: 24px auto 0; padding: 0 24px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
.metric-card {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 20px; text-align: center;
}
.metric-label { display: block; font-size: 12px; color: var(--text-secondary); letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; font-weight: 600; }
.metric-value { display: block; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
.metric-blue { color: #3b82f6; }
.metric-red { color: #ef4444; }
.metric-green { color: #10b981; }
.metric-negative { color: #ef4444 !important; }
.metric-note { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 6px; }

/* ── 图表区 ───────────────────────────────── */
.chart-section {
  max-width: 1200px; margin: 24px auto 0; padding: 0 24px;
}
.chart-container {
  width: 100%; height: 450px;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px; padding: 16px;
}
.chart-container-mig { height: 380px; margin-top: 16px; }

.chart-legend-custom {
  display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;
  margin-top: 16px;
}
.legend-item { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.legend-item i {
  display: inline-block; width: 24px; height: 3px; border-radius: 2px;
}
.legend-baseline i { background: #94a3b8; border-top: 2px dashed #94a3b8; background: transparent; }
.legend-selected i { background: #2563eb; }
.legend-disc i { background: #ef4444; border-top: 2px dotted #ef4444; background: transparent; }
.legend-be i {
  width: 14px; height: 14px; background: #10b981; border-radius: 50%;
}

/* ── 迁移 NPV ─────────────────────────────── */
.migration-section {
  max-width: 1200px; margin: 24px auto 0; padding: 0 24px;
}
.migration-section h3 { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
.migration-worth {
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
  padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #10b981;
  margin-bottom: 12px; display: inline-block;
}
.migration-not-worth {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #ef4444;
  margin-bottom: 12px; display: inline-block;
}

/* ── 响应式 ───────────────────────────────── */
@media (max-width: 768px) {
  .control-grid { grid-template-columns: 1fr; }
  .metrics-row { grid-template-columns: 1fr 1fr; }
  .gate-options { grid-template-columns: 1fr; }
  .gate-card { padding: 32px 24px; }
}
</style>
