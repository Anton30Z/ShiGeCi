import { PenTool, Volume2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatHskLevelsLabel, type TranslationDict } from '../i18n/translations';
import type { AppSettings, VocabWord } from '../types/vocab';
import { HanziCanvas } from './HanziCanvas';

interface WritingStudioViewProps {
  initialWord: string;
  words: VocabWord[];
  settings: AppSettings;
  t: TranslationDict;
  onSpeak: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
}

export const WritingStudioView: React.FC<WritingStudioViewProps> = ({
  initialWord,
  words,
  settings,
  t,
  onSpeak,
  onSpeakEnglish,
}) => {
  const [practiceInput, setPracticeInput] = useState(initialWord || '永');
  const [activeWord, setActiveWord] = useState(initialWord || '永');

  useEffect(() => {
    if (initialWord) {
      setPracticeInput(initialWord);
      setActiveWord(initialWord);
    }
  }, [initialWord]);

  const quickPicks = words.slice(0, 14);
  const matchedWord = words.find((w) => w.simplified === activeWord);

  const handleApplyInput = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = practiceInput.trim();
    if (cleaned) {
      setActiveWord(cleaned);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      <div className="glass-surface rounded-3xl p-6 sm:p-8 lg:col-span-7 flex flex-col items-center space-y-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
              {t.writing.title}
            </h1>
            {matchedWord ? (
              <div className="mt-0.5 space-y-0.5">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                  {matchedWord.pinyin} · {matchedWord.meanings.slice(0, 2).join(', ')}
                </p>
                {matchedWord.meaningsRu && matchedWord.meaningsRu.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {matchedWord.meaningsRu.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.writing.subtitleFallback}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onSpeak(activeWord, 0.8)}
              className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-teal-700 hover:bg-white/85 dark:text-teal-300 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
            >
              <Volume2 className="h-4 w-4" />
              {t.writing.listen}
            </button>
            {matchedWord && (
              <button
                type="button"
                onClick={() =>
                  onSpeakEnglish(
                    matchedWord.meanings.slice(0, 2).join(', '),
                    settings.defaultSpeechRate
                  )
                }
                className="glass-subtle inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 text-xs font-bold text-sky-700 hover:bg-white/85 dark:text-sky-300 dark:hover:bg-slate-800/75 whitespace-nowrap shrink-0"
                title={matchedWord.meanings.slice(0, 2).join(', ')}
              >
                EN
              </button>
            )}
          </div>
        </div>

        <HanziCanvas
          word={activeWord}
          isDark={settings.theme === 'dark'}
          t={t.canvas}
          onSpeak={onSpeak}
          size={280}
        />
      </div>

      <div className="glass-surface rounded-3xl p-6 lg:col-span-5 space-y-6">
        <form onSubmit={handleApplyInput} className="space-y-3">
          <label
            htmlFor="custom-hanzi-practice"
            className="block text-sm font-semibold text-slate-900 dark:text-white"
          >
            {t.writing.inputLabel}
          </label>
          <div className="flex gap-2">
            <input
              id="custom-hanzi-practice"
              type="text"
              value={practiceInput}
              onChange={(e) => setPracticeInput(e.target.value)}
              placeholder={t.writing.inputPlaceholder}
              className="glass-subtle min-h-[44px] flex-1 rounded-xl px-3.5 font-hanzi text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              {t.writing.loadButton}
            </button>
          </div>
        </form>

        <div className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t.writing.quickPicks(
              formatHskLevelsLabel(settings.activeHskLevels, settings.language)
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickPicks.map((w) => {
              const isSelected = w.simplified === activeWord;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setActiveWord(w.simplified);
                    setPracticeInput(w.simplified);
                  }}
                  className={`flex min-h-[48px] items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'glass-subtle text-slate-800 hover:bg-white/85 dark:text-slate-100 dark:hover:bg-slate-800/75'
                  }`}
                >
                  <span className="font-hanzi text-lg font-bold">{w.simplified}</span>
                  <span
                    className={`truncate text-[11px] ${
                      isSelected ? 'text-teal-50' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {w.pinyin}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
