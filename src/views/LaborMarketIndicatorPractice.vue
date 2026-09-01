<template>
  <div class="practice-workbench">
    <header class="practice-header">
      <div class="header-nav">
        <router-link to="/">← 返回首页</router-link>
        <router-link to="/report/workbench">岗位市场项目工作台</router-link>
      </div>
      <div class="header-layout">
        <div>
          <span class="page-kicker">L02 · 实践一 · 90分钟</span>
          <h1>劳动力市场指标诊断</h1>
          <p>先独立完成V1，再接受{{ systemLabel }}客观核验；外部AI只能在V1之后使用，最终由你形成并负责V2。</p>
        </div>
        <div class="version-box" aria-label="当前文件版本">
          <span>模板 {{ L02_VERSIONS.template }}</span>
          <span>数据 {{ L02_VERSIONS.dataset }}</span>
          <span>规则 {{ L02_VERSIONS.rules }}</span>
        </div>
      </div>
    </header>

    <main>
      <section class="workflow-strip" aria-labelledby="workflow-title">
        <div class="section-copy">
          <span>学习证据链</span>
          <h2 id="workflow-title">V1 → {{ systemLabel }} → AI审计 → V2</h2>
        </div>
        <ol>
          <li v-for="step in progressSteps" :key="step.id" :class="{ complete: step.complete, active: step.active }">
            <span>{{ step.id }}</span><div><strong>{{ step.title }}</strong><small>{{ step.state }}</small></div>
          </li>
        </ol>
      </section>

      <section class="entry-grid" aria-label="实践文件入口">
        <article class="entry-panel entry-panel--download">
          <span class="panel-index">准备</span>
          <h2>从正式模板开始</h2>
          <p>不要改人物数据、人物ID或工作表名称。先在Excel中完成V1并保存，再回到这里上传。</p>
          <a class="primary-action" :href="templateUrl" download>下载学生Excel模板</a>
          <small>文件只在当前浏览器中解析，不上传到外部AI。</small>
        </article>

        <article class="entry-panel">
          <span class="panel-index">01</span>
          <h2>上传并核验V1</h2>
          <p>系统检查文件版本、36人人物集合、E/U/N分类、命中规则、Excel公式与三项指标。</p>
          <label class="upload-action" :class="{ loading: v1Loading }">
            {{ v1Loading ? '正在解析…' : v1FileName ? '重新上传V1' : '选择V1 Excel' }}
            <input data-testid="v1-upload" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :disabled="v1Loading" @change="handleUpload($event, 'v1')">
          </label>
          <small>{{ v1FileName || '支持正式实践一 .xlsx 文件' }}</small>
        </article>

        <article class="entry-panel" :class="{ muted: !v1ReadyForV2 }">
          <span class="panel-index">02</span>
          <h2>审计AI并上传V2</h2>
          <p>在Excel中保留AI原回答，逐条决定接受、修改或拒绝，再完成V2、图表和领导汇报。</p>
          <label class="upload-action" :class="{ disabled: !v1ReadyForV2, loading: v2Loading }">
            {{ v2Loading ? '正在解析…' : v2FileName ? '重新上传V2' : '选择V2 Excel' }}
            <input data-testid="v2-upload" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :disabled="!v1ReadyForV2 || v2Loading" @change="handleUpload($event, 'v2')">
          </label>
          <small>{{ v1ReadyForV2 ? (v2FileName || 'V2仍使用同一模板，不覆盖V1') : 'V1需完成客观核验或进入修订状态后，才能上传V2' }}</small>
        </article>
      </section>

      <L02AuditReport v-if="v1Report" :report="v1Report" phase="v1" :file-name="v1FileName" />

      <section class="ai-boundary" aria-labelledby="ai-title">
        <div>
          <span>AI使用边界</span>
          <h2 id="ai-title">允许使用自己合适的AI，但系统不替你完成判断</h2>
        </div>
        <ul>
          <li>必须先保留独立V1，不能把AI答案反填成“独立判断”。</li>
          <li>{{ systemLabel }}只做规则化客观核验，不调用外部大模型。</li>
          <li>V2要留下AI原回答、你的接受/修改/拒绝判断及证据。</li>
          <li>解释、因果、政策建议和领导汇报质量仍由学生负责、教师抽审。</li>
        </ul>
      </section>

      <L02AuditReport v-if="v2Report" :report="v2Report" phase="v2" :file-name="v2FileName" />

      <section v-if="v1Report || v2Report" class="session-actions" aria-label="本次核验操作">
        <div><strong>本次浏览器会话</strong><span>可导出反馈码留作报告证据；系统不会导出正确答案。</span></div>
        <div>
          <button type="button" :disabled="!v1Report" @click="exportAuditLog">导出核验记录</button>
          <button class="danger-button" type="button" @click="clearSession">清空本次记录</button>
        </div>
      </section>

      <section class="judgment-boundary">
        <strong>机器可判</strong><span>文件、版本、人物ID、必填、逐人分类、规则、公式、人数、三项指标和V1—V2证据完整度。</span>
        <strong>教师复核</strong><span>解释是否有证据、AI判断质量、单期数据边界、图表表达与领导汇报质量。</span>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import L02AuditReport from '../components/L02AuditReport.vue'
