import {
  ArrowLeft,
  BookOpen,
  Blocks,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Ear,
  Layers,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { RADICAL_BRICK_WORDS } from '../data/radicalsCurriculum';
import { formatHskLevelsLabel, type TranslationDict } from '../i18n/translations';
import { getWordLearningStatus, isCardDue } from '../services/fsrsEngine';
import type { AppSettings, TopicId, VocabWord, WordProgress } from '../types/vocab';
import { pinyinToPalladius } from '../utils/palladius';
import { buildTopicSummaries, DAILY_LIMIT_OPTIONS } from '../utils/topics';
import { ToneHanzi } from './ToneHanzi';

interface TopicsViewProps {
  words: VocabWord[];
  customWords: VocabWord[];
  progressMap: Record<string, WordProgress>;
  settings: AppSettings;
  t: TranslationDict;
  onChangePackSize: (size: number) => void;
  onStartTopicPack: (packWords: VocabWord[]) => void;
  onTestTopicPack: (packWords: VocabWord[]) => void;
  onOpenTonesTrainer: () => void;
  onSpeakChinese: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
}

const RADICAL_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

export const TopicsView: React.FC<TopicsViewProps> = ({
  words,
  customWords,
  progressMap,
  settings,
  t,
  onChangePackSize,
  onStartTopicPack,
  onTestTopicPack,
  onOpenTonesTrainer,
  onSpeakChinese,
  onSpeakEnglish,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId | null>(null);
  const [expandedPackNum, setExpandedPackNum] = useState<number | null>(null);
  const [radicalCount, setRadicalCount] = useState<number>(10);
  const [showRadicalsList, setShowRadicalsList] = useState(false);

  const radicalStats = useMemo(() => {
    let learned = 0;
    for (const r of RADICAL_BRICK_WORDS) {
      if (getWordLearningStatus(progressMap[r.id]) !== 'new') learned++;
    }
    return { learned, total: RADICAL_BRICK_WORDS.length };
  }, [progressMap]);

  const selectedRadicalsPack = useMemo(() => {
    const now = new Date();
    const due: VocabWord[] = [];
    const fresh: VocabWord[] = [];
    const rest: VocabWord[] = [];

    for (const w of RADICAL_BRICK_WORDS) {
      const prog = progressMap[w.id];
      const status = getWordLearningStatus(prog);
      if (prog && isCardDue(prog, now)) {
        due.push(w);
      } else if (status === 'new') {
        fresh.push(w);
      } else {
        rest.push(w);
      }
    }
    return [...due, ...fresh, ...rest].slice(0, Math.min(radicalCount, RADICAL_BRICK_WORDS.length));
  }, [progressMap, radicalCount]);

  const topicSummaries = useMemo(
    () => buildTopicSummaries(words, customWords, progressMap, settings.dailyNewLimit),
    [words, customWords, progressMap, settings.dailyNewLimit]
  );

  const selectedTopic = useMemo(
    () => topicSummaries.find((item) => item.topic === selectedTopicId) ?? null,
    [topicSummaries, selectedTopicId]
  );

  const totalCombined = words.length + customWords.length;
  const levelsText = formatHskLevelsLabel(settings.activeHskLevels, settings.language);

  return (
    <div className="space-y-6">
      {/* Header & Pack Size Selector (3 / 5 / 7 / 10 / 15 / 20) */}
      <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {selectedTopic ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(null);
                    setExpandedPackNum(null);
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.topics.backToTopics}
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {t.topics.names[selectedTopic.topic].title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.topics.wordsAndPacks(
                    selectedTopic.words.length,
                    selectedTopic.packs.length,
                    settings.dailyNewLimit
                  )}{' '}
                  · {t.topics.learnedProgress(selectedTopic.learnedCount, selectedTopic.words.length)}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {t.topics.title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.topics.subtitle(levelsText, totalCombined, settings.dailyNewLimit)}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {t.topics.packSizeLabel}:
            </span>
            <div className="glass-subtle inline-flex items-center rounded-2xl p-1 overflow-x-auto">
              {DAILY_LIMIT_OPTIONS.map((size) => {
                const active = settings.dailyNewLimit === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChangePackSize(size)}
                    className={`min-h-[38px] min-w-[40px] rounded-xl px-3 text-xs font-mono-num font-bold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {t.topics.packSizeOption(size)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!selectedTopic && (
        <div className="space-y-4">
          {/* Dedicated Radical Bricks Lesson with selectable card count */}
          <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4 border border-sky-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600/15 text-sky-700 dark:text-sky-300">
                  <Blocks className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.topics.radicalsBannerTitle}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
                    {t.topics.radicalsBannerDesc}
                  </p>
                  <p className="text-xs font-mono-num font-medium text-teal-700 dark:text-teal-300">
                    {t.topics.learnedProgress(radicalStats.learned, radicalStats.total)} · 人 · 口 · 心 · 水 · 木 · 艹
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {t.topics.radicalsCountLabel}:
                </span>
                <div className="glass-subtle inline-flex items-center rounded-2xl p-1 overflow-x-auto">
                  {RADICAL_COUNT_OPTIONS.map((cnt) => {
                    const active = radicalCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setRadicalCount(cnt)}
                        className={`min-h-[38px] rounded-xl px-3 text-xs font-mono-num font-bold transition-all whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                      >
                        {cnt === 30 ? t.topics.radicalsAllOption(30) : cnt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onStartTopicPack(selectedRadicalsPack)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="h-3.5 w-3.5" />
                {t.topics.radicalsStudyBtn(selectedRadicalsPack.length)}
              </button>

              <button
                type="button"
                onClick={() => onTestTopicPack(selectedRadicalsPack)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-sky-600/15 border border-sky-500/30 px-4 text-xs font-semibold text-sky-800 hover:bg-sky-600/25 dark:text-sky-300 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t.topics.radicalsTestBtn}
              </button>

              <button
                type="button"
                onClick={() => setShowRadicalsList((v) => !v)}
                className="glass-subtle inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
              >
                {showRadicalsList ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {t.topics.radicalsHideList}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {t.topics.radicalsShowList}
                  </>
                )}
              </button>
            </div>

            {showRadicalsList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-900/10 dark:border-white/10">
                {RADICAL_BRICK_WORDS.map((w) => {
                  const palladius = pinyinToPalladius(w.pinyin);
                  const primaryMeaning =
                    settings.language === 'ru'
                      ? w.meaningsRu?.[0] ?? w.meanings[0]
                      : w.meanings[0];
                  const hintText =
                    settings.language === 'ru' ? w.meaningsRu?.[1] : w.meanings[1];
                  return (
                    <div
                      key={w.id}
                      className="glass-subtle rounded-2xl p-3 flex items-start justify-between gap-2.5"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <ToneHanzi
                            simplified={w.simplified}
                            numericPinyin={w.numericPinyin}
                            pinyin={w.pinyin}
                            toneColorsEnabled={settings.toneColorsEnabled}
                            className="text-xl font-bold"
                          />
                          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                            {w.pinyin}
                            {settings.language === 'ru' && palladius ? ` [${palladius}]` : ''}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {primaryMeaning}
                        </p>
                        {hintText && (
                          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                            {hintText}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSpeakChinese(w.simplified, settings.defaultSpeechRate)}
                        className="glass-surface inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800"
                        aria-label={w.simplified}
                        title={w.simplified}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Starter Pinyin & 4 Tones Trainer Card (HelloChinese-style Unit 0) */}
          <div className="glass-surface rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-500/20">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600/15 text-teal-700 dark:text-teal-300">
                <Ear className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.topics.tonesBannerTitle}
                </h2>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                  {t.topics.tonesBannerDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenTonesTrainer}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Ear className="h-4 w-4" />
              {t.topics.openTonesTrainer}
            </button>
          </div>
        </div>
      )}

      {topicSummaries.length === 0 ? (
        <div className="glass-surface rounded-3xl p-10 text-center space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.topics.emptyTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t.topics.emptyDesc}
          </p>
        </div>
      ) : !selectedTopic ? (
        <div className="space-y-4">
          {/* Topic Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicSummaries.map((summary) => {
            const meta = t.topics.names[summary.topic];
            const pct = Math.round((summary.learnedCount / Math.max(1, summary.words.length)) * 100);
            const previewChars = summary.words
              .slice(0, 4)
              .map((w) => w.simplified)
              .join(' · ');

            return (
              <button
                key={summary.topic}
                type="button"
                onClick={() => {
                  setSelectedTopicId(summary.topic);
                  setExpandedPackNum(null);
                }}
                className="glass-surface rounded-3xl p-5 sm:p-6 text-left flex flex-col justify-between gap-4 hover:bg-white/75 dark:hover:bg-slate-800/75 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      {meta.title}
                    </h2>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-1" />
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {meta.desc}
                  </p>
                  <p className="font-hanzi text-sm font-medium text-teal-700 dark:text-teal-300 pt-1">
                    {previewChars}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-900/8 dark:border-white/8">
                  <div className="flex items-center justify-between text-xs font-mono-num text-slate-600 dark:text-slate-300">
                    <span>
                      {t.topics.wordsAndPacks(
                        summary.words.length,
                        summary.packs.length,
                        settings.dailyNewLimit
                      )}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      ) : (
        /* Pack Cards inside Selected Topic */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedTopic.packs.map((pack) => {
            const isExpanded = expandedPackNum === pack.packNumber;
            const packPct = Math.round((pack.learnedCount / Math.max(1, pack.words.length)) * 100);
            const hanziPreview = pack.words.map((w) => w.simplified).join(' · ');

            return (
              <div
                key={pack.packNumber}
                className="glass-surface rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t.topics.packTitle(pack.packNumber)}
                      </h3>
                    </div>
                    <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                      {t.topics.packRange(pack.startIndex, pack.endIndex, pack.words.length)}
                    </span>
                  </div>

                  <p className="font-hanzi text-base font-semibold text-teal-800 dark:text-teal-200 leading-relaxed">
                    {hanziPreview}
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                      <span>{t.topics.learnedProgress(pack.learnedCount, pack.words.length)}</span>
                      <span>{packPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all"
                        style={{ width: `${packPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-2 pt-3 border-t border-slate-900/10 dark:border-white/10">
                    {pack.words.map((w) => {
                      const enText = w.meanings.slice(0, 3).join(' · ');
                      const ruText = w.meaningsRu?.slice(0, 3).join(' · ');
                      return (
                        <div
                          key={w.id}
                          className="glass-subtle rounded-2xl p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <ToneHanzi
                                simplified={w.simplified}
                                numericPinyin={w.numericPinyin}
                                pinyin={w.pinyin}
                                toneColorsEnabled={settings.toneColorsEnabled}
                                className="text-lg font-bold"
                              />
                              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                                {w.pinyin}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                              {enText}
                            </p>
                            {ruText && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ruText}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onSpeakChinese(w.simplified, settings.defaultSpeechRate)}
                              className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-xl text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800"
                              title={w.simplified}
                              aria-label={w.simplified}
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSpeakEnglish(w.meanings.slice(0, 2).join(', '), settings.defaultSpeechRate)
                              }
                              className="glass-surface inline-flex h-10 px-2.5 items-center justify-center rounded-xl text-[11px] font-bold text-sky-700 hover:bg-white dark:text-sky-300 dark:hover:bg-slate-800"
                              title={enText}
                              aria-label={`English: ${enText}`}
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onStartTopicPack(pack.words)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {t.topics.studyPack}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestTopicPack(pack.words)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-sky-600/15 border border-sky-500/30 px-4 text-xs font-semibold text-sky-800 hover:bg-sky-600/25 dark:text-sky-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.topics.testPack}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedPackNum(isExpanded ? null : pack.packNumber)}
                    className="glass-subtle inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        {t.topics.hideWords}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        {t.topics.previewWords}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
