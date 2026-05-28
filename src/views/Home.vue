<template>
  <div class="home">
    <!-- ===== School Banner ===== -->
    <section class="school-banner">
      <div class="banner-left">
        <div class="banner-school">🏛️ 西南交通大学希望学院 · 商学院</div>
        <h1 class="banner-title">劳动力市场数字孪生实验平台</h1>
        <div class="banner-subtitle">
          Designed for: <span class="banner-highlight">人力资源管理专业 (HRM)</span>
        </div>
      </div>
      <div class="banner-right">
        <div class="author-badge">👩‍🏫 课程负责人：黎雅月</div>
        <div class="author-sub">《劳动经济学》核心课程教学平台</div>
      </div>
    </section>

    <!-- ===== 三大核心实验室 ===== -->
    <section class="section">
      <h2 class="section-title">📍 核心实验模块</h2>
      <div class="core-cards">
        <div class="nav-card" @click="$router.push('/lab/individual')">
          <span class="card-icon">👤</span>
          <span class="card-title">个体职业实验室</span>
          <p class="card-desc">明瑟收入方程 · 教育投资回报 · 盈亏平衡分析 · 中国工资基准对比</p>
          <span class="card-tag">第四章 人力资本</span>
        </div>
        <div class="nav-card" @click="$router.push('/lab/enterprise')">
          <span class="card-icon">🏭</span>
          <span class="card-title">企业市场实验室</span>
          <p class="card-desc">CES 生产函数 · 边际生产力 · 条件要素需求 · 要素替代弹性 · 挑战模式</p>
          <span class="card-tag">第三章 劳动力需求</span>
        </div>
        <div class="nav-card" @click="$router.push('/lab/macro')">
          <span class="card-icon">🌍</span>
          <span class="card-title">宏观政策实验室</span>
          <p class="card-desc">贝弗里奇曲线 · 新质生产力 · 乡村振兴 · 结构性失业 · 政策沙盘</p>
          <div class="card-tags">
            <span class="card-tag">第八章 失业</span>
            <span class="card-tag">宏观政策</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 八大深度教学专题 ===== -->
    <section class="section">
      <h2 class="section-title">🔬 深度教学专题（按教材章节）</h2>
      <div class="mini-grid">
        <div class="mini-card cyan" @click="$router.push('/lab/supply')">
          <strong>⚖️ 第二章 劳动供给决策</strong>
          <p>收入效应 vs 替代效应 · Cobb-Douglas 效用 · 连续进度滑块 · 希克斯补偿</p>
        </div>
        <div class="mini-card cyan" @click="$router.push('/lab/factor-allocation')">
          <strong>🏗️ 第三章 要素配置沙盘</strong>
          <p>替代效应 vs 规模效应 · Cobb-Douglas 生产 · 等成本线旋转 · 稳岗补贴模拟</p>
        </div>
        <div class="mini-card purple" @click="$router.push('/lab/migration')">
          <strong>✈️ 第五章 劳动力流动</strong>
          <p>迁徙决策 NPV · 户籍制度壁垒 · 人才引进补贴 · 三种人生情景对比</p>
        </div>
        <div class="mini-card gold" @click="$router.push('/lab/wage')">
          <strong>💰 第六章 工资决定与收入差距</strong>
          <p>补偿性工资差异 · 效率工资 (NSC) · 最低工资权衡 · 洛伦兹曲线 · 技能溢价</p>
        </div>
        <div class="mini-card red" @click="$router.push('/lab/discrimination')">
          <strong>🚫 第七章 劳动力市场歧视</strong>
          <p>贝克尔偏见模型 · 统计性歧视螺旋 · 中国四维歧视 · 政策组合实验</p>
        </div>
        <div class="mini-card indigo" @click="$router.push('/lab/unemployment')">
          <strong>📉 第八章 失业经济学</strong>
          <p>失业类型诊断 · 职业搜寻 (保留工资) · 贝弗里奇曲线 · 自然失业率</p>
        </div>
      </div>
    </section>

    <!-- ===== 教材覆盖矩阵 ===== -->
    <section class="section">
      <h2 class="section-title">📊 教材全覆盖 · 八章对应矩阵</h2>
      <div class="matrix-table">
        <table>
          <thead>
            <tr>
              <th>教材章节</th>
              <th>核心内容</th>
              <th>仿真页面</th>
              <th>色系</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>第一章</td>
              <td>劳动力市场导论</td>
              <td>🏠 门户首页（概念框架）</td>
              <td><span class="dot gray"></span></td>
            </tr>
            <tr>
              <td>第二章</td>
              <td>劳动力供给分析</td>
              <td @click="$router.push('/lab/supply')" class="clickable">⚖️ 劳动供给决策</td>
              <td><span class="dot cyan"></span></td>
            </tr>
            <tr>
              <td>第三章</td>
              <td>劳动力需求分析</td>
              <td>
                <span @click="$router.push('/lab/enterprise')" class="clickable">🏭 企业实验室</span>
                <span class="sep">+</span>
                <span @click="$router.push('/lab/factor-allocation')" class="clickable">🏗️ 要素配置沙盘</span>
              </td>
              <td><span class="dot cyan"></span></td>
            </tr>
            <tr>
              <td>第四章</td>
              <td>人力资本投资</td>
              <td @click="$router.push('/lab/individual')" class="clickable">👤 个体实验室</td>
              <td><span class="dot blue"></span></td>
            </tr>
            <tr>
              <td>第五章</td>
              <td>劳动力流动</td>
              <td @click="$router.push('/lab/migration')" class="clickable">✈️ 迁移决策仿真</td>
              <td><span class="dot purple"></span></td>
            </tr>
            <tr>
              <td>第六章</td>
              <td>工资决定与收入差距</td>
              <td @click="$router.push('/lab/wage')" class="clickable">💰 工资决定与收入差距</td>
              <td><span class="dot gold"></span></td>
            </tr>
            <tr>
              <td>第七章</td>
              <td>劳动力市场歧视</td>
              <td @click="$router.push('/lab/discrimination')" class="clickable">🚫 歧视经济学实验</td>
              <td><span class="dot red"></span></td>
            </tr>
            <tr>
              <td>第八章</td>
              <td>失业</td>
              <td>
                <span @click="$router.push('/lab/unemployment')" class="clickable">📉 失业经济学</span>
                <span class="sep">+</span>
                <span @click="$router.push('/lab/macro')" class="clickable">🌍 宏观政策</span>
              </td>
              <td><span class="dot indigo"></span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ===== 版底 ===== -->
    <footer class="footer">
      <h3>🎓 教学理念：Data-Driven Learning (DDL)</h3>
      <p>本平台旨在通过<b>数字孪生技术</b>，将抽象的经济学模型转化为可视化、可交互的实验场景。</p>
      <p>让 HR 专业的学生从"死记硬背公式"转向"理解市场逻辑"，培养数据洞察力与决策思维。</p>
      <p class="footer-note">
        11 个交互式实验模块 · 8 章教材全覆盖 · 🇨🇳 融入「新质生产力」「乡村振兴」「共同富裕」等国家战略
      </p>
    </footer>
  </div>
