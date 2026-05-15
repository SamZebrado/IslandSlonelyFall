import { loadState, saveState, exportData, importData, clearAllData, hasExistingData } from './storage.js';
import { FEELINGS, NEEDS, TARGETS, TONES, EXPRESSIONS, generateEmpathyResponse } from './empathy.js';
import { ENERGY_LEVELS, PRESSURE_LEVELS, CLARITY_LEVELS, STATUS_OPTIONS, DIRECTIONS, formatStatusRecord, getStatusFeedback } from './dashboard.js';
import { createHabit, getTodayHabits, getHabitLogsForToday, completeHabit, skipHabit, getHabitCompletionStats, DEFAULT_REWARDS, DEFAULT_TRIGGERS } from './habits.js';
import { PRIORITY_CATEGORIES, analyzePriority, formatPriorityRecord } from './priority.js';
import { formatEmpathyRecord, getRecentRecords, getCombinedFeed } from './review.js';

let state = loadState();
let currentPage = 'home';

const CRISIS_KEYWORDS = [
  '自杀', '自残', '不想活', '活着没意义', '活着没意思', '结束生命',
  '结束自己', '伤害自己', '杀死自己', '轻生', '想死', '活不下去了',
  '活不下去了', '人生没有意义', '没有活下去的理由'
];

function detectCrisis(text) {
  if (!text) return false;
  return CRISIS_KEYWORDS.some(keyword => text.includes(keyword));
}

window.showCrisisNotice = function() {
  $('#crisisNotice')?.classList.remove('hidden');
};

function $(selector) {
  return document.querySelector(selector);
}

function renderHome() {
  const hasData = hasExistingData();
  
  $('#app').innerHTML = `
    <div class="page home-page">
      <header class="home-header">
        <h1>本地指南游戏</h1>
        <p class="subtitle">Local Guide Game</p>
      </header>
      
      <div class="safety-notice">
        <span class="notice-icon">💡</span>
        <p>这是一个自助觉察工具，不是心理治疗或医疗诊断。如有严重困扰，请寻求专业帮助。</p>
      </div>
      
      <div class="main-actions">
        <button class="btn btn-primary btn-large" onclick="navigate('empathy')">
          开始今日探索
        </button>
        ${hasData ? `
          <button class="btn btn-secondary" onclick="navigate('review')">
            继续上次进度
          </button>
        ` : ''}
      </div>
      
      <div class="modules-grid">
        <div class="module-card" onclick="navigate('empathy')">
          <div class="module-icon">🏠</div>
          <h3>共情小屋</h3>
          <p>自我共情与情绪觉察</p>
        </div>
        
        <div class="module-card" onclick="navigate('status')">
          <div class="module-icon">🔭</div>
          <h3>状态观测台</h3>
          <p>记录今日状态</p>
        </div>
        
        <div class="module-card" onclick="navigate('habits')">
          <div class="module-icon">🔧</div>
          <h3>微习惯工坊</h3>
          <p>创建小而简单的习惯</p>
        </div>
        
        <div class="module-card" onclick="navigate('priority')">
          <div class="module-icon">🚪</div>
          <h3>优先级决策岛</h3>
          <p>五道门任务决策</p>
        </div>
        
        <div class="module-card" onclick="navigate('review')">
          <div class="module-icon">🌸</div>
          <h3>回顾花园</h3>
          <p>查看记录与导出</p>
        </div>
      </div>
    </div>
  `;
}

function renderBackButton(page) {
  return `<button class="btn btn-back" onclick="navigate('${page}')">← 返回</button>`;
}

