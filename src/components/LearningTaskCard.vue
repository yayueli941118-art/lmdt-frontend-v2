<template>
  <section class="learning-card">
    <div class="learning-flow" aria-label="学生实验六步流程">
      <span v-for="(item, index) in structuredSteps" :key="item.label">
        {{ index + 1 }}. {{ item.label }}<i v-if="index < structuredSteps.length - 1">→</i>
      </span>
    </div>
    <div v-if="hasStructuredTask" class="step-grid">
      <div v-for="(item, index) in structuredSteps" :key="item.label" class="learning-block">
        <span class="learning-label">{{ index + 1 }} · {{ item.label }}</span>
        <strong>{{ item.text }}</strong>
      </div>
    </div>
    <div v-else class="learning-block">
      <span class="learning-label">学习任务</span>
      <strong>{{ task }}</strong>
    </div>
    <div v-if="!hasStructuredTask" class="learning-block">
      <span class="learning-label">观察重点</span>
      <strong>{{ observe }}</strong>
    </div>
    <div class="learning-block conclusion">
      <span class="learning-label">当前结论</span>
      <strong>{{ conclusion || '调整参数后，系统会自动生成实验结论。' }}</strong>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: { type: String, default: '' },
  observe: { type: String, default: '' },
  conclusion: { type: String, default: '' },
  prediction: { type: String, default: '' },
  adjustment: { type: String, default: '' },
  chart: { type: String, default: '' },
  records: { type: String, default: '' },
  explanation: { type: String, default: '' },
  submission: { type: String, default: '' },
})

const structuredSteps = computed(() => [
  { label: '先预测', text: props.prediction },
  { label: '调一个参数', text: props.adjustment },
  { label: '看主图', text: props.chart },
  { label: '记两项证据', text: props.records },
  { label: '解释机制', text: props.explanation },
  { label: '保存并提交', text: props.submission },
].filter(item => item.text))
const hasStructuredTask = computed(() => structuredSteps.value.length > 0)
</script>

<style scoped>
.learning-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  margin: 0 0 24px;
}
.learning-flow {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}
.learning-flow span { color: #93c5fd; }
.learning-flow i { margin-left:7px;font-style: normal; color: #475569; }
.step-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.learning-block {
  min-width: 0;
  border-radius: 8px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.12);
}
.learning-block.conclusion {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.18);
}
.learning-label {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}
.learning-block strong {
  display: block;
  color: #dbeafe;
  font-size: 14px;
  line-height: 1.75;
  font-weight: 700;
  word-break: normal;
  overflow-wrap: anywhere;
}
.learning-block.conclusion strong {
  color: #e0f2fe;
}
@media (max-width: 900px) {
  .learning-card {
    grid-template-columns: 1fr;
  }
  .step-grid{grid-template-columns:1fr}
}
</style>
