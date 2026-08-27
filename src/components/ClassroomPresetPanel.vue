<template>
  <section v-if="presets.length" class="preset-panel" aria-label="教师课堂预设">
    <div class="preset-heading">
      <span>教师课堂预设</span>
      <strong>{{ selectedPreset.label }}</strong>
    </div>
    <div class="preset-buttons">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        :class="{ active: preset.id === selectedId }"
        :data-testid="`classroom-preset-${preset.id}`"
        @click="apply(preset)"
      >
        {{ preset.shortLabel || preset.label }}
      </button>
    </div>
    <dl class="preset-disclosure">
      <div><dt>用于</dt><dd>{{ selectedPreset.purpose }}</dd></div>
      <div><dt>追问</dt><dd>{{ selectedPreset.question }}</dd></div>
      <div><dt>预期观察</dt><dd>{{ selectedPreset.expected }}</dd></div>
      <div><dt>边界</dt><dd>{{ selectedPreset.boundary }}</dd></div>
    </dl>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({ presets: { type: Array, default: () => [] } })
const emit = defineEmits(['apply'])
const selectedId = ref(props.presets[0]?.id || '')
const selectedPreset = computed(() => props.presets.find(item => item.id === selectedId.value) || props.presets[0] || {})

watch(() => props.presets, presets => {
  if (!presets.some(item => item.id === selectedId.value)) selectedId.value = presets[0]?.id || ''
})

function apply(preset) {
  selectedId.value = preset.id
  emit('apply', preset)
}
</script>

<style scoped>
.preset-panel{display:grid;gap:8px;margin:0 0 12px;padding:10px;border:1px solid rgba(245,184,73,.28);border-radius:6px;background:rgba(120,74,5,.1)}
.preset-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.preset-heading span{color:#f5c267;font-size:10px;font-weight:900}.preset-heading strong{color:#f8fafc;font-size:11px}
.preset-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.preset-buttons button{min-width:0;min-height:34px;padding:5px 4px;border:1px solid #334155;border-radius:4px;color:#aebed0;background:#111b2e;font-size:10px;font-weight:800;cursor:pointer}.preset-buttons button.active,.preset-buttons button:hover{border-color:#f5b849;color:#fff;background:#71470a}
.preset-disclosure{display:grid;gap:4px;margin:0}.preset-disclosure div{display:grid;grid-template-columns:52px minmax(0,1fr);gap:6px}.preset-disclosure dt{color:#7f8da3;font-size:9px}.preset-disclosure dd{margin:0;color:#cbd5e1;font-size:10px;line-height:1.35;overflow-wrap:anywhere}
@media(max-width:520px){.preset-disclosure div{grid-template-columns:44px minmax(0,1fr)}}
</style>
