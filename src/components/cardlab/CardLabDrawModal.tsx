import HanziWriter from 'hanzi-writer';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lightbulb,
  Play,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TranslationDict } from '../../i18n/translations';
import { cachedCharDataLoader } from '../../services/strokeLoader';
import type { VocabWord } from '../../types/vocab';
import type { ToneNumber } from '../../utils/tones';

const TONE_STROKE_LIGHT: Record<ToneNumber, string> = {
  1: '#e11d48',
  2: '#059669',
  3: '#0284c7',
  4: '#7c3aed',
  5: '#0f172a',
};

const TONE_STROKE_DARK: Record<ToneNumber, string> = {
  1: '#fb7185',
  2: '#34d399',
  3: '#38bdf8',
  4: '#a78bfa',
  5: '#f1f5f9',
};

interface CardLabDrawModalProps {
  isOpen: boolean;
  word: VocabWord;
  tones: ToneNumber[];
  toneColorsEnabled: boolean;
  showPinyin: boolean;
  speechRate: 1.0 | 0.7;
  isDark: boolean;
  t: TranslationDict;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

export const CardLabDrawModal: React.FC<CardLabDrawModalProps> = ({
  isOpen,
  word,
  tones,
  toneColorsEnabled,
  showPinyin,
  speechRate,
  isDark,
  t,
  onSpeak,
  onClose,
}) => {
  const characters = useMemo(
    () => Array.from(word.simplified).filter((ch) => /[\u4e00-\u9fff]/.test(ch)),
    [word.simplified]
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [showOutline, setShowOutline] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizProgress, setQuizProgress] = useState<{
    done: number;
    total: number;
    mistakes: number;
    completed: boolean;
  } | null>(null);

  const [canvasSize, setCanvasSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Math.max(250, Math.min(440, vw - 52, vh - 196));
  });

  const hostRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const totalStrokesRef = useRef(0);
  const animTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setCanvasSize(Math.max(250, Math.min(440, vw - 52, vh - 196)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveIdx(0);
    }
  }, [isOpen, word.simplified]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const activeChar = characters[activeIdx] ?? characters[0] ?? '';

  const startQuiz = useCallback(
    (writer: HanziWriter, idx: number) => {
      const total = totalStrokesRef.current || 0;
      setIsAnimating(false);
      setQuizProgress(total > 0 ? { done: 0, total, mistakes: 0, completed: false } : null);

      try {
        writer.cancelQuiz();
        writer.hideCharacter();
        writer.quiz({
          leniency: 1.4,
          averageDistanceThreshold: 420,
          showHintAfterMisses: 2,
          highlightOnComplete: true,
          acceptBackwardsStrokes: true,
          onMistake: (s) => {
            setQuizProgress({
              done: s.strokeNum,
              total: s.strokeNum + s.strokesRemaining,
              mistakes: s.totalMistakes,
              completed: false,
            });
          },
          onCorrectStroke: (s) => {
            setQuizProgress({
              done: s.strokeNum + 1,
              total: s.strokeNum + 1 + s.strokesRemaining,
              mistakes: s.totalMistakes,
              completed: false,
            });
          },
          onComplete: (summary) => {
            const totalS = totalStrokesRef.current || summary.totalMistakes;
            setQuizProgress({
              done: totalS,
              total: totalS,
              mistakes: summary.totalMistakes,
              completed: true,
            });
            if (idx + 1 < characters.length) {
              setTimeout(() => {
                setActiveIdx(idx + 1);
              }, 550);
            }
          },
        });
      } catch {
        // Ignore if writer was unmounted mid-transition
      }
    },
    [characters.length]
  );

