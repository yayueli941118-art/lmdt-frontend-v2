<template>
  <div class="workbench">
    <header class="workbench-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span class="page-kicker">课程报告工作台</span>
      <h1>岗位劳动力市场预测报告工作台</h1>
      <p>请先下载标准 CSV 模板采集招聘样本，再导入预览、完成统计分析、进入 {{ simulationLabel }} 做仿真实验，最后生成 Markdown 报告草稿。</p>
      <div class="flow-strip">
        <span v-for="step in workflowSteps" :key="step">{{ step }}</span>
      </div>
      <nav class="workbench-tabs" aria-label="工作台模式">
        <button type="button" :class="{ active: workbenchMode === 'student' }" @click="workbenchMode = 'student'">学生作业</button>
        <button type="button" :class="{ active: workbenchMode === 'teacher' }" @click="workbenchMode = 'teacher'">教师汇总</button>
      </nav>
    </header>

    <template v-if="workbenchMode === 'student'">
    <nav class="student-view-tabs" aria-label="学生工作台视图">
      <button type="button" :class="{ active: studentView === 'classroom' }" @click="studentView = 'classroom'">
        课堂五步简版
      </button>
      <button type="button" :class="{ active: studentView === 'project' }" @click="studentView = 'project'">
        完整项目版
      </button>
      <span>两种视图共用同一份样本、实验记录和报告草稿。</span>
    </nav>

    <section v-if="studentView === 'classroom'" class="classroom-workflow" data-testid="classroom-workflow">
      <nav class="classroom-progress" aria-label="课堂五步进度">
        <button
          v-for="item in classroomSteps"
          :key="item.step"
          type="button"
          :class="{ active: classroomStep === item.step, complete: classroomStepComplete(item.step) }"
          :disabled="!canOpenClassroomStep(item.step)"
          :data-testid="`classroom-step-${item.step}`"
          @click="classroomStep = item.step"
        >
          <span>{{ item.step }}</span><strong>{{ item.title }}</strong><small>{{ classroomStepComplete(item.step) ? '已完成' : item.done }}</small>
        </button>
      </nav>

      <article v-if="classroomStep === 1" class="panel classroom-step-card">
        <header><span>01</span><div><h2>载入数据</h2><p>先建立可追溯的小样本，再讨论岗位市场。</p></div></header>
        <div class="classroom-step-layout">
          <div class="classroom-action-area">
            <div class="target-grid compact-targets">
              <label>行业<input v-model.trim="target.industry" list="industry-options" placeholder="如：现代服务业"></label>
              <label>岗位<input v-model.trim="target.position" placeholder="如：人力资源专员"></label>
              <label>地区<input v-model.trim="target.region" list="region-options" placeholder="如：成渝双城经济圈"></label>
            </div>
            <div class="form-actions">
              <button class="primary-btn" type="button" data-testid="load-teaching-example" @click="loadTeachingExample">一键载入教学示例</button>
              <label class="file-btn">选择 CSV 并预览<input type="file" accept=".csv,text/csv" @change="previewCsv"></label>
              <button class="ghost-btn" type="button" @click="studentView = 'project'">进入完整录入</button>
            </div>
            <p class="boundary-callout">教学示例是虚构样本，只用于熟悉流程；学生正式作业应提交自行采集且保留截图或链接编号的样本。</p>
          </div>
          <ClassroomStepGuide doing="载入示例或导入自己的 CSV，并补齐行业、岗位、地区。" why="没有来源和口径清楚的数据，后面的统计与仿真就没有证据基础。" :completion="`${samples.length} 条样本已进入当前浏览器`" next="进入质量检查，确认缺失薪资和技能字段。" />
        </div>
      </article>

      <article v-else-if="classroomStep === 2" class="panel classroom-step-card">
        <header><span>02</span><div><h2>检查质量</h2><p>先看有效性，再决定是否可以解释。</p></div></header>
        <div class="classroom-step-layout">
          <div class="classroom-action-area">
            <div class="preview-cards classroom-cards">
              <div class="stat-card"><span>样本数量</span><strong>{{ stats.count }} 条</strong></div>
              <div class="stat-card"><span>有效薪资</span><strong>{{ stats.salaryCount }} 条</strong></div>
              <div class="stat-card"><span>缺失薪资</span><strong>{{ stats.missingSalary }} 条</strong></div>
              <div class="stat-card"><span>技能关键词</span><strong>{{ totalSkillTokens }} 个</strong></div>
            </div>
            <div class="quality-check" :class="{ warning: classroomQualityIssues.length }">
              <strong>{{ classroomQualityIssues.length ? '仍有字段需要说明' : '基础字段可以进入统计' }}</strong>
              <p>{{ classroomQualityIssues.join('；') || '岗位、地区、薪资和技能字段已具备基础统计条件。' }}</p>
            </div>
            <button class="primary-btn" type="button" data-testid="confirm-classroom-quality" @click="confirmClassroomQuality">我已检查并理解样本边界</button>
          </div>
          <ClassroomStepGuide doing="查看有效薪资、缺失薪资、技能词总数和字段问题。" why="招聘广告只是所采样本，缺失值和样本偏差会限制结论强度。" :completion="classroomQualityConfirmed ? '已确认数据质量与边界' : '点击确认后完成本步'" next="读取三个核心统计结果，形成描述性判断。" />
        </div>
      </article>

      <article v-else-if="classroomStep === 3" class="panel classroom-step-card">
        <header><span>03</span><div><h2>读取统计</h2><p>用三个关键数字概括样本，而不是只看图形印象。</p></div></header>
        <div class="classroom-step-layout">
          <div class="classroom-action-area">
            <div class="classroom-core-stats">
              <div><span>平均薪资</span><strong>{{ salaryText(stats.average) }}</strong><small>受极端值影响</small></div>
              <div><span>中位薪资</span><strong>{{ salaryText(stats.median) }}</strong><small>代表样本中间位置</small></div>
              <div><span>高频技能</span><strong>{{ topSkills.slice(0, 3).map(item => item.name).join('、') || '待补充' }}</strong><small>来自关键词词频</small></div>
            </div>
            <div class="mini-chart"><v-chart :option="salaryChart" autoresize /></div>
            <button class="primary-btn" type="button" data-testid="confirm-classroom-stats" @click="confirmClassroomStats">我已记录三项统计证据</button>
          </div>
          <ClassroomStepGuide doing="比较平均薪资与中位薪资，并记录前三项高频技能。" why="两个薪资指标能提示分布偏斜，技能词频为后续仿真提供岗位结构线索。" :completion="classroomStatsConfirmed ? '已记录平均数、中位数和高频技能' : '点击确认后完成本步'" next="进入一个最相关的实验，用模型解释统计现象。" />
        </div>
      </article>

      <article v-else-if="classroomStep === 4" class="panel classroom-step-card">
        <header><span>04</span><div><h2>完成一个仿真实验</h2><p>把描述性统计转化为有前提的机制解释。</p></div></header>
        <div class="classroom-step-layout">
          <div class="classroom-action-area">
            <div class="primary-simulation-card">
              <span>当前推荐</span>
              <h3>{{ classroomPrimarySimulation.title }}</h3>
              <p>{{ classroomPrimarySimulation.desc }}</p>
              <router-link :to="classroomPrimarySimulation.to" data-testid="classroom-simulation-link" @click="markClassroomSimulationVisited">进入实验并保存记录</router-link>
            </div>
            <p class="boundary-callout">实验中至少改变一个参数，记录基准值与当前值，并按“前提—机制—结果—边界”写出解释。返回后，本步会保留完成状态。</p>
            <button v-if="experimentRecords.length" class="ghost-btn" type="button" @click="classroomSimulationVisited = true">已检测到 {{ experimentRecords.length }} 条实验记录</button>
          </div>
          <ClassroomStepGuide doing="进入推荐实验，使用一个教师预设，再只改变一个参数。" why="统计只能描述样本，劳动经济学模型用于解释条件变化为何产生不同结果。" :completion="classroomStepComplete(4) ? '已进入实验或已保存实验记录' : '进入实验后完成本步'" next="回到工作台，生成带证据边界的结论。" />
        </div>
      </article>

      <article v-else class="panel classroom-step-card">
        <header><span>05</span><div><h2>写出结论</h2><p>结论必须同时包含样本证据、机制和不能推出的内容。</p></div></header>
        <div class="classroom-step-layout">
          <div class="classroom-action-area">
            <div v-if="classroomConclusionGenerated" class="classroom-conclusion" data-testid="classroom-conclusion">
              <strong>课堂结论草稿</strong><p>{{ classroomConclusion }}</p>
            </div>
            <button class="primary-btn" type="button" data-testid="generate-classroom-conclusion" @click="generateClassroomConclusion">生成课堂结论并写入报告草稿</button>
            <div class="form-actions">
              <button class="ghost-btn" type="button" :disabled="!classroomConclusionGenerated" @click="copyClassroomConclusion">复制结论</button>
              <button class="ghost-btn" type="button" @click="studentView = 'project'">继续完整项目报告</button>
            </div>
          </div>
          <ClassroomStepGuide doing="生成后检查结论是否包含样本量、统计结果、模型机制和证据边界。" why="课堂任务的目标不是得到唯一答案，而是形成可复核、有边界的判断。" :completion="classroomConclusionGenerated ? '课堂结论已生成并进入报告草稿' : '生成结论后完成课堂五步'" next="导出作业数据包，或切换完整项目版继续完善七部分报告。" />
        </div>
      </article>

      <footer class="classroom-nav-actions">
        <button type="button" :disabled="classroomStep === 1" @click="classroomStep -= 1">上一步</button>
        <button v-if="classroomStep < 5" class="primary-btn" type="button" :disabled="!classroomStepComplete(classroomStep)" data-testid="classroom-next" @click="classroomStep += 1">下一步</button>
        <button v-else class="primary-btn" type="button" :disabled="!classroomStepComplete(5)" @click="exportAssignmentPackage">导出作业数据包</button>
      </footer>
    </section>

    <div v-if="studentView === 'project'" class="project-workflow" data-testid="project-workflow">
    <section class="panel target-panel">
      <div class="panel-title">
        <span>01</span>
        <h2>研究对象</h2>
      </div>
      <div class="target-grid">
        <label>
          行业
          <input v-model.trim="target.industry" list="industry-options" placeholder="如：文旅与会展、信息技术、制造业">
        </label>
        <label>
          岗位
          <input v-model.trim="target.position" placeholder="如：人力资源专员、数据分析师、活动策划">
        </label>
        <label>
          地区
          <input v-model.trim="target.region" list="region-options" placeholder="如：成都、重庆、成渝双城经济圈">
        </label>
      </div>
      <datalist id="industry-options">
        <option v-for="item in industryOptions" :key="item" :value="item" />
      </datalist>
      <datalist id="region-options">
        <option v-for="item in regionOptions" :key="item" :value="item" />
      </datalist>
    </section>

    <section class="panel template-panel">
      <div class="panel-title">
        <span>02</span>
        <h2>CSV 模板与导入校验</h2>
      </div>
      <div class="template-layout">
        <div class="template-copy">
          <strong>先按模板采集，再导入预览。</strong>
          <p>技能关键词请用中文分号隔开，例如：Excel；数据分析；劳动法；招聘；薪酬核算。导入前系统会先检查样本数、有效薪资、缺失项和问题行，不会直接写入样本库。</p>
          <div class="form-actions compact">
            <button class="primary-btn" type="button" @click="downloadCsvTemplate">下载 CSV 模板</button>
            <button class="ghost-btn" type="button" @click="downloadExampleCsv">下载示例数据</button>
            <label class="file-btn">
              选择 CSV 并预览
              <input type="file" accept=".csv,text/csv" @change="previewCsv">
            </label>
          </div>
        </div>
        <div class="field-list" aria-label="CSV 模板字段">
          <span v-for="field in csvHeaders" :key="field">{{ field }}</span>
        </div>
      </div>
      <p class="hint">建议使用 UTF-8 CSV。本页用于整理你们采集到的样本数据，不会自动抓取招聘平台信息。</p>
    </section>

    <section v-if="csvPreview" class="panel preview-panel">
      <div class="panel-title">
        <span>03</span>
        <h2>CSV 导入前预览</h2>
      </div>
      <div class="preview-cards">
        <div v-for="card in previewCards" :key="card.label" class="stat-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </div>
      <div class="preview-body">
        <div class="issue-box">
          <strong>问题行</strong>
          <p v-if="csvPreview.issueRows.length === 0">未发现明显格式问题，可以导入。</p>
          <ul v-else>
            <li v-for="item in csvPreview.issueRows.slice(0, 10)" :key="item.rowNumber">
              第 {{ item.rowNumber }} 行：{{ item.issues.join('；') }}
            </li>
          </ul>
          <p v-if="csvPreview.issueRows.length > 10" class="muted">还有 {{ csvPreview.issueRows.length - 10 }} 行问题未展开。</p>
        </div>
        <div class="preview-table-wrap">
          <table>
            <thead>
              <tr>
                <th>行号</th>
                <th>岗位</th>
                <th>企业</th>
                <th>城市</th>
                <th>薪资</th>
                <th>技能数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in csvPreview.rows.slice(0, 8)" :key="row.rowNumber">
                <td>{{ row.rowNumber }}</td>
                <td>{{ row.sample.position || '未填' }}</td>
                <td>{{ row.sample.company || '未填' }}</td>
                <td>{{ row.sample.city || '未填' }}</td>
                <td>{{ salaryRangeText(row.sample) }}</td>
                <td>{{ splitSkills(row.sample.skills).length }}</td>
                <td :class="{ 'bad-text': row.issues.length }">{{ row.issues.length ? '需检查' : '可导入' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="confirmCsvImport">确认导入 {{ csvPreview.importableRows.length }} 条</button>
        <button class="ghost-btn" type="button" @click="cancelCsvPreview">取消预览</button>
      </div>
    </section>
    <section v-else class="panel preview-panel preview-empty">
      <div class="panel-title"><span>03</span><h2>CSV 导入前预览</h2></div>
      <p>选择 CSV 后，这里会显示可导入样本、有效薪资、缺失项、技能词和问题行；确认导入后继续第 04 步补充样本。</p>
    </section>

    <section class="panel">
      <div class="panel-title">
        <span>04</span>
        <h2>样本补充与编辑</h2>
      </div>
      <div class="sample-form">
        <label v-for="field in sampleFields" :key="field.key" :class="{ wide: field.wide }">
          {{ field.label }}
          <input v-if="field.type !== 'textarea'" v-model.trim="draft[field.key]" :type="field.type || 'text'" :placeholder="field.placeholder">
          <textarea v-else v-model.trim="draft[field.key]" :placeholder="field.placeholder"></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="saveSample">{{ editingId ? '保存修改' : '新增样本' }}</button>
        <button class="ghost-btn" type="button" @click="resetDraft">清空表单</button>
      </div>
    </section>

    <section class="panel table-panel">
      <div class="panel-title">
        <span>05</span>
        <h2>样本清单</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>平台</th>
              <th>企业</th>
              <th>岗位</th>
              <th>行业</th>
              <th>城市</th>
              <th>薪资</th>
              <th>学历</th>
              <th>经验</th>
              <th>技能关键词</th>
              <th>证据</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="samples.length === 0">
              <td colspan="12" class="empty-cell">还没有样本。先下载模板采集数据，或手动新增几条样本进行课堂演示。</td>
            </tr>
            <tr v-for="sample in samples" :key="sample.id">
              <td>{{ sample.sampleNo || '-' }}</td>
              <td>{{ sample.platform || '-' }}</td>
              <td>{{ sample.company }}</td>
              <td>{{ sample.position }}</td>
              <td>{{ sample.industry }}</td>
              <td>{{ sample.city }}</td>
              <td>{{ salaryRangeText(sample) }}</td>
              <td>{{ sample.education }}</td>
              <td>{{ sample.experience }}</td>
              <td class="skills-cell">{{ sample.skills }}</td>
              <td>{{ sample.screenshotNo || sample.jobLink || '-' }}</td>
              <td class="row-actions">
                <button type="button" @click="editSample(sample)">编辑</button>
                <button type="button" @click="deleteSample(sample.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="stats-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </div>
    </section>

    <section class="chart-grid">
      <div class="panel chart-panel">
        <h2>薪资区间柱状图</h2>
        <v-chart :option="salaryChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>城市分布</h2>
        <v-chart :option="cityChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>学历要求分布</h2>
        <v-chart :option="educationChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel">
        <h2>经验要求分布</h2>
        <v-chart :option="experienceChart" autoresize style="height:300px" />
      </div>
      <div class="panel chart-panel wide-chart">
        <h2>技能词频 Top 10</h2>
        <v-chart :option="skillChart" autoresize style="height:320px" />
      </div>
    </section>

    <section class="panel skill-panel">
      <div class="panel-title">
        <span>06</span>
        <h2>技能关键词词频</h2>
      </div>
      <div class="skill-tags">
        <span v-for="skill in topSkills" :key="skill.name">{{ skill.name }} × {{ skill.value }}</span>
        <span v-if="topSkills.length === 0" class="muted">导入或录入技能关键词后自动生成。</span>
      </div>
    </section>

    <section class="panel calibration-panel">
      <div class="panel-title">
        <span>07</span>
        <h2>样本覆盖与成渝情景校准</h2>
      </div>
      <p class="local-note">只有文旅/会展研究对象、样本量和字段完整度达到门槛时，系统才允许把样本特征转换为成渝实验室的可解释参数。招聘广告数量不等于社会真实岗位需求。</p>
      <div class="calibration-status" :class="tourismCalibration.status">
        <strong>{{ tourismCalibration.status === 'ready' ? '可以校准' : '暂不校准' }}</strong>
        <span v-if="tourismCalibration.reasons.length">{{ tourismCalibration.reasons.join('；') }}</span>
        <span v-else>样本覆盖达到最低门槛，可将薪资中位数与数字技能词频用于情景参数。</span>
      </div>
      <div class="calibration-grid">
        <div><span>样本量</span><strong>{{ tourismCalibration.sample_size }}</strong></div>
        <div><span>采集日期</span><strong>{{ tourismCalibration.collection_start || '未填' }} 至 {{ tourismCalibration.collection_end || '未填' }}</strong></div>
        <div><span>薪资缺失率</span><strong>{{ tourismCalibration.salary_missing_rate_pct }}%</strong></div>
        <div><span>模型版本</span><strong>{{ tourismCalibration.model_version }}</strong></div>
        <div><span>情景不确定性</span><strong>±{{ tourismCalibration.uncertainty_pct }}%</strong></div>
      </div>
      <div class="coverage-grid">
        <div>
          <strong>平台构成</strong>
          <p>{{ formatComposition(tourismCalibration.platform_composition) }}</p>
        </div>
        <div>
          <strong>城市构成</strong>
          <p>{{ formatComposition(tourismCalibration.city_composition) }}</p>
        </div>
        <div>
          <strong>参数校准前后</strong>
          <p v-for="item in tourismCalibration.before_after" :key="item.name">{{ item.name }}：{{ item.before }} → {{ item.after }} {{ item.unit }}</p>
        </div>
      </div>
      <button class="primary-btn" type="button" :disabled="tourismCalibration.status !== 'ready'" @click="saveTourismCalibration">
        保存校准参数到成渝实验室
      </button>
    </section>

    <section class="panel sim-panel">
      <div class="panel-title">
        <span>08</span>
        <h2>{{ simulationLabel }}仿真辅助分析</h2>
      </div>
      <div class="recommend-box">
        <strong>建议进入：</strong>
        <ol>
          <li v-for="item in recommendedLinks" :key="item.title">{{ item.title }}：{{ item.reason }}</li>
        </ol>
      </div>
      <div class="sim-grid">
        <div v-for="item in simulationLinks" :key="item.title" class="sim-card">
          <strong>{{ item.title }}</strong>
          <p>{{ item.desc }}</p>
          <router-link :to="item.to">进入模块</router-link>
        </div>
      </div>
    </section>

    <section class="panel records-panel">
      <div class="panel-title">
        <span>09</span>
        <h2>已保存的{{ simulationLabel }}实验记录</h2>
      </div>
      <p class="local-note">这些记录只保存在当前浏览器。不同同学、不同设备、不同浏览器之间不会自动同步。</p>
      <div v-if="experimentRecords.length === 0" class="empty-block">工资、失业、成渝文旅等实验室保存的实验记录会出现在这里，用于报告第五部分。</div>
      <div v-else class="record-list">
        <article v-for="record in experimentRecords" :key="record.id">
          <div>
            <strong>{{ record.experimentName }}</strong>
            <span>{{ formatDate(record.createdAt) }}</span>
          </div>
          <p>{{ record.conclusion }}</p>
          <div class="record-meta">
            <span>规则反馈 {{ record.ruleFeedback?.score ?? 0 }}/4</span>
            <span>{{ record.modelVersion || '旧版记录' }}</span>
            <span>{{ record.dataSourceType || '来源未标注' }}</span>
            <span>{{ isRecordComplete(record) ? '实验闭环已完成' : '实验闭环待补充' }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="panel data-panel">
      <div class="panel-title">
        <span>10</span>
        <h2>本机数据管理</h2>
      </div>
      <div class="data-layout">
        <div>
          <strong>当前浏览器数据</strong>
          <p>本页数据使用浏览器本地存储。适合 30 人同时上课时各自完成作业，不会把不同学生或小组的数据混在一起。</p>
          <div class="data-summary">
            <span>样本 {{ samples.length }} 条</span>
            <span>实验记录 {{ experimentRecords.length }} 条</span>
            <span>{{ reportText ? '已有报告草稿' : '暂无报告草稿' }}</span>
          </div>
        </div>
        <div class="data-actions">
          <button class="primary-btn" type="button" @click="exportAssignmentPackage">导出作业数据包</button>
          <label class="file-btn">
            导入作业数据包
            <input type="file" accept=".json,application/json" @change="importAssignmentPackage">
          </label>
          <div class="danger-zone">
            <span>危险操作 · 两次确认</span>
            <button class="danger-btn" type="button" @click="clearLocalWorkbenchData">清空本机数据</button>
          </div>
        </div>
      </div>
      <p class="hint">数据包会包含研究对象、招聘样本、{{ simulationLabel }}实验记录和当前报告草稿，方便换电脑继续做或提交给老师留档。</p>
    </section>

    <section class="panel report-panel">
      <div class="panel-title">
        <span>11</span>
        <h2>Markdown 报告草稿</h2>
      </div>
      <textarea v-model="reportText" class="report-textarea" @input="reportEdited = true"></textarea>
      <div class="form-actions">
        <button class="primary-btn" type="button" @click="generateReportDraft">生成/刷新报告草稿</button>
        <button class="ghost-btn" type="button" @click="copyReport">复制 Markdown</button>
        <button class="ghost-btn" type="button" @click="downloadMarkdown">下载 .md</button>
        <button class="ghost-btn" type="button" @click="downloadHtml">下载 .html</button>
        <button class="ghost-btn" type="button" @click="printPage">打印页面</button>
      </div>
      <p class="hint">建议先用 Markdown 草稿完成报告主体，再补充解释、截图编号和仿真实验结论。</p>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
    </div>
    </template>

    <section v-else class="teacher-workbench">
      <div class="panel teacher-intro">
        <div class="panel-title">
          <span>T</span>
          <h2>匿名作业数据包汇总</h2>
        </div>
        <p>一次选择多个学生导出的 JSON 作业数据包。系统只在当前教师浏览器中统计完成情况和规则反馈，不上传文件，也不推断学生身份。</p>
        <div class="form-actions">
          <label class="file-btn">
            导入多个匿名作业数据包
            <input type="file" multiple accept=".json,application/json" @change="importClassPackages">
          </label>
          <button class="ghost-btn" type="button" :disabled="teacherPackages.length === 0" @click="exportClassSummary">导出班级汇总 CSV</button>
          <button class="danger-btn" type="button" :disabled="teacherPackages.length === 0" @click="clearTeacherPackages">清空汇总</button>
        </div>
        <p v-if="teacherMessage" class="message">{{ teacherMessage }}</p>
      </div>

      <section class="stats-grid teacher-stats">
        <div class="stat-card"><span>已验证数据包</span><strong>{{ teacherPackages.length }} 份</strong></div>
        <div class="stat-card"><span>实验记录</span><strong>{{ teacherSummary.totalRecords }} 条</strong></div>
        <div class="stat-card"><span>完整闭环记录</span><strong>{{ teacherSummary.completeRecords }} 条</strong></div>
        <div class="stat-card"><span>闭环完成率</span><strong>{{ teacherSummary.completionRate }}%</strong></div>
        <div class="stat-card"><span>平均规则得分</span><strong>{{ teacherSummary.averageRubric }}/4</strong></div>
        <div class="stat-card"><span>含报告草稿</span><strong>{{ teacherSummary.reportCount }} 份</strong></div>
      </section>

      <section class="teacher-grid">
        <article class="panel">
          <h2>各步骤完成情况</h2>
          <div class="step-bars">
            <div v-for="item in teacherSummary.steps" :key="item.label">
              <span>{{ item.label }}</span>
              <div><i :style="{ width: `${item.rate}%` }"></i></div>
              <strong>{{ item.rate }}%</strong>
            </div>
          </div>
        </article>
        <article class="panel">
          <h2>解释质量分布</h2>
          <div class="quality-grid">
            <div v-for="item in teacherSummary.qualityDistribution" :key="item.score">
              <strong>{{ item.score }}分</strong><span>{{ item.count }}条</span>
            </div>
          </div>
        </article>
        <article class="panel">
          <h2>预测前后变化记录</h2>
          <p>有初始预测和修改后解释：{{ teacherSummary.predictionChanges.comparable }} 条</p>
          <p>已完成反事实比较：{{ teacherSummary.predictionChanges.counterfactual }} 条</p>
          <p>可比较记录占比：{{ teacherSummary.predictionChanges.rate }}%</p>
          <small>这里只统计步骤是否完成，不自动判断学生观点是否“变对”。</small>
        </article>
        <article class="panel">
          <h2>常见缺失项</h2>
          <p v-if="teacherSummary.commonErrors.length === 0" class="muted">导入数据后生成。</p>
          <p v-for="item in teacherSummary.commonErrors" :key="item.label">{{ item.label }}：{{ item.count }} 条</p>
        </article>
        <article class="panel">
          <h2>模型解释误区提示</h2>
          <p>缺少指标证据：{{ teacherSummary.misconceptions.missingEvidence }} 条</p>
          <p>缺少机制词：{{ teacherSummary.misconceptions.missingMechanism }} 条</p>
          <p>未完成反事实比较：{{ teacherSummary.misconceptions.missingCounterfactual }} 条</p>
        </article>
      </section>

      <section class="panel table-panel">
        <h2>匿名数据包清单</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>匿名编号</th><th>研究对象</th><th>样本数</th><th>实验记录</th><th>完整闭环</th><th>报告草稿</th></tr></thead>
            <tbody>
              <tr v-for="item in teacherPackages" :key="item.anonymousId">
                <td>{{ item.anonymousId }}</td>
                <td>{{ item.payload.target?.industry || '未填' }} / {{ item.payload.target?.position || '未填' }}</td>
                <td>{{ item.payload.samples.length }}</td>
                <td>{{ item.payload.experimentRecords.length }}</td>
                <td>{{ packageCompleteRecords(item.payload) }}</td>
                <td>{{ item.payload.reportText ? '有' : '无' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { calibrateTourism } from '../domain/tourism/model'
import { isAnonymous } from '../config/appMode'
import ClassroomStepGuide from '../components/ClassroomStepGuide.vue'
import { RECORD_SCHEMA_VERSION } from '../config/release'
import {
  readJsonStorage,
  readTextStorage,
  removeJsonStorage,
  writeJsonStorage,
  writeTextStorage,
} from '../lib/storage'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const SAMPLE_KEY = 'lmdtReportSamples'
const TARGET_KEY = 'lmdtReportTarget'
const RECORD_KEY = 'lmdtReportExperimentRecords'
const REPORT_KEY = 'lmdtReportDraft'
const TOURISM_CALIBRATION_KEY = 'lmdtTourismCalibration'
const CLASSROOM_PROGRESS_KEY = 'lmdtReportClassroomProgress'
const PACKAGE_SCHEMA = 'lmdt-report-workbench-package-v1'

const simulationLabel = __ANONYMOUS_BUILD__ || isAnonymous ? '课程' : 'LMDT '
const packageAppName = __ANONYMOUS_BUILD__ || isAnonymous ? '课程实验平台' : 'LMDT 3.0'
const workflowSteps = ['采集招聘数据', '按模板导入', '预览与校验', '自动统计', `${simulationLabel}仿真`, '生成报告草稿', '导出作业']
const csvHeaders = ['样本编号', '招聘平台', '采集日期', '企业名称', '岗位名称', '行业', '城市', '薪资下限', '薪资上限', '学历要求', '经验要求', '技能关键词', '用工形式', '岗位链接', '截图编号', '备注']
const industryOptions = ['文旅与会展', '文化旅游', '信息技术', '制造业', '金融业', '教育', '医疗健康', '现代服务业', '交通运输', '批发零售']
const regionOptions = ['全国', '成渝双城经济圈', '成都', '重庆', '北京', '上海', '广州', '深圳', '杭州', '西安']

const sampleFields = [
  { key: 'sampleNo', label: '样本编号', placeholder: 'S001' },
  { key: 'platform', label: '招聘平台', placeholder: '智联招聘 / BOSS直聘 / 线下访谈' },
  { key: 'collectDate', label: '采集日期', type: 'date' },
  { key: 'company', label: '企业名称', placeholder: '某科技公司' },
  { key: 'position', label: '岗位名称', placeholder: '人力资源专员' },
  { key: 'industry', label: '行业', placeholder: '现代服务业' },
  { key: 'city', label: '城市', placeholder: '成都' },
  { key: 'salaryMin', label: '薪资下限', type: 'number', placeholder: '6000' },
  { key: 'salaryMax', label: '薪资上限', type: 'number', placeholder: '9000' },
  { key: 'education', label: '学历要求', placeholder: '本科' },
  { key: 'experience', label: '经验要求', placeholder: '1-3年' },
  { key: 'employmentType', label: '用工形式', placeholder: '全职' },
  { key: 'jobLink', label: '岗位链接', placeholder: 'URL，可为空', wide: true },
  { key: 'screenshotNo', label: '截图编号', placeholder: '截图01' },
  { key: 'skills', label: '技能关键词', type: 'textarea', placeholder: 'Excel；数据分析；劳动法；招聘；薪酬核算', wide: true },
  { key: 'notes', label: '备注', type: 'textarea', placeholder: '样本说明或采集备注', wide: true },
]

const emptyDraft = () => Object.fromEntries(sampleFields.map((field) => [field.key, '']))

const target = reactive({ industry: '', position: '', region: '' })
const draft = reactive(emptyDraft())
const samples = ref([])
const editingId = ref('')
const experimentRecords = ref([])
const csvPreview = ref(null)
const reportText = ref('')
const reportEdited = ref(false)
const message = ref('')
const workbenchMode = ref('student')
const studentView = ref('classroom')
const classroomStep = ref(1)
const classroomQualityConfirmed = ref(false)
const classroomStatsConfirmed = ref(false)
const classroomSimulationVisited = ref(false)
const classroomConclusionGenerated = ref(false)
const teacherPackages = ref([])
const teacherMessage = ref('')

const classroomSteps = [
  { step: 1, title: '载入数据', done: '至少1条样本' },
  { step: 2, title: '检查质量', done: '确认边界' },
  { step: 3, title: '读取统计', done: '记录3项指标' },
  { step: 4, title: '完成实验', done: '进入或保存记录' },
  { step: 5, title: '写出结论', done: '生成有边界结论' },
]

const salaryValues = computed(() => samples.value
  .map((sample) => salaryMidpoint(sample))
  .filter((value) => Number.isFinite(value) && value > 0))

const stats = computed(() => {
  const values = [...salaryValues.value].sort((a, b) => a - b)
  const salaryCount = values.length
  const average = salaryCount ? Math.round(values.reduce((sum, value) => sum + value, 0) / salaryCount) : 0
  const median = salaryCount ? Math.round((values[Math.floor((salaryCount - 1) / 2)] + values[Math.ceil((salaryCount - 1) / 2)]) / 2) : 0
  return {
    count: samples.value.length,
    salaryCount,
    missingSalary: Math.max(samples.value.length - salaryCount, 0),
    average,
    median,
    max: salaryCount ? Math.round(values[values.length - 1]) : 0,
    min: salaryCount ? Math.round(values[0]) : 0,
  }
})

const statCards = computed(() => [
  { label: '样本数量', value: `${stats.value.count} 条` },
  { label: '有效薪资', value: `${stats.value.salaryCount} 条` },
  { label: '平均薪资', value: salaryText(stats.value.average) },
  { label: '中位薪资', value: salaryText(stats.value.median) },
  { label: '最高薪资', value: salaryText(stats.value.max) },
  { label: '最低薪资', value: salaryText(stats.value.min) },
])

const cityCounts = computed(() => countBy(samples.value.map((sample) => sample.city || '未标注')))
const educationCounts = computed(() => countBy(samples.value.map((sample) => sample.education || '未标注')))
const experienceCounts = computed(() => countBy(samples.value.map((sample) => sample.experience || '未标注')))
const salaryBuckets = computed(() => {
  const buckets = [
    { name: '5千以下', min: 0, max: 5000 },
    { name: '5千-8千', min: 5000, max: 8000 },
    { name: '8千-1.2万', min: 8000, max: 12000 },
    { name: '1.2万-1.8万', min: 12000, max: 18000 },
    { name: '1.8万以上', min: 18000, max: Infinity },
  ]
  return buckets.map((bucket) => ({
    name: bucket.name,
    value: salaryValues.value.filter((value) => value >= bucket.min && value < bucket.max).length,
  }))
})
const skillCounts = computed(() => countBy(samples.value.flatMap((sample) => splitSkills(sample.skills))))
const topSkills = computed(() => Object.entries(skillCounts.value)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 10))
const totalSkillTokens = computed(() => Object.values(skillCounts.value).reduce((sum, value) => sum + value, 0))
const tourismCalibration = computed(() => calibrateTourism(samples.value, target))

const teacherSummary = computed(() => {
  const records = teacherPackages.value.flatMap(item => item.payload.experimentRecords)
  const totalRecords = records.length
  const completeRecords = records.filter(isRecordComplete).length
  const stepDefinitions = [
    { key: 'initialPrediction', label: '初始预测' },
    { key: 'initialReason', label: '初始理由' },
    { key: 'baselineResult', label: '基准结果' },
    { key: 'counterfactualResult', label: '反事实结果' },
    { key: 'studentExplanation', label: '学生解释' },
    { key: 'revisedExplanation', label: '修改解释' },
  ]
  const steps = stepDefinitions.map(item => ({
    label: item.label,
    rate: totalRecords
      ? Math.round(records.filter(record => hasRecordValue(record[item.key])).length / totalRecords * 100)
      : 0,
  }))
  const rubricScores = records.map(record => Number(record.ruleFeedback?.score ?? 0))
  const qualityDistribution = Array.from({ length: 5 }, (_, score) => ({
    score,
    count: rubricScores.filter(value => value === score).length,
  }))
  const errorDefinitions = [
    { key: 'initialPrediction', label: '缺少初始预测' },
    { key: 'baselineResult', label: '缺少基准结果' },
    { key: 'counterfactualResult', label: '缺少反事实结果' },
    { key: 'studentExplanation', label: '缺少学生解释' },
    { key: 'revisedExplanation', label: '缺少修改后解释' },
  ]
  const commonErrors = errorDefinitions
    .map(item => ({
      label: item.label,
      count: records.filter(record => !hasRecordValue(record[item.key])).length,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
  return {
    totalRecords,
    completeRecords,
    completionRate: totalRecords ? Math.round(completeRecords / totalRecords * 100) : 0,
    averageRubric: rubricScores.length
      ? (rubricScores.reduce((sum, value) => sum + value, 0) / rubricScores.length).toFixed(1)
      : '0.0',
    reportCount: teacherPackages.value.filter(item => item.payload.reportText).length,
    steps,
    qualityDistribution,
    commonErrors,
    predictionChanges: {
      comparable: records.filter(record =>
        hasRecordValue(record.initialPrediction) && hasRecordValue(record.revisedExplanation)).length,
      counterfactual: records.filter(record => hasRecordValue(record.counterfactualResult)).length,
      rate: totalRecords
        ? Math.round(records.filter(record =>
          hasRecordValue(record.initialPrediction) && hasRecordValue(record.revisedExplanation)).length / totalRecords * 100)
        : 0,
    },
    misconceptions: {
      missingEvidence: records.filter(record => !/\d|%|元|指数|率/.test(record.studentExplanation || '')).length,
      missingMechanism: records.filter(record => !/因为|因此|导致|影响|提高|降低|替代|收入效应|匹配|成本/.test(record.studentExplanation || '')).length,
      missingCounterfactual: records.filter(record => !record.counterfactualResult).length,
    },
  }
})

const salaryChart = computed(() => barOption(salaryBuckets.value.map((item) => item.name), salaryBuckets.value.map((item) => item.value), '#06b6d4'))
const cityChart = computed(() => barOption(Object.keys(cityCounts.value), Object.values(cityCounts.value), '#22c55e'))
const educationChart = computed(() => pieOption(educationCounts.value))
const experienceChart = computed(() => barOption(Object.keys(experienceCounts.value), Object.values(experienceCounts.value), '#8b5cf6'))
const skillChart = computed(() => barOption(topSkills.value.map((item) => item.name), topSkills.value.map((item) => item.value), '#f59e0b', true))

const previewCards = computed(() => {
  if (!csvPreview.value) return []
  return [
    { label: '识别样本', value: `${csvPreview.value.summary.total} 条` },
    { label: '可导入', value: `${csvPreview.value.importableRows.length} 条` },
    { label: '有效薪资', value: `${csvPreview.value.summary.validSalary} 条` },
    { label: '缺失薪资', value: `${csvPreview.value.summary.missingSalary} 条` },
    { label: '技能关键词', value: `${csvPreview.value.summary.skillTokens} 个` },
    { label: '问题行', value: csvPreview.value.issueRows.length ? csvPreview.value.issueRows.map((row) => row.rowNumber).join('、') : '无' },
  ]
})

const simulationLinks = [
  { title: '劳动力市场数据分析中心', desc: '核查时间、单位、缺失值和指标口径，形成历史数据证据。', to: '/analysis/market' },
  { title: '基础预测与情景推演', desc: '比较朴素、移动平均、线性趋势和CAGR，并用留出期回测。', to: '/forecast/basic' },
  { title: 'AI岗位任务重构', desc: '区分任务替代、需求扩张、技能互补与新任务效应。', to: '/lab/ai-occupation' },
  { title: '工资决定与工资形式', desc: '比较效率工资、补偿性差异、激励工资和经验工资路径。', to: '/lab/wage' },
  { title: '失业经济学', desc: '分析技能错配、AI 冲击、岗位空缺和匹配效率。', to: '/lab/unemployment' },
  { title: '劳动力市场歧视', desc: '讨论招聘条件中的公平就业和歧视风险。', to: '/lab/discrimination' },
  { title: '收入分配实验室', desc: '用于收入差距、技能溢价和共同富裕讨论。', to: '/lab/income-distribution' },
  { title: '成渝文旅产业实验室', desc: '用于文旅与会展岗位需求预测、技能缺口和政策情景比较。', to: '/lab/chengyu-tourism' },
]

const recommendedLinks = computed(() => {
  const text = `${target.industry}${target.position}`
  const links = [
    { title: '劳动力市场数据分析中心', reason: '检查历史数据来源、口径和指标公式' },
    { title: '基础预测与情景推演', reason: '用留出回测比较基础预测方法' },
    { title: 'AI岗位任务重构', reason: '拆解岗位任务并比较替代、规模、互补和新任务效应' },
    { title: '工资决定与工资形式', reason: '比较工资形成机制及经验工资路径' },
    { title: '失业经济学', reason: '模拟技能错配、AI 冲击和匹配效率' },
    { title: '劳动力市场歧视', reason: '分析招聘条件是否存在歧视风险' },
  ]
  if (/文旅|旅游|会展|景区|研学/.test(text)) {
    links.unshift({ title: '成渝文旅产业实验室', reason: '比较游客增长、数字文旅和政策情景对岗位需求的影响' })
  }
  return links
})

const classroomQualityIssues = computed(() => {
  const issues = []
  const countMissing = key => samples.value.filter(sample => !sample[key]).length
  const missingPosition = countMissing('position')
  const missingCity = countMissing('city')
  const missingSkills = samples.value.filter(sample => splitSkills(sample.skills).length === 0).length
  if (missingPosition) issues.push(`${missingPosition} 条缺岗位名称`)
  if (missingCity) issues.push(`${missingCity} 条缺地区`)
  if (stats.value.missingSalary) issues.push(`${stats.value.missingSalary} 条缺有效薪资`)
  if (missingSkills) issues.push(`${missingSkills} 条缺技能关键词`)
  return issues
})

const classroomPrimarySimulation = computed(() => {
  const recommendedTitles = recommendedLinks.value.map(item => item.title)
  return simulationLinks.find(item => recommendedTitles.includes(item.title) && item.to.startsWith('/lab/'))
    || simulationLinks.find(item => item.to === '/lab/ai-occupation')
})

const classroomConclusion = computed(() => {
  const subject = `${target.region || '当前地区'}${target.industry || '当前行业'}的${target.position || '目标岗位'}`
  const skills = topSkills.value.slice(0, 3).map(item => item.name).join('、') || '核心技能仍待补充'
  const record = experimentRecords.value[0]
  const mechanism = record?.conclusion || `可通过${classroomPrimarySimulation.value.title}继续检验工资、需求、匹配或技术冲击机制`
  return `基于当前浏览器中 ${stats.value.count} 条招聘样本，${subject}的样本平均薪资为${salaryText(stats.value.average)}、中位薪资为${salaryText(stats.value.median)}，高频技能包括${skills}。仿真证据提示：${mechanism}。这一判断只在当前样本口径与模型参数前提下成立；招聘广告样本和教学仿真不能直接推出社会真实岗位总量、因果效应或个人就业结果。`
})

onMounted(() => {
  loadState()
  if (!reportText.value) generateReportDraft(false)
})

watch(
  [classroomStep, classroomQualityConfirmed, classroomStatsConfirmed, classroomSimulationVisited, classroomConclusionGenerated],
  () => persistJson(CLASSROOM_PROGRESS_KEY, {
    step: classroomStep.value,
    qualityConfirmed: classroomQualityConfirmed.value,
    statsConfirmed: classroomStatsConfirmed.value,
    simulationVisited: classroomSimulationVisited.value,
    conclusionGenerated: classroomConclusionGenerated.value,
  }, 1),
)

watch(samples, () => {
  persistJson(SAMPLE_KEY, samples.value, 2)
  invalidateStaleTourismCalibration()
  refreshReportIfUntouched()
}, { deep: true })

watch(target, () => {
  persistJson(TARGET_KEY, target, 2)
  invalidateStaleTourismCalibration()
  refreshReportIfUntouched()
}, { deep: true })

watch(reportText, () => {
  persistText(REPORT_KEY, reportText.value, 2)
})

function loadState() {
  const savedTarget = readJsonStorage(TARGET_KEY, null)
  const savedSamples = readJsonStorage(SAMPLE_KEY, [])
  const savedRecords = readJsonStorage(RECORD_KEY, [])
  if (savedTarget && typeof savedTarget === 'object' && !Array.isArray(savedTarget)) {
    Object.assign(target, savedTarget)
  }
  samples.value = (Array.isArray(savedSamples) ? savedSamples : []).map((sample) => normalizeSample(sample))
  experimentRecords.value = Array.isArray(savedRecords) ? savedRecords : []
  reportText.value = readTextStorage(REPORT_KEY, '')
  reportEdited.value = Boolean(reportText.value)
  const progress = readJsonStorage(CLASSROOM_PROGRESS_KEY, null)
  if (progress && typeof progress === 'object') {
    classroomStep.value = Math.min(5, Math.max(1, Number(progress.step) || 1))
    classroomQualityConfirmed.value = Boolean(progress.qualityConfirmed)
    classroomStatsConfirmed.value = Boolean(progress.statsConfirmed)
    classroomSimulationVisited.value = Boolean(progress.simulationVisited)
    classroomConclusionGenerated.value = Boolean(progress.conclusionGenerated)
  }
}

function classroomStepComplete(step) {
  return {
    1: samples.value.length > 0,
    2: classroomQualityConfirmed.value,
    3: classroomStatsConfirmed.value,
    4: classroomSimulationVisited.value || experimentRecords.value.length > 0,
    5: classroomConclusionGenerated.value,
  }[step]
}

function canOpenClassroomStep(step) {
  if (step === 1) return true
  return classroomSteps.slice(0, step - 1).every(item => classroomStepComplete(item.step))
}

function loadTeachingExample() {
  Object.assign(target, { industry: '现代服务业', position: '人力资源专员', region: '成渝双城经济圈' })
  const exampleRows = [
    ['成都', 6000, 8500, '本科', '1-3年', '招聘；Excel；沟通协调；劳动法'],
    ['重庆', 5500, 8000, '本科', '1-3年', '招聘；员工关系；劳动法；数据分析'],
    ['成都', 7000, 10000, '本科', '3-5年', '薪酬核算；Excel；数据分析；绩效管理'],
    ['重庆', 6500, 9000, '本科', '3-5年', '培训；沟通协调；人才盘点；PPT'],
    ['成都', 5000, 7000, '大专', '应届生', '招聘；办公软件；沟通协调；档案管理'],
    ['重庆', 8000, 12000, '本科', '3-5年', 'HRBP；业务分析；组织发展；数据分析'],
    ['成都', 9000, 14000, '硕士', '5年以上', '组织发展；人才发展；数据分析；项目管理'],
    ['重庆', 5800, 7800, '本科', '1-3年', '社保公积金；薪酬核算；Excel；劳动法'],
  ]
  samples.value = exampleRows.map((row, index) => normalizeSample({
    id: `teaching-example-${Date.now()}-${index}`,
    sampleNo: `T${String(index + 1).padStart(3, '0')}`,
    platform: '课堂教学示例',
    collectDate: today(),
    company: `虚构样本企业${String(index + 1).padStart(2, '0')}`,
    position: '人力资源专员',
    industry: '现代服务业',
    city: row[0],
    salaryMin: row[1],
    salaryMax: row[2],
    education: row[3],
    experience: row[4],
    skills: row[5],
    employmentType: '全职',
    screenshotNo: `教学示例${String(index + 1).padStart(2, '0')}`,
    notes: '虚构教学样本，不对应真实企业或招聘广告。',
  }))
  classroomQualityConfirmed.value = false
  classroomStatsConfirmed.value = false
  classroomSimulationVisited.value = false
  classroomConclusionGenerated.value = false
  setMessage('已载入 8 条明确标注为虚构的教学示例。')
}

function confirmClassroomQuality() {
  if (!samples.value.length) return setMessage('请先载入或导入样本。')
  classroomQualityConfirmed.value = true
  setMessage(classroomQualityIssues.value.length ? '已记录缺失项，请在结论中保留样本边界。' : '基础质量检查已完成。')
}

function confirmClassroomStats() {
  if (!stats.value.count) return setMessage('没有可统计的样本。')
  classroomStatsConfirmed.value = true
  setMessage('已记录平均薪资、中位薪资和高频技能。')
}

function markClassroomSimulationVisited() {
  classroomSimulationVisited.value = true
  persistJson(CLASSROOM_PROGRESS_KEY, {
    step: classroomStep.value,
    qualityConfirmed: classroomQualityConfirmed.value,
    statsConfirmed: classroomStatsConfirmed.value,
    simulationVisited: true,
    conclusionGenerated: classroomConclusionGenerated.value,
  }, 1)
}

function generateClassroomConclusion() {
  reportText.value = `${generateReport()}\n\n## 课堂五步结论\n${classroomConclusion.value}`
  reportEdited.value = false
  classroomConclusionGenerated.value = true
  setMessage('课堂结论已生成，并写入完整报告草稿。')
}

async function copyClassroomConclusion() {
  try {
    await navigator.clipboard.writeText(classroomConclusion.value)
    setMessage('课堂结论已复制。')
  } catch {
    setMessage('当前浏览器不支持自动复制，请在完整项目版中复制报告。')
  }
}

function saveSample() {
  const item = normalizeSample({ ...draft, id: editingId.value || `sample-${Date.now()}` })
  if (!item.position && !item.company) {
    setMessage('请至少填写岗位名称或企业名称。')
    return
  }
  if (editingId.value) {
    samples.value = samples.value.map((sample) => sample.id === editingId.value ? item : sample)
  } else {
    samples.value.unshift(item)
  }
  resetDraft()
  setMessage('样本已保存。')
}

function editSample(sample) {
  editingId.value = sample.id
  Object.assign(draft, emptyDraft(), sample)
}

function deleteSample(id) {
  samples.value = samples.value.filter((sample) => sample.id !== id)
}

function resetDraft() {
  editingId.value = ''
  Object.assign(draft, emptyDraft())
}

function downloadCsvTemplate() {
  downloadFile(toCsv([csvHeaders]), '岗位劳动力市场样本采集模板.csv', 'text/csv;charset=utf-8')
}

function downloadExampleCsv() {
  const rows = [
    csvHeaders,
    ['S001', 'BOSS直聘', today(), '某文旅集团', '活动策划专员', '文旅与会展', '成都', '6000', '9000', '本科', '1-3年', '活动策划；新媒体运营；沟通协调；Excel', '全职', 'https://example.com/job/001', '截图01', '课堂示例'],
    ['S002', '智联招聘', today(), '某科技公司', '数据分析师', '信息技术', '重庆', '9000', '14000', '本科', '3-5年', 'SQL；Python；数据分析；可视化', '全职', 'https://example.com/job/002', '截图02', '课堂示例'],
  ]
  downloadFile(toCsv(rows), '岗位劳动力市场样本示例.csv', 'text/csv;charset=utf-8')
}

async function previewCsv(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const rows = parseCsv(text)
  csvPreview.value = analyzeCsvRows(rows)
  event.target.value = ''
  setMessage(`已识别 ${csvPreview.value.summary.total} 条样本，请先查看预览。`)
}

function confirmCsvImport() {
  if (!csvPreview.value) return
  samples.value = [...csvPreview.value.importableRows.map((row) => row.sample), ...samples.value]
  setMessage(`已导入 ${csvPreview.value.importableRows.length} 条样本。`)
  csvPreview.value = null
}

function cancelCsvPreview() {
  csvPreview.value = null
}

function analyzeCsvRows(rows) {
  const parsedRows = rows.map((row, index) => {
    const sample = normalizeSample(mapCsvRow(row, index))
    const issues = validateSample(sample)
    return {
      rowNumber: index + 2,
      sample,
      issues,
      importable: Boolean(sample.position || sample.company),
    }
  }).filter((row) => hasAnyContent(row.sample))
  const importableRows = parsedRows.filter((row) => row.importable)
  const issueRows = parsedRows.filter((row) => row.issues.length)
  return {
    rows: parsedRows,
    importableRows,
    issueRows,
    summary: {
      total: parsedRows.length,
      validSalary: importableRows.filter((row) => salaryMidpoint(row.sample) > 0).length,
      missingSalary: importableRows.filter((row) => salaryMidpoint(row.sample) <= 0).length,
      skillTokens: importableRows.reduce((sum, row) => sum + splitSkills(row.sample.skills).length, 0),
    },
  }
}

function validateSample(sample) {
  const issues = []
  if (!sample.position) issues.push('缺少岗位名称')
  if (!sample.city) issues.push('缺少城市')
  if (!sample.salaryMin && !sample.salaryMax) issues.push('缺失薪资')
  if (sample._salaryOrderFixed) issues.push('薪资下限高于上限，已自动调换')
  if (splitSkills(sample.skills).length === 0) issues.push('缺少技能关键词')
  return issues
}

function mapCsvRow(row, index) {
  const get = (...names) => names.map((name) => row[name]).find((value) => value !== undefined && value !== '') || ''
  const source = get('招聘链接或截图编号', '来源', 'source')
  return {
    id: `sample-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    sampleNo: get('样本编号', '编号', 'sampleNo'),
    platform: get('招聘平台', '平台', 'platform'),
    collectDate: get('采集日期', '日期', 'collectDate'),
    company: get('企业名称', '企业', 'company'),
    position: get('岗位名称', '岗位', 'position'),
    industry: get('行业', 'industry'),
    city: get('城市', '地区', 'region', 'city'),
    salaryMin: get('薪资下限', '最低薪资', 'salaryMin'),
    salaryMax: get('薪资上限', '最高薪资', 'salaryMax'),
    education: get('学历要求', '学历', 'education'),
    experience: get('经验要求', '经验', 'experience'),
    skills: get('技能关键词', '技能', 'skills'),
    employmentType: get('用工形式', 'employmentType'),
    jobLink: get('岗位链接', '招聘链接', 'jobLink') || (/^https?:\/\//.test(source) ? source : ''),
    screenshotNo: get('截图编号', 'screenshotNo') || (!/^https?:\/\//.test(source) ? source : ''),
    notes: get('备注', 'notes'),
  }
}

function normalizeSample(sample) {
  let salaryMin = parseMoney(sample.salaryMin)
  let salaryMax = parseMoney(sample.salaryMax)
  let salaryOrderFixed = false
  if (!salaryMax && salaryMin) salaryMax = salaryMin
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    salaryOrderFixed = true
    const tmp = salaryMin
    salaryMin = salaryMax
    salaryMax = tmp
  }
  const legacySource = sample.source || ''
  return {
    id: sample.id || `sample-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sampleNo: sample.sampleNo || '',
    platform: sample.platform || '',
    collectDate: sample.collectDate || '',
    company: sample.company || '',
    position: sample.position || target.position,
    industry: sample.industry || target.industry,
    city: sample.city || sample.region || target.region,
    salaryMin,
    salaryMax,
    education: sample.education || '未标注',
    experience: sample.experience || '未标注',
    skills: normalizeSkillText(sample.skills || ''),
    employmentType: sample.employmentType || '未标注',
    jobLink: sample.jobLink || (/^https?:\/\//.test(legacySource) ? legacySource : ''),
    screenshotNo: sample.screenshotNo || (!/^https?:\/\//.test(legacySource) ? legacySource : ''),
    notes: sample.notes || '',
    _salaryOrderFixed: Boolean(sample._salaryOrderFixed || salaryOrderFixed),
  }
}

function hasAnyContent(sample) {
  return ['sampleNo', 'platform', 'company', 'position', 'industry', 'city', 'skills', 'jobLink', 'screenshotNo', 'notes']
    .some((key) => String(sample[key] || '').trim()) || sample.salaryMin || sample.salaryMax
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || '']))
  })
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function splitSkills(value) {
  return String(value || '')
    .split(/[；;、,，\n\r\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSkillText(value) {
  return splitSkills(value).join('；')
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0
  const raw = String(value || '').trim()
  if (!raw) return 0
  const number = Number.parseFloat(raw.replace(/,/g, ''))
  if (!Number.isFinite(number)) return 0
  if (/万/.test(raw)) return Math.round(number * 10000)
  if (/千|k/i.test(raw)) return Math.round(number * 1000)
  return Math.round(number)
}

function salaryMidpoint(sample) {
  const min = Number(sample.salaryMin || 0)
  const max = Number(sample.salaryMax || 0)
  if (min > 0 && max > 0) return (min + max) / 2
  return min || max || 0
}

function salaryRangeText(sample) {
  const min = Number(sample.salaryMin || 0)
  const max = Number(sample.salaryMax || 0)
  if (!min && !max) return '未填'
  if (min && max && min !== max) return `${min.toLocaleString()}-${max.toLocaleString()}`
  return `${(min || max).toLocaleString()}`
}

function countBy(values) {
  return values.filter(Boolean).reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function topCounts(values, limit) {
  return Object.entries(countBy(values.filter(Boolean)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

function salaryText(value) {
  return value ? `${value.toLocaleString()} 元/月` : '暂无'
}

function barOption(labels, values, color, horizontal = false) {
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 24, bottom: horizontal ? 36 : 48, left: horizontal ? 104 : 48 },
    tooltip: { trigger: 'axis' },
    xAxis: horizontal
      ? { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } }
      : { type: 'category', data: labels, axisLabel: { color: '#64748b', interval: 0, rotate: labels.length > 5 ? 25 : 0 } },
    yAxis: horizontal
      ? { type: 'category', data: labels, axisLabel: { color: '#64748b' } }
      : { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)' } } },
    series: [{ type: 'bar', data: values, itemStyle: { color, borderRadius: horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0] }, barMaxWidth: 34 }],
  }
}

function pieOption(counts) {
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      data,
      label: { color: '#cbd5e1' },
    }],
  }
}

function generateReportDraft(showMessage = true) {
  reportText.value = generateReport()
  reportEdited.value = false
  if (showMessage) setMessage('已生成 Markdown 报告草稿。')
}

function refreshReportIfUntouched() {
  if (!reportEdited.value) reportText.value = generateReport()
}

function generateReport() {
  const titleIndustry = target.industry || '某行业'
  const titlePosition = target.position || '某岗位'
  const titleRegion = target.region || '某地区'
  const isTourismReport = /文旅|旅游|会展|景区|研学|文博/.test(`${target.industry}${target.position}`)
  const areaTop = topCounts(samples.value.map((sample) => sample.city), 3).join('、') || titleRegion
  const educationTop = topCounts(samples.value.map((sample) => sample.education), 3).join('、') || '待补充'
  const experienceTop = topCounts(samples.value.map((sample) => sample.experience), 3).join('、') || '待补充'
  const skillText = topSkills.value.map((item, index) => `${index + 1}. ${item.name}（${item.value} 次）`).join('\n') || '暂无技能词频，请继续补充样本。'
  const recordText = experimentRecords.value.slice(0, 5).map((record) => {
    const source = record.dataSourceType || '来源未标注'
    const version = record.modelVersion || '版本未标注'
    const explanation = record.revisedExplanation || record.studentExplanation || '学生解释待补充'
    return `- ${record.experimentName}（${source}，${version}）：${record.conclusion || '待补充结论'}\n  - 学生解释：${explanation}`
  }).join('\n') || '- 工资决定模拟结果：待补充\n- 失业或技能错配模拟结果：待补充\n- AI 冲击或岗位匹配模拟结果：待补充\n- 公平就业或收入分配讨论：待补充'
  const topSkillNames = topSkills.value.slice(0, 3).map((item) => item.name).join('、') || '岗位核心技能'
  const tourismSentence = isTourismReport
    ? '本报告还应结合游客增长、会展活动、数字文旅、研学旅行、智慧景区和区域人才流动等因素解释岗位需求变化。'
    : '本报告应结合行业周期、技术变化、区域产业结构和岗位技能门槛解释需求变化。'

  return `# ${titleIndustry}/${titlePosition}劳动力市场预测报告

## 一、岗位与行业背景
本报告选择${titleRegion}的${titleIndustry}行业，聚焦${titlePosition}岗位。数据由学生按照统一 CSV 模板手工采集，样本字段包括招聘平台、采集日期、企业、岗位、城市、薪资、学历、经验、技能关键词和证据链接或截图编号。${tourismSentence}

## 二、招聘需求分析
本次共采集招聘样本 ${stats.value.count} 条，其中有效薪资样本 ${stats.value.salaryCount} 条，缺失薪资样本 ${stats.value.missingSalary} 条。主要招聘城市集中在：${areaTop}。学历要求主要包括：${educationTop}；经验要求主要包括：${experienceTop}。

请进一步说明：样本是否集中在少数城市或少数企业类型？该岗位需求是扩张、稳定、收缩，还是结构性调整？

## 三、薪酬水平分析
样本平均薪资为 ${salaryText(stats.value.average)}，中位薪资为 ${salaryText(stats.value.median)}，最高薪资为 ${salaryText(stats.value.max)}，最低薪资为 ${salaryText(stats.value.min)}。请结合薪资区间柱状图判断该岗位主要处于入门型、成长型还是高技能溢价型岗位。

## 四、技能需求分析
高频技能 Top 10：
${skillText}

请解释这些技能之间的结构关系，例如通用办公能力、专业工具能力、数据分析能力、沟通协作能力、行业知识和合规意识。技能关键词目前共识别 ${totalSkillTokens.value} 个。

## 五、${simulationLabel}仿真辅助分析
建议进入以下模块完成仿真实验：
${recommendedLinks.value.map((item, index) => `${index + 1}. ${item.title}：${item.reason}`).join('\n')}

已保存的实验记录：
${recordText}

请把工资模拟、失业模拟、AI 冲击模拟、技能错配模拟或公平就业分析结果写入本部分，并说明仿真结果如何支持岗位预测判断。

## 六、未来趋势判断
综合招聘样本、薪酬水平、技能词频和${simulationLabel}仿真结果，判断该岗位未来更可能是扩张、稳定、收缩，还是结构性调整。请给出至少三条证据：样本证据、统计证据和模型/仿真证据。

## 七、学习与就业建议
建议围绕 ${topSkillNames} 等高频能力制定学习计划。请把建议写成可执行方案，例如课程学习、证书准备、项目训练、实习实践和作品集建设，并说明这些准备如何对应招聘样本中的真实要求。`
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(reportText.value)
    setMessage('Markdown 报告已复制。')
  } catch {
    setMessage('当前浏览器不支持自动复制，可手动选择报告文本复制。')
  }
}

function downloadMarkdown() {
  downloadFile(reportText.value, reportFileName('md'), 'text/markdown;charset=utf-8')
}

function downloadHtml() {
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(target.position || '岗位')}劳动力市场预测报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.8;max-width:920px;margin:40px auto;padding:0 24px;color:#111827}pre{white-space:pre-wrap}</style></head><body><pre>${escapeHtml(reportText.value)}</pre></body></html>`
  downloadFile(html, reportFileName('html'), 'text/html;charset=utf-8')
}

function printPage() {
  window.print()
}

function saveTourismCalibration() {
  if (tourismCalibration.value.status !== 'ready') {
    setMessage(`暂不能校准：${tourismCalibration.value.reasons.join('；')}`)
    return
  }
  const outcome = writeJsonStorage(TOURISM_CALIBRATION_KEY, {
    ...tourismCalibration.value,
    input_fingerprint: tourismCalibrationFingerprint(),
  }, { version: 1 })
  setMessage(outcome.ok
    ? '校准参数已保存。进入成渝文旅实验室后会明确显示样本覆盖、参数前后值和不确定性。'
    : outcome.message)
}

function tourismCalibrationFingerprint() {
  const fields = samples.value.map(sample => [
    sample.sampleNo,
    sample.platform,
    sample.collectDate,
    sample.position,
    sample.industry,
    sample.city,
    sample.salaryMin,
    sample.salaryMax,
    sample.skills,
  ])
  return JSON.stringify([{ ...target }, fields])
}

function invalidateStaleTourismCalibration() {
  const saved = readJsonStorage(TOURISM_CALIBRATION_KEY, null)
  if (saved && saved.input_fingerprint !== tourismCalibrationFingerprint()) {
    removeJsonStorage(TOURISM_CALIBRATION_KEY)
  }
}

function formatComposition(source) {
  const entries = Object.entries(source || {})
  return entries.length
    ? entries.map(([name, count]) => `${name}${count}条`).join('、')
    : '暂无'
}

async function importClassPackages(event) {
  const files = [...(event.target.files || [])]
  if (!files.length) return
  const accepted = []
  let rejected = 0
  for (const file of files) {
    try {
      const payload = JSON.parse(await file.text())
      if (!isValidAssignmentPackage(payload)) throw new Error('invalid package')
      accepted.push({
        anonymousId: `匿名作业${String(teacherPackages.value.length + accepted.length + 1).padStart(2, '0')}`,
        payload: {
          ...payload,
          samples: Array.isArray(payload.samples) ? payload.samples : [],
          experimentRecords: Array.isArray(payload.experimentRecords) ? payload.experimentRecords : [],
          reportText: String(payload.reportText || ''),
        },
      })
    } catch {
      rejected += 1
    }
  }
  teacherPackages.value.push(...accepted)
  teacherMessage.value = `已导入 ${accepted.length} 份有效数据包${rejected ? `，拒绝 ${rejected} 份格式不匹配文件` : ''}。`
  event.target.value = ''
}

function isValidAssignmentPackage(payload) {
  return payload
    && payload.schema === PACKAGE_SCHEMA
    && Array.isArray(payload.samples)
    && Array.isArray(payload.experimentRecords)
}

function hasRecordValue(value) {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function isRecordComplete(record) {
  return [
    'initialPrediction',
    'initialReason',
    'baselineResult',
    'counterfactualResult',
    'studentExplanation',
    'ruleFeedback',
    'revisedExplanation',
    'modelVersion',
    'dataSourceType',
  ].every(key => hasRecordValue(record?.[key]))
}

function packageCompleteRecords(payload) {
  return (payload.experimentRecords || []).filter(isRecordComplete).length
}

function exportClassSummary() {
  const rows = [
    ['匿名编号', '行业', '岗位', '样本数', '实验记录数', '完整闭环数', '报告草稿'],
    ...teacherPackages.value.map(item => [
      item.anonymousId,
      item.payload.target?.industry || '',
      item.payload.target?.position || '',
      item.payload.samples.length,
      item.payload.experimentRecords.length,
      packageCompleteRecords(item.payload),
      item.payload.reportText ? '有' : '无',
    ]),
    [],
    ['汇总指标', '数值'],
    ['数据包数量', teacherPackages.value.length],
    ['实验记录总数', teacherSummary.value.totalRecords],
    ['完整闭环记录', teacherSummary.value.completeRecords],
    ['闭环完成率', `${teacherSummary.value.completionRate}%`],
    ['平均规则得分', `${teacherSummary.value.averageRubric}/4`],
    ['可比较预测记录', teacherSummary.value.predictionChanges.comparable],
    ['可比较记录占比', `${teacherSummary.value.predictionChanges.rate}%`],
  ]
  downloadFile(toCsv(rows), `匿名班级汇总-${today()}.csv`, 'text/csv;charset=utf-8')
  teacherMessage.value = '班级汇总 CSV 已导出。'
}

function clearTeacherPackages() {
  teacherPackages.value = []
  teacherMessage.value = '教师汇总已清空，不影响学生作业数据。'
}

function exportAssignmentPackage() {
  const payload = {
    schema: PACKAGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    app: packageAppName,
    recordSchemaVersion: RECORD_SCHEMA_VERSION,
    target: { ...target },
    samples: samples.value,
    experimentRecords: experimentRecords.value,
    reportText: reportText.value,
  }
  downloadFile(JSON.stringify(payload, null, 2), assignmentPackageFileName(), 'application/json;charset=utf-8')
  setMessage('作业数据包已导出。')
}

async function importAssignmentPackage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text())
    if (!payload || payload.schema !== PACKAGE_SCHEMA) {
      throw new Error('schema mismatch')
    }
    Object.assign(target, payload.target || { industry: '', position: '', region: '' })
    samples.value = Array.isArray(payload.samples) ? payload.samples.map((sample) => normalizeSample(sample)) : []
    experimentRecords.value = Array.isArray(payload.experimentRecords) ? payload.experimentRecords : []
    reportText.value = String(payload.reportText || '')
    reportEdited.value = Boolean(reportText.value)
    csvPreview.value = null
    resetDraft()
    const recordsOutcome = writeJsonStorage(RECORD_KEY, experimentRecords.value, { version: 2 })
    const reportOutcome = writeTextStorage(REPORT_KEY, reportText.value, { version: 2 })
    setMessage(recordsOutcome.ok && reportOutcome.ok
      ? `已导入作业数据包：${samples.value.length} 条样本，${experimentRecords.value.length} 条实验记录。`
      : recordsOutcome.message || reportOutcome.message)
  } catch {
    setMessage('导入失败。请选择从本工作台导出的 JSON 作业数据包。')
  } finally {
    event.target.value = ''
  }
}

function clearLocalWorkbenchData() {
  const firstConfirmed = window.confirm('确定清空当前浏览器里的研究对象、招聘样本、实验记录和报告草稿吗？此操作不会影响其他同学的数据。')
  if (!firstConfirmed) return
  const secondConfirmed = window.confirm(`请再次确认：将永久清空 ${samples.value.length} 条样本、${experimentRecords.value.length} 条实验记录和当前报告草稿。此操作无法撤销。`)
  if (!secondConfirmed) return
  reportEdited.value = true
  const storageKeys = [SAMPLE_KEY, TARGET_KEY, RECORD_KEY, REPORT_KEY, TOURISM_CALIBRATION_KEY, CLASSROOM_PROGRESS_KEY]
  storageKeys.forEach((key) => removeJsonStorage(key))
  Object.assign(target, { industry: '', position: '', region: '' })
  samples.value = []
  experimentRecords.value = []
  reportText.value = ''
  csvPreview.value = null
  classroomStep.value = 1
  classroomQualityConfirmed.value = false
  classroomStatsConfirmed.value = false
  classroomSimulationVisited.value = false
  classroomConclusionGenerated.value = false
  resetDraft()
  setMessage('当前浏览器的工作台数据已清空。')
}

function downloadFile(content, filename, type) {
  const blob = new Blob([`\uFEFF${content}`], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => {
    const value = String(cell ?? '')
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }).join(',')).join('\n')
}

