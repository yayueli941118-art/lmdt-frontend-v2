<template>
  <div class="workbench">
    <header class="workbench-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span class="page-kicker">课程报告工作台</span>
      <h1>岗位劳动力市场预测报告工作台</h1>
      <p>请先下载标准 CSV 模板采集招聘样本，再导入预览、完成统计分析、进入 LMDT 做仿真实验，最后生成 Markdown 报告草稿。</p>
      <div class="flow-strip">
        <span v-for="step in workflowSteps" :key="step">{{ step }}</span>
      </div>
    </header>

    <section class="panel target-panel">
      <div class="panel-title">
        <span>01</span>
        <h2>研究对象</h2>
      </div>
      <div class="target-grid">
        <label>
          行业
          <input v-model.trim="target.industry" list="industry-options" placeholder="如：文旅与会展、信息技术、制造业">
        </label>
        <label>
          岗位
          <input v-model.trim="target.position" placeholder="如：人力资源专员、数据分析师、活动策划">
        </label>
        <label>
          地区
          <input v-model.trim="target.region" list="region-options" placeholder="如：成都、重庆、成渝双城经济圈">
        </label>
      </div>
      <datalist id="industry-options">
        <option v-for="item in industryOptions" :key="item" :value="item" />
      </datalist>
      <datalist id="region-options">
        <option v-for="item in regionOptions" :key="item" :value="item" />
      </datalist>
    </section>

    <section class="panel template-panel">
      <div class="panel-title">
        <span>02</span>
        <h2>CSV 模板与导入校验</h2>
      </div>
      <div class="template-layout">
        <div class="template-copy">
          <strong>先按模板采集，再导入预览。</strong>
          <p>技能关键词请用中文分号隔开，例如：Excel；数据分析；劳动法；招聘；薪酬核算。导入前系统会先检查样本数、有效薪资、缺失项和问题行，不会直接写入样本库。</p>
          <div class="form-actions compact">
            <button class="primary-btn" type="button" @click="downloadCsvTemplate">下载 CSV 模板</button>
            <button class="ghost-btn" type="button" @click="downloadExampleCsv">下载示例数据</button>
            <label class="file-btn">
              选择 CSV 并预览
              <input type="file" accept=".csv,text/csv" @change="previewCsv">
            </label>
          </div>
        </div>
        <div class="field-list" aria-label="CSV 模板字段">
          <span v-for="field in csvHeaders" :key="field">{{ field }}</span>
        </div>
      </div>
      <p class="hint">建议使用 UTF-8 CSV。本页用于整理你们采集到的样本数据，不会自动抓取招聘平台信息。</p>
    </section>

    <section v-if="csvPreview" class="panel preview-panel">
      <div class="panel-title">
        <span>03</span>
        <h2>CSV 导入前预览</h2>
      </div>
      <div class="preview-cards">
        <div v-for="card in previewCards" :key="card.label" class="stat-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </div>
      <div class="preview-body">
        <div class="issue-box">
          <strong>问题行</strong>
          <p v-if="csvPreview.issueRows.length === 0">未发现明显格式问题，可以导入。</p>
          <ul v-else>
            <li v-for="item in csvPreview.issueRows.slice(0, 10)" :key="item.rowNumber">
              第 {{ item.rowNumber }} 行：{{ item.issues.join('；') }}
            </li>
          </ul>
          <p v-if="csvPreview.issueRows.length > 10" class="muted">还有 {{ csvPreview.issueRows.length - 10 }} 行问题未展开。</p>
        </div>
        <div class="preview-table-wrap">
          <table>
            <thead>
              <tr>
                <th>行号</th>
                <th>岗位</th>
                <th>企业</th>
                <th>城市</th>
                <th>薪资</th>
                <th>技能数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in csvPreview.rows.slice(0, 8)" :key="row.rowNumber">
                <td>{{ row.rowNumber }}</td>
                <td>{{ row.sample.position || '未填' }}</td>
                <td>{{ row.sample.company || '未填' }}</td>
                <td>{{ row.sample.city || '未填' }}</td>
                <td>{{ salaryRangeText(row.sample) }}</td>
                <td>{{ splitSkills(row.sample.skills).length }}</td>
                <td :class="{ 'bad-text': row.issues.length }">{{ row.issues.length ? '需检查' : '可导入' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="confirmCsvImport">确认导入 {{ csvPreview.importableRows.length }} 条</button>
        <button class="ghost-btn" type="button" @click="cancelCsvPreview">取消预览</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-title">
        <span>04</span>
        <h2>样本补充与编辑</h2>
      </div>
      <div class="sample-form">
        <label v-for="field in sampleFields" :key="field.key" :class="{ wide: field.wide }">
          {{ field.label }}
          <input v-if="field.type !== 'textarea'" v-model.trim="draft[field.key]" :type="field.type || 'text'" :placeholder="field.placeholder">
          <textarea v-else v-model.trim="draft[field.key]" :placeholder="field.placeholder"></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="saveSample">{{ editingId ? '保存修改' : '新增样本' }}</button>
        <button class="ghost-btn" type="button" @click="resetDraft">清空表单</button>
      </div>
    </section>

    <section class="panel table-panel">
      <div class="panel-title">
        <span>05</span>
        <h2>样本清单</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>平台</th>
              <th>企业</th>
              <th>岗位</th>
              <th>行业</th>
              <th>城市</th>
              <th>薪资</th>
              <th>学历</th>
              <th>经验</th>
              <th>技能关键词</th>
              <th>证据</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="samples.length === 0">
              <td colspan="12" class="empty-cell">还没有样本。先下载模板采集数据，或手动新增几条样本进行课堂演示。</td>
            </tr>
            <tr v-for="sample in samples" :key="sample.id">
              <td>{{ sample.sampleNo || '-' }}</td>
              <td>{{ sample.platform || '-' }}</td>
              <td>{{ sample.company }}</td>
              <td>{{ sample.position }}</td>
              <td>{{ sample.industry }}</td>
              <td>{{ sample.city }}</td>
              <td>{{ salaryRangeText(sample) }}</td>
              <td>{{ sample.education }}</td>
              <td>{{ sample.experience }}</td>
              <td class="skills-cell">{{ sample.skills }}</td>
              <td>{{ sample.screenshotNo || sample.jobLink || '-' }}</td>
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
        <h2>薪资区间柱状图</h2>
        <v-chart :option="salaryChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>城市分布</h2>
        <v-chart :option="cityChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>学历要求分布</h2>
        <v-chart :option="educationChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>经验要求分布</h2>
        <v-chart :option="experienceChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel wide-chart">
        <h2>技能词频 Top 10</h2>
        <v-chart :option="skillChart" autoresize style="height:320px" />
      </div>
    </section>

    <section class="panel skill-panel">
      <div class="panel-title">
        <span>06</span>
        <h2>技能关键词词频</h2>
      </div>
      <div class="skill-tags">
        <span v-for="skill in topSkills" :key="skill.name">{{ skill.name }} × {{ skill.value }}</span>
        <span v-if="topSkills.length === 0" class="muted">导入或录入技能关键词后自动生成。</span>
      </div>
    </section>

    <section class="panel sim-panel">
      <div class="panel-title">
        <span>07</span>
        <h2>LMDT 仿真辅助分析</h2>
      </div>
      <div class="recommend-box">
        <strong>建议进入：</strong>
        <ol>
          <li v-for="item in recommendedLinks" :key="item.title">{{ item.title }}：{{ item.reason }}</li>
        </ol>
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
        <span>08</span>
        <h2>已保存的 LMDT 实验记录</h2>
      </div>
      <p class="local-note">这些记录只保存在当前浏览器。不同同学、不同设备、不同浏览器之间不会自动同步。</p>
      <div v-if="experimentRecords.length === 0" class="empty-block">工资、失业、成渝文旅等实验室保存的实验记录会出现在这里，用于报告第五部分。</div>
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

    <section class="panel data-panel">
      <div class="panel-title">
        <span>09</span>
        <h2>本机数据管理</h2>
      </div>
      <div class="data-layout">
        <div>
          <strong>当前浏览器数据</strong>
          <p>本页数据使用浏览器本地存储。适合 30 人同时上课时各自完成作业，不会把不同学生或小组的数据混在一起。</p>
          <div class="data-summary">
            <span>样本 {{ samples.length }} 条</span>
            <span>实验记录 {{ experimentRecords.length }} 条</span>
            <span>{{ reportText ? '已有报告草稿' : '暂无报告草稿' }}</span>
          </div>
        </div>
        <div class="data-actions">
          <button class="primary-btn" type="button" @click="exportAssignmentPackage">导出作业数据包</button>
          <label class="file-btn">
            导入作业数据包
            <input type="file" accept=".json,application/json" @change="importAssignmentPackage">
          </label>
          <button class="danger-btn" type="button" @click="clearLocalWorkbenchData">清空本机数据</button>
        </div>
      </div>
      <p class="hint">数据包会包含研究对象、招聘样本、LMDT 实验记录和当前报告草稿，方便换电脑继续做或提交给老师留档。</p>
    </section>

    <section class="panel report-panel">
      <div class="panel-title">
        <span>10</span>
        <h2>Markdown 报告草稿</h2>
      </div>
      <textarea v-model="reportText" class="report-textarea" @input="reportEdited = true"></textarea>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="generateReportDraft">生成/刷新报告草稿</button>
        <button class="ghost-btn" type="button" @click="copyReport">复制 Markdown</button>
        <button class="ghost-btn" type="button" @click="downloadMarkdown">下载 .md</button>
        <button class="ghost-btn" type="button" @click="downloadHtml">下载 .html</button>
        <button class="ghost-btn" type="button" @click="printPage">打印页面</button>
      </div>
      <p class="hint">建议先用 Markdown 草稿完成报告主体，再补充解释、截图编号和仿真实验结论。</p>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const SAMPLE_KEY = 'lmdtReportSamples'
const TARGET_KEY = 'lmdtReportTarget'
const RECORD_KEY = 'lmdtReportExperimentRecords'
const REPORT_KEY = 'lmdtReportDraft'
const PACKAGE_SCHEMA = 'lmdt-report-workbench-package-v1'

const workflowSteps = ['采集招聘数据', '按模板导入', '预览与校验', '自动统计', 'LMDT 仿真', '生成报告草稿', '导出作业']
const csvHeaders = ['样本编号', '招聘平台', '采集日期', '企业名称', '岗位名称', '行业', '城市', '薪资下限', '薪资上限', '学历要求', '经验要求', '技能关键词', '用工形式', '岗位链接', '截图编号', '备注']
const industryOptions = ['文旅与会展', '文化旅游', '信息技术', '制造业', '金融业', '教育', '医疗健康', '现代服务业', '交通运输', '批发零售']
const regionOptions = ['全国', '成渝双城经济圈', '成都', '重庆', '北京', '上海', '广州', '深圳', '杭州', '西安']

const sampleFields = [
  { key: 'sampleNo', label: '样本编号', placeholder: 'S001' },
  { key: 'platform', label: '招聘平台', placeholder: '智联招聘 / BOSS直聘 / 线下访谈' },
  { key: 'collectDate', label: '采集日期', type: 'date' },
  { key: 'company', label: '企业名称', placeholder: '某科技公司' },
  { key: 'position', label: '岗位名称', placeholder: '人力资源专员' },
  { key: 'industry', label: '行业', placeholder: '现代服务业' },
  { key: 'city', label: '城市', placeholder: '成都' },
  { key: 'salaryMin', label: '薪资下限', type: 'number', placeholder: '6000' },
  { key: 'salaryMax', label: '薪资上限', type: 'number', placeholder: '9000' },
  { key: 'education', label: '学历要求', placeholder: '本科' },
  { key: 'experience', label: '经验要求', placeholder: '1-3年' },
  { key: 'employmentType', label: '用工形式', placeholder: '全职' },
  { key: 'jobLink', label: '岗位链接', placeholder: 'URL，可为空', wide: true },
  { key: 'screenshotNo', label: '截图编号', placeholder: '截图01' },
  { key: 'skills', label: '技能关键词', type: 'textarea', placeholder: 'Excel；数据分析；劳动法；招聘；薪酬核算', wide: true },
  { key: 'notes', label: '备注', type: 'textarea', placeholder: '样本说明或采集备注', wide: true },
]

const emptyDraft = () => Object.fromEntries(sampleFields.map((field) => [field.key, '']))

const target = reactive({ industry: '', position: '', region: '' })
const draft = reactive(emptyDraft())
const samples = ref([])
const editingId = ref('')
const experimentRecords = ref([])
const csvPreview = ref(null)
const reportText = ref('')
const reportEdited = ref(false)
const message = ref('')

const salaryValues = computed(() => samples.value
  .map((sample) => salaryMidpoint(sample))
  .filter((value) => Number.isFinite(value) && value > 0))

const stats = computed(() => {
  const values = [...salaryValues.value].sort((a, b) => a - b)
  const salaryCount = values.length
  const average = salaryCount ? Math.round(values.reduce((sum, value) => sum + value, 0) / salaryCount) : 0
  const median = salaryCount ? Math.round((values[Math.floor((salaryCount - 1) / 2)] + values[Math.ceil((salaryCount - 1) / 2)]) / 2) : 0
  return {
    count: samples.value.length,
    salaryCount,
    missingSalary: Math.max(samples.value.length - salaryCount, 0),
    average,
    median,
    max: salaryCount ? Math.round(values[values.length - 1]) : 0,
    min: salaryCount ? Math.round(values[0]) : 0,
  }
})

const statCards = computed(() => [
  { label: '样本数量', value: `${stats.value.count} 条` },
  { label: '有效薪资', value: `${stats.value.salaryCount} 条` },
  { label: '平均薪资', value: salaryText(stats.value.average) },
  { label: '中位薪资', value: salaryText(stats.value.median) },
  { label: '最高薪资', value: salaryText(stats.value.max) },
  { label: '最低薪资', value: salaryText(stats.value.min) },
])

const cityCounts = computed(() => countBy(samples.value.map((sample) => sample.city || '未标注')))
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
const skillCounts = computed(() => countBy(samples.value.flatMap((sample) => splitSkills(sample.skills))))
const topSkills = computed(() => Object.entries(skillCounts.value)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 10))
const totalSkillTokens = computed(() => Object.values(skillCounts.value).reduce((sum, value) => sum + value, 0))

const salaryChart = computed(() => barOption(salaryBuckets.value.map((item) => item.name), salaryBuckets.value.map((item) => item.value), '#06b6d4'))
const cityChart = computed(() => barOption(Object.keys(cityCounts.value), Object.values(cityCounts.value), '#22c55e'))
const educationChart = computed(() => pieOption(educationCounts.value))
const experienceChart = computed(() => barOption(Object.keys(experienceCounts.value), Object.values(experienceCounts.value), '#8b5cf6'))
const skillChart = computed(() => barOption(topSkills.value.map((item) => item.name), topSkills.value.map((item) => item.value), '#f59e0b', true))

const previewCards = computed(() => {
  if (!csvPreview.value) return []
  return [
    { label: '识别样本', value: `${csvPreview.value.summary.total} 条` },
    { label: '可导入', value: `${csvPreview.value.importableRows.length} 条` },
    { label: '有效薪资', value: `${csvPreview.value.summary.validSalary} 条` },
    { label: '缺失薪资', value: `${csvPreview.value.summary.missingSalary} 条` },
    { label: '技能关键词', value: `${csvPreview.value.summary.skillTokens} 个` },
    { label: '问题行', value: csvPreview.value.issueRows.length ? csvPreview.value.issueRows.map((row) => row.rowNumber).join('、') : '无' },
  ]
})

const simulationLinks = [
  { title: '工资决定与收入差距', desc: '模拟学历、经验和技能溢价对薪酬水平的影响。', to: '/lab/wage' },
  { title: '失业经济学', desc: '分析技能错配、AI 冲击、岗位空缺和匹配效率。', to: '/lab/unemployment' },
  { title: '劳动力市场歧视', desc: '讨论招聘条件中的公平就业和歧视风险。', to: '/lab/discrimination' },
  { title: '收入分配实验室', desc: '用于收入差距、技能溢价和共同富裕讨论。', to: '/lab/income-distribution' },
  { title: '成渝文旅产业实验室', desc: '用于文旅与会展岗位需求预测、技能缺口和政策情景比较。', to: '/lab/chengyu-tourism' },
]

const recommendedLinks = computed(() => {
  const text = `${target.industry}${target.position}`
  const links = [
    { title: '工资决定与收入差距', reason: '模拟学历和经验对薪酬的影响' },
    { title: '失业经济学', reason: '模拟技能错配、AI 冲击和匹配效率' },
    { title: '劳动力市场歧视', reason: '分析招聘条件是否存在歧视风险' },
  ]
  if (/文旅|旅游|会展|景区|研学/.test(text)) {
    links.unshift({ title: '成渝文旅产业实验室', reason: '比较游客增长、数字文旅和政策情景对岗位需求的影响' })
  }
  return links
})

onMounted(() => {
  loadState()
  if (!reportText.value) generateReportDraft(false)
})

watch(samples, () => {
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(samples.value))
  refreshReportIfUntouched()
}, { deep: true })