  useEffect(() => {
    if (!isOpen || !activeChar) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    animTokenRef.current.cancelled = true;
    const localToken = { cancelled: false };
    animTokenRef.current = localToken;

    host.innerHTML = '';
    const canvasNode = document.createElement('canvas');
    canvasNode.width = canvasSize;
    canvasNode.height = canvasSize;
    canvasNode.style.width = `${canvasSize}px`;
    canvasNode.style.height = `${canvasSize}px`;
    canvasNode.style.display = 'block';
    canvasNode.style.touchAction = 'none';
    canvasNode.className = 'cursor-crosshair';
    host.appendChild(canvasNode);

    writerRef.current = null;
    totalStrokesRef.current = 0;
    setIsLoading(true);
    setLoadFailed(false);
    setIsAnimating(false);
    setQuizProgress(null);

    const outlineColor = isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.14)';
    const radicalColor = isDark ? '#2dd4bf' : '#0d9488';
    const drawingColor = isDark ? '#2dd4bf' : '#0d9488';
    const highlightColor = isDark ? '#38bdf8' : '#0284c7';
    const tone = tones[activeIdx] ?? 5;
    const strokeColor = toneColorsEnabled
      ? (isDark ? TONE_STROKE_DARK : TONE_STROKE_LIGHT)[tone]
      : isDark
        ? '#f8fafc'
        : '#0f172a';

    let failed = false;
    const writer = new HanziWriter(canvasNode, {
      width: canvasSize,
      height: canvasSize,
      padding: Math.max(16, Math.round(canvasSize * 0.07)),
      renderer: 'canvas',
      showOutline,
      showCharacter: false,
      strokeColor,
      outlineColor,
      radicalColor,
      drawingColor,
      highlightColor,
      drawingWidth: Math.max(18, Math.round(canvasSize * 0.068)),
      strokeAnimationSpeed: 1.05,
      delayBetweenStrokes: 190,
      charDataLoader: cachedCharDataLoader,
      onLoadCharDataSuccess: (data) => {
        totalStrokesRef.current = data.strokes.length;
      },
      onLoadCharDataError: () => {
        failed = true;
      },
    });

    writerRef.current = writer;

    void writer
      .setCharacter(activeChar)
      .then(() => {
        if (cancelled || localToken.cancelled) return;
        setIsLoading(false);
        if (failed) {
          setLoadFailed(true);
          return;
        }
        startQuiz(writer, activeIdx);
      })
      .catch(() => {
        if (cancelled || localToken.cancelled) return;
        setIsLoading(false);
        setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      localToken.cancelled = true;
      try {
        writer.cancelQuiz();
      } catch {
        // Ignore cleanup errors
      }
      canvasNode.remove();
      writerRef.current = null;
    };
  }, [
    isOpen,
    activeChar,
    activeIdx,
    canvasSize,
    isDark,
    showOutline,
    toneColorsEnabled,
    tones,
    startQuiz,
  ]);

  const handleReplayAnimation = useCallback(async () => {
    const writer = writerRef.current;
    if (!writer || isLoading || loadFailed) return;

    animTokenRef.current.cancelled = true;
    const token = { cancelled: false };
    animTokenRef.current = token;

    setIsAnimating(true);
    try {
      writer.cancelQuiz();
      writer.hideCharacter();
      await writer.animateCharacter();
      if (token.cancelled) return;
      await new Promise((r) => setTimeout(r, 320));
      if (token.cancelled) return;
    } catch {
      // Ignore interruption
    }

    if (!token.cancelled && writerRef.current === writer) {
      startQuiz(writer, activeIdx);
    }
  }, [activeIdx, isLoading, loadFailed, startQuiz]);

  const handleHint = useCallback(() => {
    const writer = writerRef.current;
    if (!writer || isAnimating || isLoading || loadFailed) return;
    const strokeIdx = quizProgress?.completed ? 0 : (quizProgress?.done ?? 0);
    try {
      void writer.highlightStroke(strokeIdx);
    } catch {
      // Ignore
    }
  }, [isAnimating, isLoading, loadFailed, quizProgress]);

