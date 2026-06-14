<template>
  <div class="lab">
    <div class="lab-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>💰 工资决定与收入差距</h1>
      <p>明瑟方程扩展 · 工资分布模拟 · 基尼系数 · 行业/地区/所有制溢价</p>
    </div>

    <div class="lab-controls">
      <div class="control-group">
        <label>受教育年限 <span class="val">{{ edu }}</span></label>
        <input type="range" v-model.number="edu" min="9" max="22" step="1">
      </div>
      <div class="control-group">
        <label>工作经验 <span class="val">{{ exp }}</span></label>
        <input type="range" v-model.number="exp" min="0" max="40" step="1">
      </div>
      <div class="control-group">
        <label>行业</label>
        <select v-model="industry">
          <option v-for="ind in industries" :key="ind" :value="ind">{{ ind }}</option>
        </select>
      </div>
      <div class="control-group">
        <label>地区</label>
        <select v-model="region">
          <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <button class="btn-run" @click="run" :disabled="loading">
        {{ loading ? '实时更新中…' : '刷新工资分布' }}
      </button>
    </div>

    <LearningTaskCard
      task="调整教育、经验、行业和地区，观察工资分布与收入差距如何改变。"
      observe="重点看预测月薪、基尼系数和 P90/P10 的同步变化。"
      :conclusion="wageConclusion"
    />

    <ExperimentRecordPanel
      experiment-name="工资决定与收入差距"
      :parameters="recordParameters"
      :metrics="recordMetrics"
      :conclusion="wageConclusion"
    />

    <div v-if="result" class="lab-results">
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">预测月薪</span>
          <span class="stat-val">{{ result.statistics.mean }}元</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">中位数</span>
          <span class="stat-val">{{ result.statistics.median }}元</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">基尼系数</span>
          <span class="stat-val">{{ result.statistics.gini }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">P90/P10</span>
          <span class="stat-val">{{ result.statistics.p90_p10_ratio }}x</span>
        </div>
      </div>

      <div class="chart-card">
        <h3>工资分布直方图</h3>
        <v-chart :option="histChart" autoresize style="height:300px" />
      </div>

      <!-- 十分位数 -->
      <div class="chart-card">
        <h3>十分位数分布</h3>
        <v-chart :option="decileChart" autoresize style="height:220px" />
      </div>

      <!-- 行业/地区对比 -->
      <div class="section-divider"><span>🏢 行业 & 地区对比</span></div>

      <div class="lab-controls">
        <div class="control-group">
          <label>对比组性别</label>
          <select v-model="gender">
            <option value="all">全部</option><option value="male">男</option><option value="female">女</option>
          </select>
        </div>
        <div class="control-group">
          <label>所有制</label>
          <select v-model="ownership">
            <option value="private">民营</option><option value="state">国企</option><option value="foreign">外企</option>
          </select>
        </div>
        <div class="control-group">
          <label><input type="checkbox" v-model="unionMember"> 工会成员</label>
        </div>
        <button class="btn-run" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)" @click="runMincer" :disabled="loading2">
          {{ loading2 ? '实时更新中…' : '刷新明瑟方程' }}
        </button>
      </div>

      <div v-if="mincerResult" class="stat-card" style="margin-bottom:24px;text-align:left">
        <div class="decomp-item" v-for="(v, k) in mincerResult.decomposition" :key="k">
          <span class="decomp-key">{{ k }}</span>
          <span class="decomp-val">{{ typeof v === 'number' ? v.toFixed(3) : v }}</span>
        </div>
      </div>

      <p class="policy-note">
        思考：工资差距要先拆开看，哪些来自教育和经验回报，哪些来自行业、地区与制度性差异。共同富裕不是抹平激励，而是让努力和能力有更公平的回报通道。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { apiUrl } from '../lib/api'
import LearningTaskCard from '../components/LearningTaskCard.vue'
import ExperimentRecordPanel from '../components/ExperimentRecordPanel.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])


const edu = ref(16); const exp = ref(5); const industry = ref('信息技术'); const region = ref('一线城市')
const loading = ref(false); const result = ref(null)
const gender = ref('all'); const ownership = ref('private'); const unionMember = ref(false)
const loading2 = ref(false); const mincerResult = ref(null)
let wageTimer = null
let mincerTimer = null

const wageConclusion = computed(() => {
  if (!result.value) return ''
  const s = result.value.statistics
  return `当前设定下，预测月薪均值为${s.mean}元，基尼系数为${s.gini}，P90/P10 为 ${s.p90_p10_ratio} 倍。`
})

const industries = ['信息技术','金融业','制造业','建筑业','批发零售','住宿餐饮','教育','医疗','交通运输','农业']
const regions = ['一线城市','新一线城市','二线城市','三线及以下']

