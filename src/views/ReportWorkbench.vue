<template>
  <div class="workbench">
    <header class="workbench-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span class="page-kicker">课程作业工作台</span>
      <h1>岗位劳动力市场预测报告工作台</h1>
      <p>采集招聘样本，统计薪酬与技能需求，并结合 LMDT 仿真生成课程报告。</p>
    </header>

    <section class="panel target-panel">
      <div class="panel-title">
        <span>01</span>
        <h2>研究对象</h2>
      </div>
      <div class="target-grid">
        <label>
          行业
          <input v-model.trim="target.industry" list="industry-options" placeholder="如：信息技术、制造业、教育">
        </label>
        <label>
          岗位
          <input v-model.trim="target.position" placeholder="如：数据分析师、人力资源专员">
        </label>
        <label>
          地区
          <input v-model.trim="target.region" list="region-options" placeholder="如：成都、重庆、全国">
        </label>
      </div>
      <datalist id="industry-options">
        <option v-for="item in industryOptions" :key="item" :value="item" />
      </datalist>
      <datalist id="region-options">
        <option v-for="item in regionOptions" :key="item" :value="item" />
      </datalist>
    </section>

    <section class="panel">
      <div class="panel-title">
        <span>02</span>
        <h2>招聘样本录入</h2>
      </div>
      <div class="sample-form">
        <label v-for="field in sampleFields" :key="field.key">
          {{ field.label }}
          <input v-if="field.type !== 'textarea'" v-model.trim="draft[field.key]" :type="field.type || 'text'" :placeholder="field.placeholder">
          <textarea v-else v-model.trim="draft[field.key]" :placeholder="field.placeholder"></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="saveSample">{{ editingId ? '保存修改' : '新增样本' }}</button>
        <button class="ghost-btn" type="button" @click="resetDraft">清空表单</button>
        <label class="file-btn">
          CSV 导入
          <input type="file" accept=".csv,text/csv" @change="importCsv">
        </label>
      </div>
      <p class="hint">CSV 表头可使用：岗位名称、企业名称、行业、地区、薪资下限、薪资上限、学历要求、经验要求、技能关键词、用工形式、招聘链接或截图编号。</p>
    </section>

    <section class="panel table-panel">
      <div class="panel-title">
        <span>03</span>
        <h2>样本清单</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>岗位</th>
              <th>企业</th>
              <th>行业</th>
              <th>地区</th>
              <th>薪资</th>
              <th>学历</th>
              <th>经验</th>
              <th>技能</th>
              <th>来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="samples.length === 0">
              <td colspan="10" class="empty-cell">还没有样本。可以手动新增，也可以导入 CSV。</td>
            </tr>
            <tr v-for="sample in samples" :key="sample.id">
              <td>{{ sample.position }}</td>
              <td>{{ sample.company }}</td>
              <td>{{ sample.industry }}</td>
              <td>{{ sample.region }}</td>
              <td>{{ sample.salaryMin }}-{{ sample.salaryMax }}</td>
              <td>{{ sample.education }}</td>
              <td>{{ sample.experience }}</td>
              <td class="skills-cell">{{ sample.skills }}</td>
              <td>{{ sample.source }}</td>
              <td class="row-actions">
                <button type="button" @click="editSample(sample)">编辑</button>
                <button type="button" @click="deleteSample(sample.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="stats-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </div>
    </section>

    <section class="chart-grid">
      <div class="panel chart-panel">
        <h2>薪资区间分布</h2>
        <v-chart :option="salaryChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>学历要求分布</h2>
        <v-chart :option="educationChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>经验要求分布</h2>
        <v-chart :option="experienceChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>高频技能 Top 10</h2>
        <v-chart :option="skillChart" autoresize style="height:300px" />
      </div>
    </section>

    <section class="panel skill-panel">
      <div class="panel-title">
        <span>04</span>
        <h2>技能关键词词频</h2>
      </div>
      <div class="skill-tags">
        <span v-for="skill in topSkills" :key="skill.name">{{ skill.name }} × {{ skill.value }}</span>
        <span v-if="topSkills.length === 0" class="muted">录入技能关键词后自动生成。</span>
      </div>
    </section>

    <section class="panel sim-panel">
      <div class="panel-title">
        <span>05</span>
        <h2>LMDT 仿真辅助分析</h2>
      </div>
      <div class="sim-grid">
        <div v-for="item in simulationLinks" :key="item.title" class="sim-card">
          <strong>{{ item.title }}</strong>
          <p>{{ item.desc }}</p>
          <router-link :to="item.to">进入模块</router-link>
        </div>
      </div>
    </section>

    <section class="panel records-panel">
      <div class="panel-title">
        <span>06</span>
        <h2>已保存的实验记录</h2>
      </div>
      <div v-if="experimentRecords.length === 0" class="empty-block">工资和失业实验室中的实验记录可以保存到这里，用于报告第五部分。</div>
      <div v-else class="record-list">
        <article v-for="record in experimentRecords" :key="record.id">
          <div>
            <strong>{{ record.experimentName }}</strong>
            <span>{{ formatDate(record.createdAt) }}</span>
          </div>
          <p>{{ record.conclusion }}</p>
        </article>
      </div>
    </section>

    <section class="panel report-panel">
      <div class="panel-title">
        <span>07</span>
        <h2>报告草稿</h2>
      </div>
      <textarea v-model="reportDraft" class="report-textarea"></textarea>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="copyReport">一键复制 Markdown 报告</button>
        <button class="ghost-btn" type="button" @click="downloadMarkdown">下载 .md 文件</button>
        <button class="ghost-btn" type="button" @click="downloadHtml">下载 .html 文件</button>
        <button class="ghost-btn" type="button" @click="printPage">打印页面</button>
      </div>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const SAMPLE_KEY = 'lmdtReportSamples'
