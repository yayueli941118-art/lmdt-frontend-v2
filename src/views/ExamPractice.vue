<template>
  <ExperimentWorkspace
    title="独立分析能力训练"
    subtitle="固定蓝图 · 独立作答 · 提交后反馈 · 返回对应实验修正"
    kicker="验能力 · PRACTICE"
    :change-key="`${currentIndex}-${submitted}-${attempt}`"
    result-type="规则反馈"
    formula="总分为五个课程能力维度得分之和，满分100分。"
    assumptions="同一种子生成同一套题；规则评分只核对预设答案。"
    source="课程能力蓝图与固定种子教学题库。"
    scope="用于课前诊断、过程训练和考前自测，不替代课程期末闭卷考试。"
    limitation="不能证明真实考试成绩、长期能力或外部AI使用情况。"
    default-basis="题型比例对应指标、模型、曲线、数据图表、预测与AI错误识别五类能力。"
    reality-status="否。当前是规则评分的教学训练记录。"
    :error="storageError"
    @reset="restart"
  >
    <template #controls>
      <div class="question-nav">
        <div class="seed-line"><span>题组种子</span><strong>{{ seed }}</strong></div>
        <div class="progress"><span :style="{width:`${answeredCount/questions.length*100}%`}"></span></div>
        <button v-for="(question,index) in questions" :key="question.id" type="button" :class="{active:index===currentIndex,answered:hasAnswer(question),wrong:submitted&&!result.details[index].correct}" @click="currentIndex=index"><span>{{ index+1 }}</span><strong>{{ question.dimension }}</strong><small>{{ question.points }}分</small></button>
      </div>
    </template>

    <template #metrics>
      <div class="metric-strip">
        <article><span>当前进度</span><strong>{{ answeredCount }}/{{ questions.length }}</strong></article>
        <article><span>能力维度</span><strong class="metric-text">{{ current.dimension }}</strong></article>
        <article><span>本题分值</span><strong>{{ current.points }}分</strong></article>
        <article><span>{{ submitted ? '本次得分' : '答案状态' }}</span><strong>{{ submitted ? `${result.score}/100` : (hasAnswer(current)?'已作答':'未作答') }}</strong></article>
      </div>
    </template>

    <template #primary>
      <section class="question-card">
        <header><span>第 {{ currentIndex+1 }} 题 · {{ current.chapter }}</span><h2>{{ current.prompt }}</h2></header>
        <div class="answer-area">
          <label v-for="option in current.options || []" :key="option.value" class="option-row" :class="answerClass(option.value)">
            <input v-if="current.responseType==='single'" v-model="answers[current.id]" type="radio" :name="current.id" :value="option.value" :disabled="submitted" />
            <input v-else v-model="answers[current.id]" type="checkbox" :value="option.value" :disabled="submitted" />
            <span>{{ option.label }}</span>
          </label>
          <label v-if="current.responseType==='numeric'" class="numeric-answer"><span>填写数值</span><input v-model="answers[current.id]" type="number" step="0.1" :disabled="submitted" /></label>
        </div>
        <div v-if="submitted" class="feedback" :class="result.details[currentIndex].correct?'correct':'incorrect'">
          <strong>{{ result.details[currentIndex].correct ? '判断正确' : '需要修正' }}</strong>
          <p>{{ current.explanation }}</p><p><b>常见错误：</b>{{ current.commonError }}</p>
          <router-link :to="current.returnTo">返回对应实验</router-link>
        </div>
        <footer><button type="button" :disabled="currentIndex===0" @click="currentIndex--">上一题</button><button v-if="currentIndex<questions.length-1" type="button" @click="currentIndex++">下一题</button><button v-else-if="!submitted" class="primary" type="button" :disabled="answeredCount<questions.length" @click="submitAttempt">提交全部答案</button><button v-else class="primary" type="button" @click="restart">再练一次</button></footer>
      </section>
    </template>

    <template #change><strong>{{ feedbackTitle }}</strong><span>{{ feedbackText }}</span></template>
    <template #task><div class="drawer-copy"><h3>课程评价位置</h3><p>{{ assessmentSummary }}。本训练只服务独立能力形成，不自动替代教师评价。</p><p>课堂学习可以使用AI辅助；个人综合实践考查要求学生在新数据和新情境下独立完成指标、机制、预测、风险审计与决策建议。</p></div></template>
    <template #analysis><div class="analysis-stack"><section><h3>能力蓝图</h3><dl><div v-for="item in assessmentBlueprint" :key="item.dimension"><dt>{{ item.dimension }}</dt><dd>{{ item.points }}分</dd></div></dl></section><section v-if="submitted"><h3>本次诊断</h3><p>优先复习：{{ result.errorTypes.join('、') || '本次各维度均通过' }}</p><p v-if="previousScore!==null">较上次 {{ result.score-previousScore>=0?'+':'' }}{{ result.score-previousScore }} 分。</p></section><AiAuditPanel storage-key="lmdtPracticeAiAuditRecords" /></div></template>
  </ExperimentWorkspace>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AiAuditPanel from '../components/AiAuditPanel.vue'
