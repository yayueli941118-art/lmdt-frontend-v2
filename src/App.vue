<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳过导航，进入主要内容</a>
    <!-- 桌面端顶部导航 -->
    <nav class="desktop-nav" aria-label="主要导航">
      <router-link to="/" class="nav-brand">{{ appProfile.brandShort }}</router-link>
      <span v-if="modeLabel" class="mode-badge">{{ modeLabel }}</span>
      <router-link to="/analysis/market">市场数据</router-link>
      <router-link to="/lab/enterprise">机制仿真</router-link>
      <router-link to="/forecast/basic">基础预测</router-link>
      <router-link to="/lab/ai-occupation">AI岗位</router-link>
      <router-link to="/report/workbench">报告决策</router-link>
      <router-link to="/practice/exam">能力训练</router-link>
      <button
        v-if="appMode === 'teaching'"
        class="projection-toggle"
        type="button"
        :aria-pressed="projectionMode"
        @click="toggleProjection"
      >
        {{ projectionMode ? '退出投影' : '投影显示' }}
      </button>
      <details class="nav-more">
        <summary>更多实验</summary>
        <div class="nav-more-menu">
          <router-link to="/lab/individual">人力资本</router-link>
          <router-link to="/lab/supply">劳动供给</router-link>
          <router-link to="/lab/wage">工资收入</router-link>
          <router-link to="/lab/unemployment">失业与匹配</router-link>
          <router-link to="/lab/chengyu-tourism">成渝文旅</router-link>
          <router-link to="/lab/macro">宏观政策</router-link>
          <router-link to="/lab/migration">迁移决策</router-link>
          <router-link to="/lab/discrimination">歧视经济</router-link>
          <router-link to="/lab/income-distribution">收入分配</router-link>
        </div>
      </details>
    </nav>

    <main id="main-content" class="main-content" tabindex="-1">
      <router-view />
    </main>

    <!-- 移动端底部导航 -->
    <nav class="mobile-nav" aria-label="移动端主要导航">
      <router-link to="/" class="mobile-nav-item">
        <span class="mobile-nav-icon">⌂</span>
        <span>首页</span>
      </router-link>
      <router-link to="/analysis/market" class="mobile-nav-item">
        <span class="mobile-nav-icon">▥</span>
        <span>数据</span>
      </router-link>
      <router-link to="/lab/enterprise" class="mobile-nav-item">
        <span class="mobile-nav-icon">⌁</span>
        <span>仿真</span>
      </router-link>
      <router-link to="/forecast/basic" class="mobile-nav-item">
        <span class="mobile-nav-icon">↗</span>
        <span>预测</span>
      </router-link>
      <router-link to="/practice/exam" class="mobile-nav-item">
        <span class="mobile-nav-icon">✓</span>
        <span>训练</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { appMode, appProfile, modeLabel } from './config/appMode'

document.title = `${appProfile.brandShort} · ${appProfile.brandFull}`

const projectionMode = ref(false)
let accessibilityObserver = null
let controlIndex = 0

onMounted(() => {
  projectionMode.value = localStorage.getItem('lmdtProjectionMode') === 'true'
  document.documentElement.classList.toggle('projection-mode', projectionMode.value)
  applyAccessibilityLinks()
  accessibilityObserver = new MutationObserver(applyAccessibilityLinks)
  accessibilityObserver.observe(document.getElementById('main-content'), { childList: true, subtree: true })
})

onUnmounted(() => accessibilityObserver?.disconnect())

function toggleProjection() {
  projectionMode.value = !projectionMode.value
  localStorage.setItem('lmdtProjectionMode', String(projectionMode.value))
  document.documentElement.classList.toggle('projection-mode', projectionMode.value)
}

function applyAccessibilityLinks() {
  document.querySelectorAll('.control-group').forEach(group => {
    const label = group.querySelector('label')
    const control = group.querySelector('input, select, textarea')
    if (!label || !control || label.contains(control)) return
    if (!control.id) control.id = `lmdt-control-${controlIndex += 1}`
    if (!label.htmlFor) label.htmlFor = control.id
  })
  document.querySelectorAll('.chart-card canvas').forEach(canvas => {
    const heading = canvas.closest('.chart-card')?.querySelector('h2, h3')?.textContent?.trim()
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', heading ? `${heading}图表` : '劳动力市场分析图表')
  })
}
</script>

<style>
/* ── 全局重置 ─────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; overflow-x: hidden; }
html.experiment-workspace-active,
body.experiment-workspace-active {
  height: 100%;
  overflow: hidden;
}
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
.skip-link {
  position: fixed; top: 8px; left: 8px; z-index: 2000;
  padding: 10px 14px; border-radius: 6px;
  color: #07111f; background: #f8fafc; font-weight: 800;
  transform: translateY(-160%);
}
.skip-link:focus { transform: translateY(0); }
a:focus-visible, button:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible, summary:focus-visible {
  outline: 3px solid #fbbf24;
  outline-offset: 3px;
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
.projection-toggle {
  min-height: 34px; margin-left: auto; padding: 6px 10px;
  border: 1px solid rgba(34,211,238,.35); border-radius: 6px;
  color: #cffafe; background: rgba(8,145,178,.14);
  cursor: pointer; white-space: nowrap;
}
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
.nav-more {
  position: relative;
  margin-left: 2px;
}
.nav-more summary {
  list-style: none;
  padding: 6px 12px;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.nav-more summary::-webkit-details-marker { display: none; }
.nav-more[open] summary,
.nav-more summary:hover { color: #3b82f6; background: rgba(59, 130, 246, 0.12); }
.nav-more-menu {
  position: fixed;
  top: 46px;
  right: 18px;
  z-index: 70;
  display: grid;
  min-width: 150px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: #172033;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32);
}
.nav-more-menu a { padding: 9px 10px; }

.main-content { flex: 1; min-height: 0; }
.projection-mode .main-content { font-size: 112%; }
.projection-mode .main-content p,
.projection-mode .main-content label,
.projection-mode .main-content small { color: #e2e8f0 !important; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}

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
