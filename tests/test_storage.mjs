import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';

// Load these dependency-free browser ES modules without changing the app's
// packaging or relying on Node's automatic .js module-type detection.
async function browserModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const { createDefaultState, exportData, importData, loadState, saveState,
  previewArchiveCleanup, cleanDuplicateArchives, undoArchiveCleanup, canUndoArchiveCleanup } = await browserModule('../js/storage.js');
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


const stateKey = 'localGuideGameState';

function seedDuplicateArchive() {
  const timestamp = '2026-10-02T12:00:00Z';
  const record = JSON.parse('{"timestamp":"' + timestamp +
    '","note":"sample","nested":{"__proto__":{"a":1},"ordered":["a","b"]},"_extra":"keep"}');
  const reordered = JSON.parse('{"_extra":"keep","nested":{"ordered":["a","b"],"__proto__":{"a":1}},' +
    '"note":"sample","timestamp":"' + timestamp + '"}');
  const differentTimestamp = { ...record, timestamp: '2026-10-02T12:00:01Z' };
  const differentId = { ...record, id: 'separate-entry' };
  const differentNested = { ...record, nested: { ...record.nested, ordered: ['b', 'a'] } };
  const differentExtra = { ...record, _extra: 'different' };
  const state = { ...freshState(), statusRecords: [record, reordered, differentTimestamp,
    differentId, differentNested, differentExtra], extensionData: { custom: true } };
  const original = JSON.stringify(state);
  localStorage.setItem(stateKey, original);
  return { state, original, unique: [record, differentTimestamp, differentId, differentNested, differentExtra] };
}

test('export removes only structurally identical rows before normalization, without writing to storage', () => {
  const { state, original, unique } = seedDuplicateArchive();
  assert.equal(loadState().statusRecords.length, 6);
  assert.equal(previewArchiveCleanup().removed, 1);
  assert.deepEqual(JSON.parse(exportData()), { ...state, statusRecords: unique });
  assert.equal(localStorage.getItem(stateKey), original);
  assert.equal(canUndoArchiveCleanup(), false);
});

test('cleanup keeps first rows in every known archive category and undo restores the exact raw state', () => {
  const original = JSON.stringify({ ...freshState(), extensionData: { repeated: [1, 1] },
    ...Object.fromEntries(['empathyRecords', 'statusRecords', 'habits', 'habitLogs',
      'priorityRecords', 'ratingRecords', 'momentumRecords'].map(key =>
      [key, [{ id: 'same', timestamp: '2026-10-02', key }, { key, id: 'same', timestamp: '2026-10-02' }]])) });
  localStorage.setItem(stateKey, original);
  assert.equal(previewArchiveCleanup().removed, 7);
  assert.deepEqual(cleanDuplicateArchives(original), { removed: 7 });
  assert.deepEqual(JSON.parse(localStorage.getItem(stateKey)).extensionData, { repeated: [1, 1] });
  assert.equal(previewArchiveCleanup().removed, 0);
  assert.deepEqual(cleanDuplicateArchives(previewArchiveCleanup().original), { removed: 0 });
  assert.equal(canUndoArchiveCleanup(), true);
  assert.deepEqual(undoArchiveCleanup(), { restored: true });
  assert.equal(localStorage.getItem(stateKey), original);
  assert.equal(canUndoArchiveCleanup(), false);
});

test('stale confirmation and stale undo cannot overwrite a later archive', () => {
  const { original } = seedDuplicateArchive();
  localStorage.setItem(stateKey, original + ' ');
  assert.deepEqual(cleanDuplicateArchives(original), { error: 'changed' });
  assert.equal(localStorage.getItem(stateKey), original + ' ');
  assert.deepEqual(cleanDuplicateArchives(original + ' '), { removed: 1 });
  const later = { ...JSON.parse(localStorage.getItem(stateKey)), extensionData: { edited: true } };
  localStorage.setItem(stateKey, JSON.stringify(later));
  assert.equal(canUndoArchiveCleanup(), false);
  assert.deepEqual(undoArchiveCleanup(), { error: 'changed' });
  assert.deepEqual(JSON.parse(localStorage.getItem(stateKey)), later);
});

test('a failed undo snapshot write cannot remove any originals', () => {
  const { original } = seedDuplicateArchive();
  const setItem = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (key === 'localGuideGameDedupUndo') throw new Error('quota exceeded');
    setItem(key, value);
  };
  assert.deepEqual(cleanDuplicateArchives(original), { error: 'unavailable' });
  assert.equal(localStorage.getItem(stateKey), original);
});

test('empty archive export and cleanup do not create records', () => {
  assert.equal(previewArchiveCleanup().removed, 0);
  assert.deepEqual(JSON.parse(exportData()).statusRecords, []);
  assert.equal(localStorage.getItem(stateKey), null);
});

test('two different days for the same habit and identical content remain distinct', () => {
  const first = { id: 's1', habitId: 'h-test', timestamp: '2026-10-02T12:00:00Z', status: 'done' };
  const second = { ...first, id: 's2', timestamp: '2026-10-03T12:00:00Z' };
  const original = JSON.stringify({ ...freshState(), habitLogs: [first, first, second] });
  localStorage.setItem(stateKey, original);
  assert.equal(previewArchiveCleanup().removed, 1);
  assert.deepEqual(JSON.parse(exportData()).habitLogs, [first, second]);
  assert.equal(cleanDuplicateArchives(original).removed, 1);
  assert.deepEqual(JSON.parse(localStorage.getItem(stateKey)).habitLogs, [first, second]);
  assert.ok(undoArchiveCleanup().restored);
  assert.equal(localStorage.getItem(stateKey), original);
});
