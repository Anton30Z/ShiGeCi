import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  PenTool,
  Play,
  Snail,
  Sparkles,
  Volume2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getContextualExample } from '../data/starterHsk1';
import type { TranslationDict } from '../i18n/translations';
import {
  getOrCreateCard,
  previewAllGrades,
  type Grade,
  type StudyQueueItem,
} from '../services/fsrsEngine';
import type { AppSettings, VocabWord, WordProgress } from '../types/vocab';
import { TONE_LEGEND } from '../utils/tones';
import { HanziCanvas } from './HanziCanvas';
import { ToneHanzi } from './ToneHanzi';

interface StudySessionProps {
  queue: StudyQueueItem[];
  progressMap: Record<string, WordProgress>;
  settings: AppSettings;
  t: TranslationDict;
  onToggleToneColors: () => void;
  onTogglePinyin: () => void;
  onSpeak: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
  onRateCard: (wordId: string, grade: Grade, isNew: boolean) => void;
  onStartQuiz: (words: VocabWord[]) => void;
  onExitSession: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  queue,
  progressMap,
  settings,
  t,
  onToggleToneColors,
  onTogglePinyin,
  onSpeak,
  onSpeakEnglish,
  onRateCard,
  onStartQuiz,
  onExitSession,
}) => {
  const sessionKey = useMemo(
    () => `shigeci_session_pos_${queue.map((q) => q.word.id).slice(0, 3).join('_')}_${queue.length}`,
    [queue]
  );

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { idx?: number };
        if (typeof parsed.idx === 'number' && parsed.idx >= 0) return parsed.idx;
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [activeCardTab, setActiveCardTab] = useState<'card' | 'strokes'>('card');
  const [showForwardFsrs, setShowForwardFsrs] = useState(false);
  const [ratedIds, setRatedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { rated?: string[] };
        if (Array.isArray(parsed.rated)) return parsed.rated;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({ idx: currentIndex, rated: ratedIds })
      );
    } catch {
      // ignore
    }
  }, [sessionKey, currentIndex, ratedIds]);

  const currentItem = queue[currentIndex];
  const isFinished = !currentItem;
  const isCurrentRated = currentItem ? ratedIds.includes(currentItem.word.id) : false;

  useEffect(() => {
    setActiveCardTab('card');
    setShowForwardFsrs(false);
  }, [currentIndex, currentItem?.word.id]);

  const handlePrev = useCallback(() => {
    if (showForwardFsrs) {
      setShowForwardFsrs(false);
      return;
    }
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [showForwardFsrs]);

  const advanceNext = useCallback(() => {
    setShowForwardFsrs(false);
    setCurrentIndex((i) => Math.min(queue.length, i + 1));
  }, [queue.length]);

  const handleForwardClick = useCallback(() => {
    if (!currentItem) return;
    if (isCurrentRated || showForwardFsrs) {
      advanceNext();
    } else {
      setShowForwardFsrs(true);
    }
  }, [currentItem, isCurrentRated, showForwardFsrs, advanceNext]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleForwardClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFinished, handlePrev, handleForwardClick]);

  const gradePreviews = useMemo(() => {
    if (!currentItem) return [];
    const card = getOrCreateCard(progressMap, currentItem.word.id);
    return previewAllGrades(card, new Date());
  }, [currentItem, progressMap]);

  const handleGrade = (grade: Grade) => {
    if (!currentItem) return;
    const isAlreadyRated = ratedIds.includes(currentItem.word.id);
    onRateCard(currentItem.word.id, grade, currentItem.isNew && !isAlreadyRated);
    if (!isAlreadyRated) {
      setRatedIds((prev) => [...prev, currentItem.word.id]);
    }
    setShowForwardFsrs(false);
    setCurrentIndex((i) => i + 1);
  };

  if (isFinished) {
    const packWords = queue.map((q) => q.word);
    return (
      <div className="glass-surface mx-auto max-w-xl rounded-3xl p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.session.completeTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t.session.completeSummary(packWords.length)}
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => onStartQuiz(packWords)}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            {t.session.startPackQuiz}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentIndex(0)}
              className="glass-subtle inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.session.reviewAgain}
            </button>
            <button
              type="button"
              onClick={onExitSession}
              className="glass-subtle inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75 transition-colors"
            >
              {t.session.returnDashboard}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { word, isNew } = currentItem;
  const englishMeanings = word.meanings;
  const russianMeanings = word.meaningsRu ?? [];
  const example = getContextualExample(word, 'en');
  const progressPct = Math.round(((currentIndex + 1) / Math.max(1, queue.length)) * 100);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === queue.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Clean Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExitSession}
          className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.session.exit}
        </button>

        <div className="flex-1 max-w-[200px] sm:max-w-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono-num">
            <span>{t.session.cardCounter(currentIndex + 1, queue.length)}</span>
            <span className="truncate ml-2">
              {isCurrentRated
                ? t.session.ratedBadge
                : isNew
                  ? t.session.newWordBadge
                  : t.session.reviewBadge}
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
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              settings.showPinyin
                ? 'bg-sky-600/15 text-sky-800 border border-sky-500/30 dark:text-sky-300'
                : 'glass-subtle text-slate-600 dark:text-slate-300'
            }`}
            title={t.session.pinyinToggle}
          >
            {settings.showPinyin ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{t.session.pinyinToggle}</span>
          </button>

          <button
            type="button"
            onClick={onToggleToneColors}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              settings.toneColorsEnabled
                ? 'bg-teal-600/15 text-teal-800 border border-teal-500/30 dark:text-teal-300'
                : 'glass-subtle text-slate-600 dark:text-slate-300'
            }`}
            title={t.session.tones}
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.session.tones}</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard (Spacious & Uncluttered) */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {word.level === 0 ? t.common.customWord : t.common.hskLevel(word.level)} ·{' '}
            {t.common.radical} {word.radical}
          </span>

          <div className="glass-subtle inline-flex rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveCardTab('card')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeCardTab === 'card'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {t.session.flashcardTab}
            </button>
            <button
              type="button"
              onClick={() => setActiveCardTab('strokes')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeCardTab === 'strokes'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              {t.session.strokesTab}
            </button>
          </div>
        </div>

        {activeCardTab === 'strokes' ? (
          <div className="py-2">
            <HanziCanvas
              word={word.simplified}
              isDark={settings.theme === 'dark'}
              t={t.canvas}
              onSpeak={onSpeak}
              size={250}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Hanzi + Mandarin Audio */}
            <div className="flex flex-col items-center text-center pt-2 space-y-4">
              <div className="select-text text-6xl sm:text-7xl font-bold tracking-wide leading-tight">
                <ToneHanzi
                  simplified={word.simplified}
                  numericPinyin={word.numericPinyin}
                  pinyin={word.pinyin}
                  toneColorsEnabled={settings.toneColorsEnabled}
                />
              </div>

              {settings.showPinyin ? (
                <p className="text-2xl font-semibold text-teal-700 dark:text-teal-300 tracking-wide">
                  {word.pinyin}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onTogglePinyin}
                  className="text-xs font-medium text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  {t.session.pinyinHidden}
                </button>
              )}

              {settings.toneColorsEnabled && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium opacity-85">
                  {TONE_LEGEND.map((item) => (
                    <span key={item.tone} className={item.colorClass}>
                      {item.mark} {t.session.toneLabels[item.tone]}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onSpeak(word.simplified, 1.0)}
                  className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-100 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
                >
                  <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {t.session.playNormal}
                </button>
                <button
                  type="button"
                  onClick={() => onSpeak(word.simplified, 0.7)}
                  className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-100 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
                >
                  <Snail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  {t.session.playSlow}
                </button>
              </div>
            </div>

            {/* Bilingual Translation Block */}
            <div className="space-y-3 border-t border-slate-900/10 pt-5 dark:border-white/10 text-center">
              {russianMeanings.length > 0 && (
                <p className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {russianMeanings.join(' · ')}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300">
                  {englishMeanings.join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onSpeakEnglish(
                      englishMeanings.slice(0, 2).join(', '),
                      settings.defaultSpeechRate
                    )
                  }
                  className="glass-subtle inline-flex min-h-[34px] items-center gap-1 rounded-xl px-2.5 text-xs font-bold text-sky-700 hover:bg-white dark:text-sky-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  title={t.session.listenEnglish}
                  aria-label={`${t.session.listenEnglish}: ${englishMeanings.slice(0, 2).join(', ')}`}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  EN
                </button>
              </div>
            </div>

            {/* Example Sentence */}
            <div className="glass-subtle rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="font-hanzi text-base font-medium text-slate-900 dark:text-white">
                  {example.zh}
                </p>
                {settings.showPinyin && (
                  <p className="text-xs text-teal-700 dark:text-teal-300">{example.pinyin}</p>
                )}
                {example.ru && (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                    {example.ru}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {example.en}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSpeak(example.zh, settings.defaultSpeechRate)}
                  className="glass-surface inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800"
                  title={t.session.listenExample}
                  aria-label={t.session.listenExample}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSpeakEnglish(example.en, settings.defaultSpeechRate)}
                  className="glass-surface inline-flex min-h-[44px] px-2.5 items-center justify-center rounded-xl text-xs font-bold text-sky-700 hover:bg-white dark:text-sky-300 dark:hover:bg-slate-800"
                  title={t.session.listenEnglish}
                  aria-label={`${t.session.listenEnglish}: ${example.en}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Bottom Navigation: Back / Forward -> FSRS reveals when going Forward */}
      {!showForwardFsrs ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="glass-surface inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-slate-700 hover:bg-white/85 disabled:opacity-40 disabled:pointer-events-none dark:text-slate-200 dark:hover:bg-slate-800/75 whitespace-nowrap"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.session.prevWord}
            </button>

            <button
              type="button"
              onClick={handleForwardClick}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              {isLast ? t.session.finishPack : t.session.nextWord}
              {isLast ? <Play className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {isCurrentRated && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForwardFsrs(true)}
                className="text-xs font-medium text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300 py-1 transition-colors"
              >
                {t.session.reRateWord}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-surface rounded-3xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t.session.fsrsQuestion}
            </p>
            <button
              type="button"
              onClick={() => setShowForwardFsrs(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t.session.backToCard}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {gradePreviews.map((g) => {
              const colorMap: Record<string, string> = {
                Again:
                  'bg-rose-500/12 text-rose-700 border-rose-500/25 hover:bg-rose-500/20 dark:text-rose-300',
                Hard:
                  'bg-amber-500/12 text-amber-800 border-amber-500/25 hover:bg-amber-500/20 dark:text-amber-300',
                Good:
                  'bg-teal-500/14 text-teal-800 border-teal-500/30 hover:bg-teal-500/22 dark:text-teal-300',
                Easy:
                  'bg-sky-500/14 text-sky-800 border-sky-500/30 hover:bg-sky-500/22 dark:text-sky-300',
              };
              return (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => handleGrade(g.grade)}
                  className={`flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-3 py-2.5 transition-all active:scale-[0.97] ${colorMap[g.label]}`}
                >
                  <span className="text-sm font-bold">{t.session.grades[g.label]}</span>
                  <span className="text-[11px] opacity-85 mt-0.5">
                    {t.session.gradeDescs[g.label]}
                  </span>
                  <span className="font-mono-num text-[11px] font-bold mt-1">
                    {g.intervalText}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={advanceNext}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white py-1 transition-colors"
            >
              {t.session.skipRating}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
