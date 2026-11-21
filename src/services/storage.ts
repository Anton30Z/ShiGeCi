import type { CharacterJson } from 'hanzi-writer';
import { createEmptyCard, type Card } from 'ts-fsrs';
import type {
  AppSettings,
  BackupPayload,
  DailyStats,
  HskLevel,
  VocabWord,
  WordProgress,
} from '../types/vocab';
import { normalizeDailyLimit } from '../utils/topics';

const DB_NAME = 'ShiGeCiDB';
const DB_VERSION = 1;
const STORE_HSK = 'hsk_wordlists';
const STORE_STROKES = 'shigeci_strokes';

const LS_LEARNING = 'shigeci_learning_v1';
const LS_PROGRESS = 'shigeci_progress_v1';
const LS_SETTINGS = 'shigeci_settings_v1';
const LS_DAILY = 'shigeci_daily_v1';
const LS_CUSTOM_WORDS = 'shigeci_custom_words_v1';

const LEGACY_LS_PROGRESS = 'hanziflow_progress_v1';
const LEGACY_LS_SETTINGS = 'hanziflow_settings_v1';
const LEGACY_LS_DAILY = 'hanziflow_daily_v1';
const LEGACY_LS_CUSTOM_WORDS = 'hanziflow_custom_words_v1';

function readWithLegacyMigration(newKey: string, legacyKey: string): string | null {
  const current = localStorage.getItem(newKey);
  if (current !== null) return current;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy !== null) {
    try {
      localStorage.setItem(newKey, legacy);
    } catch {
      // Ignore quota errors during migration
    }
    return legacy;
  }
  return null;
}

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateString(date: Date = new Date()): string {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getLocalDateString(prev);
}

function detectDefaultLanguage(): 'ru' | 'en' {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return 'ru';
}

function normalizeHskLevels(levels: unknown, legacyLevel?: unknown): HskLevel[] {
  if (Array.isArray(levels)) {
    const valid = Array.from(
      new Set(
        levels
          .map((n) => Number(n))
          .filter((n): n is HskLevel => Number.isInteger(n) && n >= 1 && n <= 6)
      )
    ).sort((a, b) => a - b);
    return valid;
  }
  const legacy = Number(legacyLevel);
  if (Number.isInteger(legacy) && legacy >= 1 && legacy <= 6) {
    return [legacy as HskLevel];
  }
  return [1];
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: detectDefaultLanguage(),
  dailyNewLimit: 10,
  activeHskLevels: [1],
  toneColorsEnabled: true,
  showPinyin: true,
  autoPlayAudio: false,
  theme: 'light',
  defaultSpeechRate: 1.0,
  voiceMode: 'auto',
  voiceGender: 'any',
  preferredVoiceURI: '',
};

