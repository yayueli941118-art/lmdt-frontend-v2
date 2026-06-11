<template>
  <div class="home">
    <!-- ===== 动态网格背景 ===== -->
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <!-- ===== Hero 首屏 ===== -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          西南交通大学希望学院 · 商学院
        </div>
        <h1 class="hero-title">
          <span class="hero-title-line">劳动力市场</span>
          <span class="hero-title-line hero-title-accent">数字孪生沙盘</span>
        </h1>
        <p class="hero-desc">
          基于劳动经济学核心理论的交互式仿真平台，将贝弗里奇曲线、明瑟方程、CES 生产函数<br />
          等经典模型转化为可视化、可调控的数字化实验场景
        </p>
        <div class="hero-actions">
          <button class="hero-btn hero-btn-primary" @click="scrollToLabs">
            <span>启动沙盘</span>
            <svg class="hero-btn-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
          </button>
          <button class="hero-btn hero-btn-secondary" @click="scrollToChapters">
            浏览全部模块
          </button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-num">8</span>
            <span class="hero-stat-label">教材章节</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="hero-stat-num">11</span>
            <span class="hero-stat-label">交互实验</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="hero-stat-num">HRM</span>
            <span class="hero-stat-label">专业定制</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 三大核心实验室 ===== -->
    <section id="labs" class="section">
      <div class="section-header">
        <span class="section-tag">核心模块</span>
        <h2 class="section-title">三大数字孪生实验室</h2>
        <p class="section-subtitle">从个体到宏观，覆盖劳动经济学全维度</p>
      </div>
      <div class="core-cards">
        <!-- 个体 -->
        <div class="glass-card glass-card-blue" @click="$router.push('/lab/individual')">
          <div class="glass-card-icon">
            <svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="7" fill="currentColor" opacity="0.85"/><path d="M8 40c0-8.8 7.2-16 16-16s16 7.2 16 16" fill="currentColor" opacity="0.85"/></svg>
          </div>
          <h3 class="glass-card-title">个体职业实验室</h3>
          <p class="glass-card-desc">明瑟收入方程 · 教育投资回报<br />盈亏平衡分析 · 中国工资基准对标</p>
          <div class="glass-card-chip">第四章 人力资本</div>
          <span class="glass-card-link">进入实验室 →</span>
        </div>
        <!-- 企业 -->
        <div class="glass-card glass-card-cyan" @click="$router.push('/lab/enterprise')">
          <div class="glass-card-icon">
            <svg viewBox="0 0 48 48"><rect x="6" y="10" width="10" height="10" rx="1.5" fill="currentColor" opacity="0.85"/><rect x="19" y="10" width="10" height="10" rx="1.5" fill="currentColor" opacity="0.85"/><rect x="32" y="10" width="10" height="10" rx="1.5" fill="currentColor" opacity="0.85"/><rect x="6" y="24" width="10" height="14" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="19" y="24" width="10" height="14" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="32" y="24" width="10" height="14" rx="1.5" fill="currentColor" opacity="0.6"/></svg>
          </div>
          <h3 class="glass-card-title">企业市场实验室</h3>
          <p class="glass-card-desc">CES 生产函数 · 边际生产力<br />条件要素需求 · 要素替代弹性</p>
          <div class="glass-card-chip">第三章 劳动力需求</div>
          <span class="glass-card-link">进入实验室 →</span>
        </div>
        <!-- 宏观 -->
        <div class="glass-card glass-card-purple" @click="$router.push('/lab/macro')">
          <div class="glass-card-icon">
            <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.5"/><circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.7"/><circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.85"/></svg>
          </div>
          <h3 class="glass-card-title">宏观政策实验室</h3>
          <p class="glass-card-desc">贝弗里奇曲线 · 结构性失业<br />新质生产力 · 乡村振兴沙盘</p>
          <div class="glass-card-chips">
            <div class="glass-card-chip">第八章 失业</div>
            <div class="glass-card-chip">宏观政策</div>
          </div>
          <span class="glass-card-link">进入实验室 →</span>
        </div>
      </div>
    </section>

    <!-- ===== 八大深度教学专题 ===== -->
    <section id="chapters" class="section">
      <div class="section-header">
        <span class="section-tag">教学专题</span>
        <h2 class="section-title">八章全覆盖 · 按教材章节索引</h2>
      </div>
      <div class="mini-grid">
        <div class="mini-card mini-card-cyan" @click="$router.push('/lab/supply')">
          <span class="mini-card-chapter">Ch.02</span>
          <strong>劳动供给决策</strong>
          <p>收入效应 vs 替代效应 · Cobb-Douglas · 希克斯补偿</p>
        </div>
        <div class="mini-card mini-card-cyan" @click="$router.push('/lab/factor-allocation')">
          <span class="mini-card-chapter">Ch.03</span>
          <strong>要素配置沙盘</strong>
          <p>替代 vs 规模效应 · 等成本线旋转 · 稳岗补贴模拟</p>
        </div>
        <div class="mini-card mini-card-purple" @click="$router.push('/lab/migration')">
          <span class="mini-card-chapter">Ch.05</span>
          <strong>劳动力流动</strong>
          <p>迁徙决策 NPV · 户籍制度壁垒 · 三种情景对比</p>
        </div>
        <div class="mini-card mini-card-gold" @click="$router.push('/lab/wage')">
          <span class="mini-card-chapter">Ch.06</span>
          <strong>工资决定与收入差距</strong>
          <p>效率工资 · 最低工资权衡 · 洛伦兹曲线 · 技能溢价</p>
        </div>
        <div class="mini-card mini-card-red" @click="$router.push('/lab/discrimination')">
          <span class="mini-card-chapter">Ch.07</span>
          <strong>劳动力市场歧视</strong>
          <p>贝克尔偏见模型 · 统计性歧视 · 政策组合实验</p>
        </div>
        <div class="mini-card mini-card-indigo" @click="$router.push('/lab/unemployment')">
          <span class="mini-card-chapter">Ch.08</span>
          <strong>失业经济学</strong>
          <p>失业类型诊断 · 保留工资 · 贝弗里奇曲线</p>
        </div>
      </div>
    </section>

    <!-- ===== 教材覆盖矩阵 ===== -->
    <section class="section">
      <div class="section-header">
        <span class="section-tag">课程矩阵</span>
        <h2 class="section-title">教材全覆盖 · 八章映射</h2>
      </div>
      <div class="matrix-table">
        <table>
          <thead>
            <tr>
              <th>章节</th>
              <th>核心内容</th>
              <th>仿真页面</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="matrix-chapter">Ch.01</span></td>
              <td>劳动力市场导论</td>
              <td>🏠 门户首页（概念框架）</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.02</span></td>
              <td>劳动力供给分析</td>
              <td class="matrix-link" @click="$router.push('/lab/supply')">⚖️ 劳动供给决策</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.03</span></td>
              <td>劳动力需求分析</td>
              <td>
                <span class="matrix-link" @click="$router.push('/lab/enterprise')">🏭 企业实验室</span>
                <span class="matrix-sep">+</span>
                <span class="matrix-link" @click="$router.push('/lab/factor-allocation')">🏗️ 要素配置沙盘</span>
              </td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.04</span></td>
              <td>人力资本投资</td>
              <td class="matrix-link" @click="$router.push('/lab/individual')">👤 个体职业实验室</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.05</span></td>
              <td>劳动力流动</td>
              <td class="matrix-link" @click="$router.push('/lab/migration')">✈️ 迁移决策仿真</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.06</span></td>
              <td>工资决定与收入差距</td>
              <td class="matrix-link" @click="$router.push('/lab/wage')">💰 工资决定与收入差距</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.07</span></td>
              <td>劳动力市场歧视</td>
              <td class="matrix-link" @click="$router.push('/lab/discrimination')">🚫 歧视经济学实验</td>
            </tr>
            <tr>
              <td><span class="matrix-chapter">Ch.08</span></td>
              <td>失业</td>
              <td>
                <span class="matrix-link" @click="$router.push('/lab/unemployment')">📉 失业经济学</span>
                <span class="matrix-sep">+</span>
                <span class="matrix-link" @click="$router.push('/lab/macro')">🌍 宏观政策沙盘</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ===== 版底 ===== -->
    <footer class="footer">
      <div class="footer-main">
        <div class="footer-brand">
          <span class="footer-logo">LMDT</span>
          <span class="footer-version">v2.0.1 · build 2026.05</span>
        </div>
        <div class="footer-info">
          <p class="footer-school">西南交通大学希望学院 · 商学院</p>
          <p class="footer-course">《劳动经济学》核心课程 · 人力资源管理专业</p>
          <p class="footer-author">课程负责人 / 系统设计：黎雅月</p>
        </div>
        <div class="footer-meta">
          <p>11 个交互式实验模块 · 8 章教材全覆盖</p>
          <p class="footer-tags">
            🇨🇳 融入「新质生产力」「乡村振兴」「共同富裕」等国家战略
          </p>
        </div>
      </div>
      <div class="footer-divider"></div>
      <div class="footer-bottom">
        <span>© 2026 LMDT · Labor Market Digital Twin</span>
        <span>Powered by Vue 3 + FastAPI + Render/Vercel</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
