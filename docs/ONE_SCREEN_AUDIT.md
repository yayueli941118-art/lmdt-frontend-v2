# 实验页面“一屏调参、一屏观察”审计

## 审计口径

- 改造前后均检查 `1280x720` 与 `1366x768`。
- 自动验收同时覆盖 `1440x900`、`1920x1080`、`768x1024` 与 `390x844`。
- 参数数量包含情景、模式或政策选择；动态图数量按学生可切换的分析视角统计。
- 桌面端要求页面级纵向滚动与水平溢出均为 0；移动端由上方观察区和下方独立滚动参数区组成。

## 同屏审计表

| 路由 | 参数数量 | 动态图数量 | 改造前是否需滚动 | 改造布局 | 验收结果 |
| --- | ---: | ---: | --- | --- | --- |
| `/lab/supply` | 8（含情景） | 3 | 是，最大 2265px | 左侧参数；预算均衡、效应分解、供给曲线页签 | 通过，主图最小 412px |
| `/lab/enterprise` | 15（含AI情景） | 5 主图视角，另 2 项更多分析 | 是，最大 2430px | 左侧参数；短期、市场、长期、弹性、AI情景页签 | 通过，主图最小 392px |
| `/lab/factor-allocation` | 15（含AI情景） | 5 主图视角，另 2 项更多分析 | 是，最大 2430px | 复用企业需求工作区，默认进入长期要素配置 | 通过，主图最小 392px |
| `/lab/individual` | 21（跨教育回报与能力投资） | 2 | 是，入场页后仍需滚动 48px | 教育回报与13项职业能力页签；左侧参数内部滚动 | 通过，主图最小 411px |
| `/lab/migration` | 9（含家庭情景） | 3 | 是，最大 1320px | 左侧决策参数；NPV、成本收益、敏感性页签 | 通过，主图最小 404px |
| `/lab/wage` | 12（含专题与行业地区） | 5 个专题视角 | 是，最大 1110px | 左侧专题与参数；当前机制主图固定在右侧 | 通过，主图最小 433px |
| `/lab/discrimination` | 9（含机制与分解口径） | 3 | 是，最大 1051px | 左侧机制切换；主图与四项指标持续可见 | 通过，主图最小 433px |
| `/lab/income-distribution` | 4 | 2 | 是，最大 1282px | 左侧政策参数；洛伦兹曲线与十分位结构页签 | 通过，主图最小 410px |
| `/lab/unemployment` | 18（跨 5 个专题） | 5 | 是，最大 1371px | 参数面板不动；存量、搜寻、DMP、贝弗里奇、最低工资页签 | 通过，主图最小 397px |
| `/lab/macro` | 3（含政策组合） | 1 | 是，最大 1000px | 左侧冲击与政策；贝弗里奇主图和诊断指标同屏 | 通过，主图最小 446px |
| `/lab/chengyu-tourism` | 17（跨 4 组参数） | 7 | 是，最大 3722px | 左侧按需求、技能、薪酬、政策分组；7 个主图页签 | 通过，主图最小 401px |
| `/lab/ai-occupation` | 7（另有10项任务表） | 3 | 新增页面 | 左侧AI机制参数；任务结构、就业效应、技能缺口页签 | 通过，主图最小 404px |
| `/analysis/market` | 2（数据源与指标） | 1 | 新增页面 | 左侧数据入口与质量卡；右侧趋势和指标固定可见 | 通过，桌面无页面滚动 |
| `/forecast/basic` | 7（含方法与情景） | 1 | 新增页面 | 先判断门禁；解锁后左侧参数、右侧历史/回测/情景主图 | 通过，桌面无页面滚动 |
| `/practice/exam` | 题组导航 | 题目与反馈主区 | 新增页面 | 左侧题目导航；右侧独立作答，提交后才显示反馈 | 通过，答案门禁有效 |

## 自动验收结果

- LMDT 3.0动态实验桌面审计：24/24 路由视口组合通过。
- 页面级纵向滚动最大值：0px。
- 页面级水平溢出最大值：0px。
- 桌面端主图高度范围：392px 至 495px。
- Playwright 覆盖：4 个桌面视口、2 个移动/平板视口、12 个动态实验路由；另验收数据、预测和能力训练页。
- 验证内容：拖动中主图可见、参数和指标联动、页签状态保持、抽屉开关后图表可用、画布未越界。
- 未通过页面清单：无。

## 截图与原始数据

- 改造前截图：`docs/screenshots/one-screen/before/`
- 改造后截图：`docs/screenshots/one-screen/after/`
- 每个目录包含 11 个实验路由在 `1280x720` 和 `1366x768` 下的 22 张截图。
- 改造前原始数据：`docs/one-screen-audit-before.json`
- 改造后原始数据：`docs/one-screen-audit-after.json`
- LMDT 3.0新增页面原始数据：`docs/one-screen-audit-lmdt3-final.json`

示例：

- [劳动供给改造前 1280x720](screenshots/one-screen/before/supply-1280x720.png)
- [劳动供给改造后 1280x720](screenshots/one-screen/after/supply-1280x720.png)
- [成渝文旅改造前 1280x720](screenshots/one-screen/before/chengyu-tourism-1280x720.png)
- [成渝文旅改造后 1280x720](screenshots/one-screen/after/chengyu-tourism-1280x720.png)
- [成渝文旅移动端 390x844](screenshots/one-screen/chengyu-tourism-mobile-390x844.png)
- [AI岗位任务桌面端 1280x720](screenshots/one-screen/lmdt3-final/ai-occupation-1280x720.png)
- [AI岗位任务移动端 390x844](screenshots/one-screen/lmdt3-final/ai-occupation-mobile-390x844.png)
