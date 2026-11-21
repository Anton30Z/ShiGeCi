import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Grades,
  Rating,
  State,
  type Card,
  type Grade,
  type RecordLogItem,
} from 'ts-fsrs';
import type { VocabWord, WordProgress } from '../types/vocab';

const fsrsParams = generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
  maximum_interval: 36500,
});

const scheduler = fsrs(fsrsParams);

export { Rating, State, Grades };
export type { Card, Grade, RecordLogItem };

export interface GradePreview {
  grade: Grade;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  intervalText: string;
  result: RecordLogItem;
}

export function getOrCreateCard(progressMap: Record<string, WordProgress>, wordId: string): Card {
  const existing = progressMap[wordId];
  if (existing && existing.card) {
    return existing.card;
  }
  return createEmptyCard(new Date());
}

export function formatInterval(due: Date, now: Date): string {
  const diffMs = Math.max(0, due.getTime() - now.getTime());
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return '< 1m';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;
  const diffYears = (diffDays / 365).toFixed(1).replace(/\.0$/, '');
  return `${diffYears}y`;
}

const GRADE_LABELS: Record<Grade, 'Again' | 'Hard' | 'Good' | 'Easy'> = {
  [Rating.Again]: 'Again',
  [Rating.Hard]: 'Hard',
  [Rating.Good]: 'Good',
  [Rating.Easy]: 'Easy',
};

export function previewAllGrades(card: Card, now: Date = new Date()): GradePreview[] {
  const scheduling = scheduler.repeat(card, now);
  return Grades.map((grade) => {
    const item = scheduling[grade];
    return {
      grade,
      label: GRADE_LABELS[grade],
      intervalText: formatInterval(item.card.due, now),
      result: item,
    };
  });
}

export function applyGrade(card: Card, grade: Grade, now: Date = new Date()): RecordLogItem {
  return scheduler.next(card, now, grade);
}

export function getWordLearningStatus(progress: WordProgress | undefined): 'new' | 'learning' | 'mastered' {
  if (!progress) return 'new';
  const { card } = progress;
  if (card.state === State.New && card.reps === 0) return 'new';
  if (card.state === State.Review && card.scheduled_days >= 7) {
    return 'mastered';
  }
  return 'learning';
}

export function isCardDue(progress: WordProgress | undefined, now: Date = new Date()): boolean {
  if (!progress) return false;
  if (progress.card.state === State.New && progress.card.reps === 0) return false;
  return progress.card.due.getTime() <= now.getTime();
}

export interface StudyQueueItem {
  word: VocabWord;
  isNew: boolean;
}

export interface GradeMeaningInfo {
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  ruTitle: string;
  ruDesc: string;
  enTitle: string;
  enDesc: string;
}

export const GRADE_MEANINGS: Record<'Again' | 'Hard' | 'Good' | 'Easy', GradeMeaningInfo> = {
  Again: {
    label: 'Again',
    ruTitle: 'Снова',
    ruDesc: 'Не помню · сразу',
    enTitle: 'Again',
    enDesc: 'Forgot · repeat now',
  },
  Hard: {
    label: 'Hard',
    ruTitle: 'Трудно',
    ruDesc: 'С трудом · скоро',
    enTitle: 'Hard',
    enDesc: 'With effort · soon',
  },
  Good: {
    label: 'Good',
    ruTitle: 'Хорошо',
    ruDesc: 'Помню · по плану',
    enTitle: 'Good',
    enDesc: 'Remembered · on schedule',
  },
  Easy: {
    label: 'Easy',
    ruTitle: 'Легко',
    ruDesc: 'Отлично · надолго',
    enTitle: 'Easy',
    enDesc: 'Effortless · long interval',
  },
};

export function gradeFromQuizOutcome(outcome: {
  hadMistake: boolean;
  attempts: number;
  usedHint: boolean;
}): Grade {
  if (outcome.hadMistake || outcome.attempts > 1) {
    return Rating.Again;
  }
  if (outcome.usedHint) {
    return Rating.Hard;
  }
  return Rating.Good;
}

export interface BatchScheduleEntry {
  wordId: string;
  grade: Grade;
  isNew: boolean;
  nextDue: Date;
  intervalText: string;
}

