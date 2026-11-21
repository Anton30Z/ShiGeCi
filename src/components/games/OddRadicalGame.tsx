import {
  Flame,
  Heart,
  Play,
  RotateCcw,
  SearchX,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ODD_RADICAL_ROUNDS, type OddRadicalRound } from '../../data/miniGamesData';
import {
  playErrorSound,
  playGameOverSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode } from '../../types/vocab';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface OddRadicalGameProps {
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface CardChoice {
  char: string;
  pinyin: string;
  meaning: string;
  isOdd: boolean;
  oddRadical?: string;
}

const MAX_HEARTS = 3;
const ROUND_SEC = 10;
const BEST_KEY = 'shigeci_odd_best_v1';

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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const OddRadicalGame: React.FC<OddRadicalGameProps> = ({
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);

  const [round, setRound] = useState<OddRadicalRound>(ODD_RADICAL_ROUNDS[0]);
  const [choices, setChoices] = useState<CardChoice[]>([]);
  const [revealed, setRevealed] = useState<{ pickedChar?: string; ok: boolean } | null>(null);

  const timerRef = useRef<number | null>(null);
  const frozenRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const loadNext = useCallback(
    (prevId?: string) => {
      const candidates = prevId
        ? ODD_RADICAL_ROUNDS.filter((r) => r.id !== prevId)
        : ODD_RADICAL_ROUNDS;
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      const cards: CardChoice[] = shuffle([
        ...next.sameThree.map((item) => ({
          char: item.char,
          pinyin: item.pinyin,
          meaning: isRu ? item.ru : item.en,
          isOdd: false,
        })),
        {
          char: next.oddOne.char,
          pinyin: next.oddOne.pinyin,
          meaning: isRu ? next.oddOne.ru : next.oddOne.en,
          isOdd: true,
          oddRadical: next.oddOne.oddRadical,
        },
      ]);
      setRound(next);
      setChoices(cards);
      setTimeLeft(ROUND_SEC);
      setRevealed(null);
      frozenRef.current = false;
    },
    [isRu]
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
                loadNext(round.id);
              }
            }, 1300);
            return nh;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameState, loadNext, round.id]);

  const handlePick = useCallback(
    (card: CardChoice) => {
      if (frozenRef.current || gameState !== 'PLAYING') return;
      frozenRef.current = true;
      onSpeak(card.char);

      if (card.isOdd) {
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
        setRevealed({ pickedChar: card.char, ok: true });
        timerRef.current = window.setTimeout(() => loadNext(round.id), 1250);
      } else {
        playErrorSound(false);
        setStreak(0);
        setRevealed({ pickedChar: card.char, ok: false });
        setHearts((h) => {
          const nh = h - 1;
          timerRef.current = window.setTimeout(() => {
            if (nh <= 0) {
              playGameOverSound(false);
              setGameState('GAME_OVER');
            } else {
              loadNext(round.id);
            }
          }, 1450);
          return nh;
        });
      }
    },
    [gameState, loadNext, onSpeak, round.id, timeLeft]
  );

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

      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-4 px-4 py-4 sm:px-6 overflow-y-auto">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {isRu ? 'Аркада запоминания · Игра 6' : 'Memory Arcade · Game 6'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isRu ? 'Охота на лишний ключ' : 'Odd Radical Out'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'На экране 4 иероглифа: три из них объединены общим смысловым ключом-кирпичиком, а четвёртый — из другой семьи. Найдите лишний за 10 секунд!'
                  : 'Four characters appear: three share the same semantic radical brick while one does not belong. Spot the odd one within 10 seconds!'}
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
                  {isRu ? 'Решено' : 'Solved'}
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
          <div className="my-auto space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <SearchX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {isRu
                    ? 'Какой иероглиф здесь с другим ключом?'
                    : 'Which character has a different radical?'}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    timeLeft <= 3 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {choices.map((card) => {
                const isPicked = revealed?.pickedChar === card.char;
                return (
                  <button
                    key={card.char}
                    type="button"
                    onClick={() => handlePick(card)}
                    className={`glass-surface flex min-h-[144px] sm:min-h-[168px] flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 transition-all active:scale-95 ${
                      revealed
                        ? card.isOdd
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : isPicked
                            ? 'border-rose-500 bg-rose-500/15'
                            : 'border-transparent opacity-75'
                        : 'border-transparent hover:border-teal-500/40'
                    }`}
                  >
                    <span className="font-hanzi text-6xl sm:text-7xl font-bold leading-none text-slate-900 dark:text-white">
                      {card.char}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Volume2 className="h-3 w-3" />
                      {card.pinyin} · {card.meaning}
                    </span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div
                className={`rounded-2xl p-3.5 text-center text-xs sm:text-sm font-semibold text-white ${
                  revealed.ok ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isRu
                  ? `Три знака содержат ключ ${round.radical} (${round.radicalNameRu}), а лишний ${round.oddOne.char} имеет ключ ${round.oddOne.oddRadical}.`
                  : `Three share radical ${round.radical} (${round.radicalNameEn}); ${round.oddOne.char} uses ${round.oddOne.oddRadical}.`}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
