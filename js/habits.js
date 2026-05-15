export const DEFAULT_REWARDS = [
  '打个勾', '伸个懒腰', '听一首歌', '喝杯水', '深呼吸三次',
  '看看窗外', '微笑一下', '说一句鼓励自己的话'
];

export const DEFAULT_TRIGGERS = [
  '起床后', '吃完早饭后', '到公司后', '打开电脑后',
  '午休后', '下班后', '睡前洗漱后', '到家后'
];

export function createHabit(data) {
  return {
    id: Date.now().toString(),
    identity: data.identity || '',
    action: data.action || '',
    trigger: data.trigger || '',
    reward: data.reward || DEFAULT_REWARDS[0],
    createdAt: new Date().toISOString(),
    isActive: true
  };
}

export function getTodayHabits(habits) {
  const today = new Date().toDateString();
  return habits.filter(h => h.isActive);
}

export function getHabitLogsForToday(habitLogs) {
  const today = new Date().toDateString();
  return habitLogs.filter(log => {
    const logDate = new Date(log.timestamp).toDateString();
    return logDate === today;
  });
}

export function completeHabit(habitId, habitLogs) {
  habitLogs.push({
    habitId,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
}

export function skipHabit(habitId, habitLogs) {
  habitLogs.push({
    habitId,
    status: 'skipped',
    timestamp: new Date().toISOString()
  });
}

export function getHabitCompletionStats(habits, habitLogs) {
  const today = new Date().toDateString();
  const todayLogs = habitLogs.filter(log => 
    new Date(log.timestamp).toDateString() === today
  );
  
  const completed = todayLogs.filter(l => l.status === 'completed').length;
  const total = habits.filter(h => h.isActive).length;
  
  return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
