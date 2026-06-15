<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>⚖️ 劳动供给决策</h1>
      <p>收入效应 vs 替代效应分解 · Cobb-Douglas 效用函数 · 向后弯曲劳动供给曲线</p>
    </div>

    <LabDashboardLayout>
      <template #controls>
    <div class="lab-controls">
      <div class="control-group">
        <label>初始工资率 <span class="val">{{ wage_initial }} 元/小时</span></label>
        <input type="range" v-model.number="wage_initial" min="10" max="150" step="2">
      </div>
      <div class="control-group">
        <label>新工资率 <span class="val">{{ wage_new }} 元/小时</span></label>
        <input type="range" v-model.number="wage_new" min="10" max="200" step="2">
      </div>
      <div class="control-group">
        <label>闲暇偏好 β <span class="val">{{ beta }}</span></label>
        <input type="range" v-model.number="beta" min="0.15" max="0.85" step="0.05">
        <div class="hint">β 越大 → 越偏好闲暇 → 劳动供给越少</div>
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '实时更新中…' : '刷新模拟' }}
      </button>
    </div>
      </template>

      <template #task>
    <LearningTaskCard
      task="调整工资率和闲暇偏好，判断工资上涨是否一定会增加劳动供给。"
      observe="比较替代效应、收入效应和总效应的方向。"
      :conclusion="supplyConclusion"
    />
      </template>

      <template #primary>
    <div v-if="result" class="lab-results">
      <!-- 效应卡片 -->
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">替代效应</span>
          <span class="stat-val" :class="result.effects.substitution_effect_hours > 0 ? 'up' : 'down'">
            {{ result.effects.substitution_effect_hours > 0 ? '+' : '' }}{{ result.effects.substitution_effect_hours }}h
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">收入效应</span>
          <span class="stat-val" :class="result.effects.income_effect_hours > 0 ? 'up' : 'down'">
            {{ result.effects.income_effect_hours > 0 ? '+' : '' }}{{ result.effects.income_effect_hours }}h
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">总效应</span>
          <span class="stat-val" :class="result.effects.total_effect_hours > 0 ? 'up' : 'down'">
            {{ result.effects.total_effect_hours > 0 ? '+' : '' }}{{ result.effects.total_effect_hours }}h
          </span>
        </div>
        <div class="stat-card" :class="result.effects.backward_bending ? 'warn' : ''">
          <span class="stat-label">主导效应</span>
          <span class="stat-val">{{ result.effects.dominant_effect }}</span>
          <span v-if="result.effects.backward_bending" class="warn-tag">⚠ 向后弯曲</span>
        </div>
      </div>

      <!-- 劳动供给曲线 -->
      <div class="chart-card">
        <h3>劳动供给曲线</h3>
        <v-chart :option="supplyCurveOption" autoresize style="height:340px" />
      </div>

      <!-- 三点对比 -->
      <div class="three-points">
        <div class="point-card">
          <span class="point-badge">点A · 初始均衡</span>
          <div class="point-row"><span>工资率</span><span>{{ result.point_A.wage }}元/h</span></div>
          <div class="point-row"><span>劳动供给</span><span>{{ result.point_A.labor_hours }}h</span></div>
          <div class="point-row"><span>消费</span><span>{{ result.point_A.consumption }}元</span></div>
          <div class="point-row"><span>闲暇</span><span>{{ result.point_A.leisure_hours }}h</span></div>
        </div>
        <div class="point-arrow">→</div>
        <div class="point-card dim">
          <span class="point-badge">点B · 希克斯补偿</span>
          <div class="point-row"><span>工资率</span><span>{{ result.point_B.wage }}元/h</span></div>
          <div class="point-row"><span>劳动供给</span><span>{{ result.point_B.labor_hours }}h</span></div>
          <div class="point-row"><span>消费</span><span>{{ result.point_B.consumption }}元</span></div>
          <div class="point-row"><span>闲暇</span><span>{{ result.point_B.leisure_hours }}h</span></div>
        </div>
        <div class="point-arrow">→</div>
        <div class="point-card">
          <span class="point-badge">点C · 最终均衡</span>
          <div class="point-row"><span>工资率</span><span>{{ result.point_C.wage }}元/h</span></div>
          <div class="point-row"><span>劳动供给</span><span>{{ result.point_C.labor_hours }}h</span></div>
          <div class="point-row"><span>消费</span><span>{{ result.point_C.consumption }}元</span></div>
          <div class="point-row"><span>闲暇</span><span>{{ result.point_C.leisure_hours }}h</span></div>
        </div>
      </div>

      <p class="policy-note">
        思考：工资提高不一定意味着劳动时间无限增加。体面劳动既关注收入，也关注休息、家庭责任和劳动者福祉，这正是劳动供给曲线背后的现实含义。
      </p>
    </div>
      </template>
    </LabDashboardLayout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import LabDashboardLayout from '../components/LabDashboardLayout.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])


