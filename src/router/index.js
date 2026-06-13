import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import IndividualLab from '../views/IndividualLab.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },

  // 核心实验室
  { path: '/lab/individual', name: 'Individual', component: IndividualLab, meta: { title: '👤 个体职业实验室' } },
  { path: '/lab/enterprise', name: 'Enterprise', component: () => import('../views/EnterpriseLab.vue'), meta: { title: '🏭 企业市场实验室' } },
  { path: '/lab/macro', name: 'Macro', component: () => import('../views/MacroLab.vue'), meta: { title: '🌍 宏观政策实验室' } },

  // 深度教学专题
  { path: '/lab/supply', name: 'Supply', component: () => import('../views/SupplyLab.vue'), meta: { title: '⚖️ 劳动供给决策' } },
  { path: '/lab/factor-allocation', name: 'FactorAlloc', component: () => import('../views/EnterpriseLab.vue'), meta: { title: '🏗️ 要素配置沙盘' } },
  { path: '/lab/migration', name: 'Migration', component: () => import('../views/MigrationLab.vue'), meta: { title: '✈️ 迁移决策仿真' } },
  { path: '/lab/wage', name: 'Wage', component: () => import('../views/WageLab.vue'), meta: { title: '💰 工资决定与收入差距' } },
  { path: '/lab/discrimination', name: 'Discrimination', component: () => import('../views/DiscriminationLab.vue'), meta: { title: '🚫 歧视经济学实验' } },
  { path: '/lab/income-distribution', name: 'IncomeDistribution', component: () => import('../views/IncomeDistributionLab.vue'), meta: { title: '📊 收入分配实验室' } },
  { path: '/lab/unemployment', name: 'Unemployment', component: () => import('../views/UnemploymentLab.vue'), meta: { title: '📉 失业经济学' } },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
