<template>
  <div class="home-console">
    <header class="hero-stage" :class="`hero-stage--${appMode}`">
      <img
        class="hero-scene"
        src="../assets/lmdt-hero-v3.webp"
        alt="成渝城市群中教育、产业与人才流动共同构成的劳动力市场数字孪生场景"
        width="1672"
        height="941"
        fetchpriority="high"
      />
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-frame" aria-hidden="true"></div>

      <div class="hero-content">
        <div class="hero-kicker">
          <span class="signal-dot" aria-hidden="true"></span>
          <span>{{ appProfile.heroBadge }}</span>
          <strong>{{ modeName }}</strong>
        </div>

        <p class="hero-brand">{{ appProfile.brandShort }} · {{ appProfile.brandFull }}</p>
        <h1>
          <span>{{ appProfile.titleLines[0] }}</span>
          <span>{{ appProfile.titleLines[1] }}</span>
        </h1>
        <p class="hero-desc">{{ heroCopy.desc }}</p>

        <div class="hero-actions" aria-label="首页主要操作">
          <router-link :to="heroCopy.primaryTo" class="hero-primary">
            {{ heroCopy.primaryLabel }}
            <span aria-hidden="true">→</span>
          </router-link>
          <router-link :to="heroCopy.secondaryTo" class="hero-secondary">
            {{ heroCopy.secondaryLabel }}
          </router-link>
        </div>

        <dl class="hero-metrics" aria-label="系统内容概览">
          <div><dt>{{ appProfile.moduleCount }}</dt><dd>实验与分析模块</dd></div>
          <div><dt>{{ appProfile.chapterCount }}</dt><dd>教材章节映射</dd></div>
          <div><dt>3</dt><dd>教学与展示模式</dd></div>
        </dl>
      </div>

      <nav class="hero-route" aria-label="课程学习主线">
        <router-link v-for="(space,index) in learningSpaces" :key="space.to" :to="space.to">
          <span>0{{ index + 1 }}</span>
          <strong>{{ space.title }}</strong>
          <small>{{ space.routeDesc }}</small>
        </router-link>
      </nav>
    </header>

    <main>
      <section class="learning-spaces" aria-labelledby="spaces-title">
        <div class="section-head">
          <div><span>从这里开始</span><h2 id="spaces-title">五个连续学习空间</h2></div>
          <p>先建立证据，再解释机制；先独立判断，再查看模型结果。</p>
        </div>
        <div class="space-grid">
          <router-link v-for="(space,index) in learningSpaces" :key="space.to" :to="space.to" class="space-item">
            <span class="space-index">0{{ index + 1 }}</span>
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

      <section v-if="isCompetition || isAnonymous" class="evidence-strip" aria-label="课程学习闭环">
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
        <div><span>{{ appProfile.course.assessmentType }}课 · {{ appProfile.course.hours.total }}学时</span><h2 id="assessment-title">AI可辅助练习，综合实践检验独立能力</h2><p>理论 {{ appProfile.course.hours.theory }} 学时、实践 {{ appProfile.course.hours.practice }} 学时。训练记录仅供学习诊断，不自动替代教师评价。</p></div>
        <dl><div v-for="item in appProfile.course.assessments" :key="item.id"><dt>{{ item.label }}</dt><dd>{{ item.weight }}%</dd></div></dl>
      </section>
    </main>

    <footer><div><strong>{{ appProfile.brandShort }}</strong><span>{{ appProfile.footerCourse }}</span></div><div v-if="!isAnonymous"><span>{{ appProfile.footerSchool }}</span><span>{{ appProfile.footerAuthor }}</span></div><small>{{ appProfile.footerPowered }}</small></footer>
  </div>
</template>

<script setup>
import { appMode, appProfile, isAnonymous, isCompetition, showcaseSteps } from '../config/appMode'