function renderEmpathy() {
  $('#app').innerHTML = `
    <div class="page empathy-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🏠 共情小屋</h2>
        <p>一个温柔的空间，陪伴你看见自己的感受</p>
      </header>
      
      <div class="empathy-step" id="empathyStep1">
        <div class="step-indicator">步骤 1/5</div>
        <h3>发生了什么？</h3>
        <p class="step-hint">试着描述这个场景，尽量区分事实和评价</p>
        <textarea id="empathySituation" placeholder="例如：今天会议上老板对我的方案提出了质疑……" rows="4"></textarea>
        <div class="safety-notice hidden" id="crisisNotice">
          <span class="notice-icon">💙</span>
          <p>我注意到这段内容里可能包含比较强烈的痛苦或安全风险。这个工具只能帮助你做简单整理，不能替代专业支持。如果你现在可能伤害自己或他人，请尽快联系身边可信任的人、当地紧急服务，或专业危机支持资源。你也可以先离开危险物品和危险环境，去一个更安全的地方。</p>
        </div>
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('situation')">跳过</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(2)">下一步</button>
        </div>
      </div>
      
      <div class="empathy-step hidden" id="empathyStep2">
        <div class="step-indicator">步骤 2/5</div>
        <h3>我现在有什么感受？</h3>
        <p class="step-hint">选择最贴近的，或者写下你自己的感受</p>
        <div class="feelings-grid" id="feelingsGrid"></div>
        <input type="text" id="customFeeling" placeholder="或写下其他感受……" class="custom-input">
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('feelings')">跳过</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(3)">下一步</button>
        </div>
      </div>
      
      <div class="empathy-step hidden" id="empathyStep3">
        <div class="step-indicator">步骤 3/5</div>
        <h3>我可能有什么需要？</h3>
        <p class="step-hint">这些感受背后，可能有什么需要没有被满足？</p>
        <div class="needs-grid" id="needsGrid"></div>
        <input type="text" id="customNeed" placeholder="或写下其他需要……" class="custom-input">
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('needs')">跳过</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(4)">下一步</button>
        </div>
      </div>
      
      <div class="empathy-step hidden" id="empathyStep3b">
        <div class="step-indicator">步骤 4/5</div>
        <h3>我可以提出什么请求？</h3>
        <p class="step-hint">对自己或他人，什么是温和、具体、可执行的？</p>
        <textarea id="empathyRequest" placeholder="例如：我希望给自己一点休息时间……" rows="3"></textarea>
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('request')">跳过</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(5)">下一步</button>
        </div>
      </div>
      
      <div class="empathy-step hidden" id="empathyStep4">
        <div class="step-indicator">步骤 5/5</div>
        <h3>选择表达方式</h3>
        <p class="step-hint">你想对谁说？用什么样的语气？</p>
        <div class="target-select">
          <label>对象：</label>
          ${TARGETS.map(t => `<button class="btn btn-option" data-target="${t}" onclick="selectTarget(this)">${t}</button>`).join('')}
        </div>
        <div class="tone-select hidden" id="toneSelect">
          <label>语气：</label>
          ${TONES.map(t => `<button class="btn btn-option" data-tone="${t}" onclick="selectTone(this)">${t}</button>`).join('')}
        </div>
        <div class="step-actions">
          <button class="btn btn-primary" onclick="finishEmpathy()">生成表达</button>
        </div>
      </div>
      
      <div class="empathy-result hidden" id="empathyResult">
        <h3>✨ 你可以这样说</h3>
        <div class="result-card" id="resultCard"></div>
        <div class="step-actions">
          <button class="btn btn-secondary" onclick="navigate('empathy')">再来一次</button>
          <button class="btn btn-primary" onclick="navigate('home')">返回首页</button>
        </div>
      </div>
    </div>
  `;
  
  renderFeelingsGrid();
  renderNeedsGrid();
  
  window.empathyData = { situation: '', feelings: [], needs: [], request: '', target: '', tone: '' };
}

function renderFeelingsGrid() {
  const grid = $('#feelingsGrid');
  if (!grid) return;
  
  let html = '';
  Object.entries(FEELINGS).forEach(([category, items]) => {
    html += `<div class="feeling-category">`;
    items.forEach(item => {
      html += `<button class="feeling-chip" data-feeling="${item}" onclick="toggleFeeling(this)">${item}</button>`;
    });
    html += `</div>`;
  });
  grid.innerHTML = html;
}

function renderNeedsGrid() {
  const grid = $('#needsGrid');
  if (!grid) return;
  
  let html = '';
  Object.entries(NEEDS).forEach(([category, items]) => {
    html += `<div class="need-category">`;
    items.forEach(item => {
      html += `<button class="need-chip" data-need="${item}" onclick="toggleNeed(this)">${item}</button>`;
    });
    html += `</div>`;
  });
  grid.innerHTML = html;
}

window.toggleFeeling = function(btn) {
  btn.classList.toggle('selected');
  const feeling = btn.dataset.feeling;
  if (!window.empathyData) window.empathyData = {};
  
  if (btn.classList.contains('selected')) {
    if (!window.empathyData.feelings.includes(feeling)) {
      window.empathyData.feelings.push(feeling);
    }
  } else {
    window.empathyData.feelings = window.empathyData.feelings.filter(f => f !== feeling);
  }
};