watch(target, () => {
  localStorage.setItem(TARGET_KEY, JSON.stringify(target))
  refreshReportIfUntouched()
}, { deep: true })

watch(reportText, () => {
  localStorage.setItem(REPORT_KEY, reportText.value)
})

function loadState() {
  Object.assign(target, readJson(TARGET_KEY, { industry: '', position: '', region: '' }))
  samples.value = readJson(SAMPLE_KEY, []).map((sample) => normalizeSample(sample))
  experimentRecords.value = readJson(RECORD_KEY, [])
  reportText.value = localStorage.getItem(REPORT_KEY) || ''
  reportEdited.value = Boolean(reportText.value)
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
  setMessage('样本已保存。')
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

function downloadCsvTemplate() {
  downloadFile(toCsv([csvHeaders]), '岗位劳动力市场样本采集模板.csv', 'text/csv;charset=utf-8')
}

function downloadExampleCsv() {
  const rows = [
    csvHeaders,
    ['S001', 'BOSS直聘', today(), '某文旅集团', '活动策划专员', '文旅与会展', '成都', '6000', '9000', '本科', '1-3年', '活动策划；新媒体运营；沟通协调；Excel', '全职', 'https://example.com/job/001', '截图01', '课堂示例'],
    ['S002', '智联招聘', today(), '某科技公司', '数据分析师', '信息技术', '重庆', '9000', '14000', '本科', '3-5年', 'SQL；Python；数据分析；可视化', '全职', 'https://example.com/job/002', '截图02', '课堂示例'],
  ]
  downloadFile(toCsv(rows), '岗位劳动力市场样本示例.csv', 'text/csv;charset=utf-8')
}

async function previewCsv(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const rows = parseCsv(text)
  csvPreview.value = analyzeCsvRows(rows)
  event.target.value = ''
  setMessage(`已识别 ${csvPreview.value.summary.total} 条样本，请先查看预览。`)
}

function confirmCsvImport() {
  if (!csvPreview.value) return
  samples.value = [...csvPreview.value.importableRows.map((row) => row.sample), ...samples.value]
  setMessage(`已导入 ${csvPreview.value.importableRows.length} 条样本。`)
  csvPreview.value = null
}

function cancelCsvPreview() {
  csvPreview.value = null
}

function analyzeCsvRows(rows) {
  const parsedRows = rows.map((row, index) => {
    const sample = normalizeSample(mapCsvRow(row, index))
    const issues = validateSample(sample)
    return {
      rowNumber: index + 2,
      sample,
      issues,
      importable: Boolean(sample.position || sample.company),
    }
  }).filter((row) => hasAnyContent(row.sample))
  const importableRows = parsedRows.filter((row) => row.importable)
  const issueRows = parsedRows.filter((row) => row.issues.length)
  return {
    rows: parsedRows,
    importableRows,
    issueRows,
    summary: {
      total: parsedRows.length,
      validSalary: importableRows.filter((row) => salaryMidpoint(row.sample) > 0).length,
      missingSalary: importableRows.filter((row) => salaryMidpoint(row.sample) <= 0).length,
      skillTokens: importableRows.reduce((sum, row) => sum + splitSkills(row.sample.skills).length, 0),
    },
  }
}

function validateSample(sample) {
  const issues = []
  if (!sample.position) issues.push('缺少岗位名称')
  if (!sample.city) issues.push('缺少城市')
  if (!sample.salaryMin && !sample.salaryMax) issues.push('缺失薪资')
  if (sample._salaryOrderFixed) issues.push('薪资下限高于上限，已自动调换')
  if (splitSkills(sample.skills).length === 0) issues.push('缺少技能关键词')
  return issues
}

function mapCsvRow(row, index) {
  const get = (...names) => names.map((name) => row[name]).find((value) => value !== undefined && value !== '') || ''
  const source = get('招聘链接或截图编号', '来源', 'source')
  return {
    id: `sample-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    sampleNo: get('样本编号', '编号', 'sampleNo'),
    platform: get('招聘平台', '平台', 'platform'),
    collectDate: get('采集日期', '日期', 'collectDate'),
    company: get('企业名称', '企业', 'company'),
    position: get('岗位名称', '岗位', 'position'),
    industry: get('行业', 'industry'),
    city: get('城市', '地区', 'region', 'city'),
    salaryMin: get('薪资下限', '最低薪资', 'salaryMin'),
    salaryMax: get('薪资上限', '最高薪资', 'salaryMax'),
    education: get('学历要求', '学历', 'education'),
    experience: get('经验要求', '经验', 'experience'),
    skills: get('技能关键词', '技能', 'skills'),
    employmentType: get('用工形式', 'employmentType'),
    jobLink: get('岗位链接', '招聘链接', 'jobLink') || (/^https?:\/\//.test(source) ? source : ''),
    screenshotNo: get('截图编号', 'screenshotNo') || (!/^https?:\/\//.test(source) ? source : ''),
    notes: get('备注', 'notes'),
  }
}

function normalizeSample(sample) {
  let salaryMin = parseMoney(sample.salaryMin)
  let salaryMax = parseMoney(sample.salaryMax)
  let salaryOrderFixed = false
  if (!salaryMax && salaryMin) salaryMax = salaryMin
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    salaryOrderFixed = true
    const tmp = salaryMin
    salaryMin = salaryMax
    salaryMax = tmp
  }
  const legacySource = sample.source || ''
  return {
    id: sample.id || `sample-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sampleNo: sample.sampleNo || '',
    platform: sample.platform || '',
    collectDate: sample.collectDate || '',
    company: sample.company || '',
    position: sample.position || target.position,
    industry: sample.industry || target.industry,
    city: sample.city || sample.region || target.region,
    salaryMin,
    salaryMax,
    education: sample.education || '未标注',
    experience: sample.experience || '未标注',
    skills: normalizeSkillText(sample.skills || ''),
    employmentType: sample.employmentType || '未标注',
    jobLink: sample.jobLink || (/^https?:\/\//.test(legacySource) ? legacySource : ''),
    screenshotNo: sample.screenshotNo || (!/^https?:\/\//.test(legacySource) ? legacySource : ''),
    notes: sample.notes || '',
    _salaryOrderFixed: Boolean(sample._salaryOrderFixed || salaryOrderFixed),
  }
}

function hasAnyContent(sample) {
  return ['sampleNo', 'platform', 'company', 'position', 'industry', 'city', 'skills', 'jobLink', 'screenshotNo', 'notes']
    .some((key) => String(sample[key] || '').trim()) || sample.salaryMin || sample.salaryMax
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || '']))
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

function splitSkills(value) {
  return String(value || '')
    .split(/[；;、,，\n\r\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSkillText(value) {
  return splitSkills(value).join('；')
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0
  const raw = String(value || '').trim()
  if (!raw) return 0
  const number = Number.parseFloat(raw.replace(/,/g, ''))
  if (!Number.isFinite(number)) return 0
  if (/万/.test(raw)) return Math.round(number * 10000)
  if (/千|k/i.test(raw)) return Math.round(number * 1000)
  return Math.round(number)
}

function salaryMidpoint(sample) {
  const min = Number(sample.salaryMin || 0)
  const max = Number(sample.salaryMax || 0)
  if (min > 0 && max > 0) return (min + max) / 2
  return min || max || 0
}

function salaryRangeText(sample) {
  const min = Number(sample.salaryMin || 0)
  const max = Number(sample.salaryMax || 0)
  if (!min && !max) return '未填'
  if (min && max && min !== max) return `${min.toLocaleString()}-${max.toLocaleString()}`
  return `${(min || max).toLocaleString()}`
}

function countBy(values) {
  return values.filter(Boolean).reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function topCounts(values, limit) {
  return Object.entries(countBy(values.filter(Boolean)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

function salaryText(value) {
  return value ? `${value.toLocaleString()} 元/月` : '暂无'
}

function barOption(labels, values, color, horizontal = false) {
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 24, bottom: horizontal ? 36 : 48, left: horizontal ? 104 : 48 },
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } }
      : { type: 'category', data: labels, axisLabel: { color: '#64748b', interval: 0, rotate: labels.length > 5 ? 25 : 0 } },
    yAxis: horizontal
      ? { type: 'category', data: labels, axisLabel: { color: '#64748b' } }
      : { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    series: [{ type: 'bar', data: values, itemStyle: { color, borderRadius: horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0] }, barMaxWidth: 34 }],
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

function generateReportDraft(showMessage = true) {
  reportText.value = generateReport()
  reportEdited.value = false
  if (showMessage) setMessage('已生成 Markdown 报告草稿。')
}

function refreshReportIfUntouched() {
  if (!reportEdited.value) reportText.value = generateReport()
}

function generateReport() {
  const titleIndustry = target.industry || '某行业'
  const titlePosition = target.position || '某岗位'
  const titleRegion = target.region || '某地区'
  const isTourismReport = /文旅|旅游|会展|景区|研学|文博/.test(`${target.industry}${target.position}`)
  const areaTop = topCounts(samples.value.map((sample) => sample.city), 3).join('、') || titleRegion
  const educationTop = topCounts(samples.value.map((sample) => sample.education), 3).join('、') || '待补充'
  const experienceTop = topCounts(samples.value.map((sample) => sample.experience), 3).join('、') || '待补充'
  const skillText = topSkills.value.map((item, index) => `${index + 1}. ${item.name}（${item.value} 次）`).join('\n') || '暂无技能词频，请继续补充样本。'
  const recordText = experimentRecords.value.slice(0, 5).map((record) => `- ${record.experimentName}：${record.conclusion || '待补充结论'}`).join('\n') || '- 工资决定模拟结果：待补充\n- 失业或技能错配模拟结果：待补充\n- AI 冲击或岗位匹配模拟结果：待补充\n- 公平就业或收入分配讨论：待补充'
  const topSkillNames = topSkills.value.slice(0, 3).map((item) => item.name).join('、') || '岗位核心技能'
  const tourismSentence = isTourismReport
    ? '本报告还应结合游客增长、会展活动、数字文旅、研学旅行、智慧景区和区域人才流动等因素解释岗位需求变化。'
    : '本报告应结合行业周期、技术变化、区域产业结构和岗位技能门槛解释需求变化。'

  return `# ${titleIndustry}/${titlePosition}劳动力市场预测报告

## 一、岗位与行业背景
本报告选择${titleRegion}的${titleIndustry}行业，聚焦${titlePosition}岗位。数据由学生按照统一 CSV 模板手工采集，样本字段包括招聘平台、采集日期、企业、岗位、城市、薪资、学历、经验、技能关键词和证据链接或截图编号。${tourismSentence}

## 二、招聘需求分析
本次共采集招聘样本 ${stats.value.count} 条，其中有效薪资样本 ${stats.value.salaryCount} 条，缺失薪资样本 ${stats.value.missingSalary} 条。主要招聘城市集中在：${areaTop}。学历要求主要包括：${educationTop}；经验要求主要包括：${experienceTop}。

请进一步说明：样本是否集中在少数城市或少数企业类型？该岗位需求是扩张、稳定、收缩，还是结构性调整？

## 三、薪酬水平分析
样本平均薪资为 ${salaryText(stats.value.average)}，中位薪资为 ${salaryText(stats.value.median)}，最高薪资为 ${salaryText(stats.value.max)}，最低薪资为 ${salaryText(stats.value.min)}。请结合薪资区间柱状图判断该岗位主要处于入门型、成长型还是高技能溢价型岗位。

## 四、技能需求分析
高频技能 Top 10：
${skillText}

请解释这些技能之间的结构关系，例如通用办公能力、专业工具能力、数据分析能力、沟通协作能力、行业知识和合规意识。技能关键词目前共识别 ${totalSkillTokens.value} 个。

## 五、LMDT仿真辅助分析
建议进入以下模块完成仿真实验：
${recommendedLinks.value.map((item, index) => `${index + 1}. ${item.title}：${item.reason}`).join('\n')}

已保存的实验记录：
${recordText}

请把工资模拟、失业模拟、AI 冲击模拟、技能错配模拟或公平就业分析结果写入本部分，并说明仿真结果如何支持岗位预测判断。

## 六、未来趋势判断
综合招聘样本、薪酬水平、技能词频和 LMDT 仿真结果，判断该岗位未来更可能是扩张、稳定、收缩，还是结构性调整。请给出至少三条证据：样本证据、统计证据和模型/仿真证据。

## 七、学习与就业建议
建议围绕 ${topSkillNames} 等高频能力制定学习计划。请把建议写成可执行方案，例如课程学习、证书准备、项目训练、实习实践和作品集建设，并说明这些准备如何对应招聘样本中的真实要求。`
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(reportText.value)
    setMessage('Markdown 报告已复制。')
  } catch {
    setMessage('当前浏览器不支持自动复制，可手动选择报告文本复制。')
  }
}

function downloadMarkdown() {
  downloadFile(reportText.value, reportFileName('md'), 'text/markdown;charset=utf-8')
}

function downloadHtml() {
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(target.position || '岗位')}劳动力市场预测报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.8;max-width:920px;margin:40px auto;padding:0 24px;color:#111827}pre{white-space:pre-wrap}</style></head><body><pre>${escapeHtml(reportText.value)}</pre></body></html>`
  downloadFile(html, reportFileName('html'), 'text/html;charset=utf-8')
}

function printPage() {
  window.print()
}

function exportAssignmentPackage() {
  const payload = {
    schema: PACKAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    app: 'LMDT 2.0',
    target: { ...target },
    samples: samples.value,
    experimentRecords: experimentRecords.value,
    reportText: reportText.value,
  }
  downloadFile(JSON.stringify(payload, null, 2), assignmentPackageFileName(), 'application/json;charset=utf-8')
  setMessage('作业数据包已导出。')
}

async function importAssignmentPackage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text())
    if (!payload || payload.schema !== PACKAGE_SCHEMA) {
      throw new Error('schema mismatch')
    }
    Object.assign(target, payload.target || { industry: '', position: '', region: '' })
    samples.value = Array.isArray(payload.samples) ? payload.samples.map((sample) => normalizeSample(sample)) : []
    experimentRecords.value = Array.isArray(payload.experimentRecords) ? payload.experimentRecords : []
    reportText.value = String(payload.reportText || '')
    reportEdited.value = Boolean(reportText.value)
    csvPreview.value = null
    resetDraft()
    localStorage.setItem(RECORD_KEY, JSON.stringify(experimentRecords.value))
    localStorage.setItem(REPORT_KEY, reportText.value)
    setMessage(`已导入作业数据包：${samples.value.length} 条样本，${experimentRecords.value.length} 条实验记录。`)
  } catch {
    setMessage('导入失败。请选择从本工作台导出的 JSON 作业数据包。')
  } finally {
    event.target.value = ''
  }
}

function clearLocalWorkbenchData() {
  const ok = window.confirm('确定清空当前浏览器里的研究对象、招聘样本、实验记录和报告草稿吗？此操作不会影响其他同学的数据。')
  if (!ok) return
  reportEdited.value = true
  localStorage.removeItem(SAMPLE_KEY)
  localStorage.removeItem(TARGET_KEY)
  localStorage.removeItem(RECORD_KEY)
  localStorage.removeItem(REPORT_KEY)
  Object.assign(target, { industry: '', position: '', region: '' })
  samples.value = []
  experimentRecords.value = []
  reportText.value = ''
  csvPreview.value = null
  resetDraft()
  setMessage('当前浏览器的工作台数据已清空。')
}

function downloadFile(content, filename, type) {
  const blob = new Blob([`\uFEFF${content}`], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => {
    const value = String(cell ?? '')
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }).join(',')).join('\n')
}