const TARGET_KEY = 'lmdtReportTarget'
const RECORD_KEY = 'lmdtReportExperimentRecords'

const industryOptions = ['信息技术', '制造业', '金融业', '教育', '医疗健康', '现代服务业', '交通运输', '批发零售']
const regionOptions = ['全国', '成都', '重庆', '北京', '上海', '广州', '深圳', '杭州', '西安']

const sampleFields = [
  { key: 'position', label: '岗位名称', placeholder: '数据分析师' },
  { key: 'company', label: '企业名称', placeholder: '某科技公司' },
  { key: 'industry', label: '行业', placeholder: '信息技术' },
  { key: 'region', label: '地区', placeholder: '成都' },
  { key: 'salaryMin', label: '薪资下限', type: 'number', placeholder: '8000' },
  { key: 'salaryMax', label: '薪资上限', type: 'number', placeholder: '13000' },
  { key: 'education', label: '学历要求', placeholder: '本科' },
  { key: 'experience', label: '经验要求', placeholder: '1-3年' },
  { key: 'skills', label: '技能关键词', type: 'textarea', placeholder: 'Excel, SQL, Python, 数据可视化' },
  { key: 'employmentType', label: '用工形式', placeholder: '全职' },
  { key: 'source', label: '招聘链接或截图编号', placeholder: '截图01 / URL' },
]

const emptyDraft = () => Object.fromEntries(sampleFields.map((field) => [field.key, '']))

const target = reactive({ industry: '', position: '', region: '' })
const draft = reactive(emptyDraft())
const samples = ref([])
const editingId = ref('')
const experimentRecords = ref([])
const message = ref('')

const salaryValues = computed(() => samples.value
  .map((sample) => (Number(sample.salaryMin) + Number(sample.salaryMax)) / 2)
  .filter((value) => Number.isFinite(value) && value > 0))

const stats = computed(() => {
  const values = [...salaryValues.value].sort((a, b) => a - b)
  const count = samples.value.length
  const salaryCount = values.length
  const average = salaryCount ? Math.round(values.reduce((sum, value) => sum + value, 0) / salaryCount) : 0
  const median = salaryCount ? Math.round((values[Math.floor((salaryCount - 1) / 2)] + values[Math.ceil((salaryCount - 1) / 2)]) / 2) : 0
  return {
    count,
    average,
    median,
    max: salaryCount ? Math.round(values[values.length - 1]) : 0,
    min: salaryCount ? Math.round(values[0]) : 0,
  }
})

const statCards = computed(() => [
  { label: '样本数量', value: `${stats.value.count} 条` },
  { label: '平均薪资', value: salaryText(stats.value.average) },
  { label: '中位薪资', value: salaryText(stats.value.median) },
  { label: '最高薪资', value: salaryText(stats.value.max) },
  { label: '最低薪资', value: salaryText(stats.value.min) },
])

const educationCounts = computed(() => countBy(samples.value.map((sample) => sample.education || '未标注')))
const experienceCounts = computed(() => countBy(samples.value.map((sample) => sample.experience || '未标注')))
const salaryBuckets = computed(() => {
  const buckets = [
    { name: '5千以下', min: 0, max: 5000 },
    { name: '5千-8千', min: 5000, max: 8000 },
    { name: '8千-1.2万', min: 8000, max: 12000 },
    { name: '1.2万-1.8万', min: 12000, max: 18000 },
    { name: '1.8万以上', min: 18000, max: Infinity },
  ]
  return buckets.map((bucket) => ({
    name: bucket.name,
    value: salaryValues.value.filter((value) => value >= bucket.min && value < bucket.max).length,
  }))
})
const skillCounts = computed(() => {
  const words = samples.value.flatMap((sample) => splitSkills(sample.skills))
  return countBy(words)
})
const topSkills = computed(() => Object.entries(skillCounts.value)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 10))

