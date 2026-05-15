export const DEFAULT_REWARDS = [
  '打个勾', '伸个懒腰', '听一首歌', '喝杯水', '深呼吸三次',
  '看看窗外', '微笑一下', '说一句鼓励自己的话'
];

export const DEFAULT_TRIGGERS = [
  '起床后', '吃完早饭后', '到公司后', '打开电脑后',
  '午休后', '下班后', '睡前洗漱后', '到家后'
];

export const HABIT_FEEDBACK = {
  complete: [
    '这一步很小，但它已经算数。',
    '你刚刚给今天点了一盏小灯。',
    '不用很用力，能做一点就很好。',
    '这颗种子今天被照看了一下。',
    '今天又多了一盏亮着的小灯。',
    '很温柔地完成了呢。'
  ],
  skip: [
    '这次先放过也可以，记录下来就够了。',
    '今天不做，不代表这件事失败了。',
    '先保留这颗种子，等合适的时候再照看。',
    '跳过也是一种选择，不扣分。',
    '这颗种子还在，明天见。'
  ]
};

export function pickHabitFeedback(action) {
  const pool = HABIT_FEEDBACK[action] || [];
  if (!pool.length) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTodayHabitStats(habitLogs) {
  const today = new Date().toISOString().slice(0, 10);
  const logs = habitLogs || [];
  const todayLogs = logs.filter(log => {
    if (typeof log.timestamp === 'string') {
      return log.timestamp.slice(0, 10) === today;
    }
    return false;
  });
  return {
    completed: todayLogs.filter(log => log.status === 'completed').length,
    skipped: todayLogs.filter(log => log.status === 'skipped').length,
    total: todayLogs.length
  };
}

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