import ExperimentWorkspace from '../components/ExperimentWorkspace.vue'
import { assessmentBlueprint, buildPracticeSet } from '../domain/assessment/questionBank'
import { scoreAttempt } from '../domain/assessment/scoring'
import { readJsonStorage, writeJsonStorage } from '../lib/storage'
import { COURSE_PROFILE } from '../config/courseProfile'

const baseSeed = 20260811
const attempt = ref(1)
const seed = computed(() => baseSeed + attempt.value - 1)
const questions = computed(() => buildPracticeSet(seed.value))
const currentIndex = ref(0)
const answers = ref({})
const submitted = ref(false)
const startedAt = ref(Date.now())
const previousScore = ref(null)
const storageError = ref('')
const assessmentSummary = COURSE_PROFILE.assessments.map(item => `${item.label}${item.weight}%`).join('、')
const current = computed(() => questions.value[currentIndex.value])
const result = computed(() => scoreAttempt(questions.value, answers.value))
const answeredCount = computed(() => questions.value.filter(hasAnswer).length)
const feedbackTitle = computed(() => submitted.value ? `完成第${attempt.value}次训练：${result.value.score}分` : '先独立作答，提交后再看解析')
const feedbackText = computed(() => submitted.value ? `需要优先修正：${result.value.errorTypes.join('、') || '暂无错误维度'}。` : `已完成 ${answeredCount.value}/${questions.value.length} 题；系统不会提前显示答案。`)

watch(current, question => {
  if (question?.responseType === 'multiple' && !Array.isArray(answers.value[question.id])) {
    answers.value[question.id] = []
  }
}, { immediate: true })

function hasAnswer(question) { const value=answers.value[question.id]; return Array.isArray(value)?value.length>0:value!==undefined&&value!=='' }
function answerClass(value) { if(!submitted.value) return ''; const answer=current.value.answer; const selected=Array.isArray(answers.value[current.value.id])?answers.value[current.value.id].includes(value):answers.value[current.value.id]===value; const correct=Array.isArray(answer)?answer.includes(value):answer===value; return {selected,correct,incorrect:selected&&!correct} }
function submitAttempt(){ submitted.value=true; const stored=readJsonStorage('lmdtExamPracticeRecords',[]); const records=Array.isArray(stored)?stored:[]; const record={id:`practice-${Date.now()}`,seed:seed.value,attempt:attempt.value,score:result.value.score,answers:{...answers.value},dimensions:result.value.dimensions,errorTypes:result.value.errorTypes,durationSeconds:Math.round((Date.now()-startedAt.value)/1000),createdAt:new Date().toISOString()}; const outcome=writeJsonStorage('lmdtExamPracticeRecords',[...records,record].slice(-50),{version:1}); storageError.value=outcome.message }
function restart(){ previousScore.value=submitted.value?result.value.score:previousScore.value; attempt.value+=1; currentIndex.value=0; answers.value={}; submitted.value=false; startedAt.value=Date.now() }
</script>

