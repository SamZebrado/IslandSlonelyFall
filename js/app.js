import { loadState, saveState, exportData, importData, clearAllData, hasExistingData } from './storage.js';
import { FEELINGS, FEELINGS_EN, NEEDS, NEEDS_EN, TARGETS, TARGETS_EN, TONES_EN, EXPRESSIONS, generateEmpathyResponse } from './empathy.js';
import { buildExpressionOptions, buildActionTips } from './expressionTuner.js';
import { ENERGY_LEVELS_EN, PRESSURE_LEVELS_EN, CLARITY_LEVELS_EN, STATUS_OPTIONS_EN, DIRECTIONS_EN, ENERGY_LEVELS, PRESSURE_LEVELS, CLARITY_LEVELS, STATUS_OPTIONS, DIRECTIONS, formatStatusRecord, getStatusFeedback } from './dashboard.js';
import { createHabit, getTodayHabits, getHabitLogsForToday, completeHabit, skipHabit, getHabitCompletionStats, getTodayHabitStats, pickHabitFeedback, DEFAULT_REWARDS, DEFAULT_TRIGGERS } from './habits.js';
import { PRIORITY_CATEGORIES, PRIORITY_GATES, analyzePriority, formatPriorityRecord, derivePriorityDecision } from './priority.js';
import { formatEmpathyRecord, getRecentRecords, getCombinedFeed } from './review.js';
import { RATING_CATEGORIES, createRatingRecord, getRecentRatings, formatRatingDate, calculateCategoryAverage, getOverallAverage } from './rating.js';
import { t, getCurrentLang, setCurrentLang } from './i18n.js';
import { getRandomEncouragement } from './encouragements.js';

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

window.quickStart = function(type) {
  switch(type) {
    case 'momentum':
      render3MinuteTask();
      break;
    case 'priority':
      navigate('priority');
      break;
    case 'empathy':
      navigate('empathy');
      break;
    case 'rating':
      navigate('rating');
      break;
  }
};

const threeMinuteTasks = [
  { zh: "打开论文文档，看标题3分钟", en: "Open the paper document, look at the title for 3 minutes" },
  { zh: "打开课件第一页", en: "Open the first page of the slides" },
  { zh: "只写一个小标题", en: "Write just one subtitle" },
  { zh: "背3个单词", en: "Memorize 3 words" },
  { zh: "把桌子收拾一下", en: "Tidy up the desk" },
  { zh: "只是打开聊天框，不要求立刻回复", en: "Just open the chat, no need to reply yet" },
  { zh: "做3个俯卧撑", en: "Do 3 push-ups" },
  { zh: "喝一杯水", en: "Drink a glass of water" },
  { zh: "打开音乐听一首歌", en: "Play one song" },
];

function render3MinuteTask() {
  const lang = getCurrentLang();
  const taskIndex = Math.floor(Math.random() * threeMinuteTasks.length);
  const task = threeMinuteTasks[taskIndex];
  
  $('#app').innerHTML = `
    <div class="page three-min-page">
      <header class="page-header">
        <h2>🌱 3分钟启动</h2>
        <p>别让任务吓住自己，先做一点点</p>
      </header>
      
      <div class="task-card">
        <div class="task-icon">✨</div>
        <div class="task-text">${lang === 'zh' ? task.zh : task.en}</div>
        <div class="task-time">⏱️ 3分钟</div>
      </div>
      
      <div class="task-actions">
        <button class="btn btn-primary" onclick="complete3MinuteTask()">
          ${lang === 'zh' ? '我做到了!' : 'I did it!'}
        </button>
        <button class="btn btn-secondary" onclick="another3MinuteTask()">
          ${lang === 'zh' ? '换一个更小的' : 'Get another one'}
        </button>
        <button class="btn btn-secondary" onclick="navigate('habits')">
          ${lang === 'zh' ? '去微习惯工坊' : 'Go to Micro-habits'}
        </button>
      </div>
      
      <div class="home-actions">
        <button class="btn btn-secondary" onclick="navigate('home')">
          ${lang === 'zh' ? '返回首页' : 'Go Home'}
        </button>
      </div>
    </div>
  `;
}

window.complete3MinuteTask = function() {
  const lang = getCurrentLang();
  
  state.momentumRecords = state.momentumRecords || [];
  state.momentumRecords.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  });
  saveState(state);
  
  alert(lang === 'zh' ? '太棒了！你真棒！' : 'Awesome! You did great!');
  navigate('home');
};

window.another3MinuteTask = function() {
  render3MinuteTask();
};

window.renderSaveMePage = function() {
  const lang = getCurrentLang();
  $('#app').innerHTML = `
    <div class="page save-me-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🆘 ${lang === 'zh' ? '不知道点哪个，直接救我' : "Not sure where to start?"}</h2>
        <p>${lang === 'zh' ? '现在更像哪一种？' : 'Which one sounds most like you right now?'}</p>
      </header>
      
      <div class="save-me-actions">
        <button class="btn btn-primary btn-large" onclick="quickStart('momentum')">
          ${lang === 'zh' ? '我不想动' : "I can't get started"}
        </button>
        <button class="btn btn-primary btn-large" onclick="quickStart('priority')">
          ${lang === 'zh' ? '事情太多' : "There's too much to do"}
        </button>
        <button class="btn btn-primary btn-large" onclick="navigate('empathy')">
          ${lang === 'zh' ? '我有点乱' : "I'm feeling overwhelmed"}
        </button>
        <button class="btn btn-primary btn-large" onclick="renderProcrastinationQuick('hate')">
          ${lang === 'zh' ? '我又拖了，很烦自己' : "I'm frustrated with myself for procrastinating again"}
        </button>
        <button class="btn btn-primary btn-large" onclick="renderProcrastinationQuick('afraid')">
          ${lang === 'zh' ? '我怕做不好' : "I'm afraid I'll mess it up"}
        </button>
        <button class="btn btn-primary btn-large" onclick="renderProcrastinationQuick('late')">
          ${lang === 'zh' ? '已经晚了' : "It already feels too late"}
        </button>
      </div>
    </div>
  `;
};

