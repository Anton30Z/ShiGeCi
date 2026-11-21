import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Palette,
  RefreshCw,
  Snail,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import type { TranslationDict } from '../i18n/translations';
import {
  formatInterval,
  gradeFromQuizOutcome,
  type BatchScheduleEntry,
} from '../services/fsrsEngine';
import type { AppSettings, VocabWord, WordProgress } from '../types/vocab';
import { HanziCanvas } from './HanziCanvas';
import { ToneHanzi } from './ToneHanzi';

type ExerciseKind = 'meaning' | 'listening' | 'hanzi' | 'match' | 'write';

interface ChoiceExercise {
  id: string;
  kind: 'meaning' | 'listening' | 'hanzi';
  word: VocabWord;
  options: VocabWord[];
  isMistakeRetry?: boolean;
}

interface MatchExercise {
  id: string;
  kind: 'match';
  pairs: VocabWord[];
}

interface WriteExercise {
  id: string;
  kind: 'write';
  word: VocabWord;
  char: string;
}

type QuizExercise = ChoiceExercise | MatchExercise | WriteExercise;

interface QuizSessionProps {
  words: VocabWord[];
  distractorPool: VocabWord[];
  progressMap: Record<string, WordProgress>;
  settings: AppSettings;
  t: TranslationDict;
  onToggleToneColors: () => void;
  onTogglePinyin: () => void;
  onSpeak: (text: string, rate?: number) => void;
  onApplyQuizResults: (
    outcomes: Array<{
      wordId: string;
      hadMistake: boolean;
      attempts: number;
      usedHint: boolean;
    }>
  ) => BatchScheduleEntry[];
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(target: VocabWord, pool: VocabWord[], count = 3): VocabWord[] {
  const candidates = pool.filter(
    (w) => w.id !== target.id && w.simplified !== target.simplified
  );
  return shuffle(candidates).slice(0, count);
}

function getMeaningLines(word: VocabWord): { primary: string; secondary: string } {
  const ru = word.meaningsRu?.slice(0, 2).join(', ');
  const en = word.meanings.slice(0, 2).join(', ');
  if (ru) {
    return { primary: ru, secondary: en };
  }
  return { primary: en, secondary: '' };
}

function buildExercises(words: VocabWord[], distractorPool: VocabWord[]): QuizExercise[] {
  const fullPool = Array.from(new Map([...words, ...distractorPool].map((w) => [w.id, w])).values());
  const exercises: QuizExercise[] = [];

  words.forEach((word, idx) => {
    const modeCycle: Array<'meaning' | 'listening' | 'hanzi'> = ['meaning', 'listening', 'hanzi'];
    const kind = modeCycle[idx % modeCycle.length];
    const distractors = pickDistractors(word, fullPool, 3);
    const options = shuffle([word, ...distractors]);
    exercises.push({
      id: `${kind}-${word.id}-${idx}`,
      kind,
      word,
      options,
    });
  });

  // Add a Match Pairs round when at least 3 words exist
  if (words.length >= 3) {
    const pairWords = shuffle(words).slice(0, Math.min(4, words.length));
    exercises.push({
      id: `match-${pairWords.map((w) => w.id).join('_')}`,
      kind: 'match',
      pairs: pairWords,
    });
  }

  // Add 1 interactive Stroke Writing task for a single character from the studied pack
  const writeCandidate = words.find((w) => /[\u4e00-\u9fff]/.test(w.simplified));
  if (writeCandidate) {
    const firstHanzi = Array.from(writeCandidate.simplified).find((ch) => /[\u4e00-\u9fff]/.test(ch));
    if (firstHanzi) {
      exercises.push({
        id: `write-${writeCandidate.id}`,
        kind: 'write',
        word: writeCandidate,
        char: firstHanzi,
      });
    }
  }

  return exercises;
}

export const QuizSession: React.FC<QuizSessionProps> = ({
  words,
  distractorPool,
  settings,
  t,
  onToggleToneColors,
  onTogglePinyin,
  onSpeak,
  onApplyQuizResults,
  onExit,
}) => {
  const [exercises, setExercises] = useState<QuizExercise[]>(() =>
    buildExercises(words, distractorPool)
  );
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-word tracking for FSRS auto-grading
  const [wordOutcomeMap, setWordOutcomeMap] = useState<
    Record<string, { hadMistake: boolean; attempts: number; usedHint: boolean }>
  >({});

  // Choice exercise state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [choiceCorrect, setChoiceCorrect] = useState<boolean | null>(null);

  // Match exercise state
  const [leftItems, setLeftItems] = useState<VocabWord[]>([]);
  const [rightItems, setRightItems] = useState<VocabWord[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchErrorPair, setMatchErrorPair] = useState<[string, string] | null>(null);

  // Write exercise state
  const [writeDone, setWriteDone] = useState(false);

  // Summary state
  const [scheduledEntries, setScheduledEntries] = useState<BatchScheduleEntry[] | null>(null);

  const restartQuiz = () => {
    setExercises(buildExercises(words, distractorPool));
    setCurrentIdx(0);
    setWordOutcomeMap({});
    setSelectedOptionId(null);
    setChoiceCorrect(null);
    setScheduledEntries(null);
  };

  const currentExercise = exercises[currentIdx];
  const isFinished = !currentExercise;

  // Reset per-step interaction state & auto-play audio for listening/meaning
  useEffect(() => {
    setSelectedOptionId(null);
    setChoiceCorrect(null);
    setSelectedLeftId(null);
    setSelectedRightId(null);
    setMatchedIds([]);
    setMatchErrorPair(null);
    setWriteDone(false);

    if (!currentExercise) return;

    if (currentExercise.kind === 'match') {
      setLeftItems(shuffle(currentExercise.pairs));
      setRightItems(shuffle(currentExercise.pairs));
    } else if (
      currentExercise.kind === 'listening' ||
      (currentExercise.kind === 'meaning' && settings.autoPlayAudio)
    ) {
      onSpeak(currentExercise.word.simplified, settings.defaultSpeechRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentExercise?.id]);

  // Apply FSRS batch scheduling when quiz finishes
  useEffect(() => {
    if (!isFinished || scheduledEntries !== null || words.length === 0) return;
    const outcomes = words.map((w) => {
      const rec = wordOutcomeMap[w.id];
      return {
        wordId: w.id,
        hadMistake: rec?.hadMistake ?? false,
        attempts: rec?.attempts ?? 1,
        usedHint: rec?.usedHint ?? false,
      };
    });
    const entries = onApplyQuizResults(outcomes);
    setScheduledEntries(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const recordOutcome = (wordId: string, isCorrect: boolean, usedHint = false) => {
    setWordOutcomeMap((prev) => {
      const existing = prev[wordId] ?? { hadMistake: false, attempts: 0, usedHint: false };
      return {
        ...prev,
        [wordId]: {
          hadMistake: existing.hadMistake || !isCorrect,
          attempts: existing.attempts + 1,
          usedHint: existing.usedHint || usedHint,
        },
      };
    });
  };

  const handleSelectChoice = (opt: VocabWord) => {
    if (!currentExercise || currentExercise.kind === 'match' || currentExercise.kind === 'write') return;
    if (choiceCorrect !== null) return;

    const isCorrect = opt.id === currentExercise.word.id;
    setSelectedOptionId(opt.id);
    setChoiceCorrect(isCorrect);
    recordOutcome(currentExercise.word.id, isCorrect);

    if (currentExercise.kind === 'hanzi' || currentExercise.kind === 'listening') {
      onSpeak(currentExercise.word.simplified, settings.defaultSpeechRate);
    }

    // HelloChinese-style mistake loop: queue missed word back once at the end
    if (!isCorrect && !currentExercise.isMistakeRetry) {
      const retryExercise: ChoiceExercise = {
        ...currentExercise,
        id: `retry-${currentExercise.id}-${Date.now()}`,
        options: shuffle(currentExercise.options),
        isMistakeRetry: true,
      };
      setExercises((prev) => [...prev, retryExercise]);
    }
  };

  // Handle Match Pairs selection
  useEffect(() => {
    if (!selectedLeftId || !selectedRightId || !currentExercise || currentExercise.kind !== 'match') {
      return;
    }

    if (selectedLeftId === selectedRightId) {
      const nextMatched = [...matchedIds, selectedLeftId];
      setMatchedIds(nextMatched);
      const matchedWord = currentExercise.pairs.find((w) => w.id === selectedLeftId);
      if (matchedWord) {
        recordOutcome(matchedWord.id, true);
        onSpeak(matchedWord.simplified, settings.defaultSpeechRate);
      }
      setSelectedLeftId(null);
      setSelectedRightId(null);
    } else {
      setMatchErrorPair([selectedLeftId, selectedRightId]);
      recordOutcome(selectedLeftId, false);
      const timer = setTimeout(() => {
        setMatchErrorPair(null);
        setSelectedLeftId(null);
        setSelectedRightId(null);
      }, 450);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftId, selectedRightId]);

  const handleNextExercise = () => {
    setCurrentIdx((i) => i + 1);
  };

  if (isFinished) {
    const totalWords = words.length;
    const cleanCount = words.filter((w) => !wordOutcomeMap[w.id]?.hadMistake).length;
    const pct = totalWords > 0 ? Math.round((cleanCount / totalWords) * 100) : 100;

    return (
      <div className="glass-surface mx-auto max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.quiz.completeTitle}
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t.quiz.completeSummary(cleanCount, totalWords, pct)}
          </p>
        </div>

        <div className="space-y-3 border-t border-slate-900/10 pt-5 dark:border-white/10">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t.quiz.fsrsUpdatedNote}
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {words.map((w) => {
              const rec = wordOutcomeMap[w.id];
              const hadMistake = rec?.hadMistake ?? false;
              const entry = scheduledEntries?.find((e) => e.wordId === w.id);
              const meanings = getMeaningLines(w);
              const grade = gradeFromQuizOutcome({
                hadMistake,
                attempts: rec?.attempts ?? 1,
                usedHint: rec?.usedHint ?? false,
              });
              const intervalLabel = entry
                ? entry.intervalText
                : formatInterval(new Date(Date.now() + 86400000), new Date());

              return (
                <div
                  key={w.id}
                  className="glass-subtle rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-hanzi text-lg font-bold text-slate-900 dark:text-white">
                        {w.simplified}
                      </span>
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {w.pinyin}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {meanings.primary}
                      {meanings.secondary ? ` · ${meanings.secondary}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold ${
                        hadMistake
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {grade === 1 ? t.session.grades.Again : t.session.grades.Good} ·{' '}
                      {t.quiz.scheduledFor(intervalLabel)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={restartQuiz}
            className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75 whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4" />
            {t.quiz.retryQuiz}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            {t.quiz.backHome}
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((currentIdx + 1) / Math.max(1, exercises.length)) * 100);
  const typeLabelMap: Record<ExerciseKind, string> = {
    meaning: t.quiz.typeMeaning,
    listening: t.quiz.typeListening,
    hanzi: t.quiz.typeHanzi,
    match: t.quiz.typeMatch,
    write: t.quiz.typeWrite,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Top Progress Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.quiz.exit}
        </button>

        <div className="flex-1 max-w-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono-num">
            <span>{t.quiz.questionCounter(currentIdx + 1, exercises.length)}</span>
            <span>
              {'isMistakeRetry' in currentExercise && currentExercise.isMistakeRetry
                ? t.quiz.mistakeRoundBadge
                : typeLabelMap[currentExercise.kind]}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onTogglePinyin}
            className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              settings.showPinyin
                ? 'bg-sky-600/15 text-sky-800 border border-sky-500/30 dark:text-sky-300'
                : 'glass-subtle text-slate-600 dark:text-slate-300'
            }`}
            title={t.session.pinyinToggle}
          >
            {settings.showPinyin ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleToneColors}
            className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              settings.toneColorsEnabled
                ? 'bg-teal-600/15 text-teal-800 border border-teal-500/30 dark:text-teal-300'
                : 'glass-subtle text-slate-600 dark:text-slate-300'
            }`}
            title={t.session.tones}
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Exercise Card */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        {currentExercise.kind === 'meaning' && (
          <>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
              {t.quiz.promptMeaning}
            </p>
            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <div className="text-5xl sm:text-6xl font-bold">
                <ToneHanzi
                  simplified={currentExercise.word.simplified}
                  numericPinyin={currentExercise.word.numericPinyin}
                  pinyin={currentExercise.word.pinyin}
                  toneColorsEnabled={settings.toneColorsEnabled}
                />
              </div>
              {settings.showPinyin && (
                <p className="text-lg font-semibold text-teal-700 dark:text-teal-300">
                  {currentExercise.word.pinyin}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSpeak(currentExercise.word.simplified, 1.0)}
                  className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {t.quiz.playNormal}
                </button>
                <button
                  type="button"
                  onClick={() => onSpeak(currentExercise.word.simplified, 0.7)}
                  className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <Snail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  {t.quiz.playSlow}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentExercise.options.map((opt) => {
                const meanings = getMeaningLines(opt);
                const isSelected = selectedOptionId === opt.id;
                const isAnswer = opt.id === currentExercise.word.id;
                let stateClass =
                  'glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75 border-transparent';
                if (choiceCorrect !== null) {
                  if (isAnswer) {
                    stateClass =
                      'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected) {
                    stateClass =
                      'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200';
                  } else {
                    stateClass = 'glass-subtle opacity-55';
                  }
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={choiceCorrect !== null}
                    onClick={() => handleSelectChoice(opt)}
                    className={`min-h-[68px] rounded-2xl border p-4 text-left transition-all ${stateClass}`}
                  >
                    <p className="text-sm sm:text-base font-bold leading-snug">{meanings.primary}</p>
                    {meanings.secondary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {meanings.secondary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {currentExercise.kind === 'listening' && (
          <>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
              {t.quiz.promptListening}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              <button
                type="button"
                onClick={() => onSpeak(currentExercise.word.simplified, 1.0)}
                className="inline-flex min-h-[64px] items-center gap-3 rounded-2xl bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-colors"
              >
                <Volume2 className="h-6 w-6" />
                {t.quiz.playNormal}
              </button>
              <button
                type="button"
                onClick={() => onSpeak(currentExercise.word.simplified, 0.7)}
                className="glass-subtle inline-flex min-h-[64px] items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-100 dark:hover:bg-slate-800/75"
              >
                <Snail className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                {t.quiz.playSlow}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentExercise.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const isAnswer = opt.id === currentExercise.word.id;
                let stateClass =
                  'glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75 border-transparent';
                if (choiceCorrect !== null) {
                  if (isAnswer) {
                    stateClass =
                      'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected) {
                    stateClass =
                      'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200';
                  } else {
                    stateClass = 'glass-subtle opacity-55';
                  }
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={choiceCorrect !== null}
                    onClick={() => handleSelectChoice(opt)}
                    className={`min-h-[82px] rounded-2xl border p-4 text-center flex flex-col items-center justify-center gap-1 transition-all ${stateClass}`}
                  >
                    <span className="font-hanzi text-2xl sm:text-3xl font-bold">
                      {opt.simplified}
                    </span>
                    {settings.showPinyin && (
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {opt.pinyin}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {currentExercise.kind === 'hanzi' && (
          <>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
              {t.quiz.promptHanzi}
            </p>
            <div className="text-center py-3 space-y-1.5">
              {(() => {
                const m = getMeaningLines(currentExercise.word);
                return (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {m.primary}
                    </p>
                    {m.secondary && (
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {m.secondary}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentExercise.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const isAnswer = opt.id === currentExercise.word.id;
                let stateClass =
                  'glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75 border-transparent';
                if (choiceCorrect !== null) {
                  if (isAnswer) {
                    stateClass =
                      'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected) {
                    stateClass =
                      'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200';
                  } else {
                    stateClass = 'glass-subtle opacity-55';
                  }
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={choiceCorrect !== null}
                    onClick={() => handleSelectChoice(opt)}
                    className={`min-h-[82px] rounded-2xl border p-4 text-center flex flex-col items-center justify-center gap-1 transition-all ${stateClass}`}
                  >
                    <span className="font-hanzi text-2xl sm:text-3xl font-bold">
                      {opt.simplified}
                    </span>
                    {choiceCorrect !== null && (
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {opt.pinyin}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {currentExercise.kind === 'match' && (
          <>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
              {t.quiz.promptMatch(matchedIds.length, currentExercise.pairs.length)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2.5">
                {leftItems.map((item) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isSelected = selectedLeftId === item.id;
                  const isError = matchErrorPair?.[0] === item.id;
                  return (
                    <button
                      key={`L-${item.id}`}
                      type="button"
                      disabled={isMatched}
                      onClick={() => setSelectedLeftId(item.id)}
                      className={`w-full min-h-[68px] rounded-2xl border p-3 text-center flex flex-col items-center justify-center transition-all ${
                        isMatched
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 opacity-60'
                          : isError
                            ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200'
                            : isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75 border-transparent'
                      }`}
                    >
                      <span className="font-hanzi text-xl font-bold">{item.simplified}</span>
                      {settings.showPinyin && (
                        <span className="text-[11px] opacity-80">{item.pinyin}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {rightItems.map((item) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isSelected = selectedRightId === item.id;
                  const isError = matchErrorPair?.[1] === item.id;
                  const m = getMeaningLines(item);
                  return (
                    <button
                      key={`R-${item.id}`}
                      type="button"
                      disabled={isMatched}
                      onClick={() => setSelectedRightId(item.id)}
                      className={`w-full min-h-[68px] rounded-2xl border p-3 text-center flex flex-col items-center justify-center transition-all ${
                        isMatched
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 opacity-60'
                          : isError
                            ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200'
                            : isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75 border-transparent'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold leading-snug">{m.primary}</span>
                      {m.secondary && (
                        <span className="text-[11px] opacity-75 line-clamp-1">{m.secondary}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {currentExercise.kind === 'write' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t.quiz.promptWrite}
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {getMeaningLines(currentExercise.word).primary} · {currentExercise.word.pinyin}
              </p>
            </div>

            <HanziCanvas
              word={currentExercise.char}
              isDark={settings.theme === 'dark'}
              t={t.canvas}
              onSpeak={onSpeak}
              size={240}
              onCompleteWord={(mistakes) => {
                setWriteDone(true);
                recordOutcome(currentExercise.word.id, mistakes <= 2, mistakes > 0);
              }}
            />

            {!writeDone && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleNextExercise}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white py-1"
                >
                  {t.quiz.skipWriting}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Immediate Feedback / Continue Banner */}
      {(choiceCorrect !== null ||
        (currentExercise.kind === 'match' &&
          matchedIds.length === currentExercise.pairs.length) ||
        (currentExercise.kind === 'write' && writeDone)) && (
        <div
          className={`rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
            choiceCorrect === false
              ? 'bg-rose-500/12 border-rose-500/30 text-rose-900 dark:text-rose-100'
              : 'bg-emerald-500/12 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {choiceCorrect === false ? (
              <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-bold">
                {choiceCorrect === false ? t.quiz.wrongBanner : t.quiz.correctBanner}
              </p>
              {'word' in currentExercise && (
                <p className="text-xs opacity-90">
                  <span className="font-hanzi font-bold text-sm">
                    {currentExercise.word.simplified}
                  </span>{' '}
                  · {currentExercise.word.pinyin} · {getMeaningLines(currentExercise.word).primary}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextExercise}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white shadow-md transition-colors whitespace-nowrap shrink-0 ${
              choiceCorrect === false
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {t.quiz.continueBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
