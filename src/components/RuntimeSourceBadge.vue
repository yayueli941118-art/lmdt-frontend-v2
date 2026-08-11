<template>
  <span class="source-badge" :class="sourceInfo.tone" :title="sourceInfo.description">
    <span class="source-mark" aria-hidden="true"></span>
    {{ sourceInfo.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { runtimeInfo } from '../lib/api'

const props = defineProps({ type: { type: String, default: '' } })

const sourceTypes = {
  教材公式: ['教材公式', 'theory', '根据教材公式和当前参数计算，不是现实预测。'],
  教材机制模拟: ['教材公式', 'theory', '根据教材公式和当前参数计算，不是现实预测。'],
  教材机制仿真: ['教材公式', 'theory', '根据教材公式和当前参数计算，不是现实预测。'],
  教材公式与教学情景参数: ['教材公式＋情景', 'theory', '由教材公式和当前教学参数共同生成，不是现实预测。'],
  教材公式与合成收入情景: ['教材公式＋合成情景', 'theory', '由教材公式和系统合成收入分布生成，不是现实观测。'],
  教学情景参数: ['教学情景参数', 'scenario', '参数由教师或学生设定，用于机制比较。'],
  教学情景参数推演: ['教学情景推演', 'scenario', '参数由教师或学生设定，用于机制比较。'],
  用户导入数据: ['用户导入数据', 'user-data', '数据来自当前浏览器中由用户导入的文件。'],
  历史观测数据: ['历史观测数据', 'observed', '数据具有明确来源、日期和历史观测口径。'],
  教学示例数据: ['教学示例数据', 'example', '为课堂演练构造，不对应现实地区统计。'],
  数据校准结果: ['数据校准结果', 'calibrated', '模型参数由标明口径的数据进行教学型校准。'],
  用户导入样本校准后的情景推演: ['样本校准情景', 'calibrated', '由用户导入样本校准部分参数后进行情景推演，不代表总体预测。'],
  合成工资样本与教学情景参数: ['合成工资样本', 'example', '工资样本由系统构造，并与教学情景参数共同计算。'],
  合成样本真实回归: ['合成样本回归', 'example', '回归算法在系统合成样本上执行，样本并非现实观测。'],
  统计预测结果: ['统计预测结果', 'forecast', '使用历史数据、留出回测和明确方法生成。'],
  情景推演结果: ['情景推演结果', 'scenario-result', '结果来自人为假设，不是统计置信区间。'],
  规则反馈: ['规则反馈', 'rule', '由透明规则和量规生成，不代表大模型事实核查。'],
}

const sourceInfo = computed(() => {
  const configured = sourceTypes[props.type]
  if (configured) return { label: configured[0], tone: configured[1], description: configured[2] }
  return {
    label: runtimeInfo.label,
    tone: runtimeInfo.source === 'online' ? 'observed' : 'theory',
    description: runtimeInfo.source === 'online' ? '当前请求由已配置的数据服务返回。' : '当前结果由浏览器内的教学模型计算。',
  }
})
</script>

<style scoped>
.source-badge {
  --badge-color: #a5f3fc;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  min-height: 26px;
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
  border-radius: 5px;
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 8%, transparent);
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
}
.source-mark { width: 7px; height: 7px; border-radius: 2px; background: currentColor; }
.theory { --badge-color: #67e8f9; }
.scenario { --badge-color: #c4b5fd; }
.user-data { --badge-color: #fcd34d; }
.observed { --badge-color: #86efac; }
.example { --badge-color: #93c5fd; }
.calibrated { --badge-color: #5eead4; }
.forecast { --badge-color: #60a5fa; }
.scenario-result { --badge-color: #f0abfc; }
.rule { --badge-color: #fdba74; }
</style>