function renderHome() {
  const lang = getCurrentLang();
  const hasData = hasExistingData();
  
  const i18n = {
    zh: {
      appName: '慢慢倒',
      subtitle: '带你慢慢走，每一步都是探索',
      saveMe: '不知道点哪个，直接救我',
      saveMeHint: '最省事的入口',
      momentum: '我不想动',
      momentumHint: '3分钟启动',
      priority: '事情太多',
      priorityHint: '1分钟排序',
      empathy: '有点乱',
      empathyHint: '2分钟整理',
      rating: '今日状态',
      ratingHint: '觉察当下',
      safetyNotice: '这是一个自助觉察工具，不是心理治疗或医疗诊断。如有严重困扰，请寻求专业帮助。',
      privacy: {
        title: '隐私说明',
        message: '你的所有数据默认只保存在当前浏览器的本地存储中，不会上传到任何服务器。卸载浏览器、清理缓存或更换设备可能导致数据丢失，建议通过"回顾花园"的导出功能备份数据。如果使用公共设备，请不要记录高度敏感内容，或使用后及时清理数据。注意：浏览器本地存储并不等同于加密存储。',
        backupTip: '建议定期导出备份'
      },
      external: {
        timeNotesUrl: 'https://samzebrado.github.io/LocalStopWatch/'
      },
      timeNotes: {
        title: '时光小记',
        hint: '牛马日记的配置展示页面',
        link: '外部链接'
      },
      startExplore: '开始今日探索',
      continueProgress: '继续上次进度',
      placesTitle: '四个地方',
      empathyBadge: '小屋',
      empathyTitle: '共情小屋',
      empathyDesc: '先把感受说清楚，再决定下一步。',
      empathyTag: '适合先停一下',
      statusBadge: '观测台',
      statusTitle: '状态观测台',
      statusDesc: '看看今天的状态能量。',
      statusTag: '适合了解自己',
      habitsBadge: '工坊',
      habitsTitle: '微习惯工坊',
      habitsDesc: '把目标缩小到今天能做的一步。',
      habitsTag: '适合立刻动手',
      priorityBadge: '岛屿',
      priorityTitle: '优先级决策岛',
      priorityDesc: '经过五道门，找到最合适的行动。',
      priorityTag: '适合决定方向',
      reviewBadge: '花园',
      reviewTitle: '回顾花园',
      reviewDesc: '看看最近留下了什么痕迹。',
      reviewTag: '适合静静回顾'
    },
    en: {
      appName: 'IslandSlowlyFall',
      subtitle: 'Take it slow, one step at a time',
      saveMe: 'Not sure where to start? Start here',
      saveMeHint: 'The easiest place to start',
      momentum: "I can't get started",
      momentumHint: 'A 3-minute start',
      priority: 'Too much to do',
      priorityHint: 'A 1-minute sort',
      empathy: 'Feeling scattered',
      empathyHint: 'A 2-minute reset',
      rating: "Today's Status",
      ratingHint: 'Check in with yourself',
      safetyNotice: 'This is a self-awareness tool, not psychotherapy or medical diagnosis. If you have serious concerns, please seek professional help.',
      privacy: {
        title: 'Privacy Note',
        message: 'All your data is stored locally in your browser by default and never uploaded to any server. Uninstalling the browser, clearing cache, or changing devices may result in data loss. We recommend backing up your data through the export feature in Review Garden. If using a public device, do not record highly sensitive content, or clear data after use. Note: Browser local storage is not the same as encrypted storage.',
        backupTip: 'Regular export backup recommended'
      },
      external: {
        timeNotesUrl: 'https://samzebrado.github.io/LocalStopWatch/'
      },
      timeNotes: {
        title: 'Time Notes',
        hint: 'Configuration page for Work Diary',
        link: 'External Link'
      },
      startExplore: 'Start exploring today',
      continueProgress: 'Continue from last time',
      placesTitle: 'Four Places',
      empathyBadge: 'House',
      empathyTitle: 'Empathy House',
      empathyDesc: 'Clarify your feelings first, then decide next steps.',
      empathyTag: 'Good for pausing',
      statusBadge: 'Observatory',
      statusTitle: 'Status Observatory',
      statusDesc: 'Check your energy today.',
      statusTag: 'Good for understanding yourself',
      habitsBadge: 'Workshop',
      habitsTitle: 'Micro-habit Workshop',
      habitsDesc: 'Shrink your goal to one step you can do today.',
      habitsTag: 'Good for taking action',
      priorityBadge: 'Island',
      priorityTitle: 'Priority Decision Island',
      priorityDesc: 'Go through five gates to find the most suitable action.',
      priorityTag: 'Good for deciding direction',
      reviewBadge: 'Garden',
      reviewTitle: 'Review Garden',
      reviewDesc: 'See what traces you left recently.',
      reviewTag: 'Good for quiet reflection'
    }
  };
  
  const t = i18n[lang];
  
  $('#app').innerHTML = `
    <div class="page home-page">
      <header class="home-header">
        <h1>${t.appName}</h1>
        <p class="subtitle">${t.subtitle}</p>
      </header>
      
      <div class="quick-actions">
        <button class="quick-action-btn quick-action-save-me" onclick="renderSaveMePage()">
          <span class="quick-action-icon">🆘</span>
          <span class="quick-action-text">${t.saveMe}</span>
          <span class="quick-action-hint">${t.saveMeHint}</span>
        </button>
        <button class="quick-action-btn quick-action-momentum" onclick="quickStart('momentum')">
          <span class="quick-action-icon">🌱</span>
          <span class="quick-action-text">${t.momentum}</span>
          <span class="quick-action-hint">${t.momentumHint}</span>
        </button>
        <button class="quick-action-btn quick-action-priority" onclick="quickStart('priority')">
          <span class="quick-action-icon">⚡</span>
          <span class="quick-action-text">${t.priority}</span>
          <span class="quick-action-hint">${t.priorityHint}</span>
        </button>
        <button class="quick-action-btn quick-action-empathy" onclick="quickStart('empathy')">
          <span class="quick-action-icon">🌊</span>
          <span class="quick-action-text">${t.empathy}</span>
          <span class="quick-action-hint">${t.empathyHint}</span>
        </button>
        <button class="quick-action-btn quick-action-rating" onclick="quickStart('rating')">
          <span class="quick-action-icon">📊</span>
          <span class="quick-action-text">${t.rating}</span>
          <span class="quick-action-hint">${t.ratingHint}</span>
        </button>
      </div>
      
      <div class="safety-notice">
        <span class="notice-icon">💡</span>
        <p>${t.safetyNotice}</p>
      </div>
      
      <div class="privacy-notice" style="background: rgba(59,130,246,0.06); border-left: 3px solid rgba(59,130,246,0.4); padding: 12px 16px; border-radius: 8px; margin-top: 16px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 18px;">🔒</span>
          <div style="flex: 1;">
            <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #2563eb;">${t.privacy.title}</h4>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">${t.privacy.message}</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">💾 ${t.privacy.backupTip}</p>
          </div>
        </div>
      </div>

      <div class="encouragement-banner" id="encouragementBanner" style="margin-top: 16px; padding: 14px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div id="encouragementText" style="font-size: 15px; color: #78350f; font-weight: 500; line-height: 1.6; overflow-wrap: anywhere; max-width: 100%;"></div>
      </div>
      
      <div class="main-actions">
        <button class="btn btn-primary btn-large" onclick="navigate('empathy')">
          ${t.startExplore}
        </button>
        ${hasData ? `
          <button class="btn btn-secondary" onclick="navigate('review')">
            ${t.continueProgress}
          </button>
        ` : ''}
      </div>
      
      <section class="places-section">
        <h2 class="places-title">${t.placesTitle}</h2>
        <div class="place-grid">
          <button class="place-card place-empathy" onclick="navigate('empathy')">
            <div class="place-badge">${t.empathyBadge}</div>
            <h3>${t.empathyTitle}</h3>
            <p class="place-desc">${t.empathyDesc}</p>
            <div class="place-meta">
              <span class="place-tag">${t.empathyTag}</span>
            </div>
          </button>
          
          <button class="place-card place-status" onclick="navigate('status')">
            <div class="place-badge">${t.statusBadge}</div>
            <h3>${t.statusTitle}</h3>
            <p class="place-desc">${t.statusDesc}</p>
            <div class="place-meta">
              <span class="place-tag">${t.statusTag}</span>
            </div>
          </button>
          
          <button class="place-card place-habit" onclick="navigate('habits')">
            <div class="place-badge">${t.habitsBadge}</div>
            <h3>${t.habitsTitle}</h3>
            <p class="place-desc">${t.habitsDesc}</p>
            <div class="place-meta">
              <span class="place-tag">${t.habitsTag}</span>
            </div>
          </button>
          
          <button class="place-card place-priority" onclick="navigate('priority')">
            <div class="place-badge">${t.priorityBadge}</div>
            <h3>${t.priorityTitle}</h3>
            <p class="place-desc">${t.priorityDesc}</p>
            <div class="place-meta">
              <span class="place-tag">${t.priorityTag}</span>
            </div>
          </button>
          
          <button class="place-card place-review" onclick="navigate('review')">
            <div class="place-badge">${t.reviewBadge}</div>
            <h3>${t.reviewTitle}</h3>
            <p class="place-desc">${t.reviewDesc}</p>
            <div class="place-meta">
              <span class="place-tag">${t.reviewTag}</span>
            </div>
          </button>
          
          <a class="place-card place-time-notes" href="${t.external.timeNotesUrl}" target="_blank" rel="noopener noreferrer">
            <div class="place-badge">${lang === 'zh' ? '⏱️' : '⏱️'}</div>
            <h3>${t.timeNotes.title}</h3>
            <p class="place-desc">${t.timeNotes.hint}</p>
            <div class="place-meta">
              <span class="place-tag">${t.timeNotes.link}</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  `;
  // 更新鼓励文案
  const encText = document.getElementById('encouragementText');
  if (encText) {
    encText.textContent = getRandomEncouragement(getCurrentLang());
  }
}

