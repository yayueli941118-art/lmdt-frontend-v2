<template>
  <span class="runtime-badge" :class="runtimeInfo.source">
    <span class="runtime-dot"></span>
    {{ runtimeInfo.label }}
  </span>
</template>

<script setup>
import { runtimeInfo } from '../lib/api'
</script>

<style scoped>
.runtime-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  color: #a5f3fc;
  font-size: 12px;
  font-weight: 750;
}
.runtime-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.1);
}
.runtime-badge.online {
  color: #86efac;
}
.runtime-badge.online .runtime-dot {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}
</style>
