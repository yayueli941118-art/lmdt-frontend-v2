<template>
  <section class="learning-card">
    <div class="learning-block">
      <span class="learning-label">学习任务</span>
      <strong>{{ task }}</strong>
    </div>
    <div class="learning-block">
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
defineProps({
  task: { type: String, required: true },
  observe: { type: String, required: true },
  conclusion: { type: String, default: '' },
})
</script>

<style scoped>
.learning-card {
  display: grid;
  grid-template-columns: 1fr 1fr 1.35fr;
  gap: 12px;
  margin: 0 0 24px;
}
.learning-block {
  min-width: 0;
  border-radius: 12px;
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
  line-height: 1.65;
  font-weight: 700;
}
.learning-block.conclusion strong {
  color: #e0f2fe;
}
@media (max-width: 900px) {
  .learning-card {
    grid-template-columns: 1fr;
  }
}
</style>
