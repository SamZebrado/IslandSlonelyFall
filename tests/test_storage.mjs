import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';

// Load these dependency-free browser ES modules without changing the app's
// packaging or relying on Node's automatic .js module-type detection.
async function browserModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const { createDefaultState, exportData, importData, loadState, saveState } = await browserModule('../js/storage.js');
const { completeHabit, skipHabit } = await browserModule('../js/habits.js');
const { derivePriorityDecision } = await browserModule('../js/priority.js');

beforeEach(() => {
  const items = new Map();
  globalThis.localStorage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: key => items.delete(key)
  };
  globalThis.window = { dispatchEvent() {} };
  globalThis.StorageEvent = class {
    constructor(type, options) { Object.assign(this, { type }, options); }
  };
});

function freshState() {
  const state = createDefaultState();
  for (const key of ['empathyRecords', 'statusRecords', 'habits', 'habitLogs', 'priorityRecords', 'ratingRecords']) {
    state[key] = [];
  }
  return state;
}

test('habit producer completion and skip survive save, reload and export/import', () => {
  const state = freshState();
  completeHabit('water', state.habitLogs);
  skipHabit('breath', state.habitLogs);
  assert.equal(saveState(state), true);
  const expected = [['water', 'completed'], ['breath', 'skipped']];
  const outcomes = state => state.habitLogs.map(log => [log.habitId, log.status]);
  assert.deepEqual(outcomes(loadState()), expected);
  const imported = importData(exportData());
  assert.equal(imported.success, true);
  assert.deepEqual(outcomes(imported.data), expected);
  assert.deepEqual(outcomes(loadState()), expected);
});

test('priority category produced by the gate model survives save and export/import', () => {
  const state = freshState();
  const path = [{ gateId: 'focus', answer: 'open document', nextStep: 'open document', timeBlock: '2分钟' }];
  const result = derivePriorityDecision(path);
  state.priorityRecords.push({ id: 'priority-1', timestamp: '2026-10-02T12:00:00Z',
    task: 'write report', result, gatePath: path, decision: result.category });
  assert.equal(saveState(state), true);
  assert.equal(loadState().priorityRecords[0].decision, 'TODAY');
  assert.equal(importData(exportData()).success, true);
  assert.deepEqual(loadState().priorityRecords[0], state.priorityRecords[0]);
});

test('legacy habit and priority records remain readable', () => {
  const state = freshState();
  state.habitLogs = ['done', 'skip', 'partial'].map((status, i) => ({
    id: 'legacy-' + i, timestamp: '2026-10-02T12:00:00Z', habitId: 'water', status }));
  state.priorityRecords = [{ id: 'legacy-priority', timestamp: '2026-10-02T12:00:00Z', decision: { category: 'TODAY' } }];
  localStorage.setItem('localGuideGameState', JSON.stringify(state));
  assert.deepEqual(loadState().habitLogs.map(log => log.status), ['done', 'skip', 'partial']);
  assert.deepEqual(loadState().priorityRecords[0].decision, { category: 'TODAY' });
});

test('invalid imports preserve a saved user record', () => {
  const state = freshState();
  state.empathyRecords = [{ id: 'empathy-1', timestamp: '2026-10-02T12:00:00Z', situation: 'keep this record' }];
  saveState(state);
  const before = loadState();
  for (const content of ['', 'not JSON', '[]', 'null']) {
    assert.equal(importData(content).success, false);
    assert.deepEqual(loadState(), before);
    assert.equal(localStorage.getItem('localGuideGameTempBackup'), null);
  }
});
