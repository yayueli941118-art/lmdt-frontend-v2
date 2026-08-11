<template>
  <section
    ref="workspace"
    class="experiment-workspace"
    :class="{ 'is-changing': isChanging }"
    data-testid="experiment-workspace"
  >
    <header class="workspace-header">
      <div class="workspace-heading">
        <router-link class="workspace-back" :to="backTo" aria-label="返回首页">←</router-link>
        <div>
          <span v-if="kicker" class="workspace-kicker">{{ kicker }}</span>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
      </div>
      <div class="workspace-source">
        <RuntimeSourceBadge :type="resultType" />
        <span>{{ resultType }}</span>
      </div>
    </header>

    <div class="workspace-body">
      <aside class="workspace-control-panel" data-testid="workspace-controls">
        <div class="workspace-control-scroll">
          <slot name="controls"></slot>
        </div>
        <footer class="workspace-actions">
          <button type="button" class="workspace-reset" @click="$emit('reset')">
            恢复默认
          </button>
          <button v-if="$slots.task" type="button" @click="toggleDrawer('task')">
            实验任务
          </button>
          <button v-if="$slots.record" type="button" @click="toggleDrawer('record')">
            实验记录
          </button>
          <button type="button" @click="toggleDrawer('model')">模型说明</button>
          <button v-if="$slots.analysis" type="button" @click="toggleDrawer('analysis')">
            更多分析
          </button>
        </footer>
      </aside>

      <main class="workspace-observation">
        <div class="workspace-metrics" data-testid="workspace-metrics">
          <slot name="metrics"></slot>
        </div>

        <nav v-if="chartTabs.length > 1" class="workspace-chart-tabs" aria-label="主图视角">
          <button
            v-for="tab in chartTabs"
            :key="tab.key"
            type="button"
            :class="{ active: activeChart === tab.key }"
            @click="$emit('update:activeChart', tab.key)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section class="workspace-chart" data-testid="workspace-chart">
          <slot name="primary" :active-chart="activeChart"></slot>
        </section>

        <div class="workspace-change" data-testid="workspace-change">
          <span>基准 → 当前</span>
          <div><slot name="change">调整参数后，这里会显示关键变化。</slot></div>
        </div>
      </main>

      <button
        v-if="activeDrawer"
        type="button"
        class="workspace-drawer-backdrop"
        aria-label="关闭展开面板"
        @click="closeDrawer"
      ></button>
      <aside v-if="activeDrawer" class="workspace-drawer" :aria-label="drawerTitle">
        <header>
          <strong>{{ drawerTitle }}</strong>
          <button type="button" aria-label="关闭展开面板" @click="closeDrawer">×</button>
        </header>
        <div class="workspace-drawer-content">
          <slot v-if="activeDrawer === 'task'" name="task"></slot>
          <slot v-else-if="activeDrawer === 'record'" name="record"></slot>
          <slot v-else-if="activeDrawer === 'analysis'" name="analysis"></slot>
          <div v-else class="model-disclosure-grid">
            <div><strong>核心公式</strong><span>{{ formula }}</span></div>
            <div><strong>主要假设</strong><span>{{ assumptions }}</span></div>
            <div><strong>教材来源</strong><span>{{ source }}</span></div>
            <div><strong>适用范围</strong><span>{{ scope }}</span></div>
            <div><strong>变量与单位</strong><span>{{ variables }}</span></div>
            <div><strong>默认参数依据</strong><span>{{ defaultBasis }}</span></div>
            <div><strong>模型版本</strong><span>{{ modelVersion }}</span></div>
            <div><strong>结果来源类型</strong><span>{{ resultType }}</span></div>
            <div><strong>是否属于现实预测</strong><span>{{ realityStatus }}</span></div>
            <p><strong>不能据此推出</strong><span>{{ limitation }}</span></p>
            <slot name="model"></slot>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import RuntimeSourceBadge from './RuntimeSourceBadge.vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  kicker: { type: String, default: '' },
  backTo: { type: String, default: '/' },
  chartTabs: { type: Array, default: () => [] },
  activeChart: { type: String, default: '' },
  changeKey: { type: [String, Number, Object, Array], default: '' },
  resultType: { type: String, default: '教材机制模拟' },
  formula: { type: String, default: '由当前页面参数和教学模型计算，详见页面指标及图例。' },
  assumptions: { type: String, default: '其他条件保持不变；参数变化只代表当前实验情景。' },
  source: { type: String, default: '《劳动经济学》对应章节与页面内标注的教学机制。' },
  scope: { type: String, default: '用于课堂比较、机制解释和敏感性分析。' },
  limitation: { type: String, default: '真实地区、行业或个体的精确预测结果。' },
  variables: { type: String, default: '变量名称、当前值与单位显示在参数控件和图表坐标轴中。' },
  defaultBasis: { type: String, default: '用于课堂演示的可解释默认情景，不代表实证估计或地区统计。' },
  modelVersion: { type: String, default: __APP_VERSION__ },
  realityStatus: { type: String, default: '否。当前页面用于机制解释或教学情景比较。' },
})