const recordParameters = computed(() => ({
  '受教育年限': `${edu.value} 年`,
  '工作经验': `${exp.value} 年`,
  '行业': industry.value,
  '地区': region.value,
  '对比性别': gender.value === 'all' ? '全部' : gender.value === 'male' ? '男性' : '女性',
  '所有制': ownership.value,
  '工会成员': unionMember.value ? '是' : '否',
}))

const recordMetrics = computed(() => {
  if (!result.value) return {}
  return {
    '预测月薪均值': `${result.value.statistics.mean} 元`,
    '中位数': `${result.value.statistics.median} 元`,
    '基尼系数': result.value.statistics.gini,
    'P90/P10': `${result.value.statistics.p90_p10_ratio} 倍`,
  }
})

const histChart = computed(() => {
  if (!result.value) return {}
  const d = result.value.distribution
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { name: '月薪 (元)', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666', rotate: 30 }, data: d.bins.map(String) },
    yAxis: { name: '频数', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'bar', data: d.frequencies, itemStyle: { color: '#f59e0b', borderRadius: [4,4,0,0] } }]
  }
})

const decileChart = computed(() => {
  if (!result.value) return {}
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { name: '分位数', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' }, data: result.value.deciles.map(d => 'P' + d.percentile) },
    yAxis: { name: '月薪', nameTextStyle: { color: '#888' }, axisLabel: { color: '#666' } },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'line', data: result.value.deciles.map(d => d.value), lineStyle: { color: '#06b6d4', width: 2 }, areaStyle: { color: 'rgba(6,182,212,0.08)' }, itemStyle: { color: '#06b6d4' } }]
  }
})

async function run() {
  loading.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/wage/distribution'), {
      edu_years: edu.value, exp_years: exp.value, industry: industry.value, region: region.value
    })
    result.value = data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}

async function runMincer() {
  loading2.value = true
  try {
    const { data } = await axios.post(apiUrl('/api/v2/wage/mincer'), {
      edu_years: edu.value, exp_years: exp.value, gender: gender.value, ownership: ownership.value, union_member: unionMember.value
    })
    mincerResult.value = data
  } catch(e) { console.error(e) }
  finally { loading2.value = false }
}

function scheduleWage() {
  clearTimeout(wageTimer)
  wageTimer = setTimeout(run, 220)
}

function scheduleMincer() {
  clearTimeout(mincerTimer)
  mincerTimer = setTimeout(runMincer, 220)
}

watch([edu, exp, industry, region], () => {
  scheduleWage()
  scheduleMincer()
})
watch([gender, ownership, unionMember], scheduleMincer)
onMounted(() => {
  run()
  runMincer()
})
</script>

<style scoped>
.lab { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.lab-header { margin-bottom: 32px; }
.back-link { color: #64748b; text-decoration: none; font-size: 13px; }
.lab-header h1 { font-size: 32px; font-weight: 900; margin: 12px 0 8px; color: #f1f5f9; }
.lab-header p { color: #94a3b8; font-size: 15px; margin: 0; }

.lab-controls { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px; padding: 20px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; }
.control-group { flex: 1; min-width: 120px; }
.control-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.control-group label .val { color: #f59e0b; font-weight: 700; }
.control-group input[type="range"] { width: 100%; }
.control-group select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.2); background: #1e293b; color: #e2e8f0; font-size: 13px; }
.btn-run { padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .3s; white-space: nowrap; }
.btn-run:hover { box-shadow: 0 8px 24px rgba(245,158,11,.35); transform: translateY(-1px); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }

.cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 12px; padding: 16px; text-align: center; }
.stat-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.stat-val { font-size: 22px; font-weight: 900; color: #f1f5f9; display: block; }

.chart-card { background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.chart-card h3 { color: #94a3b8; font-size: 14px; font-weight: 700; margin: 0 0 12px; }

.section-divider { display: flex; align-items: center; gap: 16px; margin: 48px 0 24px; color: #94a3b8; font-size: 15px; font-weight: 700; }
.section-divider::after { content: ''; flex: 1; height: 1px; background: rgba(148,163,184,0.08); }

.decomp-item { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid rgba(148,163,184,0.04); }
.decomp-key { color: #64748b; text-transform: capitalize; }
.decomp-val { color: #06b6d4; font-weight: 600; }
.policy-note { margin: -4px 0 24px; color: #94a3b8; font-size: 13px; line-height: 1.8; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.16); border-radius: 12px; padding: 14px 16px; }

@media (max-width: 768px) { .lab { padding: 28px 16px; } .lab-header h1 { font-size: 26px; } .lab-controls { display: grid; grid-template-columns: 1fr; } .cards-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .cards-row { grid-template-columns: 1fr; } .chart-card { padding: 14px; } .decomp-item { align-items: flex-start; flex-direction: column; gap: 3px; } }
</style>
