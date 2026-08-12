<template>
  <section class="audit-panel" aria-labelledby="audit-title">
    <header>
      <div>
        <span>规则反馈</span>
        <h3 id="audit-title">AI回答审计台</h3>
      </div>
      <RuntimeSourceBadge type="规则反馈" />
    </header>
    <p class="audit-boundary">本工具提供规则化审计清单，不代表大模型事实核查。</p>

    <label class="audit-field">
      <span>粘贴外部AI原回答</span>
      <textarea v-model="draft.original" rows="5" placeholder="请保留原文，方便比较修订前后的证据与表述。"></textarea>
    </label>

    <div class="audit-rules" aria-live="polite">
      <label v-for="rule in rules" :key="rule.id" :class="{ flagged: rule.flagged }">
        <input v-model="draft.selectedIssues" type="checkbox" :value="rule.id" />
        <span><strong>{{ rule.label }}</strong><small>{{ rule.flagged ? rule.hint : '仍需人工确认' }}</small></span>
      </label>
    </div>

    <div class="audit-grid">
      <label class="audit-field"><span>发现的问题与修改依据</span><textarea v-model="draft.basis" rows="3"></textarea></label>
      <label class="audit-field"><span>修订后的结论</span><textarea v-model="draft.revision" rows="3"></textarea></label>
      <label class="audit-field"><span>仍无法核实的内容</span><textarea v-model="draft.unresolved" rows="3"></textarea></label>
    </div>
    <button type="button" @click="saveAudit">保存审计记录</button>
    <p v-if="saved" class="audit-saved" role="status">已保存在当前浏览器中。</p>
    <p v-else-if="storageError" class="audit-error" role="alert">{{ storageError }}</p>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import RuntimeSourceBadge from './RuntimeSourceBadge.vue'
import { readJsonStorage, writeJsonStorage } from '../lib/storage'

const emit = defineEmits(['save'])
const props = defineProps({ storageKey: { type: String, default: 'lmdtAiAuditRecords' } })
const draft = reactive({ original: '', selectedIssues: [], basis: '', revision: '', unresolved: '' })
const saved = ref(false)
const storageError = ref('')

const ruleDefinitions = [
  ['source', '是否说明数据来源', text => !/(来源|统计局|报告|数据集|网址|source)/i.test(text), '未识别到明确来源提示。'],
  ['date', '是否说明数据日期', text => !/(20\d{2}|日期|截至|period)/i.test(text), '未识别到数据日期或观察期。'],
  ['sample', '是否混淆样本和总体', text => /(样本|招聘广告).*(全国|全部|总体|必然)/.test(text), '出现由样本直接外推总体的表述。'],
  ['causality', '是否把相关关系写成因果关系', text => /(相关|同时).{0,12}(导致|证明|造成)/.test(text), '可能把相关或同期变化写成因果。'],
  ['occupation', '是否把AI暴露等同于岗位消失', text => /(AI|人工智能).{0,12}(消失|淘汰|取代全部|必然减少)/i.test(text), '出现职业必然消失或被完全取代的表述。'],
  ['horizon', '是否遗漏预测期限', text => /(预测|未来|将会)/.test(text) && !/(年|月|季度|期限|到20\d{2})/.test(text), '出现未来判断但未识别到期限。'],
  ['assumption', '是否遗漏预测假设', text => /(预测|情景|推演)/.test(text) && !/(假设|条件|情景|前提)/.test(text), '未来判断可能未说明关键假设。'],
  ['simulation', '是否把机制仿真写成现实预测', text => /(调节|参数|模拟|仿真).{0,16}(预测|现实|实际)/.test(text), '可能混淆参数实验与现实预测。'],
  ['precision', '是否使用虚假精确数字', text => /(必然|一定|将).{0,16}\d+\.\d+%/.test(text), '确定性措辞与小数精确比例同时出现。'],
  ['groups', '是否忽略群体差异', text => /(所有劳动者|全部岗位|普遍都会)/.test(text), '出现未区分技能、行业或群体的概括。'],
  ['uncertainty', '是否忽略不确定性', text => /(预测|未来)/.test(text) && !/(可能|区间|风险|不确定|情景)/.test(text), '未来表述可能缺少不确定性说明。'],
  ['policy', '是否给出不可验证的政策建议', text => /(应该|必须).{0,20}(政策|政府|补贴|立法)/.test(text) && !/(依据|数据|评估|试点)/.test(text), '政策建议可能缺少依据或验证路径。'],
]

const rules = computed(() => ruleDefinitions.map(([id, label, check, hint]) => ({ id, label, hint, flagged: draft.original.trim() ? check(draft.original) : false })))

function saveAudit() {
  const stored = readJsonStorage(props.storageKey, [])
  const records = Array.isArray(stored) ? stored : []
  const record = { ...draft, ruleSignals: rules.value.filter(item => item.flagged).map(item => item.id), createdAt: new Date().toISOString(), sourceType: '外部AI回答＋规则审计' }
  const outcome = writeJsonStorage(props.storageKey, [...records, record].slice(-50), { version: 1 })
  saved.value = outcome.ok
  storageError.value = outcome.message
  if (outcome.ok) emit('save', record)
}
</script>

<style scoped>
.audit-panel { display: grid; gap: 14px; color: #dbe7f5; }
.audit-panel header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.audit-panel header span { color: #fdba74; font-size: 11px; font-weight: 800; }
.audit-panel h3 { margin: 3px 0 0; font-size: 20px; }
.audit-boundary { margin: 0; padding: 10px 12px; border-left: 3px solid #fb923c; background: rgba(251,146,60,.08); color: #fed7aa; font-size: 13px; }
.audit-field { display: grid; gap: 7px; color: #cbd5e1; font-size: 13px; font-weight: 700; }
.audit-field textarea { width: 100%; resize: vertical; border: 1px solid #334155; border-radius: 6px; padding: 10px; color: #f8fafc; background: #0f172a; font: inherit; line-height: 1.55; }
.audit-rules { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 7px; }
.audit-rules label { display: flex; gap: 9px; align-items: start; min-height: 52px; padding: 9px; border: 1px solid #263449; border-radius: 6px; background: #111b2e; }
.audit-rules label.flagged { border-color: rgba(251,146,60,.5); background: rgba(124,45,18,.18); }
.audit-rules input { margin-top: 3px; accent-color: #fb923c; }
.audit-rules span { display: grid; gap: 3px; }
.audit-rules strong { font-size: 12px; color: #e2e8f0; }
.audit-rules small { color: #94a3b8; line-height: 1.35; }
.audit-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; }
.audit-panel > button { justify-self: start; min-height: 40px; padding: 0 16px; border: 0; border-radius: 6px; color: white; background: #2563eb; font-weight: 800; cursor: pointer; }
.audit-saved { margin: 0; color: #86efac; font-size: 13px; }
.audit-error { margin: 0; color: #fca5a5; font-size: 13px; }
@media (max-width: 760px) { .audit-rules, .audit-grid { grid-template-columns: 1fr; } }
</style>
