import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  Palette,
  X,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import type { TranslationDict } from '../../i18n/translations';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { CharacterDetailModal } from './CharacterDetailModal';
import { type FaceIndex, StrokeLayerCardVariant } from './StrokeLayerCardVariant';

interface CardLabViewProps {
  isDark: boolean;
  language: LanguageCode;
  initialShowPinyin: boolean;
  initialToneColors: boolean;
  vocabWords?: VocabWord[];
  t: TranslationDict;
  onSpeak: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
  onClose: () => void;
}

const LAB_WORD_IDS = [
  'hsk1-爱',
  'hsk1-茶',
  'hsk1-八',
  'hsk1-爸爸',
  'hsk1-北京',
  'hsk1-杯子',
  'hsk1-对不起',
  'hsk1-大',
];

export const CardLabView: React.FC<CardLabViewProps> = ({
  isDark,
  language,
  initialShowPinyin,
  initialToneColors,
  vocabWords,
  t,
  onSpeak,
  onSpeakEnglish,
  onClose,
}) => {
  const [index, setIndex] = useState(0);
  const [activeFace, setActiveFace] = useState<FaceIndex>(0);
  const [turnDirection, setTurnDirection] = useState<1 | -1>(1);
  const [showFsrsStep, setShowFsrsStep] = useState(false);
  const [showPinyin, setShowPinyin] = useState(initialShowPinyin);
  const [toneColorsEnabled, setToneColorsEnabled] = useState(initialToneColors);
  const [speechRate, setSpeechRate] = useState<1.0 | 0.7>(1.0);
  const [inspectedChar, setInspectedChar] = useState<string | null>(null);

  const deck = useMemo<VocabWord[]>(() => {
    const byId = new Map(STARTER_HSK1_WORDS.map((w) => [w.id, w]));
    const picked = LAB_WORD_IDS.map((id) => byId.get(id)).filter((w): w is VocabWord => Boolean(w));
    return picked.length > 0 ? picked : STARTER_HSK1_WORDS.slice(0, 8);
  }, []);

  const total = deck.length;
  const currentWord = deck[index] ?? deck[0];

  const handlePrev = useCallback(() => {
    setShowFsrsStep(false);
    setActiveFace(0);
    setTurnDirection(1);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const handleAdvanceNext = useCallback(() => {
    setShowFsrsStep(false);
    setActiveFace(0);
    setTurnDirection(1);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const handleForwardPress = useCallback(() => {
    if (showFsrsStep) {
      handleAdvanceNext();
    } else {
      setShowFsrsStep(true);
    }
  }, [showFsrsStep, handleAdvanceNext]);

  const handleTurnFace = useCallback((nextFace: FaceIndex, dir: 1 | -1) => {
    setShowFsrsStep(false);
    setTurnDirection(dir);
    setActiveFace(nextFace);
  }, []);

  const handleToggleSpeechRate = useCallback(() => {
    setSpeechRate((prev) => (prev === 1.0 ? 0.7 : 1.0));
  }, []);

  const progressPct = Math.round(((index + 1) / Math.max(1, total)) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.cardLab.title}
      className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col justify-between overflow-hidden overscroll-none bg-[#f3f7f9] text-slate-900 dark:bg-[#090d16] dark:text-slate-100"
    >
      {/* Subtle ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-teal-400/18 blur-3xl dark:bg-teal-500/12" />
        <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-sky-400/16 blur-3xl dark:bg-sky-500/12" />
      </div>

      {/* Compact Top Bar */}
      <header className="shrink-0 mx-auto w-full max-w-xl px-3 pt-2.5 pb-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 shrink-0"
            aria-label={t.cardLab.close}
            title={t.cardLab.close}
          >
            <Home className="h-4.5 w-4.5" />
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPinyin((v) => !v)}
              aria-pressed={showPinyin}
              className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border px-2.5 text-xs font-semibold transition-colors ${
                showPinyin
                  ? 'border-teal-600/30 bg-teal-600/12 text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300'
                  : 'glass-subtle text-slate-500 dark:text-slate-400'
              }`}
              title={t.cardLab.pinyinLabel}
            >
              {showPinyin ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden xs:inline">{t.cardLab.pinyinLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setToneColorsEnabled((v) => !v)}
              aria-pressed={toneColorsEnabled}
              className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border px-2.5 text-xs font-semibold transition-colors ${
                toneColorsEnabled
                  ? 'border-sky-600/30 bg-sky-600/12 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-300'
                  : 'glass-subtle text-slate-500 dark:text-slate-400'
              }`}
              title={t.cardLab.toneColorsLabel}
            >
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{t.cardLab.toneColorsLabel}</span>
            </button>
          </div>
        </div>

        {/* Slim progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Open 3D Symbol Stage (zero vertical scroll) */}
      <main className="flex-1 min-h-0 w-full mx-auto max-w-xl flex items-center justify-center overflow-hidden px-1">
        <StrokeLayerCardVariant
          word={currentWord}
          activeFace={activeFace}
          turnDirection={turnDirection}
          showPinyin={showPinyin}
          toneColorsEnabled={toneColorsEnabled}
          speechRate={speechRate}
          isDark={isDark}
          language={language}
          t={t}
          onTurnFace={handleTurnFace}
          onToggleSpeechRate={handleToggleSpeechRate}
          onInspectChar={setInspectedChar}
          onSpeak={(text, rate) => onSpeak(text, rate ?? speechRate)}
          onSpeakEnglish={(text, rate) => onSpeakEnglish(text, rate ?? speechRate)}
        />
      </main>

      <CharacterDetailModal
        char={inspectedChar}
        vocabWords={vocabWords}
        isDark={isDark}
        language={language}
        t={t}
        onSpeak={(text, rate) => onSpeak(text, rate ?? speechRate)}
        onClose={() => setInspectedChar(null)}
      />

      {/* Glassy Transparent Icon-Only Bottom Dock + FSRS Forward Drawer */}
      <footer className="shrink-0 mx-auto w-full max-w-xl px-3 pt-1 pb-3 pb-safe">
        {showFsrsStep ? (
          <div className="glass-surface rounded-3xl p-3 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t.cardLab.fsrsPrompt}
              </span>
              <button
                type="button"
                onClick={() => setShowFsrsStep(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={handleAdvanceNext}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/12 px-1 py-1.5 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300 active:scale-[0.97]"
              >
                <span className="text-xs font-bold">{t.session.grades.Again}</span>
                <span className="text-[10px] opacity-80 font-mono-num">
                  {language === 'ru' ? '<1м' : '<1m'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleAdvanceNext}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/12 px-1 py-1.5 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 active:scale-[0.97]"
              >
                <span className="text-xs font-bold">{t.session.grades.Hard}</span>
                <span className="text-[10px] opacity-80 font-mono-num">
                  {language === 'ru' ? '~6м' : '~6m'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleAdvanceNext}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-teal-500/25 bg-teal-500/12 px-1 py-1.5 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300 active:scale-[0.97]"
              >
                <span className="text-xs font-bold">{t.session.grades.Good}</span>
                <span className="text-[10px] opacity-80 font-mono-num">
                  {language === 'ru' ? '~10м' : '~10m'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleAdvanceNext}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-1 py-1.5 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 active:scale-[0.97]"
              >
                <span className="text-xs font-bold">{t.session.grades.Easy}</span>
                <span className="text-[10px] opacity-80 font-mono-num">
                  {language === 'ru' ? '4д' : '4d'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdvanceNext}
              className="glass-subtle flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/75 active:scale-[0.98]"
            >
              <span>{t.cardLab.fsrsSkip}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="glass-surface flex min-h-[48px] min-w-[58px] items-center justify-center rounded-2xl text-slate-700 transition-all hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/80 active:scale-[0.95]"
              aria-label={t.cardLab.prevWord}
              title={t.cardLab.prevWord}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <span className="font-mono-num text-sm font-bold text-slate-600 dark:text-slate-300">
              {index + 1} / {total}
            </span>

            <button
              type="button"
              onClick={handleForwardPress}
              className="glass-surface flex min-h-[48px] min-w-[58px] items-center justify-center rounded-2xl text-slate-800 transition-all hover:border-teal-600 hover:bg-teal-600 hover:text-white hover:shadow-md hover:shadow-teal-600/25 focus-visible:border-teal-600 focus-visible:bg-teal-600 focus-visible:text-white active:border-teal-600 active:bg-teal-600 active:text-white active:scale-[0.95] dark:text-slate-100"
              aria-label={t.cardLab.nextWord}
              title={t.cardLab.nextWord}
            >
              <ArrowRight className="h-5.5 w-5.5" strokeWidth={2.75} />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
