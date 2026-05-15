const STORAGE_KEY = 'localGuideGameState';

const DEFAULT_STATE = {
  version: '0.1.0',
  empathyRecords: [],
  statusRecords: [],
  habits: [],
  habitLogs: [],
  priorityRecords: [],
  meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state) {
  try {
    state.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Failed to save state:', e);
    return false;
  }
}

export function exportData() {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}

export function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.version || !data.meta) {
      throw new Error('Invalid data structure');
    }
    saveState(data);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  return true;
}

export function hasExistingData() {
  const state = loadState();
  return state.empathyRecords.length > 0 || 
         state.statusRecords.length > 0 || 
         state.habits.length > 0 ||
         state.priorityRecords.length > 0;
}
