import {
  Flame,
  Heart,
  PenTool,
  Play,
  RotateCcw,
  SkipForward,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { STROKE_BLITZ_CHARS, type StrokeBlitzChar } from '../../data/miniGamesData';
import type { TranslationDict } from '../../i18n/translations';
import {
  playErrorSound,
  playGameOverSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode } from '../../types/vocab';
import { HanziCanvas } from '../HanziCanvas';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface StrokeBlitzGameProps {
  language: LanguageCode;
  isDark: boolean;
  canvasT: TranslationDict['canvas'];
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

const MAX_HEARTS = 3;
const ROUND_SEC = 20;
const BEST_KEY = 'shigeci_stroke_best_v1';

function loadBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY) || 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // ignore
  }
}

export const StrokeBlitzGame: React.FC<StrokeBlitzGameProps> = ({
  language,
  isDark,
  canvasT,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [showOutline, setShowOutline] = useState(true);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);
  const [writtenCount, setWrittenCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [currentChar, setCurrentChar] = useState<StrokeBlitzChar>(STROKE_BLITZ_CHARS[0]);
  const [roundKey, setRoundKey] = useState(0);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const timerRef = useRef<number | null>(null);
  const frozenRef = useRef(false);

  const pickNextChar = useCallback((exclude?: string): StrokeBlitzChar => {
    const list = exclude
      ? STROKE_BLITZ_CHARS.filter((c) => c.char !== exclude)
      : STROKE_BLITZ_CHARS;
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const loadNext = useCallback(
    (prevChar?: string) => {
      const next = pickNextChar(prevChar);
      setCurrentChar(next);
      setTimeLeft(ROUND_SEC);
      setRoundKey((k) => k + 1);
      setBanner(null);
      frozenRef.current = false;
      onSpeak(next.char);
    },
    [onSpeak, pickNextChar]
  );

  const startGame = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setScore(0);
    setHearts(MAX_HEARTS);
    setStreak(0);
    setWrittenCount(0);
    setGameState('PLAYING');
    loadNext();
  }, [loadNext]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 1s countdown while playing
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = window.setInterval(() => {
      if (frozenRef.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          frozenRef.current = true;
          playErrorSound(false);
          setStreak(0);
          setHearts((h) => {
            const nextH = h - 1;
            setBanner({
              ok: false,
              text: `${isRu ? 'Время вышло:' : 'Time up:'} ${currentChar.char} (${currentChar.pinyin})`,
            });
            timerRef.current = window.setTimeout(() => {
              if (nextH <= 0) {
                playGameOverSound(false);
                setGameState('GAME_OVER');
              } else {
                loadNext(currentChar.char);
              }
            }, 950);
            return nextH;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [currentChar, gameState, isRu, loadNext]);

  const handleCompleteWord = useCallback(
    (mistakes: number) => {
      if (frozenRef.current || gameState !== 'PLAYING') return;
      frozenRef.current = true;
      playSuccessSound(false);

      const speedBonus = Math.max(0, timeLeft);
      const cleanBonus = mistakes === 0 ? 15 : 5;
      const gained = 20 + speedBonus + cleanBonus;

      setStreak((s) => s + 1);
      setWrittenCount((c) => c + 1);
      setScore((prev) => {
        const next = prev + gained;
        setBestScore((b) => {
          const nb = Math.max(b, next);
          if (nb > b) saveBest(nb);
          return nb;
        });
        return next;
      });
      setBanner({
        ok: true,
        text: `${currentChar.char} (${currentChar.pinyin}) +${gained}`,
      });

      timerRef.current = window.setTimeout(() => {
        loadNext(currentChar.char);
      }, 950);
    },
    [currentChar, gameState, loadNext, timeLeft]
  );

  const handleSkip = useCallback(() => {
    if (frozenRef.current || gameState !== 'PLAYING') return;
    frozenRef.current = true;
    playErrorSound(false);
    setStreak(0);
    setHearts((h) => {
      const nextH = h - 1;
      if (nextH <= 0) {
        playGameOverSound(false);
        setGameState('GAME_OVER');
      } else {
        loadNext(currentChar.char);
      }
      return nextH;
    });
  }, [currentChar.char, gameState, loadNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-[#f3f7f9] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 select-none overflow-hidden">
      <header className="glass-nav shrink-0 border-b px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <X className="h-4 w-4" />
            {isRu ? 'Выход' : 'Exit'}
          </button>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
            <span className="font-mono-num text-teal-700 dark:text-teal-300">
              {isRu ? 'Счёт' : 'Score'}: {score}
            </span>
            {streak >= 2 && (
              <span className="inline-flex items-center gap-0.5 font-mono-num text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5" />
                x{streak}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`h-4 w-4 ${
                    idx < hearts
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {bestScore}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 overflow-y-auto">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {isRu ? 'Аркада запоминания · Игра 4' : 'Memory Arcade · Game 4'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isRu ? 'Скоропись штрихов' : 'Stroke Blitz'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Даётся перевод и 20 секунд. Успейте написать иероглиф по правильному порядку черт! Для хардкора можно отключить контур-подсказку.'
                  : 'You get the meaning and 20 seconds. Write each character in the right stroke order before time runs out!'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3 dark:bg-white/5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRu ? 'Показывать контур-подсказку' : 'Show outline trace guide'}
              </span>
              <button
                type="button"
                onClick={() => setShowOutline((v) => !v)}
                className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold ${
                  showOutline
                    ? 'bg-teal-600 text-white'
                    : 'glass-subtle text-slate-700 dark:text-slate-300'
                }`}
              >
                {showOutline ? (isRu ? 'Вкл' : 'On') : isRu ? 'Выкл' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-num">
                <Trophy className="h-4 w-4 text-amber-500" />
                {isRu ? 'Рекорд' : 'Best'}: {bestScore}
              </span>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700"
              >
                <Play className="h-4 w-4" />
                {isRu ? 'Начать' : 'Start'}
              </button>
            </div>
          </div>
        ) : gameState === 'GAME_OVER' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-5 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRu ? 'Тренировка завершена' : 'Blitz Over'}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-teal-700 dark:text-teal-300">
                  {score}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Счёт' : 'Score'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-amber-600 dark:text-amber-400">
                  {bestScore}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Рекорд' : 'Best'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white">
                  {writtenCount}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Написано' : 'Written'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                {isRu ? 'Ещё раз' : 'Play Again'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="glass-subtle min-h-[48px] rounded-2xl px-4 text-sm font-semibold"
              >
                {isRu ? 'Выход' : 'Exit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-surface rounded-3xl p-4 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
                  <PenTool className="h-3.5 w-3.5" />
                  {isRu ? 'Напишите иероглиф:' : 'Write the character:'}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    timeLeft <= 6 ? 'bg-rose-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {isRu ? currentChar.ru : currentChar.en}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currentChar.pinyin}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSpeak(currentChar.char)}
                  className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-teal-700 dark:text-teal-300"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  {isRu ? 'Звук' : 'Audio'}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="glass-subtle inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  {isRu ? 'Пропуск' : 'Skip'}
                </button>
              </div>
            </div>

            {banner && (
              <div
                className={`rounded-2xl px-4 py-2 text-center text-xs font-semibold text-white ${
                  banner.ok ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {banner.text}
              </div>
            )}

            <div className="flex justify-center">
              <HanziCanvas
                key={`${currentChar.char}-${roundKey}`}
                word={currentChar.char}
                isDark={isDark}
                t={canvasT}
                onSpeak={onSpeak}
                size={220}
                defaultShowOutline={showOutline}
                compact
                onCompleteWord={handleCompleteWord}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
