<template>
  <div class="home-console">
    <header class="course-header">
      <div class="course-identity">
        <span>{{ appProfile.heroBadge }}</span>
        <h1>{{ appProfile.brandFull }}</h1>
        <p>{{ appProfile.heroDesc }}</p>
      </div>
      <div class="course-status">
        <span>当前模式</span><strong>{{ modeName }}</strong>
        <small>{{ appProfile.footerVersion }} · 纯前端本地数据</small>
      </div>
    </header>

    <main>
      <section class="learning-spaces" aria-labelledby="spaces-title">
        <div class="section-head"><div><span>课程主线</span><h2 id="spaces-title">五个连续学习空间</h2></div><p>先建立证据，再解释机制；先独立判断，再查看模型结果。</p></div>
        <div class="space-grid">
          <router-link v-for="(space,index) in learningSpaces" :key="space.to" :to="space.to" class="space-item">
            <span class="space-index">0{{ index+1 }}</span>
            <div><strong>{{ space.title }}</strong><p>{{ space.desc }}</p></div>
            <span class="space-action">进入</span>
          </router-link>
        </div>
      </section>

      <section v-if="isCompetition" class="competition-route" aria-labelledby="route-title">
        <div class="section-head"><div><span>5分钟教学展示</span><h2 id="route-title">从数据证据到独立能力</h2></div><p>以下路径用于快速说明课程逻辑，所有页面仍可由学生完整操作。</p></div>
        <ol><li v-for="item in competitionRoute" :key="item.to"><router-link :to="item.to"><span>{{ item.step }}</span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></router-link></li></ol>
        <div class="preset-row"><router-link v-for="item in competitionPresets" :key="item.title" :to="item.to"><strong>{{ item.title }}</strong><span>{{ item.desc }}</span></router-link></div>
      </section>

      <section v-if="isCompetition || isAnonymous" class="evidence-strip">
        <article v-for="step in showcaseSteps" :key="step.title"><strong>{{ step.title }}</strong><span>{{ step.desc }}</span></article>
      </section>

      <section class="workspace-band" aria-labelledby="workspace-title">
        <div><span>课程作业生产线</span><h2 id="workspace-title">岗位劳动力市场预测报告工作台</h2><p>标准模板采集招聘样本，完成导入校验、统计分析、实验记录与报告草稿。招聘样本只代表所采样本，不自动等同于社会总需求。</p></div>
        <router-link to="/report/workbench">进入报告工作台</router-link>
      </section>

      <section class="classic-labs" aria-labelledby="classic-title">
        <div class="section-head"><div><span>教材机制</span><h2 id="classic-title">经典劳动经济学实验</h2></div><p>保留教材模型与章节逻辑，每个核心页均支持一屏调参、一屏观察。</p></div>
        <div class="lab-index">
          <router-link v-for="lab in classicLabs" :key="lab.to" :to="lab.to"><span>{{ lab.chapter }}</span><strong>{{ lab.title }}</strong><p>{{ lab.desc }}</p></router-link>
        </div>
      </section>

      <section class="assessment-band" aria-labelledby="assessment-title">
        <div><span>课程评价</span><h2 id="assessment-title">AI可辅助学习，期末检验独立能力</h2><p>训练记录仅供学习诊断，不自动替代教师评价，也不改变课程既定考核权重。</p></div>
        <dl><div><dt>考勤与过程</dt><dd>10%</dd></div><div><dt>个体作业</dt><dd>10%</dd></div><div><dt>小组作业</dt><dd>20%</dd></div><div><dt>期末考试</dt><dd>60%</dd></div></dl>
      </section>
    </main>

    <footer><div><strong>{{ appProfile.brandShort }}</strong><span>{{ appProfile.footerCourse }}</span></div><div v-if="!isAnonymous"><span>{{ appProfile.footerSchool }}</span><span>{{ appProfile.footerAuthor }}</span></div><small>{{ appProfile.footerPowered }}</small></footer>
  </div>
</template>

<script setup>
import { appMode, appProfile, isAnonymous, isCompetition, showcaseSteps } from '../config/appMode'

