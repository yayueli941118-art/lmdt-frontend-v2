# LMDT 3.0

**AI劳动力市场分析、机制仿真与预测实验室**

LMDT 3.0 服务课程《劳动力市场分析与预测》，使用 Vue 3、Vite、Vue Router 与 ECharts，把“看市场—拆机制—推未来—做决策—验能力”组织为连续学习流程。项目支持 GitHub Pages 纯前端部署，不依赖后端，不抓取招聘平台，也不把规则反馈伪装成大模型评价。

## 教学问题

- 静态教材图难以同时呈现参数变化、均衡移动和经济含义。
- 学生容易记住结论，却说不清前提、机制和不能推出的结论。
- 课程作业常缺少规范样本、统计证据、模型证据和反事实比较。
- 教师需要在不收集身份信息的前提下汇总实验步骤完成情况。

平台采用“数据质量 → 指标计算 → 机制仿真 → 独立预测 → 回测比较 → 情景推演 → 报告证据 → 能力训练”的学习闭环。规则反馈是透明量规，不伪装成 AI 评价。

## 教材与功能

| 教材主题 | 页面 | 核心实现 |
| --- | --- | --- |
| 市场数据 | `/analysis/market` | CSV模板、质量阻断、指标公式、来源与边界 |
| 基础预测 | `/forecast/basic` | 朴素、移动平均、线性、CAGR、回测与情景 |
| AI岗位任务 | `/lab/ai-occupation` | 任务拆解、暴露、替代/规模/互补/新任务效应 |
| 独立能力训练 | `/practice/exam` | 固定种子、100分能力蓝图、提交后反馈 |
| 第2章 劳动供给 | `/lab/supply` | 图2-9至图2-11、固定 Stone-Geary 偏好、Hicks 补偿 |
| 第3章 劳动需求 | `/lab/enterprise` | CES、MPL、VMP、市场反馈、长期成本最小化、需求弹性 |
| 第4章 人力资本 | `/lab/individual` | 年龄现金流、直接/机会成本、NPV、IRR、培训分担 |
| 第5章 劳动力流动 | `/lab/migration` | 贴现迁移 NPV、就业概率、家庭成本、敏感性 |
| 第6章 工资 | `/lab/wage` | 效率工资、补偿性差异、激励工资、合成工资分布 |
| 第7章 歧视 | `/lab/discrimination` | Becker、统计性歧视、真实 OLS 的 Oaxaca-Blinder |
| 第8章 收入分配 | `/lab/income-distribution` | Lorenz、Gini、十分位、预算平衡再分配 |
| 第9章 失业 | `/lab/unemployment` | 存量流量、搜寻、DMP、Beveridge、最低工资情景 |
| 报告决策 | `/report/workbench` | 招聘样本校验、统计、实验记录、报告与匿名汇总 |

逐图审计见 [教材对齐](docs/textbook-alignment.md)，模型公式和边界见 [模型方法](docs/model-methodology.md)。

## 技术架构

```text
Vue views/components
        ↓
src/lib/api.js 运行模式与来源标识
        ↓
src/lib/offlineApi.js 路由适配
        ↓
src/domain/* 独立可测试领域模型
        ↓
localStorage 实验记录/样本/报告
```

页面按路由懒加载；ECharts 与框架依赖独立分块。`offlineApi.js` 不再堆放公式。

## 运行与数据模式

- `VITE_API_MODE=offline`：浏览器内教学模型，本地开发和 GitHub Pages 的默认模式。
- `VITE_API_MODE=online`：只访问 `VITE_API_BASE_URL`；失败时明确报错，不伪装成功。
- `VITE_API_MODE=auto`：先访问在线接口，失败后明确降级并标注离线来源。

所有结果必须明确属于“历史观测数据”“用户导入数据”“教学示例数据”“教材机制模拟”“统计预测结果”“情景推演结果”或“规则反馈”。招聘广告数量不等于社会真实岗位需求；任务暴露不等于岗位消失概率；情景上下界不等于统计置信区间。

## 三种模式

- 教学版：`/?mode=teaching#/`，含学习支架和投影显示开关。
- 竞赛版：`/?mode=competition#/`，含 5 分钟导览和三个预设情景。
- 匿名运行预览：`/?mode=anonymous#/`。
- 匿名独立构建：`npm run build:anonymous`，构建后扫描禁用身份字符串。

真正匿名还需要中性域名和中性发布账号；代码无法隐藏 GitHub Pages URL 中的账号名。

## 本地运行

要求 Node.js 20 或更高版本。

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

访问 `http://127.0.0.1:5173/`。项目继续使用 hash 路由。

## 测试与构建

```bash
npm test
npm run test:e2e
npm run build
npm run build:anonymous
```

Vitest 验证数学恒等式、数据质量、预测误差、固定题库、滑块刻度、组件与路由契约；Playwright 验证核心路由、预测门禁、报告记录、三种模式和多种视口。CI 执行安装、单元测试、生产构建、匿名构建和浏览器测试。

## 隐私与存储

招聘样本、实验记录和报告草稿默认只存于当前浏览器 `localStorage`。30 名学生同时访问静态站点时，各浏览器数据彼此隔离。跨设备通过学生主动导出的 JSON 作业数据包完成；教师汇总不会推断或保存学生身份。

## 浏览器与部署

建议使用最近两个主要版本的 Chrome、Edge、Firefox 或 Safari。GitHub Pages 构建由 `.github/workflows/deploy-pages.yml` 完成；未获授权时不应直接合并或部署主分支。

## 知识产权与依赖

教材图号用于课程知识点映射，系统不分发教材 PDF。Vue、Vue Router、Vite、Axios、ECharts、vue-echarts、Vitest 和 Playwright 的许可证以各项目声明为准。用户导入招聘样本时应保留采集日期、平台、链接或截图编号，并遵守平台条款与个人信息保护要求。

更多资料：

- [数据方法](docs/data-methodology.md)
- [教学设计](docs/teaching-design.md)
- [竞赛演示](docs/competition-demo.md)
- [匿名构建](docs/anonymous-build.md)
- [操作手册](docs/operation-manual.md)
- [测试报告](docs/test-report.md)
- [LMDT 3.0 方法与边界](docs/lmdt-3-methodology.md)
