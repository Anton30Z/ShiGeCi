import {
  ArrowRight,
  Blocks,
  BookCheck,
  Box,
  Ear,
  Flame,
  Layers,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { formatHskLevelsLabel, type TranslationDict } from '../i18n/translations';
import type { AppSettings, DailyStats, HskLevel } from '../types/vocab';
import { GamesSection, type ActiveGameId } from './games/GamesSection';

interface DashboardViewProps {
  settings: AppSettings;
  dailyStats: DailyStats;
  dueCount: number;
  masteredCount: number;
  totalLearnedCount: number;
  activeLevelWordCount: number;
  activeLevelSource: 'cache' | 'network' | 'starter-fallback' | 'loading' | 'empty';
  levelLoadError: string | null;
  t: TranslationDict;
  onStartSession: (extraNew?: boolean) => void;
  onStartQuickQuiz: () => void;
  onOpenTonesTrainer: () => void;
  onOpenCardLab: () => void;
  onOpenRadicals: () => void;
  onToggleLevel: (level: HskLevel) => void;
  onRefreshLevels: () => void;
  onOpenVocabulary: () => void;
  onOpenTopics: () => void;
  onStartGame: (gameId: ActiveGameId) => void;
}

const HSK_LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6];

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  dailyStats,
  dueCount,
  masteredCount,
  totalLearnedCount,
  activeLevelWordCount,
  activeLevelSource,
  levelLoadError,
  t,
  onStartSession,
  onStartQuickQuiz,
  onOpenTonesTrainer,
  onOpenCardLab,
  onOpenRadicals,
  onToggleLevel,
  onRefreshLevels,
  onOpenVocabulary,
  onOpenTopics,
  onStartGame,
}) => {
  const levelsText = formatHskLevelsLabel(settings.activeHskLevels, settings.language);

  const newProgress = Math.min(1, dailyStats.newWordsToday / Math.max(1, settings.dailyNewLimit));
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - newProgress);

  const remainingNew = Math.max(0, settings.dailyNewLimit - dailyStats.newWordsToday);
  const totalSessionCount = dueCount + remainingNew;
  const goalComplete = remainingNew === 0 && dueCount === 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="glass-surface rounded-3xl p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center self-start sm:self-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-200/80 dark:text-slate-700/50"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                  {dailyStats.newWordsToday}/{settings.dailyNewLimit}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.newToday}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-teal-700 dark:text-teal-300">
                {t.dashboard.dailyFocus(levelsText, activeLevelWordCount)}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                {goalComplete
                  ? t.dashboard.goalCompleteTitle
                  : t.dashboard.cardsReadyTitle(totalSessionCount)}
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-prose">
                {goalComplete
                  ? t.dashboard.goalCompleteDesc
                  : t.dashboard.cardsReadyDesc(remainingNew, dueCount)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-900/5 dark:border-white/10">
            {!goalComplete ? (
              <button
                type="button"
                onClick={() => onStartSession(false)}
                className="inline-flex min-h-[48px] flex-1 sm:flex-none items-center justify-center gap-2.5 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
              >
                {t.dashboard.startSession}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartSession(true)}
                className="inline-flex min-h-[48px] flex-1 sm:flex-none items-center justify-center gap-2.5 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
              >
                {t.dashboard.studyExtra}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onStartQuickQuiz}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-white/80 dark:text-sky-300 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {t.dashboard.quickQuiz}
            </button>

            <button
              type="button"
              onClick={onOpenTonesTrainer}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-white/80 dark:text-teal-300 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Ear className="h-4 w-4" />
              {t.dashboard.tonesTrainer}
            </button>

            <button
              type="button"
              onClick={onOpenCardLab}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-violet-500/25 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-white/80 dark:border-violet-400/25 dark:text-violet-300 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Box className="h-4 w-4" />
              {t.dashboard.cardLab}
            </button>

            <button
              type="button"
              onClick={onOpenRadicals}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-amber-500/25 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-white/80 dark:border-amber-400/25 dark:text-amber-300 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Blocks className="h-4 w-4" />
              {t.dashboard.radicalsLesson}
            </button>

            <button
              type="button"
              onClick={onOpenTopics}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Layers className="h-4 w-4" />
              {t.nav.topics}
            </button>

            <button
              type="button"
              onClick={onOpenVocabulary}
              className="glass-subtle inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0"
            >
              {t.dashboard.browseVocab}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <div className="glass-surface rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{t.dashboard.cardsDue}</span>
              <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="mt-4">
              <p className="font-mono-num text-3xl font-bold text-slate-900 dark:text-white">
                {dueCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.reviewedToday(dailyStats.reviewsToday)}
              </p>
            </div>
          </div>

          <div className="glass-surface rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{t.dashboard.studyStreak}</span>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <p className="font-mono-num text-3xl font-bold text-slate-900 dark:text-white">
                {dailyStats.streak}{' '}
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                  {t.common.daysUnit}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {dailyStats.lastStudyDate
                  ? t.dashboard.lastStudy(dailyStats.lastStudyDate)
                  : t.dashboard.startStreakHint}
              </p>
            </div>
          </div>

          <div className="glass-surface rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{t.dashboard.masteredWords}</span>
              <BookCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-4">
              <p className="font-mono-num text-3xl font-bold text-slate-900 dark:text-white">
                {masteredCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.masteredRule}
              </p>
            </div>
          </div>

          <div className="glass-surface rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">{t.dashboard.inProgress}</span>
              <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-4">
              <p className="font-mono-num text-3xl font-bold text-slate-900 dark:text-white">
                {totalLearnedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.totalTracked}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="glass-surface rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t.dashboard.curriculumTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeLevelSource === 'empty'
                  ? t.dashboard.noLevelsSelected
                  : activeLevelSource === 'loading'
                    ? t.dashboard.loadingLevel(levelsText)
                    : activeLevelSource === 'cache'
                      ? t.dashboard.cachedLevel(levelsText)
                      : activeLevelSource === 'network'
                        ? t.dashboard.syncedLevel(levelsText)
                        : t.dashboard.starterPackNote(activeLevelWordCount)}
              </p>
            </div>

            <button
              type="button"
              onClick={onRefreshLevels}
              disabled={activeLevelSource === 'loading' || settings.activeHskLevels.length === 0}
              className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${activeLevelSource === 'loading' ? 'animate-spin' : ''}`}
              />
              {t.dashboard.syncButton}
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {HSK_LEVELS.map((lvl) => {
              const isSelected = settings.activeHskLevels.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleLevel(lvl)}
                  className={`min-h-[48px] rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                      : 'glass-subtle text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75'
                  }`}
                >
                  {t.common.hskLevel(lvl)}
                </button>
              );
            })}
          </div>

          {levelLoadError && (
            <p className="rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300">
              {levelLoadError}
            </p>
          )}
        </div>
      </section>

      <GamesSection language={settings.language} onStartGame={onStartGame} />
    </div>
  );
};
