import {
  ArrowRight,
  Flame,
  Heart,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BUILDER_STAGE1_PUZZLES,
  BUILDER_STAGE2_PUZZLES,
  BUILDER_STAGE4_SENTENCES,
  buildStage3WordPuzzles,
  STAGE1_DISTRACTORS,
  STAGE2_DISTRACTORS,
  STAGE4_DISTRACTORS,
  type BuilderPuzzle,
  type BuilderStageId,
} from '../../data/hanziBuilderData';
import {
  playErrorSound,
  playGameOverSound,
  playSnapSound,
  playStageUpSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type PathMode = 'progressive' | BuilderStageId;

interface HanziBuilderGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface FallingPiece {
  id: string;
  label: string;
  lane: number; // 0..3
  y: number; // -0.10 .. 1.05
  speed: number; // fraction of arena height per second
  state: 'falling' | 'wrong';
}

const LANE_COUNT = 4;
const MAX_HEARTS = 5;
const PUZZLES_PER_STAGE = 4;
const BEST_SCORE_KEY = 'shigeci_builder_best_v1';

const STAGE_TIME_LIMIT: Record<BuilderStageId, number> = {
  1: 22,
  2: 25,
  3: 28,
  4: 34,
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

const FALLBACK_PARTS = ['人', '口', '木', '日'];

export const HanziBuilderGame: React.FC<HanziBuilderGameProps> = ({
  vocabWords,
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';

  const stageNames: Record<BuilderStageId, string> = useMemo(
    () => ({
      1: isRu ? 'Этап 1 · Составные знаки' : 'Stage 1 · Composite Bricks',
      2: isRu ? 'Этап 2 · Обычные иероглифы' : 'Stage 2 · Everyday Characters',
      3: isRu ? 'Этап 3 · Слова из знаков' : 'Stage 3 · Words from Characters',
      4: isRu ? 'Этап 4 · Предложения' : 'Stage 4 · Sentences',
    }),
    [isRu]
  );

  const stage3Puzzles = useMemo(() => buildStage3WordPuzzles(vocabWords), [vocabWords]);

  const stage3Distractors = useMemo(() => {
    const chars = new Set<string>();
    for (const p of stage3Puzzles) {
      for (const ch of p.parts) chars.add(ch);
    }
    return Array.from(chars);
  }, [stage3Puzzles]);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [pathMode, setPathMode] = useState<PathMode>('progressive');
  const [showSlotHints, setShowSlotHints] = useState(true);
  const [muted, setMuted] = useState(false);

  const [currentStage, setCurrentStage] = useState<BuilderStageId>(1);
  const [stageSolved, setStageSolved] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);

  const [puzzle, setPuzzle] = useState<BuilderPuzzle | null>(null);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(22);
  const [pieces, setPieces] = useState<FallingPiece[]>([]);
  const [completedBanner, setCompletedBanner] = useState<{
    puzzle: BuilderPuzzle;
    success: boolean;
  } | null>(null);
  const [stageUpBanner, setStageUpBanner] = useState<BuilderStageId | null>(null);
  const [missedTargets, setMissedTargets] = useState<BuilderPuzzle[]>([]);

  // Refs for smooth 60fps loop
  const gameStateRef = useRef(gameState);
  const pathModeRef = useRef(pathMode);
  const currentStageRef = useRef<BuilderStageId>(currentStage);
  const stageSolvedRef = useRef(0);
  const scoreRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const streakRef = useRef(0);
  const mutedRef = useRef(muted);
  const puzzleRef = useRef<BuilderPuzzle | null>(null);
  const filledRef = useRef<(string | null)[]>([]);
  const piecesRef = useRef<FallingPiece[]>([]);
  const timeLeftRef = useRef(22);
  const spawnCooldownRef = useRef(0);
  const roundFrozenRef = useRef(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaHeight, setArenaHeight] = useState(360);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const lastFrameRef = useRef(0);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

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
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [gameState]);

  gameStateRef.current = gameState;
  pathModeRef.current = pathMode;
  mutedRef.current = muted;

  const getPoolForStage = useCallback(
    (stage: BuilderStageId): BuilderPuzzle[] => {
      if (stage === 1) return BUILDER_STAGE1_PUZZLES;
      if (stage === 2) return BUILDER_STAGE2_PUZZLES;
      if (stage === 3) return stage3Puzzles;
      return BUILDER_STAGE4_SENTENCES;
    },
    [stage3Puzzles]
  );

  const getDistractorsForStage = useCallback(
    (stage: BuilderStageId): string[] => {
      if (stage === 1) return STAGE1_DISTRACTORS;
      if (stage === 2) return STAGE2_DISTRACTORS;
      if (stage === 3) return stage3Distractors.length > 0 ? stage3Distractors : FALLBACK_PARTS;
      return STAGE4_DISTRACTORS;
    },
    [stage3Distractors]
  );

  const spawnPiece = useCallback(
    (curPuzzle: BuilderPuzzle, curFilled: (string | null)[], curPieces: FallingPiece[]) => {
      // Find lanes without a tile near the top
      const openLanes: number[] = [];
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        const hasNearTop = curPieces.some((p) => p.lane === lane && p.y < 0.24);
        if (!hasNearTop) openLanes.push(lane);
      }
      if (openLanes.length === 0) return curPieces;

      const lane = pickRandom(openLanes);

      // Compute which parts are still missing
      const missingParts: string[] = [];
      if (curPuzzle.strictOrder) {
        const nextIdx = curFilled.findIndex((s) => s === null);
        if (nextIdx >= 0) missingParts.push(curPuzzle.parts[nextIdx]);
      } else {
        curPuzzle.parts.forEach((part, idx) => {
          if (curFilled[idx] === null) missingParts.push(part);
        });
      }

      let chosenLabel: string;
      if (missingParts.length > 0) {
        const hasNeededOnScreen = curPieces.some(
          (p) => p.state === 'falling' && missingParts.includes(p.label)
        );
        // Guarantee needed piece spawns if none are on screen, otherwise ~52% chance
        const shouldSpawnNeeded = !hasNeededOnScreen || Math.random() < 0.52;
        if (shouldSpawnNeeded) {
          chosenLabel = curPuzzle.strictOrder ? missingParts[0] : pickRandom(missingParts);
        } else {
          const pool = getDistractorsForStage(curPuzzle.stage).filter(
            (d) => !missingParts.includes(d)
          );
          chosenLabel = pool.length > 0 ? pickRandom(pool) : missingParts[0];
        }
      } else {
        chosenLabel = pickRandom(getDistractorsForStage(curPuzzle.stage));
      }

      const baseSpeed =
        curPuzzle.stage === 1
          ? 0.23
          : curPuzzle.stage === 2
            ? 0.24
            : curPuzzle.stage === 3
              ? 0.23
              : 0.2;
      const speed = baseSpeed + Math.random() * 0.05;

      const nextPiece: FallingPiece = {
        id: `${Date.now()}-${Math.random()}`,
        label: chosenLabel,
        lane,
        y: -0.06,
        speed,
        state: 'falling',
      };

      return [...curPieces, nextPiece];
    },
    [getDistractorsForStage]
  );

  const loadPuzzle = useCallback(
    (stage: BuilderStageId, prevPuzzleId?: string) => {
      const pool = getPoolForStage(stage);
      const candidates =
        pool.length > 1 && prevPuzzleId
          ? pool.filter((p) => p.id !== prevPuzzleId)
          : pool;
      const next = pickRandom(candidates);
      const slots = next.parts.map(() => null);
      const limit = STAGE_TIME_LIMIT[stage];

      currentStageRef.current = stage;
      setCurrentStage(stage);
      puzzleRef.current = next;
      setPuzzle(next);
      filledRef.current = slots;
      setFilledSlots(slots);
      timeLeftRef.current = limit;
      setTimeLeft(limit);
      roundFrozenRef.current = false;
      setCompletedBanner(null);

      // Seed 2 initial pieces right away so sky isn't empty
      let initialPieces: FallingPiece[] = [];
      initialPieces = spawnPiece(next, slots, initialPieces);
      initialPieces = initialPieces.map((p) => ({ ...p, y: 0.08 }));
      initialPieces = spawnPiece(next, slots, initialPieces);
      piecesRef.current = initialPieces;
      setPieces(initialPieces);
      spawnCooldownRef.current = 0.7;
    },
    [getPoolForStage, spawnPiece]
  );

  const finishGame = useCallback(() => {
    roundFrozenRef.current = true;
    setGameState('GAME_OVER');
    playGameOverSound(mutedRef.current);
    setBestScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next > prev) saveBestScore(next);
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    const startStage: BuilderStageId = pathMode === 'progressive' ? 1 : pathMode;
    scoreRef.current = 0;
    heartsRef.current = MAX_HEARTS;
    streakRef.current = 0;
    stageSolvedRef.current = 0;

    setScore(0);
    setHearts(MAX_HEARTS);
    setStreak(0);
    setStageSolved(0);
    setTotalSolved(0);
    setMissedTargets([]);
    setStageUpBanner(null);
    setCompletedBanner(null);

    loadPuzzle(startStage);
    setGameState('PLAYING');
    lastFrameRef.current = performance.now();
  }, [loadPuzzle, pathMode]);

  const handleRoundTimeout = useCallback(() => {
    if (roundFrozenRef.current) return;
    roundFrozenRef.current = true;
    const curPuzzle = puzzleRef.current;
    if (!curPuzzle) return;

    playErrorSound(mutedRef.current);
    streakRef.current = 0;
    setStreak(0);

    const nextHearts = Math.max(0, heartsRef.current - 1);
    heartsRef.current = nextHearts;
    setHearts(nextHearts);
    setMissedTargets((prev) => [curPuzzle, ...prev]);
    setCompletedBanner({ puzzle: curPuzzle, success: false });

    scheduleTimeout(() => {
      if (gameStateRef.current !== 'PLAYING') return;
      if (nextHearts <= 0) {
        finishGame();
      } else {
        loadPuzzle(currentStageRef.current, curPuzzle.id);
      }
    }, 1050);
  }, [finishGame, loadPuzzle, scheduleTimeout]);

  // 60fps loop
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

      if (!roundFrozenRef.current && puzzleRef.current) {
        // Countdown timer
        const nextTime = Math.max(0, timeLeftRef.current - dt);
        timeLeftRef.current = nextTime;
        setTimeLeft(nextTime);

        if (nextTime <= 0) {
          handleRoundTimeout();
        } else {
          // Move pieces down
          let nextPieces = piecesRef.current
            .map((p) => ({
              ...p,
              y: p.y + p.speed * dt,
            }))
            .filter((p) => p.y < 1.05);

          spawnCooldownRef.current -= dt;
          if (spawnCooldownRef.current <= 0 && nextPieces.length < 7) {
            nextPieces = spawnPiece(puzzleRef.current, filledRef.current, nextPieces);
            spawnCooldownRef.current =
              currentStageRef.current === 4 ? 0.95 : 0.85;
          }

          piecesRef.current = nextPieces;
          setPieces(nextPieces);
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
  }, [gameState, handleRoundTimeout, spawnPiece]);

  const handleTapPiece = useCallback(
    (pieceId: string) => {
      if (gameStateRef.current !== 'PLAYING' || roundFrozenRef.current) return;
      const curPuzzle = puzzleRef.current;
      if (!curPuzzle) return;

      const tapped = piecesRef.current.find((p) => p.id === pieceId);
      if (!tapped || tapped.state === 'wrong') return;

      const curFilled = [...filledRef.current];
      let matchedSlotIdx = -1;

      if (curPuzzle.strictOrder) {
        const nextEmpty = curFilled.findIndex((s) => s === null);
        if (nextEmpty >= 0 && curPuzzle.parts[nextEmpty] === tapped.label) {
          matchedSlotIdx = nextEmpty;
        }
      } else {
        matchedSlotIdx = curPuzzle.parts.findIndex(
          (part, idx) => curFilled[idx] === null && part === tapped.label
        );
      }

      if (matchedSlotIdx >= 0) {
        // Snap piece into slot!
        curFilled[matchedSlotIdx] = tapped.label;
        filledRef.current = curFilled;
        setFilledSlots(curFilled);

        const remainingPieces = piecesRef.current.filter((p) => p.id !== pieceId);
        piecesRef.current = remainingPieces;
        setPieces(remainingPieces);

        const allDone = curFilled.every((s) => s !== null);
        if (!allDone) {
          playSnapSound(mutedRef.current);
          return;
        }

        // Completed entire character / word / sentence!
        roundFrozenRef.current = true;
        playSuccessSound(mutedRef.current);
        if (!mutedRef.current) {
          onSpeak(curPuzzle.target);
        }

        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);

        const points = 20 * curPuzzle.stage + Math.min(25, (nextStreak - 1) * 5);
        const nextScore = scoreRef.current + points;
        scoreRef.current = nextScore;
        setScore(nextScore);

        setBestScore((prev) => {
          const next = Math.max(prev, nextScore);
          if (next > prev) saveBestScore(next);
          return next;
        });

        setTotalSolved((n) => n + 1);
        const nextStageSolved = stageSolvedRef.current + 1;

        let nextStage = currentStageRef.current;
        let didAdvanceStage = false;
        if (
          pathModeRef.current === 'progressive' &&
          nextStageSolved >= PUZZLES_PER_STAGE &&
          currentStageRef.current < 4
        ) {
          nextStage = (currentStageRef.current + 1) as BuilderStageId;
          stageSolvedRef.current = 0;
          setStageSolved(0);
          didAdvanceStage = true;
        } else {
          stageSolvedRef.current = nextStageSolved;
          setStageSolved(nextStageSolved);
        }

        setCompletedBanner({ puzzle: curPuzzle, success: true });
        if (didAdvanceStage) {
          scheduleTimeout(() => playStageUpSound(mutedRef.current), 260);
          setStageUpBanner(nextStage);
        }

        scheduleTimeout(() => {
          if (gameStateRef.current !== 'PLAYING') return;
          setStageUpBanner(null);
          loadPuzzle(nextStage, curPuzzle.id);
        }, didAdvanceStage ? 1450 : 950);
      } else {
        // Wrong piece tapped!
        playErrorSound(mutedRef.current);
        streakRef.current = 0;
        setStreak(0);

        const marked = piecesRef.current.map((p) =>
          p.id === pieceId ? { ...p, state: 'wrong' as const } : p
        );
        piecesRef.current = marked;
        setPieces(marked);

        scheduleTimeout(() => {
          const cleaned = piecesRef.current.filter((p) => p.id !== pieceId);
          piecesRef.current = cleaned;
          setPieces(cleaned);
        }, 260);

        const nextHearts = Math.max(0, heartsRef.current - 1);
        heartsRef.current = nextHearts;
        setHearts(nextHearts);

        if (nextHearts <= 0) {
          setMissedTargets((prev) => [curPuzzle, ...prev]);
          finishGame();
        }
      }
    },
    [finishGame, loadPuzzle, onSpeak, scheduleTimeout]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const timeLimit = puzzle ? STAGE_TIME_LIMIT[puzzle.stage] : 22;
  const timePct = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const nextRequiredIdx = filledSlots.findIndex((s) => s === null);

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-[#f3f7f9] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 select-none overflow-hidden">
      {/* Top HUD */}
      <header className="glass-nav shrink-0 border-b px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
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
            <div className="flex items-center gap-0.5" aria-label={`Hearts ${hearts}/${MAX_HEARTS}`}>
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${
                    idx < hearts
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSlotHints((v) => !v)}
              className={`glass-subtle inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                showSlotHints
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title={isRu ? 'Подсказки частей' : 'Component hints'}
              aria-label={isRu ? 'Подсказки частей' : 'Component hints'}
            >
              <Lightbulb className="h-4 w-4" />
            </button>
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

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                {isRu ? 'Аркада запоминания · Игра 2' : 'Memory Arcade · Game 2'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                {isRu ? 'Сборка иероглифов и фраз' : 'Shi Ge Ci · Word Builder'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Внизу показано слово на русском, сверху летят разные кирпичики и знаки. Ловите нужные части и собирайте: сначала составные иероглифы, затем обычные знаки, затем слова и целые предложения.'
                  : 'See the target meaning below while parts fall from the top. Tap the matching pieces to build: composite bricks first, then everyday characters, multi-character words, and full sentences.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isRu ? 'Режим прохождения' : 'Progression Mode'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPathMode('progressive')}
                  className={`min-h-[48px] rounded-2xl px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                    pathMode === 'progressive'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                      : 'glass-subtle text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{isRu ? 'Полный путь (Этапы 1 → 4)' : 'Full Journey (Stages 1 → 4)'}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </div>
                </button>
                {([1, 2, 3, 4] as BuilderStageId[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPathMode(s)}
                    className={`min-h-[48px] rounded-2xl px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                      pathMode === s
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                        : 'glass-subtle text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {stageNames[s]}
                  </button>
                ))}
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
                {isRu ? 'Начать сборку' : 'Start Building'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stage Progress & Timer Strip */}
            <div className="shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-sky-700 dark:text-sky-300">
                  {stageNames[currentStage]}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {pathMode === 'progressive' && currentStage < 4
                    ? `${stageSolved}/${PUZZLES_PER_STAGE}`
                    : `${isRu ? 'Собрано' : 'Built'}: ${totalSolved}`}
                  {' · '}
                  {Math.ceil(timeLeft)}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full transition-[width] duration-100 ${
                    timePct < 28 ? 'bg-rose-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
            </div>

            {/* Falling Parts Arena */}
            <div
              ref={arenaRef}
              className="relative flex-1 min-h-0 rounded-3xl border border-slate-900/10 bg-white/70 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 overflow-hidden"
            >
              {/* Subtle 4 vertical lane guides */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                {[0, 1, 2, 3].map((lane) => (
                  <div
                    key={lane}
                    className="border-r last:border-r-0 border-slate-900/[0.04] dark:border-white/[0.04]"
                  />
                ))}
              </div>

              {/* Falling Pieces */}
              {pieces.map((piece) => {
                const isWrong = piece.state === 'wrong';
                const leftCenterPct = ((piece.lane + 0.5) / LANE_COUNT) * 100;
                const yPx = piece.y * Math.max(180, arenaHeight - 64);
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTapPiece(piece.id);
                    }}
                    style={{
                      left: `${leftCenterPct}%`,
                      top: 0,
                      transform: `translate3d(-50%, ${yPx}px, 0)`,
                    }}
                    className={`absolute top-0 flex min-h-[58px] min-w-[62px] sm:min-w-[74px] items-center justify-center rounded-2xl border-2 px-3 py-2 font-hanzi font-bold shadow-md transition-colors active:scale-95 ${
                      piece.label.length >= 2 ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'
                    } ${
                      isWrong
                        ? 'border-rose-500 bg-rose-500 text-white scale-95'
                        : 'border-sky-500/35 bg-white text-slate-900 hover:border-teal-500 dark:border-sky-400/35 dark:bg-slate-800 dark:text-white'
                    }`}
                  >
                    {piece.label}
                  </button>
                );
              })}

              {/* Completed Assembly Toast */}
              {completedBanner && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] p-4">
                  <div
                    className={`glass-surface rounded-3xl px-7 py-5 text-center shadow-2xl border-2 ${
                      completedBanner.success
                        ? 'border-emerald-500/60'
                        : 'border-rose-500/60'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        completedBanner.success
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {completedBanner.success
                        ? isRu
                          ? 'Собрано!'
                          : 'Built!'
                        : isRu
                          ? 'Время вышло'
                          : 'Time Up'}
                    </p>
                    <p className="mt-1 font-hanzi text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                      {completedBanner.puzzle.target}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {completedBanner.puzzle.pinyin}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage Up Toast */}
              {stageUpBanner && (
                <div className="pointer-events-none absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-2xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="h-4 w-4" />
                  {stageNames[stageUpBanner]}
                </div>
              )}

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
                        {isRu ? 'Жизни закончились' : 'Out of Hearts'}
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
                          {totalSolved}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isRu ? 'Собрано' : 'Built'}
                        </p>
                      </div>
                    </div>

                    {missedTargets.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {isRu ? 'Что не успели собрать:' : 'Missed targets:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {missedTargets.slice(0, 8).map((item, idx) => (
                            <button
                              key={`${item.id}-${idx}`}
                              type="button"
                              onClick={() => onSpeak(item.target)}
                              className="glass-subtle inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs hover:bg-white dark:hover:bg-slate-800"
                            >
                              <span className="font-hanzi font-bold text-sm">{item.target}</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                ({item.parts.join(' + ')})
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

            {/* Bottom Target & Assembly Slots */}
            {puzzle && (
              <div className="glass-surface shrink-0 rounded-3xl p-4 sm:p-5 pb-safe space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {puzzle.stage === 1
                        ? isRu
                          ? 'Соберите составной иероглиф:'
                          : 'Build the composite character:'
                        : puzzle.stage === 2
                          ? isRu
                            ? 'Соберите иероглиф из частей:'
                            : 'Build the character from parts:'
                          : puzzle.stage === 3
                            ? isRu
                              ? 'Соберите слово по порядку:'
                              : 'Build the word in order:'
                            : isRu
                              ? 'Соберите предложение по порядку:'
                              : 'Build the sentence in order:'}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {isRu ? puzzle.meaningRu : puzzle.meaningEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSpeak(puzzle.target)}
                    className="glass-subtle inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0"
                    title={isRu ? 'Подсказка звуком' : 'Audio hint'}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    {isRu ? 'Звук' : 'Audio'}
                  </button>
                </div>

                {/* Assembly Slots */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {puzzle.parts.map((part, idx) => {
                    const filledValue = filledSlots[idx];
                    const isNextStrict = puzzle.strictOrder && idx === nextRequiredIdx;
                    const hintText = isRu
                      ? puzzle.partHintsRu?.[idx]
                      : puzzle.partHintsEn?.[idx];

                    return (
                      <React.Fragment key={`${puzzle.id}-slot-${idx}`}>
                        {idx > 0 && puzzle.stage <= 2 && (
                          <span className="text-sm font-bold text-slate-400">+</span>
                        )}
                        <div
                          className={`flex min-h-[52px] min-w-[54px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-1.5 transition-all ${
                            filledValue
                              ? 'border-emerald-500 bg-emerald-500/12 text-emerald-800 dark:border-emerald-400 dark:text-emerald-200'
                              : isNextStrict
                                ? 'border-teal-500 bg-teal-500/8 dark:border-teal-400'
                                : 'border-dashed border-slate-300 bg-slate-900/[0.03] dark:border-slate-700 dark:bg-white/[0.03]'
                          }`}
                        >
                          <span className="font-hanzi text-2xl font-bold leading-none">
                            {filledValue ?? '?'}
                          </span>
                          {showSlotHints && hintText && !filledValue && (
                            <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                              {hintText}
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