import { appProfile } from '../config/appMode'
import { auditPracticeSubmission, L02_VERSIONS } from '../domain/l02Practice/audit'
import { parsePracticeWorkbook } from '../domain/l02Practice/workbookAdapter'

const templateFileName = '实践一_劳动力市场指标诊断_学生Excel模板_V1.0.xlsx'
const templateUrl = `${import.meta.env.BASE_URL}templates/${templateFileName}`
const systemLabel = appProfile.auditSystemLabel
const v1Report = ref(null)
const v2Report = ref(null)
const v1Submission = ref(null)
const v2Submission = ref(null)
const v1FileName = ref('')
const v2FileName = ref('')
const v1Loading = ref(false)
const v2Loading = ref(false)
const v1ReadyForV2 = computed(() => ['V1_NEEDS_REVISION', 'OBJECTIVE_PASS'].includes(v1Report.value?.status))

const progressSteps = computed(() => [
  { id: '01', title: '独立V1', complete: Boolean(v1Report.value), active: !v1Report.value, state: v1Report.value ? '已上传' : '先在Excel完成' },
  { id: '02', title: `${systemLabel}核验`, complete: ['OBJECTIVE_PASS', 'V1_NEEDS_REVISION'].includes(v1Report.value?.status), active: Boolean(v1Report.value) && !v1ReadyForV2.value, state: v1Report.value?.status || '等待V1' },
  { id: '03', title: 'AI审计', complete: Boolean(v2Submission.value?.aiAudit), active: v1ReadyForV2.value && !v2Report.value, state: v2Submission.value?.aiAudit ? '已读取留痕' : '在Excel中完成' },
  { id: '04', title: '形成V2', complete: Boolean(v2Report.value), active: Boolean(v2Report.value), state: v2Report.value?.status || '等待V2' },
])

function parseFailure(phase, error) {
  return {
    phase,
    status: 'REJECTED',
    findings: [{
      code: 'FILE_VERSION_ERROR',
      level: '文件',
      severity: 'BLOCKER',
      message: `无法解析该Excel：${error instanceof Error ? error.message : '文件格式异常'}`,
      nextStep: '重新下载正式模板，用Excel或WPS另存为 .xlsx 后再上传。',
    }],
    summary: { blockers: 1, errors: 0, warnings: 0 },
  }
}

async function handleUpload(event, phase) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  const isV1 = phase === 'v1'
  const loading = isV1 ? v1Loading : v2Loading
  loading.value = true
  try {
    const submission = await parsePracticeWorkbook(await file.arrayBuffer(), { phase })
    const report = auditPracticeSubmission(submission, { phase })
    if (isV1) {
      v1Submission.value = submission
      v1Report.value = report
      v1FileName.value = file.name
      v2Submission.value = null
      v2Report.value = null
      v2FileName.value = ''
    } else {
      v2Submission.value = submission
      v2Report.value = report
      v2FileName.value = file.name
    }
  } catch (error) {
    if (isV1) {
      v1Submission.value = null
      v1Report.value = parseFailure(phase, error)
      v1FileName.value = file.name
    } else {
      v2Submission.value = null
      v2Report.value = parseFailure(phase, error)
      v2FileName.value = file.name
    }
  } finally {
    loading.value = false
    input.value = ''
  }
}