window.toggleNeed = function(btn) {
  btn.classList.toggle('selected');
  const need = btn.dataset.need;
  if (!window.empathyData) window.empathyData = {};
  
  if (btn.classList.contains('selected')) {
    if (!window.empathyData.needs.includes(need)) {
      window.empathyData.needs.push(need);
    }
  } else {
    window.empathyData.needs = window.empathyData.needs.filter(n => n !== need);
  }
};

window.nextEmpathyStep = function(step) {
  if (step === 2) {
    const situation = $('#empathySituation')?.value || '';
    window.empathyData.situation = situation;
    
    if (detectCrisis(situation)) {
      window.showCrisisNotice();
    }
    
    const customFeeling = $('#customFeeling')?.value || '';
    if (customFeeling && !window.empathyData.feelings.includes(customFeeling)) {
      window.empathyData.feelings.push(customFeeling);
    }
    $('#empathyStep1')?.classList.add('hidden');
    $('#empathyStep2')?.classList.remove('hidden');
  } else if (step === 3) {
    const customNeed = $('#customNeed')?.value || '';
    if (customNeed && !window.empathyData.needs.includes(customNeed)) {
      window.empathyData.needs.push(customNeed);
    }
    $('#empathyStep2')?.classList.add('hidden');
    $('#empathyStep3')?.classList.remove('hidden');
  } else if (step === 4) {
    window.empathyData.request = $('#empathyRequest')?.value || '';
    $('#empathyStep3')?.classList.add('hidden');
    $('#empathyStep3b')?.classList.remove('hidden');
  } else if (step === 5) {
    $('#empathyStep3b')?.classList.add('hidden');
    $('#empathyStep4')?.classList.remove('hidden');
  }
};

window.skipEmpathyStep = function(field) {
  if (field === 'situation') window.empathyData.situation = '';
  else if (field === 'feelings') window.empathyData.feelings = [];
  else if (field === 'needs') window.empathyData.needs = [];
  else if (field === 'request') window.empathyData.request = '';
};

window.selectTarget = function(btn) {
  document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window.empathyData.target = btn.dataset.target;
  $('#toneSelect')?.classList.remove('hidden');
};

