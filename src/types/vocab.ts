import type { Card } from 'ts-fsrs';

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type LanguageCode = 'ru' | 'en';

export type TopicId =
  | 'basics'
  | 'people'
  | 'time'
  | 'food'
  | 'home'
  | 'places'
  | 'travel'
  | 'work'
  | 'health'
  | 'communication'
  | 'descriptions'
  | 'actions'
  | 'custom';

export interface ExampleSentence {
  zh: string;
  pinyin: string;
  en: string;
  ru?: string;
}

export interface StudyMaterial {
  layout?: 'horizontal' | 'vertical';
  parts: Array<[symbol: string, ru: string, en: string]>;
  neighbors: Array<[word: string, pinyin: string, ru: string, en: string]>;
  relation: 'character' | 'radical' | 'topic';
}

export interface VocabWord {
  study?: StudyMaterial;
  id: string;
  simplified: string;
  pinyin: string;
  numericPinyin: string;
  plainPinyin: string;
  radical: string;
  meanings: string[];
  meaningsRu?: string[];
  level: HskLevel | 0; // 0 = custom user word
  topic?: TopicId;
  example?: ExampleSentence;
  isCustom?: boolean;
}

export interface WordProgress {
  wordId: string;
  card: Card;
  lastRatedAt: string;
}

export type WordStatusFilter = 'all' | 'new' | 'learning' | 'mastered';

export type NavTab = 'today' | 'topics' | 'vocabulary' | 'writing' | 'settings';

export type VoiceConnectionMode = 'auto' | 'local' | 'network';
export type VoiceGenderPreference = 'any' | 'female' | 'male';

export interface QuizResultItem {
  word: VocabWord;
  hadMistake: boolean;
  attempts: number;
  usedHint: boolean;
}

export interface AppSettings {
  language: LanguageCode;
  dailyNewLimit: number; // 3, 5, 7, 10, 15, or 20
  activeHskLevels: HskLevel[];
  toneColorsEnabled: boolean;
  showPinyin: boolean;
  autoPlayAudio: boolean;
  theme: 'light' | 'dark';
  defaultSpeechRate: number; // 0.7 or 1.0
  voiceMode: VoiceConnectionMode;
  voiceGender: VoiceGenderPreference;
  preferredVoiceURI: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD local
  newWordsToday: number;
  reviewsToday: number;
  streak: number;
  lastStudyDate: string | null;
}

export interface BackupPayload {
  app: 'Shi Ge Ci' | 'HanziFlow 10';
  version: number;
  exportedAt: string;
  settings: AppSettings;
  dailyStats: DailyStats;
  progress: Record<string, WordProgress>;
  customWords: VocabWord[];
}