const salaryChart = computed(() => barOption(salaryBuckets.value.map((item) => item.name), salaryBuckets.value.map((item) => item.value), '#06b6d4'))
const educationChart = computed(() => pieOption(educationCounts.value))
const experienceChart = computed(() => barOption(Object.keys(experienceCounts.value), Object.values(experienceCounts.value), '#8b5cf6'))
const skillChart = computed(() => barOption(topSkills.value.map((item) => item.name), topSkills.value.map((item) => item.value), '#f59e0b', true))

const simulationLinks = [
  { title: '工资决定与收入差距', desc: '用于薪酬预测、教育回报、经验回报和收入差距分析。', to: '/lab/wage' },
  { title: '失业经济学', desc: '用于技能错配、AI冲击、岗位空缺和匹配效率分析。', to: '/lab/unemployment' },
  { title: '劳动力市场歧视', desc: '用于公平就业、招聘歧视风险和政策组合讨论。', to: '/lab/discrimination' },
  { title: '收入分配实验室', desc: '用于收入差距、技能溢价和共同富裕讨论。', to: '/lab/income-distribution' },
]

const reportDraft = computed({
  get: generateReport,
  set: () => {},
})

onMounted(() => {
  loadState()
})

watch(samples, () => {
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(samples.value))
}, { deep: true })

watch(target, () => {
  localStorage.setItem(TARGET_KEY, JSON.stringify(target))
}, { deep: true })

function loadState() {
  Object.assign(target, readJson(TARGET_KEY, { industry: '', position: '', region: '' }))
  samples.value = readJson(SAMPLE_KEY, [])
  experimentRecords.value = readJson(RECORD_KEY, [])
}

function saveSample() {
  const item = normalizeSample({ ...draft, id: editingId.value || `sample-${Date.now()}` })
  if (!item.position && !item.company) {
    setMessage('请至少填写岗位名称或企业名称。')
    return
  }
  if (editingId.value) {
    samples.value = samples.value.map((sample) => sample.id === editingId.value ? item : sample)
  } else {
    samples.value.unshift(item)
  }
  resetDraft()
}

function editSample(sample) {
  editingId.value = sample.id
  Object.assign(draft, emptyDraft(), sample)
}

function deleteSample(id) {
  samples.value = samples.value.filter((sample) => sample.id !== id)
}

function resetDraft() {
  editingId.value = ''
  Object.assign(draft, emptyDraft())
}

async function importCsv(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const rows = parseCsv(text)
  const imported = rows.map((row) => normalizeSample(mapCsvRow(row))).filter((row) => row.position || row.company)
  samples.value = [...imported, ...samples.value]
  event.target.value = ''
  setMessage(`已导入 ${imported.length} 条样本。`)
}