function reportFileName(ext) {
  return `${target.industry || '行业'}-${target.position || '岗位'}-劳动力市场预测报告.${ext}`
}

function assignmentPackageFileName() {
  const position = target.position || '岗位'
  const stamp = new Date().toISOString().slice(0, 10)
  return `${position}-LMDT作业数据包-${stamp}.json`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
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
  }, 2600)
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
  max-width: 900px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.75;
}
.flow-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.flow-strip span {
  padding: 7px 10px;
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.11);
  border: 1px solid rgba(59, 130, 246, 0.18);
  font-size: 12px;
  font-weight: 800;
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
label.wide {
  grid-column: span 2;
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
.template-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 18px;
}
.template-copy strong {
  color: #f8fafc;
}
.template-copy p,
.recommend-box p,
.issue-box p {
  color: #94a3b8;
  line-height: 1.75;
  margin: 8px 0 0;
}
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}
.field-list span {
  padding: 7px 9px;
  border-radius: 8px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 12px;
  font-weight: 700;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.form-actions.compact {
  margin-top: 14px;
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
.local-note {
  margin: -4px 0 14px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}
.preview-cards,
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.preview-body {
  display: grid;
  grid-template-columns: minmax(260px, 0.55fr) minmax(0, 1fr);
  gap: 16px;
}
.issue-box {
  padding: 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.issue-box strong {
  color: #f8fafc;
}
.issue-box ul {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #fca5a5;
  line-height: 1.7;
  font-size: 13px;
}
.muted {
  color: #64748b !important;
}
.bad-text {
  color: #fca5a5;
}
.table-wrap,
.preview-table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}
.preview-table-wrap table {
  min-width: 680px;
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
  max-width: 220px;
}
.row-actions {
  white-space: nowrap;
}
.row-actions button {
  padding: 6px 8px;
  margin-right: 6px;
}
.stat-card {
  min-width: 0;
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
  font-size: 20px;
  word-break: break-word;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.chart-panel {
  min-width: 0;
}
.wide-chart {
  grid-column: span 2;
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
.recommend-box {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.16);
}
.recommend-box strong {
  color: #e0f2fe;
}
.recommend-box ol {
  margin: 8px 0 0;
  padding-left: 20px;
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 13px;
}
.sim-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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
.data-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}
.data-layout strong {
  display: block;
  color: #f8fafc;
  font-size: 15px;
  margin-bottom: 8px;
}
.data-layout p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}
.data-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.data-summary span {
  padding: 7px 10px;
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.16);
  font-size: 12px;
  font-weight: 800;
}
.data-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}
.danger-btn {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(127, 29, 29, 0.3);
}
.report-textarea {
  min-height: 540px;
  font-family: Consolas, "Microsoft YaHei", monospace;
  line-height: 1.7;
}
@media print {
  .back-link,
  .target-panel,
  .template-panel,
  .preview-panel,
  .sample-form,
  .table-panel,
  .chart-grid,
  .skill-panel,
  .sim-panel,
  .records-panel,
  .data-panel,
  .form-actions,
  .hint {
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
@media (max-width: 1100px) {
  .sample-form,
  .sim-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .preview-cards,
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .target-grid,
  .template-layout,
  .preview-body,
  .chart-grid {
    grid-template-columns: 1fr;
  }
  .wide-chart {
    grid-column: span 1;
  }
  .sample-form,
  .sim-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .data-layout {
    grid-template-columns: 1fr;
  }
  .data-actions {
    justify-content: flex-start;
  }
}
@media (max-width: 640px) {
  .workbench {
    padding: 28px 16px 72px;
  }
  .workbench-header h1 {
    font-size: 27px;
  }
  .sample-form,
  .sim-grid,
  .data-layout,
  .preview-cards,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  label.wide {
    grid-column: span 1;
  }
  .stat-card strong {
    font-size: 18px;
  }
  .report-textarea {
    min-height: 460px;
  }
}
</style>