function renderBackButton(page) {
  const lang = getCurrentLang();
  const text = lang === 'zh' ? '← 返回' : '← Back';
  return `<button class="btn btn-back" onclick="navigate('${page}')">${text}</button>`;
}



function renderEmpathy() {
  const lang = getCurrentLang();
  
  const i18n = {
    zh: {
      empathy: {
        header: '🏠 共情小屋',
        headerSub: '一个温柔的空间，陪伴你看见自己的感受',
        quickEntry: {
          summary: '想要快速整理一下？点我看看',
          labels: {
            hate: '想整理一下刚才的状态',
            afraid: '有点担心接下来的事',
            where: '事情有点多，理不清',
            late: '感觉有点晚了',
            compare: '有点在意别人的进度'
          }
        },
        step1: '发生了什么？',
        step1Hint: '试着描述这个场景，尽量区分事实和评价',
        step1Placeholder: '例如：今天会议上老板对我的方案提出了质疑……',
        step2: '我现在有什么感受？',
        step2Hint: '选择最贴近的，或者写下你自己的感受',
        step2CustomPlaceholder: '或写下其他感受……',
        step3: '我可能有什么需要？',
        step3Hint: '这些感受背后，可能有什么需要没有被满足？',
        step3CustomPlaceholder: '或写下其他需要……',
        step4: '我可以提出什么请求？',
        step4Hint: '对自己或他人，什么是温和、具体、可执行的？',
        step4Placeholder: '例如：我希望给自己一点休息时间……',
        step5: '🎛️ 表达调音台',
        step5Hint: '整理出来的内容不一定要发给别人。你可以先选择一个更适合当下状态的表达方式。',
        audienceLabel: '沟通对象：',
        modeLabel: '表达方式：',
        toneLabel: '语气强度：',
        modes: {
          journal: '只记录',
          message: '发消息',
          faceToFace: '当面说',
          schedule: '先约时间',
          boundary: '只设边界'
        },
        tones: {
          light: '很轻',
          gentle: '温和',
          clear: '清楚',
          firm: '坚定',
          boundary: '边界明确'
        },
        audiences: {
          self: '自己',
          partnerFriend: '伴侣/朋友',
          coworker: '同事',
          supervisor: '导师/上级',
          family: '家人',
          unsafePerson: '暂不适合沟通'
        },
        generateBtn: '生成表达建议',
        resultTitle: '✨ 你可以这样说',
        skip: '跳过',
        next: '下一步',
        again: '再来一次',
        backHome: '返回首页',
        crisisNotice: '我注意到这段内容里可能包含比较强烈的痛苦或安全风险。这个工具只能帮助你做简单整理，不能替代专业支持。如果你现在可能伤害自己或他人，请尽快联系身边可信任的人、当地紧急服务，或专业危机支持资源。你也可以先离开危险物品和危险环境，去一个更安全的地方。'
      }
    },
    en: {
      empathy: {
        header: '🏠 Empathy House',
        headerSub: 'A gentle space to notice what you\'re feeling',
        quickEntry: {
          summary: 'Want to quickly organize your thoughts? Click me',
          labels: {
            hate: 'Want to organize what just happened',
            afraid: 'A bit worried about what\'s next',
            where: 'Too many things, can\'t sort them out',
            late: 'Feels a bit late',
            compare: 'A bit concerned about others\' progress'
          }
        },
        step1: 'What happened?',
        step1Hint: 'Try describing the situation while separating facts from judgments.',
        step1Placeholder: 'E.g.: My boss questioned my proposal in the meeting today...',
        step2: 'What am I feeling right now?',
        step2Hint: 'Choose what feels closest, or write your own words.',
        step2CustomPlaceholder: 'Or write another feeling...',
        step3: 'What might I need?',
        step3Hint: 'What unmet needs might be behind these feelings?',
        step3CustomPlaceholder: 'Or write another need...',
        step4: 'What could I ask for?',
        step4Hint: 'For yourself or someone else, what would be kind, specific, and doable?',
        step4Placeholder: 'E.g.: I want to give myself some time to rest...',
        step5: '🎛️ Expression Dial',
        step5Hint: "What you sort out here doesn't have to be sent to anyone. You can simply choose a way to express it that fits your current state.",
        audienceLabel: 'Audience:',
        modeLabel: 'Expression method:',
        toneLabel: 'Tone intensity:',
        modes: {
          journal: 'Journal only',
          message: 'Send a message',
          faceToFace: 'Talk in person',
          schedule: 'Schedule first',
          boundary: 'Set boundary only'
        },
        tones: {
          light: 'Very light',
          gentle: 'Gentle',
          clear: 'Clear',
          firm: 'Firm',
          boundary: 'Clear boundary'
        },
        audiences: {
          self: 'Myself',
          partnerFriend: 'Partner/Friend',
          coworker: 'Coworker',
          supervisor: 'Supervisor',
          family: 'Family',
          unsafePerson: 'Not ready to communicate'
        },
        generateBtn: 'Generate wording suggestion',
        resultTitle: '✨ A possible way to say it',
        skip: 'Skip',
        next: 'Next',
        again: 'Try again',
        backHome: 'Back to Home',
        crisisNotice: "I notice this content may contain strong pain or safety risks. This tool can only help you do simple organization and cannot replace professional support. If you may harm yourself or others, please contact trusted people nearby, local emergency services, or professional crisis support resources as soon as possible."
      }
    }
  };
  
  const t = i18n[lang];
  
  $('#app').innerHTML = `
    <div class="page empathy-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>${t.empathy.header}</h2>
        <p>${t.empathy.headerSub}</p>
      </header>

      <div class="empathy-step" id="empathyStep1">
        <div class="step-indicator">${lang === 'zh' ? '步骤' : 'Step'} 1/5</div>
        <h3>${t.empathy.step1}</h3>
        <p class="step-hint">${t.empathy.step1Hint}</p>
        <textarea id="empathySituation" placeholder="${t.empathy.step1Placeholder}" rows="4"></textarea>
        <div class="safety-notice hidden" id="crisisNotice">
          <span class="notice-icon">💙</span>
          <p>${t.empathy.crisisNotice}</p>
        </div>
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('situation')">${t.empathy.skip}</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(2)">${t.empathy.next}</button>
        </div>
      </div>

      <div class="empathy-step hidden" id="empathyStep2">
        <div class="step-indicator">${lang === 'zh' ? '步骤' : 'Step'} 2/5</div>
        <h3>${t.empathy.step2}</h3>
        <p class="step-hint">${t.empathy.step2Hint}</p>
        <div class="feelings-grid" id="feelingsGrid"></div>
        <input type="text" id="customFeeling" placeholder="${t.empathy.step2CustomPlaceholder}" class="custom-input">
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('feelings')">${t.empathy.skip}</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(3)">${t.empathy.next}</button>
        </div>
      </div>

      <div class="empathy-step hidden" id="empathyStep3">
        <div class="step-indicator">${lang === 'zh' ? '步骤' : 'Step'} 3/5</div>
        <h3>${t.empathy.step3}</h3>
        <p class="step-hint">${t.empathy.step3Hint}</p>
        <div class="needs-grid" id="needsGrid"></div>
        <input type="text" id="customNeed" placeholder="${t.empathy.step3CustomPlaceholder}" class="custom-input">
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('needs')">${t.empathy.skip}</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(4)">${t.empathy.next}</button>
        </div>
      </div>

      <div class="empathy-step hidden" id="empathyStep3b">
        <div class="step-indicator">${lang === 'zh' ? '步骤' : 'Step'} 4/5</div>
        <h3>${t.empathy.step4}</h3>
        <p class="step-hint">${t.empathy.step4Hint}</p>
        <textarea id="empathyRequest" placeholder="${t.empathy.step4Placeholder}" rows="3"></textarea>
        <div class="step-actions">
          <button class="btn btn-text" onclick="skipEmpathyStep('request')">${t.empathy.skip}</button>
          <button class="btn btn-primary" onclick="nextEmpathyStep(5)">${t.empathy.next}</button>
        </div>
      </div>

      <div class="empathy-step hidden" id="empathyStep4">
        <div class="step-indicator">${lang === 'zh' ? '步骤' : 'Step'} 5/5</div>
        <h3>${t.empathy.step5}</h3>
        <p class="step-hint">${t.empathy.step5Hint}</p>

        <div class="expression-tuner-card" style="background: rgba(255,255,255,0.8); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">${t.empathy.audienceLabel}</label>
            <div class="audience-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-audience="self" onclick="selectAudience(this)">${t.empathy.audiences.self}</button>
              <button class="btn btn-option" data-audience="partnerFriend" onclick="selectAudience(this)">${t.empathy.audiences.partnerFriend}</button>
              <button class="btn btn-option" data-audience="coworker" onclick="selectAudience(this)">${t.empathy.audiences.coworker}</button>
              <button class="btn btn-option" data-audience="supervisor" onclick="selectAudience(this)">${t.empathy.audiences.supervisor}</button>
              <button class="btn btn-option" data-audience="family" onclick="selectAudience(this)">${t.empathy.audiences.family}</button>
              <button class="btn btn-option" data-audience="unsafePerson" onclick="selectAudience(this)">${t.empathy.audiences.unsafePerson}</button>
            </div>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">${t.empathy.modeLabel}</label>
            <div class="mode-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-mode="journal" onclick="selectMode(this)">${t.empathy.modes.journal}</button>
              <button class="btn btn-option" data-mode="message" onclick="selectMode(this)">${t.empathy.modes.message}</button>
              <button class="btn btn-option" data-mode="faceToFace" onclick="selectMode(this)">${t.empathy.modes.faceToFace}</button>
              <button class="btn btn-option" data-mode="schedule" onclick="selectMode(this)">${t.empathy.modes.schedule}</button>
              <button class="btn btn-option" data-mode="boundary" onclick="selectMode(this)">${t.empathy.modes.boundary}</button>
            </div>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label style="font-weight: 500; margin-bottom: 8px; display: block;">${t.empathy.toneLabel}</label>
            <div class="tone-select" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="btn btn-option" data-tone="light" onclick="selectExpressionTone(this)">${t.empathy.tones.light}</button>
              <button class="btn btn-option" data-tone="gentle" onclick="selectExpressionTone(this)">${t.empathy.tones.gentle}</button>
              <button class="btn btn-option" data-tone="clear" onclick="selectExpressionTone(this)">${t.empathy.tones.clear}</button>
              <button class="btn btn-option" data-tone="firm" onclick="selectExpressionTone(this)">${t.empathy.tones.firm}</button>
              <button class="btn btn-option" data-tone="boundary" onclick="selectExpressionTone(this)">${t.empathy.tones.boundary}</button>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-primary" id="generateExpressionBtn" onclick="finishEmpathy()" disabled style="opacity: 0.5;">${t.empathy.generateBtn}</button>
        </div>
      </div>

      <div class="empathy-result hidden" id="empathyResult">
        <h3>${t.empathy.resultTitle}</h3>
        <div class="result-card" id="resultCard"></div>
        <div class="step-actions">
          <button class="btn btn-secondary" onclick="navigate('empathy')">${t.empathy.again}</button>
          <button class="btn btn-primary" onclick="navigate('home')">${t.empathy.backHome}</button>
        </div>
      </div>
      
      <div class="quick-empathy-section" style="margin-top: 24px; padding-top: 24px; border-top: 1px dashed var(--color-border);">
        <details style="margin-bottom: 16px;">
          <summary style="cursor: pointer; color: var(--color-text-light); font-size: 14px; padding: 8px 0;">
            💡 ${t.empathy.quickEntry.summary}
          </summary>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
            <button class="entrance-btn" onclick="enterProcrastination('hate')">${t.empathy.quickEntry.labels.hate}</button>
            <button class="entrance-btn" onclick="enterProcrastination('afraid')">${t.empathy.quickEntry.labels.afraid}</button>
            <button class="entrance-btn" onclick="enterProcrastination('where')">${t.empathy.quickEntry.labels.where}</button>
            <button class="entrance-btn" onclick="enterProcrastination('late')">${t.empathy.quickEntry.labels.late}</button>
            <button class="entrance-btn" onclick="enterProcrastination('compare')">${t.empathy.quickEntry.labels.compare}</button>
          </div>
        </details>
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

  const lang = getCurrentLang();
  const feelings = lang === 'en' ? FEELINGS_EN : FEELINGS;

  let html = '';
  Object.entries(feelings).forEach(([category, items]) => {
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

  const lang = getCurrentLang();
  const needs = lang === 'en' ? NEEDS_EN : NEEDS;

  let html = '';
  Object.entries(needs).forEach(([category, items]) => {
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

const procrastinationResponses = {
  hate: {
    feelings: {
      zh: ['烦躁', '自责', '无力'],
      en: ['frustrated', 'self-critical', 'powerless']
    },
    needs: {
      zh: ['自我接纳', '温和', '休息'],
      en: ['self-acceptance', 'gentleness', 'rest']
    },
    message: {
      zh: '你现在可能不是不想努力，而是任务太大、压力太满，所以身体先刹车了。我们先不解决整件事，只找一个不会吓到你的下一步。',
      en: 'undefined'
    }
  },
  afraid: {
    feelings: {
      zh: ['紧张', '害怕', '担忧'],
      en: ['nervous', 'afraid', 'worried']
    },
    needs: {
      zh: ['安全感', '耐心', '鼓励'],
      en: ['safety', 'patience', 'encouragement']
    },
    message: {
      zh: '害怕做不好，其实是你对自己有要求。没关系，我们先不用做好，只用开始。把完美放在一边，我们先随便做一点点。',
      en: 'undefined'
    }
  },
  where: {
    feelings: {
      zh: ['迷茫', '混乱', '疲惫'],
      en: ['lost', 'scattered', 'tired']
    },
    needs: {
      zh: ['清晰', '简单', '方向'],
      en: ['clarity', 'simplicity', 'direction']
    },
    message: {
      zh: '不知道从哪开始，是因为选项太多。我们不用选最好的，只用选第一个能抓住的。哪怕只开个头，也是胜利。',
      en: 'undefined'
    }
  },
  late: {
    feelings: {
      zh: ['焦虑', '沮丧', '无望'],
      en: ['anxious', 'discouraged', 'hopeless']
    },
    needs: {
      zh: ['原谅', '重新开始', '希望'],
      en: ['forgiveness', 'a fresh start', 'hope']
    },
    message: {
      zh: '已经晚了，反而可能是个信号：这个任务原来的方式不适合你。没关系，我们从剩下的时间里，拿最小的一部分来开始。',
      en: 'undefined'
    }
  },
  compare: {
    feelings: {
      zh: ['嫉妒', '自卑', '失落'],
      en: ['jealous', 'inadequate', 'disappointed']
    },
    needs: {
      zh: ['自我关怀', '看见自己', '平静'],
      en: ['self-compassion', 'being seen', 'peace']
    },
    message: {
      zh: '别人和你是不同的时区。你不用和别人比速度，只用按照自己的节奏，慢慢走。你只需要做好你自己的部分。',
      en: 'undefined'
    }
  }
};

window.enterProcrastination = function(type) {
  const lang = getCurrentLang();
  const resp = procrastinationResponses[type];
  if (!resp) return;
  
  $('#app').innerHTML = `
    <div class="page empathy-page">
      ${renderBackButton('empathy')}
      
      <div class="procrastination-card">
        <div class="procrastination-icon">💙</div>
        <p class="procrastination-message">${resp.message[lang]}</p>
        
        <div class="quick-response-actions">
          <button class="btn btn-primary" onclick="navigate('priority')">${lang === 'zh' ? '现在找一件事做' : 'Pick one thing to do'}</button>
          <button class="btn btn-secondary" onclick="navigate('habits')">${lang === 'zh' ? '选个微习惯' : 'Pick a micro-habit'}</button>
          <button class="btn btn-text" onclick="navigate('home')">${lang === 'zh' ? '先回首页' : 'Go home'}</button>
        </div>
      </div>
    </div>
  `;
  
  state.empathyRecords.push({
    id: `procrastination-${Date.now()}`,
    timestamp: new Date().toISOString(),
    situation: lang === 'zh' ? '整理状态' : 'Organizing state',
    feelings: resp.feelings[lang],
    needs: resp.needs[lang],
    type: 'empathy'
  });
  saveState(state);
};

window.renderProcrastinationQuick = function(type) {
  const lang = getCurrentLang();
  const resp = procrastinationResponses[type];
  if (!resp) {
    navigate('empathy');
    return;
  }
  
  $('#app').innerHTML = `
    <div class="page empathy-page">
      ${renderBackButton('home')}
      
      <div class="procrastination-card">
        <div class="procrastination-icon">💙</div>
        <p class="procrastination-message">${resp.message[lang]}</p>
        
        <div class="quick-response-actions">
          <button class="btn btn-primary" onclick="navigate('priority')">${lang === 'zh' ? '现在找一件事做' : 'Pick one thing to do'}</button>
          <button class="btn btn-secondary" onclick="navigate('habits')">${lang === 'zh' ? '选个微习惯' : 'Pick a micro-habit'}</button>
          <button class="btn btn-text" onclick="navigate('home')">${lang === 'zh' ? '先回首页' : 'Go home'}</button>
        </div>
      </div>
    </div>
  `;
  
  state.empathyRecords.push({
    id: `procrastination-${Date.now()}`,
    timestamp: new Date().toISOString(),
    situation: lang === 'zh' ? '整理状态' : 'Organizing state',
    feelings: resp.feelings[lang],
    needs: resp.needs[lang],
    type: 'empathy'
  });
  saveState(state);
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
  
  const careActions = [
    { icon: '💧', text: '喝一杯水' },
    { icon: '🌬️', text: '深呼吸几次' },
    { icon: '🪟', text: '看看窗外' },
    { icon: '🎵', text: '听一首喜欢的歌' },
    { icon: '🧘', text: '站起来伸展一下' },
    { icon: '📝', text: '把担心写下来' }
  ];
  
  html += `
    <div class="empathy-next-choices">
      <div class="empathy-choice-header">接下来你想？</div>
      <div class="empathy-choices">
        <button class="empathy-choice-btn" onclick="showCareSection()">🌿 我想先照顾自己</button>
        <button class="empathy-choice-btn" onclick="goToPriorityFromEmpathy()">⚡ 我想把它变成小行动</button>
      </div>
    </div>
    
    <div class="care-actions-section hidden" id="careActionsSection">
      <div class="care-actions-label">🌿 照顾一下自己</div>
      <div class="care-actions-grid">
        ${careActions.map(a => `<button class="care-action-btn" onclick="this.classList.toggle('done')">${a.icon} ${a.text}</button>`).join('')}
      </div>
    </div>
    
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

window.copyPriorityAction = function(btn) {
  const text = btn.dataset.action;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '已复制!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 1500);
  }).catch(() => {
    alert('复制失败，请手动选择文本复制');
  });
};

