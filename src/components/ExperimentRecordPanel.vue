<template>
  <section class="record-panel">
    <div class="record-head">
      <div>
        <span class="record-kicker">实验记录</span>
        <h3>{{ experimentName }}</h3>
      </div>
      <div class="record-actions">
        <button type="button" @click="copyRecord">复制实验记录</button>
        <button type="button" class="primary" @click="saveToWorkbench">保存到报告工作台</button>
      </div>
    </div>
    <p class="record-hint">保存后只写入当前浏览器，不会同步到其他同学或小组设备。</p>

    <div class="record-grid">
      <div class="record-block">
        <span>当前参数</span>
        <dl>
          <template v-for="item in parameterItems" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </template>
        </dl>
      </div>
      <div class="record-block">
        <span>核心输出</span>
        <dl>
          <template v-for="item in metricItems" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </template>
        </dl>
      </div>
      <div class="record-block conclusion">
        <span>当前结论</span>
        <p>{{ conclusion || '调整参数后，系统会生成可复制的实验结论。' }}</p>
      </div>
    </div>

    <details class="evidence-workflow">
      <summary>完成“预测—反事实—解释”实验单</summary>
      <div class="workflow-steps" aria-label="实验步骤">
        <span>1 预测</span>
        <span>2 理由</span>
        <span>3 基准</span>
        <span>4 反事实</span>
        <span>5 解释</span>
        <span>6 规则反馈</span>
        <span>7 修改</span>
      </div>

      <div class="evidence-fields">
        <label>
          <span>初始预测</span>
          <textarea v-model.trim="initialPrediction" rows="2" placeholder="调参前，你预计哪个指标会怎样变化？"></textarea>
        </label>
        <label>
          <span>初始理由</span>
          <textarea v-model.trim="initialReason" rows="2" placeholder="写出你的机制判断或公式依据。"></textarea>
        </label>
      </div>

      <div class="snapshot-row">
        <button type="button" @click="captureBaseline">记录基准结果</button>
        <span>{{ baselineSnapshot ? snapshotSummary(baselineSnapshot) : '尚未记录基准结果' }}</span>
        <button type="button" @click="captureCounterfactual">记录反事实结果</button>
        <span>{{ counterfactualSnapshot ? snapshotSummary(counterfactualSnapshot) : '调整参数后再记录反事实结果' }}</span>
      </div>

      <label class="full-field">
        <span>学生解释</span>
        <textarea v-model.trim="studentExplanation" rows="3" placeholder="比较基准与反事实，引用至少一个指标，并解释变化机制。"></textarea>
      </label>

      <div class="rubric-feedback" aria-live="polite">
        <strong>规则反馈：{{ rubricFeedback.score }}/4</strong>
        <span v-for="item in rubricFeedback.items" :key="item.label" :class="{ passed: item.passed }">
          {{ item.passed ? '已满足' : '待补充' }}：{{ item.label }}
        </span>
        <small>本反馈由公开规则生成，不是AI评价，也不判断观点对错。</small>
      </div>

      <label class="full-field">
        <span>修改后的解释</span>
        <textarea v-model.trim="revisedExplanation" rows="3" placeholder="根据规则反馈补充证据、比较和机制链条。"></textarea>
      </label>
    </details>

    <p v-if="message" class="record-message">{{ message }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DOMAIN_MODEL_FAMILY_VERSION, RECORD_SCHEMA_VERSION } from '../config/release'
import { readJsonStorage, writeJsonStorage } from '../lib/storage'

const STORAGE_KEY = 'lmdtReportExperimentRecords'

const props = defineProps({
  experimentName: { type: String, required: true },
  parameters: { type: Object, default: () => ({}) },
  metrics: { type: Object, default: () => ({}) },
  conclusion: { type: String, default: '' },
  modelVersion: { type: String, default: DOMAIN_MODEL_FAMILY_VERSION },
  sourceType: { type: String, default: '教材机制模拟' },
})

const message = ref('')
const initialPrediction = ref('')
const initialReason = ref('')
const baselineSnapshot = ref(null)
const counterfactualSnapshot = ref(null)
const studentExplanation = ref('')
const revisedExplanation = ref('')

