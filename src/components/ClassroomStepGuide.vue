<template>
  <aside class="step-guide" aria-label="本步说明">
    <dl>
      <div><dt>要做什么</dt><dd>{{ doing }}</dd></div>
      <div><dt>为什么做</dt><dd>{{ why }}</dd></div>
      <div><dt>完成标准</dt><dd>{{ completion }}</dd></div>
      <div><dt>下一入口</dt><dd>{{ next }}</dd></div>
    </dl>
  </aside>
</template>

<script setup>
defineProps({
  doing: { type: String, required: true },
  why: { type: String, required: true },
  completion: { type: String, required: true },
  next: { type: String, required: true },
})
</script>

<style scoped>
.step-guide{padding:16px;border-left:3px solid #38bdf8;background:#0d1728}.step-guide dl{display:grid;gap:12px;margin:0}.step-guide div{display:grid;gap:4px}.step-guide dt{color:#5fbfd3;font-size:10px;font-weight:900}.step-guide dd{margin:0;color:#cbd5e1;font-size:12px;line-height:1.55}
@media(max-width:820px){.step-guide{border-left:0;border-top:3px solid #38bdf8}}
</style>