export function scheduleBatchResults(
  progressMap: Record<string, WordProgress>,
  outcomes: Array<{
    wordId: string;
    hadMistake: boolean;
    attempts: number;
    usedHint: boolean;
  }>,
  now: Date = new Date()
): {
  nextProgressMap: Record<string, WordProgress>;
  entries: BatchScheduleEntry[];
  newCount: number;
  reviewCount: number;
} {
  const nextProgressMap: Record<string, WordProgress> = { ...progressMap };
  const entries: BatchScheduleEntry[] = [];
  let newCount = 0;
  let reviewCount = 0;

  for (const outcome of outcomes) {
    const existing = nextProgressMap[outcome.wordId];
    const isNew = !existing || (existing.card.state === State.New && existing.card.reps === 0);
    const currentCard = existing?.card ?? createEmptyCard(now);
    const grade = gradeFromQuizOutcome(outcome);
    const scheduled = applyGrade(currentCard, grade, now);

    nextProgressMap[outcome.wordId] = {
      wordId: outcome.wordId,
      card: scheduled.card,
      lastRatedAt: now.toISOString(),
    };

    if (isNew) newCount++;
    else reviewCount++;

    entries.push({
      wordId: outcome.wordId,
      grade,
      isNew,
      nextDue: scheduled.card.due,
      intervalText: formatInterval(scheduled.card.due, now),
    });
  }

  return { nextProgressMap, entries, newCount, reviewCount };
}

export interface FsrsAnalytics {
  dueNow: number;
  learning: number;
  mastered: number;
  totalTracked: number;
  averageStabilityDays: number;
}

export function getFsrsAnalytics(
  progressMap: Record<string, WordProgress>,
  now: Date = new Date()
): FsrsAnalytics {
  let dueNow = 0;
  let learning = 0;
  let mastered = 0;
  let totalTracked = 0;
  let stabilitySum = 0;

  for (const prog of Object.values(progressMap)) {
    const status = getWordLearningStatus(prog);
    if (status === 'new') continue;
    totalTracked++;
    if (status === 'mastered') mastered++;
    else learning++;
    if (isCardDue(prog, now)) dueNow++;
    stabilitySum += prog.card.stability || 0;
  }

  return {
    dueNow,
    learning,
    mastered,
    totalTracked,
    averageStabilityDays: totalTracked > 0 ? Number((stabilitySum / totalTracked).toFixed(1)) : 0,
  };
}

export function buildDailySessionQueue(
  allActiveWords: VocabWord[],
  customWords: VocabWord[],
  progressMap: Record<string, WordProgress>,
  dailyNewLimit: number,
  newWordsCompletedToday: number,
  includeExtraNew: boolean = false,
  now: Date = new Date()
): StudyQueueItem[] {
  const combinedMap = new Map<string, VocabWord>();
  for (const w of customWords) combinedMap.set(w.id, w);
  for (const w of allActiveWords) combinedMap.set(w.id, w);

  const dueItems: StudyQueueItem[] = [];
  for (const [wordId, prog] of Object.entries(progressMap)) {
    if (isCardDue(prog, now)) {
      const word = combinedMap.get(wordId);
      if (word) {
        dueItems.push({ word, isNew: false });
      }
    }
  }

  // Sort due items oldest-due first
  dueItems.sort((a, b) => {
    const dueA = progressMap[a.word.id]?.card.due.getTime() ?? 0;
    const dueB = progressMap[b.word.id]?.card.due.getTime() ?? 0;
    return dueA - dueB;
  });

  const remainingNewQuota = includeExtraNew
    ? 5
    : Math.max(0, dailyNewLimit - newWordsCompletedToday);

  const newItems: StudyQueueItem[] = [];
  if (remainingNewQuota > 0) {
    const candidates = [...customWords, ...allActiveWords];
    for (const word of candidates) {
      if (newItems.length >= remainingNewQuota) break;
      const prog = progressMap[word.id];
      if (!prog || (prog.card.state === State.New && prog.card.reps === 0)) {
        newItems.push({ word, isNew: true });
      }
    }
  }

  return [...dueItems, ...newItems];
}