const parameterItems = computed(() => toItems(props.parameters))
const metricItems = computed(() => toItems(props.metrics))
const rubricFeedback = computed(() => {
  const explanation = studentExplanation.value
  const items = [
    { label: '已记录基准与反事实结果', passed: Boolean(baselineSnapshot.value && counterfactualSnapshot.value) },
    { label: '解释中引用了数字或指标', passed: /\d|%|元|指数|率/.test(explanation) },
    { label: '解释中写出了变化机制', passed: /因为|因此|导致|影响|提高|降低|替代|收入效应|匹配|成本/.test(explanation) },
    { label: '解释达到40字以上', passed: explanation.length >= 40 },
  ]
  return {
    score: items.filter(item => item.passed).length,
    items,
    text: items.map(item => `${item.passed ? '已满足' : '待补充'}：${item.label}`).join('；'),
  }
})

function toItems(source) {
  return Object.entries(source || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: String(value) }))
}

function recordText() {
  const lines = [
    `实验名称：${props.experimentName}`,
    '',
    '当前参数：',
    ...parameterItems.value.map((item) => `- ${item.label}：${item.value}`),
    '',
    '核心输出：',
    ...metricItems.value.map((item) => `- ${item.label}：${item.value}`),
    '',
    `当前结论：${props.conclusion || '暂无结论'}`,
    '',
    `初始预测：${initialPrediction.value || '未填写'}`,
    `初始理由：${initialReason.value || '未填写'}`,
    `基准结果：${baselineSnapshot.value ? snapshotSummary(baselineSnapshot.value) : '未记录'}`,
    `反事实结果：${counterfactualSnapshot.value ? snapshotSummary(counterfactualSnapshot.value) : '未记录'}`,
    `学生解释：${studentExplanation.value || '未填写'}`,
    `规则反馈：${rubricFeedback.value.score}/4；${rubricFeedback.value.text}`,
    `修改后的解释：${revisedExplanation.value || '未填写'}`,
    `模型版本：${props.modelVersion}`,
    `数据来源类型：${props.sourceType}`,
  ]
  return lines.join('\n')
}

async function copyRecord() {
  const text = recordText()
  try {
    await navigator.clipboard.writeText(text)
    setMessage('实验记录已复制。')
  } catch {
    setMessage('当前浏览器不支持自动复制，可手动选择页面内容复制。')
  }
}

function saveToWorkbench() {
  const records = readRecords()
  const createdAt = new Date().toISOString()
  records.unshift({
    id: `exp-${Date.now()}`,
    experimentName: props.experimentName,
    parameters: Object.fromEntries(parameterItems.value.map((item) => [item.label, item.value])),
    metrics: Object.fromEntries(metricItems.value.map((item) => [item.label, item.value])),
    conclusion: props.conclusion,
    initialPrediction: initialPrediction.value,
    initialReason: initialReason.value,
    baselineResult: baselineSnapshot.value,
    counterfactualResult: counterfactualSnapshot.value,
    studentExplanation: studentExplanation.value,
    ruleFeedback: rubricFeedback.value,
    revisedExplanation: revisedExplanation.value,
    modelVersion: props.modelVersion,
    dataSourceType: props.sourceType,
    createdAt,
    timestamp: createdAt,
  })
  const outcome = writeJsonStorage(STORAGE_KEY, records.slice(0, 30), { version: RECORD_SCHEMA_VERSION })
  setMessage(outcome.ok ? '已保存到当前浏览器的报告工作台。' : outcome.message)
}

function captureBaseline() {
  baselineSnapshot.value = snapshot()
  setMessage('已记录基准参数与结果，请调整参数后记录反事实。')
}

function captureCounterfactual() {
  counterfactualSnapshot.value = snapshot()
  setMessage('已记录反事实参数与结果。')
}

function snapshot() {
  return {
    parameters: Object.fromEntries(parameterItems.value.map(item => [item.label, item.value])),
    metrics: Object.fromEntries(metricItems.value.map(item => [item.label, item.value])),
    conclusion: props.conclusion,
    capturedAt: new Date().toISOString(),
  }
}

function snapshotSummary(value) {
  const metrics = Object.entries(value?.metrics || {}).slice(0, 2)
  return metrics.length
    ? metrics.map(([label, item]) => `${label}=${item}`).join('；')
    : '已记录当前参数与结果'
}

