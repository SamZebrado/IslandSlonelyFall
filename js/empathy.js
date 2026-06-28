const FEELINGS = {
  exhausted: ['疲惫', '精疲力竭', '无力', '困倦', '昏沉'],
  anxious: ['焦虑', '紧张', '不安', '担忧', '恐慌', '忐忑'],
  sad: ['悲伤', '难过', '失落', '沮丧', '灰心'],
  angry: ['生气', '恼火', '愤怒', '烦躁', '挫败', '不满'],
  confused: ['困惑', '迷茫', '混乱', '不知所措', '犹豫'],
  lonely: ['孤独', '寂寞', '疏离', '被遗忘'],
  embarrassed: ['尴尬', '羞愧', '难堪', '不好意思'],
  peaceful: ['平静', '安心', '放松', '宁静', '舒适'],
  happy: ['开心', '愉悦', '满足', '欣慰', '喜悦'],
  excited: ['兴奋', '期待', '激动', '热情', '充满活力']
};

const FEELINGS_EN = {
  exhausted: ['Exhausted', 'Burned out', 'Drained', 'Sleepy', 'Foggy'],
  anxious: ['Anxious', 'Nervous', 'Uneasy', 'Worried', 'Panicked', 'Restless'],
  sad: ['Sad', 'Down', 'Lost', 'Frustrated', 'Disheartened'],
  angry: ['Angry', 'Annoyed', 'Furious', 'Irritated', 'Frustrated', 'Resentful'],
  confused: ['Confused', 'Lost', 'Chaotic', 'At a loss', 'Hesitant'],
  lonely: ['Lonely', 'Isolated', 'Disconnected', 'Forgotten'],
  embarrassed: ['Awkward', 'Ashamed', 'Self-conscious', 'Embarrassed'],
  peaceful: ['Peaceful', 'Relieved', 'Relaxed', 'Calm', 'Comfortable'],
  happy: ['Happy', 'Pleasant', 'Satisfied', 'Grateful', 'Joyful'],
  excited: ['Excited', 'Anticipating', 'Thrilled', 'Passionate', 'Energized']
};

const NEEDS = {
  rest: ['休息', '放松', '睡眠', '独处', '安静'],
  safety: ['安全感', '稳定感', '保障', '安心'],
  understanding: ['被理解', '被倾听', '被认可', '共情'],
  respect: ['被尊重', '被接纳', '被欣赏', '尊严'],
  connection: ['陪伴', '归属感', '联系', '亲密', '支持'],
  autonomy: ['自主选择', '自由', '独立', '掌控感'],
  growth: ['成长', '学习', '进步', '意义', '目标'],
  physical: ['食物', '运动', '健康', '舒适', '清洁'],
  creativity: ['创造', '表达', '美', '娱乐', '乐趣'],
  clarity: ['清晰', '理解', '方向', '答案']
};

const NEEDS_EN = {
  rest: ['Rest', 'Relaxation', 'Sleep', 'Solitude', 'Quiet'],
  safety: ['Safety', 'Stability', 'Security', 'Relief'],
  understanding: ['Understanding', 'Being heard', 'Recognition', 'Empathy'],
  respect: ['Respect', 'Acceptance', 'Appreciation', 'Dignity'],
  connection: ['Companionship', 'Belonging', 'Connection', 'Intimacy', 'Support'],
  autonomy: ['Autonomy', 'Freedom', 'Independence', 'Control'],
  growth: ['Growth', 'Learning', 'Progress', 'Meaning', 'Purpose'],
  physical: ['Food', 'Exercise', 'Health', 'Comfort', 'Cleanliness'],
  creativity: ['Creation', 'Expression', 'Beauty', 'Entertainment', 'Fun'],
  clarity: ['Clarity', 'Understanding', 'Direction', 'Answers']
};

const TARGETS = ['自己', '朋友', '上司/同事', '伴侣/亲人'];
const TARGETS_EN = ['Myself', 'Friend', 'Boss/Colleague', 'Partner/Family'];
const TONES = ['轻松', '温和', '清晰', '边界'];
const TONES_EN = ['Light', 'Gentle', 'Clear', 'Boundaries'];

