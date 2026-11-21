import {
  Crosshair,
  Flame,
  Heart,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWordMeanings, STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import {
  playErrorSound,
  playGameOverSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface AudioShooterGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface TargetBubble {
  word: VocabWord;
  isCorrect: boolean;
  lane: number; // 0..3
  y: number; // 0..1
  speed: number;
  state: 'active' | 'hit-wrong' | 'hit-right';
}

const MAX_HEARTS = 5;
const BEST_KEY = 'shigeci_audio_best_v1';

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

export const AudioShooterGame: React.FC<AudioShooterGameProps> = ({
  vocabWords,
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';
  const pool = useMemo(
    () => (vocabWords.length >= 6 ? vocabWords : STARTER_HSK1_WORDS),
    [vocabWords]
  );

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [muted, setMuted] = useState(false);

  const [targetWord, setTargetWord] = useState<VocabWord | null>(null);
  const [targets, setTargets] = useState<TargetBubble[]>([]);
  const [roundFeedback, setRoundFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [missedWords, setMissedWords] = useState<VocabWord[]>([]);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaHeight, setArenaHeight] = useState(340);

  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const streakRef = useRef(0);
  const mutedRef = useRef(muted);
  const targetsRef = useRef<TargetBubble[]>([]);
  const targetWordRef = useRef<VocabWord | null>(null);
  const lockedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  gameStateRef.current = gameState;
  mutedRef.current = muted;

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientHeight > 0) setArenaHeight(el.clientHeight);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const finishGame = useCallback(() => {
    lockedRef.current = true;
    setGameState('GAME_OVER');
    playGameOverSound(mutedRef.current);
    setBestScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next > prev) saveBest(next);
      return next;
    });
  }, []);

  const spawnRound = useCallback(
    (prevId?: string) => {
      const candidates =
        pool.length > 1 && prevId ? pool.filter((w) => w.id !== prevId) : pool;
      const target = candidates[Math.floor(Math.random() * candidates.length)];

      // Prefer distractors with similar plainPinyin or same char count
      const others = shuffle(pool.filter((w) => w.id !== target.id));
      const sameLen = others.filter(
        (w) => w.simplified.length === target.simplified.length
      );
      const picked = [...sameLen, ...others]
        .filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i)
        .slice(0, 3);

      const lanes = shuffle([0, 1, 2, 3]);
      const items = shuffle([target, ...picked]).map((w, idx) => ({
        word: w,
        isCorrect: w.id === target.id,
        lane: lanes[idx],
        y: 0.04 + (idx % 2) * 0.08,
        speed: 0.12 + Math.random() * 0.035 + Math.min(0.08, hits * 0.003),
        state: 'active' as const,
      }));

      lockedRef.current = false;
      targetWordRef.current = target;
      setTargetWord(target);
      targetsRef.current = items;
      setTargets(items);
      setRoundFeedback(null);

      onSpeak(target.simplified, 0.95);
    },
    [hits, onSpeak, pool]
  );

  const startGame = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    scoreRef.current = 0;
    heartsRef.current = MAX_HEARTS;
    streakRef.current = 0;

    setScore(0);
    setHearts(MAX_HEARTS);
    setStreak(0);
    setHits(0);
    setMissedWords([]);
    setGameState('PLAYING');
    spawnRound();
  }, [spawnRound]);

  const handleMissRound = useCallback(
    (missed: VocabWord) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      playErrorSound(mutedRef.current);
      streakRef.current = 0;
      setStreak(0);
      setMissedWords((prev) => [missed, ...prev]);

      const nextHearts = Math.max(0, heartsRef.current - 1);
      heartsRef.current = nextHearts;
      setHearts(nextHearts);
      setRoundFeedback({
        ok: false,
        text: `${missed.simplified} (${missed.pinyin}) — ${getWordMeanings(missed, language)[0]}`,
      });

      timerRef.current = window.setTimeout(() => {
        if (gameStateRef.current !== 'PLAYING') return;
        if (nextHearts <= 0) {
          finishGame();
        } else {
          spawnRound(missed.id);
        }
      }, 950);
    },
    [finishGame, language, spawnRound]
  );

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastFrameRef.current = performance.now();
    const tick = (now: number) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const dt = Math.min(0.08, Math.max(0, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      if (!lockedRef.current && targetWordRef.current) {
        const nextTargets = targetsRef.current.map((t) => ({
          ...t,
          y: t.y + t.speed * dt,
        }));
        const correctBubble = nextTargets.find((t) => t.isCorrect);
        targetsRef.current = nextTargets;
        setTargets(nextTargets);

        if (correctBubble && correctBubble.y >= 1) {
          handleMissRound(targetWordRef.current);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [gameState, handleMissRound]);

  const handleShootTarget = useCallback(
    (wordId: string) => {
      if (gameStateRef.current !== 'PLAYING' || lockedRef.current) return;
      const currentTarget = targetWordRef.current;
      if (!currentTarget) return;

      const clicked = targetsRef.current.find((t) => t.word.id === wordId);
      if (!clicked || clicked.state !== 'active') return;

      if (clicked.isCorrect) {
        lockedRef.current = true;
        playSuccessSound(mutedRef.current);

        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);
        setHits((h) => h + 1);

        const nextScore = scoreRef.current + 15 + Math.min(20, (nextStreak - 1) * 5);
        scoreRef.current = nextScore;
        setScore(nextScore);
        setBestScore((prev) => {
          const next = Math.max(prev, nextScore);
          if (next > prev) saveBest(next);
          return next;
        });

        targetsRef.current = targetsRef.current.map((t) =>
          t.word.id === wordId ? { ...t, state: 'hit-right' } : t
        );
        setTargets(targetsRef.current);
        setRoundFeedback({
          ok: true,
          text: `${currentTarget.simplified} (${currentTarget.pinyin}) · ${getWordMeanings(currentTarget, language)[0]}`,
        });

        timerRef.current = window.setTimeout(() => {
          if (gameStateRef.current === 'PLAYING') spawnRound(currentTarget.id);
        }, 720);
      } else {
        playErrorSound(mutedRef.current);
        streakRef.current = 0;
        setStreak(0);
        const nextHearts = Math.max(0, heartsRef.current - 1);
        heartsRef.current = nextHearts;
        setHearts(nextHearts);

        targetsRef.current = targetsRef.current.map((t) =>
          t.word.id === wordId ? { ...t, state: 'hit-wrong' } : t
        );
        setTargets(targetsRef.current);

        if (nextHearts <= 0) {
          setMissedWords((prev) => [currentTarget, ...prev]);
          finishGame();
        }
      }
    },
    [finishGame, language, spawnRound]
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
            className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
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
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                    idx < hearts
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="glass-subtle inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {isRu ? 'Аркада запоминания · Игра 3' : 'Memory Arcade · Game 3'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isRu ? 'Звуковой тир' : 'Audio Target Shoot'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Слушайте китайское слово и успейте «сбить» правильный иероглиф среди 4 движущихся мишеней, пока он не ушёл за нижнюю границу.'
                  : 'Listen to the spoken Mandarin word and hit the matching character among 4 descending targets before it escapes.'}
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
        ) : (
          <>
            {/* Audio Control Bar */}
            {targetWord && (
              <div className="glass-surface shrink-0 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Crosshair className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>
                    {isRu ? 'Сбейте прозвучавший иероглиф' : 'Tap the word you just heard'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSpeak(targetWord.simplified, 1.0)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    1.0x
                  </button>
                  <button
                    type="button"
                    onClick={() => onSpeak(targetWord.simplified, 0.7)}
                    className="glass-subtle inline-flex min-h-[40px] items-center rounded-xl px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    0.7x
                  </button>
                </div>
              </div>
            )}

            {/* Target Arena */}
            <div
              ref={arenaRef}
              className="relative flex-1 min-h-0 rounded-3xl border border-slate-900/10 bg-white/70 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 overflow-hidden"
            >
              {targets.map((item) => {
                const leftPct = ((item.lane + 0.5) / 4) * 100;
                const yPx = item.y * Math.max(180, arenaHeight - 84);
                return (
                  <button
                    key={item.word.id}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShootTarget(item.word.id);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      top: 0,
                      transform: `translate3d(-50%, ${yPx}px, 0)`,
                    }}
                    className={`absolute top-0 flex min-h-[68px] min-w-[74px] sm:min-w-[88px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-2 font-hanzi font-bold shadow-lg transition-colors active:scale-95 ${
                      item.state === 'hit-right'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : item.state === 'hit-wrong'
                          ? 'border-rose-500 bg-rose-500/20 text-rose-600 opacity-45'
                          : 'border-teal-500/40 bg-white text-slate-900 hover:border-teal-500 dark:border-teal-400/40 dark:bg-slate-800 dark:text-white'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl leading-none">
                      {item.word.simplified}
                    </span>
                  </button>
                );
              })}

              {roundFeedback && (
                <div
                  className={`pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl px-4 py-2 text-xs font-semibold text-white shadow-xl whitespace-nowrap ${
                    roundFeedback.ok ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {roundFeedback.text}
                </div>
              )}

              {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
                  <div className="glass-surface w-full max-w-md rounded-3xl p-6 space-y-4 text-center">
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
                          {hits}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isRu ? 'Попаданий' : 'Hits'}
                        </p>
                      </div>
                    </div>

                    {missedWords.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
                        {missedWords.slice(0, 8).map((w, i) => (
                          <button
                            key={`${w.id}-${i}`}
                            type="button"
                            onClick={() => onSpeak(w.simplified)}
                            className="glass-subtle rounded-xl px-2.5 py-1 text-xs font-semibold"
                          >
                            {w.simplified} · {getWordMeanings(w, language)[0]}
                          </button>
                        ))}
                      </div>
                    )}

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
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
