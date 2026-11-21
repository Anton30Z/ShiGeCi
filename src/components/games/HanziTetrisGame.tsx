import {
  Flame,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RADICAL_BRICK_WORDS } from '../../data/radicalsCurriculum';
import { getWordMeanings, STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import {
  playErrorSound,
  playGameOverSound,
  playLineClearSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { ToneHanzi } from '../ToneHanzi';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type DeckChoice = 'hsk' | 'radicals' | 'mixed';
type SpeedMode = 'slow' | 'normal' | 'fast';

interface HanziTetrisGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  toneColorsEnabled: boolean;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface LockedTile {
  id: string;
  word: VocabWord;
  meaning: string;
  col: number;
  row: number; // 0 = bottom, MAX_ROWS - 1 = top
}

interface ActiveRound {
  roundId: string;
  word: VocabWord;
  col: number;
  options: Array<{ wordId: string; label: string; isCorrect: boolean }>;
  progress: number; // 0 (top) -> 1 (landing row top)
  fastDropping: boolean;
}

const COLS = 4;
const MAX_ROWS = 6;
const BEST_SCORE_KEY = 'shigeci_tetris_best_v1';

const SPEED_SECONDS: Record<SpeedMode, number> = {
  slow: 8.0,
  normal: 5.5,
  fast: 3.6,
};

function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // ignore quota error
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const HanziTetrisGame: React.FC<HanziTetrisGameProps> = ({
  vocabWords,
  language,
  toneColorsEnabled,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [deckChoice, setDeckChoice] = useState<DeckChoice>('hsk');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal');
  const [showPinyinHint, setShowPinyinHint] = useState(false);
  const [muted, setMuted] = useState(false);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [streak, setStreak] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [missedWords, setMissedWords] = useState<VocabWord[]>([]);

  const [lockedTiles, setLockedTiles] = useState<LockedTile[]>([]);
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong' | 'clear';
    text: string;
    selectedIdx?: number;
  } | null>(null);

  const lockedRef = useRef<LockedTile[]>([]);
  const activeRoundRef = useRef<ActiveRound | null>(null);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const caughtRef = useRef(0);
  const mutedRef = useRef(muted);
  const gameStateRef = useRef(gameState);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  mutedRef.current = muted;
  gameStateRef.current = gameState;

  const activePool = useMemo(() => {
    const baseHsk = vocabWords.length >= 4 ? vocabWords : STARTER_HSK1_WORDS;
    if (deckChoice === 'radicals') return RADICAL_BRICK_WORDS;
    if (deckChoice === 'mixed') return [...RADICAL_BRICK_WORDS, ...baseHsk];
    return baseHsk;
  }, [deckChoice, vocabWords]);

  const getColumnHeight = useCallback((tiles: LockedTile[], col: number) => {
    let maxRow = -1;
    for (const t of tiles) {
      if (t.col === col && t.row > maxRow) maxRow = t.row;
    }
    return maxRow + 1;
  }, []);

  const createRound = useCallback(
    (currentTiles: LockedTile[], prevWordId?: string): ActiveRound | null => {
      const availableCols: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (getColumnHeight(currentTiles, c) < MAX_ROWS) {
          availableCols.push(c);
        }
      }
      if (availableCols.length === 0) return null;

      // Prefer picking a non-repeating word
      const candidates =
        activePool.length > 1 && prevWordId
          ? activePool.filter((w) => w.id !== prevWordId)
          : activePool;
      const targetWord = pickRandom(candidates);
      const targetMeaning = getWordMeanings(targetWord, language)[0] ?? targetWord.simplified;

      // Pick 2 distinct distractors with different meaning text
      const distractors: Array<{ wordId: string; label: string; isCorrect: boolean }> = [];
      const shuffledOthers = shuffle(activePool.filter((w) => w.id !== targetWord.id));
      for (const candidate of shuffledOthers) {
        const label = getWordMeanings(candidate, language)[0] ?? candidate.simplified;
        if (
          label !== targetMeaning &&
          !distractors.some((d) => d.label === label)
        ) {
          distractors.push({ wordId: candidate.id, label, isCorrect: false });
          if (distractors.length === 2) break;
        }
      }

      const options = shuffle([
        { wordId: targetWord.id, label: targetMeaning, isCorrect: true },
        ...distractors,
      ]);

      return {
        roundId: `${Date.now()}-${Math.random()}`,
        word: targetWord,
        col: pickRandom(availableCols),
        options,
        progress: 0,
        fastDropping: false,
      };
    },
    [activePool, getColumnHeight, language]
  );

  const finishGame = useCallback(() => {
    setGameState('GAME_OVER');
    playGameOverSound(mutedRef.current);
    setBestScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next > prev) saveBestScore(next);
      return next;
    });
  }, []);

  const lockActiveRoundToStack = useCallback(
    (round: ActiveRound) => {
      const prevTiles = lockedRef.current;
      const colHeight = getColumnHeight(prevTiles, round.col);
      const targetRow = colHeight;
      const meaning = getWordMeanings(round.word, language)[0] ?? round.word.simplified;

      const newTile: LockedTile = {
        id: round.roundId,
        word: round.word,
        meaning,
        col: round.col,
        row: targetRow,
      };

      const nextTiles = [...prevTiles, newTile];
      lockedRef.current = nextTiles;
      setLockedTiles(nextTiles);
      setMissedWords((prev) => [round.word, ...prev]);

      streakRef.current = 0;
      setStreak(0);

      // Game over if column reached top (MAX_ROWS) or all columns are at MAX_ROWS
      const colOverflow = targetRow >= MAX_ROWS - 1;
      const allFull = Array.from({ length: COLS }, (_, c) => getColumnHeight(nextTiles, c)).every(
        (h) => h >= MAX_ROWS
      );

      if (colOverflow || allFull) {
        activeRoundRef.current = null;
        setActiveRound(null);
        finishGame();
        return;
      }

      const nextRound = createRound(nextTiles, round.word.id);
      activeRoundRef.current = nextRound;
      setActiveRound(nextRound);
      if (!nextRound) {
        finishGame();
      }
    },
    [createRound, finishGame, getColumnHeight, language]
  );

  const startGame = useCallback(() => {
    lockedRef.current = [];
    scoreRef.current = 0;
    streakRef.current = 0;
    caughtRef.current = 0;

    setLockedTiles([]);
    setScore(0);
    setStreak(0);
    setCaughtCount(0);
    setMissedWords([]);
    setFeedback(null);

    const first = createRound([]);
    activeRoundRef.current = first;
    setActiveRound(first);
    setGameState('PLAYING');
    lastFrameRef.current = performance.now();
  }, [createRound]);

  // Main 60fps animation loop
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

      const current = activeRoundRef.current;
      if (current) {
        const baseSec = SPEED_SECONDS[speedMode];
        // Gentle acceleration as caughtCount grows, never faster than 2.2s
        const effectiveSec = Math.max(2.2, baseSec - caughtRef.current * 0.055);
        const speedPerSec = current.fastDropping ? 7.5 : 1 / effectiveSec;
        const nextProgress = current.progress + speedPerSec * dt;

        if (nextProgress >= 1) {
          if (!current.fastDropping) {
            playErrorSound(mutedRef.current);
            const rightLabel =
              getWordMeanings(current.word, language)[0] ?? current.word.simplified;
            setFeedback({
              type: 'wrong',
              text: `${current.word.simplified} — ${rightLabel}`,
            });
          }
          lockActiveRoundToStack(current);
        } else {
          const updated = { ...current, progress: nextProgress };
          activeRoundRef.current = updated;
          setActiveRound(updated);
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
  }, [gameState, language, lockActiveRoundToStack, speedMode]);

  const handleChooseOption = useCallback(
    (idx: number) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const current = activeRoundRef.current;
      if (!current || current.fastDropping) return;

      const chosen = current.options[idx];
      if (!chosen) return;

      if (chosen.isCorrect) {
        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);

        const nextCaught = caughtRef.current + 1;
        caughtRef.current = nextCaught;
        setCaughtCount(nextCaught);

        const bonus = Math.min(4, Math.floor((nextStreak - 1) / 3));
        const nextScore = scoreRef.current + 10 + bonus * 5;
        scoreRef.current = nextScore;
        setScore(nextScore);

        setBestScore((prev) => {
          const next = Math.max(prev, nextScore);
          if (next > prev) saveBestScore(next);
          return next;
        });

        // Every 5-in-a-row streak clears bottom row of locked tiles (Tetris line clear!)
        let tilesAfterClear = lockedRef.current;
        if (nextStreak % 5 === 0 && tilesAfterClear.length > 0) {
          tilesAfterClear = tilesAfterClear
            .filter((t) => t.row > 0)
            .map((t) => ({ ...t, row: t.row - 1 }));
          lockedRef.current = tilesAfterClear;
          setLockedTiles(tilesAfterClear);
          playLineClearSound(mutedRef.current);
          setFeedback({
            type: 'clear',
            text: isRu ? 'Комбо x5! Нижний ряд очищен' : 'Combo x5! Bottom row cleared',
            selectedIdx: idx,
          });
        } else {
          playSuccessSound(mutedRef.current);
          setFeedback({
            type: 'correct',
            text: `${current.word.simplified} (${current.word.pinyin})`,
            selectedIdx: idx,
          });
        }

        if (!mutedRef.current) {
          onSpeak(current.word.simplified);
        }

        const nextRound = createRound(tilesAfterClear, current.word.id);
        activeRoundRef.current = nextRound;
        setActiveRound(nextRound);
      } else {
        // Wrong choice -> immediately drop the tile to the bottom stack and lock it!
        playErrorSound(mutedRef.current);
        const rightLabel =
          getWordMeanings(current.word, language)[0] ?? current.word.simplified;
        setFeedback({
          type: 'wrong',
          text: `${current.word.simplified} = ${rightLabel}`,
          selectedIdx: idx,
        });

        const dropping = { ...current, fastDropping: true };
        activeRoundRef.current = dropping;
        setActiveRound(dropping);
      }
    },
    [createRound, isRu, language, onSpeak]
  );

  // Clear feedback toast shortly after
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 1300);
    return () => clearTimeout(t);
  }, [feedback]);

  // Keyboard shortcuts 1 / 2 / 3 / Space / Esc
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (gameStateRef.current === 'PLAYING') {
        if (e.key === '1') handleChooseOption(0);
        else if (e.key === '2') handleChooseOption(1);
        else if (e.key === '3') handleChooseOption(2);
        else if (e.key === ' ') {
          e.preventDefault();
          setGameState('PAUSED');
        }
      } else if (gameStateRef.current === 'PAUSED' && e.key === ' ') {
        e.preventDefault();
        setGameState('PLAYING');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChooseOption, onClose]);

  const activeFloorRows = activeRound ? getColumnHeight(lockedTiles, activeRound.col) : 0;

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-[#f3f7f9] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 select-none overflow-hidden">
      {/* Top HUD */}
      <header className="glass-nav shrink-0 border-b px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
          >
            <X className="h-4 w-4" />
            {isRu ? 'Выход' : 'Exit'}
          </button>

          <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
            <span className="font-mono-num text-teal-700 dark:text-teal-300">
              {isRu ? 'Счёт' : 'Score'}: {score}
            </span>
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 font-mono-num text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5" />
                x{streak}
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 font-mono-num text-slate-500 dark:text-slate-400">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              {bestScore}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="glass-subtle inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <button
                type="button"
                onClick={() =>
                  setGameState((s) => (s === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
                }
                className="glass-subtle inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
                aria-label={gameState === 'PLAYING' ? 'Pause' : 'Resume'}
              >
                {gameState === 'PLAYING' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {isRu ? 'Аркада запоминания · Игра 1' : 'Memory Arcade · Game 1'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                {isRu ? 'Тетрис · Shi Ge Ci' : 'Shi Ge Ci · Tetris Drop'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Сверху падает иероглиф, снизу — 3 варианта перевода. Успейте выбрать верный до падения. Ошибка или таймаут — блок падает и остаётся в стакане. 5 верных подряд очищают нижний ряд.'
                  : 'A character falls from the top while 3 translations appear below. Tap the right meaning before it lands. Mistakes stack up in the well — 5 in a row clears the bottom row.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRu ? 'Набор карточек' : 'Card Deck'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['hsk', isRu ? 'Слова HSK' : 'HSK Words'],
                      ['radicals', isRu ? '30 ключей' : '30 Radicals'],
                      ['mixed', isRu ? 'Всё вместе' : 'Mixed'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDeckChoice(id)}
                      className={`min-h-[44px] rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                        deckChoice === id
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                          : 'glass-subtle text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRu ? 'Скорость падения' : 'Drop Speed'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['slow', isRu ? 'Спокойно' : 'Relaxed'],
                      ['normal', isRu ? 'Норма' : 'Normal'],
                      ['fast', isRu ? 'Быстро' : 'Fast'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSpeedMode(id)}
                      className={`min-h-[44px] rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                        speedMode === id
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                          : 'glass-subtle text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3 dark:bg-white/5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isRu ? 'Показывать пиньинь на падающем знаке' : 'Show Pinyin on falling tile'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinyinHint((v) => !v)}
                  className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold transition-colors ${
                    showPinyinHint
                      ? 'bg-teal-600 text-white'
                      : 'glass-subtle text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {showPinyinHint ? (isRu ? 'Вкл' : 'On') : isRu ? 'Выкл' : 'Off'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-num">
                <Trophy className="h-4 w-4 text-amber-500" />
                {isRu ? 'Рекорд' : 'Best'}: {bestScore}
              </span>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4" />
                {isRu ? 'Начать игру' : 'Start Game'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tetris Well */}
            <div className="relative flex-1 min-h-0 rounded-3xl border border-slate-900/10 bg-white/70 p-2 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 overflow-hidden">
              {/* Top danger line (Row 6 ceiling) */}
              <div
                className="pointer-events-none absolute left-2 right-2 z-10 flex items-center justify-between border-b border-dashed border-rose-500/45 px-2 pb-0.5 text-[10px] font-semibold text-rose-600/80 dark:text-rose-400/80"
                style={{ top: `${(1 / MAX_ROWS) * 100}%` }}
              >
                <span>{isRu ? 'Граница переполнения' : 'Overflow limit'}</span>
                <span className="font-mono-num">
                  {lockedTiles.length} / {COLS * MAX_ROWS}
                </span>
              </div>

              {/* Background Tetris Grid */}
              <div
                className="grid h-full w-full gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${MAX_ROWS}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: COLS * MAX_ROWS }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-900/[0.04] bg-slate-900/[0.02] dark:border-white/[0.04] dark:bg-white/[0.02]"
                  />
                ))}
              </div>

              {/* Feedback Toast inside well */}
              {feedback && (
                <div
                  className={`pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md whitespace-nowrap ${
                    feedback.type === 'clear'
                      ? 'bg-emerald-600 text-white'
                      : feedback.type === 'correct'
                        ? 'bg-teal-600 text-white'
                        : 'bg-rose-600 text-white'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              {/* Locked Fallen Tiles */}
              <div className="pointer-events-none absolute inset-2">
                {lockedTiles.map((tile) => {
                  const colPct = 100 / COLS;
                  const rowPct = 100 / MAX_ROWS;
                  const topPct = (MAX_ROWS - 1 - tile.row) * rowPct;
                  return (
                    <div
                      key={tile.id}
                      className="absolute p-1 transition-[top] duration-200"
                      style={{
                        left: `${tile.col * colPct}%`,
                        width: `${colPct}%`,
                        top: `${topPct}%`,
                        height: `${rowPct}%`,
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/12 px-1 text-center shadow-sm dark:border-rose-400/30 dark:bg-rose-950/60">
                        <span className="font-hanzi text-lg sm:text-2xl font-bold leading-none text-slate-900 dark:text-white">
                          <ToneHanzi
                            simplified={tile.word.simplified}
                            pinyin={tile.word.pinyin}
                            numericPinyin={tile.word.numericPinyin}
                            toneColorsEnabled={toneColorsEnabled}
                          />
                        </span>
                        <span className="mt-0.5 max-w-full truncate text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {tile.meaning}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Active Falling Tile */}
                {activeRound && gameState === 'PLAYING' && (
                  <div
                    className="absolute p-1 will-change-transform"
                    style={{
                      left: `${activeRound.col * (100 / COLS)}%`,
                      width: `${100 / COLS}%`,
                      height: `${100 / MAX_ROWS}%`,
                      top: 0,
                      transform: `translate3d(0, ${
                        (-0.45 +
                          activeRound.progress * (MAX_ROWS - 1 - activeFloorRows + 0.45)) *
                        100
                      }%, 0)`,
                    }}
                  >
                    <div
                      className={`flex h-full w-full flex-col items-center justify-center rounded-xl border-2 px-1 text-center shadow-lg ${
                        activeRound.fastDropping
                          ? 'border-rose-500 bg-rose-500/20 dark:bg-rose-900/70'
                          : 'border-teal-500 bg-white dark:border-teal-400 dark:bg-slate-800'
                      }`}
                    >
                      <span className="font-hanzi text-2xl sm:text-3xl font-bold leading-none text-slate-900 dark:text-white">
                        <ToneHanzi
                          simplified={activeRound.word.simplified}
                          pinyin={activeRound.word.pinyin}
                          numericPinyin={activeRound.word.numericPinyin}
                          toneColorsEnabled={toneColorsEnabled}
                        />
                      </span>
                      {showPinyinHint && (
                        <span className="mt-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                          {activeRound.word.pinyin}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pause Overlay */}
              {gameState === 'PAUSED' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-slate-900/45 backdrop-blur-sm">
                  <p className="text-xl font-bold text-white">
                    {isRu ? 'Пауза' : 'Paused'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setGameState('PLAYING')}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
                  >
                    <Play className="h-4 w-4" />
                    {isRu ? 'Продолжить' : 'Resume'}
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
                  <div className="glass-surface w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 max-h-full overflow-y-auto">
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {isRu ? 'Экран заполнен' : 'Well Overflowed'}
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isRu ? 'Игра окончена' : 'Game Over'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
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
                          {caughtCount}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isRu ? 'Поймано' : 'Caught'}
                        </p>
                      </div>
                    </div>

                    {missedWords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {isRu ? 'Упавшие слова (нажмите для звука):' : 'Missed words (tap to listen):'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {missedWords.slice(0, 12).map((w, idx) => (
                            <button
                              key={`${w.id}-${idx}`}
                              type="button"
                              onClick={() => onSpeak(w.simplified)}
                              className="glass-subtle inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs hover:bg-white dark:hover:bg-slate-800"
                            >
                              <span className="font-hanzi font-bold text-sm">
                                {w.simplified}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {getWordMeanings(w, language)[0]}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startGame}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 whitespace-nowrap"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {isRu ? 'Играть снова' : 'Play Again'}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="glass-subtle inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                      >
                        {isRu ? 'Выход' : 'Exit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 3 Word Choices */}
            <div className="shrink-0 pb-safe">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(activeRound?.options ?? []).map((opt, idx) => (
                  <button
                    key={`${activeRound?.roundId}-${opt.wordId}-${idx}`}
                    type="button"
                    disabled={gameState !== 'PLAYING' || activeRound?.fastDropping}
                    onClick={() => handleChooseOption(idx)}
                    className="glass-surface flex min-h-[72px] sm:min-h-[80px] flex-col items-center justify-center rounded-2xl px-2.5 py-2.5 text-center transition-all hover:bg-white active:scale-[0.97] disabled:opacity-60 dark:hover:bg-slate-800/90"
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {opt.label}
                    </span>
                    <span className="mt-1 hidden sm:inline text-[10px] font-mono-num text-slate-400">
                      [{idx + 1}]
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
