<template>
  <VChart class="lmdt-chart" :option="option" autoresize :aria-label="ariaLabel" role="img" />
</template>

<script setup>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent, GridComponent, LegendComponent, MarkAreaComponent,
  MarkLineComponent, TitleComponent, TooltipComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer, BarChart, LineChart, RadarChart, ScatterChart,
  GridComponent, LegendComponent, TooltipComponent, TitleComponent,
  MarkAreaComponent, MarkLineComponent, DataZoomComponent,
])

defineProps({
  option: { type: Object, required: true },
  ariaLabel: { type: String, default: '劳动力市场分析图表' },
})
</script>

<style scoped>
.lmdt-chart { width: 100%; height: 100%; min-height: 300px; }
</style>
