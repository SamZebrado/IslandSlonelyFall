export const PRIORITY_CATEGORIES = {
  DELETE: { label: '删除', color: '#94a3b8', icon: '✕' },
  DEFER: { label: '延后', color: '#64748b', icon: '⏸' },
  SIMPLIFY: { label: '简化', color: '#94a3b8', icon: '~' },
  DELEGATE: { label: '交给别人', color: '#94a3b8', icon: '→' },
  TODAY: { label: '今天推进', color: '#6366f1', icon: '●' },
  NOW: { label: '立即处理', color: '#8b5cf6', icon: '★' }
};

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
    categoryInfo: PRIORITY_CATEGORIES[record.result.category] || {}
  };
}
