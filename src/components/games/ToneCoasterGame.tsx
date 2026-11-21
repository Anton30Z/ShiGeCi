import {
  Flame,
  Heart,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  Waves,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import {
  playErrorSound,
  playGameOverSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { extractTonesForCharacters, type ToneNumber } from '../../utils/tones';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface ToneCoasterGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface ToneRound {
  char: string;
  pinyin: string;
  meaning: string;
  tone: 1 | 2 | 3 | 4;
}

const MAX_HEARTS = 3;
const ROUND_SEC = 9;
const BEST_KEY = 'shigeci_tonecoaster_best_v1';

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

export const ToneCoasterGame: React.FC<ToneCoasterGameProps> = ({
  vocabWords,
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';

  const singleToneItems = useMemo<ToneRound[]>(() => {
    const source = vocabWords.length >= 8 ? vocabWords : STARTER_HSK1_WORDS;
    const out: ToneRound[] = [];
    for (const w of source) {
      const chars = Array.from(w.simplified);
      if (chars.length === 1) {
        const tones = extractTonesForCharacters(w.simplified, w.numericPinyin, w.pinyin);
        const t = tones[0] as ToneNumber;
        if (t === 1 || t === 2 || t === 3 || t === 4) {
          out.push({
            char: w.simplified,
            pinyin: w.pinyin,
            meaning: (isRu ? w.meaningsRu?.[0] : w.meanings[0]) ?? w.meanings[0],
            tone: t,
          });
        }
      }
    }
    if (out.length >= 6) return out;
    return [
      { char: '妈', pinyin: 'mā', meaning: isRu ? 'мама' : 'mom', tone: 1 },
      { char: '茶', pinyin: 'chá', meaning: isRu ? 'чай' : 'tea', tone: 2 },
      { char: '好', pinyin: 'hǎo', meaning: isRu ? 'хороший' : 'good', tone: 3 },
      { char: '爱', pinyin: 'ài', meaning: isRu ? 'любить' : 'love', tone: 4 },
      { char: '八', pinyin: 'bā', meaning: isRu ? 'восемь' : 'eight', tone: 1 },
      { char: '人', pinyin: 'rén', meaning: isRu ? 'человек' : 'person', tone: 2 },
      { char: '水', pinyin: 'shuǐ', meaning: isRu ? 'вода' : 'water', tone: 3 },
      { char: '去', pinyin: 'qù', meaning: isRu ? 'идти' : 'go', tone: 4 },
    ];
  }, [isRu, vocabWords]);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [round, setRound] = useState<ToneRound>(singleToneItems[0]);
  const [revealed, setRevealed] = useState<{ picked?: number; ok: boolean } | null>(null);
  const [swipePath, setSwipePath] = useState<Array<{ x: number; y: number }>>([]);

  const timerRef = useRef<number | null>(null);
  const frozenRef = useRef(false);
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const loadNext = useCallback(
    (prevChar?: string) => {
      const candidates =
        singleToneItems.length > 1 && prevChar
          ? singleToneItems.filter((i) => i.char !== prevChar)
          : singleToneItems;
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      setRound(next);
      setTimeLeft(ROUND_SEC);
      setRevealed(null);
      setSwipePath([]);
      frozenRef.current = false;
      onSpeak(next.char, 0.9);
    },
    [onSpeak, singleToneItems]
  );

  const startGame = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setScore(0);
    setHearts(MAX_HEARTS);
    setStreak(0);
    setSolvedCount(0);
    setGameState('PLAYING');
    loadNext();
  }, [loadNext]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const id = window.setInterval(() => {
      if (frozenRef.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          frozenRef.current = true;
          playErrorSound(false);
          setStreak(0);
          setRevealed({ ok: false });
          setHearts((h) => {
            const nh = h - 1;
            timerRef.current = window.setTimeout(() => {
              if (nh <= 0) {
                playGameOverSound(false);
                setGameState('GAME_OVER');
              } else {
                loadNext(round.char);
              }
            }, 1150);
            return nh;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameState, loadNext, round.char]);

  const submitTone = useCallback(
    (toneGuess: 1 | 2 | 3 | 4) => {
      if (frozenRef.current || gameState !== 'PLAYING') return;
      frozenRef.current = true;

      if (toneGuess === round.tone) {
        playSuccessSound(false);
        const gained = 15 + timeLeft * 2;
        setStreak((s) => s + 1);
        setSolvedCount((c) => c + 1);
        setScore((prev) => {
          const next = prev + gained;
          setBestScore((b) => {
            const nb = Math.max(b, next);
            if (nb > b) saveBest(nb);
            return nb;
          });
          return next;
        });
        setRevealed({ picked: toneGuess, ok: true });
        timerRef.current = window.setTimeout(() => loadNext(round.char), 900);
      } else {
        playErrorSound(false);
        setStreak(0);
        setRevealed({ picked: toneGuess, ok: false });
        setHearts((h) => {
          const nh = h - 1;
          timerRef.current = window.setTimeout(() => {
            if (nh <= 0) {
              playGameOverSound(false);
              setGameState('GAME_OVER');
            } else {
              loadNext(round.char);
            }
          }, 1200);
          return nh;
        });
      }
    },
    [gameState, loadNext, round.char, round.tone, timeLeft]
  );

  // Gesture classifier for drawing tone curves on the central card:
  // 1: mostly horizontal; 2: goes up; 3: dips down then up; 4: drops down
  const classifySwipeGesture = (pts: Array<{ x: number; y: number }>): (1 | 2 | 3 | 4) | null => {
    if (pts.length < 4) return null;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const dx = Math.abs(last.x - first.x);
    const dyTotal = last.y - first.y; // + is downward in screen coords
    const ys = pts.map((p) => p.y);
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    const spanY = maxY - minY;

    // Check V-dip (tone 3): middle sinks noticeably lower (larger y) than both start and end
    const maxIdx = ys.indexOf(maxY);
    if (
      maxIdx > 1 &&
      maxIdx < pts.length - 2 &&
      maxY - first.y > 22 &&
      maxY - last.y > 18
    ) {
      return 3;
    }
    if (spanY < 26 && dx > 34) {
      return 1;
    }
    if (dyTotal < -28) {
      return 2;
    }
    if (dyTotal > 28) {
      return 4;
    }
    return null;
  };

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (frozenRef.current || gameState !== 'PLAYING') return;
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointsRef.current = [pt];
    setSwipePath([pt]);
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointsRef.current.length === 0 || frozenRef.current || gameState !== 'PLAYING') return;
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointsRef.current = [...pointsRef.current, pt];
    setSwipePath(pointsRef.current);
  };

  const handlePadPointerUp = () => {
    if (pointsRef.current.length === 0) return;
    const guess = classifySwipeGesture(pointsRef.current);
    pointsRef.current = [];
    if (guess) {
      submitTone(guess);
    } else {
      setSwipePath([]);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (gameState !== 'PLAYING') return;
      if (e.key === '1') submitTone(1);
      if (e.key === '2') submitTone(2);
      if (e.key === '3') submitTone(3);
      if (e.key === '4') submitTone(4);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, onClose, submitTone]);

  const toneButtons: Array<{
    tone: 1 | 2 | 3 | 4;
    label: string;
    path: string;
    color: string;
  }> = [
    {
      tone: 1,
      label: isRu ? '1 · Ровный' : '1 · Flat',
      path: 'M 8 20 L 56 20',
      color: 'text-rose-600 dark:text-rose-400',
    },
    {
      tone: 2,
      label: isRu ? '2 · Вверх' : '2 · Rising',
      path: 'M 10 30 L 54 10',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      tone: 3,
      label: isRu ? '3 · Галочка' : '3 · Dipping',
      path: 'M 8 16 L 30 32 L 56 12',
      color: 'text-sky-600 dark:text-sky-400',
    },
    {
      tone: 4,
      label: isRu ? '4 · Вниз' : '4 · Falling',
      path: 'M 10 10 L 54 30',
      color: 'text-violet-600 dark:text-violet-400',
    },
  ];

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

      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 overflow-y-auto">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                {isRu ? 'Аркада запоминания · Игра 9' : 'Memory Arcade · Game 9'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isRu ? 'Башня тонов' : 'Tone Coaster'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Слушайте слог и свайпайте прямо на карточке нужную траекторию тона (ровно, вверх, галочка, вниз) — или нажимайте на одну из 4 горок внизу.'
                  : 'Listen to the character and swipe its tone contour right across the pad (flat, rising, dipping, falling) — or tap one of the 4 tone tracks below.'}
              </p>
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
              {isRu ? 'Игра окончена' : 'Game Over'}
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
                  {solvedCount}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Угадано' : 'Solved'}
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
                {isRu ? 'Играть снова' : 'Play Again'}
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
          <div className="my-auto space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                  <Waves className="h-4 w-4" />
                  {isRu
                    ? 'Проведите линию тона по полю или выберите внизу'
                    : 'Draw the tone curve or tap a track below'}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    timeLeft <= 3 ? 'bg-rose-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
                />
              </div>
            </div>

            {/* Interactive Swipe Pad */}
            <div
              ref={padRef}
              onPointerDown={handlePadPointerDown}
              onPointerMove={handlePadPointerMove}
              onPointerUp={handlePadPointerUp}
              onPointerCancel={handlePadPointerUp}
              className="glass-surface relative flex min-h-[210px] sm:min-h-[240px] flex-col items-center justify-center rounded-3xl p-6 text-center touch-none overflow-hidden"
            >
              {swipePath.length > 1 && (
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-teal-500/80"
                    points={swipePath.map((p) => `${p.x},${p.y}`).join(' ')}
                  />
                </svg>
              )}

              <span className="font-hanzi text-7xl sm:text-8xl font-bold leading-none text-slate-900 dark:text-white">
                {round.char}
              </span>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                {revealed ? `${round.pinyin} · ${round.meaning}` : round.meaning}
              </p>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSpeak(round.char, 0.85)}
                className="glass-subtle mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-teal-700 dark:text-teal-300"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {isRu ? 'Повторить звук' : 'Replay Sound'}
              </button>
            </div>

            {/* 4 Tone Curve Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {toneButtons.map((btn) => {
                const isRight = revealed && btn.tone === round.tone;
                const isWrongPick =
                  revealed && !revealed.ok && revealed.picked === btn.tone;
                return (
                  <button
                    key={btn.tone}
                    type="button"
                    onClick={() => submitTone(btn.tone)}
                    className={`glass-surface flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2.5 transition-all active:scale-95 ${
                      isRight
                        ? 'border-emerald-500 bg-emerald-500/15'
                        : isWrongPick
                          ? 'border-rose-500 bg-rose-500/15'
                          : 'border-transparent hover:border-teal-500/40'
                    }`}
                  >
                    <svg className={`h-8 w-16 ${btn.color}`} viewBox="0 0 64 40">
                      <path
                        d={btn.path}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