function mapCsvRow(row) {
  const get = (...names) => names.map((name) => row[name]).find((value) => value !== undefined) || ''
  return {
    id: `sample-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    position: get('岗位名称', '岗位', 'position'),
    company: get('企业名称', '企业', 'company'),
    industry: get('行业', 'industry'),
    region: get('地区', 'region'),
    salaryMin: get('薪资下限', '最低薪资', 'salaryMin'),
    salaryMax: get('薪资上限', '最高薪资', 'salaryMax'),
    education: get('学历要求', '学历', 'education'),
    experience: get('经验要求', '经验', 'experience'),
    skills: get('技能关键词', '技能', 'skills'),
    employmentType: get('用工形式', 'employmentType'),
    source: get('招聘链接或截图编号', '来源', 'source'),
  }
}

function normalizeSample(sample) {
  return {
    id: sample.id || `sample-${Date.now()}`,
    position: sample.position || target.position,
    company: sample.company || '',
    industry: sample.industry || target.industry,
    region: sample.region || target.region,
    salaryMin: Number(sample.salaryMin) || 0,
    salaryMax: Number(sample.salaryMax) || Number(sample.salaryMin) || 0,
    education: sample.education || '未标注',
    experience: sample.experience || '未标注',
    skills: sample.skills || '',
    employmentType: sample.employmentType || '未标注',
    source: sample.source || '',
  }
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() || '']))
  })
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function countBy(values) {
  return values.filter(Boolean).reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function splitSkills(value) {
  return String(value || '')
    .split(/[、,，;；\s/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function salaryText(value) {
  return value ? `${value.toLocaleString()} 元/月` : '暂无'
}

function barOption(labels, values, color, horizontal = false) {
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 24, bottom: horizontal ? 36 : 40, left: horizontal ? 84 : 48 },
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value', axisLabel: { color: '#64748b' } }
      : { type: 'category', data: labels, axisLabel: { color: '#64748b', interval: 0, rotate: labels.length > 5 ? 25 : 0 } },
    yAxis: horizontal
      ? { type: 'category', data: labels, axisLabel: { color: '#64748b' } }
      : { type: 'value', axisLabel: { color: '#64748b' } },
    series: [{ type: 'bar', data: values, itemStyle: { color, borderRadius: horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0] } }],
  }
}

function pieOption(counts) {
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      data,
      label: { color: '#cbd5e1' },
    }],
  }
}

function generateReport() {
  const areaTop = topCounts(samples.value.map((sample) => sample.region), 3).join('、') || target.region || '待补充'
  const educationTop = topCounts(samples.value.map((sample) => sample.education), 3).join('、') || '待补充'
  const experienceTop = topCounts(samples.value.map((sample) => sample.experience), 3).join('、') || '待补充'
  const skillText = topSkills.value.map((item, index) => `${index + 1}. ${item.name}（${item.value}次）`).join('\n') || '暂无技能词频，请继续补充样本。'
  const recordText = experimentRecords.value.slice(0, 5).map((record) => `- ${record.experimentName}：${record.conclusion || '待补充结论'}`).join('\n') || '- 工资模拟结果：待补充\n- 失业模拟结果：待补充\n- AI冲击模拟结果：待补充\n- 技能错配模拟结果：待补充'
  const topSkillNames = topSkills.value.slice(0, 3).map((item) => item.name).join('、') || '岗位核心技能'
  return `# ${target.industry || '某行业'}/${target.position || '某岗位'}劳动力市场预测报告

## 一、岗位与行业背景
本报告选择${target.region || '某地区'}的${target.industry || '某行业'}行业，聚焦${target.position || '某岗位'}岗位，基于招聘样本观察岗位需求、薪酬水平、学历经验要求与技能结构。

## 二、招聘需求分析
本次共采集招聘样本 ${stats.value.count} 条。主要招聘地区集中在：${areaTop}。学历要求主要包括：${educationTop}；经验要求主要包括：${experienceTop}。学生需要结合样本来源说明招聘需求是否具有区域集中、行业集中或企业类型集中的特点。

## 三、薪酬水平分析
样本平均薪资为 ${salaryText(stats.value.average)}，中位薪资为 ${salaryText(stats.value.median)}，最高薪资为 ${salaryText(stats.value.max)}，最低薪资为 ${salaryText(stats.value.min)}。从薪资区间看，需要进一步判断该岗位处于入门型、成长型还是高技能溢价型岗位。

## 四、技能需求分析
高频技能 Top 10：
${skillText}

请解释这些技能之间的结构关系，例如通用办公能力、数字技能、专业工具能力、沟通协作能力和行业知识。

## 五、LMDT 仿真辅助分析
${recordText}

请将工资决定与收入差距、失业经济学、AI冲击或技能错配等仿真结果写入本部分，并说明仿真结果如何支持你的岗位预测判断。

## 六、未来趋势判断
综合招聘样本和仿真分析，初步判断该岗位未来可能呈现扩张、稳定、收缩或结构性调整。请重点说明判断依据：样本需求数量、薪资水平、技能门槛、AI替代风险、行业景气度和区域产业政策。

## 七、学习与就业建议
建议围绕 ${topSkillNames} 等高频能力进行学习规划。若岗位呈现结构性调整，应优先提升可迁移技能、数字化工具能力和行业问题分析能力，并用具体课程、证书、项目或实习计划支撑就业准备。`
}

function topCounts(values, limit) {
  return Object.entries(countBy(values.filter(Boolean)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(reportDraft.value)
    setMessage('Markdown 报告已复制。')
  } catch {
    setMessage('当前浏览器不支持自动复制。')
  }
}

function downloadMarkdown() {
  downloadFile(reportDraft.value, reportFileName('md'), 'text/markdown;charset=utf-8')
}

function downloadHtml() {
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${target.position || '岗位'}劳动力市场预测报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.8;max-width:920px;margin:40px auto;padding:0 24px;color:#111827}pre{white-space:pre-wrap}</style></head><body><pre>${escapeHtml(reportDraft.value)}</pre></body></html>`
  downloadFile(html, reportFileName('html'), 'text/html;charset=utf-8')
}

function printPage() {
  window.print()
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function reportFileName(ext) {
  return `${target.industry || '行业'}-${target.position || '岗位'}-劳动力市场预测报告.${ext}`
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value || fallback
  } catch {
    return fallback
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : ''
}

function setMessage(text) {
  message.value = text
  window.clearTimeout(setMessage.timer)
  setMessage.timer = window.setTimeout(() => {
    message.value = ''
  }, 2400)
}
</script>

<style scoped>
.workbench {
  max-width: 1280px;
  margin: 0 auto;
  padding: 38px 24px 64px;
}
.workbench-header {
  margin-bottom: 24px;
}
.back-link {
  color: #64748b;
  text-decoration: none;
  font-size: 13px;
}
.page-kicker {
  display: block;
  margin-top: 18px;
  color: #22d3ee;
  font-size: 13px;
  font-weight: 800;
}
.workbench-header h1 {
  margin: 8px 0;
  color: #f8fafc;
  font-size: 34px;
  font-weight: 900;
}
.workbench-header p {
  max-width: 760px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.7;
}
.panel {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(30, 41, 59, 0.5);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.panel-title span {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #67e8f9;
  background: rgba(6, 182, 212, 0.1);
  font-weight: 900;
}
.panel-title h2,
.chart-panel h2 {
  margin: 0;
  color: #e2e8f0;
  font-size: 17px;
}
.target-grid,
.sample-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.sample-form {
  grid-template-columns: repeat(4, 1fr);
}
label {
  display: grid;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
}
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  padding: 10px 11px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.78);
  outline: none;
}
textarea {
  min-height: 42px;
  resize: vertical;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
button,
.file-btn {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  padding: 10px 14px;
  color: #dbeafe;
  background: rgba(15, 23, 42, 0.72);
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
}
.primary-btn {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #06b6d4, #2563eb);
}
.ghost-btn {
  background: rgba(15, 23, 42, 0.72);
}
.file-btn input {
  display: none;
}
.hint,
.message {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.message {
  color: #67e8f9;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}
th,
td {
  padding: 11px 9px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  color: #cbd5e1;
  font-size: 12px;
  text-align: left;
  vertical-align: top;
}
th {
  color: #94a3b8;
  font-weight: 800;
}
.empty-cell,
.empty-block {
  color: #64748b;
  text-align: center;
  padding: 28px;
}
.skills-cell {
  max-width: 180px;
}
.row-actions {
  white-space: nowrap;
}
.row-actions button {
  padding: 6px 8px;
  margin-right: 6px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  padding: 17px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.stat-card span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}
.stat-card strong {
  color: #f8fafc;
  font-size: 21px;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.chart-panel {
  min-width: 0;
}
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.skill-tags span {
  padding: 8px 11px;
  border-radius: 999px;
  color: #e0f2fe;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.18);
  font-size: 13px;
  font-weight: 700;
}
.skill-tags .muted {
  color: #64748b;
  background: transparent;
}
.sim-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.sim-card {
  min-width: 0;
  padding: 15px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.sim-card strong {
  display: block;
  color: #f8fafc;
  font-size: 14px;
}
.sim-card p {
  min-height: 64px;
  margin: 8px 0 12px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.65;
}
.sim-card a {
  color: #22d3ee;
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
}
.record-list {
  display: grid;
  gap: 10px;
}
.record-list article {
  padding: 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.record-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #e2e8f0;
}
.record-list span {
  color: #64748b;
  font-size: 12px;
}
.record-list p {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}
.report-textarea {
  min-height: 520px;
  font-family: Consolas, "Microsoft YaHei", monospace;
  line-height: 1.7;
}
@media print {
  .back-link,
  .target-panel,
  .sample-form,
  .table-panel,
  .chart-grid,
  .skill-panel,
  .sim-panel,
  .records-panel,
  .form-actions {
    display: none !important;
  }
  .workbench {
    max-width: none;
    padding: 0;
  }
  .panel {
    border: none;
    background: white;
  }
  .report-textarea {
    color: #111827;
    background: white;
    border: none;
  }
}
@media (max-width: 980px) {
  .target-grid,
  .sample-form,
  .chart-grid,
  .sim-grid,
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .workbench {
    padding: 28px 16px 72px;
  }
  .workbench-header h1 {
    font-size: 27px;
  }
  .target-grid,
  .sample-form,
  .chart-grid,
  .sim-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-card strong {
    font-size: 18px;
  }
  .report-textarea {
    min-height: 460px;
  }
}
</style>