const scrollToLabs = () => {
  document.getElementById('labs')?.scrollIntoView({ behavior: 'smooth' })
}
const scrollToChapters = () => {
  document.getElementById('chapters')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
/* ========================================
   DESIGN SYSTEM — Bloomberg Terminal Aesthetic
   Dark Theme · Glassmorphism · Subtle Animations
   ======================================== */

/* ── 全局 ────────────────────────────────── */
.home {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: rgba(30, 41, 59, 0.6);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-purple: #8b5cf6;
  --accent-gold: #f59e0b;
  --accent-red: #ef4444;
  --accent-indigo: #6366f1;
  --border-subtle: rgba(148, 163, 184, 0.08);

  background: var(--bg-primary);
  min-height: 100vh;
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* ── 动态网格背景 ─────────────────────────── */
.bg-grid {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: grid-scroll 20s linear infinite;
}
@keyframes grid-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 60px 60px; }
}

/* ── 背景光晕 ────────────────────────────── */
.bg-glow {
  position: fixed; border-radius: 50%; z-index: 0; pointer-events: none;
  filter: blur(120px); opacity: 0.12;
}
.bg-glow-1 {
  width: 600px; height: 600px;
  background: var(--accent-blue);
  top: -200px; right: -100px;
  animation: glow-drift-1 18s ease-in-out infinite;
}
.bg-glow-2 {
  width: 500px; height: 500px;
  background: var(--accent-purple);
  bottom: -150px; left: -100px;
  animation: glow-drift-2 22s ease-in-out infinite;
}
@keyframes glow-drift-1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-40px, 30px); }
}
@keyframes glow-drift-2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(50px, -20px); }
}