const modeName = { teaching: '教学版', competition: '竞赛展示版', anonymous: '匿名版' }[appMode]
const learningSpaces = [
  { title:'看市场', desc:'导入时间序列，检查质量、口径与指标边界。', to:'/analysis/market' },
  { title:'拆机制', desc:'让供给、需求、工资和匹配曲线随参数变化。', to:'/lab/enterprise' },
  { title:'推未来', desc:'先判断后回测，比较基础预测方法和人为情景。', to:'/forecast/basic' },
  { title:'做决策', desc:'汇总样本、实验和预测，生成课程报告证据链。', to:'/report/workbench' },
  { title:'验能力', desc:'用固定蓝图训练计算、图表、机制和AI错误识别。', to:'/practice/exam' },
]
const competitionRoute = [
  { step:'01', title:'数据质量', desc:'指标不是拿来就算，先审来源和口径。', to:'/analysis/market' },
  { step:'02', title:'教材机制', desc:'一屏观察劳动需求曲线与均衡变化。', to:'/lab/enterprise' },
  { step:'03', title:'AI任务重构', desc:'区分替代、规模、互补和新任务效应。', to:'/lab/ai-occupation' },
  { step:'04', title:'预测回测', desc:'先预测，再用MAE、RMSE、MAPE修订。', to:'/forecast/basic' },
  { step:'05', title:'报告证据', desc:'数据、实验记录与边界进入课程报告。', to:'/report/workbench' },
  { step:'06', title:'独立训练', desc:'提交后反馈并返回对应实验修正。', to:'/practice/exam' },
]
const competitionPresets = [
  { title:'数字文旅升级', desc:'观察数字岗位与技能缺口。', to:{path:'/lab/chengyu-tourism',query:{preset:'digital'}} },
  { title:'结构性失业', desc:'观察贝弗里奇曲线外移。', to:{path:'/lab/unemployment',query:{preset:'structural'}} },
  { title:'AI岗位重构', desc:'比较短期替代与长期互补。', to:'/lab/ai-occupation' },
]
const classicLabs = [
  { chapter:'Ch.02', title:'劳动供给决策', desc:'收入效应、替代效应与劳动时间', to:'/lab/supply' },
  { chapter:'Ch.03', title:'劳动力需求', desc:'VMP、CES、替代效应与规模效应', to:'/lab/enterprise' },
  { chapter:'Ch.04', title:'人力资本投资', desc:'明瑟方程、教育投资与职业能力', to:'/lab/individual' },
  { chapter:'Ch.05', title:'劳动力流动', desc:'迁移净现值、回本时间与家庭约束', to:'/lab/migration' },
  { chapter:'Ch.06', title:'工资决定', desc:'工资分布、效率工资与补偿性差异', to:'/lab/wage' },
  { chapter:'Ch.07', title:'市场歧视', desc:'偏见模型、统计性歧视与Oaxaca分解', to:'/lab/discrimination' },
  { chapter:'Ch.08', title:'收入分配', desc:'洛伦兹曲线、基尼系数与再分配', to:'/lab/income-distribution' },
  { chapter:'Ch.09', title:'失业与匹配', desc:'DMP、贝弗里奇曲线与技能错配', to:'/lab/unemployment' },
  { chapter:'应用', title:'成渝文旅产业', desc:'岗位需求、技能缺口、薪酬与政策情景', to:'/lab/chengyu-tourism' },
]
</script>

