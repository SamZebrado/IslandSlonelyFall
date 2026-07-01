const EXPRESSION_CONFIG = {
  audiences: {
    self: {
      label: '自己',
      styleHint: '自我共情、低压力、允许暂停'
    },
    partnerFriend: {
      label: '伴侣/朋友',
      styleHint: '柔软、真实、避免指责'
    },
    coworker: {
      label: '同事',
      styleHint: '具体、协作、避免情绪过载'
    },
    supervisor: {
      label: '导师/上级',
      styleHint: '克制、专业、清晰'
    },
    family: {
      label: '家人',
      styleHint: '温和、少评判、留余地'
    },
    unsafePerson: {
      label: '暂时不适合沟通的人',
      styleHint: '优先边界和自我保护，不鼓励强行沟通'
    }
  },

  modes: {
    journal: '只记录',
    message: '发消息',
    faceToFace: '当面说',
    schedule: '先约时间',
    boundary: '只设边界'
  },

  tones: {
    light: '很轻',
    gentle: '温和',
    clear: '清楚',
    firm: '坚定',
    boundary: '边界明确'
  }
};

function safeText(text, fallback) {
  if (!text || text.trim() === '') return fallback;
  const trimmed = text.trim();
  if (trimmed.length > 50) {
    return trimmed.substring(0, 47) + '...';
  }
  return trimmed;
}

function listText(items, fallback) {
  if (!items) return fallback;
  if (Array.isArray(items)) {
    if (items.length === 0) return fallback;
    return items.slice(0, 3).join('和');
  }
  if (typeof items === 'string' && items.trim()) {
    return items.trim().substring(0, 20);
  }
  return fallback;
}

function dedupeAndLimit(options, maxCount) {
  const seen = new Set();
  const result = [];
  for (const opt of options) {
    const key = opt.trim().toLowerCase();
    if (!seen.has(key) && result.length < maxCount) {
      seen.add(key);
      result.push(opt);
    }
  }
  return result;
}

function buildExpressionOptions(input) {
  const {
    audience,
    mode,
    tone,
    observation,
    feelings,
    needs,
    request
  } = input;

  const observationText = safeText(observation, '这件事');
  const feelingsText = listText(feelings, '有点不舒服');
  const needsText = listText(needs, '一点空间和清晰');
  const requestText = safeText(request, '先慢一点处理');

  const options = [];

  if (audience === 'self') {
    options.push(`我感受到${feelingsText}，可能是因为没有满足${needsText}这些需要。`);
    options.push(`这件事可以先不用立刻解决，我先把它看清楚一点。`);
    options.push(`我允许自己现在不太舒服，这很正常。`);
    options.push(`先照顾好自己，其他的可以等一等。`);
  }

  if (audience === 'partnerFriend') {
    options.push(`我不是想吵架，只是刚才有点难受，想慢一点说清楚。`);
    options.push(`你先不用急着帮我解决，能不能先听我说完？`);
    options.push(`我现在有点不稳定，希望你能多包涵一下。`);
    options.push(`我需要你，但我可能说不清楚具体要什么。`);
  }

  if (audience === 'coworker') {
    options.push(`我想先确认一下这件事的重点，避免我们后面重复沟通。`);
    options.push(`我现在比较需要把下一步拆清楚，这样会更容易推进。`);
    options.push(`这件事我还需要消化一下，晚点给你反馈可以吗？`);
    options.push(`我可以先说说我的理解，你看对不对。`);
  }

  if (audience === 'supervisor') {
    options.push(`我会先整理目前的信息，再确认下一步安排。`);
    options.push(`关于这件事，我想先确认一下当前优先级，避免后续重复修改。`);
    options.push(`目前遇到了一些状况，我会尽快整理出可行的方案。`);
    options.push(`我需要确认一下对这件事的理解是否准确。`);
  }

  if (audience === 'family') {
    options.push(`我现在可能有点累，不一定能马上讲清楚，想先慢一点说。`);
    options.push(`我不是想争对错，只是想让你知道我刚才有点不好受。`);
    options.push(`这件事我想认真说，但现在状态不太合适，能等一等吗？`);
    options.push(`我需要一点时间，不是针对你，只是我现在有点乱。`);
  }

  if (audience === 'unsafePerson') {
    options.push(`这部分我先记录下来，不急着发给对方。`);
    options.push(`我现在更适合先保护自己的边界，而不是马上解释。`);
    options.push(`这件事我先放一放，现在不急着消耗自己。`);
    options.push(`我可以先把这件事放远一点，不急着继续消耗自己。`);
  }

  if (mode === 'schedule') {
    options.push(`这件事我想认真说，但现在状态不太合适，我们可以晚点再聊吗？`);
    options.push(`我需要约个时间专门谈这件事，现在可能说不清楚。`);
  }

  if (mode === 'boundary') {
    options.push(`我现在不太适合继续讨论这个话题，想先暂停一下。`);
    options.push(`我需要设一个边界：这件事现在不适合谈。`);
    options.push(`对不起，我现在不想聊这个。`);
  }

  if (mode === 'journal') {
    options.push(`先写下来，不一定要给任何人看。`);
    options.push(`这是一个给自己看的记录，慢慢整理。`);
  }

  return dedupeAndLimit(options, 5);
}

function buildActionTips(input) {
  if (input.mode === 'faceToFace') {
    return [
      '先停 5 秒或喝一口水，让语速慢下来。',
      '不要持续盯着对方，可以短暂看向桌面、窗外或杯子。',
      '可以侧身坐，减少对峙感。',
      '如果情绪很强，先请求暂停，不要硬撑着说完。',
      '可以在说话前先深呼吸一次。'
    ];
  }

  if (input.mode === 'message') {
    return [
      '发送前检查是否出现"你总是 / 你从来 / 你就是"。',
      '如果内容很长，可以先存草稿，过 10 分钟再看。',
      '把命令式请求改成更具体、可拒绝的请求。',
      '如果你还很激动，可以先只发一句："我现在有点乱，晚点认真回你。"',
      '检查一下：这条消息是在沟通，还是在发泄？'
    ];
  }

  return [];
}

export { EXPRESSION_CONFIG, buildExpressionOptions, buildActionTips };
