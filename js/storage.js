const STORAGE_KEY = 'localGuideGameState';
const BACKUP_KEY = 'localGuideGameBackup';
const SCHEMA_VERSION = 2;
const APP_VERSION = '1.0.0';

const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  appVersion: APP_VERSION,
  empathyRecords: [],
  statusRecords: [],
  habits: [],
  habitLogs: [],
  priorityRecords: [],
  meta: {
    createdAt: null,
    updatedAt: null
  }
};

function createDefaultMeta() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeRecord(record, type) {
  if (!record || typeof record !== 'object') {
    return null;
  }
  
  const normalized = { ...record };
  
  if (!normalized.id) {
    normalized.id = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!normalized.timestamp) {
    normalized.timestamp = new Date().toISOString();
  } else if (typeof normalized.timestamp === 'number') {
    normalized.timestamp = new Date(normalized.timestamp).toISOString();
  }
  
  switch (type) {
    case 'empathy':
      if (normalized.situation !== undefined) {
        normalized.situation = String(normalized.situation);
      }
      if (normalized.feelings !== undefined) {
        normalized.feelings = Array.isArray(normalized.feelings) 
          ? normalized.feelings.map(String) 
          : [String(normalized.feelings)];
      }
      if (normalized.needs !== undefined) {
        normalized.needs = Array.isArray(normalized.needs)
          ? normalized.needs.map(String)
          : [String(normalized.needs)];
      }
      break;
      
    case 'habit':
      if (normalized.action !== undefined) {
        normalized.action = String(normalized.action);
      }
      if (normalized.frequency !== undefined) {
        normalized.frequency = String(normalized.frequency);
      }
      if (normalized.status !== undefined) {
        normalized.status = ['active', 'paused', 'archived'].includes(normalized.status)
          ? normalized.status : 'active';
      }
      break;
      
    case 'habitLog':
      if (normalized.habitId !== undefined) {
        normalized.habitId = String(normalized.habitId);
      }
      if (normalized.status !== undefined) {
        normalized.status = ['done', 'skip', 'partial'].includes(normalized.status)
          ? normalized.status : 'done';
      }
      break;
      
    case 'priority':
      if (normalized.task !== undefined) {
        normalized.task = String(normalized.task);
      }
      if (normalized.gatePath !== undefined && !Array.isArray(normalized.gatePath)) {
        normalized.gatePath = [];
      }
      if (normalized.result !== undefined && typeof normalized.result !== 'object') {
        normalized.result = { category: 'UNKNOWN' };
      }
      if (normalized.decision !== undefined && typeof normalized.decision !== 'object') {
        normalized.decision = {};
      }
      break;
      
    case 'status':
      if (normalized.energy !== undefined) {
        normalized.energy = Math.min(10, Math.max(1, Number(normalized.energy) || 5));
      }
      if (normalized.pressure !== undefined) {
        normalized.pressure = Math.min(10, Math.max(1, Number(normalized.pressure) || 5));
      }
      if (normalized.note !== undefined) {
        normalized.note = String(normalized.note);
      }
      break;
  }
  
  Object.keys(normalized).forEach(key => {
    if (key.startsWith('_') || typeof normalized[key] === 'function') {
      delete normalized[key];
    }
  });
  
  return normalized;
}

function normalizeState(rawState) {
  const state = { ...DEFAULT_STATE };
  
  if (rawState && typeof rawState === 'object') {
    if (rawState.meta && typeof rawState.meta === 'object') {
      state.meta = {
        createdAt: rawState.meta.createdAt || new Date().toISOString(),
        updatedAt: rawState.meta.updatedAt || new Date().toISOString()
      };
    }
    
    if (Array.isArray(rawState.empathyRecords)) {
      state.empathyRecords = rawState.empathyRecords
        .map(r => normalizeRecord(r, 'empathy'))
        .filter(Boolean);
    }
    
    if (Array.isArray(rawState.statusRecords)) {
      state.statusRecords = rawState.statusRecords
        .map(r => normalizeRecord(r, 'status'))
        .filter(Boolean);
    }
    
    if (Array.isArray(rawState.habits)) {
      state.habits = rawState.habits
        .map(r => normalizeRecord(r, 'habit'))
        .filter(Boolean);
    }
    
    if (Array.isArray(rawState.habitLogs)) {
      state.habitLogs = rawState.habitLogs
        .map(r => normalizeRecord(r, 'habitLog'))
        .filter(Boolean);
    }
    
    if (Array.isArray(rawState.priorityRecords)) {
      state.priorityRecords = rawState.priorityRecords
        .map(r => normalizeRecord(r, 'priority'))
        .filter(Boolean);
    }
  }
  
  state.schemaVersion = SCHEMA_VERSION;
  state.appVersion = APP_VERSION;
  
  return state;
}

function createBackup(state) {
  try {
    const backup = {
      ...state,
      meta: {
        ...state.meta,
        backupAt: new Date().toISOString()
      }
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch (e) {
    console.warn('Failed to create backup:', e);
    return false;
  }
}

function loadBackup() {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      return JSON.parse(backup);
    }
  } catch (e) {
    console.warn('Failed to load backup:', e);
  }
  return null;
}

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeState(parsed);
    }
  } catch (e) {
    console.warn('Failed to load state, trying backup:', e);
    const backup = loadBackup();
    if (backup) {
      console.info('Restored from backup');
      saveState(backup);
      return backup;
    }
  }
  return createDefaultState();
}

export function createDefaultState() {
  const state = { ...DEFAULT_STATE };
  state.meta = createDefaultMeta();
  return state;
}

export function saveState(state) {
  try {
    createBackup(state);
    
    state.meta.updatedAt = new Date().toISOString();
    state.schemaVersion = SCHEMA_VERSION;
    state.appVersion = APP_VERSION;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(state)
    }));
    
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

export function exportBackup() {
  return loadBackup();
}

export function importData(jsonStr) {
  try {
    if (!jsonStr || typeof jsonStr !== 'string' || jsonStr.trim() === '') {
      throw new Error('Empty input');
    }
    
    const data = JSON.parse(jsonStr);
    
    if (Array.isArray(data)) {
      throw new Error('Expected object, got array');
    }
    
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid data type');
    }
    
    const normalized = normalizeState(data);
    
    const previousState = loadState();
    
    saveState(normalized);
    
    return { 
      success: true, 
      data: normalized,
      restored: previousState.meta.createdAt !== normalized.meta.createdAt
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  return true;
}

export function hasExistingData() {
  const state = loadState();
  return state.empathyRecords.length > 0 || 
         state.statusRecords.length > 0 || 
         state.habits.length > 0 ||
         state.priorityRecords.length > 0;
}

export function getStorageInfo() {
  const main = localStorage.getItem(STORAGE_KEY);
  const backup = localStorage.getItem(BACKUP_KEY);
  
  return {
    mainSize: main ? main.length : 0,
    backupSize: backup ? backup.length : 0,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    lastUpdated: loadState().meta.updatedAt
  };
}

export function initMultiTabListener(callback) {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue);
        callback(newState);
      } catch (e) {
        console.warn('Failed to parse external state update:', e);
      }
    }
  });
}

export { SCHEMA_VERSION, APP_VERSION };
