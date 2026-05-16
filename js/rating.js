export const RATING_CATEGORIES = {
  health: {
    id: 'health',
    name: { zh: '健康', en: 'Health' },
    nameShort: { zh: '健康', en: 'H' },
    icon: '💪',
    subItems: [
      { id: 'physical', name: { zh: '身体健康', en: 'Physical Health' } },
      { id: 'mental', name: { zh: '精神/情绪/心灵', en: 'Mental/Emotional' } },
      { id: 'psychology', name: { zh: '心理/心态', en: 'Psychological' } }
    ]
  },
  work: {
    id: 'work',
    name: { zh: '工作', en: 'Work' },
    nameShort: { zh: '工作', en: 'W' },
    icon: '💼',
    subItems: [
      { id: 'main', name: { zh: '本职工作', en: 'Main Job' } },
      { id: 'side', name: { zh: '兼职工作', en: 'Side Job' } },
      { id: 'volunteer', name: { zh: '业余志愿工作', en: 'Volunteer Work' } }
    ]
  },
  play: {
    id: 'play',
    name: { zh: '娱乐', en: 'Play' },
    nameShort: { zh: '娱乐', en: 'P' },
    icon: '🎮',
    subItems: [
      { id: 'leisure', name: { zh: '娱乐', en: 'Leisure' } }
    ]
  },
  love: {
    id: 'love',
    name: { zh: '爱', en: 'Love' },
    nameShort: { zh: '爱', en: 'L' },
    icon: '❤️',
    subItems: [
      { id: 'receive', name: { zh: '接受爱', en: 'Receive Love' } },
      { id: 'give', name: { zh: '给予爱', en: 'Give Love' } },
      { id: 'feel', name: { zh: '感受爱', en: 'Feel Love' } }
    ]
  }
};

export const SCORE_LABELS = {
  1: { zh: '很低', en: 'Very Low' },
  2: { zh: '低', en: 'Low' },
  3: { zh: '偏低', en: 'Somewhat Low' },
  4: { zh: '中低', en: 'Below Average' },
  5: { zh: '中等', en: 'Average' },
  6: { zh: '中高', en: 'Above Average' },
  7: { zh: '偏高', en: 'Good' },
  8: { zh: '高', en: 'High' },
  9: { zh: '很高', en: 'Very High' }
};

export function createRatingRecord(ratings) {
  const now = new Date();
  const record = {
    id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('zh-CN'),
    categories: {}
  };
  
  Object.keys(RATING_CATEGORIES).forEach(catId => {
    const cat = RATING_CATEGORIES[catId];
    const categoryRatings = {};
    let sum = 0;
    let count = 0;
    
    cat.subItems.forEach(subItem => {
      const score = ratings[catId]?.[subItem.id] || 5;
      categoryRatings[subItem.id] = score;
      sum += score;
      count++;
    });
    
    record.categories[catId] = {
      scores: categoryRatings,
      average: count > 0 ? (sum / count).toFixed(1) : 5
    };
  });
  
  return record;
}

export function calculateCategoryAverage(record, categoryId) {
  const category = record.categories[categoryId];
  if (!category) return 5;
  return parseFloat(category.average) || 5;
}

export function getOverallAverage(record) {
  const cats = Object.keys(record.categories);
  if (cats.length === 0) return 5;
  
  let sum = 0;
  cats.forEach(catId => {
    sum += calculateCategoryAverage(record, catId);
  });
  
  return (sum / cats.length).toFixed(1);
}

export function getRecentRatings(state, limit = 7) {
  const records = state.ratingRecords || [];
  return records.slice(-limit).reverse();
}

export function formatRatingDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}
