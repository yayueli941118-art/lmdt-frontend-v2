# LMDT 2.0 — 高级教学指挥舱

> **LMDT (Labor Market Digital Twin) 2.0 Frontend** • Vue 3 + ECharts 赛博学术风

## 职责边界

本仓库**仅负责前端 UI 渲染**，不包含业务计算逻辑：

- 📊 **数据可视化**：ECharts 驱动的贝弗里奇曲线、NPV 双线竞速等核心图表
- 🎮 **交互体验**：参数滑块、挑战任务卡、前测拦截、沙盘推演面板
- 🌐 **状态管理**：Pinia 全局状态 + 实验会话管理
- 🔌 **后端对接**：通过 RESTful API 与 `lmdt-backend-v2` 通信

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 构建 | Vite |
| 图表 | ECharts 5 + echarts-for-vue |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| UI 基调 | 赛博学术风 — 深色半透明玻璃态 + 发光描边 + 平滑过渡动画 |
| HTTP | Axios → `lmdt-backend-v2` |

## 启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 与后端通信

所有经济学计算委托给后端 API。前端不包含任何算法逻辑，仅负责：

1. 收集用户调节的参数
2. 发送 JSON 请求到后端
3. 将返回的计算数据渲染为 ECharts 图表 + st.metric 等效组件

---

*LMDT 2.0 · 西南交通大学希望学院 · 黎雅月*