<style scoped>
.home-console{min-height:100vh;color:#e2e8f0;background:#0f172a}.course-header{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:32px;max-width:1200px;margin:auto;padding:44px 28px 30px;border-bottom:1px solid rgba(148,163,184,.14)}.course-identity>span,.section-head>div>span,.workspace-band>div>span,.assessment-band>div>span{color:#67e8f9;font-size:11px;font-weight:850}.course-identity h1{max-width:900px;margin:8px 0 10px;color:#f8fafc;font-size:32px;line-height:1.2;letter-spacing:0}.course-identity p{max-width:760px;margin:0;color:#94a3b8;line-height:1.65}.course-status{display:grid;align-content:center;gap:4px;padding-left:22px;border-left:1px solid #263449}.course-status span,.course-status small{color:#64748b;font-size:11px}.course-status strong{font-size:18px;color:#f8fafc}
main{max-width:1200px;margin:auto;padding:26px 28px 70px}.learning-spaces,.competition-route,.classic-labs{margin-bottom:44px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:16px}.section-head h2,.workspace-band h2,.assessment-band h2{margin:5px 0 0;font-size:22px}.section-head>p{max-width:440px;margin:0;color:#7f8da3;font-size:13px;line-height:1.5}.space-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #263449;border-radius:8px;overflow:hidden}.space-item{min-width:0;display:grid;grid-template-rows:auto 1fr auto;gap:14px;min-height:190px;padding:18px;border-right:1px solid #263449;color:inherit;background:#111b2e;text-decoration:none}.space-item:last-child{border-right:0}.space-item:hover{background:#17243a}.space-index{color:#475569;font-size:12px;font-weight:900}.space-item strong{font-size:18px}.space-item p{margin:7px 0 0;color:#94a3b8;font-size:13px;line-height:1.55}.space-action{color:#7dd3fc;font-size:12px;font-weight:800}
.competition-route{padding:20px;border:1px solid rgba(245,158,11,.28);border-radius:8px;background:#111b2e}.competition-route .section-head>div>span{color:#fbbf24}.competition-route ol{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;padding:0;list-style:none}.competition-route li a{height:100%;display:grid;align-content:start;gap:6px;padding:12px;border:1px solid #263449;color:inherit;background:#0f172a;text-decoration:none}.competition-route li span{color:#fbbf24;font-size:10px}.competition-route li strong{font-size:13px}.competition-route li small{color:#94a3b8;line-height:1.45}.preset-row{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.preset-row a{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-left:3px solid #38bdf8;color:#e2e8f0;background:#152238;text-decoration:none;font-size:12px}.preset-row span{color:#94a3b8}
.evidence-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:44px}.evidence-strip article{display:grid;gap:7px;padding:13px;border-top:2px solid #334155;background:#111b2e}.evidence-strip strong{font-size:13px}.evidence-strip span{color:#94a3b8;font-size:12px;line-height:1.5}.workspace-band{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:30px;margin-bottom:44px;padding:22px;border:1px solid rgba(34,211,238,.25);border-radius:8px;background:#102033}.workspace-band p,.assessment-band p{max-width:780px;margin:8px 0 0;color:#94a3b8;font-size:13px;line-height:1.6}.workspace-band>a{padding:11px 15px;border:1px solid #0891b2;border-radius:6px;color:#ecfeff;background:#0e7490;text-decoration:none;font-weight:800;white-space:nowrap}
.lab-index{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lab-index a{min-height:118px;padding:15px;border:1px solid #263449;border-radius:6px;color:inherit;background:#111b2e;text-decoration:none}.lab-index a:hover{border-color:#475569}.lab-index span{color:#67e8f9;font-size:10px;font-weight:850}.lab-index strong{display:block;margin-top:8px;font-size:15px}.lab-index p{margin:6px 0 0;color:#94a3b8;font-size:12px;line-height:1.5}.assessment-band{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,480px);gap:28px;align-items:center;padding:22px;border:1px solid #263449;background:#111b2e}.assessment-band dl{display:grid;grid-template-columns:repeat(4,1fr);margin:0}.assessment-band dl div{padding:8px 12px;border-left:1px solid #263449;text-align:center}.assessment-band dt{color:#94a3b8;font-size:11px}.assessment-band dd{margin:5px 0 0;color:#f8fafc;font-size:20px;font-weight:900}
footer{display:grid;grid-template-columns:1fr 1fr auto;gap:28px;align-items:center;padding:22px max(28px,calc((100vw - 1144px)/2));border-top:1px solid #263449;color:#64748b;background:#0b1324;font-size:11px}footer div{display:grid;gap:3px}footer strong{color:#7dd3fc;font-size:14px}
@media(max-width:900px){.course-header{grid-template-columns:1fr;padding:28px 18px 22px}.course-status{padding:12px 0 0;border-top:1px solid #263449;border-left:0}.course-identity h1{font-size:25px}main{padding:20px 16px 70px}.section-head{display:block}.section-head>p{margin-top:8px}.space-grid{grid-template-columns:1fr}.space-item{grid-template-columns:36px 1fr auto;grid-template-rows:auto;min-height:0;border-right:0;border-bottom:1px solid #263449}.space-item:last-child{border-bottom:0}.competition-route ol,.evidence-strip{grid-template-columns:1fr}.preset-row,.lab-index{grid-template-columns:1fr}.workspace-band,.assessment-band{grid-template-columns:1fr}.assessment-band dl{grid-template-columns:repeat(2,1fr)}.assessment-band dl div{border:1px solid #263449}.workspace-band>a{text-align:center}footer{grid-template-columns:1fr;padding:22px 18px}.course-header p{font-size:13px}}
</style>
