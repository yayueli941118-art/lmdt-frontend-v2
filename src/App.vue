<template>
  <div class="app-shell">
    <!-- 桌面端顶部导航 -->
    <nav class="desktop-nav">
      <router-link to="/" class="nav-brand">{{ appProfile.brandShort }}</router-link>
      <span v-if="modeLabel" class="mode-badge">{{ modeLabel }}</span>
      <router-link to="/lab/individual">个体实验室</router-link>
      <router-link to="/lab/enterprise">企业市场</router-link>
      <router-link to="/lab/macro">宏观政策</router-link>
      <router-link to="/lab/supply">劳动供给</router-link>
      <router-link to="/lab/wage">工资收入</router-link>
      <router-link to="/lab/discrimination">歧视经济</router-link>
      <router-link to="/lab/income-distribution">收入分配</router-link>
      <router-link to="/lab/unemployment">失业</router-link>
      <router-link to="/lab/migration">迁移</router-link>
      <router-link to="/report/workbench">报告工作台</router-link>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <!-- 移动端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/" class="mobile-nav-item">
        <span class="mobile-nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/lab/individual" class="mobile-nav-item">
        <span class="mobile-nav-icon">👤</span>
        <span>个体</span>
      </router-link>
      <router-link to="/lab/enterprise" class="mobile-nav-item">
        <span class="mobile-nav-icon">🏭</span>
        <span>企业</span>
      </router-link>
      <router-link to="/lab/macro" class="mobile-nav-item">
        <span class="mobile-nav-icon">🌍</span>
        <span>宏观</span>
      </router-link>
      <router-link to="/report/workbench" class="mobile-nav-item">
        <span class="mobile-nav-icon">📝</span>
        <span>报告</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { appProfile, modeLabel } from './config/appMode'

document.title = `${appProfile.brandShort} · ${appProfile.brandFull}`
</script>

<style>
/* ── 全局重置 ─────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; overflow-x: hidden; }
body {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.app-shell {
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column;
}

/* ── 桌面导航 ─────────────────────────── */
.desktop-nav {
  display: flex; align-items: center; gap: 4px;
  padding: 0 24px; height: 48px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 50;
  overflow-x: auto;
}
.desktop-nav a {
  padding: 6px 12px; border-radius: 6px;
  font-size: 13px; color: #94a3b8; text-decoration: none;
  white-space: nowrap; transition: all .2s;
}
.desktop-nav a:hover, .desktop-nav a.router-link-active {
  background: rgba(59, 130, 246, 0.12); color: #3b82f6;
}
.desktop-nav .nav-brand {
  font-weight: 800; font-size: 15px; color: #3b82f6;
  margin-right: 12px; letter-spacing: -0.5px;
}
.desktop-nav .nav-brand:hover { background: transparent; color: #60a5fa; }
.mode-badge {
  margin-right: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #67e8f9;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.22);
  white-space: nowrap;
}

.main-content { flex: 1; }

/* ── 移动端底部导航 ──────────────────── */
.mobile-nav {
  display: none;
  position: sticky; bottom: 0; z-index: 50;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(16px);
  padding: 4px 0 env(safe-area-inset-bottom, 0);
  justify-content: space-around;
}
.mobile-nav-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 6px 4px; gap: 2px;
  font-size: 10px; color: #64748b; text-decoration: none;
  transition: color .2s;
}
.mobile-nav-item.router-link-active { color: #3b82f6; }
.mobile-nav-icon { font-size: 20px; }

/* ── 全局响应式断点 ──────────────────── */
@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .mobile-nav { display: flex; }
  .main-content { padding-bottom: 0; }
  
  /* 所有实验室：控件栏堆叠 */
  .lab-controls {
    flex-direction: column !important;
    gap: 12px !important;
  }
  .lab-controls .control-group {
    min-width: 100% !important;
  }
  .lab-controls .btn-run {
    width: 100% !important;
  }
  
  /* 卡片网格自适应 */
  .cards-row {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  /* 图表容器高度压缩 */
  .chart-card v-chart, .chart-card > div {
    height: 220px !important;
  }
  
  /* 实验室标题 */
  .lab-header h1 { font-size: 24px !important; }
  .lab { padding: 16px !important; }
  
  /* slider 增大触控目标 */
  input[type="range"] {
    height: 32px;
  }
  
  /* 三点对比面板改为竖向 */
  .three-points { flex-direction: column !important; }
  .point-arrow { transform: rotate(90deg); }
  .group-compare { flex-direction: column !important; }
}
</style>
