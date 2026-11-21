import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyCard } from 'ts-fsrs';
import { createBackupPayload, DEFAULT_DAILY_STATS, DEFAULT_SETTINGS, parseBackupPayload } from '../src/services/storage';

const card = createEmptyCard(new Date('2026-01-10T12:00:00Z'));
const backup = createBackupPayload(DEFAULT_SETTINGS, DEFAULT_DAILY_STATS, {
  one: { wordId: 'one', lastRatedAt: card.due.toISOString(), card },
}, []);
test('version 1 backup reloads FSRS dates', () => {
  const restored = parseBackupPayload(JSON.stringify(backup));
  assert.equal(restored.progress.one.card.due.getTime(), card.due.getTime());
});
test('legacy single-level preference migrates', () => {
  const settings = { ...backup.settings, activeHskLevels: undefined, activeHskLevel: 4 };
  assert.deepEqual(parseBackupPayload(JSON.stringify({ ...backup, app: 'HanziFlow 10', settings })).settings.activeHskLevels, [4]);
});
test('damaged sections abort the entire import', () => {
  for (const change of [
    {progress: []}, {progress: null}, {version: 2}, {settings: {}}, {settings:{...backup.settings,language:[]}},
    {dailyStats:{...DEFAULT_DAILY_STATS,streak:-1}}, {dailyStats:{...DEFAULT_DAILY_STATS,date:'2025-02-30'}},
    {customWords:[{}]}, {progress:{one:{...backup.progress.one,card:{...card,due:'bad'}}}},
    {progress:{one:{...backup.progress.one,card:{...card,reps:-1}}}},
  ]) assert.throws(() => parseBackupPayload(JSON.stringify({...backup, ...change})));
});