/* ── Hero 首屏 ───────────────────────────── */
.hero {
  position: relative; z-index: 1;
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 80px 24px;
}
.hero-content {
  text-align: center; max-width: 820px;
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 100px;
  padding: 6px 18px;
  font-size: 14px; font-weight: 500; color: var(--accent-blue);
  letter-spacing: 0.5px; margin-bottom: 32px;
}
.hero-badge-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 8px var(--accent-blue);
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.hero-title {
  font-size: clamp(42px, 7vw, 72px);
  font-weight: 900; letter-spacing: -1.5px; line-height: 1.1;
  margin: 0 0 28px;
}
.hero-title-line { display: block; }
.hero-title-accent {
  background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 17px; font-weight: 400; color: var(--text-secondary);
  line-height: 1.7; margin: 0 auto 40px; max-width: 620px;
}
.hero-actions {
  display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  margin-bottom: 56px;
}
.hero-btn {
  border: none; cursor: pointer;
  padding: 14px 32px; border-radius: 12px;
  font-size: 16px; font-weight: 600; font-family: inherit;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.3s ease;
}
.hero-btn-primary {
  background: linear-gradient(135deg, var(--accent-blue), #2563eb);
  color: white; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
}
.hero-btn-primary:hover {
  box-shadow: 0 12px 36px rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}
.hero-btn-arrow {
  width: 18px; height: 18px; animation: arrow-bounce 2s ease-in-out infinite;
}
@keyframes arrow-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}
.hero-btn-secondary {
  background: rgba(255,255,255,0.06);
  color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.1);
}
.hero-btn-secondary:hover {
  background: rgba(255,255,255,0.1); color: var(--text-primary);
}
.hero-stats {
  display: flex; gap: 0; justify-content: center; align-items: center;
}
.hero-stat { text-align: center; padding: 0 28px; }
.hero-stat-num {
  display: block; font-size: 36px; font-weight: 900; color: var(--text-primary);
  letter-spacing: -1px;
}
.hero-stat-label {
  font-size: 13px; color: var(--text-muted); font-weight: 500;
  letter-spacing: 0.5px; text-transform: uppercase;
}
.hero-stat-divider {
  width: 1px; height: 40px; background: rgba(148, 163, 184, 0.15);
}