export const DEFAULT_DAILY_STATS: DailyStats = {
  date: getLocalDateString(),
  newWordsToday: 0,
  reviewsToday: 0,
  streak: 0,
  lastStudyDate: null,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_HSK)) {
        db.createObjectStore(STORE_HSK);
      }
      if (!db.objectStoreNames.contains(STORE_STROKES)) {
        db.createObjectStore(STORE_STROKES);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedHskList(level: HskLevel): Promise<VocabWord[] | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HSK, 'readonly');
      const store = tx.objectStore(STORE_HSK);
      const req = store.get(`hsk-v4-${level}`);
      req.onsuccess = () => resolve((req.result as VocabWord[] | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedHskList(level: HskLevel, words: VocabWord[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_HSK, 'readwrite');
      const store = tx.objectStore(STORE_HSK);
      const req = store.put(words, `hsk-v4-${level}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore storage quota or private mode issues gracefully
  }
}

export async function getCachedStrokeData(char: string): Promise<CharacterJson | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STROKES, 'readonly');
      const store = tx.objectStore(STORE_STROKES);
      const req = store.get(char);
      req.onsuccess = () => resolve((req.result as CharacterJson | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedStrokeData(char: string, data: CharacterJson): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_STROKES, 'readwrite');
      const store = tx.objectStore(STORE_STROKES);
      const req = store.put(data, char);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore storage quota issues gracefully
  }
}

export async function getOfflineCacheStats(): Promise<{ cachedLevels: HskLevel[]; cachedCharsCount: number }> {
  try {
    const db = await openDB();
    const cachedLevels = await new Promise<HskLevel[]>((resolve) => {
      const tx = db.transaction(STORE_HSK, 'readonly');
      const req = tx.objectStore(STORE_HSK).getAllKeys();
      req.onsuccess = () => {
        const keys = (req.result as string[]) || [];
        const levels = keys
          .filter((k) => String(k).startsWith('hsk-v4-'))
          .map((k) => Number(String(k).replace('hsk-v4-', '')))
          .filter((n): n is HskLevel => n >= 1 && n <= 6)
          .sort((a, b) => a - b);
        resolve(levels);
      };
      req.onerror = () => resolve([]);
    });

    const cachedCharsCount = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_STROKES, 'readonly');
      const req = tx.objectStore(STORE_STROKES).count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });

    return { cachedLevels, cachedCharsCount };
  } catch {
    return { cachedLevels: [], cachedCharsCount: 0 };
  }
}

function hydrateCardDates(card: Card): Card {
  const due = new Date(card.due);
  const lastReview = card.last_review ? new Date(card.last_review) : undefined;
  if (Number.isNaN(due.getTime())) {
    return createEmptyCard(new Date());
  }
  return {
    ...card,
    due,
    last_review: lastReview && !Number.isNaN(lastReview.getTime()) ? lastReview : undefined,
  };
}

export function loadProgress(): Record<string, WordProgress> {
  try {
    const combined = localStorage.getItem(LS_LEARNING);
    const raw = combined ? null : readWithLegacyMigration(LS_PROGRESS, LEGACY_LS_PROGRESS);
    if (!raw && !combined) return {};
    const parsed = (combined ? JSON.parse(combined).progress : JSON.parse(raw!)) as Record<string, WordProgress>;
    const hydrated: Record<string, WordProgress> = {};
    for (const [key, item] of Object.entries(parsed)) {
      if (item && item.card) {
        hydrated[key] = {
          ...item,
          card: hydrateCardDates(item.card),
        };
      }
    }
    return hydrated;
  } catch {
    return {};
  }
}

export function saveLearningState(progress: Record<string, WordProgress>, dailyStats: DailyStats): boolean {
  try {
    localStorage.setItem(LS_LEARNING, JSON.stringify({ progress, dailyStats }));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = readWithLegacyMigration(LS_SETTINGS, LEGACY_LS_SETTINGS);
    if (!raw) {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      return { ...DEFAULT_SETTINGS, theme: prefersDark ? 'dark' : 'light' };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { activeHskLevel?: HskLevel };
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      activeHskLevels: normalizeHskLevels(parsed.activeHskLevels, parsed.activeHskLevel),
      dailyNewLimit: normalizeDailyLimit(parsed.dailyNewLimit),
      voiceMode:
        parsed.voiceMode === 'local' || parsed.voiceMode === 'network' ? parsed.voiceMode : 'auto',
      voiceGender:
        parsed.voiceGender === 'female' || parsed.voiceGender === 'male'
          ? parsed.voiceGender
          : 'any',
      preferredVoiceURI: typeof parsed.preferredVoiceURI === 'string' ? parsed.preferredVoiceURI : '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadDailyStats(): DailyStats {
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();
  try {
    const combined = localStorage.getItem(LS_LEARNING);
    const raw = combined ? null : readWithLegacyMigration(LS_DAILY, LEGACY_LS_DAILY);
    if (!raw && !combined) return { ...DEFAULT_DAILY_STATS, date: today };
    const parsed = (combined ? JSON.parse(combined).dailyStats : JSON.parse(raw!)) as DailyStats;
    if (parsed.date === today) {
      return parsed;
    }
    // New day rollover: reset daily counters, preserve streak if studied yesterday or today
    const streakValid = parsed.lastStudyDate === today || parsed.lastStudyDate === yesterday;
    return {
      date: today,
      newWordsToday: 0,
      reviewsToday: 0,
      streak: streakValid ? parsed.streak : 0,
      lastStudyDate: parsed.lastStudyDate ?? null,
    };
  } catch {
    return { ...DEFAULT_DAILY_STATS, date: today };
  }
}


export function loadCustomWords(): VocabWord[] {
  try {
    const raw = readWithLegacyMigration(LS_CUSTOM_WORDS, LEGACY_LS_CUSTOM_WORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VocabWord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomWords(words: VocabWord[]): void {
  try {
    localStorage.setItem(LS_CUSTOM_WORDS, JSON.stringify(words));
  } catch {
    // Ignore
  }
}

export function createBackupPayload(
  settings: AppSettings,
  dailyStats: DailyStats,
  progress: Record<string, WordProgress>,
  customWords: VocabWord[]
): BackupPayload {
  return {
    app: 'Shi Ge Ci',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    dailyStats,
    progress,
    customWords,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === 'string');
}
function timestamp(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
function calendarDay(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && timestamp(value) &&
    new Date(value).toISOString().slice(0, 10) === value;
}
function count(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function validStats(s: unknown) {
  return record(s) && calendarDay(s.date) && (s.lastStudyDate === null || calendarDay(s.lastStudyDate)) &&
    [s.newWordsToday, s.reviewsToday, s.streak].every(count);
}
function validWord(w: unknown) {
  if (!record(w) || w.level !== 0 || !['id','simplified','pinyin','plainPinyin','numericPinyin','radical'].every(k => typeof w[k] === 'string') ||
      !w.id || !w.simplified || !strings(w.meanings) || !w.meanings.length ||
      (w.isCustom !== undefined && typeof w.isCustom !== 'boolean') || w.study !== undefined || (w.meaningsRu !== undefined && !strings(w.meaningsRu))) return false;
  const ex = w.example;
  return ex === undefined || (record(ex) && ['zh','en','pinyin'].every(k => typeof ex[k] === 'string') &&
    (ex.ru === undefined || typeof ex.ru === 'string'));
}
function validPreferences(s: unknown) {
  if (!record(s) || typeof s.language !== 'string' || typeof s.theme !== 'string' || !count(s.dailyNewLimit)) return false;
  const choices: Record<string, unknown[]> = {
    language: ['ru','en'], theme: ['light','dark'], voiceMode: ['auto','local','network'],
    voiceGender: ['any','male','female'], defaultSpeechRate: [0.7,1], dailyNewLimit: [3,5,7,10,15,20],
  };
  return Object.entries(choices).every(([k, values]) => s[k] === undefined || values.includes(s[k])) &&
    ['toneColorsEnabled','showPinyin','autoPlayAudio'].every(k => s[k] === undefined || typeof s[k] === 'boolean') &&
    (s.preferredVoiceURI === undefined || typeof s.preferredVoiceURI === 'string') &&
    (s.activeHskLevels === undefined || Array.isArray(s.activeHskLevels) && s.activeHskLevels.every(n => Number.isInteger(n) && n >= 1 && n <= 6));
}
function validProgress(key: string, item: unknown) {
  if (!key || ['__proto__', 'constructor', 'prototype'].includes(key) || !record(item) || item.wordId !== key || !timestamp(item.lastRatedAt) || !record(item.card)) return false;
  const c = item.card;
  return timestamp(c.due) && (c.last_review == null || timestamp(c.last_review)) &&
    [0,1,2,3].includes(Number(c.state)) && count(c.state) &&
    [c.reps,c.lapses,c.scheduled_days].every(count) && (c.learning_steps === undefined || count(c.learning_steps)) &&
    [c.difficulty,c.stability].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0);
}

export function parseBackupPayload(jsonText: string): BackupPayload {
  const data = JSON.parse(jsonText) as Partial<BackupPayload>;
  const validApps = new Set(['Shi Ge Ci', 'HanziFlow 10']);
  if (!data || !data.app || !validApps.has(data.app) || data.version !== 1 || !timestamp(data.exportedAt) ||
      !record(data.progress) || !Object.entries(data.progress).every(([id, p]) => validProgress(id, p)) ||
      !validStats(data.dailyStats) || !validPreferences(data.settings) || !Array.isArray(data.customWords) ||
      !data.customWords.every(validWord) || new Set(data.customWords.map(w => w.id)).size !== data.customWords.length) {
    throw new Error('Invalid Shi Ge Ci backup file.');
  }

  const hydratedProgress: Record<string, WordProgress> = Object.create(null);
  for (const [key, item] of Object.entries(data.progress)) {
    if (item && item.card) {
      hydratedProgress[key] = {
        ...item,
        card: hydrateCardDates(item.card),
      };
    }
  }

  const rawSettings = (data.settings || {}) as Partial<AppSettings> & { activeHskLevel?: HskLevel };
  return {
    app: 'Shi Ge Ci',
    version: data.version ?? 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    settings: {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      activeHskLevels: normalizeHskLevels(rawSettings.activeHskLevels, rawSettings.activeHskLevel),
      dailyNewLimit: normalizeDailyLimit(rawSettings.dailyNewLimit),
    },
    dailyStats: data.dailyStats ? { ...DEFAULT_DAILY_STATS, ...data.dailyStats } : loadDailyStats(),
    progress: hydratedProgress,
    customWords: Array.isArray(data.customWords) ? data.customWords : [],
  };
}
