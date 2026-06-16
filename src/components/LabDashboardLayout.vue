<template>
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
  <section v-if="$slots.secondary" class="lab-dashboard-secondary">
    <slot name="secondary"></slot>
  </section>
</template>

<style scoped>
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
</style>
