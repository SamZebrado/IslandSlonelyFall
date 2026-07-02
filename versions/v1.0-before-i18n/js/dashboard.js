export const ENERGY_LEVELS = ['很低', '较低', '一般', '较好', '很好'];
export const PRESSURE_LEVELS = ['无感', '轻微', '中等', '较高', '很高'];
export const CLARITY_LEVELS = ['很模糊', '较模糊', '一般', '较清晰', '很清晰'];

export const STATUS_OPTIONS = [
  '疲惫', '焦虑', '平静', '有动力', '混乱', '恢复中',
  '专注', '低落', '紧张', '轻松', '迷茫', '充实'
];

export const DIRECTIONS = [
  '学习', '工作', '关系', '身体', '休息', '创作', '其他'
];

export function formatStatusRecord(record) {
  const date = new Date(record.timestamp);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  return {
    ...record,
    dateStr,
    energyLabel: ENERGY_LEVELS[record.energy - 1] || '未知',
    pressureLabel: PRESSURE_LEVELS[record.pressure - 1] || '未知',
    clarityLabel: CLARITY_LEVELS[record.clarity - 1] || '未知'
  };
}

export function getStatusFeedback(record) {
  const { energy, pressure, clarity } = record;
  const avg = (energy + (6 - pressure) + clarity) / 3;
  
  if (avg >= 4) {
    return '今天状态不错，继续保持这份感觉。';
  } else if (avg >= 3) {
    return '今天还不错，稳稳地往前走就好。';
  } else if (avg >= 2) {
    return '今天有点挑战，但能看到你已经在这里了。';
  } else {
    return '今天不容易，允许自己休息一下吧。';
  }
}
