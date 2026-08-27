const sharedBoundary = '这是教材机制或教学情景的条件比较，不能直接当作现实个体、企业或地区的精确预测。'

function task(prediction, adjustment, chart, records, explanation, submission) {
  return { prediction, adjustment, chart, records, explanation, submission }
}

function preset(id, label, shortLabel, purpose, question, expected, values, chart, boundary = sharedBoundary) {
  return { id, label, shortLabel, purpose, question, expected, boundary, values, chart }
}

export const CLASSROOM_EXPERIMENTS = Object.freeze({
  supply: {
    task: task('先判断工资上升后工作时数会增加还是减少。', '只调整“新工资率 W2”。', '查看“效应分解”页签中的替代效应与收入效应。', '记录初始工作时数、新均衡工作时数及其变化。', '按“前提—机制—结果—边界”解释哪一种效应占主导。', '保存实验记录，并提交一段不超过120字的条件性结论。'),
    presets: [
      preset('baseline','教材基准：工资上升、工时增加','教材基准','复现教材图2-10。','工资上升是否必然减少闲暇？','替代效应占主导，工作时数增加。',{scenarioMode:'moreWork',wageInitial:28,wageNew:64,nonLaborIncome:300,beta:.3},'effects'),
      preset('conflict','冲突情景：工资上升、工时减少','反常冲突','复现后弯供给。','为什么更高工资反而可能少工作？','收入效应超过替代效应，工作时数下降。',{scenarioMode:'lessWork',wageInitial:32,wageNew:130,nonLaborIncome:520,beta:.68},'effects'),
      preset('reality','现实流动：非劳动收入冲击','现实情景','讨论家庭收入与平台副业。','新增非劳动收入如何影响劳动供给？','预算线平移，闲暇增加、工作时数可能下降。',{scenarioMode:'income',wageInitial:36,wageNew:36,nonLaborIncome:260,nonLaborShock:500,beta:.46},'choice'),
    ],
  },
  enterprise: {
    task: task('先判断工资上涨后短期与长期雇佣量谁下降更多。', '只调整“新工资 W1”。', '查看“短期需求”和“长期调整”页签。', '记录短期雇佣量、长期雇佣量和长期需求弹性。', '用派生需求、替代效应和规模效应解释差异。', '保存记录，并写明模型成立的市场与技术前提。'),
    presets: [
      preset('baseline','教材基准：工资线移动','教材基准','观察VMP与工资线交点。','工资上涨如何改变最优雇佣量？','短期资本固定，雇佣量沿VMP曲线下降。',{activeTab:'short',wageInitial:36,wageNew:54,productPrice:1,capital:700,sigma:1.2},'short'),
      preset('conflict','冲突情景：价格扩张抵消成本','反常冲突','比较产品需求与工资成本。','工资上涨时用工一定下降吗？','产品价格与需求扩张可部分抵消成本效应。',{activeTab:'market',wageInitial:36,wageNew:48,productPrice:1.7,capital:1100,productDemandElasticity:1.8,marketFeedback:.9},'market'),
      preset('reality','AI时代：替代与互补并存','AI时代','拆解AI对劳动需求的多重效应。','高替代强度是否等于长期就业下降？','短期替代可能下降，需求扩张、互补和培训可改变长期方向。',{activeTab:'ai',aiProductivity:78,taskSubstitution:72,demandExpansion:68,complementarity:76,trainingInvestment:72},'ai'),
    ],
  },
  individual: {
    task: task('先判断增加教育年限能否在观察期内回本。', '只调整“年直接成本”。', '查看“收入路径”页签中的累计净现值曲线。', '记录回本年龄、内部收益率和净现值。', '用直接成本、机会成本、收益路径和贴现率解释。', '保存记录，并写明不能把情景值当成个人终身收入承诺。'),
    presets: [
      preset('baseline','教材基准：教育投资回报','教材基准','复现人力资本现金流。','教育成本何时被工资差覆盖？','累计NPV先下降后回升并可能穿过零线。',{activeChart:'income',edu:16,train_type:'一般培训 (通用技能)',disc:0,exp_peak:30,direct_cost:12000,discount_rate:.04},'income'),
      preset('conflict','冲突情景：高成本未必回本','反常冲突','识别教育投资风险。','教育越多是否必然净收益越高？','高直接成本和高贴现率会推迟回本或使NPV为负。',{activeChart:'income',edu:20,train_type:'一般培训 (通用技能)',disc:15,exp_peak:20,direct_cost:48000,discount_rate:.13},'income'),
      preset('reality','AI时代：能力组合投资','AI时代','从学历转向能力组合。','有限时间应优先补哪类能力？','数字、证据和持续学习能力的缺口会改变投资排序。',{activeChart:'capability'},'capability'),
    ],
  },
  migration: {
    task: task('先判断当前迁移方案是否值得执行、何时回本。', '只调整“月工资溢价”。', '查看“累计NPV”页签和零线交点。', '记录最终NPV、回本时间和最低月溢价门槛。', '按收益、一次性成本、持续成本和贴现解释。', '保存记录，并提交含家庭约束与不确定性边界的结论。'),
    presets: [
      preset('baseline','教材基准：青年迁移','教材基准','观察年龄与回收期。','年轻劳动者为何更可能迁移？','较长收益期使累计NPV更容易转正。',{migrateAge:25,wDiff:3000,cMove:20000,cPsych:3000,discountRate:.04,employmentProbability:.9,wageGrowth:.02,familyMigrate:false},'npv'),
      preset('conflict','冲突情景：高工资仍不迁移','反常冲突','识别隐性与家庭成本。','工资溢价较高为何仍可能不值得迁移？','高搬迁、适应和配偶损失可压低NPV。',{migrateAge:39,wDiff:6500,cMove:110000,cPsych:32000,discountRate:.1,employmentProbability:.65,wageGrowth:-.02,familyMigrate:true,spouseLoss:90000},'npv'),
      preset('reality','成渝流动：技能岗位机会','现实流动','讨论区域人才流动。','就业概率改善能否缩短回本期？','更高就业概率与工资增长改善净收益，但不消除生活成本。',{migrateAge:29,wDiff:4200,cMove:45000,cPsych:9000,discountRate:.05,employmentProbability:.95,wageGrowth:.04,familyMigrate:false},'cost'),
    ],
  },
  wage: {
    task: task('先判断企业工资高于市场参照工资后，努力与流失风险如何变化。', '只调整“企业月薪”。', '查看效率工资主图。', '记录努力指数、流失风险及工资差。', '用监督成本、机会成本和效率工资机制解释。', '保存记录，并说明工资提高不自动等于利润提高。'),
    presets: [
      preset('baseline','教材基准：效率工资','教材基准','观察工资与努力。','企业为何支付高于市场的工资？','工资溢价提高努力并降低流失风险。',{activeTab:'efficiency',referenceWage:6000,theoryWage:7200,effortSensitivity:.35},'histogram'),
      preset('conflict','冲突情景：高薪边际收益递减','反常冲突','识别效率工资边界。','工资越高，努力是否等比例增加？','努力改善存在边际递减，高薪并非无限有效。',{activeTab:'efficiency',referenceWage:5200,theoryWage:14500,effortSensitivity:.18},'histogram'),
      preset('reality','AI岗位：技能与地区溢价','AI时代','讨论人力资本回报。','教育与经验在不同地区如何映射到薪酬？','工资分布随教育、经验、行业和地区情景变化。',{activeTab:'mincer',education:18,experience:8,industry:'信息技术',region:'一线城市'},'decile'),
    ],
  },
  discrimination: {
    task: task('先判断偏见系数上升会如何影响感知工资与劳动需求。', '只调整“歧视系数 d”。', '查看贝克尔偏见主图。', '记录感知工资、相对劳动需求和效率损失。', '区分偏见机制、信息不完全与统计分解。', '保存记录，并明确“不可解释差距”不能单独证明违法歧视。'),
    presets: [
      preset('baseline','教材基准：雇主偏见','教材基准','复现贝克尔模型。','偏见如何形成非货币成本？','感知工资上升，相对需求下降并产生效率损失。',{mechanismMode:'becker',marketWage:6000,discPct:20,demandElasticity:.8}),
      preset('conflict','冲突情景：信号减少群体先验','反常冲突','比较个体信息与群体判断。','信息更充分能否减弱统计性歧视？','信号可靠度上升后，评价更依赖个体信号。',{mechanismMode:'statistical',individualSignal:82,groupPrior:45,signalReliability:.9}),
      preset('reality','AI招聘：算法先验风险','AI时代','审计算法招聘边界。','历史群体先验如何进入个体评价？','低信号可靠度使群体先验权重增大。',{mechanismMode:'statistical',individualSignal:76,groupPrior:48,signalReliability:.2}),
    ],
  },
  distribution: {
    task: task('先判断技能溢价上升会让洛伦兹曲线更靠近还是远离平等线。', '只调整“技能溢价”。', '查看“洛伦兹曲线”页签。', '记录市场Gini、政策后Gini和低收入组增益。', '用初次分配与再分配机制解释。', '保存记录，并说明教学分布不能替代现实居民数据。'),
    presets: [
      preset('baseline','教材基准：洛伦兹与基尼','教材基准','观察收入集中。','洛伦兹曲线如何对应基尼系数？','曲线越远离平等线，基尼系数越高。',{skillPremium:35,topShareShock:25,transferIntensity:20,educationEqualizer:15},'lorenz'),
      preset('conflict','冲突情景：转移改善但未逆转','反常冲突','比较市场冲击与再分配。','强转移能否完全抵消顶部集中？','政策后Gini下降，但高集中冲击仍可能保留较大差距。',{skillPremium:70,topShareShock:65,transferIntensity:55,educationEqualizer:5},'lorenz'),
      preset('reality','AI时代：技能溢价与教育机会','AI时代','讨论技术红利分配。','教育机会改善如何影响长期分配？','机会改善压低技能缺口，但不等同于即时现金转移。',{skillPremium:65,topShareShock:45,transferIntensity:20,educationEqualizer:55},'decile'),
    ],
  },
  unemployment: {
    task: task('先判断技能错配上升会使失业率和岗位空缺如何变化。', '只调整“技能错配指数”。', '查看“贝弗里奇曲线”页签。', '记录失业率、空缺率或匹配效率的基准与当前值。', '用岗位分离、搜寻摩擦和匹配效率解释。', '保存记录，并说明情景曲线不是地区失业率预测。'),
    presets: [
      preset('baseline','教材基准：存量与流量','教材基准','建立失业机制基准。','失业存量由哪些流量共同决定？','自然失业、错配和需求冲击共同改变失业存量。',{activeTab:'stock',naturalRate:5,mismatch:.8,aiRisk:30,demandShock:0},'stock'),
      preset('conflict','冲突情景：空缺与失业并存','反常冲突','解释结构性失业。','为什么岗位空缺多，失业仍可能高？','错配使贝弗里奇曲线外移。',{activeTab:'beveridge',mismatch:1.8,aiRisk:65,skillTraining:false},'beveridge'),
      preset('reality','AI时代：技能重塑','AI时代','比较技术冲击与培训。','培训能否完全消除AI冲击？','技能重塑改善匹配，但不能消除所有需求冲击。',{activeTab:'beveridge',mismatch:1.5,aiRisk:80,skillTraining:true},'beveridge'),
    ],
  },
  aiOccupation: {
    task: task('先判断所选岗位的AI暴露高是否意味着就业必然下降。', '只调整“任务替代强度”。', '查看“就业效应”页签。', '记录任务暴露指数、短期就业指数和长期就业指数。', '分别解释替代、规模、互补、新任务和成本效应。', '保存记录，并提交一段反驳“暴露度=失业概率”的论证。'),
    presets: [
      preset('baseline','教材基准：多效应并存','教材基准','建立任务分析基准。','为什么AI冲击不能只看替代？','短期替代与长期规模、互补效应方向可能不同。',{occupation:'人力资源专员',taskSubstitution:55,aiProductivity:50,demandExpansion:45,complementarity:60,trainingInvestment:50,aiCost:35},'effects'),
      preset('conflict','冲突情景：高暴露但长期扩张','反常冲突','挑战岗位消失直觉。','高替代情景下长期就业为何仍可能回升？','需求扩张、互补和新任务可超过替代效应。',{occupation:'人力资源专员',taskSubstitution:82,aiProductivity:85,demandExpansion:88,complementarity:82,trainingInvestment:78,aiCost:20},'effects'),
      preset('reality','现实岗位：低培训转型风险','现实情景','识别转型摩擦。','培训不足会怎样改变长期结果？','技能供给调整慢时，短期冲击更难转化为互补收益。',{occupation:'文旅活动策划',taskSubstitution:68,aiProductivity:72,demandExpansion:62,complementarity:55,trainingInvestment:15,aiCost:55},'skills'),
    ],
  },
  tourism: {
    task: task('先判断游客增长与数字化提高后，哪类岗位增长最快。', '只调整“数字化水平”。', '查看“岗位需求”页签的基准与情景柱。', '记录总岗位热度、增长最快岗位和最大技能缺口。', '用游客需求、技术互补、技能供给和薪酬吸引力解释。', '保存记录，并说明招聘样本与情景指数都不等于社会真实岗位总量。'),
    presets: [
      preset('baseline','教材基准：文旅需求派生','教材基准','连接产品需求与劳动需求。','游客增长如何派生岗位需求？','服务运营与活动策划随游客和活动强度上升。',{controlMode:'demand',activeChart:'demand',city:'成渝双城联动',sector:'会展节庆',touristGrowth:18,digitalLevel:62,eventIntensity:70,seasonality:'中'},'demand'),
      preset('conflict','冲突情景：游客下滑、数字岗上升','反常冲突','比较总量与结构。','游客减少时数字岗位能否继续增长？','总需求承压，但数字化投资可能提高数字岗位占比。',{controlMode:'demand',activeChart:'demand',city:'重庆',sector:'数字文博',touristGrowth:-8,digitalLevel:92,eventIntensity:35,seasonality:'高'},'demand'),
      preset('reality','成渝联动：组合政策','现实情景','比较区域政策组合。','培训与流动便利如何共同改善匹配？','组合政策同时改善技能缺口、匹配与吸引力。',{controlMode:'policy',activeChart:'policy',city:'成渝双城联动',sector:'智慧景区',touristGrowth:25,digitalLevel:85,eventIntensity:75,training:82,policy:'组合政策'},'policy'),
    ],
  },
})

export function classroomProfile(id) {
  return CLASSROOM_EXPERIMENTS[id]
}

export function applyPresetValues(preset, targets) {
  Object.entries(preset?.values || {}).forEach(([key, value]) => {
    const target = targets[key]
    if (target && typeof target === 'object' && 'value' in target) target.value = value
    else if (typeof target === 'function') target(value)
  })
}
