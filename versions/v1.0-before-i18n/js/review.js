export function formatEmpathyRecord(record) {
  const date = new Date(record.timestamp);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  const situation = record.situation || '';
  const feelings = Array.isArray(record.feelings) ? record.feelings.join('、') : (record.feelings || '');
  const needs = Array.isArray(record.needs) ? record.needs.join('、') : (record.needs || '');
  const selfExpression = record.selfExpression || '';
  const otherExpression = record.otherExpression || '';
  
  return {
    ...record,
    dateStr,
    situation,
    feelings,
    needs,
    selfExpression,
    otherExpression
  };
}

export function formatPriorityRecord(record) {
  const date = new Date(record.timestamp);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  const result = record.result || {};
  const categoryInfo = {
    DELETE: { label: '删除', icon: '✕', color: '#94a3b8' },
    DEFER: { label: '延后', icon: '⏸', color: '#64748b' },
    SIMPLIFY: { label: '简化', icon: '~', color: '#94a3b8' },
    DELEGATE: { label: '委托', icon: '→', color: '#94a3b8' },
    TODAY: { label: '今天推进', icon: '●', color: '#6366f1' },
    NOW: { label: '立即处理', icon: '★', color: '#8b5cf6' }
  }[result.category] || { label: '待定', icon: '?', color: '#9ca3af' };
  
  return {
    ...record,
    dateStr,
    categoryInfo
  };
}

export function getRecentRecords(records, limit = 5) {
  return records
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

export function getCombinedFeed(state, limit = 10) {
  const items = [];
  
  state.empathyRecords.forEach(r => {
    items.push({ type: 'empathy', ...r });
  });
  
  state.statusRecords.forEach(r => {
    items.push({ type: 'status', ...r });
  });
  
  state.priorityRecords.forEach(r => {
    items.push({ type: 'priority', ...r });
  });
  
  state.habitLogs.forEach(log => {
    const habit = state.habits.find(h => h.id === log.habitId);
    if (habit) {
      items.push({ 
        type: 'habit', 
        habitName: habit.action,
        status: log.status,
        timestamp: log.timestamp 
      });
    }
  });
  
  return items
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}