const modeName = { teaching: '教学版', competition: '竞赛展示版', anonymous: '匿名版' }[appMode]
const heroCopy = {
  teaching: {
    desc: '把市场数据、教材曲线与岗位变化放进同一套可操作实验，让每一次判断都能找到数据、模型和记录。',
    primaryLabel: '开始课程实验',
    primaryTo: '/analysis/market',
    secondaryLabel: '进入报告工作台',
    secondaryTo: '/report/workbench',
  },
  competition: {
    desc: '沿着“看市场—拆机制—推未来—做决策—验能力”的学习主线，现场展示数据证据、机制解释、预测回测与学习评价。',
    primaryLabel: '启动5分钟展示',
    primaryTo: '/analysis/market',
    secondaryLabel: '查看AI岗位实验',
    secondaryTo: '/lab/ai-occupation',
  },
  anonymous: {
    desc: '从市场数据出发，连接劳动经济学机制、基础预测与岗位任务分析，形成可操作、可解释、可复核的学习过程。',
    primaryLabel: '进入实验系统',
    primaryTo: '/analysis/market',
    secondaryLabel: '查看学习主线',
    secondaryTo: '/lab/enterprise',
  },
}[appMode]

const learningSpaces = [
  { title:'看市场', routeDesc:'数据与口径', desc:'导入时间序列，检查质量、口径与指标边界。', to:'/analysis/market' },
  { title:'拆机制', routeDesc:'曲线与均衡', desc:'让供给、需求、工资和匹配曲线随参数变化。', to:'/lab/enterprise' },
  { title:'推未来', routeDesc:'预测与回测', desc:'先判断后回测，比较基础预测方法和人为情景。', to:'/forecast/basic' },
  { title:'做决策', routeDesc:'证据与报告', desc:'汇总样本、实验和预测，生成课程报告证据链。', to:'/report/workbench' },
  { title:'验能力', routeDesc:'独立作答', desc:'用固定蓝图训练计算、图表、机制和AI错误识别。', to:'/practice/exam' },
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
.home-console{min-height:100vh;color:#e5edf7;background:#0b1220}.hero-stage{position:relative;height:min(760px,calc(100dvh - 86px));min-height:620px;overflow:hidden;isolation:isolate;background:#08111f}.hero-scene{position:absolute;inset:0;z-index:-4;width:100%;height:100%;object-fit:cover;object-position:center 54%;animation:scene-breathe 18s ease-in-out infinite alternate}.hero-shade{position:absolute;inset:0;z-index:-3;background:rgba(3,9,18,.5)}.hero-frame{position:absolute;inset:18px;z-index:-1;border:1px solid rgba(190,226,236,.2);border-bottom:0;pointer-events:none}.hero-frame::before,.hero-frame::after{content:"";position:absolute;width:54px;height:2px;top:-1px;background:#67e8f9}.hero-frame::before{left:0}.hero-frame::after{right:0;background:#f5b849}.hero-content{width:min(1180px,calc(100% - 56px));height:100%;margin:auto;padding:clamp(58px,9vh,104px) 0 142px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.hero-kicker{display:flex;align-items:center;gap:10px;color:#d8f4f5;font-size:12px;font-weight:760}.hero-kicker strong{padding-left:10px;border-left:1px solid rgba(226,232,240,.35);color:#f5c267}.signal-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 5px rgba(52,211,153,.15)}.hero-brand{margin:24px 0 4px;color:#6ee7f2;font-size:14px;font-weight:900;letter-spacing:0}.hero-content h1{margin:0;max-width:900px;color:#fff;font-size:clamp(42px,5.1vw,76px);font-weight:900;line-height:1.08;letter-spacing:0;text-shadow:0 4px 28px rgba(0,0,0,.7)}.hero-content h1 span{display:block}.hero-content h1 span:last-child{margin-top:8px;color:#dff8f5;font-size:.59em;font-weight:720}.hero-desc{max-width:700px;margin:22px 0 0;color:#d6e3ee;font-size:17px;line-height:1.75;text-shadow:0 2px 14px rgba(0,0,0,.75)}.hero-actions{display:flex;gap:12px;margin-top:28px}.hero-actions a{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:18px;padding:0 19px;border-radius:6px;color:#f8fafc;text-decoration:none;font-size:14px;font-weight:850;transition:transform .2s,border-color .2s,background .2s}.hero-actions a:hover{transform:translateY(-2px)}.hero-primary{border:1px solid #5ee4ec;background:#087f8c;box-shadow:0 10px 32px rgba(8,127,140,.28)}.hero-primary:hover{background:#0b919e}.hero-secondary{border:1px solid rgba(226,232,240,.46);background:rgba(7,15,28,.42);backdrop-filter:blur(8px)}.hero-secondary:hover{border-color:#f5c267;background:rgba(7,15,28,.68)}.hero-metrics{display:flex;gap:0;margin:32px 0 0}.hero-metrics div{display:grid;grid-template-columns:auto auto;align-items:end;gap:8px;padding:0 22px;border-left:1px solid rgba(226,232,240,.26)}.hero-metrics div:first-child{padding-left:0;border-left:0}.hero-metrics dt{color:#fff;font-size:24px;font-weight:900;line-height:1}.hero-metrics dd{margin:0;color:#b5c5d4;font-size:11px}.hero-route{position:absolute;left:50%;bottom:0;width:min(1180px,calc(100% - 56px));display:grid;grid-template-columns:repeat(5,1fr);transform:translateX(-50%);border-top:1px solid rgba(209,236,240,.32);background:rgba(4,11,21,.74);backdrop-filter:blur(14px)}.hero-route a{min-width:0;display:grid;grid-template-columns:31px auto;grid-template-rows:auto auto;column-gap:10px;min-height:108px;padding:20px 17px;border-right:1px solid rgba(209,236,240,.18);color:#f8fafc;text-decoration:none;transition:background .2s}.hero-route a:last-child{border-right:0}.hero-route a:hover{background:rgba(30,188,197,.15)}.hero-route span{grid-row:1/3;color:#55dce6;font-size:11px;font-weight:900}.hero-route strong{font-size:15px}.hero-route small{margin-top:6px;color:#98aabd;font-size:11px}.hero-stage--competition .hero-kicker strong{color:#ffd47a}.hero-stage--competition .hero-primary{border-color:#ffd47a;background:#9b6408;box-shadow:0 10px 32px rgba(155,100,8,.3)}.hero-stage--competition .hero-primary:hover{background:#b3740b}.hero-stage--anonymous .hero-brand{color:#c5edf0}
main{max-width:1200px;margin:auto;padding:36px 28px 70px}.learning-spaces,.competition-route,.classic-labs{margin-bottom:44px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:16px}.section-head>div>span,.workspace-band>div>span,.assessment-band>div>span{color:#67e8f9;font-size:11px;font-weight:850}.section-head h2,.workspace-band h2,.assessment-band h2{margin:5px 0 0;font-size:22px}.section-head>p{max-width:440px;margin:0;color:#8fa0b5;font-size:13px;line-height:1.5}.space-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #263449;border-radius:8px;overflow:hidden}.space-item{min-width:0;display:grid;grid-template-rows:auto 1fr auto;gap:14px;min-height:190px;padding:18px;border-right:1px solid #263449;color:inherit;background:#111b2e;text-decoration:none}.space-item:last-child{border-right:0}.space-item:hover{background:#17243a}.space-index{color:#5f7188;font-size:12px;font-weight:900}.space-item strong{font-size:18px}.space-item p{margin:7px 0 0;color:#a5b4c7;font-size:13px;line-height:1.55}.space-action{color:#7dd3fc;font-size:12px;font-weight:800}.competition-route{padding:20px;border:1px solid rgba(245,158,11,.28);border-radius:8px;background:#111b2e}.competition-route .section-head>div>span{color:#fbbf24}.competition-route ol{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;padding:0;list-style:none}.competition-route li a{height:100%;display:grid;align-content:start;gap:6px;padding:12px;border:1px solid #263449;color:inherit;background:#0f172a;text-decoration:none}.competition-route li span{color:#fbbf24;font-size:10px}.competition-route li strong{font-size:13px}.competition-route li small{color:#a5b4c7;line-height:1.45}.preset-row{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.preset-row a{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-left:3px solid #38bdf8;color:#e2e8f0;background:#152238;text-decoration:none;font-size:12px}.preset-row span{color:#a5b4c7}.evidence-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:44px}.evidence-strip article{display:grid;gap:7px;padding:13px;border-top:2px solid #334155;background:#111b2e}.evidence-strip strong{font-size:13px}.evidence-strip span{color:#a5b4c7;font-size:12px;line-height:1.5}.workspace-band{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:30px;margin-bottom:44px;padding:22px;border:1px solid rgba(34,211,238,.25);border-radius:8px;background:#102033}.workspace-band p,.assessment-band p{max-width:780px;margin:8px 0 0;color:#a5b4c7;font-size:13px;line-height:1.6}.workspace-band>a{padding:11px 15px;border:1px solid #0891b2;border-radius:6px;color:#ecfeff;background:#0e7490;text-decoration:none;font-weight:800;white-space:nowrap}.lab-index{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lab-index a{min-height:118px;padding:15px;border:1px solid #263449;border-radius:6px;color:inherit;background:#111b2e;text-decoration:none}.lab-index a:hover{border-color:#475569}.lab-index span{color:#67e8f9;font-size:10px;font-weight:850}.lab-index strong{display:block;margin-top:8px;font-size:15px}.lab-index p{margin:6px 0 0;color:#a5b4c7;font-size:12px;line-height:1.5}.assessment-band{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,480px);gap:28px;align-items:center;padding:22px;border:1px solid #263449;background:#111b2e}.assessment-band dl{display:grid;grid-template-columns:repeat(4,1fr);margin:0}.assessment-band dl div{padding:8px 12px;border-left:1px solid #263449;text-align:center}.assessment-band dt{color:#a5b4c7;font-size:11px}.assessment-band dd{margin:5px 0 0;color:#f8fafc;font-size:20px;font-weight:900}footer{display:grid;grid-template-columns:1fr 1fr auto;gap:28px;align-items:center;padding:22px max(28px,calc((100vw - 1144px)/2));border-top:1px solid #263449;color:#718198;background:#08101d;font-size:11px}footer div{display:grid;gap:3px}footer strong{color:#7dd3fc;font-size:14px}
@keyframes scene-breathe{from{transform:scale(1)}to{transform:scale(1.035)}}
.hero-scene{animation:none}
@media(max-width:900px){.hero-stage{height:min(690px,calc(100dvh - 86px));min-height:580px}.hero-scene{object-position:61% center}.hero-frame{inset:10px}.hero-content{width:calc(100% - 36px);padding:44px 0 112px;justify-content:center}.hero-kicker{font-size:10px}.hero-kicker strong{padding-left:7px}.hero-brand{margin-top:18px;font-size:12px}.hero-content h1{font-size:clamp(34px,10vw,50px);line-height:1.12}.hero-content h1 span:last-child{font-size:.54em}.hero-desc{max-width:560px;margin-top:17px;font-size:14px;line-height:1.65}.hero-actions{width:100%;margin-top:21px}.hero-actions a{min-height:44px;flex:1;padding:0 12px;font-size:12px}.hero-metrics{margin-top:24px}.hero-metrics div{display:block;padding:0 13px}.hero-metrics dt{font-size:20px}.hero-metrics dd{margin-top:5px;font-size:9px}.hero-route{width:calc(100% - 20px);grid-template-columns:repeat(5,1fr)}.hero-route a{display:grid;grid-template-columns:1fr;grid-template-rows:auto auto;gap:5px;min-height:84px;padding:13px 4px;text-align:center}.hero-route span{grid-row:auto;font-size:9px}.hero-route strong{font-size:11px}.hero-route small{display:none}main{padding:28px 16px 70px}.section-head{display:block}.section-head>p{margin-top:8px}.space-grid{grid-template-columns:1fr}.space-item{grid-template-columns:36px 1fr auto;grid-template-rows:auto;min-height:0;border-right:0;border-bottom:1px solid #263449}.space-item:last-child{border-bottom:0}.competition-route ol,.evidence-strip{grid-template-columns:1fr}.preset-row,.lab-index{grid-template-columns:1fr}.workspace-band,.assessment-band{grid-template-columns:1fr}.assessment-band dl{grid-template-columns:repeat(2,1fr)}.assessment-band dl div{border:1px solid #263449}.workspace-band>a{text-align:center}footer{grid-template-columns:1fr;padding:22px 18px}.hero-stage--anonymous .hero-content h1{font-size:clamp(31px,9vw,46px)}}
@media(max-width:430px){.hero-stage{min-height:560px}.hero-content{padding-top:32px}.hero-desc{max-width:340px}.hero-metrics div:nth-child(3){display:none}.hero-actions{gap:8px}.hero-actions a{font-size:11px}.hero-route strong{font-size:10px}}
@media(prefers-reduced-motion:reduce){.hero-scene{animation:none}}
</style>