const wage_initial = ref(32)
const wage_new = ref(54)
const beta = ref(0.4)
const loading = ref(false)
const result = ref(null)
let debounceTimer = null

const supplyConclusion = computed(() => {
  if (!result.value) return ''
  const e = result.value.effects
  const direction = e.total_effect_hours > 0 ? '增加' : e.total_effect_hours < 0 ? '减少' : '基本不变'
  const bend = e.backward_bending ? '，并出现向后弯曲特征' : ''
  return `当前参数下，劳动供给${direction}${Math.abs(e.total_effect_hours)}小时，主导力量是${e.dominant_effect}${bend}。`
})

const supplyCurveOption = computed(() => {
  if (!result.value) return {}
  const d = result.value.supply_curve
  return {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: { name: '工资率 (元/h)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    yAxis: { name: '劳动供给 (h)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'line', data: d.wages.map((w, i) => [w, d.labor_hours[i]]),
      smooth: true, lineStyle: { color: '#3b82f6', width: 2 },
      areaStyle: { color: 'rgba(59,130,246,0.08)' },
      itemStyle: { color: '#3b82f6' },
      symbol: 'none',
      markPoint: {
        data: [
          { coord: [result.value.point_A.wage, result.value.point_A.labor_hours], name: 'A', symbol: 'circle', symbolSize: 10, itemStyle: { color: '#f59e0b' } },
          { coord: [result.value.point_C.wage, result.value.point_C.labor_hours], name: 'C', symbol: 'circle', symbolSize: 10, itemStyle: { color: '#06b6d4' } },
        ],
        label: { fontSize: 11, color: '#fff' }
      }
    }]
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/supply/decompose'), {
      wage_initial: wage_initial.value,
      wage_new: wage_new.value,
      beta: beta.value,
      T: 24
    })
    result.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function scheduleRun() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(run, 220)
}

watch([wage_initial, wage_new, beta], scheduleRun)
onMounted(run)
</script>

<style scoped>
.lab { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; transition: color .2s; }
.back-link:hover { color: #94a3b8; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }

.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 180px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #3b82f6; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.control-group .hint { font-size: 11px; color: #64748b; margin-top: 4px; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(59,130,246,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }

.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-card.warn { border-color: rgba(245,158,11,0.3); }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { font-size: 24px; font-weight: 900; color: #f1f5f9; display: block; }
.stat-val.up { color: #06b6d4; }
.stat-val.down { color: #f59e0b; }
.warn-tag { display: inline-block; margin-top: 4px; font-size: 11px; color: #f59e0b; font-weight: 700; }

.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }

.three-points { display: flex; gap: 12px; align-items: center; margin-bottom: 40px; }
.point-card { flex: 1; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 14px; }
.point-card.dim { opacity: .7; }
.point-badge { display: block; font-size: 11px; color: #3b82f6; font-weight: 700; margin-bottom: 8px; }
.point-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: #94a3b8; }
.point-row span:last-child { color: #e2e8f0; font-weight: 600; }
.point-arrow { font-size: 20px; color: #64748b; flex-shrink: 0; }
.policy-note { margin: -16px 0 36px; color: #94a3b8; font-size: 13px; line-height: 1.8; background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.16); border-radius: 12px; padding: 14px 16px; }
@media (max-width: 768px) { .lab { padding: 28px 16px; } .lab-header h1 { font-size: 26px; } .lab-controls { display: grid; grid-template-columns: 1fr; } .cards-row { grid-template-columns: repeat(2, 1fr); } .three-points { flex-direction: column; } .point-card { width: 100%; box-sizing: border-box; } }
@media (max-width: 520px) { .cards-row { grid-template-columns: 1fr; } .chart-card { padding: 14px; } }
</style>