/* ── Section 通用 ─────────────────────────── */
.section {
  position: relative; z-index: 1;
  max-width: 1200px; margin: 0 auto;
  padding: 60px 24px;
}
.section-header { text-align: center; margin-bottom: 48px; }
.section-tag {
  display: inline-block;
  font-size: 12px; font-weight: 700; color: var(--accent-blue);
  letter-spacing: 2px; text-transform: uppercase;
  margin-bottom: 12px;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 12px; border-radius: 4px;
}
.section-title {
  font-size: clamp(28px, 4vw, 36px); font-weight: 800;
  letter-spacing: -0.5px; margin: 0 0 12px; color: var(--text-primary);
}
.section-subtitle {
  font-size: 16px; color: var(--text-secondary); margin: 0;
}

/* ── 三大毛玻璃卡片 ───────────────────────── */
.core-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.glass-card {
  position: relative; border-radius: 20px;
  padding: 36px 28px;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.glass-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 20px;
  opacity: 0; transition: opacity 0.35s ease;
}
.glass-card-blue::before {
  background: linear-gradient(135deg, rgba(59,130,246,0.08), transparent 60%);
}
.glass-card-cyan::before {
  background: linear-gradient(135deg, rgba(6,182,212,0.08), transparent 60%);
}
.glass-card-purple::before {
  background: linear-gradient(135deg, rgba(139,92,246,0.08), transparent 60%);
}
.glass-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 20px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset;
}
.glass-card:hover::before { opacity: 1; }
.glass-card > * { position: relative; z-index: 1; }
.glass-card-icon {
  width: 52px; height: 52px; margin-bottom: 20px;
  color: var(--text-secondary); transition: color 0.3s;
}
.glass-card:hover .glass-card-icon { color: var(--text-primary); }
.glass-card-title {
  font-size: 22px; font-weight: 800; margin: 0 0 12px;
  color: var(--text-primary); letter-spacing: -0.3px;
}
.glass-card-desc {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.7; margin: 0 0 20px;
}
.glass-card-chip {
  display: inline-block;
  font-size: 12px; font-weight: 700; padding: 5px 12px;
  border-radius: 6px; margin-bottom: 20px;
  background: rgba(59, 130, 246, 0.12); color: var(--accent-blue);
  letter-spacing: 0.3px;
}
.glass-card-chips { display: flex; gap: 8px; margin-bottom: 20px; }
.glass-card-link {
  display: block; font-size: 14px; font-weight: 600;
  color: var(--text-muted); transition: all 0.3s;
}
.glass-card:hover .glass-card-link {
  color: var(--accent-blue); transform: translateX(4px);
}

