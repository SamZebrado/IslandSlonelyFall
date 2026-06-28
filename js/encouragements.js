// 自我鼓励文案模块
// 用途：在合适位置展示这些句子，传递温暖与力量

export const SELF_ENCOURAGEMENTS = [
  '我很好，我值得',
  '我能实现我的目标',
  '我能控制我自己',
  '我拥抱改变，挑战使我成长',
  '我原谅自己，过去的都会过去（但不会否定自己做过的事，并且愿意承担责任）'
];

export const SELF_ENCOURAGEMENTS_EN = [
  'I am good, and I am worthy.',
  'I can achieve my goals.',
  'I can stay in control of myself.',
  'I embrace change; challenges help me grow.',
  'I forgive myself; the past will pass, but I do not deny what I have done, and I am willing to take responsibility.'
];

let lastIndex = -1;

export function getRandomEncouragement(lang = 'zh') {
  let idx;
  do {
    idx = Math.floor(Math.random() * SELF_ENCOURAGEMENTS.length);
  } while (idx === lastIndex && SELF_ENCOURAGEMENTS.length > 1);
  lastIndex = idx;
  if (lang === 'en') {
    return SELF_ENCOURAGEMENTS_EN[idx];
  }
  return SELF_ENCOURAGEMENTS[idx];
}

export function getEncouragementByIndex(index, lang = 'zh') {
  if (lang === 'en') {
    return SELF_ENCOURAGEMENTS_EN[index % SELF_ENCOURAGEMENTS_EN.length];
  }
  return SELF_ENCOURAGEMENTS[index % SELF_ENCOURAGEMENTS.length];
}