window.selectTone = function(btn) {
  document.querySelectorAll('[data-tone]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window.empathyData.tone = btn.dataset.tone;
};

window.finishEmpathy = function() {
  const data = window.empathyData;
  
  let selfExpression = '';
  if (data.request) {
    selfExpression = `${data.request}`;
  } else if (data.feelings.length > 0) {
    selfExpression = `我感到${data.feelings.join('、')}，允许自己接纳这些感受。`;
  }
  
  let otherExpression = '';
  if (data.target && data.tone && EXPRESSIONS[data.target] && EXPRESSIONS[data.target][data.tone]) {
    const options = EXPRESSIONS[data.target][data.tone];
    otherExpression = options[Math.floor(Math.random() * options.length)];
  }
  
  const record = {
    timestamp: new Date().toISOString(),
    situation: data.situation,
    feelings: data.feelings,
    needs: data.needs,
    request: data.request,
    selfExpression,
    otherExpression
  };
  
  state.empathyRecords.push(record);
  saveState(state);
  
  let html = '';
  if (selfExpression) {
    html += `<div class="expression-card"><label>对自己说的话：</label><p>${selfExpression}</p></div>`;
  }
  if (otherExpression) {
    html += `<div class="expression-card"><label>对${data.target}说的话：</label><p>${otherExpression}</p></div>`;
  }
  if (!selfExpression && !otherExpression) {
    html += `<p class="gentle-note">这次记录已经放进回顾花园。</p>`;
  }
  
  $('#resultCard').innerHTML = html;
  document.querySelector('.empathy-step')?.classList.add('hidden');
  $('#empathyResult')?.classList.remove('hidden');
};

function renderStatus() {
  $('#app').innerHTML = `
    <div class="page status-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🔭 状态观测台</h2>
        <p>今天感觉怎么样？</p>
      </header>
      
      <div class="status-form">
        <div class="form-group">
          <label>今日能量：</label>
          <div class="slider-group">
            ${ENERGY_LEVELS.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="energy" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label>今日压力：</label>
          <div class="slider-group">
            ${PRESSURE_LEVELS.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="pressure" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label>今日清晰度：</label>
          <div class="slider-group">
            ${CLARITY_LEVELS.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="clarity" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label>当前状态：</label>
          <div class="status-chips">
            ${STATUS_OPTIONS.map(s => `
              <button class="status-chip" data-status="${s}" onclick="toggleStatusChip(this)">${s}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label>今日投入方向：</label>
          <div class="direction-chips">
            ${DIRECTIONS.map(d => `
              <button class="direction-chip" data-direction="${d}" onclick="toggleDirectionChip(this)">${d}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label>自由备注：</label>
          <textarea id="statusNote" rows="3" placeholder="今天有什么想记下的……"></textarea>
        </div>
        
        <button class="btn btn-primary btn-large" onclick="saveStatus()">保存记录</button>
      </div>
      
      <div class="recent-records" id="recentStatus">
        <h3>最近记录</h3>
        ${renderRecentStatusRecords()}
      </div>
    </div>
  `;
  
  window.statusData = { energy: 1, pressure: 1, clarity: 1, status: [], directions: [], note: '' };
}

window.selectSlider = function(btn) {
  const type = btn.dataset.type;
  const value = parseInt(btn.dataset.value);
  
  document.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  if (type === 'energy') window.statusData.energy = value;
  else if (type === 'pressure') window.statusData.pressure = value;
  else if (type === 'clarity') window.statusData.clarity = value;
};

window.toggleStatusChip = function(btn) {
  btn.classList.toggle('selected');
  const status = btn.dataset.status;
  if (btn.classList.contains('selected')) {
    if (!window.statusData.status.includes(status)) {
      window.statusData.status.push(status);
    }
  } else {
    window.statusData.status = window.statusData.status.filter(s => s !== status);
  }
};

window.toggleDirectionChip = function(btn) {
  btn.classList.toggle('selected');
  const direction = btn.dataset.direction;
  if (btn.classList.contains('selected')) {
    if (!window.statusData.directions.includes(direction)) {
      window.statusData.directions.push(direction);
    }
  } else {
    window.statusData.directions = window.statusData.directions.filter(d => d !== direction);
  }
};

window.saveStatus = function() {
  window.statusData.note = $('#statusNote')?.value || '';
  
  const record = {
    timestamp: new Date().toISOString(),
    energy: window.statusData.energy,
    pressure: window.statusData.pressure,
    clarity: window.statusData.clarity,
    status: [...window.statusData.status],
    directions: [...window.statusData.directions],
    note: window.statusData.note
  };
  
  state.statusRecords.push(record);
  saveState(state);
  
  const feedback = getStatusFeedback(record);
  
  const recentEl = $('#recentStatus');
  if (recentEl) {
    recentEl.innerHTML = `<h3>最近记录</h3>${renderRecentStatusRecords()}`;
  }
  
  alert(feedback + ' ✨');
};

function renderRecentStatusRecords() {
  const recent = getRecentRecords(state.statusRecords, 5);
  if (recent.length === 0) return '<p class="empty-note">还没有记录</p>';
  
  return recent.map(r => {
    const formatted = formatStatusRecord(r);
    return `
      <div class="record-item">
        <div class="record-time">${formatted.dateStr}</div>
        <div class="record-content">
          能量：${formatted.energyLabel} | 压力：${formatted.pressureLabel} | 清晰度：${formatted.clarityLabel}
        </div>
        ${r.status.length > 0 ? `<div class="record-tags">${r.status.map(s => `<span class="tag">${s}</span>`).join('')}</div>` : ''}
        ${r.note ? `<div class="record-note">${r.note}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderHabits() {
  const todayHabits = getTodayHabits(state.habits);
  const todayLogs = getHabitLogsForToday(state.habitLogs);
  const stats = getHabitCompletionStats(state.habits, state.habitLogs);
  
  $('#app').innerHTML = `
    <div class="page habits-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🔧 微习惯工坊</h2>
        <p>创建小而简单的习惯，慢慢来</p>
      </header>
      
      <div class="habits-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.percentage}%"></div>
        </div>
        <span class="progress-text">今日完成 ${stats.completed}/${stats.total}</span>
      </div>
      
      <div class="habits-actions">
        <button class="btn btn-primary" onclick="showCreateHabit()">创建新习惯</button>
      </div>
      
      <div class="habits-list" id="habitsList">
        ${renderHabitsList(todayHabits, todayLogs)}
      </div>
      
      <div class="create-habit-form hidden" id="createHabitForm">
        <h3>创建微习惯</h3>
        <div class="form-group">
          <label>身份句（你想成为什么样的人）：</label>
          <input type="text" id="habitIdentity" placeholder="例如：我是一个会照顾自己的人">
        </div>
        <div class="form-group">
          <label>很小的行动：</label>
          <input type="text" id="habitAction" placeholder="例如：喝一杯水">
        </div>
        <div class="form-group">
          <label>触发提示：</label>
          <select id="habitTrigger">
            <option value="">选择或自定义</option>
            ${DEFAULT_TRIGGERS.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <input type="text" id="habitTriggerCustom" placeholder="或输入自定义触发条件">
        </div>
        <div class="form-group">
          <label>完成后的轻奖励：</label>
          <select id="habitReward">
            ${DEFAULT_REWARDS.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div class="step-actions">
          <button class="btn btn-text" onclick="hideCreateHabit()">取消</button>
          <button class="btn btn-primary" onclick="saveNewHabit()">保存</button>
        </div>
      </div>
    </div>
  `;
}

function renderHabitsList(habits, logs) {
  if (habits.length === 0) {
    return '<p class="empty-note">还没有微习惯，创建一个开始吧</p>';
  }
  
  return habits.map(habit => {
    const log = logs.find(l => l.habitId === habit.id);
    const isCompleted = log?.status === 'completed';
    const isSkipped = log?.status === 'skipped';
    
    return `
      <div class="habit-item ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''}">
        <div class="habit-content">
          <div class="habit-identity">${habit.identity}</div>
          <div class="habit-action">${habit.action}</div>
          <div class="habit-trigger">触发：${habit.trigger || habit.triggerCustom || '随时'}</div>
        </div>
        <div class="habit-actions">
          ${!isCompleted && !isSkipped ? `
            <button class="btn btn-small btn-success" onclick="doHabit('${habit.id}')">完成</button>
            <button class="btn btn-small btn-text" onclick="skipHabitRecord('${habit.id}')">跳过</button>
          ` : isCompleted ? `
            <span class="habit-badge">✓ ${habit.reward}</span>
          ` : isSkipped ? `
            <span class="habit-badge skipped">跳过</span>
          ` : ''}
          <button class="btn btn-small btn-text" onclick="editHabit('${habit.id}')">编辑</button>
          <button class="btn btn-small btn-text danger" onclick="deleteHabit('${habit.id}')">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

window.showCreateHabit = function() {
  $('#createHabitForm')?.classList.remove('hidden');
};

window.hideCreateHabit = function() {
  $('#createHabitForm')?.classList.add('hidden');
};

window.saveNewHabit = function() {
  const identity = $('#habitIdentity')?.value || '';
  const action = $('#habitAction')?.value || '';
  const triggerSelect = $('#habitTrigger')?.value || '';
  const triggerCustom = $('#habitTriggerCustom')?.value || '';
  const reward = $('#habitReward')?.value || DEFAULT_REWARDS[0];
  
  if (!action) {
    alert('请输入微习惯的行动');
    return;
  }
  
  const habit = createHabit({
    identity,
    action,
    trigger: triggerSelect,
    triggerCustom,
    reward
  });
  
  state.habits.push(habit);
  saveState(state);
  renderHabits();
};

window.doHabit = function(habitId) {
  completeHabit(habitId, state.habitLogs);
  saveState(state);
  renderHabits();
};

window.skipHabitRecord = function(habitId) {
  skipHabit(habitId, state.habitLogs);
  saveState(state);
  renderHabits();
};

window.editHabit = function(habitId) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const newIdentity = prompt('身份句：', habit.identity);
  const newAction = prompt('行动：', habit.action);
  
  if (newAction !== null) {
    habit.identity = newIdentity || habit.identity;
    habit.action = newAction;
    saveState(state);
    renderHabits();
  }
};

window.deleteHabit = function(habitId) {
  if (confirm('确定要删除这个习惯吗？')) {
    state.habits = state.habits.filter(h => h.id !== habitId);
    state.habitLogs = state.habitLogs.filter(l => l.habitId !== habitId);
    saveState(state);
    renderHabits();
  }
};

function renderPriority() {
  $('#app').innerHTML = `
    <div class="page priority-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🚪 优先级决策岛</h2>
        <p>通过五道门，找到最合适的行动</p>
      </header>
      
      <div class="priority-form">
        <div class="form-group">
          <label>输入一个任务：</label>
          <textarea id="priorityTask" rows="2" placeholder="例如：完成季度报告"></textarea>
        </div>
        
        <div class="gate" id="gate1">
          <div class="gate-number">第一道门</div>
          <h3>这件事真的需要做吗？</h3>
          <div class="gate-buttons">
            <button class="btn btn-option" data-answer="yes" onclick="answerGate(this, 1)">是</button>
            <button class="btn btn-option" data-answer="no" onclick="answerGate(this, 1)">否</button>
          </div>
        </div>
        
        <div class="gate hidden" id="gate2">
          <div class="gate-number">第二道门</div>
          <h3>能不能删除？</h3>
          <div class="gate-buttons">
            <button class="btn btn-option" data-answer="yes" onclick="answerGate(this, 2)">可以</button>
            <button class="btn btn-option" data-answer="no" onclick="answerGate(this, 2)">不可以</button>
          </div>
        </div>
        
        <div class="gate hidden" id="gate3">
          <div class="gate-number">第三道门</div>
          <h3>能不能简化、交给别人或推迟？</h3>
          <div class="gate-buttons">
            <button class="btn btn-option" data-answer="yes" onclick="answerGate(this, 3)">可以</button>
            <button class="btn btn-option" data-answer="no" onclick="answerGate(this, 3)">不可以</button>
          </div>
          <input type="text" id="gate3Input" class="gate-input hidden" placeholder="简化的方式或最小步骤">
        </div>
        
        <div class="gate hidden" id="gate4">
          <div class="gate-number">第四道门</div>
          <h3>现在做它是否比其他事情更重要？</h3>
          <div class="gate-buttons">
            <button class="btn btn-option" data-answer="yes" onclick="answerGate(this, 4)">是</button>
            <button class="btn btn-option" data-answer="no" onclick="answerGate(this, 4)">否</button>
          </div>
        </div>
        
        <div class="gate hidden" id="gate5">
          <div class="gate-number">第五道门</div>
          <h3>如果今天只能推进一点点，最小下一步是什么？</h3>
          <input type="text" id="gate5Input" placeholder="描述最小的一步">
          <button class="btn btn-primary" onclick="finishPriority()">完成决策</button>
        </div>
        
        <div class="priority-result hidden" id="priorityResult">
          <h3>✨ 决策结果</h3>
          <div class="result-card" id="resultCard"></div>
          <div class="step-actions">
            <button class="btn btn-secondary" onclick="resetPriority()">再来一次</button>
            <button class="btn btn-primary" onclick="navigate('home')">返回首页</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  window.priorityData = { task: '', answers: {} };
}

window.answerGate = function(btn, gate) {
  document.querySelectorAll(`#gate${gate} .btn-option`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  const answer = btn.dataset.answer;
  window.priorityData.answers[`q${gate}`] = answer;
  
  if (gate === 3) {
    $('#gate3Input')?.classList.remove('hidden');
  }
  
  const nextGate = gate + 1;
  $(`#gate${gate}`)?.classList.add('hidden');
  $(`#gate${nextGate}`)?.classList.remove('hidden');
};

window.finishPriority = function() {
  window.priorityData.task = $('#priorityTask')?.value || '';
  window.priorityData.answers.q5 = $('#gate5Input')?.value || '';
  
  const result = analyzePriority(window.priorityData.task, window.priorityData.answers);
  
  const record = {
    timestamp: new Date().toISOString(),
    task: window.priorityData.task,
    answers: { ...window.priorityData.answers },
    result
  };
  
  state.priorityRecords.push(record);
  saveState(state);
  
  const categoryInfo = PRIORITY_CATEGORIES[result.category];
  
  let html = `
    <div class="result-category" style="color: ${categoryInfo.color}">
      ${categoryInfo.icon} ${categoryInfo.label}
    </div>
    <div class="result-section">
      <label>任务：</label>
      <p>${record.task}</p>
    </div>
    <div class="result-section">
      <label>最小下一步：</label>
      <p>${result.minStep}</p>
    </div>
    ${result.timeBlock ? `
      <div class="result-section">
        <label>建议时间块：</label>
        <p>${result.timeBlock}</p>
      </div>
    ` : ''}
    <div class="result-section gentle">
      <p>💬 ${result.reminder}</p>
    </div>
  `;
  
  $('#resultCard').innerHTML = html;
  document.querySelector('.priority-form')?.classList.add('hidden');
  $('#priorityResult')?.classList.remove('hidden');
};

window.resetPriority = function() {
  renderPriority();
};

function renderReview() {
  const feed = getCombinedFeed(state, 10);
  const empathyRecent = getRecentRecords(state.empathyRecords, 3);
  const statusRecent = getRecentRecords(state.statusRecords, 3);
  const priorityRecent = getRecentRecords(state.priorityRecords, 3);
  
  $('#app').innerHTML = `
    <div class="page review-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🌸 回顾花园</h2>
        <p>看看你走过的路</p>
      </header>
      
      <div class="review-sections">
        <div class="review-section">
          <h3>共情记录</h3>
          ${empathyRecent.length > 0 ? empathyRecent.map(r => {
            const f = formatEmpathyRecord(r);
            return `
              <div class="record-item">
                <div class="record-time">${f.dateStr}</div>
                ${f.feelings ? `<div class="record-tags">${f.feelings.split('、').map(ff => `<span class="tag">${ff}</span>`).join('')}</div>` : ''}
                ${f.selfExpression ? `<div class="record-note">${f.selfExpression}</div>` : ''}
              </div>
            `;
          }).join('') : '<p class="empty-note">还没有共情记录</p>'}
        </div>
        
        <div class="review-section">
          <h3>状态记录</h3>
          ${statusRecent.length > 0 ? statusRecent.map(r => {
            const f = formatStatusRecord(r);
            return `
              <div class="record-item">
                <div class="record-time">${f.dateStr}</div>
                <div class="record-content">
                  能量：${f.energyLabel} | 压力：${f.pressureLabel}
                </div>
              </div>
            `;
          }).join('') : '<p class="empty-note">还没有状态记录</p>'}
        </div>
        
        <div class="review-section">
          <h3>优先级决策</h3>
          ${priorityRecent.length > 0 ? priorityRecent.map(r => {
            const f = formatPriorityRecord(r);
            const cat = PRIORITY_CATEGORIES[f.result?.category] || {};
            return `
              <div class="record-item">
                <div class="record-time">${f.dateStr}</div>
                <div class="record-content">${r.task}</div>
                <div class="record-tags"><span class="tag" style="background: ${cat.color}">${cat.label || '未知'}</span></div>
              </div>
            `;
          }).join('') : '<p class="empty-note">还没有决策记录</p>'}
        </div>
      </div>
      
      <div class="review-actions">
        <h3>数据管理</h3>
        <div class="action-buttons">
          <button class="btn btn-secondary" onclick="exportAllData()">导出 JSON</button>
          <button class="btn btn-secondary" onclick="importAllData()">导入 JSON</button>
          <button class="btn btn-danger" onclick="clearAllRecords()">清空全部数据</button>
        </div>
        <input type="file" id="importFile" accept=".json" class="hidden" onchange="handleImport(this)">
      </div>
    </div>
  `;
}

window.exportAllData = function() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `local-guide-game-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.importAllData = function() {
  $('#importFile')?.click();
};

window.handleImport = function(input) {
  const file = input.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = importData(e.target.result);
    if (result.success) {
      state = result.data;
      alert('数据导入成功！');
      renderReview();
    } else {
      alert('导入失败：' + result.error);
    }
  };
  reader.readAsText(file);
};

window.clearAllRecords = function() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
    if (confirm('这是最后一次确认，确定要继续吗？')) {
      clearAllData();
      state = loadState();
      alert('所有数据已清空。');
      renderReview();
    }
  }
};

window.navigate = function(page) {
  currentPage = page;
  
  switch(page) {
    case 'home':
      renderHome();
      break;
    case 'empathy':
      renderEmpathy();
      break;
    case 'status':
      renderStatus();
      break;
    case 'habits':
      renderHabits();
      break;
    case 'priority':
      renderPriority();
      break;
    case 'review':
      renderReview();
      break;
    default:
      renderHome();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  navigate('home');
});
