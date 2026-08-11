# 测试报告

## 环境

- 日期：2026-08-11
- Node.js：v26.3.0（CI 使用 Node.js 20）
- 构建工具：Vite 8
- 单元测试：Vitest
- 浏览器测试：Playwright Chromium

## 自动测试

| 命令 | 当前结果 | 覆盖 |
| --- | --- | --- |
| `npm test` | 18 个文件、72 项通过 | 数学恒等式、数据质量、预测、AI任务、题库、滑块、组件、路由 |
| `npm run test:e2e` | 86 项通过 | 核心路由、实时调参、预测门禁、能力训练、三种模式、六种视口 |
| `npm run build` | 通过 | 教学/竞赛运行构建 |
| `npm run build:anonymous` | 通过，扫描 40 个文本资源 | 匿名编译与禁用字符串扫描 |

## 数学验收

- 劳动供给：预算恒等式、Hicks 等效用、效应加总、偏好固定。
- 劳动需求：CES MPL、`VMP=P*MPL`、短期交点、长期 MRTS、等产量/等成本一致。
- 人力资本与迁移：贴现 NPV、IRR 求根、成本/培训/贴现敏感性。
- Oaxaca：OLS 输入计算、两重/三重恒等式、换组方向。
- 收入分配：Gini 边界、Lorenz 单调端点、再分配收支平衡。
- DMP/Beveridge：概率边界、效率提高降低稳态失业、周期与结构冲击区分。
- 文旅校准：小样本拒绝、合格样本参数转换、输出相对热度而非岗位总量。
- 数据指标：缺失期、重复期、负值、分母为零和口径冲突能够阻断或警告。
- 基础预测：四种方法、滚动回测、MAE/RMSE/MAPE和零实际值处理。
- AI岗位：任务占比归一、任务暴露边界及替代/规模/互补/新任务效应。
- 能力训练：固定种子、100分蓝图、多选/数值评分和错误维度记录。

## 浏览器与视口

已验证 1280x720、1366x768、1440x900、1920x1080、768x1024、390x844。核心页面 `scrollWidth-clientWidth <= 1`，未检测到水平溢出。Playwright 还验证教学、竞赛、匿名三种运行逻辑、预测前置判断、AI任务记录和报告工作台读取。

## 构建体积

本轮生产构建的入口脚本约 112 KB（gzip约43 KB）；报告工作台约44 KB（gzip约15 KB）；ECharts共享懒加载块约715 KB（gzip约243 KB）。ECharts共享块仍超过500 KB警告阈值，但按路由延迟加载，不阻塞本轮功能和同屏验收。

## 尚存边界

- 教材扫描件部分章节缺少稳定文本层，图号映射以已视觉核验内容为准。
- 领域默认参数不是地区实证估计。
- 成渝不确定性是教学型区间，不是抽样置信区间。
- ECharts 共享图表块仍可继续按图表类型细分，但当前不阻塞首屏。

## 模式截图

- `docs/screenshots/teaching-home.png`
- `docs/screenshots/teaching-home-mobile.png`
- `docs/screenshots/competition-home.png`
- `docs/screenshots/competition-home-mobile.png`
- `docs/screenshots/anonymous-home.png`
- `docs/screenshots/anonymous-home-mobile.png`