const EXPRESSIONS = {
  '自己': {
    '轻松': [
      '我今天有点累，先休息一下吧。',
      '感觉有点不在状态，允许自己缓一缓。',
      '今天先到这里，明天再说吧。'
    ],
    '温和': [
      '看来自己挺疲惫的，允许自己放松一下。',
      '我需要一点时间照顾自己。',
      '先给自己一个暂停的空间。'
    ],
    '清晰': [
      '我需要先缓一缓，让思绪平静下来。',
      '我现在需要暂停整理一下。',
      '我需要一些时间和空间来处理这件事。'
    ],
    '边界': [
      '我现在需要安静，不想被打扰。',
      '请给我一点独处的时间。',
      '我需要先照顾好自己。'
    ]
  },
  '朋友': {
    '轻松': [
      '嘿，有点烦，先聊会儿别的吧？',
      '最近有点闹心，陪我散散心？',
      '想吐槽一下，有空聊聊吗？'
    ],
    '温和': [
      '最近我有点情绪低落，能不能陪我安静地坐会儿？',
      '我遇到点事，能听我说说吗？',
      '我需要一点支持，可以聊聊吗？'
    ],
    '清晰': [
      '我现在比较难受，能听我倾诉一会儿吗？',
      '有些事情想和你说说，现在方便吗？',
      '我需要你的倾听和支持。'
    ],
    '边界': [
      '抱歉，我现在不太想谈这个话题。',
      '这件事我想自己先处理一下。',
      '谢谢你关心，但我需要一些时间。'
    ]
  },
  '上司/同事': {
    '轻松': [
      '我手头有点卡，先摸索下再跟您汇报。',
      '进度有点慢，给我点时间调整一下。',
      '遇到点小问题，容我再想想。'
    ],
    '温和': [
      '我有点压力大，能否晚点再讨论进度？',
      '最近状态不太稳定，可能需要一些支持。',
      '这件事对我有点挑战，能给我一些建议吗？'
    ],
    '清晰': [
      '当前遇到障碍，需要时间整理，今晚给您反馈可以吗？',
      '我需要更多一些时间来完成这个任务。',
      '情况比预期复杂，建议我们讨论一下优先级。'
    ],
    '边界': [
      '不好意思，我现在情绪不太适合继续讨论，请允许我稍后回复。',
      '这件事超出了我目前能处理的范围。',
      '我需要先解决一些个人问题，明天再跟进可以吗？'
    ]
  },
  '伴侣/亲人': {
    '轻松': [
      '今天有点累了，先休息一下吧？抱抱我？',
      '心情有点闷，陪我看点什么转移一下注意力？',
      '今天不顺心，想靠着你待一会儿。'
    ],
    '温和': [
      '我现在心情复杂，能不能给我点空间安静一下？',
      '最近压力有点大，需要你的理解和支持。',
      '我有些事情在想，能陪我聊聊吗？'
    ],
    '清晰': [
      '我需要我们好好谈谈，最近积累了一些情绪。',
      '这件事让我感到困扰，希望能和你一起想想办法。',
      '我需要你的帮助来理清思路。'
    ],
    '边界': [
      '我们现在都冷静一会儿好不好？等想清楚再说。',
      '这件事我想自己先处理，晚点再和你分享。',
      '抱歉，我现在还没准备好谈这个。'
    ]
  }
};

export { FEELINGS, FEELINGS_EN, NEEDS, NEEDS_EN, TARGETS, TARGETS_EN, TONES, TONES_EN, EXPRESSIONS };

export function generateEmpathyResponse(data) {
  const { situation, feelings, needs, requests, target, tone } = data;
  
  let baseSituation = situation || '';
  let baseFeelings = Array.isArray(feelings) ? feelings.join('、') : feelings;
  let baseNeeds = Array.isArray(needs) ? needs.join('和') : needs;
  let baseRequests = requests || '';
  
  if (target && tone && EXPRESSIONS[target] && EXPRESSIONS[target][tone]) {
    const options = EXPRESSIONS[target][tone];
    const randomExpr = options[Math.floor(Math.random() * options.length)];
    return randomExpr;
  }
  
  return `我注意到${baseSituation}，这让我感到${baseFeelings}。我需要${baseNeeds}，所以我想对自己说：${baseRequests}`;
}
