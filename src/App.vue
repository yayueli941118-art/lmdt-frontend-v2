<template>
  <div class="app-container">
    <MacroLab />
  </div>
</template>

<script setup>
import MacroLab from './components/MacroLab.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Microsoft YaHei', sans-serif;
  background: #0b0f19;
  color: #e2e8f0;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  width: 100%;
}
</style>