defineEmits(['reset', 'update:activeChart'])

const workspace = ref(null)
const activeDrawer = ref('')
const isChanging = ref(false)
let changeTimer = null
let resizeObserver = null

const drawerTitle = computed(() => ({
  task: '实验任务与反思',
  record: '实验记录',
  model: '模型说明',
  analysis: '更多分析',
})[activeDrawer.value] || '')

function notifyResize() {
  nextTick(() => requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))))
}

function toggleDrawer(name) {
  activeDrawer.value = activeDrawer.value === name ? '' : name
  notifyResize()
}

function closeDrawer() {
  activeDrawer.value = ''
  notifyResize()
}

watch(
  () => props.changeKey,
  () => {
    isChanging.value = false
    clearTimeout(changeTimer)
    requestAnimationFrame(() => {
      isChanging.value = true
      changeTimer = setTimeout(() => { isChanging.value = false }, 460)
    })
  },
  { deep: true },
)

watch(() => props.activeChart, notifyResize)

onMounted(() => {
  document.documentElement.classList.add('experiment-workspace-active')
  document.body.classList.add('experiment-workspace-active')
  resizeObserver = new ResizeObserver(notifyResize)
  if (workspace.value) resizeObserver.observe(workspace.value)
})

onUnmounted(() => {
  document.documentElement.classList.remove('experiment-workspace-active')
  document.body.classList.remove('experiment-workspace-active')
  clearTimeout(changeTimer)
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.experiment-workspace {
  --workspace-header: 68px;
  position: relative;
  width: 100%;
  max-width: none !important;
  height: calc(100dvh - 48px);
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  color: #e2e8f0;
  background: #0f172a;
}
.workspace-header {
  height: var(--workspace-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 8px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.96);
}
.workspace-heading {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.workspace-heading > div { min-width: 0; }
.workspace-back {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 7px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 18px;
}
.workspace-kicker {
  display: block;
  color: #67e8f9;
  font-size: 11px;
  font-weight: 800;
}
.workspace-heading h1 {
  margin: 0;
  color: #f8fafc;
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: 0;
}
.workspace-heading p {
  max-width: 760px;
  margin: 3px 0 0;
  overflow: hidden;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workspace-source {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 12px;
}
.workspace-body {
  position: relative;
  height: calc(100% - var(--workspace-header));
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  grid-template-areas: "controls observation";
  gap: 12px;
  padding: 10px 14px 12px;
  overflow: hidden;
}
.workspace-control-panel {
  grid-area: controls;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.13);
  border-radius: 8px;
  background: rgba(23, 33, 52, 0.88);
}
.workspace-control-scroll {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  scrollbar-gutter: stable;
}
.workspace-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 9px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  background: #111b2e;
}
.workspace-actions button {
  min-height: 34px;
  flex: 1 1 84px;
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  color: #cbd5e1;
  background: #172033;
  font-size: 13px;
  cursor: pointer;
}
.workspace-actions .workspace-reset {
  color: #dbeafe;
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(37, 99, 235, 0.18);
}
.workspace-observation {
  grid-area: observation;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-areas:
    "metrics"
    "tabs"
    "chart"
    "change";
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  overflow: hidden;
}
.workspace-metrics {
  grid-area: metrics;
  min-width: 0;
  min-height: 0;
}
.workspace-chart-tabs {
  grid-area: tabs;
  display: flex;
  min-height: 36px;
  gap: 5px;
  overflow-x: auto;
}
.workspace-chart-tabs button {
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 6px;
  color: #94a3b8;
  background: #111b2e;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
.workspace-chart-tabs button.active {
  color: #ecfeff;
  border-color: rgba(34, 211, 238, 0.42);
  background: rgba(8, 145, 178, 0.2);
}
.workspace-chart {
  grid-area: chart;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.workspace-change {
  grid-area: change;
  min-height: 44px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 7px;
  color: #cbd5e1;
  background: rgba(8, 145, 178, 0.08);
  font-size: 13px;
  line-height: 1.35;
}
.workspace-change > span {
  color: #67e8f9;
  font-weight: 800;
  white-space: nowrap;
}
.is-changing .workspace-chart,
.is-changing .workspace-metrics {
  animation: workspace-evidence-pulse 460ms ease-out;
}
.workspace-drawer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  border: 0;
  background: rgba(2, 6, 23, 0.48);
  cursor: default;
}
.workspace-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 21;
  width: min(430px, 92%);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-left: 1px solid rgba(148, 163, 184, 0.2);
  background: #111b2e;
  box-shadow: -18px 0 42px rgba(2, 6, 23, 0.42);
}
.workspace-drawer > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.13);
}
.workspace-drawer > header button {
  width: 34px;
  height: 34px;
  border: 0;
  color: #cbd5e1;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}
.workspace-drawer-content {
  min-height: 0;
  overflow: auto;
  padding: 14px;
}
.model-disclosure-grid {
  display: grid;
  gap: 14px;
}
.model-disclosure-grid > div,
.model-disclosure-grid > p {
  display: grid;
  gap: 4px;
  margin: 0;
}
.model-disclosure-grid strong { color: #67e8f9; font-size: 13px; }
.model-disclosure-grid span { color: #cbd5e1; font-size: 14px; line-height: 1.65; }

.workspace-control-scroll :deep(.lab-controls),
.workspace-control-scroll :deep(.control-band) {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  align-content: start;
  gap: 10px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
}
.workspace-control-scroll :deep(.control-group) {
  min-width: 0 !important;
  width: 100% !important;
  margin: 0 !important;
}
.workspace-control-scroll :deep(.btn-run),
.workspace-control-scroll :deep(.btn-reset),
.workspace-control-scroll :deep(.reset-btn),
.workspace-control-scroll :deep(.reset-params) {
  display: none !important;
}
.workspace-metrics :deep(.cards-row),
.workspace-metrics :deep(.metric-grid),
.workspace-metrics :deep(.metrics-grid),
.workspace-metrics :deep(.metrics-row),
.workspace-metrics :deep(.concept-grid) {
  display: grid !important;
  grid-auto-flow: column;
  grid-auto-columns: minmax(140px, 1fr);
  grid-template-columns: none !important;
  gap: 8px !important;
  margin: 0 !important;
  overflow-x: auto;
}
.workspace-metrics :deep(.stat-card),
.workspace-metrics :deep(.metric-card),
.workspace-metrics :deep(.metric-grid article),
.workspace-metrics :deep(.concept-grid article) {
  min-height: 66px;
  padding: 9px 11px !important;
  border-radius: 7px !important;
}
.workspace-metrics :deep(.stat-val),
.workspace-metrics :deep(.metric-value),
.workspace-metrics :deep(.metric-grid strong) {
  font-size: 20px !important;
}
.workspace-chart :deep(.chart-card),
.workspace-chart :deep(.main-chart),
.workspace-chart :deep(.reading-panel),
.workspace-chart :deep(.decision-panel),
.workspace-chart :deep(.section-block) {
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0 !important;
  padding: 12px !important;
  overflow: hidden;
  border-radius: 8px !important;
}
.workspace-chart :deep(.chart-card),
.workspace-chart :deep(.main-chart),
.workspace-chart :deep(.section-block) {
  display: flex;
  flex-direction: column;
}
.workspace-chart :deep(.workspace-chart-canvas),
.workspace-chart :deep(.chart-container),
.workspace-chart :deep(.lmdt-chart) {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  flex: 1 1 auto;
}
.workspace-chart :deep(.lmdt-chart) { min-height: 220px !important; }
.workspace-chart :deep(.chart-head),
.workspace-chart :deep(h2),
.workspace-chart :deep(h3) {
  flex: 0 0 auto;
}
.workspace-drawer-content :deep(.learning-card),
.workspace-drawer-content :deep(.record-panel) {
  margin: 0 !important;
}

@keyframes workspace-evidence-pulse {
  from { filter: brightness(1.2); }
  to { filter: brightness(1); }
}

@media (max-width: 820px) {
  .experiment-workspace {
    --workspace-header: 70px;
    height: calc(100dvh - 58px);
  }
  .workspace-header {
    padding: 7px 10px;
  }
  .workspace-heading { gap: 8px; }
  .workspace-heading h1 { font-size: 19px; }
  .workspace-heading p {
    max-width: calc(100vw - 78px);
    font-size: 12px;
  }
  .workspace-source { display: none; }
  .workspace-body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(390px, 61%) minmax(0, 39%);
    grid-template-areas:
      "observation"
      "controls";
    gap: 8px;
    padding: 7px 8px 8px;
  }
  .workspace-control-scroll { padding: 10px 12px; }
  .workspace-actions {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  .workspace-actions button {
    flex: 0 0 auto;
    min-width: 82px;
  }
  .workspace-metrics :deep(.cards-row),
  .workspace-metrics :deep(.metric-grid),
  .workspace-metrics :deep(.metrics-grid),
  .workspace-metrics :deep(.metrics-row),
  .workspace-metrics :deep(.concept-grid) {
    grid-auto-columns: minmax(140px, 1fr);
  }
  .workspace-metrics :deep(.stat-card),
  .workspace-metrics :deep(.metric-card),
  .workspace-metrics :deep(.metric-grid article),
  .workspace-metrics :deep(.concept-grid article) {
    height: 68px;
    min-height: 68px;
    padding: 6px 9px !important;
    overflow: hidden;
  }
  .workspace-metrics :deep(.stat-val),
  .workspace-metrics :deep(.metric-value),
  .workspace-metrics :deep(.metric-grid strong) {
    font-size: 18px !important;
  }
  .workspace-chart-tabs { min-height: 32px; }
  .workspace-chart-tabs button { min-height: 30px; padding: 4px 10px; }
  .workspace-change {
    height: 48px;
    min-height: 48px;
    padding: 5px 9px;
    overflow: hidden;
    font-size: 12px;
  }
  .workspace-change > div {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .workspace-drawer {
    top: auto;
    left: 0;
    width: 100%;
    max-height: 68%;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
    border-left: 0;
  }
  .workspace-chart :deep(.lmdt-chart) { min-height: 150px !important; }
}

@media (max-width: 460px) {
  .workspace-back { width: 30px; height: 30px; flex-basis: 30px; }
  .workspace-kicker { display: none; }
  .workspace-heading h1 { font-size: 18px; }
  .workspace-body { grid-template-rows: minmax(390px, 61%) minmax(0, 39%); }
}
</style>
