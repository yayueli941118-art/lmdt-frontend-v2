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
          <button v-for="(opt, i) in gateOptions" :key="i" class="gate-option"
            :class="{ 'gate-option-selected': gateChoice === i, 'gate-option-correct': gateSubmitted && i === gateCorrect, 'gate-option-wrong': gateSubmitted && gateChoice === i && i !== gateCorrect }"
            :disabled="gateSubmitted" @click="gateChoice = i">
            <span class="gate-option-letter">{{ ['A','B','C','D'][i] }}</span>
            <span class="gate-option-text">{{ opt }}</span>
          </button>
        </div>
        <button v-if="!gateSubmitted" class="gate-submit" :disabled="gateChoice === null" @click="submitGate">提交预测</button>
        <div v-if="gateSubmitted" class="gate-feedback" :class="{ 'gate-feedback-correct': gateChoice === gateCorrect, 'gate-feedback-wrong': gateChoice !== gateCorrect }">
          <template v-if="gateChoice === gateCorrect">🎯 <strong>直觉很成熟！</strong>教育确实是人力资本投资回报最高的路径之一。</template>
          <template v-else>💡 正确答案是 <strong>D：60%–80%</strong>。</template>
          <button class="gate-enter" @click="unlockGate">进入实验室 →</button>
        </div>
      </div>
    </section>

    <!-- ===== 主体：左右分栏 ===== -->
    <div v-if="gateUnlocked" class="lab-grid">
      <!-- 左侧：粘性控制面板 (4/12) -->
      <aside class="lab-sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-title">🧬 明瑟方程 · 参数调节</h3>

          <div class="param-group">
            <label class="param-label">
              <span class="param-icon">🎓</span> 受教育年限
              <span class="param-val">{{ eduLabels[params.edu] || params.edu + '年' }}</span>
            </label>
            <div class="slider-wrap">
              <span class="slider-tick">初中</span>
              <input type="range" v-model.number="params.edu" min="9" max="22" step="1" @input="debounceFetch" class="slider" />
              <span class="slider-tick">博士</span>
            </div>
          </div>

          <div class="param-group">
            <label class="param-label"><span class="param-icon">📚</span> 培训投资类型</label>
            <div class="radio-group">
              <label v-for="t in trainTypes" :key="t" class="radio-item" :class="{ 'radio-active': params.train_type === t }">
                <input type="radio" v-model="params.train_type" :value="t" @change="debounceFetch" /><span>{{ t }}</span>
              </label>
            </div>
          </div>

          <div class="param-group">
            <label class="param-label">
              <span class="param-icon">⚠️</span> 市场歧视折损
              <span class="param-val">{{ params.disc }}%</span>
            </label>
            <div class="slider-wrap">
              <span class="slider-tick">0%</span>
              <input type="range" v-model.number="params.disc" min="0" max="50" step="1" @input="debounceFetch" class="slider slider-red" />
              <span class="slider-tick">50%</span>
            </div>
          </div>

          <div class="param-group">
            <label class="param-label">
              <span class="param-icon">📈</span> 观察年限
              <span class="param-val">{{ params.exp_peak }}年</span>
            </label>
            <input type="range" v-model.number="params.exp_peak" min="5" max="40" step="1" @input="debounceFetch" class="slider" />
          </div>

          <div v-if="response" class="sidebar-callout" :class="response.metrics.lifetime_premium_pct >= 0 ? 'callout-green' : 'callout-red'">
            <span class="callout-num">{{ response.metrics.lifetime_premium_pct >= 0 ? '+' : '' }}{{ response.metrics.lifetime_premium_pct }}%</span>
            <span class="callout-label">一生总收入溢价</span>
          </div>
        </div>
      </aside>

      <!-- 右侧：图表区 (8/12) -->
      <main class="lab-main">
        <!-- 指标卡片行 -->
        <div v-if="response" class="metrics-row">
          <div class="metric-card">
            <span class="metric-label">教育投资回本年龄</span>
            <span class="metric-value metric-green">{{ response.metrics.breakeven_age !== null ? response.metrics.breakeven_age + ' 岁' : '未回本' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">工资反超年龄</span>
            <span class="metric-value metric-blue">{{ response.metrics.crossover_age !== null ? response.metrics.crossover_age + ' 岁' : '—' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">教育内部收益率 (IRR)</span>
            <span class="metric-value metric-green">{{ (response.metrics.irr_pct || 0).toFixed(2) }}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">歧视折损率</span>
            <span class="metric-value metric-red">{{ response.metrics.discrimination_loss_pct }}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">vs 中国基准偏离</span>
            <span class="metric-value" :class="response.metrics.vs_china_baseline_pct >= 0 ? 'metric-green' : 'metric-red'">
              {{ response.metrics.vs_china_baseline_pct >= 0 ? '+' : '' }}{{ response.metrics.vs_china_baseline_pct }}%
            </span>
          </div>
        </div>

        <!-- 主图表 -->
        <div class="chart-card">
          <div ref="chartDom" class="chart-container"></div>
          <div class="chart-legend">
            <span class="legend-item legend-base"><i></i> 高中毕业（对照组）</span>
            <span class="legend-item legend-sel"><i></i> {{ eduLabels[params.edu] || '当前学历' }}（选择组）</span>
            <span class="legend-item legend-red" v-if="params.disc > 0"><i></i> 歧视受损轨迹</span>
            <span class="legend-item legend-invest"><span class="legend-patch legend-patch-red"></span> 投资期（直接成本+机会成本）</span>
            <span class="legend-item legend-return"><span class="legend-patch legend-patch-green"></span> 回报期（教育溢价）</span>
          </div>
        </div>

        <!-- 动态经济学诊断 -->
        <div class="insight-box">
          <!-- 学历溢价 + Signaling -->
          <p v-if="params.edu >= 16 && response?.metrics?.lifetime_premium_pct > 30">
            🎓 <strong>教育溢价与信号功能 (Signaling)：</strong>选择该学历使你的终身收入提升了 <strong>{{ response.metrics.lifetime_premium_pct }}%</strong>。这不仅是因为你的生产率得到了实质提升，更是因为高学历发挥了强大的<strong>信号功能</strong>，向雇主证明了你具有较低的培训成本和更高的学习能力，从而打破了信息不对称。
          </p>

          <!-- 一般培训 -->
          <p v-if="params.train_type.includes('一般')">
            🏋️ <strong>一般培训 (General Training)：</strong>你全额承担了培训的隐性成本（表现为前期更低的起点工资），因此你也获得了全部收益（曲线整体上移）。你可以带着这些通用技能随时在劳动力市场中溢价跳槽。
          </p>

          <!-- 特殊培训 -->
          <p v-if="params.train_type.includes('特殊')">
            🔧 <strong>特殊培训 (Specific Training)：</strong>你与企业共同分担了成本与收益。前期你在"交学费"，后期企业为防你跳槽给予了工资补偿（曲线斜率变陡）。这是典型的劳资双方锁定契约。
          </p>

          <!-- 默认提示 -->
          <p v-if="!params.train_type.includes('一般') && !params.train_type.includes('特殊') && !(params.edu >= 16 && response?.metrics?.lifetime_premium_pct > 30)">
            💡 <strong>你的人力资本决策诊断：</strong>拖动左侧滑块，系统将根据明瑟工资方程、人力资本理论和教育投资回报模型，为你生成专业的劳动经济学诊断报告。
          </p>
        </div>

        <!-- 课程思政：新人力资本理论 -->
        <div class="insight-box insight-sizheng">
          <p>
            🏛️ <strong>深度思考：人力资本投资的社会意义</strong>
          </p>
          <p>
            经济学家 Schultz、Becker 与 Mincer 奠定了"教育即投资"的经典框架——但在这些可量化的工资曲线背后，还有一座巨大的"人力资本冰山"。
          </p>
          <p>
            <strong>冰山下的"新人力资本"：非认知能力 (Non-cognitive Skills)</strong><br/>
            现代经济学与心理学研究（如著名的 Perry Preschool 派瑞学前项目、Heckman 的长期追踪实验）证明：决定你终生收入与社会阶层的，不仅是图表上的"学历"和"工龄"（认知能力），更是难以被直接量化的<strong>非认知能力</strong>。你的毅力 (Grit)、情绪稳定性、自控力以及与他人协作的精神，才是你在面对技术变革和失业冲击时，最坚实的人力资本底座。
          </p>
          <p>
            🇨🇳 在中国"新质生产力"与"共同富裕"的宏大叙事下，这意味着：教育政策不能仅关注"多上几年学"，更要关注人格塑造与社会情感能力的培育——让每一个人都拥有对抗结构性失业的韧性。
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { apiUrl } from '../lib/api'


// ── 预测门禁 ──────────────────────────────────
const gateOptions = ['10%–20%', '30%–50%', '50%–60%', '60%–80%']
const gateCorrect = 3
const gateUnlocked = ref(false)
const gateChoice = ref(null)
const gateSubmitted = ref(false)
const submitGate = () => { if (gateChoice.value !== null) gateSubmitted.value = true }
const unlockGate = () => { gateUnlocked.value = true }

// ── 参数 ──────────────────────────────────────
const eduLabels = { 9: '初中', 12: '高中', 16: '本科', 19: '硕士', 22: '博士' }
const trainTypes = ['无额外培训', '一般培训 (通用技能)', '特殊培训 (企业专属技能)']

const params = reactive({
  edu: 16, exp_peak: 40, train_type: '无额外培训',
  disc: 10.0,
})

const response = ref(null)

// ── 300ms 防抖 ────────────────────────────────
let debounceTimer = null
const debounceFetch = () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(fetchData, 300) }

const fetchData = async () => {
  try {
    const { data } = await axios.post(apiUrl('/api/v1/individual-lab/simulate'), { ...params })
    response.value = data
    await nextTick()
    renderChart()
  } catch (e) { console.error('API error:', e) }
}

// ── ECharts 图表 ──────────────────────────────
const chartDom = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartDom.value || !response.value) return
  if (!chartInstance) chartInstance = echarts.init(chartDom.value)

  const d = response.value
  const ages = d.charts.age_years

  // ── 负数映射 + 二维坐标组装 [age, value] ──
  const toView = (v) => v < 0 ? -15000 : v
  const base = d.charts.wage_curve_baseline.map((v, i) => [ages[i], v])
  const sel = d.charts.wage_curve_selected.map((v, i) => [ages[i], toView(v)])
  const discArr = d.charts.wage_curve_disc.map((v, i) => [ages[i], toView(v)])

  const crossover = d.metrics.crossover_age
  const be = d.metrics.breakeven_age
  const schoolEndAge = params.edu + 6

  // ── 三条核心曲线（无 stack，纯净） ──
  const series = [
    { name: '高中毕业（对照组）', type: 'line', data: base, lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' }, itemStyle: { color: '#94a3b8' }, symbol: 'none', smooth: true, z: 2 },
    { name: '选择组（当前学历）', type: 'line', data: sel, lineStyle: { width: 3, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, symbol: 'none', smooth: true, z: 4, markArea: {
      silent: true,
      data: [
        [{ name: '投资期', xAxis: 18, itemStyle: { color: 'rgba(239, 68, 68, 0.12)' } }, { xAxis: schoolEndAge }],
        [{ name: '回报期', xAxis: (crossover ?? schoolEndAge), itemStyle: { color: 'rgba(16, 185, 129, 0.12)' } }, { xAxis: 60 }],
      ],
      label: {
        show: true,
        position: 'insideTop',
        formatter: (p) => p.name || '',
        color: '#94a3b8', fontSize: 12, fontWeight: 600,
      },
    }},
  ]

  if (params.disc > 0) {
    series.push({
      name: '歧视受损轨迹',
      type: 'line', data: discArr,
      lineStyle: { type: 'dotted', width: 2, color: '#ef4444' },
      itemStyle: { color: '#ef4444' }, symbol: 'none', smooth: true,
      z: 1,
    })
  }

  // ── 标记点 + 标记线 ──
  const marks = []
  if (crossover !== null) {
    const ci = ages.indexOf(crossover)
    if (ci >= 0) {
      marks.push({
        name: '工资反超点', coord: sel[ci],  // [age, value] 二维坐标
        symbol: 'pin', symbolSize: 48, itemStyle: { color: '#f59e0b' },
        label: { show: true, formatter: `📍 反超 (${crossover}岁)`, position: 'top', distance: 14, color: '#f59e0b', fontSize: 14, fontWeight: 700 },
      })
    }
  }

  const markLines = []
  if (be !== null) {
    markLines.push({
      name: '回本线', xAxis: be,
      lineStyle: { type: 'dashed', color: '#10b981', width: 2 },
      label: { show: true, formatter: `⏳ 终身回本 (${be}岁)`, position: 'end', color: '#10b981', fontSize: 13, fontWeight: 700 },
    })
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '5%', top: 50, bottom: 40, containLabel: true },
    xAxis: { type: 'value', min: 18, max: 60, name: '年龄 (岁)', nameTextStyle: { color: '#94a3b8', fontSize: 12 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } } },
    yAxis: { type: 'value', name: '月收入 (元)', nameTextStyle: { color: '#94a3b8', fontSize: 12 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(148, 163, 184, 0.2)', textStyle: { color: '#f1f5f9', fontSize: 13 } },
    series,
    markPoint: marks.length > 0 ? { data: marks } : undefined,
    markLine: markLines.length > 0 ? { silent: true, symbol: 'none', data: markLines } : undefined,
  }

  chartInstance.setOption(option, { notMerge: true })
}

// ── Resize ────────────────────────────────────
const handleResize = () => { chartInstance?.resize() }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => { window.removeEventListener('resize', handleResize); chartInstance?.dispose() })

watch(gateUnlocked, (val) => { if (val) nextTick(() => debounceFetch()) })
</script>

<style scoped>
/* ========================================
   INDIVIDUAL LAB — Split Layout + Age Axis
   ======================================== */

.ind-lab {
  --bg-primary: #0f172a; --bg-card: rgba(30,41,59,0.55);
  --text-primary: #f1f5f9; --text-secondary: #94a3b8;
  --border-subtle: rgba(148,163,184,0.1);
  background: var(--bg-primary); min-height: 100vh;
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── 预测门禁 ─────────────────────────────── */
.gate-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
.gate-card {
  background: var(--bg-card); backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle); border-radius: 24px;
  padding: 48px 40px; max-width: 640px; width: 100%; text-align: center;
}
.gate-icon { width: 56px; height: 56px; margin: 0 auto 24px; color: #3b82f6; }
.gate-title { font-size: 24px; font-weight: 800; margin: 0 0 12px; }
.gate-question { font-size: 17px; color: var(--text-secondary); line-height: 1.7; margin: 0 0 32px; }
.gate-question strong { color: var(--text-primary); }
.gate-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
.gate-option {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 14px 16px; cursor: pointer;
  font-size: 15px; color: var(--text-secondary); text-align: left; font-family: inherit;
  transition: all 0.2s;
}
.gate-option:hover:not(:disabled) { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25); }
.gate-option-selected { background: rgba(59,130,246,0.12) !important; border-color: rgba(59,130,246,0.4) !important; color: var(--text-primary); }
.gate-option-correct { background: rgba(16,185,129,0.12) !important; border-color: rgba(16,185,129,0.4) !important; color: #10b981; }
.gate-option-wrong { background: rgba(239,68,68,0.08) !important; border-color: rgba(239,68,68,0.3) !important; color: #ef4444; opacity: 0.7; }
.gate-option-letter { font-weight: 900; font-size: 13px; background: rgba(255,255,255,0.06); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gate-option:disabled { cursor: default; }
.gate-submit {
  background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;
  border: none; border-radius: 12px; padding: 14px 40px;
  font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
  box-shadow: 0 8px 24px rgba(59,130,246,0.3); transition: all 0.3s;
}
.gate-submit:hover:not(:disabled) { box-shadow: 0 12px 32px rgba(59,130,246,0.45); transform: translateY(-1px); }
.gate-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.gate-feedback { margin-top: 24px; padding: 20px; border-radius: 12px; font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
.gate-feedback-correct { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); }
.gate-feedback-wrong { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); }
.gate-enter {
  display: inline-block; margin-top: 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;
  border: none; border-radius: 10px; padding: 10px 28px;
  font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
}

/* ── 左右分栏 ─────────────────────────────── */
.lab-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  align-items: start;
}

/* ── 左侧粘性面板 ──────────────────────────── */
.lab-sidebar { position: sticky; top: 24px; }
.sidebar-card {
  background: var(--bg-card); backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle); border-radius: 16px;
  padding: 24px;
}
.sidebar-title { font-size: 16px; font-weight: 800; margin: 0 0 20px; letter-spacing: -0.3px; }

.param-group { margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--border-subtle); }
.param-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.param-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  margin-bottom: 10px;
}
.param-icon { font-size: 15px; }
.param-val {
  margin-left: auto; background: rgba(59,130,246,0.1); color: #60a5fa;
  padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;
}
.slider-wrap { display: flex; align-items: center; gap: 8px; }
.slider-tick { font-size: 10px; color: var(--text-secondary); white-space: nowrap; }
.slider {
  -webkit-appearance: none; appearance: none; width: 100%;
  height: 5px; border-radius: 5px; background: rgba(148,163,184,0.15); outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: #3b82f6; cursor: pointer; box-shadow: 0 0 8px rgba(59,130,246,0.4);
}
.slider-red::-webkit-slider-thumb { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }
.slider-gold::-webkit-slider-thumb { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.4); }