</template>

<script setup>
// 纯静态首页，无逻辑
</script>

<style scoped>
/* ===== 全局容器 ===== */
.home {
  background: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

/* ===== Banner ===== */
.school-banner {
  background: linear-gradient(120deg, #1e3a8a 0%, #2563eb 100%);
  padding: 36px 48px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.25);
}
.banner-school { font-size: 18px; opacity: 0.88; letter-spacing: 1px; }
.banner-title {
  font-size: 44px; font-weight: 900; margin: 10px 0;
  letter-spacing: 2px; text-shadow: 2px 2px 6px rgba(0,0,0,0.2);
}
.banner-subtitle { font-size: 18px; font-weight: 600; margin-top: 8px; }
.banner-highlight { border-bottom: 2px solid #fbbf24; }
.banner-right { text-align: right; }
.author-badge {
  background: rgba(255,255,255,0.2); padding: 8px 16px;
  border-radius: 50px; font-size: 16px; border: 1px solid rgba(255,255,255,0.4);
}
.author-sub { margin-top: 8px; font-size: 14px; opacity: 0.8; }

/* ===== 通用 ===== */
.section { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
.section-title { font-size: 26px; font-weight: 800; color: #1e3a8a; margin-bottom: 24px; }

/* ===== 三大核心卡片 ===== */
.core-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.nav-card {
  background: white; padding: 26px; border-radius: 14px;
  border: 2px solid #e2e8f0; cursor: pointer;
  transition: all 0.3s ease;
}
.nav-card:hover {
  border-color: #2563eb;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  transform: translateY(-4px);
}
.card-icon { font-size: 40px; display: block; margin-bottom: 10px; }
.card-title { font-size: 22px; font-weight: 800; color: #1e3a8a; display: block; margin-bottom: 10px; }
.card-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 12px; }
.card-tags { display: flex; gap: 6px; }
.card-tag {
  display: inline-block; background: #eff6ff; color: #2563eb;
  padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 700;
}

/* ===== 微卡片 ===== */
.mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.mini-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 16px 18px; cursor: pointer;
  transition: all 0.2s;
}
.mini-card:hover { border-color: #2563eb; transform: translateX(3px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.mini-card strong { display: block; font-size: 15px; margin-bottom: 4px; }
.mini-card p { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }
.mini-card.cyan { border-left: 4px solid #06b6d4; }
.mini-card.purple { border-left: 4px solid #8b5cf6; }
.mini-card.gold { border-left: 4px solid #f59e0b; }
.mini-card.red { border-left: 4px solid #ef4444; }
.mini-card.indigo { border-left: 4px solid #6366f1; }

/* ===== 矩阵表格 ===== */
.matrix-table { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
.matrix-table table { width: 100%; border-collapse: collapse; }
.matrix-table th {
  background: #f1f5f9; text-align: left; padding: 14px 18px;
  font-size: 14px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #e2e8f0;
}
.matrix-table td {
  padding: 12px 18px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9;
}
.matrix-table tr:hover td { background: #fafbfd; }
.clickable { color: #2563eb; cursor: pointer; font-weight: 600; }
.clickable:hover { text-decoration: underline; }
.sep { color: #cbd5e1; margin: 0 6px; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; }
.dot.cyan { background: #06b6d4; }
.dot.purple { background: #8b5cf6; }
.dot.gold { background: #f59e0b; }
.dot.red { background: #ef4444; }
.dot.indigo { background: #6366f1; }
.dot.blue { background: #3b82f6; }
.dot.gray { background: #cbd5e1; }

/* ===== 版底 ===== */
.footer {
  text-align: center; color: #64748b; padding: 48px 24px;
  border-top: 1px solid #e2e8f0; margin-top: 40px;
}
.footer h3 { font-size: 20px; color: #1e3a8a; margin-bottom: 12px; }
.footer p { font-size: 15px; margin: 4px 0; }
.footer .footer-note { font-size: 13px; margin-top: 16px; opacity: 0.6; }

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .core-cards { grid-template-columns: 1fr; }
  .mini-grid { grid-template-columns: 1fr; }
  .school-banner { flex-direction: column; text-align: center; }
  .banner-right { margin-top: 16px; text-align: center; }
  .banner-title { font-size: 30px; }
}
</style>
