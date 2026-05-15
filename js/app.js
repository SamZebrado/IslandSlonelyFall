import { loadState, saveState, exportData, importData, clearAllData, hasExistingData } from './storage.js';
import { FEELINGS, NEEDS, TARGETS, TONES, EXPRESSIONS, generateEmpathyResponse } from './empathy.js';
import { buildExpressionOptions, buildActionTips } from './expressionTuner.js';
import { ENERGY_LEVELS, PRESSURE_LEVELS, CLARITY_LEVELS, STATUS_OPTIONS, DIRECTIONS, formatStatusRecord, getStatusFeedback } from './dashboard.js';
import { createHabit, getTodayHabits, getHabitLogsForToday, completeHabit, skipHabit, getHabitCompletionStats, getTodayHabitStats, pickHabitFeedback, DEFAULT_REWARDS, DEFAULT_TRIGGERS } from './habits.js';
import { PRIORITY_CATEGORIES, PRIORITY_GATES, analyzePriority, formatPriorityRecord, derivePriorityDecision } from './priority.js';
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
        <h1>本地指南</h1>
        <p class="subtitle">带你慢慢走，每一步都是探索</p>
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
      
      <section class="places-section">
        <h2 class="places-title">四个地方</h2>
        <div class="place-grid">
          <button class="place-card place-empathy" onclick="navigate('empathy')">
            <div class="place-badge">小屋</div>
            <h3>共情小屋</h3>
            <p class="place-desc">先把感受说清楚，再决定下一步。</p>
            <div class="place-meta">
              <span class="place-tag">适合先停一下</span>
            </div>
          </button>
          
          <button class="place-card place-status" onclick="navigate('status')">
            <div class="place-badge">观测台</div>
            <h3>状态观测台</h3>
            <p class="place-desc">看看今天的状态能量。</p>
            <div class="place-meta">
              <span class="place-tag">适合了解自己</span>
            </div>
          </button>
          
          <button class="place-card place-habit" onclick="navigate('habits')">
            <div class="place-badge">工坊</div>
            <h3>微习惯工坊</h3>
            <p class="place-desc">把目标缩小到今天能做的一步。</p>
            <div class="place-meta">
              <span class="place-tag">适合立刻动手</span>
            </div>
          </button>
          
          <button class="place-card place-priority" onclick="navigate('priority')">
            <div class="place-badge">岛屿</div>
            <h3>优先级决策岛</h3>
            <p class="place-desc">经过五道门，找到最合适的行动。</p>
            <div class="place-meta">
              <span class="place-tag">适合决定方向</span>
            </div>
          </button>
          
          <button class="place-card place-review" onclick="navigate('review')">
            <div class="place-badge">花园</div>
            <h3>回顾花园</h3>
            <p class="place-desc">看看最近留下了什么痕迹。</p>
            <div class="place-meta">
              <span class="place-tag">适合静静回顾</span>
            </div>
          </button>
        </div>
      </section>
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
        <h3>🎛️ 表达调音台</h3>
        <p class="step-hint">整理出来的内容不一定要发给别人。你可以先选择一个更适合当下状态的表达方式。</p>
        
        <div class="expression-tuner-card" style="background: rgba(255,255,255,0.8); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">沟通对象：</label>
            <div class="audience-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-audience="self" onclick="selectAudience(this)">自己</button>
              <button class="btn btn-option" data-audience="partnerFriend" onclick="selectAudience(this)">伴侣/朋友</button>
              <button class="btn btn-option" data-audience="coworker" onclick="selectAudience(this)">同事</button>
              <button class="btn btn-option" data-audience="supervisor" onclick="selectAudience(this)">导师/上级</button>
              <button class="btn btn-option" data-audience="family" onclick="selectAudience(this)">家人</button>
              <button class="btn btn-option" data-audience="unsafePerson" onclick="selectAudience(this)">暂不适合沟通</button>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 16px;">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">表达方式：</label>
            <div class="mode-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-mode="journal" onclick="selectMode(this)">只记录</button>
              <button class="btn btn-option" data-mode="message" onclick="selectMode(this)">发消息</button>
              <button class="btn btn-option" data-mode="faceToFace" onclick="selectMode(this)">当面说</button>
              <button class="btn btn-option" data-mode="schedule" onclick="selectMode(this)">先约时间</button>
              <button class="btn btn-option" data-mode="boundary" onclick="selectMode(this)">只设边界</button>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 16px;">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">语气强度：</label>
            <div class="tone-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-tone="light" onclick="selectExpressionTone(this)">很轻</button>
              <button class="btn btn-option" data-tone="gentle" onclick="selectExpressionTone(this)">温和</button>
              <button class="btn btn-option" data-tone="clear" onclick="selectExpressionTone(this)">清楚</button>
              <button class="btn btn-option" data-tone="firm" onclick="selectExpressionTone(this)">坚定</button>
              <button class="btn btn-option" data-tone="boundary" onclick="selectExpressionTone(this)">边界明确</button>
            </div>
          </div>
        </div>
        
        <div class="step-actions">
          <button class="btn btn-primary" id="generateExpressionBtn" onclick="finishEmpathy()" disabled style="opacity: 0.5;">生成表达建议</button>
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
  
  window.empathyData = { 
    situation: '', 
    feelings: [], 
    needs: [], 
    request: '', 
    audience: '', 
    mode: '', 
    tone: '',
    expressionTuner: {
      audience: '',
      mode: '',
      tone: '',
      suggestions: [],
      actionTips: []
    }
  };
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