<style scoped>
.question-nav{display:grid;gap:6px}.seed-line{display:flex;justify-content:space-between;color:#94a3b8;font-size:12px}.seed-line strong{color:#7dd3fc}.progress{height:5px;overflow:hidden;background:#0f172a}.progress span{display:block;height:100%;background:#38bdf8;transition:width .3s}.question-nav>button{display:grid;grid-template-columns:28px minmax(0,1fr) 34px;align-items:center;gap:7px;min-height:40px;padding:6px 8px;border:1px solid #263449;border-radius:5px;color:#94a3b8;background:#111b2e;text-align:left;cursor:pointer}.question-nav>button span{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#0f172a}.question-nav>button strong{overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.question-nav>button small{text-align:right}.question-nav>button.active{border-color:#38bdf8;color:#e0f2fe}.question-nav>button.answered span{background:#155e75;color:#cffafe}.question-nav>button.wrong span{background:#7f1d1d}
.metric-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.metric-strip article{min-width:0;padding:10px 12px;border:1px solid rgba(148,163,184,.14);border-radius:6px;background:#111b2e}.metric-strip span{display:block;color:#7f8da3;font-size:11px}.metric-strip strong{display:block;margin-top:4px;color:#f8fafc;font-size:19px}.metric-strip .metric-text{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}
.question-card{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;gap:13px;padding:18px;border:1px solid rgba(148,163,184,.14);border-radius:7px;background:#111b2e}.question-card header span{color:#7dd3fc;font-size:12px}.question-card h2{margin:7px 0 0;max-width:900px;font-size:20px;line-height:1.45}.answer-area{min-height:0;display:grid;align-content:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;overflow:auto}.option-row{display:flex;align-items:center;gap:10px;min-height:48px;padding:10px 12px;border:1px solid #334155;border-radius:6px;color:#dbe7f5;background:#0f172a;cursor:pointer}.option-row.selected{border-color:#38bdf8}.option-row.correct{border-color:#22c55e;background:rgba(20,83,45,.18)}.option-row.incorrect{border-color:#f87171;background:rgba(127,29,29,.18)}.numeric-answer{display:grid;gap:8px}.numeric-answer input{width:min(320px,100%);min-height:46px;padding:0 12px;border:1px solid #334155;border-radius:6px;color:#f8fafc;background:#0f172a}.feedback{padding:10px 12px;border-left:3px solid #22c55e;background:rgba(20,83,45,.16);color:#cbd5e1;font-size:13px}.feedback.incorrect{border-color:#f87171;background:rgba(127,29,29,.14)}.feedback p{margin:4px 0}.feedback a{color:#7dd3fc}.question-card footer{display:flex;justify-content:flex-end;gap:8px}.question-card footer button{min-height:38px;padding:0 14px;border:1px solid #334155;border-radius:6px;color:#cbd5e1;background:#172033;cursor:pointer}.question-card footer button.primary{border-color:#2563eb;color:#fff;background:#1d4ed8}.question-card footer button:disabled{opacity:.45;cursor:not-allowed}.drawer-copy,.analysis-stack{display:grid;gap:14px;color:#cbd5e1;line-height:1.65}.analysis-stack section{padding-bottom:14px;border-bottom:1px solid #263449}.analysis-stack dl{display:grid;gap:7px}.analysis-stack dl div{display:flex;justify-content:space-between}.analysis-stack dt{color:#cbd5e1}.analysis-stack dd{color:#7dd3fc;font-weight:800}
@media(max-width:760px){.metric-strip{grid-template-columns:repeat(2,1fr)}.metric-strip strong{font-size:15px}.question-card{padding:12px}.question-card h2{font-size:16px}.answer-area{grid-template-columns:1fr}.option-row{min-height:42px}}
</style>
