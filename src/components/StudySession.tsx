import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  Play,
  Sparkles,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { TranslationDict } from '../i18n/translations';
import {
  getOrCreateCard,
  previewAllGrades,
  type Grade,
  type StudyQueueItem,
} from '../services/fsrsEngine';
import type { AppSettings, VocabWord, WordProgress } from '../types/vocab';
import { StrokeLayerCardVariant, type FaceIndex } from './cardlab/StrokeLayerCardVariant';
import { CharacterDetailModal } from './cardlab/CharacterDetailModal';

interface StudySessionProps {
  sessionKey: string;
  queue: StudyQueueItem[];
  vocabWords: VocabWord[];
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
  sessionKey,
  queue,
  vocabWords,
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
  const [face, setFace] = useState<FaceIndex>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [rate, setRate] = useState<1 | 0.7>(settings.defaultSpeechRate === 0.7 ? 0.7 : 1);
  const [character, setCharacter] = useState<string | null>(null);
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
    setFace(0);
    setCharacter(null);
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
      if (isFinished || document.querySelector('[aria-modal="true"]')) return;
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
  const progressPct = Math.round(((currentIndex + 1) / Math.max(1, queue.length)) * 100);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === queue.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-y-auto bg-[#f3f7f9] px-3 py-2 dark:bg-[#090d16] [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-xl">
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

      <div className="relative min-h-[430px] flex-1">
        <StrokeLayerCardVariant
          key={word.id}
          word={word}
          activeFace={face}
          turnDirection={direction}
          onTurnFace={(next, dir) => { setDirection(dir); setFace(next); }}
          showPinyin={settings.showPinyin}
          toneColorsEnabled={settings.toneColorsEnabled}
          speechRate={rate}
          onToggleSpeechRate={() => setRate(rate === 1 ? 0.7 : 1)}
          language={settings.language}
          isDark={settings.theme === 'dark'}
          t={t}
          onInspectChar={setCharacter}
          onSpeak={(text, speed) => onSpeak(text, speed ?? rate)}
          onSpeakEnglish={(text, speed) => onSpeakEnglish(text, speed ?? rate)}
        />
      </div>
      <CharacterDetailModal char={character} vocabWords={vocabWords} isDark={settings.theme === 'dark'}
        language={settings.language} t={t} onSpeak={onSpeak} onClose={() => setCharacter(null)} />

      {/* Clean Bottom Navigation: Back / Forward -> FSRS reveals when going Forward */}
      {word.example && !showForwardFsrs && (
        <details key={word.id} className="shrink-0 px-2 py-1 text-sm">
          <summary className="cursor-pointer">{settings.language === 'ru' ? 'Пример в предложении' : 'Example sentence'}</summary>
          <button type="button" className="py-2 text-left font-semibold" onClick={() => onSpeak(word.example!.zh, rate)}>
            {word.example.zh} ♫
          </button>
          {settings.showPinyin && <p>{word.example.pinyin}</p>}
          <p>{settings.language === 'ru' ? word.example.ru ?? word.example.en : word.example.en}</p>
        </details>
      )}
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
