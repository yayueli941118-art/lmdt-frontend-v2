<template>
  <div class="lab-runtime-row">
    <RuntimeSourceBadge />
    <span>结果类型：{{ resultType }}</span>
  </div>
  <section class="lab-dashboard">
    <aside class="lab-dashboard-side">
      <slot name="controls"></slot>
      <slot name="task"></slot>
      <slot name="record"></slot>
    </aside>
    <main class="lab-dashboard-main">
      <slot name="metrics"></slot>
      <slot name="primary"></slot>
    </main>
  </section>
  <details class="model-disclosure">
    <summary>模型说明</summary>
    <div class="model-disclosure-grid">
      <div><strong>核心公式</strong><span>{{ formula }}</span></div>
      <div><strong>主要假设</strong><span>{{ assumptions }}</span></div>
      <div><strong>教材来源</strong><span>{{ source }}</span></div>
      <div><strong>适用范围</strong><span>{{ scope }}</span></div>
      <div><strong>变量与单位</strong><span>{{ variables }}</span></div>
      <div><strong>默认参数依据</strong><span>{{ defaultBasis }}</span></div>
      <div><strong>模型版本</strong><span>{{ modelVersion }}</span></div>
      <div><strong>结果来源类型</strong><span>{{ resultType }}</span></div>
    </div>
    <p>不能据此推出：{{ limitation }}</p>
    <slot name="model"></slot>
  </details>
  <section v-if="$slots.secondary" class="lab-dashboard-secondary">
    <slot name="secondary"></slot>
  </section>
</template>

<script setup>
import RuntimeSourceBadge from './RuntimeSourceBadge.vue'

defineProps({
  resultType: { type: String, default: '教材机制模拟' },
  formula: { type: String, default: '由当前页面参数和教学模型计算，详见页面指标及图例。' },
  assumptions: { type: String, default: '其他条件保持不变；参数变化只代表当前实验情景。' },
  source: { type: String, default: '《劳动经济学》对应章节与页面内标注的教学机制。' },
  scope: { type: String, default: '用于课堂比较、机制解释和敏感性分析。' },
  limitation: { type: String, default: '真实地区、行业或个体的精确预测结果。' },
  variables: { type: String, default: '变量名称、当前值与单位显示在参数控件和图表坐标轴中。' },
  defaultBasis: { type: String, default: '用于课堂演示的可解释默认情景，不代表实证估计或地区统计。' },
  modelVersion: { type: String, default: __APP_VERSION__ },
})
</script>

<style scoped>
.lab-runtime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -12px 0 14px;
  color: #64748b;
  font-size: 12px;
}
.lab-dashboard {
  display: grid;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  margin-bottom: 24px;
}
.lab-dashboard-side {
  position: sticky;
  top: 62px;
  display: grid;
  gap: 14px;
  min-width: 0;
}
.lab-dashboard-main {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.lab-dashboard-secondary {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.model-disclosure {
  margin: -6px 0 24px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.5);
}
.model-disclosure summary {
  padding: 12px 14px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.model-disclosure-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 14px 12px;
}
.model-disclosure-grid div {
  min-width: 0;
}
.model-disclosure-grid strong,
.model-disclosure-grid span {
  display: block;
}
.model-disclosure-grid strong {
  margin-bottom: 4px;
  color: #67e8f9;
  font-size: 12px;
}
.model-disclosure-grid span,
.model-disclosure p {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.7;
}
.model-disclosure p {
  margin: 0;
  padding: 0 14px 14px;
}
:deep(.lab-controls) {
  margin-bottom: 0;
}
:deep(.control-band) {
  margin-bottom: 0;
}
:deep(.learning-card) {
  margin-bottom: 0;
}
:deep(.record-panel) {
  margin-bottom: 0;
}
:deep(.chart-card) {
  margin-bottom: 0;
}
:deep(.cards-row) {
  margin-bottom: 0;
}
:deep(.lab-results) {
  min-width: 0;
}
@media (max-width: 1020px) {
  .lab-dashboard {
    grid-template-columns: 1fr;
  }
  .lab-dashboard-side {
    position: static;
  }
}
@media (max-width: 620px) {
  .lab-runtime-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .model-disclosure-grid {
    grid-template-columns: 1fr;
  }
}
</style>