function exportAuditLog() {
  const payload = {
    schema: 'lmdt-l02-audit-log-v1',
    generatedAt: new Date().toISOString(),
    versions: L02_VERSIONS,
    student: v2Submission.value?.student || v1Submission.value?.student || {},
    v1: v1Report.value ? { fileName: v1FileName.value, ...v1Report.value } : null,
    v2: v2Report.value ? { fileName: v2FileName.value, ...v2Report.value } : null,
    boundary: '本记录不包含正确答案；解释质量、AI判断与领导汇报仍需教师复核。',
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `实践一_${systemLabel}核验记录.json`
  link.click()
  URL.revokeObjectURL(url)
}

function clearSession() {
  if (!window.confirm('确定清空本次V1/V2核验记录吗？Excel原文件不会被删除。')) return
  v1Report.value = null
  v2Report.value = null
  v1Submission.value = null
  v2Submission.value = null
  v1FileName.value = ''
  v2FileName.value = ''
}
</script>

<style scoped>
.practice-workbench{min-height:100vh;color:#e5edf7;background:#0b1220}.practice-header{padding:24px max(28px,calc((100vw - 1180px)/2)) 38px;border-bottom:1px solid #263449;background:#08111f}.header-nav{display:flex;justify-content:space-between;gap:16px}.header-nav a{color:#9fb0c4;text-decoration:none;font-size:13px}.header-nav a:hover,.header-nav a:focus-visible{color:#67e8f9}.header-layout{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:48px;align-items:end;margin-top:54px}.page-kicker{color:#67e8f9;font-size:12px;font-weight:900}.practice-header h1{margin:8px 0 0;color:#fff;font-size:clamp(36px,5vw,64px);line-height:1.08}.practice-header p{max-width:760px;margin:18px 0 0;color:#b6c5d5;font-size:17px;line-height:1.7}.version-box{display:grid;gap:8px;min-width:250px;padding-left:18px;border-left:2px solid #2f67d8;color:#a8b8cb;font:700 11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}main{display:grid;gap:28px;max-width:1180px;margin:auto;padding:34px 28px 72px}.workflow-strip{display:grid;grid-template-columns:250px 1fr;gap:28px;align-items:end}.section-copy>span,.ai-boundary>div>span{color:#67e8f9;font-size:11px;font-weight:850}.section-copy h2,.ai-boundary h2{margin:5px 0 0;font-size:22px}.workflow-strip .section-copy h2{font-size:20px;white-space:nowrap}.workflow-strip ol{display:grid;grid-template-columns:repeat(4,1fr);margin:0;padding:0;border:1px solid #263449;list-style:none}.workflow-strip li{display:grid;grid-template-columns:32px 1fr;gap:10px;min-height:76px;padding:14px;border-right:1px solid #263449;background:#0f1828}.workflow-strip li:last-child{border-right:0}.workflow-strip li>span{color:#52647a;font-size:11px;font-weight:900}.workflow-strip li div{display:grid;gap:5px}.workflow-strip strong{font-size:13px}.workflow-strip small{overflow:hidden;color:#8798ad;font:700 10px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.workflow-strip li.complete{background:rgba(20,83,45,.18)}.workflow-strip li.complete>span{color:#4ade80}.workflow-strip li.active{box-shadow:inset 0 -3px #38bdf8}.entry-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.entry-panel{display:grid;align-content:start;gap:12px;min-height:280px;padding:22px;border:1px solid #2a394e;border-radius:8px;background:#111b2e}.entry-panel--download{border-color:rgba(34,211,238,.3);background:#102033}.entry-panel.muted{opacity:.72}.panel-index{color:#67e8f9;font-size:11px;font-weight:900}.entry-panel h2{margin:0;font-size:20px}.entry-panel p{margin:0;color:#aebed0;line-height:1.6}.entry-panel small{color:#8293a8;line-height:1.45}.primary-action,.upload-action{position:relative;min-height:46px;display:inline-flex;align-items:center;justify-content:center;margin-top:auto;padding:0 16px;border:1px solid #38bdf8;border-radius:6px;color:#f8fafc;background:#0e7490;text-decoration:none;font-size:14px;font-weight:850;cursor:pointer}.primary-action:hover,.upload-action:hover{background:#0b879d}.primary-action:focus-visible,.upload-action:focus-within,.session-actions button:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}.upload-action input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}.upload-action.disabled,.upload-action.loading{border-color:#475569;color:#94a3b8;background:#1e293b;cursor:not-allowed}.ai-boundary{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(0,1.2fr);gap:34px;padding:24px;border-left:4px solid #c6a15b;background:#121b2c}.ai-boundary ul{display:grid;gap:9px;margin:0;padding-left:20px;color:#c1cede;line-height:1.55}.session-actions{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:20px;border:1px solid #263449;background:#0f1828}.session-actions>div:first-child{display:grid;gap:5px}.session-actions span{color:#91a3b8;font-size:12px}.session-actions>div:last-child{display:flex;gap:8px}.session-actions button{min-height:44px;padding:0 14px;border:1px solid #2563eb;border-radius:6px;color:#fff;background:#1d4ed8;font-weight:800;cursor:pointer}.session-actions button:disabled{opacity:.45;cursor:not-allowed}.session-actions .danger-button{border-color:#7f1d1d;color:#fecaca;background:#3f151a}.judgment-boundary{display:grid;grid-template-columns:110px 1fr;gap:10px 18px;padding:20px;border-top:1px solid #334155;color:#a8b8cb;line-height:1.55}.judgment-boundary strong{color:#f8fafc}
@media(max-width:900px){.header-layout,.workflow-strip,.ai-boundary{grid-template-columns:1fr}.header-layout{gap:24px;margin-top:38px}.version-box{padding:14px 0 0;border-top:2px solid #2f67d8;border-left:0}.workflow-strip .section-copy h2{white-space:normal}.workflow-strip ol{grid-template-columns:repeat(2,1fr)}.workflow-strip li:nth-child(2){border-right:0}.workflow-strip li:nth-child(-n+2){border-bottom:1px solid #263449}.entry-grid{grid-template-columns:1fr}.entry-panel{min-height:0}.session-actions{align-items:flex-start;flex-direction:column}}
@media(max-width:560px){.practice-header{padding:18px 18px 30px}.header-nav{align-items:flex-start;flex-direction:column}.practice-header p{font-size:15px}main{padding:24px 16px 54px}.workflow-strip ol{grid-template-columns:1fr}.workflow-strip li{border-right:0;border-bottom:1px solid #263449}.workflow-strip li:last-child{border-bottom:0}.session-actions>div:last-child{width:100%;flex-direction:column}.session-actions button{width:100%}.judgment-boundary{grid-template-columns:1fr}.entry-panel{padding:18px}}
</style>
