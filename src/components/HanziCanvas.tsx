import HanziWriter from 'hanzi-writer';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lightbulb,
  PenTool,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TranslationDict } from '../i18n/translations';
import { cachedCharDataLoader } from '../services/strokeLoader';

interface HanziCanvasProps {
  word: string;
  isDark: boolean;
  t: TranslationDict['canvas'];
  onSpeak?: (text: string, rate?: number) => void;
  size?: number;
  defaultShowOutline?: boolean;
  compact?: boolean;
  onCompleteWord?: (mistakes: number) => void;
}

type WriterMode = 'animate' | 'quiz';

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  word,
  isDark,
  t,
  onSpeak,
  size = 250,
  defaultShowOutline = true,
  compact = false,
  onCompleteWord,
}) => {
  const characters = useMemo(
    () => Array.from(word).filter((ch) => /[\u4e00-\u9fff]/.test(ch)),
    [word]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<WriterMode>('quiz');
  const [showOutline, setShowOutline] = useState(defaultShowOutline);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [strokeProgress, setStrokeProgress] = useState<{ done: number; total: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const totalStrokesRef = useRef(0);
  const onCompleteWordRef = useRef(onCompleteWord);
  onCompleteWordRef.current = onCompleteWord;
  const activeChar = characters[activeIndex] ?? characters[0] ?? '';

  useEffect(() => {
    setActiveIndex(0);
  }, [word]);

  const startModeOnWriter = useCallback(
    (writer: HanziWriter, targetMode: WriterMode, totalStrokes: number) => {
      setCompleted(false);
      setMistakes(0);
      setStrokeProgress(totalStrokes > 0 ? { done: 0, total: totalStrokes } : null);

      try {
        if (targetMode === 'animate') {
          writer.cancelQuiz();
          writer.showCharacter();
          writer.animateCharacter();
        } else {
          writer.hideCharacter();
          writer.quiz({
            leniency: 1.4,
            averageDistanceThreshold: 420,
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            acceptBackwardsStrokes: true,
            onMistake: (strokeData) => {
              setMistakes(strokeData.totalMistakes);
            },
            onCorrectStroke: (strokeData) => {
              const total = strokeData.strokeNum + 1 + strokeData.strokesRemaining;
              setStrokeProgress({
                done: strokeData.strokeNum + 1,
                total,
              });
            },
            onComplete: (summary) => {
              setMistakes(summary.totalMistakes);
              setCompleted(true);
              onCompleteWordRef.current?.(summary.totalMistakes);
            },
          });
        }
      } catch {
        // Ignore if writer was unmounted mid-transition
      }
    },
    []
  );

  useEffect(() => {
    const host = containerRef.current;
    if (!host || !activeChar) return;

    let cancelled = false;
    host.innerHTML = '';

    // Native <canvas> element gives exact clientX/clientY -> boundingClientRect mouse & touch mapping
    const canvasNode = document.createElement('canvas');
    canvasNode.width = size;
    canvasNode.height = size;
    canvasNode.style.width = `${size}px`;
    canvasNode.style.height = `${size}px`;
    canvasNode.style.display = 'block';
    canvasNode.style.touchAction = 'none';
    canvasNode.className = mode === 'quiz' ? 'cursor-crosshair' : 'cursor-pointer';
    host.appendChild(canvasNode);

    writerRef.current = null;
    totalStrokesRef.current = 0;
    setIsLoading(true);
    setLoadError(null);
    setCompleted(false);
    setMistakes(0);
    setStrokeProgress(null);

    const strokeColor = isDark ? '#e2e8f0' : '#0f172a';
    const outlineColor = isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.14)';
    const drawingColor = isDark ? '#2dd4bf' : '#0d9488';
    const highlightColor = isDark ? '#38bdf8' : '#0284c7';
    const radicalColor = isDark ? '#34d399' : '#059669';

    let loadedStrokes = 0;
    let loadFailed = false;

    const writer = new HanziWriter(canvasNode, {
      width: size,
      height: size,
      padding: 18,
      renderer: 'canvas',
      showOutline,
      showCharacter: mode === 'animate',
      strokeColor,
      outlineColor,
      drawingColor,
      highlightColor,
      radicalColor,
      drawingWidth: 16,
      strokeAnimationSpeed: 1.1,
      delayBetweenStrokes: 260,
      charDataLoader: cachedCharDataLoader,
      onLoadCharDataSuccess: (data) => {
        loadedStrokes = data.strokes.length;
        totalStrokesRef.current = loadedStrokes;
      },
      onLoadCharDataError: () => {
        loadFailed = true;
      },
    });

    writerRef.current = writer;

    void writer
      .setCharacter(activeChar)
      .then(() => {
        if (cancelled) return;
        if (loadFailed) {
          setIsLoading(false);
          setLoadError(t.loadError(activeChar));
          return;
        }
        setIsLoading(false);
        setLoadError(null);
        startModeOnWriter(writer, mode, loadedStrokes);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
        setLoadError(t.loadError(activeChar));
      });

    return () => {
      cancelled = true;
      try {
        writer.cancelQuiz();
      } catch {
        // Ignore cleanup errors
      }
      canvasNode.remove();
      writerRef.current = null;
    };
  }, [activeChar, isDark, size, mode, showOutline, startModeOnWriter, t]);

  const handleReplay = () => {
    const writer = writerRef.current;
    if (!writer) return;
    if (mode === 'animate') {
      writer.animateCharacter();
    } else {
      startModeOnWriter(writer, 'quiz', strokeProgress?.total ?? totalStrokesRef.current);
    }
  };

  const handleHint = () => {
    const writer = writerRef.current;
    if (!writer || mode !== 'quiz' || completed) return;
    const strokeIdx = strokeProgress?.done ?? 0;
    try {
      void writer.highlightStroke(strokeIdx);
    } catch {
      // Ignore if character has not finished loading
    }
  };

  if (characters.length === 0) {
    return (
      <div className="glass-subtle rounded-2xl p-6 text-center text-sm text-slate-600 dark:text-slate-300">
        {t.noChars(word)}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`}>
      {characters.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {characters.map((char, idx) => (
            <button
              key={`${char}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`${compact ? 'min-h-[34px] min-w-[36px] px-2.5 text-base' : 'min-h-[44px] min-w-[44px] px-3 text-xl'} rounded-xl font-hanzi font-semibold transition-all whitespace-nowrap shrink-0 ${
                idx === activeIndex
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'glass-subtle text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="glass-subtle inline-flex rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'quiz'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            {t.practiceDrawing}
          </button>
          <button
            type="button"
            onClick={() => setMode('animate')}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'animate'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            {t.watchAnimation}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowOutline((v) => !v)}
          className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-medium text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
        >
          {showOutline ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showOutline ? t.outlineOn : t.outlineOff}
        </button>
      </div>

      <div
        className="relative flex items-center justify-center rounded-3xl border border-slate-300/60 bg-white/55 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-slate-950/45 touch-none select-none overflow-hidden"
        style={{ width: size, height: size }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full rounded-3xl"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="10"
            fill="none"
            stroke="currentColor"
            className="text-slate-400/25 dark:text-slate-500/25"
            strokeWidth="0.6"
          />
          <line
            x1="50"
            y1="3"
            x2="50"
            y2="97"
            stroke="currentColor"
            className="text-slate-400/30 dark:text-slate-500/30"
            strokeWidth="0.6"
            strokeDasharray="2.5 2.5"
          />
          <line
            x1="3"
            y1="50"
            x2="97"
            y2="50"
            stroke="currentColor"
            className="text-slate-400/30 dark:text-slate-500/30"
            strokeWidth="0.6"
            strokeDasharray="2.5 2.5"
          />
          <line
            x1="3"
            y1="3"
            x2="97"
            y2="97"
            stroke="currentColor"
            className="text-slate-400/18 dark:text-slate-500/18"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
          <line
            x1="97"
            y1="3"
            x2="3"
            y2="97"
            stroke="currentColor"
            className="text-slate-400/18 dark:text-slate-500/18"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
        </svg>

        <div
          ref={containerRef}
          className="relative z-10 touch-none select-none"
          style={{ width: size, height: size }}
        />

        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t.loadingStrokes}
            </span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/80 p-5 text-center backdrop-blur-md dark:bg-slate-900/80">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
          </div>
        )}
      </div>

      {!compact && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          {mode === 'animate' ? t.watchHint : t.drawHint}
        </p>
      )}

      <div className="flex w-full max-w-sm flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono-num">
          {mode === 'quiz' && strokeProgress ? (
            completed ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {t.completed(mistakes)}
              </span>
            ) : (
              <span>{t.strokeProgress(strokeProgress.done, strokeProgress.total, mistakes)}</span>
            )
          ) : (
            <span>{t.watchHint}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(activeChar, 0.8)}
              className="glass-subtle inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70"
              title={t.pronounce}
              aria-label={t.pronounce}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {mode === 'quiz' && !completed && !isLoading && !loadError && (
            <button
              type="button"
              onClick={handleHint}
              className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-sky-700 hover:bg-white/80 dark:text-sky-300 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {t.hint}
            </button>
          )}
          <button
            type="button"
            onClick={handleReplay}
            className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {mode === 'animate' ? t.replay : t.reset}
          </button>
        </div>
      </div>
    </div>
  );
};