  const handleReset = useCallback(() => {
    const writer = writerRef.current;
    if (!writer || isLoading || loadFailed) return;
    animTokenRef.current.cancelled = true;
    startQuiz(writer, activeIdx);
  }, [activeIdx, isLoading, loadFailed, startQuiz]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t.canvas.practiceDrawing}: ${word.simplified}`}
      data-no-swipe="true"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-surface relative flex flex-col items-center gap-3 rounded-3xl p-3.5 sm:p-5 shadow-2xl max-w-full"
      >
        {/* Top bar: Character selector / Pinyin + Close X */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {characters.length > 1 ? (
              characters.map((ch, idx) => (
                <button
                  key={`${ch}-${idx}`}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 font-hanzi text-lg font-bold transition-all active:scale-95 ${
                    idx === activeIdx
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25'
                      : 'glass-subtle text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/75'
                  }`}
                >
                  {ch}
                </button>
              ))
            ) : (
              <span className="font-hanzi text-xl font-bold leading-none text-slate-900 dark:text-white pl-1">
                {activeChar}
              </span>
            )}

            {showPinyin && (
              <span className="ml-1 text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
                {word.pinyin}
              </span>
            )}

            <button
              type="button"
              onClick={() => onSpeak(activeChar || word.simplified, speechRate)}
              className="glass-subtle inline-flex h-9 w-9 items-center justify-center rounded-xl text-teal-700 hover:bg-white/80 dark:text-teal-300 dark:hover:bg-slate-800/75 active:scale-95"
              aria-label={t.canvas.pronounce}
              title={t.canvas.pronounce}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-600 hover:bg-white/85 dark:text-slate-300 dark:hover:bg-slate-800/80 active:scale-95"
            aria-label={t.common.close}
            title={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Maximally Large Drawing Canvas */}
        <div
          className="relative flex items-center justify-center rounded-3xl border border-slate-300/60 bg-white/65 shadow-inner dark:border-white/15 dark:bg-slate-950/50 touch-none select-none overflow-hidden"
          style={{ width: canvasSize, height: canvasSize }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="8"
              fill="none"
              stroke="currentColor"
              className="text-slate-400/22 dark:text-slate-500/22"
              strokeWidth="0.6"
            />
            <line
              x1="50"
              y1="3"
              x2="50"
              y2="97"
              stroke="currentColor"
              className="text-slate-400/28 dark:text-slate-500/28"
              strokeWidth="0.6"
              strokeDasharray="2.5 2.5"
            />
            <line
              x1="3"
              y1="50"
              x2="97"
              y2="50"
              stroke="currentColor"
              className="text-slate-400/28 dark:text-slate-500/28"
              strokeWidth="0.6"
              strokeDasharray="2.5 2.5"
            />
            <line
              x1="3"
              y1="3"
              x2="97"
              y2="97"
              stroke="currentColor"
              className="text-slate-400/16 dark:text-slate-500/16"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
            <line
              x1="97"
              y1="3"
              x2="3"
              y2="97"
              stroke="currentColor"
              className="text-slate-400/16 dark:text-slate-500/16"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
          </svg>

          <div
            ref={hostRef}
            className="relative z-10 touch-none select-none"
            style={{ width: canvasSize, height: canvasSize }}
          />

          {isLoading && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t.canvas.loadingStrokes}
              </span>
            </div>
          )}

          {loadFailed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/85 p-5 text-center backdrop-blur-md dark:bg-slate-900/85">
              <span className="font-hanzi text-6xl font-bold text-slate-800 dark:text-white">
                {activeChar}
              </span>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {t.canvas.loadError(activeChar)}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Action Row: Replay Animation + Outline + Hint + Reset + Progress */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReplayAnimation}
              disabled={isLoading || loadFailed}
              className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-2xl px-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                isAnimating
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'glass-subtle text-teal-700 hover:bg-white/85 dark:text-teal-300 dark:hover:bg-slate-800/80'
              }`}
              aria-label={t.canvas.replay}
              title={t.canvas.replay}
            >
              <Play className="h-3.5 w-3.5" />
              <span>{t.canvas.replay}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOutline((v) => !v)}
              className="glass-subtle inline-flex h-[42px] w-[42px] items-center justify-center rounded-2xl text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/80 active:scale-95"
              aria-label={showOutline ? t.canvas.outlineOn : t.canvas.outlineOff}
              title={showOutline ? t.canvas.outlineOn : t.canvas.outlineOff}
            >
              {showOutline ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleHint}
              disabled={isAnimating || isLoading || loadFailed}
              className="glass-subtle inline-flex h-[42px] w-[42px] items-center justify-center rounded-2xl text-sky-700 hover:bg-white/85 dark:text-sky-300 dark:hover:bg-slate-800/80 active:scale-95 disabled:opacity-50"
              aria-label={t.canvas.hint}
              title={t.canvas.hint}
            >
              <Lightbulb className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading || loadFailed}
              className="glass-subtle inline-flex h-[42px] w-[42px] items-center justify-center rounded-2xl text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/80 active:scale-95 disabled:opacity-50"
              aria-label={t.canvas.reset}
              title={t.canvas.reset}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {quizProgress && (
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300 pr-1">
              {quizProgress.completed ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.canvas.completed(quizProgress.mistakes)}
                </span>
              ) : (
                <span className="font-mono-num">
                  {t.canvas.strokeProgress(
                    quizProgress.done,
                    quizProgress.total,
                    quizProgress.mistakes
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