.radio-group { display: flex; flex-direction: column; gap: 4px; }
.radio-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-radius: 8px; font-size: 12px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.02); border: 1px solid transparent;
}
.radio-item:hover { background: rgba(59,130,246,0.06); }
.radio-active { background: rgba(59,130,246,0.1) !important; border-color: rgba(59,130,246,0.25) !important; color: #60a5fa; }
.radio-item input { accent-color: #3b82f6; }

.toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-input { display: none; }
.toggle-track { width: 40px; height: 22px; border-radius: 22px; background: rgba(148,163,184,0.2); position: relative; transition: all 0.3s; }
.toggle-input:checked + .toggle-track { background: #3b82f6; }
.toggle-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.toggle-input:checked + .toggle-track .toggle-thumb { left: 20px; }
.toggle-text { font-size: 12px; color: var(--text-secondary); }

.sidebar-callout {
  margin-top: 20px; padding: 16px; border-radius: 12px; text-align: center;
}
.callout-green { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
.callout-red { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
.callout-num { display: block; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
.callout-green .callout-num { color: #10b981; }
.callout-red .callout-num { color: #ef4444; }
.callout-label { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

/* ── 右侧主体 ──────────────────────────────── */
.lab-main { min-width: 0; }

.metrics-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
.metric-card {
  background: var(--bg-card); backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle); border-radius: 12px;
  padding: 16px; text-align: center;
}
.metric-label { display: block; font-size: 11px; color: var(--text-secondary); letter-spacing: 0.5px; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; }
.metric-value { display: block; font-size: 26px; font-weight: 900; letter-spacing: -1px; }
.metric-blue { color: #3b82f6; }
.metric-red { color: #ef4444; }
.metric-green { color: #10b981; }

.chart-card {
  background: var(--bg-card); backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle); border-radius: 16px;
  padding: 20px; margin-bottom: 16px;
}
.chart-container { width: 100%; height: 480px; }
.chart-container-mig { height: 350px; }

.chart-legend { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; margin-top: 12px; }
.legend-item { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.legend-item i { display: inline-block; width: 20px; height: 3px; border-radius: 2px; }
.legend-base i { background: transparent; border-top: 2px dashed #94a3b8; }
.legend-sel i { background: #2563eb; }
.legend-red i { background: transparent; border-top: 2px dotted #ef4444; }
.legend-invest, .legend-return { gap: 4px; }
.legend-patch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; }
.legend-patch-red { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); }
.legend-patch-green { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); }

.chart-subtitle { font-size: 18px; font-weight: 700; margin: 0 0 12px; }
.insight-box {
  background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 12px;
  font-size: 14px; color: var(--text-secondary); line-height: 1.7;
}
.insight-box strong { color: var(--text-primary); }
.insight-sizheng {
  background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.15);
}

/* ── 响应式 ────────────────────────────────── */
@media (max-width: 900px) {
  .lab-grid { grid-template-columns: 1fr; }
  .lab-sidebar { position: static; }
  .metrics-row { grid-template-columns: 1fr 1fr; }
  .gate-options { grid-template-columns: 1fr; }
  .gate-card { padding: 32px 24px; }
}
</style>
