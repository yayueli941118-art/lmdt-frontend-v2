# 测试报告

## 环境

- 日期：2026-07-28
- Node.js：v26.3.0（CI 使用 Node.js 20）
- 构建工具：Vite 8
- 单元测试：Vitest
- 浏览器测试：Playwright Chromium

## 自动测试

| 命令 | 当前结果 | 覆盖 |
| --- | --- | --- |
| `npm test` | 12 个文件、51 项通过 | 数学恒等式、滑块、组件、路由 |
| `npm run test:e2e` | 8 项通过 | 核心路由、调参/恢复、保存记录、三种模式、响应式 |
| `npm run build` | 通过 | 教学/竞赛运行构建 |
| `npm run build:anonymous` | 通过，扫描 32 个文本资源 | 匿名编译与禁用字符串扫描 |

## 数学验收

- 劳动供给：预算恒等式、Hicks 等效用、效应加总、偏好固定。
- 劳动需求：CES MPL、`VMP=P*MPL`、短期交点、长期 MRTS、等产量/等成本一致。
- 人力资本与迁移：贴现 NPV、IRR 求根、成本/培训/贴现敏感性。
- Oaxaca：OLS 输入计算、两重/三重恒等式、换组方向。
- 收入分配：Gini 边界、Lorenz 单调端点、再分配收支平衡。
- DMP/Beveridge：概率边界、效率提高降低稳态失业、周期与结构冲击区分。
- 文旅校准：小样本拒绝、合格样本参数转换、输出相对热度而非岗位总量。

## 浏览器与视口

已验证 1366x768、1440x900、1920x1080、768x1024、390x844。核心页面 `scrollWidth-clientWidth <= 1`，未检测到水平溢出。Playwright 还验证教学、竞赛、匿名三种运行逻辑和报告工作台记录读取。

## 构建体积

本轮生产构建的首屏入口约 80 KB（gzip 约 30 KB）；报告工作台约 43 KB（gzip 约 15 KB）；ECharts 共享懒加载块约 666 KB（gzip 约 228 KB）。相较审计前主 JS 约 1.31 MB、gzip 约 446 KB，首屏框架与图表依赖已拆分。ECharts 共享块仍超过 500 KB 警告阈值，但不会随首页入口一起执行；后续可继续按图表类型拆分。

## 尚存边界

- 教材扫描件部分章节缺少稳定文本层，图号映射以已视觉核验内容为准。
- 领域默认参数不是地区实证估计。
- 成渝不确定性是教学型区间，不是抽样置信区间。
- ECharts 共享图表块仍可继续按图表类型细分，但当前不阻塞首屏。

## 模式截图

- `docs/screenshots/teaching-home.png`
- `docs/screenshots/competition-home.png`
- `docs/screenshots/anonymous-home.png`