function reportFileName(ext) {
  return `${target.industry || '行业'}-${target.position || '岗位'}-劳动力市场预测报告.${ext}`
}

function assignmentPackageFileName() {
  const position = target.position || '岗位'
  const stamp = new Date().toISOString().slice(0, 10)
  return `${position}-${packageAppName}-作业数据包-${stamp}.json`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function persistJson(key, value, version) {
  const outcome = writeJsonStorage(key, value, { version })
  if (!outcome.ok) setMessage(outcome.message)
  return outcome.ok
}

function persistText(key, value, version) {
  const outcome = writeTextStorage(key, value, { version })
  if (!outcome.ok) setMessage(outcome.message)
  return outcome.ok
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : ''
}

function setMessage(text) {
  message.value = text
  window.clearTimeout(setMessage.timer)
  setMessage.timer = window.setTimeout(() => {
    message.value = ''
  }, 2600)
}
</script>

<style scoped>
.workbench {
  max-width: 1280px;
  margin: 0 auto;
  padding: 38px 24px 64px;
}
.workbench-header {
  margin-bottom: 24px;
}
.back-link {
  color: #64748b;
  text-decoration: none;
  font-size: 13px;
}
.page-kicker {
  display: block;
  margin-top: 18px;
  color: #22d3ee;
  font-size: 13px;
  font-weight: 800;
}
.workbench-header h1 {
  margin: 8px 0;
  color: #f8fafc;
  font-size: 34px;
  font-weight: 900;
}
.workbench-header p {
  max-width: 900px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.75;
}
.flow-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.flow-strip span {
  padding: 7px 10px;
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.11);
  border: 1px solid rgba(59, 130, 246, 0.18);
  font-size: 12px;
  font-weight: 800;
}
.workbench-tabs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.workbench-tabs button {
  border-radius: 6px;
}
.workbench-tabs button.active {
  color: #ecfeff;
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(6, 182, 212, 0.15);
}
.student-view-tabs{position:sticky;top:66px;z-index:12;display:flex;align-items:center;gap:8px;margin:0 0 16px;padding:8px;border:1px solid rgba(148,163,184,.14);border-radius:7px;background:rgba(11,18,32,.96);backdrop-filter:blur(12px)}
.student-view-tabs button{padding:8px 13px}.student-view-tabs button.active{border-color:#22d3ee;color:#ecfeff;background:#0e7490}.student-view-tabs span{margin-left:auto;color:#7f8da3;font-size:11px}
.classroom-workflow{display:grid;gap:14px}.classroom-progress{position:sticky;top:124px;z-index:11;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;border:1px solid #27354a;border-radius:7px;overflow:hidden;background:#27354a}.classroom-progress button{min-width:0;display:grid;grid-template-columns:24px minmax(0,1fr);grid-template-rows:auto auto;column-gap:8px;min-height:62px;padding:9px 10px;border:0;border-radius:0;background:#111b2e;text-align:left}.classroom-progress button span{grid-row:1/3;align-self:center;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;color:#8da0b5;background:#0b1220;font-size:10px}.classroom-progress button strong{overflow:hidden;color:#cbd5e1;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.classroom-progress button small{color:#64748b;font-size:9px}.classroom-progress button.active{background:#153047}.classroom-progress button.active span{color:#03232b;background:#67e8f9}.classroom-progress button.complete:not(.active) span{color:#d1fae5;background:#047857}.classroom-progress button:disabled{opacity:.58}
.classroom-step-card{margin:0}.classroom-step-card>header{display:flex;align-items:center;gap:12px;margin-bottom:16px}.classroom-step-card>header>span{display:grid;place-items:center;width:40px;height:40px;border:1px solid #22d3ee;border-radius:6px;color:#67e8f9;background:#0c2934;font-weight:900}.classroom-step-card h2{margin:0;color:#f8fafc;font-size:20px}.classroom-step-card header p{margin:4px 0 0;color:#8da0b5;font-size:12px}.classroom-step-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,.65fr);gap:16px}.classroom-action-area{min-width:0}.compact-targets{grid-template-columns:repeat(3,minmax(0,1fr))}.boundary-callout{margin:12px 0 0;padding:10px 12px;border-left:3px solid #f5b849;color:#cbd5e1;background:rgba(120,74,5,.1);font-size:12px;line-height:1.6}.classroom-cards{grid-template-columns:repeat(4,minmax(0,1fr));margin:0 0 12px}.quality-check{padding:13px;border-left:3px solid #22c55e;background:rgba(20,83,45,.14)}.quality-check.warning{border-left-color:#f5b849;background:rgba(120,74,5,.1)}.quality-check strong{color:#f8fafc}.quality-check p{margin:5px 0 0;color:#cbd5e1;font-size:12px;line-height:1.55}.classroom-core-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.classroom-core-stats div{min-width:0;padding:14px;border-top:2px solid #38bdf8;background:#111b2e}.classroom-core-stats span,.classroom-core-stats small{display:block;color:#7f8da3;font-size:10px}.classroom-core-stats strong{display:block;min-height:38px;margin:6px 0;color:#f8fafc;font-size:17px;overflow-wrap:anywhere}.mini-chart{height:220px;margin-top:10px;border:1px solid #263449;background:#101a2c}.primary-simulation-card{padding:18px;border:1px solid rgba(34,211,238,.28);background:#102235}.primary-simulation-card>span{color:#67e8f9;font-size:10px;font-weight:900}.primary-simulation-card h3{margin:6px 0;color:#f8fafc}.primary-simulation-card p{color:#a5b4c7;line-height:1.6}.primary-simulation-card a{display:inline-flex;padding:9px 12px;border-radius:5px;color:#fff;background:#0e7490;text-decoration:none;font-size:12px;font-weight:850}.classroom-conclusion{padding:16px;border-left:3px solid #22c55e;background:rgba(20,83,45,.13)}.classroom-conclusion strong{color:#d1fae5}.classroom-conclusion p{margin:7px 0 0;color:#dbe7f5;line-height:1.75}.classroom-nav-actions{display:flex;justify-content:space-between;gap:10px;padding:10px 0}.preview-empty{border-style:dashed}.preview-empty p{margin:0;color:#7f8da3;line-height:1.65}
.panel {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(30, 41, 59, 0.5);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.panel-title span {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #67e8f9;
  background: rgba(6, 182, 212, 0.1);
  font-weight: 900;
}
.panel-title h2,
.chart-panel h2 {
  margin: 0;
  color: #e2e8f0;
  font-size: 17px;
}
.target-grid,
.sample-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.sample-form {
  grid-template-columns: repeat(4, 1fr);
}
label {
  display: grid;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
}
label.wide {
  grid-column: span 2;
}
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  padding: 10px 11px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.78);
  outline: none;
}
textarea {
  min-height: 42px;
  resize: vertical;
}
.template-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 18px;
}
.template-copy strong {
  color: #f8fafc;
}
.template-copy p,
.recommend-box p,
.issue-box p {
  color: #94a3b8;
  line-height: 1.75;
  margin: 8px 0 0;
}
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}
.field-list span {
  padding: 7px 9px;
  border-radius: 8px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 12px;
  font-weight: 700;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.form-actions.compact {
  margin-top: 14px;
}
button,
.file-btn {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  padding: 10px 14px;
  color: #dbeafe;
  background: rgba(15, 23, 42, 0.72);
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
}
.primary-btn {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #06b6d4, #2563eb);
}
.ghost-btn {
  background: rgba(15, 23, 42, 0.72);
}
.file-btn input {
  display: none;
}
.hint,
.message {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.message {
  color: #67e8f9;
}
.local-note {
  margin: -4px 0 14px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}
.preview-cards,
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.preview-body {
  display: grid;
  grid-template-columns: minmax(260px, 0.55fr) minmax(0, 1fr);
  gap: 16px;
}
.issue-box {
  padding: 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.issue-box strong {
  color: #f8fafc;
}
.issue-box ul {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #fca5a5;
  line-height: 1.7;
  font-size: 13px;
}
.muted {
  color: #64748b !important;
}
.bad-text {
  color: #fca5a5;
}
.table-wrap,
.preview-table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}
.preview-table-wrap table {
  min-width: 680px;
}
th,
td {
  padding: 11px 9px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  color: #cbd5e1;
  font-size: 12px;
  text-align: left;
  vertical-align: top;
}
th {
  color: #94a3b8;
  font-weight: 800;
}
.empty-cell,
.empty-block {
  color: #64748b;
  text-align: center;
  padding: 28px;
}
.skills-cell {
  max-width: 220px;
}
.row-actions {
  white-space: nowrap;
}
.row-actions button {
  padding: 6px 8px;
  margin-right: 6px;
}
.stat-card {
  min-width: 0;
  padding: 17px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.stat-card span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}
.stat-card strong {
  color: #f8fafc;
  font-size: 20px;
  word-break: break-word;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.chart-panel {
  min-width: 0;
}
.wide-chart {
  grid-column: span 2;
}
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.skill-tags span {
  padding: 8px 11px;
  border-radius: 999px;
  color: #e0f2fe;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.18);
  font-size: 13px;
  font-weight: 700;
}
.skill-tags .muted {
  color: #64748b;
  background: transparent;
}
.recommend-box {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.16);
}
.recommend-box strong {
  color: #e0f2fe;
}
.recommend-box ol {
  margin: 8px 0 0;
  padding-left: 20px;
  color: #cbd5e1;
  line-height: 1.8;
  font-size: 13px;
}
.sim-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.sim-card {
  min-width: 0;
  padding: 15px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.sim-card strong {
  display: block;
  color: #f8fafc;
  font-size: 14px;
}
.sim-card p {
  min-height: 64px;
  margin: 8px 0 12px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.65;
}
.sim-card a {
  color: #22d3ee;
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
}
.record-list {
  display: grid;
  gap: 10px;
}
.record-list article {
  padding: 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.record-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #e2e8f0;
}
.record-list span {
  color: #64748b;
  font-size: 12px;
}
.record-list p {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}
.data-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}
.data-layout strong {
  display: block;
  color: #f8fafc;
  font-size: 15px;
  margin-bottom: 8px;
}
.data-layout p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}
.data-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.data-summary span {
  padding: 7px 10px;
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.16);
  font-size: 12px;
  font-weight: 800;
}
.data-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}
.danger-zone{display:grid;gap:5px;padding-left:12px;border-left:1px solid rgba(248,113,113,.3)}.danger-zone span{color:#fca5a5;font-size:10px;font-weight:800}
.danger-btn {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(127, 29, 29, 0.3);
}
.report-textarea {
  min-height: 540px;
  font-family: Consolas, "Microsoft YaHei", monospace;
  line-height: 1.7;
}
.calibration-status {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-left: 3px solid #f59e0b;
  color: #cbd5e1;
  background: rgba(245, 158, 11, 0.07);
  line-height: 1.6;
}
.record-list .record-meta {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 10px;
}
.record-list .record-meta span {
  padding: 4px 7px;
  border: 1px solid rgba(148,163,184,.14);
  border-radius: 5px;
  color: #94a3b8;
  background: rgba(30,41,59,.65);
}
.calibration-status.ready {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.07);
}
.calibration-status strong { flex: 0 0 auto; color: #f8fafc; }
.calibration-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1px;
  margin-bottom: 14px;
  background: rgba(148, 163, 184, 0.12);
}
.calibration-grid div {
  min-width: 0;
  padding: 13px;
  background: #172033;
}
.calibration-grid span,
.coverage-grid span {
  color: #94a3b8;
  font-size: 12px;
}
.calibration-grid strong {
  display: block;
  margin-top: 5px;
  color: #f8fafc;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.coverage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 14px;
}
.coverage-grid strong { color: #e2e8f0; }
.coverage-grid p {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.65;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.teacher-intro p,
.teacher-grid p {
  color: #94a3b8;
  line-height: 1.7;
}
.teacher-stats {
  margin-bottom: 20px;
}
.teacher-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.teacher-grid h2,
.teacher-workbench > .panel h2 {
  margin: 0 0 14px;
  color: #e2e8f0;
  font-size: 17px;
}
.step-bars {
  display: grid;
  gap: 12px;
}
.step-bars > div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) 44px;
  gap: 10px;
  align-items: center;
}
.step-bars span,
.step-bars strong {
  color: #cbd5e1;
  font-size: 12px;
}
.step-bars > div > div {
  height: 9px;
  background: rgba(148, 163, 184, 0.14);
}
.step-bars i {
  display: block;
  height: 100%;
  background: #06b6d4;
}
.quality-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.quality-grid div {
  padding: 12px 8px;
  text-align: center;
  border-left: 2px solid #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
}
.quality-grid strong,
.quality-grid span {
  display: block;
  color: #e2e8f0;
}
.quality-grid span {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 12px;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid #67e8f9;
  outline-offset: 2px;
}
@media print {
  .back-link,
  .target-panel,
  .template-panel,
  .preview-panel,
  .sample-form,
  .table-panel,
  .chart-grid,
  .skill-panel,
  .sim-panel,
  .records-panel,
  .data-panel,
  .calibration-panel,
  .workbench-tabs,
  .teacher-workbench,
  .form-actions,
  .student-view-tabs,
  .classroom-workflow,
  .hint {
    display: none !important;
  }
  .workbench {
    max-width: none;
    padding: 0;
  }
  .panel {
    border: none;
    background: white;
  }
  .report-textarea {
    color: #111827;
    background: white;
    border: none;
  }
}
@media (max-width: 1100px) {
  .sample-form,
  .sim-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .preview-cards,
  .stats-grid,
  .calibration-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .target-grid,
  .template-layout,
  .preview-body,
  .chart-grid {
    grid-template-columns: 1fr;
  }
  .wide-chart {
    grid-column: span 1;
  }
  .sample-form,
  .sim-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .data-layout {
    grid-template-columns: 1fr;
  }
  .coverage-grid,
  .teacher-grid {
    grid-template-columns: 1fr;
  }
  .data-actions {
    justify-content: flex-start;
  }
  .student-view-tabs{top:58px;flex-wrap:wrap}.student-view-tabs span{width:100%;margin-left:0}.classroom-progress{top:142px}.classroom-step-layout{grid-template-columns:1fr}.compact-targets,.classroom-core-stats{grid-template-columns:1fr}.classroom-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width: 640px) {
  .workbench {
    padding: 28px 16px 72px;
  }
  .workbench-header h1 {
    font-size: 27px;
  }
  .sample-form,
  .sim-grid,
  .data-layout,
  .preview-cards,
  .stats-grid,
  .calibration-grid,
  .coverage-grid {
    grid-template-columns: 1fr;
  }
  label.wide {
    grid-column: span 1;
  }
  .stat-card strong {
    font-size: 18px;
  }
  .report-textarea {
    min-height: 460px;
  }
  .classroom-progress{top:154px;grid-template-columns:repeat(5,1fr)}.classroom-progress button{display:grid;place-items:center;min-height:52px;padding:7px 2px;text-align:center}.classroom-progress button span{grid-row:auto}.classroom-progress button strong{font-size:9px}.classroom-progress button small{display:none}.classroom-cards{grid-template-columns:1fr}
}
</style>
