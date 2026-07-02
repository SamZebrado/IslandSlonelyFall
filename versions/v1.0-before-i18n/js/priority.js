export const PRIORITY_CATEGORIES = {
  DELETE: { label: '删除', color: '#94a3b8', icon: '✕' },
  DEFER: { label: '延后', color: '#64748b', icon: '⏸' },
  SIMPLIFY: { label: '简化', color: '#94a3b8', icon: '~' },
  DELEGATE: { label: '交给别人', color: '#94a3b8', icon: '→' },
  TODAY: { label: '今天推进', color: '#6366f1', icon: '●' },
  NOW: { label: '立即处理', color: '#8b5cf6', icon: '★' }
};

export const PRIORITY_GATES = [
  {
    id: 'release',
    name: '放下门',
    shortLabel: '放下',
    icon: '🚪',
    description: '先看看它是否真的需要占用你的精力。',
    question: '这件事真的需要你处理吗？',
    options: [
      { value: 'delete', label: '可以删除', feedback: '能放下的事情，也是在保护精力。', resultCategory: 'DELETE' },
      { value: 'keep', label: '需要处理', feedback: '那我们继续把它拆清楚一点。', resultCategory: null },
      { value: 'unsure', label: '还不确定', feedback: '不确定也可以，先继续往前看。', resultCategory: null }
    ]
  },
  {
    id: 'simplify',
    name: '简化门',
    shortLabel: '简化',
    icon: '🚪',
    description: '看看它能否被缩小一点。',
    question: '如果不追求完整版本，它能被缩小到什么程度？',
    options: [
      { value: 'simplify', label: '可以缩小', feedback: '缩小任务不是偷懒，是给行动留入口。', resultCategory: 'SIMPLIFY' },
      { value: 'full', label: '不能缩小', feedback: '完整版也有它的价值。', resultCategory: null },
      { value: 'think', label: '需要先想想', feedback: '想一下也可以，不急。', resultCategory: null }
    ]
  },
  {
    id: 'delegate',
    name: '求助门',
    shortLabel: '求助',
    icon: '🚪',
    description: '看看有没有可以借助的力量。',
    question: '这件事有没有一部分可以借助别人、工具或模板？',
    options: [
      { value: 'people', label: '可以求助', feedback: '不一定要一个人把整件事扛完。', resultCategory: 'DELEGATE' },
      { value: 'tools', label: '可以用工具', feedback: '好的工具可以省很多力气。', resultCategory: 'DELEGATE' },
      { value: 'alone', label: '只能自己做', feedback: '自己来也是一种能力。', resultCategory: null }
    ]
  },
  {
    id: 'defer',
    name: '稍后门',
    shortLabel: '稍后',
    icon: '🚪',
    description: '看看时机是否合适。',
    question: '这件事适合现在处理，还是适合稍后处理？',
    options: [
      { value: 'now', label: '现在适合', feedback: '好，那我们就专注处理它。', resultCategory: 'TODAY' },
      { value: 'later', label: '稍后更合适', feedback: '有意识地延后，也是一种决策。', resultCategory: 'DEFER' },
      { value: 'bay', label: '放进稍后海湾', feedback: '稍后海湾会为它留一个位置。', resultCategory: 'DEFER' }
    ]
  },
  {
    id: 'focus',
    name: '专注门',
    shortLabel: '专注',
    icon: '🚪',
    description: '确定今天的最小下一步。',
    question: '如果今天只推进一点点，最小下一步是什么？',
    timeOptions: [
      { value: '2min', label: '2分钟' },
      { value: '5min', label: '5分钟' },
      { value: '10min', label: '10分钟' },
      { value: '25min', label: '25分钟' },
      { value: 'none', label: '今天不安排，只记录' }
    ],
    feedback: '最小下一步已经足够成为入口。'
  }
];

export function analyzePriority(task, answers) {
  const { q1, q2, q3, q4, q5 } = answers;
  
  if (q1 === 'no') {
    return {
      category: 'DELETE',
      minStep: '这件事可能不需要做，可以放心放下。',
      timeBlock: null,
      reminder: '有时候放下也是一种选择。'
    };
  }
  
  if (q2 === 'yes') {
    return {
      category: 'DELETE',
      minStep: '这件事可以删除或不再做。',
      timeBlock: null,
      reminder: '不是所有事都必须做。'
    };
  }
  
  if (q3 === 'yes') {
    return {
      category: q3 === 'yes' ? 'DELEGATE' : 'SIMPLIFY',
      minStep: answers.simplifiedTask || '尝试简化这个任务或委托给他人。',
      timeBlock: '15-30分钟',
      reminder: '不必事事亲力亲为。'
    };
  }
  
  if (q4 === 'no') {
    return {
      category: 'DEFER',
      minStep: '这件事可以稍后处理，先专注更重要的事。',
      timeBlock: null,
      reminder: '不是所有事都需要现在做。'
    };
  }
  
  return {
    category: q5 ? 'TODAY' : 'NOW',
    minStep: q5 || '现在就处理一点点，哪怕只是一分钟。',
    timeBlock: q5 ? '15-25分钟' : '5-10分钟',
    reminder: '先开始，就已经迈出了第一步。'
  };
}

export function formatPriorityRecord(record) {
  const date = new Date(record.timestamp);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  return {
    ...record,
    dateStr,
    categoryInfo: PRIORITY_CATEGORIES[record.result?.category] || {}
  };
}

export function derivePriorityDecision(gatePath) {
  const answers = gatePath.map(item => item.answer);
  
  if (answers.includes('delete')) {
    return {
      category: 'DELETE',
      minStep: '这件事可能不需要做，可以放心放下。',
      timeBlock: null,
      reminder: '能放下的事情，也是在保护精力。'
    };
  }
  
  if (answers.includes('simplify')) {
    return {
      category: 'SIMPLIFY',
      minStep: '这件事可以尝试缩小范围或降低标准。',
      timeBlock: '15-25分钟',
      reminder: '缩小任务不是偷懒，是给行动留入口。'
    };
  }
  
  if (answers.includes('people') || answers.includes('tools')) {
    return {
      category: 'DELEGATE',
      minStep: '这件事可以尝试借助别人或工具来完成一部分。',
      timeBlock: '15-30分钟',
      reminder: '不一定要一个人把整件事扛完。'
    };
  }
  
  if (answers.includes('later') || answers.includes('bay')) {
    return {
      category: 'DEFER',
      minStep: '这件事暂时延后，先专注更重要的事。',
      timeBlock: null,
      reminder: '有意识地延后，也是一种决策。'
    };
  }
  
  const focusGate = gatePath.find(g => g.gateId === 'focus');
  if (focusGate) {
    return {
      category: 'TODAY',
      minStep: focusGate.nextStep || '现在就处理一点点，哪怕只是一分钟。',
      timeBlock: focusGate.timeBlock || '5-10分钟',
      reminder: '最小下一步已经足够成为入口。'
    };
  }
  
  return {
    category: 'TODAY',
    minStep: '现在就处理一点点，哪怕只是一分钟。',
    timeBlock: '5-10分钟',
    reminder: '先开始，就已经迈出了第一步。'
  };
}