function readRecords() {
  const parsed = readJsonStorage(STORAGE_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

function setMessage(text) {
  message.value = text
  window.clearTimeout(setMessage.timer)
  setMessage.timer = window.setTimeout(() => {
    message.value = ''
  }, 2200)
}
</script>

<style scoped>
.record-panel {
  margin: 0 0 24px;
  padding: 18px;
  border: 1px solid rgba(6, 182, 212, 0.18);
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.07);
}
.record-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.record-kicker {
  display: block;
  margin-bottom: 5px;
  color: #22d3ee;
  font-size: 12px;
  font-weight: 800;
}
.record-head h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 17px;
}
.record-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.record-actions button {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  padding: 9px 12px;
  color: #dbeafe;
  background: rgba(15, 23, 42, 0.72);
  cursor: pointer;
  font-weight: 700;
}
.record-actions button.primary {
  color: #fff;
  background: linear-gradient(135deg, #06b6d4, #2563eb);
  border-color: transparent;
}
.record-hint {
  margin: -4px 0 14px;
  color: #93c5fd;
  font-size: 12px;
  line-height: 1.6;
}
.record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
}
.record-block {
  min-width: 0;
  padding: 14px;
  border-left: 1px solid rgba(148, 163, 184, 0.14);
}
.record-block > span {
  display: block;
  margin-bottom: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}
.record-block dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(72px, 0.8fr) minmax(0, 1fr);
  column-gap: 10px;
  row-gap: 4px;
}
.record-block dt {
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}
.record-block dd {
  min-width: 0;
  margin: 0;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.8;
  word-break: break-word;
}
.record-block.conclusion p {
  margin: 0;
  color: #e0f2fe;
  font-size: 13px;
  line-height: 1.7;
}
.record-message {
  margin: 12px 0 0;
  color: #67e8f9;
  font-size: 13px;
}
.evidence-workflow {
  margin-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}
.evidence-workflow summary {
  padding: 14px 0 4px;
  color: #e0f2fe;
  font-weight: 800;
  cursor: pointer;
}
.workflow-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}
.workflow-steps span {
  padding: 5px 8px;
  border-radius: 5px;
  color: #a5f3fc;
  background: rgba(6, 182, 212, 0.12);
  font-size: 12px;
  font-weight: 750;
}
.evidence-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.evidence-fields label,
.full-field {
  display: block;
}
.evidence-fields label > span,
.full-field > span {
  display: block;
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}
.evidence-fields textarea,
.full-field textarea {
  box-sizing: border-box;
  width: 100%;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 6px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.72);
  font: inherit;
  line-height: 1.6;
}
.snapshot-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  margin: 12px 0;
}
.snapshot-row button {
  padding: 8px 10px;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 6px;
  color: #cffafe;
  background: rgba(8, 145, 178, 0.14);
  cursor: pointer;
}
.snapshot-row span {
  min-width: 0;
  color: #94a3b8;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.rubric-feedback {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin: 12px 0;
  padding: 12px;
  border-left: 3px solid #f59e0b;
  background: rgba(245, 158, 11, 0.07);
}
.rubric-feedback strong,
.rubric-feedback small {
  grid-column: 1 / -1;
}
.rubric-feedback strong { color: #fde68a; }
.rubric-feedback span { color: #fca5a5; font-size: 12px; }
.rubric-feedback span.passed { color: #86efac; }
.rubric-feedback small { color: #94a3b8; line-height: 1.5; }
button:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 3px solid #67e8f9;
  outline-offset: 2px;
}
@media (max-width: 820px) {
  .record-head {
    display: block;
  }
  .record-actions {
    justify-content: flex-start;
    margin-top: 12px;
  }
  .record-grid {
    grid-template-columns: 1fr;
  }
  .evidence-fields,
  .rubric-feedback {
    grid-template-columns: 1fr;
  }
  .rubric-feedback strong,
  .rubric-feedback small {
    grid-column: auto;
  }
  .snapshot-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}
@media (max-width: 460px) {
  .record-block dl {
    grid-template-columns: 1fr;
  }
  .record-block dt {
    margin-top: 4px;
  }
}
</style>