window.selectAudience = function(btn) {
  document.querySelectorAll('[data-audience]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window.empathyData.audience = btn.dataset.audience;
  window.empathyData.expressionTuner.audience = btn.dataset.audience;
  checkExpressionReady();
};

window.selectMode = function(btn) {
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window.empathyData.mode = btn.dataset.mode;
  window.empathyData.expressionTuner.mode = btn.dataset.mode;
  checkExpressionReady();
};

window.selectExpressionTone = function(btn) {
  document.querySelectorAll('[data-tone]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window.empathyData.tone = btn.dataset.tone;
  window.empathyData.expressionTuner.tone = btn.dataset.tone;
  checkExpressionReady();
};

function checkExpressionReady() {
  const btn = $('#generateExpressionBtn');
  if (!btn) return;
  const hasAudience = window.empathyData.audience !== '';
  const hasMode = window.empathyData.mode !== '';
  const hasTone = window.empathyData.tone !== '';
  if (hasAudience && hasMode && hasTone) {
    btn.disabled = false;
    btn.style.opacity = '1';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }
}

window.finishEmpathy = function() {
  const data = window.empathyData;
  
  let selfExpression = '';
  if (data.request) {
    selfExpression = `${data.request}`;
  } else if (data.feelings.length > 0) {
    selfExpression = `我感到${data.feelings.join('、')}，允许自己接纳这些感受。`;
  }
  
  const suggestions = buildExpressionOptions({
    audience: data.audience,
    mode: data.mode,
    tone: data.tone,
    observation: data.situation,
    feelings: data.feelings,
    needs: data.needs,
    request: data.request
  });
  
  const actionTips = buildActionTips({
    audience: data.audience,
    mode: data.mode,
    tone: data.tone
  });
  
  const audienceLabels = {
    self: '自己',
    partnerFriend: '伴侣/朋友',
    coworker: '同事',
    supervisor: '导师/上级',
    family: '家人',
    unsafePerson: '暂不适合沟通的人'
  };
  
  data.expressionTuner.suggestions = suggestions;
  data.expressionTuner.actionTips = actionTips;
  
  const record = {
    timestamp: new Date().toISOString(),
    situation: data.situation,
    feelings: data.feelings,
    needs: data.needs,
    request: data.request,
    selfExpression,
    expressionTuner: { ...data.expressionTuner }
  };
  
  state.empathyRecords.push(record);
  saveState(state);
  
  let html = '';
  
  if (selfExpression) {
    html += `<div class="expression-card"><label>对自己说的话：</label><p>${selfExpression}</p></div>`;
  }
  
  if (suggestions.length > 0) {
    html += `<div style="margin-top: 20px;"><h4 style="margin-bottom: 12px; color: var(--color-primary);">💬 ${audienceLabels[data.audience] || data.audience}的表达建议</h4>`;
    suggestions.forEach((suggestion, idx) => {
      html += `<div class="expression-card">
        <p>${suggestion}</p>
        <button class="btn btn-small btn-text" onclick="copyExpression(this)" data-text="${suggestion.replace(/"/g, '&quot;')}">复制</button>
      </div>`;
    });
    html += `</div>`;
  }
  
  if (actionTips.length > 0) {
    html += `<div class="action-suggestion">
      <h4>${data.mode === 'faceToFace' ? '👀 动作与眼神建议' : '📋 发消息前检查'}</h4>
      <ul>`;
    actionTips.forEach(tip => {
      html += `<li>${tip}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (!selfExpression && suggestions.length === 0) {
    html += `<p class="gentle-note">这次记录已经放进回顾花园。</p>`;
  }
  
  html += `
    <div class="next-stop">
      <div class="next-stop-label">下一站</div>
      <div class="next-stop-content">
        <div>
          <strong>去优先级决策岛</strong>
          <p>把当前感受转成一个更清楚的选择。</p>
        </div>
        <button class="btn btn-small" onclick="navigate('priority')">前往</button>
      </div>
    </div>
  `;
  
  $('#resultCard').innerHTML = html;
  document.querySelector('.empathy-step')?.classList.add('hidden');
  $('#empathyResult')?.classList.remove('hidden');
};

window.copyExpression = function(btn) {
  const text = btn.dataset.text;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '已复制!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 1500);
  }).catch(() => {
    alert('复制失败，请手动选择文本复制');
  });
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
  const gentleStats = getTodayHabitStats(state.habitLogs);
  
  $('#app').innerHTML = `
    <div class="page habits-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🌱 微习惯工坊</h2>
        <p>创建小而简单的习惯，慢慢来</p>
      </header>
      
      <div class="habits-gentle-stats" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 16px; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">今天的小灯</div>
        <div style="display: flex; justify-content: center; gap: 24px; font-size: 13px;">
          <div><span style="color: #059669; font-weight: 600;">${gentleStats.completed}</span> 已点亮</div>
          <div><span style="color: #0891b2; font-weight: 600;">${gentleStats.total - gentleStats.completed - gentleStats.skipped}</span> 待照看</div>
          <div><span style="color: #6b7280; font-weight: 600;">${gentleStats.skipped}</span> 先放过</div>
        </div>
      </div>
      
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
      
      <div id="habitFeedbackToast" class="habit-feedback-toast hidden" style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 12px 20px; border-radius: 20px; box-shadow: var(--shadow-lg); z-index: 100; max-width: 280px; text-align: center;"></div>
      
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
    
    let iconClass = 'seed-icon';
    let statusIcon = '🌱';
    let statusLabel = '';
    
    if (isCompleted) {
      iconClass = 'seed-icon completed';
      statusIcon = '🌿';
      statusLabel = habit.reward || '已完成';
    } else if (isSkipped) {
      iconClass = 'seed-icon skipped';
      statusIcon = '🌰';
      statusLabel = '先放过';
    }
    
    return `
      <div class="habit-item ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''} ${isCompleted ? 'gentle-glow' : ''}">
        <div class="habit-icon ${iconClass}" style="font-size: 24px; margin-right: 12px;">${statusIcon}</div>
        <div class="habit-content" style="flex: 1;">
          <div class="habit-identity">${habit.identity}</div>
          <div class="habit-action">${habit.action}</div>
          <div class="habit-trigger">触发：${habit.trigger || habit.triggerCustom || '随时'}</div>
        </div>
        <div class="habit-actions">
          ${!isCompleted && !isSkipped ? `
            <button class="btn btn-small btn-success" onclick="doHabit('${habit.id}')">点亮</button>
            <button class="btn btn-small btn-text" onclick="skipHabitRecord('${habit.id}')">跳过</button>
          ` : isCompleted ? `
            <span class="habit-badge" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">✓ ${statusLabel}</span>
          ` : isSkipped ? `
            <span class="habit-badge skipped">${statusIcon} ${statusLabel}</span>
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
  showHabitFeedback('complete');
  renderHabits();
};

window.skipHabitRecord = function(habitId) {
  skipHabit(habitId, state.habitLogs);
  saveState(state);
  showHabitFeedback('skip');
  renderHabits();
};

function showHabitFeedback(action) {
  const feedback = pickHabitFeedback(action);
  if (!feedback) return;
  
  const toast = $('#habitFeedbackToast');
  if (!toast) return;
  
  toast.textContent = feedback;
  toast.classList.remove('hidden');
  toast.classList.add('fade-in');
  
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('fade-in');
  }, 2500);
}

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
  window.prioritySession = {
    taskText: '',
    currentGateIndex: 0,
    gatePath: [],
    nextStep: '',
    suggestedTimeBlock: ''
  };
  
  $('#app').innerHTML = `
    <div class="page priority-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🚪 优先级决策岛</h2>
        <p>经过五道门，找到最合适的行动</p>
      </header>
      
      <div class="priority-form">
        <div class="gate-path" id="gatePath">
          ${PRIORITY_GATES.map((gate, idx) => `
            <div class="gate-node ${idx === 0 ? 'active' : 'pending'}" data-gate="${gate.id}" data-index="${idx}">
              <div class="gate-icon">🚪</div>
              <div class="gate-short-label">${gate.shortLabel}</div>
            </div>
          `).join('<div class="gate-connector"></div>')}
        </div>
        
        <div class="task-input-section" id="taskInputSection">
          <div class="form-group">
            <label>有什么事情需要决定？</label>
            <textarea id="priorityTask" rows="2" placeholder="例如：完成季度报告"></textarea>
          </div>
          <button class="btn btn-primary" onclick="startPriorityGates()">开始穿越五道门</button>
        </div>
        
        <div class="gate-card hidden" id="gateCard">
          <div class="gate-feedback hidden" id="gateFeedback"></div>
          <div class="gate-content" id="gateContent"></div>
        </div>
        
        <div class="priority-result hidden" id="priorityResult">
          <h3>✨ 决策结果</h3>
          <div class="result-card" id="resultCard"></div>
          <div class="priority-path-summary" id="pathSummary"></div>
          <div class="step-actions">
            <button class="btn btn-secondary" onclick="resetPriority()">再来一次</button>
            <button class="btn btn-primary" onclick="navigate('home')">返回首页</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.startPriorityGates = function() {
  const taskText = $('#priorityTask')?.value?.trim();
  if (!taskText) {
    alert('请输入需要决定的事情');
    return;
  }
  
  window.prioritySession.taskText = taskText;
  $('#taskInputSection')?.classList.add('hidden');
  $('#gateCard')?.classList.remove('hidden');
  renderCurrentGate();
};

function renderCurrentGate() {
  const session = window.prioritySession;
  const gate = PRIORITY_GATES[session.currentGateIndex];
  if (!gate) {
    showPriorityResult();
    return;
  }
  
  updateGatePath();
  
  let html = `
    <div class="gate-header">
      <div class="gate-icon-large">${gate.icon}</div>
      <h3>${gate.name}</h3>
      <p class="gate-description">${gate.description}</p>
    </div>
    <div class="gate-question">${gate.question}</div>
    <div class="gate-options">
  `;
  
  if (gate.options) {
    gate.options.forEach(opt => {
      html += `<button class="btn btn-option" data-value="${opt.value}" onclick="selectGateOption('${opt.value}', '${gate.id}')">${opt.label}</button>`;
    });
  } else if (gate.id === 'focus') {
    html += `<input type="text" id="focusNextStep" placeholder="描述最小的一步..." style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 12px;">`;
    html += `<div class="time-block-select" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">`;
    gate.timeOptions?.forEach(t => {
      html += `<button class="btn btn-option" data-time="${t.value}" onclick="selectTimeBlock('${t.value}')">${t.label}</button>`;
    });
    html += `</div>`;
    html += `<button class="btn btn-primary" onclick="finishFocusGate()">确定最小下一步</button>`;
  }
  
  html += `</div>`;
  
  $('#gateContent').innerHTML = html;
}

window.selectGateOption = function(value, gateId) {
  const session = window.prioritySession;
  const gate = PRIORITY_GATES.find(g => g.id === gateId);
  const option = gate?.options?.find(o => o.value === value);
  
  if (!option) return;
  
  session.gatePath.push({
    gateId,
    gateName: gate.name,
    question: gate.question,
    answer: value,
    feedback: option.feedback
  });
  
  $('#gateFeedback').textContent = option.feedback;
  $('#gateFeedback').classList.remove('hidden');
  
  const nextGateIndex = session.currentGateIndex + 1;
  
  setTimeout(() => {
    session.currentGateIndex = nextGateIndex;
    $('#gateFeedback').classList.add('hidden');
    
    if (nextGateIndex >= PRIORITY_GATES.length) {
      showPriorityResult();
    } else {
      renderCurrentGate();
    }
  }, 1200);
};

window.selectTimeBlock = function(value) {
  const session = window.prioritySession;
  const gate = PRIORITY_GATES.find(g => g.id === 'focus');
  const timeOpt = gate?.timeOptions?.find(t => t.value === value);
  
  document.querySelectorAll('.time-block-select .btn-option').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.time-block-select [data-time="${value}"]`);
  if (btn) btn.classList.add('selected');
  
  session.suggestedTimeBlock = timeOpt?.label || '';
};

window.finishFocusGate = function() {
  const session = window.prioritySession;
  const nextStep = $('#focusNextStep')?.value?.trim();
  
  if (!nextStep && session.suggestedTimeBlock !== '今天不安排，只记录') {
    alert('请描述最小的一步');
    return;
  }
  
  const gate = PRIORITY_GATES.find(g => g.id === 'focus');
  
  session.nextStep = nextStep || '只记录，暂不安排时间';
  session.gatePath.push({
    gateId: 'focus',
    gateName: gate.name,
    question: gate.question,
    answer: nextStep,
    nextStep: session.nextStep,
    timeBlock: session.suggestedTimeBlock,
    feedback: gate.feedback
  });
  
  $('#gateFeedback').textContent = gate.feedback;
  $('#gateFeedback').classList.remove('hidden');
  
  setTimeout(() => {
    showPriorityResult();
  }, 1200);
};

function updateGatePath() {
  const session = window.prioritySession;
  
  document.querySelectorAll('.gate-node').forEach((node, idx) => {
    node.classList.remove('active', 'completed', 'pending');
    
    if (idx < session.currentGateIndex) {
      node.classList.add('completed');
    } else if (idx === session.currentGateIndex) {
      node.classList.add('active');
    } else {
      node.classList.add('pending');
    }
  });
}

function showPriorityResult() {
  const session = window.prioritySession;
  
  $('#gateCard')?.classList.add('hidden');
  $('#priorityResult')?.classList.remove('hidden');
  
  const result = derivePriorityDecision(session.gatePath);
  const categoryInfo = PRIORITY_CATEGORIES[result.category];
  
  const record = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    task: session.taskText,
    result,
    gatePath: session.gatePath,
    decision: result.category
  };
  
  state.priorityRecords.push(record);
  saveState(state);
  
  let html = `
    <div class="result-category" style="background: ${categoryInfo.color}20; border-left: 4px solid ${categoryInfo.color}; padding: 16px; border-radius: 8px;">
      <span style="font-size: 24px;">${categoryInfo.icon}</span>
      <span style="font-size: 18px; font-weight: 600; margin-left: 8px;">${categoryInfo.label}</span>
    </div>
    <div class="result-section">
      <label>🎯 任务：</label>
      <p>${record.task}</p>
    </div>
    <div class="result-section">
      <label>📍 最小下一步：</label>
      <p>${result.minStep}</p>
    </div>
    ${result.timeBlock ? `
      <div class="result-section">
        <label>⏱️ 建议时间块：</label>
        <p>${result.timeBlock}</p>
      </div>
    ` : ''}
    <div class="result-section gentle" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 12px;">
      <p>💬 ${result.reminder}</p>
    </div>
  `;
  
  $('#resultCard').innerHTML = html;
  
  let pathHtml = '<div class="path-summary-title">🛤️ 经过的路径</div><div class="path-steps">';
  session.gatePath.forEach(item => {
    pathHtml += `<span class="path-step" style="background: #e0e7ff; padding: 4px 12px; border-radius: 16px; margin: 4px; display: inline-block; font-size: 13px;">${item.gateName}</span>`;
  });
  pathHtml += '</div>';
  $('#pathSummary').innerHTML = pathHtml;
  
  const nextStopSection = document.createElement('div');
  nextStopSection.className = 'next-stop';
  nextStopSection.innerHTML = `
    <div class="next-stop-label">下一站</div>
    <div class="next-stop-content">
      <div>
        <strong>去微习惯工坊</strong>
        <p>方向已经明确，把它缩成今天的一小步。</p>
      </div>
      <button class="btn btn-small" onclick="navigate('habits')">前往</button>
    </div>
  `;
  document.getElementById('priorityResult')?.appendChild(nextStopSection);
}

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
