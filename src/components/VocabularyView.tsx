import {
  BookOpen,
  ChevronRight,
  PenTool,
  Plus,
  Search,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { getContextualExample } from '../data/starterHsk1';
import { formatHskLevelsLabel, type TranslationDict } from '../i18n/translations';
import { getWordLearningStatus } from '../services/fsrsEngine';
import type {
  AppSettings,
  VocabWord,
  WordProgress,
  WordStatusFilter,
} from '../types/vocab';
import { stripPinyinTones } from '../utils/tones';
import { ToneHanzi } from './ToneHanzi';

interface VocabularyViewProps {
  words: VocabWord[];
  customWords: VocabWord[];
  progressMap: Record<string, WordProgress>;
  settings: AppSettings;
  t: TranslationDict;
  onSpeak: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
  onAddCustomWord: (word: {
    simplified: string;
    pinyin: string;
    meaning: string;
    exampleZh?: string;
  }) => void;
  onDeleteCustomWord: (wordId: string) => void;
  onPracticeWriting: (simplified: string) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  words,
  customWords,
  progressMap,
  settings,
  t,
  onSpeak,
  onSpeakEnglish,
  onAddCustomWord,
  onDeleteCustomWord,
  onPracticeWriting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordStatusFilter>('all');
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(80);

  const [newHanzi, setNewHanzi] = useState('');
  const [newPinyin, setNewPinyin] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExampleZh, setNewExampleZh] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const combinedWords = useMemo(() => {
    return [...customWords, ...words];
  }, [customWords, words]);

  const counts = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    for (const w of combinedWords) {
      const st = getWordLearningStatus(progressMap[w.id]);
      if (st === 'new') newCount++;
      else if (st === 'learning') learningCount++;
      else masteredCount++;
    }
    return {
      all: combinedWords.length,
      new: newCount,
      learning: learningCount,
      mastered: masteredCount,
    };
  }, [combinedWords, progressMap]);

  const filteredWords = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    const plainQ = stripPinyinTones(rawQ);

    return combinedWords.filter((w) => {
      const st = getWordLearningStatus(progressMap[w.id]);
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!rawQ) return true;

      if (w.simplified.includes(rawQ)) return true;
      if (w.pinyin.toLowerCase().includes(rawQ)) return true;
      if (plainQ && w.plainPinyin.includes(plainQ)) return true;
      if (w.meanings.some((m) => m.toLowerCase().includes(rawQ))) return true;
      if (w.meaningsRu?.some((m) => m.toLowerCase().includes(rawQ))) return true;
      return false;
    });
  }, [combinedWords, progressMap, searchQuery, statusFilter]);

  const displayedWords = filteredWords.slice(0, visibleLimit);

  const handleSubmitCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedHanzi = newHanzi.trim();
    const trimmedPinyin = newPinyin.trim();
    const trimmedMeaning = newMeaning.trim();

    if (!trimmedHanzi || !trimmedPinyin || !trimmedMeaning) {
      setFormError(t.vocabulary.validationRequired);
      return;
    }

    onAddCustomWord({
      simplified: trimmedHanzi,
      pinyin: trimmedPinyin,
      meaning: trimmedMeaning,
      exampleZh: newExampleZh.trim() || undefined,
    });

    setNewHanzi('');
    setNewPinyin('');
    setNewMeaning('');
    setNewExampleZh('');
    setFormError(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t.vocabulary.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.vocabulary.subtitle(
                formatHskLevelsLabel(settings.activeHskLevels, settings.language),
                combinedWords.length,
                customWords.length
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t.vocabulary.addWord}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleLimit(80);
              }}
              placeholder={t.vocabulary.searchPlaceholder}
              className="glass-subtle min-h-[46px] w-full rounded-2xl pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white"
            />
          </div>

          <div className="glass-subtle inline-flex rounded-2xl p-1 overflow-x-auto">
            {(
              [
                { id: 'all', label: t.vocabulary.filterAll(counts.all) },
                { id: 'new', label: t.vocabulary.filterNew(counts.new) },
                { id: 'learning', label: t.vocabulary.filterLearning(counts.learning) },
                { id: 'mastered', label: t.vocabulary.filterMastered(counts.mastered) },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setVisibleLimit(80);
                }}
                className={`min-h-[38px] rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-surface rounded-3xl overflow-hidden divide-y divide-slate-900/5 dark:divide-white/8">
        {displayedWords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t.vocabulary.emptyTitle}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.vocabulary.emptyDesc}
            </p>
          </div>
        ) : (
          displayedWords.map((word) => {
            const status = getWordLearningStatus(progressMap[word.id]);
            const statusLabel =
              status === 'mastered'
                ? t.vocabulary.statusMastered
                : status === 'learning'
                  ? t.vocabulary.statusLearning
                  : t.vocabulary.statusNew;
            const statusColor =
              status === 'mastered'
                ? 'text-emerald-600 dark:text-emerald-400'
                : status === 'learning'
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400';
            const englishMeanings = word.meanings;
            const russianMeanings = word.meaningsRu ?? [];

            return (
              <div
                key={word.id}
                className="flex min-h-[72px] items-center justify-between gap-2.5 px-4 sm:px-6 py-3 hover:bg-white/45 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSpeak(word.simplified, settings.defaultSpeechRate)}
                    className="glass-subtle inline-flex h-11 w-11 items-center justify-center rounded-xl text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800"
                    title={word.simplified}
                    aria-label={word.simplified}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakEnglish(
                        englishMeanings.slice(0, 2).join(', '),
                        settings.defaultSpeechRate
                      )
                    }
                    className="glass-subtle inline-flex h-11 px-2.5 items-center justify-center rounded-xl text-xs font-bold text-sky-700 hover:bg-white dark:text-sky-300 dark:hover:bg-slate-800"
                    title={englishMeanings.join(' · ')}
                    aria-label={`English: ${englishMeanings.slice(0, 2).join(', ')}`}
                  >
                    EN
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWord(word)}
                  className="flex flex-1 min-w-0 items-center justify-between gap-4 text-left"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <ToneHanzi
                        simplified={word.simplified}
                        numericPinyin={word.numericPinyin}
                        pinyin={word.pinyin}
                        toneColorsEnabled={settings.toneColorsEnabled}
                        className="text-xl font-bold"
                      />
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        {word.pinyin}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {englishMeanings.join(' · ')}
                    </p>
                    {russianMeanings.length > 0 && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {russianMeanings.join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-semibold ${statusColor}`}>
                      {word.isCustom ? `${t.common.customWord} · ${statusLabel}` : statusLabel}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              </div>
            );
          })
        )}

        {filteredWords.length > visibleLimit && (
          <div className="p-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((v) => v + 80)}
              className="glass-subtle inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70"
            >
              {t.vocabulary.showMore(filteredWords.length - visibleLimit)}
            </button>
          </div>
        )}
      </div>

      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="glass-surface w-full max-w-md rounded-3xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {selectedWord.level === 0
                    ? t.common.customWord
                    : t.common.hskLevel(selectedWord.level)}{' '}
                  · {t.common.radical} {selectedWord.radical}
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <ToneHanzi
                    simplified={selectedWord.simplified}
                    numericPinyin={selectedWord.numericPinyin}
                    pinyin={selectedWord.pinyin}
                    toneColorsEnabled={settings.toneColorsEnabled}
                    className="text-4xl font-bold"
                  />
                  <span className="text-lg font-semibold text-teal-700 dark:text-teal-300">
                    {selectedWord.pinyin}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.vocabulary.meanings}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onSpeakEnglish(
                      selectedWord.meanings.slice(0, 2).join(', '),
                      settings.defaultSpeechRate
                    )
                  }
                  className="glass-subtle inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-sky-700 hover:bg-white dark:text-sky-300 dark:hover:bg-slate-800"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  EN
                </button>
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedWord.meanings.join(' · ')}
              </p>
              {selectedWord.meaningsRu && selectedWord.meaningsRu.length > 0 && (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {selectedWord.meaningsRu.join(' · ')}
                </p>
              )}
            </div>

            {(() => {
              const ex = getContextualExample(selectedWord, 'en');
              return (
                <div className="glass-subtle rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="font-hanzi text-base font-medium text-slate-900 dark:text-white">
                      {ex.zh}
                    </p>
                    <p className="text-xs text-teal-700 dark:text-teal-300">{ex.pinyin}</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                      {ex.en}
                    </p>
                    {ex.ru && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ex.ru}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSpeak(ex.zh, settings.defaultSpeechRate)}
                      className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-xl text-teal-700 dark:text-teal-300"
                      aria-label={t.session.listenExample}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSpeakEnglish(ex.en, settings.defaultSpeechRate)}
                      className="glass-surface inline-flex h-10 px-2.5 items-center justify-center rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300"
                      aria-label={`English: ${ex.en}`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              );
            })()}

            {progressMap[selectedWord.id] && (
              <div className="grid grid-cols-3 gap-2 text-center glass-subtle rounded-2xl p-3 font-mono-num">
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.vocabulary.reps}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {progressMap[selectedWord.id].card.reps}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.vocabulary.stability}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {progressMap[selectedWord.id].card.stability.toFixed(1)} {t.common.daysUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.vocabulary.lapses}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {progressMap[selectedWord.id].card.lapses}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSpeak(selectedWord.simplified, 0.7)}
                className="glass-subtle inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                <Volume2 className="h-4 w-4" />
                {t.vocabulary.slowAudio}
              </button>
              <button
                type="button"
                onClick={() => {
                  const char = selectedWord.simplified;
                  setSelectedWord(null);
                  onPracticeWriting(char);
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
              >
                <PenTool className="h-4 w-4" />
                {t.vocabulary.practiceStrokes}
              </button>
              {selectedWord.isCustom && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCustomWord(selectedWord.id);
                    setSelectedWord(null);
                  }}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-rose-500/12 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
                  aria-label={t.toasts.removedWord}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitCustomWord}
            className="glass-surface w-full max-w-md rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.vocabulary.addModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vocabulary.fieldHanzi}
                </label>
                <input
                  type="text"
                  value={newHanzi}
                  onChange={(e) => setNewHanzi(e.target.value)}
                  placeholder={t.vocabulary.fieldHanziPlaceholder}
                  className="glass-subtle min-h-[44px] w-full rounded-xl px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vocabulary.fieldPinyin}
                </label>
                <input
                  type="text"
                  value={newPinyin}
                  onChange={(e) => setNewPinyin(e.target.value)}
                  placeholder={t.vocabulary.fieldPinyinPlaceholder}
                  className="glass-subtle min-h-[44px] w-full rounded-xl px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vocabulary.fieldMeaning}
                </label>
                <input
                  type="text"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder={t.vocabulary.fieldMeaningPlaceholder}
                  className="glass-subtle min-h-[44px] w-full rounded-xl px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vocabulary.fieldExample}
                </label>
                <input
                  type="text"
                  value={newExampleZh}
                  onChange={(e) => setNewExampleZh(e.target.value)}
                  placeholder={t.vocabulary.fieldExamplePlaceholder}
                  className="glass-subtle min-h-[44px] w-full rounded-xl px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{formError}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="glass-subtle min-h-[44px] rounded-xl px-4 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                {t.vocabulary.saveWord}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
