<template>
  <section
    class="audit-result"
    :class="`audit-result--${tone}`"
    :data-testid="`${phase}-audit-report`"
    :data-status="report.status"
    aria-live="polite"
  >
    <header class="result-head">
      <div>
        <span>{{ phase === 'v1' ? 'V1 客观核验' : 'V2 完成度核验' }}</span>
        <h2>{{ statusCopy.title }}</h2>
        <p>{{ statusCopy.description }}</p>
      </div>
      <strong class="status-code">{{ report.status }}</strong>
    </header>

    <dl class="result-summary" aria-label="审计问题统计">
      <div><dt>阻断</dt><dd>{{ report.summary.blockers }}</dd></div>
      <div><dt>错误</dt><dd>{{ report.summary.errors }}</dd></div>
      <div><dt>提醒</dt><dd>{{ report.summary.warnings }}</dd></div>
      <div><dt>文件</dt><dd class="file-name">{{ fileName }}</dd></div>
    </dl>

    <ol v-if="report.findings.length" class="finding-list">
      <li v-for="(finding, index) in report.findings" :key="`${finding.code}-${finding.target}-${index}`">
        <div class="finding-meta">
          <span :class="`severity severity--${finding.severity.toLowerCase()}`">{{ finding.severity }}</span>
          <code>{{ finding.code }}</code>
          <strong v-if="finding.target">{{ finding.target }}</strong>
        </div>
        <p>{{ finding.message }}</p>
        <small><b>下一步：</b>{{ finding.nextStep }}</small>
      </li>
    </ol>

    <div v-else class="pass-message">
      <strong>{{ phase === 'v1' ? '客观规则已经通过' : '已具备提交学习审计的结构条件' }}</strong>
      <p>{{ phase === 'v1' ? '现在可以审计外部AI并形成V2。' : '解释质量、AI判断质量和领导汇报仍由学生负责、教师抽审。' }}</p>
    </div>

    <footer>
      系统只显示人物ID、反馈码和修订路径，不直接公布该人物的正确分类。
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  report: { type: Object, required: true },
  phase: { type: String, required: true },
  fileName: { type: String, default: '' },
})

const statusMap = Object.freeze({
  REJECTED: { title: '文件被拒绝', description: '先修复版本、身份或人物集合，再进入内容核验。', tone: 'blocked' },
  NEED_INFO: { title: '需要补齐信息', description: '系统不会根据身份猜测，请补齐事实或必填项。', tone: 'blocked' },
  V1_NEEDS_REVISION: { title: '需要修订', description: '客观分类、规则或指标中仍有可定位的问题。', tone: 'warning' },
  OBJECTIVE_PASS: { title: '客观核验通过', description: 'V1已通过规则层检查，可以进入AI审计与V2。', tone: 'success' },
  AUDIT_READY: { title: '学习审计材料就绪', description: '客观结果和V1—V2证据链完整，等待提交与教师抽审。', tone: 'success' },
  TEACHER_REVIEW: { title: '进入教师复核', description: '客观结果可能正确，但解释、AI审计或报告边界仍需人工判断。', tone: 'review' },
})

const statusCopy = computed(() => statusMap[props.report.status] || statusMap.TEACHER_REVIEW)
const tone = computed(() => statusCopy.value.tone)
</script>

<style scoped>
.audit-result{display:grid;gap:20px;padding:24px;border:1px solid #334155;border-top:4px solid #64748b;border-radius:8px;background:#111b2e}.audit-result--blocked{border-top-color:#ef4444}.audit-result--warning{border-top-color:#f59e0b}.audit-result--success{border-top-color:#22c55e}.audit-result--review{border-top-color:#38bdf8}.result-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.result-head span{color:#93c5fd;font-size:12px;font-weight:850}.result-head h2{margin:6px 0 0;color:#f8fafc;font-size:24px}.result-head p{max-width:720px;margin:8px 0 0;color:#b8c5d5;line-height:1.6}.status-code{padding:8px 10px;border:1px solid #475569;border-radius:5px;color:#e2e8f0;background:#0f172a;font:750 12px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap}.result-summary{display:grid;grid-template-columns:repeat(3,minmax(90px,130px)) minmax(220px,1fr);margin:0;border:1px solid #263449;background:#0c1524}.result-summary div{min-width:0;padding:12px 14px;border-right:1px solid #263449}.result-summary div:last-child{border-right:0}.result-summary dt{color:#8392a6;font-size:12px}.result-summary dd{margin:5px 0 0;color:#f8fafc;font-size:20px;font-weight:850}.result-summary .file-name{overflow:hidden;text-overflow:ellipsis;font-size:13px;white-space:nowrap}.finding-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.finding-list li{display:grid;gap:8px;padding:14px 16px;border-left:3px solid #f59e0b;background:#0d1728}.finding-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.finding-meta code{color:#bfdbfe;font-size:12px}.finding-meta strong{color:#f8fafc;font-size:13px}.severity{padding:3px 6px;border-radius:3px;color:#fff;font-size:10px;font-weight:900}.severity--blocker{background:#b91c1c}.severity--error{background:#c2410c}.severity--warn{color:#1c1917;background:#fbbf24}.finding-list p{margin:0;color:#e2e8f0;line-height:1.55}.finding-list small{color:#9fb0c4;line-height:1.5}.finding-list b{color:#dbeafe}.pass-message{padding:16px;border-left:3px solid #22c55e;background:rgba(20,83,45,.2)}.pass-message strong{color:#bbf7d0}.pass-message p{margin:6px 0 0;color:#cbd5e1;line-height:1.55}.audit-result footer{padding-top:14px;border-top:1px solid #263449;color:#94a3b8;font-size:12px;line-height:1.5}
@media(max-width:720px){.audit-result{padding:18px}.result-head{display:grid}.status-code{justify-self:start}.result-summary{grid-template-columns:repeat(3,1fr)}.result-summary div:nth-child(3){border-right:0}.result-summary div:last-child{grid-column:1/-1;border-top:1px solid #263449}.result-summary .file-name{white-space:normal;overflow-wrap:anywhere}}
</style>