/* ── 专题微卡片 ───────────────────────────── */
.mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.mini-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.mini-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(255,255,255,0.12);
  transform: translateX(4px);
}
.mini-card-chapter {
  font-size: 11px; font-weight: 700; letter-spacing: 1px;
  margin-bottom: 8px; display: block;
}
.mini-card strong {
  display: block; font-size: 15px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 4px;
}
.mini-card p {
  font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;
}
.mini-card-cyan .mini-card-chapter { color: var(--accent-cyan); }
.mini-card-cyan { border-left: 3px solid var(--accent-cyan); }
.mini-card-purple .mini-card-chapter { color: var(--accent-purple); }
.mini-card-purple { border-left: 3px solid var(--accent-purple); }
.mini-card-gold .mini-card-chapter { color: var(--accent-gold); }
.mini-card-gold { border-left: 3px solid var(--accent-gold); }
.mini-card-red .mini-card-chapter { color: var(--accent-red); }
.mini-card-red { border-left: 3px solid var(--accent-red); }
.mini-card-indigo .mini-card-chapter { color: var(--accent-indigo); }
.mini-card-indigo { border-left: 3px solid var(--accent-indigo); }

/* ── 教材矩阵表格 ─────────────────────────── */
.matrix-table {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid var(--border-subtle);
  border-radius: 16px; overflow: hidden;
}
.matrix-table table { width: 100%; border-collapse: collapse; }
.matrix-table th {
  background: rgba(15, 23, 42, 0.8);
  text-align: left; padding: 14px 20px;
  font-size: 12px; font-weight: 700; color: var(--text-muted);
  letter-spacing: 1px; text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}
.matrix-table td {
  padding: 14px 20px; font-size: 14px; color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}
.matrix-table tr:last-child td { border-bottom: none; }
.matrix-table tr:hover td { background: rgba(255,255,255,0.02); }
.matrix-chapter {
  font-size: 12px; font-weight: 700; color: var(--text-muted);
  letter-spacing: 1px;
}
.matrix-link {
  color: var(--accent-blue); cursor: pointer; font-weight: 600;
  transition: color 0.2s;
}
.matrix-link:hover { color: #60a5fa; }
.matrix-sep { color: var(--text-muted); margin: 0 8px; }

/* ── 版底 ────────────────────────────────── */
.footer {
  position: relative; z-index: 1;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid var(--border-subtle);
  padding: 48px 24px 32px; margin-top: 40px;
}
.footer-main {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: auto 1fr auto;
  gap: 48px; align-items: start;
}
.footer-brand { display: flex; flex-direction: column; gap: 4px; }
.footer-logo {
  font-size: 24px; font-weight: 900; letter-spacing: -1px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.footer-version {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  letter-spacing: 1px;
}
.footer-info p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
.footer-author { color: var(--text-muted) !important; }
.footer-meta { text-align: right; }
.footer-meta p {
  margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.7;
}
.footer-tags { color: var(--text-muted) !important; font-size: 12px !important; }
.footer-divider {
  max-width: 1200px; margin: 32px auto;
  height: 1px; background: var(--border-subtle);
}
.footer-bottom {
  max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-muted);
  letter-spacing: 0.3px;
}

/* ── 响应式 ──────────────────────────────── */
@media (max-width: 900px) {
  .core-cards { grid-template-columns: 1fr; }
  .mini-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 36px; }
  .hero-stats { flex-direction: column; gap: 16px; }
  .hero-stat-divider { width: 40px; height: 1px; }
  .footer-main { grid-template-columns: 1fr; gap: 24px; }
  .footer-meta { text-align: left; }
  .hero { padding: 60px 16px; min-height: auto; }
  .section { padding: 40px 16px; }
  .matrix-table { overflow-x: auto; }
  .matrix-table table { min-width: 600px; }
  .hero-desc br { display: none; }
}
</style>
