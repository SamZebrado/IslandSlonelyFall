// 自我鼓励文案模块
// 用途：在合适位置展示这些句子，传递温暖与力量

export const SELF_ENCODEMENTS = [
  {
    zh: '我很好，我值得',
    en: "I'm good enough, I deserve it"
  },
  {
    zh: '我能实现我的目标',
    en: "I can achieve my goals"
  },
  {
    zh: '我能控制我自己',
    en: "I can control myself"
  },
  {
    zh: '我拥抱改变，挑战使我成长',
    en: "I embrace change; challenges help me grow"
  },
  {
    zh: '我原谅自己，过去的都会过去（但不会否定自己做过的事，并且愿意承担责任）',
    en: "I forgive myself, the past will pass (without denying what I've done, and willing to take responsibility)"
  }
];

let lastIndex = -1;

export function getRandomEncouragement() {
  let idx;
  do {
    idx = Math.floor(Math.random() * SELF_ENCODEMENTS.length);
  } while (idx === lastIndex && SELF_ENCODEMENTS.length > 1);
  lastIndex = idx;
  return SELF_ENCODEMENTS[idx];
}

export function getEncouragementByIndex(index) {
  return SELF_ENCODEMENTS[index % SELF_ENCODEMENTS.length];
}