function renderStatus() {
  const lang = getCurrentLang();
  const energyLevels = lang === 'en' ? ENERGY_LEVELS_EN : ENERGY_LEVELS;
  const pressureLevels = lang === 'en' ? PRESSURE_LEVELS_EN : PRESSURE_LEVELS;
  const clarityLevels = lang === 'en' ? CLARITY_LEVELS_EN : CLARITY_LEVELS;
  const statusOpts = lang === 'en' ? STATUS_OPTIONS_EN : STATUS_OPTIONS;
  const dirOpts = lang === 'en' ? DIRECTIONS_EN : DIRECTIONS;

  const i18n = {
    zh: {
      header: '🔭 状态观测台',
      headerSub: '今天感觉怎么样？',
      energyLabel: '今日能量：',
      pressureLabel: '今日压力：',
      clarityLabel: '今日清晰度：',
      currentStatusLabel: '当前状态：',
      directionLabel: '今日投入方向：',
      noteLabel: '自由备注：',
      notePlaceholder: '今天有什么想记下的……',
      saveBtn: '保存记录',
      recentTitle: '最近记录',
      noRecords: '还没有记录'
    },
    en: {
      header: '🔭 Status Observatory',
      headerSub: 'How are you feeling today?',
      energyLabel: 'Energy Today:',
      pressureLabel: 'Pressure Today:',
      clarityLabel: 'Clarity Today:',
      currentStatusLabel: 'Current Status:',
      directionLabel: "Today's Direction:",
      noteLabel: 'Free Note:',
      notePlaceholder: 'Anything you want to record today...',
      saveBtn: 'Save Record',
      recentTitle: 'Recent Records',
      noRecords: 'No records yet'
    }
  };

  const t = i18n[lang];

  $('#app').innerHTML = `
    <div class="page status-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>${t.header}</h2>
        <p>${t.headerSub}</p>
      </header>

      <div class="status-form">
        <div class="form-group">
          <label>${t.energyLabel}</label>
          <div class="slider-group">
            ${energyLevels.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="energy" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>${t.pressureLabel}</label>
          <div class="slider-group">
            ${pressureLevels.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="pressure" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>${t.clarityLabel}</label>
          <div class="slider-group">
            ${clarityLevels.map((l, i) => `
              <button class="slider-btn ${i === 0 ? 'selected' : ''}" data-value="${i + 1}" data-type="clarity" onclick="selectSlider(this)">
                <span class="slider-label">${l}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>${t.currentStatusLabel}</label>
          <div class="status-chips">
            ${statusOpts.map(s => `
              <button class="status-chip" data-status="${s}" onclick="toggleStatusChip(this)">${s}</button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>${t.directionLabel}</label>
          <div class="direction-chips">
            ${dirOpts.map(d => `
              <button class="direction-chip" data-direction="${d}" onclick="toggleDirectionChip(this)">${d}</button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>${t.noteLabel}</label>
          <textarea id="statusNote" rows="3" placeholder="${t.notePlaceholder}"></textarea>
        </div>

        <button class="btn btn-primary btn-large" onclick="saveStatus()">${t.saveBtn}</button>
      </div>

      <div class="recent-records" id="recentStatus">
        <h3>${t.recentTitle}</h3>
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
  const lang = getCurrentLang();

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

  const feedback = getStatusFeedback(record, lang);

  const recentEl = $('#recentStatus');
  const recentTitle = lang === 'en' ? 'Recent Records' : '最近记录';
  if (recentEl) {
    recentEl.innerHTML = `<h3>${recentTitle}</h3>${renderRecentStatusRecords()}`;
  }

  alert(feedback + ' ✨');
};

function renderRecentStatusRecords() {
  const lang = getCurrentLang();
  const recent = getRecentRecords(state.statusRecords, 5);
  if (recent.length === 0) {
    const empty = lang === 'en' ? 'No records yet' : '还没有记录';
    return `<p class="empty-note">${empty}</p>`;
  }

  const labels = {
    zh: { energy: '能量', pressure: '压力', clarity: '清晰度' },
    en: { energy: 'Energy', pressure: 'Pressure', clarity: 'Clarity' }
  };
  const lbl = labels[lang] || labels.zh;

  return recent.map(r => {
    const formatted = formatStatusRecord(r, lang);
    return `
      <div class="record-item">
        <div class="record-time">${formatted.dateStr}</div>
        <div class="record-content">
          ${lbl.energy}：${formatted.energyLabel} | ${lbl.pressure}：${formatted.pressureLabel} | ${lbl.clarity}：${formatted.clarityLabel}
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
      
      <div class="student-templates">
        <h3>🔖 学生常用模板</h3>
        <div class="templates-grid">
          <button class="template-chip" onclick="applyStudentTemplate('review')">期末复习模板</button>
          <button class="template-chip" onclick="applyStudentTemplate('paper')">论文推进模板</button>
          <button class="template-chip" onclick="applyStudentTemplate('word')">背单词模板</button>
          <button class="template-chip" onclick="applyStudentTemplate('tidy')">收拾桌子模板</button>
          <button class="template-chip" onclick="applyStudentTemplate('water')">喝水模板</button>
          <button class="template-chip" onclick="applyStudentTemplate('exercise')">轻微运动模板</button>
        </div>
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

const studentTemplates = {
  review: {
    identity: '我是一个坚持复习的人',
    action: '打开课件第一页',
    trigger: '吃完晚饭',
    reward: '看10分钟喜欢的内容'
  },
  paper: {
    identity: '我是一个一步步写论文的人',
    action: '只写一个小标题',
    trigger: '打开电脑',
    reward: '喝一杯奶茶'
  },
  word: {
    identity: '我是一个每天背单词的人',
    action: '背3个单词',
    trigger: '刷牙时',
    reward: '夸夸自己'
  },
  tidy: {
    identity: '我是一个会保持整洁的人',
    action: '把桌子收拾一下',
    trigger: '写完作业',
    reward: '放首歌听'
  },
  water: {
    identity: '我是一个会照顾自己健康的人',
    action: '喝一杯水',
    trigger: '睡醒后',
    reward: '给自己一个微笑'
  },
  exercise: {
    identity: '我是一个会活动身体的人',
    action: '做3个俯卧撑',
    trigger: '久坐后',
    reward: '休息5分钟'
  }
};

window.applyStudentTemplate = function(templateKey) {
  const template = studentTemplates[templateKey];
  if (!template) return;
  
  $('#createHabitForm')?.classList.remove('hidden');
  
  setTimeout(() => {
    if ($('#habitIdentity')) $('#habitIdentity').value = template.identity;
    if ($('#habitAction')) $('#habitAction').value = template.action;
    if ($('#habitTrigger')) $('#habitTrigger').value = template.trigger;
    if ($('#habitReward')) $('#habitReward').value = template.reward;
  }, 50);
};

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

window.setPriorityMode = function(simple) {
  window.prioritySession.simpleMode = simple;
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', 
      (btn.textContent.includes('极简') && simple) || 
      (btn.textContent.includes('完整') && !simple)
    );
  });
  
  const gatePath = document.getElementById('gatePath');
  if (gatePath) {
    if (simple) {
      gatePath.innerHTML = `
        <div class="gate-node active">
          <div class="gate-icon">⚡</div>
          <div class="gate-short-label">快速决策</div>
        </div>
      `;
    } else {
      gatePath.innerHTML = PRIORITY_GATES.map((gate, idx) => `
        <div class="gate-node ${idx === 0 ? 'active' : 'pending'}" data-gate="${gate.id}" data-index="${idx}">
          <div class="gate-icon">🚪</div>
          <div class="gate-short-label">${gate.shortLabel}</div>
        </div>
      `).join('<div class="gate-connector"></div>');
    }
  }
};

window.applyTemplate = function(template) {
  const textarea = document.getElementById('priorityTask');
  if (textarea) {
    textarea.value = template;
    textarea.focus();
  }
};

function renderPriority() {
  window.prioritySession = {
    taskText: '',
    currentGateIndex: 0,
    gatePath: [],
    nextStep: '',
    suggestedTimeBlock: '',
    simpleMode: false
  };
  
  const quickTemplates = [
    { label: '期末复习', icon: '📚' },
    { label: '论文推进', icon: '📝' },
    { label: '任务太多', icon: '📋' },
    { label: '不知道先做哪个', icon: '🤔' },
    { label: '项目优先级', icon: '🎯' }
  ];
  
  $('#app').innerHTML = `
    <div class="page priority-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🚪 优先级决策岛</h2>
        <p>经过五道门，找到最合适的行动</p>
      </header>
      
      <div class="mode-toggle">
        <button class="mode-btn ${window.prioritySession.simpleMode ? '' : 'active'}" onclick="setPriorityMode(false)">完整模式</button>
        <button class="mode-btn ${window.prioritySession.simpleMode ? 'active' : ''}" onclick="setPriorityMode(true)">极简模式 ⚡</button>
      </div>
      
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
          <div class="quick-templates" id="quickTemplates">
            ${quickTemplates.map(t => `
              <button class="template-chip" onclick="applyTemplate('${t.label}')">${t.icon} ${t.label}</button>
            `).join('')}
          </div>
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
  
  if (window.prioritySession.simpleMode) {
    renderSimpleGate();
  } else {
    renderCurrentGate();
  }
};

function renderSimpleGate() {
  $('#gateContent').innerHTML = `
    <div class="gate-header">
      <div class="gate-icon-large">⚡</div>
      <h3>快速决策</h3>
      <p class="gate-description">回答三个问题，找到行动方向</p>
    </div>
    <div class="simple-questions">
      <div class="simple-question">
        <label>1. 这件事必须做吗？</label>
        <div class="simple-options">
          <button class="btn btn-option" onclick="answerSimple(1, 'yes')">必须做</button>
          <button class="btn btn-option" onclick="answerSimple(1, 'no')">可以不做</button>
        </div>
      </div>
      <div class="simple-question hidden" id="simpleQ2">
        <label>2. 今天能做一点点吗？</label>
        <div class="simple-options">
          <button class="btn btn-option" onclick="answerSimple(2, 'yes')">可以</button>
          <button class="btn btn-option" onclick="answerSimple(2, 'no')">不行</button>
        </div>
      </div>
      <div class="simple-question hidden" id="simpleQ3">
        <label>3. 最小下一步是什么？</label>
        <input type="text" id="simpleMinStep" placeholder="描述一个最小的动作..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px;">
        <div class="time-block-select" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          <button class="btn btn-option" data-time="2分钟" onclick="selectSimpleTime('2分钟')">2分钟</button>
          <button class="btn btn-option" data-time="5分钟" onclick="selectSimpleTime('5分钟')">5分钟</button>
          <button class="btn btn-option" data-time="10分钟" onclick="selectSimpleTime('10分钟')">10分钟</button>
        </div>
        <button class="btn btn-primary" onclick="finishSimpleGate()">确定</button>
      </div>
    </div>
  `;
  window.simpleAnswers = { q1: null, q2: null, time: '5分钟' };
}

window.answerSimple = function(q, answer) {
  window.simpleAnswers['q' + q] = answer;
  const qEl = document.getElementById('simpleQ' + q);
  const nextEl = document.getElementById('simpleQ' + (q + 1));
  if (qEl) qEl.classList.add('hidden');
  if (nextEl) nextEl.classList.remove('hidden');
};

window.selectSimpleTime = function(time) {
  window.simpleAnswers.time = time;
  document.querySelectorAll('.time-block-select .btn-option').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.time-block-select [data-time="${time}"]`);
  if (btn) btn.classList.add('selected');
};

window.finishSimpleGate = function() {
  const minStep = $('#simpleMinStep')?.value?.trim();
  if (!minStep) {
    alert('请描述最小的一步');
    return;
  }
  
  const session = window.prioritySession;
  const answers = window.simpleAnswers;
  
  let category = 'TODAY';
  let reminder = '先开始，就已经迈出了第一步。';
  
  if (answers.q1 === 'no') {
    category = 'DELETE';
    reminder = '能放下的事情，也是在保护精力。';
  } else if (answers.q2 === 'no') {
    category = 'DEFER';
    reminder = '有意识地延后，也是一种决策。';
  }
  
  const record = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    task: session.taskText,
    result: {
      category,
      minStep,
      timeBlock: answers.time,
      reminder
    },
    gatePath: [],
    decision: category,
    simpleMode: true
  };
  
  state.priorityRecords.push(record);
  saveState(state);
  
  $('#gateCard')?.classList.add('hidden');
  $('#priorityResult')?.classList.remove('hidden');
  
  const categoryInfo = PRIORITY_CATEGORIES[category];
  const actionText = `我现在要做的事：${session.taskText}
下一步：${minStep}
预计时间：${answers.time}
完成标准：不是做好，只是开始`;
  
  $('#resultCard').innerHTML = `
    <div class="result-category" style="background: ${categoryInfo.color}20; border-left: 4px solid ${categoryInfo.color}; padding: 16px; border-radius: 8px;">
      <span style="font-size: 24px;">${categoryInfo.icon}</span>
      <span style="font-size: 18px; font-weight: 600; margin-left: 8px;">${categoryInfo.label}</span>
    </div>
    <div class="result-action-box">
      <div class="result-action-label">📋 立即行动</div>
      <div class="result-action-item"><strong>我要做的事：</strong>${session.taskText}</div>
      <div class="result-action-item"><strong>下一步：</strong>${minStep}</div>
      <div class="result-action-item"><strong>预计时间：</strong>${answers.time}</div>
      <div class="result-action-item"><strong>完成标准：</strong>不是做好，只是开始</div>
      <button class="btn btn-small btn-copy-action" onclick="copyPriorityAction(this)" data-action="${actionText.replace(/"/g, '&quot;')}">复制行动</button>
    </div>
    <div class="result-section gentle" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 16px; border-radius: 12px; border-left: 4px solid #10b981;">
      <p>💬 ${reminder}</p>
    </div>
  `;
  
  $('#pathSummary').innerHTML = '<div class="path-summary-title">🛤️ 极简模式</div>';
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
  
  const actionText = `我现在要做的事：${session.taskText}
下一步：${result.minStep}
预计时间：${result.timeBlock || '自行安排'}
完成标准：不是做好，只是开始`;
  
  let html = `
    <div class="result-category" style="background: ${categoryInfo.color}20; border-left: 4px solid ${categoryInfo.color}; padding: 16px; border-radius: 8px;">
      <span style="font-size: 24px;">${categoryInfo.icon}</span>
      <span style="font-size: 18px; font-weight: 600; margin-left: 8px;">${categoryInfo.label}</span>
    </div>
    <div class="result-action-box">
      <div class="result-action-label">📋 立即行动</div>
      <div class="result-action-item"><strong>我要做的事：</strong>${record.task}</div>
      <div class="result-action-item"><strong>下一步：</strong>${result.minStep}</div>
      ${result.timeBlock ? `<div class="result-action-item"><strong>预计时间：</strong>${result.timeBlock}</div>` : ''}
      <div class="result-action-item"><strong>完成标准：</strong>不是做好，只是开始</div>
      <button class="btn btn-small btn-copy-action" onclick="copyPriorityAction(this)" data-action="${actionText.replace(/"/g, '&quot;')}">复制行动</button>
    </div>
    <div class="result-section gentle" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 16px; border-radius: 12px; border-left: 4px solid #10b981;">
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

function getTimeGroup(record) {
  const recordDate = new Date(record.timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 86400000);
  
  if (recordDate >= today) {
    return '今天';
  } else if (recordDate >= yesterday) {
    return '昨天';
  } else if (recordDate >= threeDaysAgo) {
    return '近三天';
  } else {
    return '更早';
  }
}

function groupRecordsByTime(records) {
  const groups = {
    '今天': [],
    '昨天': [],
    '近三天': [],
    '更早': []
  };
  
  records.forEach(r => {
    const group = getTimeGroup(r);
    groups[group].push(r);
  });
  
  return groups;
}

function renderRecordItem(record, type) {
  const date = new Date(record.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  const typeLabels = {
    empathy: { label: '共情', color: '#e8d4b8' },
    status: { label: '状态', color: '#c8d8f5' },
    habit: { label: '习惯', color: '#c8f0d8' },
    priority: { label: '决策', color: '#f5dcc8' }
  };
  
  const typeInfo = typeLabels[type] || { label: '记录', color: '#e0e0e0' };
  
  let content = '';
  let extra = '';
  
  switch (type) {
    case 'empathy':
      const feelings = Array.isArray(record.feelings) ? record.feelings.join('、') : (record.feelings || '');
      if (feelings) {
        content = feelings;
        extra = record.selfExpression ? `<p class="record-note">${record.selfExpression}</p>` : '';
      }
      break;
    case 'status':
      content = `能量 ${record.energy || '?'}/10 · 压力 ${record.pressure || '?'}/10`;
      break;
    case 'habit':
      content = record.habitName || record.action || '习惯记录';
      break;
    case 'priority':
      content = record.task || record.content || '优先级决策';
      if (record.result?.category) {
        const catLabels = {
          DELETE: '删除',
          DEFER: '延后',
          SIMPLIFY: '简化',
          DELEGATE: '委托',
          TODAY: '今天',
          NOW: '立即'
        };
        extra = `<span class="record-badge" style="background: #f5dcc8;">${catLabels[record.result.category] || record.result.category}</span>`;
      }
      break;
    default:
      content = record.content || record.text || record.title || '记录';
  }
  
  return `
    <article class="garden-record record-${type}">
      <div class="record-header">
        <span class="record-type" style="background: ${typeInfo.color}">${typeInfo.label}</span>
        <time class="record-time">${timeStr}</time>
      </div>
      <p class="record-title">${content}</p>
      ${extra}
    </article>
  `;
}

function renderReview() {
  const feed = getCombinedFeed(state, 10);
  const totalRecords = state.empathyRecords.length + state.statusRecords.length + 
                       (state.habitLogs?.length || 0) + state.priorityRecords.length;
  
  const groupedFeed = groupRecordsByTime(feed);
  
  const sections = [];
  ['今天', '昨天', '近三天', '更早'].forEach(timeGroup => {
    if (groupedFeed[timeGroup].length > 0) {
      let recordsHtml = '';
      groupedFeed[timeGroup].forEach(item => {
        recordsHtml += renderRecordItem(item, item.type);
      });
      
      sections.push(`
        <section class="garden-section">
          <h3 class="garden-date">${timeGroup}</h3>
          <div class="garden-records">
            ${recordsHtml}
          </div>
        </section>
      `);
    }
  });
  
  const habitCount = state.habitLogs?.filter(l => {
    const logDate = new Date(l.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length || 0;
  
  const priorityTodayCount = state.priorityRecords.filter(r => {
    const recordDate = new Date(r.timestamp);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
  }).length;
  
  $('#app').innerHTML = `
    <div class="page review-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>🌸 回顾花园</h2>
        <p>看看你走过的路</p>
      </header>
      
      ${totalRecords > 0 ? `
        <div class="garden-summary">
          <div class="garden-summary-icon">✦</div>
          <div class="garden-summary-text">
            共 ${totalRecords} 条记录，其中 ${priorityTodayCount > 0 ? `${priorityTodayCount} 条优先级决策，` : ''}${habitCount > 0 ? `${habitCount} 条微习惯` : ''}留在了这里。
          </div>
        </div>
      ` : ''}
      
      ${sections.length > 0 ? sections.join('') : `
        <div class="garden-empty">
          <p>花园里还没有记录。</p>
          <p>去各个地方走走，留下一些痕迹吧。</p>
        </div>
      `}
      
      <div class="data-notice">
        <div class="data-notice-icon">🔒</div>
        <div class="data-notice-content">
          <strong>你的数据在这里</strong>
          <p>所有记录保存在你浏览器的本地存储中，不会发送到任何服务器。如果清除浏览器数据，这些记录也会消失。建议定期导出备份。</p>
        </div>
      </div>
      
      <div class="crisis-resources">
        <div class="crisis-resources-header" onclick="toggleCrisisResources()">
          <span>🆘 需要更多支持？</span>
          <span class="crisis-toggle" id="crisisToggle">点击展开</span>
        </div>
        <div class="crisis-resources-content hidden" id="crisisResourcesContent">
          <p>这个工具用于日常自我觉察和整理，不能替代专业帮助。如果你正在经历严重困扰：</p>
          <ul>
            <li>🗣️ 找一个信任的人聊聊</li>
            <li>📞 拨打心理援助热线</li>
            <li>🩺 寻求专业心理咨询</li>
          </ul>
          <p class="crisis-note">记住：寻求帮助是勇敢的表现，不是软弱。</p>
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

window.toggleCrisisResources = function() {
  const content = $('#crisisResourcesContent');
  const toggle = $('#crisisToggle');
  if (content && toggle) {
    content.classList.toggle('hidden');
    toggle.textContent = content.classList.contains('hidden') ? '点击展开' : '点击收起';
  }
};

window.showCareSection = function() {
  const section = $('#careActionsSection');
  if (section) {
    section.classList.remove('hidden');
  }
};

window.goToPriorityFromEmpathy = function() {
  navigate('priority');
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
    case 'rating':
      renderRating();
      break;
    case 'review':
      renderReview();
      break;
    default:
      renderHome();
  }
};

function renderRating() {
  const recentRatings = getRecentRatings(state, 7);
  const todayRating = recentRatings[0];
  
  window.ratingData = {};
  Object.keys(RATING_CATEGORIES).forEach(catId => {
    window.ratingData[catId] = {};
    RATING_CATEGORIES[catId].subItems.forEach(item => {
      window.ratingData[catId][item.id] = todayRating?.categories?.[catId]?.scores?.[item.id] || 5;
    });
  });
  
  const lang = getCurrentLang();
  
  let categoriesHtml = '';
  Object.keys(RATING_CATEGORIES).forEach(catId => {
    const cat = RATING_CATEGORIES[catId];
    categoriesHtml += `
      <div class="rating-category" data-category="${catId}">
        <div class="rating-category-header">
          <span class="rating-category-icon">${cat.icon}</span>
          <span class="rating-category-name">${cat.name[lang] || cat.name.zh}</span>
        </div>
        <div class="rating-subitems">
    `;
    
    cat.subItems.forEach(subItem => {
      const currentScore = window.ratingData[catId]?.[subItem.id] || 5;
      const scoreOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const mainScores = [1, 3, 5, 7, 9];
      categoriesHtml += `
        <div class="rating-subitem">
          <div class="rating-subitem-name">${subItem.name[lang] || subItem.name.zh}</div>
          <div class="rating-grid-container">
            <div class="rating-grid" id="grid_${catId}_${subItem.id}">
              ${scoreOptions.map(score => `
                <button class="rating-grid-cell ${score === currentScore ? 'selected' : ''} ${mainScores.includes(score) ? 'main-score' : ''}" 
                        data-score="${score}"
                        onclick="selectRatingScore('${catId}', '${subItem.id}', ${score})">
                  ${score}
                </button>
              `).join('')}
            </div>
            <div class="rating-grid-labels">
              <span>${lang === 'zh' ? '很低' : 'Very Low'}</span>
              <span>${lang === 'zh' ? '很高' : 'Very High'}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    categoriesHtml += '</div></div>';
  });
  
  let historyHtml = '';
  if (recentRatings.length > 0) {
    recentRatings.forEach((record, idx) => {
      const dateStr = formatRatingDate(record.timestamp);
      const avg = getOverallAverage(record);
      let miniScores = '';
      Object.keys(record.categories).forEach(catId => {
        const catAvg = calculateCategoryAverage(record, catId);
        miniScores += `<span class="mini-score">${RATING_CATEGORIES[catId]?.icon || ''}${catAvg}</span>`;
      });
      historyHtml += `
        <div class="history-item ${idx === 0 ? 'today' : ''}">
          <span class="history-date">${dateStr}</span>
          <span class="history-avg">${avg}</span>
          <span class="history-scores">${miniScores}</span>
        </div>
      `;
    });
  } else {
    historyHtml = '<p class="empty-note">还没有评分记录</p>';
  }
  
  $('#app').innerHTML = `
    <div class="page rating-page">
      ${renderBackButton('home')}
      <header class="page-header">
        <h2>📊 ${lang === 'zh' ? '今日状态' : "Today's Status"}</h2>
        <p>${lang === 'zh' ? '觉察当下，从评分开始' : 'A quick check-in with where you are right now'}</p>
      </header>
      
      <div class="rating-explanation">
        <p style="font-size: 14px; color: var(--color-text-light); margin-bottom: 8px;">
          ${lang === 'zh' ? '💡 小贴士：' : '💡 Tip:'}
        </p>
        <p style="font-size: 13px; color: var(--color-text-light);">
          ${lang === 'zh' ? '这里的「爱」不只是恋爱，也包括家人、朋友、被支持、照顾自己；「工作」也可以是学业。' : '"Love" can include family, friends, and how you care for yourself. "Work" can include school, study, or paid work.'}
        </p>
      </div>
      
      <div class="rating-container">
        ${categoriesHtml}
      </div>
      
      <div class="rating-save-row">
        <button class="btn btn-primary btn-large" onclick="saveRating()">
          ${lang === 'zh' ? '保存评分' : 'Save Rating'}
        </button>
      </div>
      
      ${recentRatings.length > 0 ? `
        <div class="rating-history">
          <h3>${lang === 'zh' ? '最近记录' : 'Recent Records'}</h3>
          <div class="history-list">
            ${historyHtml}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

window.selectRatingScore = function(catId, subItemId, score) {
  if (!window.ratingData[catId]) {
    window.ratingData[catId] = {};
  }
  window.ratingData[catId][subItemId] = score;
  
  const grid = document.getElementById(`grid_${catId}_${subItemId}`);
  if (grid) {
    grid.querySelectorAll('.rating-grid-cell').forEach(cell => {
      cell.classList.remove('selected');
      if (parseInt(cell.dataset.score) === score) {
        cell.classList.add('selected');
      }
    });
  }
};

window.adjustRating = function(catId, subItemId, delta) {
  if (!window.ratingData[catId]) {
    window.ratingData[catId] = {};
  }
  if (!window.ratingData[catId][subItemId]) {
    window.ratingData[catId][subItemId] = 5;
  }
  
  window.ratingData[catId][subItemId] = Math.min(9, Math.max(1, window.ratingData[catId][subItemId] + delta));
  
  const scoreEl = document.getElementById(`score_${catId}_${subItemId}`);
  if (scoreEl) {
    scoreEl.textContent = window.ratingData[catId][subItemId];
    scoreEl.classList.add('pulse');
    setTimeout(() => scoreEl.classList.remove('pulse'), 200);
  }
};

window.saveRating = function() {
  const record = createRatingRecord(window.ratingData);
  state.ratingRecords.push(record);
  saveState(state);
  
  const lang = getCurrentLang();
  alert(lang === 'zh' ? '已保存！' : 'Saved!');
  renderRating();
};

window.toggleLanguage = function() {
  const currentLang = getCurrentLang();
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  setCurrentLang(newLang);
  
  const btn = document.getElementById('langToggleBtn');
  if (btn) {
    btn.textContent = newLang === 'zh' ? 'EN' : '中文';
    btn.setAttribute('aria-label', newLang === 'zh' ? 'Switch to English' : '切换到中文');
  }
  
  navigate(currentPage);
};

document.addEventListener('DOMContentLoaded', () => {
  const lang = getCurrentLang();
  const btn = document.getElementById('langToggleBtn');
  if (btn) {
    btn.textContent = lang === 'zh' ? 'EN' : '中文';
    btn.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  }
  
  navigate('home');
});
