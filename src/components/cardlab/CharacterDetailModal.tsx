import { Snail, Volume2, X } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { lookupCharacterDetail } from '../../data/radicalsCurriculum';
import type { TranslationDict } from '../../i18n/translations';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { pinyinToPalladius } from '../../utils/palladius';
import { HanziCanvas } from '../HanziCanvas';

interface CharacterDetailModalProps {
  char: string | null;
  vocabWords?: VocabWord[];
  isDark: boolean;
  language: LanguageCode;
  t: TranslationDict;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  char,
  vocabWords,
  isDark,
  language,
  t,
  onSpeak,
  onClose,
}) => {
  const detail = useMemo(
    () => (char ? lookupCharacterDetail(char, vocabWords) : null),
    [char, vocabWords]
  );

  const palladius = useMemo(
    () => (detail?.pinyin ? pinyinToPalladius(detail.pinyin) : ''),
    [detail?.pinyin]
  );

  useEffect(() => {
    if (!char) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [char, onClose]);

  if (!char || !detail) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${detail.char} — ${language === 'ru' ? detail.meaningRu : detail.meaningEn}`}
      data-no-swipe="true"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-surface w-full sm:max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-300">
              {detail.isRadical
                ? language === 'ru'
                  ? 'Базовый кирпичик · ключ'
                  : 'Radical · building block'
                : language === 'ru'
                  ? 'Разбор иероглифа'
                  : 'Character breakdown'}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-hanzi text-4xl font-bold leading-none text-slate-900 dark:text-white">
                {detail.char}
              </span>
              {detail.pinyin && (
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {detail.pinyin}
                </span>
              )}
              {language === 'ru' && palladius && (
                <span className="text-xl font-bold text-teal-700 dark:text-teal-300">
                  [{palladius}]
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-800/75"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Translation & Audio Controls */}
        <div className="space-y-2.5">
          <p className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
            {language === 'ru' ? detail.meaningRu : detail.meaningEn}
          </p>
          {language === 'ru' && detail.meaningEn && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {detail.meaningEn}
            </p>
          )}

          {(language === 'ru' ? detail.noteRu : detail.noteEn) && (
            <p className="rounded-2xl bg-slate-900/5 dark:bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {language === 'ru' ? detail.noteRu : detail.noteEn}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onSpeak(detail.char, 1.0)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-teal-600 px-4 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98]"
            >
              <Volume2 className="h-4 w-4" />
              {language === 'ru' ? 'Озвучить (1.0x)' : 'Speak (1.0x)'}
            </button>
            <button
              type="button"
              onClick={() => onSpeak(detail.char, 0.7)}
              className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/75 active:scale-[0.98]"
            >
              <Snail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              0.7x
            </button>
          </div>
        </div>

        {/* Example compound words using this character */}
        {detail.compounds.length > 0 && (
          <div className="space-y-1.5 border-t border-slate-900/8 pt-3 dark:border-white/10">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'ru' ? 'Встречается в словах:' : 'Used in words:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.compounds.map((c) => (
                <button
                  key={c.zh}
                  type="button"
                  onClick={() => onSpeak(c.zh, 0.9)}
                  className="glass-subtle inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs hover:bg-white/80 dark:hover:bg-slate-800/75"
                >
                  <span className="font-hanzi text-base font-bold text-slate-900 dark:text-white">
                    {c.zh}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {c.pinyin} · {language === 'ru' ? c.ru : c.en}
                  </span>
                  <Volume2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Stroke Writing & Animation */}
        <div className="border-t border-slate-900/8 pt-3.5 dark:border-white/10 flex flex-col items-center">
          <HanziCanvas
            word={detail.char}
            isDark={isDark}
            t={t.canvas}
            onSpeak={onSpeak}
            size={196}
            compact
          />
        </div>
      </div>
    </div>
  );
};
