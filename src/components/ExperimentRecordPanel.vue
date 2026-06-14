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

    <p v-if="message" class="record-message">{{ message }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const STORAGE_KEY = 'lmdtReportExperimentRecords'

const props = defineProps({
  experimentName: { type: String, required: true },
  parameters: { type: Object, default: () => ({}) },
  metrics: { type: Object, default: () => ({}) },
  conclusion: { type: String, default: '' },
})

const message = ref('')

const parameterItems = computed(() => toItems(props.parameters))
const metricItems = computed(() => toItems(props.metrics))

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
  records.unshift({
    id: `exp-${Date.now()}`,
    experimentName: props.experimentName,
    parameters: Object.fromEntries(parameterItems.value.map((item) => [item.label, item.value])),
    metrics: Object.fromEntries(metricItems.value.map((item) => [item.label, item.value])),
    conclusion: props.conclusion,
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 30)))
  setMessage('已保存到报告工作台。')
}

function readRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
  border-radius: 16px;
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
  border-radius: 10px;
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
.record-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 12px;
}
.record-block {
  min-width: 0;
  padding: 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.54);
  border: 1px solid rgba(148, 163, 184, 0.1);
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
}
.record-block dt {
  float: left;
  clear: left;
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}
.record-block dd {
  margin: 0 0 0 84px;
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
}
</style>
