export const ENERGY_LEVELS = ['很低', '较低', '一般', '较好', '很好'];
export const PRESSURE_LEVELS = ['无感', '轻微', '中等', '较高', '很高'];
export const CLARITY_LEVELS = ['很模糊', '较模糊', '一般', '较清晰', '很清晰'];

export const ENERGY_LEVELS_EN = ['Very Low', 'Low', 'Average', 'Good', 'Great'];
export const PRESSURE_LEVELS_EN = ['None', 'Light', 'Moderate', 'High', 'Very High'];
export const CLARITY_LEVELS_EN = ['Very unclear', 'Unclear', 'Average', 'Clear', 'Very clear'];

export const STATUS_OPTIONS = [
  '疲惫', '焦虑', '平静', '有动力', '混乱', '恢复中',
  '专注', '低落', '紧张', '轻松', '迷茫', '充实'
];

export const STATUS_OPTIONS_EN = [
  'Exhausted', 'Anxious', 'Peaceful', 'Motivated', 'Chaotic', 'Recovering',
  'Focused', 'Down', 'Tense', 'Relaxed', 'Lost', 'Fulfilled'
];

export const DIRECTIONS = [
  '学习', '工作', '关系', '身体', '休息', '创作', '其他'
];

export const DIRECTIONS_EN = [
  'Study', 'Work', 'Relationships', 'Health', 'Rest', 'Creative', 'Other'
];

export function formatStatusRecord(record, lang = 'zh') {
  const date = new Date(record.timestamp);
  const dateStr = lang === 'en'
    ? `${date.toLocaleString('en', { month: 'short', day: 'numeric' })} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const energyArr = lang === 'en' ? ENERGY_LEVELS_EN : ENERGY_LEVELS;
  const pressureArr = lang === 'en' ? PRESSURE_LEVELS_EN : PRESSURE_LEVELS;
  const clarityArr = lang === 'en' ? CLARITY_LEVELS_EN : CLARITY_LEVELS;

  return {
    ...record,
    dateStr,
    energyLabel: energyArr[record.energy - 1] || (lang === 'en' ? 'Unknown' : '未知'),
    pressureLabel: pressureArr[record.pressure - 1] || (lang === 'en' ? 'Unknown' : '未知'),
    clarityLabel: clarityArr[record.clarity - 1] || (lang === 'en' ? 'Unknown' : '未知')
  };
}

export function getStatusFeedback(record, lang = 'zh') {
  const { energy, pressure, clarity } = record;
  const avg = (energy + (6 - pressure) + clarity) / 3;

  const messages = {
    zh: {
      high: '今天状态不错，继续保持这份感觉。',
      mid: '今天还不错，稳稳地往前走就好。',
      low: '今天有点挑战，但能看到你已经在这里了。',
      veryLow: '今天不容易，允许自己休息一下吧。'
    },
    en: {
      high: "You're doing well today, keep it up.",
      mid: "You're doing okay today, just keep moving forward steadily.",
      low: "Today has been challenging, but it's good that you're here.",
      veryLow: "It's been a tough day, allow yourself to rest."
    }
  };

  const msg = messages[lang] || messages.zh;
  if (avg >= 4) return msg.high;
  if (avg >= 3) return msg.mid;
  if (avg >= 2) return msg.low;
  return msg.veryLow;
}
