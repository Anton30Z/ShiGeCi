import {
  Droplets,
  Flame,
  Heart,
  Infinity as InfinityIcon,
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
import { RADICAL_BRICK_WORDS } from '../../data/radicalsCurriculum';
import { getWordMeanings, STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import {
  playAnimeHitSound,
  playErrorSound,
  playGameOverSound,
  playSplashSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { ToneHanzi } from '../ToneHanzi';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type DeckChoice = 'hsk' | 'radicals' | 'mixed';
type SpeedMode = 'slow' | 'normal' | 'fast';
type LifeMode = 'arcade' | 'zen';

interface RainDropGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  toneColorsEnabled: boolean;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface DropOption {
  wordId: string;
  label: string;
}

interface ActiveSet {
  setId: string;
  options: DropOption[]; // 3 bottom words in RU or EN
  droplets: VocabWord[]; // 3 characters falling one after another
  dropletIndex: number; // 0, 1, or 2
  dropletXList: number[]; // horizontal % position for each droplet (e.g., 24, 50, 76)
}

interface SplashEffect {
  id: string;
  xPct: number;
  charText: string;
  meaning: string;
  isWrongTap: boolean;
}

interface OutcomeBanner {
  id: string;
  kind: 'win' | 'miss-drop' | 'miss-set';
  title: string;
  subtitle: string;
  xPct: number;
  yPx: number;
}

const MAX_HEARTS = 5;
const BEST_SCORE_KEY = 'shigeci_raindrop_best_v1';

const SPEED_SECONDS: Record<SpeedMode, number> = {
  slow: 7.4,
  normal: 5.2,
  fast: 3.5,
};

const SPARK_VECTORS: Array<{ sx: string; sy: string; sym: string; color: string }> = [
  { sx: '-66px', sy: '-52px', sym: '★', color: 'text-amber-400' },
  { sx: '68px', sy: '-48px', sym: '✦', color: 'text-cyan-300' },
  { sx: '-80px', sy: '8px', sym: '✦', color: 'text-emerald-300' },
  { sx: '82px', sy: '12px', sym: '★', color: 'text-yellow-300' },
  { sx: '-46px', sy: '56px', sym: '●', color: 'text-teal-300' },
  { sx: '48px', sy: '58px', sym: '●', color: 'text-sky-300' },
  { sx: '0px', sy: '-72px', sym: '★', color: 'text-amber-300' },
  { sx: '0px', sy: '68px', sym: '✦', color: 'text-cyan-200' },
];

function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? val : 0;
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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const RainDropGame: React.FC<RainDropGameProps> = ({
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
  const [lifeMode, setLifeMode] = useState<LifeMode>('arcade');
  const [showPinyinHint, setShowPinyinHint] = useState(false);
  const [muted, setMuted] = useState(false);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [streak, setStreak] = useState(0);
  const [setsCleared, setSetsCleared] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [missedWords, setMissedWords] = useState<VocabWord[]>([]);

  const [activeSet, setActiveSet] = useState<ActiveSet | null>(null);
  const [dropProgress, setDropProgress] = useState(0); // 0 top -> 1 bottom water surface
  const [isFastDropping, setIsFastDropping] = useState(false);
  const [phase, setPhase] = useState<'FALLING' | 'CAUGHT_CELEBRATE' | 'SPLASH_WAIT'>('FALLING');
  const [selectedBtnIdx, setSelectedBtnIdx] = useState<{ idx: number; ok: boolean } | null>(null);
  const [splashFx, setSplashFx] = useState<SplashEffect | null>(null);
  const [outcomeBanner, setOutcomeBanner] = useState<OutcomeBanner | null>(null);
  const [arenaBump, setArenaBump] = useState(false);

  const [arenaSize, setArenaSize] = useState({ width: 380, height: 420 });
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Refs for stable 60fps loop & timeouts
  const gameStateRef = useRef(gameState);
  const phaseRef = useRef(phase);
  const activeSetRef = useRef<ActiveSet | null>(null);
  const dropProgressRef = useRef(0);
  const fastDroppingRef = useRef(false);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const setsClearedRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const mutedRef = useRef(muted);
  const lifeModeRef = useRef(lifeMode);
  const speedModeRef = useRef(speedMode);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  gameStateRef.current = gameState;
  phaseRef.current = phase;
  mutedRef.current = muted;
  lifeModeRef.current = lifeMode;
  speedModeRef.current = speedMode;

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clearAllTimers]);

  // Measure arena dimensions via ResizeObserver
  useEffect(() => {
    const node = arenaRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setArenaSize({ width: rect.width, height: rect.height });
      }
    };
    update();

    if (typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => update());
    obs.observe(node);
    return () => obs.disconnect();
  }, [gameState]);

  const activePool = useMemo(() => {
    const baseHsk = vocabWords.length >= 4 ? vocabWords : STARTER_HSK1_WORDS;
    if (deckChoice === 'radicals') return RADICAL_BRICK_WORDS;
    if (deckChoice === 'mixed') return [...RADICAL_BRICK_WORDS, ...baseHsk];
    return baseHsk;
  }, [deckChoice, vocabWords]);

  const createSet = useCallback(
    (prevWordIds: Set<string>): ActiveSet => {
      const freshPool = activePool.filter((w) => !prevWordIds.has(w.id));
      const source = freshPool.length >= 3 ? freshPool : activePool;
      const shuffled = shuffle(source);

      const picked: VocabWord[] = [];
      const seenLabels = new Set<string>();
      for (const candidate of shuffled) {
        const label = getWordMeanings(candidate, language)[0] ?? candidate.simplified;
        if (!seenLabels.has(label)) {
          seenLabels.add(label);
          picked.push(candidate);
          if (picked.length === 3) break;
        }
      }
      // Fallback if pool has duplicate meanings
      while (picked.length < 3 && shuffled.length >= picked.length + 1) {
        const extra = shuffled.find((w) => !picked.some((p) => p.id === w.id));
        if (!extra) break;
        picked.push(extra);
      }

      const options: DropOption[] = shuffle(
        picked.map((w) => ({
          wordId: w.id,
          label: getWordMeanings(w, language)[0] ?? w.simplified,
        }))
      );

      const droplets = shuffle(picked);
      const lanes = shuffle([24, 50, 76]);

      return {
        setId: `${Date.now()}-${Math.random()}`,
        options,
        droplets,
        dropletIndex: 0,
        dropletXList: lanes,
      };
    },
    [activePool, language]
  );

  const finishGame = useCallback(() => {
    clearAllTimers();
    setGameState('GAME_OVER');
    playGameOverSound(mutedRef.current);
    setBestScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next > prev) saveBestScore(next);
      return next;
    });
  }, [clearAllTimers]);

  const advanceToNextSet = useCallback(
    (prevSet: ActiveSet | null) => {
      const prevIds = new Set(prevSet ? prevSet.droplets.map((d) => d.id) : []);
      const next = createSet(prevIds);
      activeSetRef.current = next;
      setActiveSet(next);
      dropProgressRef.current = 0;
      setDropProgress(0);
      fastDroppingRef.current = false;
      setIsFastDropping(false);
      setSelectedBtnIdx(null);
      setSplashFx(null);
      setOutcomeBanner(null);
      phaseRef.current = 'FALLING';
      setPhase('FALLING');
      setSetNumber((n) => n + 1);
      lastFrameRef.current = performance.now();
    },
    [createSet]
  );

  const handleDropletSplash = useCallback(
    (wasWrongTap: boolean) => {
      const currentSet = activeSetRef.current;
      if (!currentSet) return;

      const currentWord = currentSet.droplets[currentSet.dropletIndex];
      const currentX = currentSet.dropletXList[currentSet.dropletIndex] ?? 50;
      const meaning = getWordMeanings(currentWord, language)[0] ?? currentWord.simplified;

      phaseRef.current = 'SPLASH_WAIT';
      setPhase('SPLASH_WAIT');
      fastDroppingRef.current = false;
      setIsFastDropping(false);

      playSplashSound(mutedRef.current);
      if (!wasWrongTap) {
        playErrorSound(mutedRef.current);
      }

      setArenaBump(true);
      scheduleTimer(() => setArenaBump(false), 320);

      setSplashFx({
        id: `${Date.now()}-${Math.random()}`,
        xPct: currentX,
        charText: currentWord.simplified,
        meaning,
        isWrongTap: wasWrongTap,
      });

      setMissedWords((prev) => {
        if (prev.some((w) => w.id === currentWord.id)) return prev;
        return [currentWord, ...prev];
      });

      const isLastInSet = currentSet.dropletIndex >= currentSet.droplets.length - 1;

      if (!isLastInSet) {
        // Show cartoon miss splash popup above the puddle, then launch next droplet in this set
        setOutcomeBanner({
          id: `${Date.now()}-missdrop`,
          kind: 'miss-drop',
          title: isRu ? 'ПЛЮХ!' : 'SPLASH!',
          subtitle: isRu
            ? `Капля ${currentSet.dropletIndex + 2} из 3`
            : `Drop ${currentSet.dropletIndex + 2} of 3`,
          xPct: currentX,
          yPx: Math.max(80, arenaSize.height - 96),
        });

        scheduleTimer(() => {
          if (gameStateRef.current !== 'PLAYING') return;
          const nextIdx = currentSet.dropletIndex + 1;
          const updatedSet: ActiveSet = {
            ...currentSet,
            dropletIndex: nextIdx,
          };
          activeSetRef.current = updatedSet;
          setActiveSet(updatedSet);
          dropProgressRef.current = 0;
          setDropProgress(0);
          setSelectedBtnIdx(null);
          setSplashFx(null);
          setOutcomeBanner(null);
          phaseRef.current = 'FALLING';
          setPhase('FALLING');
          lastFrameRef.current = performance.now();
        }, 620);
      } else {
        // All 3 droplets in this set fell without a catch -> Set missed!
        streakRef.current = 0;
        setStreak(0);

        let nextHearts = heartsRef.current;
        if (lifeModeRef.current === 'arcade') {
          nextHearts = Math.max(0, heartsRef.current - 1);
          heartsRef.current = nextHearts;
          setHearts(nextHearts);
        }

        setOutcomeBanner({
          id: `${Date.now()}-missset`,
          kind: 'miss-set',
          title: isRu ? 'НЕУДАЧА!' : 'SET MISSED!',
          subtitle:
            lifeModeRef.current === 'arcade'
              ? isRu
                ? 'Все 3 капли растеклись · −1 ❤️'
                : 'All 3 drops splashed · −1 ❤️'
              : isRu
                ? 'Все 3 капли растеклись'
                : 'All 3 drops splashed',
          xPct: 50,
          yPx: Math.max(96, arenaSize.height * 0.44),
        });

        scheduleTimer(() => {
          if (gameStateRef.current !== 'PLAYING') return;
          if (lifeModeRef.current === 'arcade' && nextHearts <= 0) {
            finishGame();
          } else {
            advanceToNextSet(currentSet);
          }
        }, 1050);
      }
    },
    [advanceToNextSet, arenaSize.height, finishGame, isRu, language, scheduleTimer]
  );

  const startGame = useCallback(() => {
    clearAllTimers();
    scoreRef.current = 0;
    streakRef.current = 0;
    setsClearedRef.current = 0;
    heartsRef.current = MAX_HEARTS;

    setScore(0);
    setStreak(0);
    setSetsCleared(0);
    setSetNumber(1);
    setHearts(MAX_HEARTS);
    setMissedWords([]);
    setSplashFx(null);
    setOutcomeBanner(null);
    setSelectedBtnIdx(null);

    const firstSet = createSet(new Set());
    activeSetRef.current = firstSet;
    setActiveSet(firstSet);
    dropProgressRef.current = 0;
    setDropProgress(0);
    fastDroppingRef.current = false;
    setIsFastDropping(false);
    phaseRef.current = 'FALLING';
    setPhase('FALLING');
    setGameState('PLAYING');
    lastFrameRef.current = performance.now();
  }, [clearAllTimers, createSet]);

  // 60fps smooth rain droplet fall loop
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
      const dt = Math.min(0.06, Math.max(0, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      if (phaseRef.current === 'FALLING' && activeSetRef.current) {
        const baseSec = SPEED_SECONDS[speedModeRef.current];
        // Gentle ramp as sets progress, floor at 2.3s
        const effectiveSec = Math.max(2.3, baseSec - setsClearedRef.current * 0.045);
        const speedPerSec = fastDroppingRef.current ? 6.5 : 1 / effectiveSec;
        const nextProgress = dropProgressRef.current + speedPerSec * dt;

        if (nextProgress >= 1) {
          dropProgressRef.current = 1;
          setDropProgress(1);
          handleDropletSplash(fastDroppingRef.current);
        } else {
          dropProgressRef.current = nextProgress;
          setDropProgress(nextProgress);
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
  }, [gameState, handleDropletSplash]);

  const handleChooseOption = useCallback(
    (idx: number) => {
      if (gameStateRef.current !== 'PLAYING') return;
      if (phaseRef.current !== 'FALLING' || fastDroppingRef.current) return;
      const currentSet = activeSetRef.current;
      if (!currentSet) return;

      const chosen = currentSet.options[idx];
      const targetWord = currentSet.droplets[currentSet.dropletIndex];
      if (!chosen || !targetWord) return;

      if (chosen.wordId === targetWord.id) {
        // CORRECT! Freeze droplet, pronounce in Chinese, show anime/console hit animation, then advance after ~1s!
        phaseRef.current = 'CAUGHT_CELEBRATE';
        setPhase('CAUGHT_CELEBRATE');
        setSelectedBtnIdx({ idx, ok: true });

        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);

        const nextCleared = setsClearedRef.current + 1;
        setsClearedRef.current = nextCleared;
        setSetsCleared(nextCleared);

        const firstDropBonus = currentSet.dropletIndex === 0 ? 5 : 0;
        const streakBonus = Math.min(10, (nextStreak - 1) * 2);
        const points = 10 + firstDropBonus + streakBonus;
        const nextScore = scoreRef.current + points;
        scoreRef.current = nextScore;
        setScore(nextScore);

        setBestScore((prev) => {
          const next = Math.max(prev, nextScore);
          if (next > prev) saveBestScore(next);
          return next;
        });

        playAnimeHitSound(mutedRef.current);
        if (!mutedRef.current) {
          onSpeak(targetWord.simplified);
        }

        const currentX = currentSet.dropletXList[currentSet.dropletIndex] ?? 50;
        const startY = -114;
        const surfaceY = Math.max(76, arenaSize.height - 134);
        const bellyY = startY + dropProgressRef.current * (surfaceY - startY) + 78;
        const currentYPx = Math.min(arenaSize.height - 92, Math.max(76, bellyY));

        const title =
          nextStreak >= 3
            ? isRu
              ? `КОМБО x${nextStreak}!`
              : `COMBO x${nextStreak}!`
            : currentSet.dropletIndex === 0
              ? isRu
                ? 'УДАЧНО! ★'
                : 'PERFECT! ★'
              : isRu
                ? 'УДАЧНО!'
                : 'NICE HIT!';

        setOutcomeBanner({
          id: `${Date.now()}-win`,
          kind: 'win',
          title,
          subtitle: `${targetWord.simplified} · ${targetWord.pinyin} · +${points}`,
          xPct: currentX,
          yPx: currentYPx,
        });

        // After ~1 second, move to the next set of 3 words
        scheduleTimer(() => {
          if (gameStateRef.current !== 'PLAYING') return;
          advanceToNextSet(currentSet);
        }, 1050);
      } else {
        // WRONG! Immediately drop this character down to the bottom surface where it splashes & spreads
        playErrorSound(mutedRef.current);
        setSelectedBtnIdx({ idx, ok: false });
        fastDroppingRef.current = true;
        setIsFastDropping(true);
      }
    },
    [advanceToNextSet, arenaSize.height, isRu, onSpeak, scheduleTimer]
  );

  // Keyboard shortcuts: 1 / 2 / 3 / Space / Esc
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

  const currentDroplet = activeSet ? activeSet.droplets[activeSet.dropletIndex] : null;
  const currentDropletX = activeSet ? activeSet.dropletXList[activeSet.dropletIndex] ?? 50 : 50;

  // Pixel travel calculation from top (-118px) down to water surface line (arenaHeight - 132px)
  const dropletY = useMemo(() => {
    const startY = -114;
    const surfaceY = Math.max(76, arenaSize.height - 134);
    return startY + dropProgress * (surfaceY - startY);
  }, [arenaSize.height, dropProgress]);

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

          <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-xs sm:text-sm font-semibold">
            <span className="font-mono-num text-teal-700 dark:text-teal-300">
              {isRu ? 'Счёт' : 'Score'}: {score}
            </span>

            {gameState !== 'TITLE_MENU' && (
              <span className="inline-flex items-center gap-1.5 font-mono-num text-slate-600 dark:text-slate-300">
                <span>
                  {isRu ? 'Набор' : 'Set'} #{setNumber}
                </span>
                <span className="inline-flex items-center gap-1" aria-label="Droplets in set">
                  {[0, 1, 2].map((i) => {
                    const currentIdx = activeSet?.dropletIndex ?? 0;
                    const isDone = i < currentIdx;
                    const isActive = i === currentIdx;
                    return (
                      <span
                        key={i}
                        className={`inline-block h-2.5 w-2 rounded-full transition-all ${
                          isDone
                            ? 'bg-rose-400/50 scale-75'
                            : isActive
                              ? 'bg-sky-500 shadow-sm shadow-sky-400/60 scale-110'
                              : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    );
                  })}
                </span>
              </span>
            )}

            {lifeMode === 'arcade' && gameState !== 'TITLE_MENU' && (
              <span className="inline-flex items-center gap-0.5 text-rose-500">
                {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`h-3.5 w-3.5 ${
                      idx < hearts ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </span>
            )}

            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 font-mono-num text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5" />
                x{streak}
              </span>
            )}
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

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {gameState === 'TITLE_MENU' ? (
          <div className="glass-surface my-auto rounded-3xl p-6 sm:p-8 space-y-5 overflow-y-auto max-h-full">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <Droplets className="h-3.5 w-3.5" />
                {isRu ? 'Аркада запоминания · Игра 10' : 'Memory Arcade · Game 10'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                {isRu ? 'Капли слов · Shi Ge Ci' : 'Word Rain · Shi Ge Ci'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Снизу 3 перевода, сверху по очереди падают 3 иероглифа-капли. Успейте поймать хотя бы один — слово прозвучит на китайском, и через секунду откроется новый набор. Промах или падение — капля красиво растекается по поверхности, не заполняя экран.'
                  : '3 translations sit below while 3 character droplets fall one by one. Catch just 1 to hear its Mandarin audio and jump to the next set after 1 second. Missed droplets splash and spread across the water surface without filling the screen.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRu ? 'Набор слов' : 'Word Deck'}
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
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                          : 'glass-subtle text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {isRu ? 'Скорость капель' : 'Drop Speed'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['slow', isRu ? 'Плавно' : 'Slow'],
                        ['normal', isRu ? 'Норма' : 'Normal'],
                        ['fast', isRu ? 'Быстро' : 'Fast'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSpeedMode(id)}
                        className={`min-h-[42px] rounded-xl px-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                          speedMode === id
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
                    {isRu ? 'Режим' : 'Mode'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLifeMode('arcade')}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        lifeMode === 'arcade'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                          : 'glass-subtle text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {isRu ? '5 сердец' : '5 Hearts'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLifeMode('zen')}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        lifeMode === 'zen'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'glass-subtle text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <InfinityIcon className="h-3.5 w-3.5" />
                      {isRu ? 'Дзен (∞)' : 'Zen (∞)'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3 dark:bg-white/5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isRu ? 'Показывать пиньинь на капле' : 'Show Pinyin on droplet'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinyinHint((v) => !v)}
                  className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold transition-colors ${
                    showPinyinHint
                      ? 'bg-sky-600 text-white'
                      : 'glass-subtle text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {showPinyinHint ? (isRu ? 'Вкл' : 'On') : isRu ? 'Выкл' : 'Off'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-num">
                <Trophy className="h-4 w-4 text-amber-500" />
                {isRu ? 'Рекорд' : 'Best'}: {bestScore}
              </span>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-sky-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4" />
                {isRu ? 'Запустить капли' : 'Start Rain'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Water-Droplet Arena */}
            <div
              ref={arenaRef}
              className={`relative flex-1 min-h-0 overflow-hidden rounded-3xl border border-sky-900/12 bg-gradient-to-b from-sky-100/80 via-cyan-50/75 to-teal-100/85 shadow-inner backdrop-blur-md dark:border-sky-300/15 dark:from-slate-900/90 dark:via-sky-950/75 dark:to-teal-950/85 ${
                arenaBump ? 'animate-arena-bump' : ''
              }`}
            >
              {/* Soft atmospheric vertical rain shimmer lines */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 24% 18%, rgba(56,189,248,0.22), transparent 38%), radial-gradient(circle at 76% 24%, rgba(20,184,166,0.18), transparent 42%)',
                }}
              />

              {/* Subtle Set Progress Guide at top of arena */}
              <div className="pointer-events-none relative z-10 flex items-center justify-between px-4 pt-3 text-[11px] font-semibold text-sky-900/70 dark:text-sky-200/75">
                <span>
                  {isRu
                    ? `Набор ${setNumber} · Поймай любую из 3 капель`
                    : `Set ${setNumber} · Catch any 1 of 3 drops`}
                </span>
                <span className="font-mono-num">
                  {isRu ? 'Пройдено' : 'Cleared'}: {setsCleared}
                </span>
              </div>

              {/* Falling Organic Water Droplet */}
              {currentDroplet && phase === 'FALLING' && gameState === 'PLAYING' && (
                <div
                  key={`${activeSet?.setId}-${activeSet?.dropletIndex}`}
                  className="pointer-events-none absolute top-0 z-20 will-change-transform"
                  style={{
                    left: `${currentDropletX}%`,
                    transform: `translate3d(-50%, ${dropletY}px, 0)`,
                  }}
                >
                  <div
                    className={`relative flex flex-col items-center transition-transform duration-150 ${
                      isFastDropping
                        ? 'scale-x-[0.86] scale-y-[1.18]'
                        : 'animate-droplet-wobble'
                    }`}
                  >
                    {/* Tiny trailing micro-droplet */}
                    <svg
                      width="14"
                      height="18"
                      viewBox="0 0 14 18"
                      aria-hidden="true"
                      className="-mb-1.5 opacity-85 drop-shadow-sm"
                    >
                      <path
                        d="M7 1 C8.5 5.5, 12 9, 12 12.5 C12 15.2, 9.8 17, 7 17 C4.2 17, 2 15.2, 2 12.5 C2 9, 5.5 5.5, 7 1 Z"
                        fill={isFastDropping ? '#fb7185' : '#38bdf8'}
                      />
                      <ellipse cx="5.2" cy="11.2" rx="1.2" ry="2.1" fill="rgba(255,255,255,0.75)" />
                    </svg>

                    {/* Main glossy SVG teardrop */}
                    <div className="relative h-[126px] w-[104px] sm:h-[142px] sm:w-[118px] drop-shadow-[0_12px_18px_rgba(14,165,233,0.32)]">
                      <svg
                        viewBox="0 0 130 164"
                        className="h-full w-full overflow-visible"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id={isFastDropping ? 'dropBodyErr' : 'dropBodyAqua'}
                            x1="28%"
                            y1="6%"
                            x2="78%"
                            y2="96%"
                          >
                            {isFastDropping ? (
                              <>
                                <stop offset="0%" stopColor="#fff1f2" stopOpacity="0.96" />
                                <stop offset="42%" stopColor="#fda4af" stopOpacity="0.88" />
                                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.92" />
                              </>
                            ) : (
                              <>
                                <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.96" />
                                <stop offset="38%" stopColor="#bae6fd" stopOpacity="0.86" />
                                <stop offset="76%" stopColor="#38bdf8" stopOpacity="0.84" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.92" />
                              </>
                            )}
                          </linearGradient>

                          <radialGradient
                            id={isFastDropping ? 'dropCausticErr' : 'dropCausticAqua'}
                            cx="52%"
                            cy="77%"
                            r="42%"
                          >
                            <stop
                              offset="0%"
                              stopColor={isFastDropping ? '#ffe4e6' : '#ecfeff'}
                              stopOpacity="0.92"
                            />
                            <stop
                              offset="60%"
                              stopColor={isFastDropping ? '#fda4af' : '#67e8f9'}
                              stopOpacity="0.35"
                            />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Outer organic teardrop silhouette */}
                        <path
                          d="M65 8 C72 34, 118 72, 118 106 C118 136, 94.3 156, 65 156 C35.7 156, 12 136, 12 106 C12 72, 58 34, 65 8 Z"
                          fill={`url(#${isFastDropping ? 'dropBodyErr' : 'dropBodyAqua'})`}
                          stroke={isFastDropping ? 'rgba(255,228,230,0.95)' : 'rgba(255,255,255,0.9)'}
                          strokeWidth="2.4"
                        />

                        {/* Internal luminous caustic glow inside belly */}
                        <path
                          d="M65 14 C71 38, 112 74, 112 106 C112 132, 91 150, 65 150 C39 150, 18 132, 18 106 C18 74, 59 38, 65 14 Z"
                          fill={`url(#${isFastDropping ? 'dropCausticErr' : 'dropCausticAqua'})`}
                        />

                        {/* Glossy upper-left curved specular highlight */}
                        <path
                          d="M44 62 C33 77, 26 92, 27 109 C28 115, 34 115, 35 109 C35 94, 41 80, 50 67 C53 62, 47 58, 44 62 Z"
                          fill="rgba(255,255,255,0.82)"
                        />
                        <circle cx="48" cy="52" r="4.2" fill="rgba(255,255,255,0.88)" />

                        {/* Bottom-right liquid rim reflection */}
                        <path
                          d="M66 147 C86 147, 102 135, 107 118"
                          fill="none"
                          stroke="rgba(255,255,255,0.72)"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Chinese character nestled inside the plump water belly */}
                      <div className="absolute inset-x-2 top-[41%] bottom-[8%] flex flex-col items-center justify-center text-center">
                        <span
                          className={`font-hanzi font-bold leading-none text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] ${
                            currentDroplet.simplified.length >= 3
                              ? 'text-xl sm:text-2xl'
                              : currentDroplet.simplified.length === 2
                                ? 'text-2xl sm:text-3xl'
                                : 'text-4xl sm:text-[42px]'
                          }`}
                        >
                          <ToneHanzi
                            simplified={currentDroplet.simplified}
                            pinyin={currentDroplet.pinyin}
                            numericPinyin={currentDroplet.numericPinyin}
                            toneColorsEnabled={toneColorsEnabled}
                          />
                        </span>
                        {showPinyinHint && (
                          <span className="mt-1 rounded-md bg-white/65 px-1.5 py-0.5 text-[10px] font-bold text-sky-950 backdrop-blur-[2px]">
                            {currentDroplet.pinyin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cartoon Anime + Console WIN Celebration at Caught Spot */}
              {phase === 'CAUGHT_CELEBRATE' && outcomeBanner?.kind === 'win' && currentDroplet && (
                <div
                  key={outcomeBanner.id}
                  className="pointer-events-none absolute z-30"
                  style={{
                    left: `${outcomeBanner.xPct}%`,
                    top: `${outcomeBanner.yPx}px`,
                  }}
                >
                  {/* Anime Comic Starburst Rays */}
                  <div
                    aria-hidden="true"
                    className="animate-anime-starburst absolute left-0 top-0 h-44 w-44 rounded-full"
                    style={{
                      background:
                        'repeating-conic-gradient(from 0deg, rgba(250, 204, 21, 0.54) 0deg 10deg, transparent 10deg 24deg)',
                    }}
                  />

                  {/* Glowing Shockwave Halo */}
                  <div className="animate-anime-starburst absolute left-0 top-0 h-28 w-28 rounded-full border-4 border-amber-300 bg-teal-400/25 shadow-[0_0_32px_rgba(45,212,191,0.75)]" />

                  {/* Caught Glowing Droplet + Retro Comic Stamp */}
                  <div className="animate-anime-pop relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="relative flex h-24 w-20 items-center justify-center drop-shadow-[0_6px_0_#0f172a]">
                      <svg viewBox="0 0 130 164" className="h-full w-full" aria-hidden="true">
                        <path
                          d="M65 8 C72 34, 118 72, 118 106 C118 136, 94.3 156, 65 156 C35.7 156, 12 136, 12 106 C12 72, 58 34, 65 8 Z"
                          fill="#14b8a6"
                          stroke="#fde047"
                          strokeWidth="6"
                        />
                        <path
                          d="M44 62 C33 77, 26 92, 27 109"
                          fill="none"
                          stroke="rgba(255,255,255,0.85)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="font-hanzi absolute top-[46%] text-3xl font-bold text-white drop-shadow-[0_2px_0_rgba(15,23,42,0.9)]">
                        {currentDroplet.simplified}
                      </span>
                    </div>

                    {/* Retro Console / Anime Comic Stamp */}
                    <div className="mt-1 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-amber-300 px-3.5 py-1 text-center shadow-[0_4px_0_#0f172a]">
                      <p className="text-xs sm:text-sm font-black tracking-wide text-slate-950">
                        {outcomeBanner.title}
                      </p>
                      <p className="text-[11px] font-bold text-slate-900">
                        {outcomeBanner.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Bursting Anime Stars & Console Sparkles */}
                  {SPARK_VECTORS.map((sp, idx) => (
                    <span
                      key={idx}
                      aria-hidden="true"
                      className={`animate-anime-spark absolute left-0 top-0 text-lg font-black drop-shadow-[0_2px_0_rgba(15,23,42,0.85)] ${sp.color}`}
                      style={
                        {
                          '--sx': sp.sx,
                          '--sy': sp.sy,
                        } as React.CSSProperties
                      }
                    >
                      {sp.sym}
                    </span>
                  ))}
                </div>
              )}

              {/* Cartoon Miss-Drop or Full-Set Miss Anime/Console Stamp */}
              {outcomeBanner && outcomeBanner.kind !== 'win' && (
                <div
                  key={outcomeBanner.id}
                  className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${Math.min(78, Math.max(22, outcomeBanner.xPct))}%`,
                    top: `${outcomeBanner.yPx}px`,
                  }}
                >
                  <div
                    className={`animate-anime-pop whitespace-nowrap rounded-2xl border-[3px] border-slate-900 px-4 py-1.5 text-center shadow-[0_4px_0_#0f172a] ${
                      outcomeBanner.kind === 'miss-set'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white text-rose-600 dark:bg-slate-800 dark:text-rose-300'
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-black tracking-wide">
                      {outcomeBanner.title}
                    </p>
                    <p className="text-[11px] font-bold opacity-95">
                      {outcomeBanner.subtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Liquid Wavy Water Surface Layer above Bottom Words + Spreading Splash Animation */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20">
                {/* Wavy SVG Liquid Surface Horizon */}
                <svg
                  viewBox="0 0 600 42"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 bottom-0 h-8 w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="waterSurfaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.52)" />
                      <stop offset="100%" stopColor="rgba(13, 148, 136, 0.65)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 14 Q 50 4, 100 13 T 200 12 T 300 14 T 400 11 T 500 14 T 600 12 L 600 42 L 0 42 Z"
                    fill="url(#waterSurfaceGrad)"
                  />
                  <path
                    d="M0 14 Q 50 4, 100 13 T 200 12 T 300 14 T 400 11 T 500 14 T 600 12"
                    fill="none"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Active Splash / Crown / Spreading Puddle on Surface */}
                {splashFx && (
                  <div
                    key={splashFx.id}
                    className="absolute bottom-2"
                    style={{ left: `${splashFx.xPct}%` }}
                  >
                    {/* Organic spreading liquid puddle blob */}
                    <svg
                      viewBox="0 0 180 40"
                      className="animate-puddle-spread absolute -bottom-1 left-0 h-8 w-36 overflow-visible"
                      aria-hidden="true"
                    >
                      <path
                        d="M14 26 C34 15, 62 18, 90 16 C118 18, 146 14, 166 26 C152 34, 124 37, 90 36 C56 37, 28 34, 14 26 Z"
                        fill="rgba(56, 189, 248, 0.78)"
                        stroke="rgba(255, 255, 255, 0.85)"
                        strokeWidth="2"
                      />
                    </svg>

                    {/* Expanding concentric water ripple */}
                    <div className="animate-puddle-ring absolute bottom-0 left-0 h-5 w-28 rounded-full border-2 border-sky-400/90 dark:border-cyan-300/90" />

                    {/* Liquid Crown Splash Drops arcing outward */}
                    <svg
                      viewBox="0 0 14 18"
                      className="animate-splash-left absolute bottom-3 -left-2 h-4 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 1 C8.5 5.5, 12 9, 12 12.5 C12 15.2, 9.8 17, 7 17 C4.2 17, 2 15.2, 2 12.5 C2 9, 5.5 5.5, 7 1 Z"
                        fill="#38bdf8"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 14 18"
                      className="animate-splash-right absolute bottom-3 left-1 h-4 w-3"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 1 C8.5 5.5, 12 9, 12 12.5 C12 15.2, 9.8 17, 7 17 C4.2 17, 2 15.2, 2 12.5 C2 9, 5.5 5.5, 7 1 Z"
                        fill="#38bdf8"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 14 18"
                      className="animate-splash-up absolute bottom-4 left-0 h-3.5 w-2.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 1 C8.5 5.5, 12 9, 12 12.5 C12 15.2, 9.8 17, 7 17 C4.2 17, 2 15.2, 2 12.5 C2 9, 5.5 5.5, 7 1 Z"
                        fill="#bae6fd"
                      />
                    </svg>

                    {/* Melting character dissolving into the spreading surface */}
                    <div className="animate-char-melt absolute bottom-2 left-0 whitespace-nowrap text-center">
                      <span className="font-hanzi text-2xl font-bold text-rose-600 dark:text-rose-300">
                        {splashFx.charText}
                      </span>
                      <span className="ml-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        {splashFx.meaning}
                      </span>
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
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
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
                      <p className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        {isRu ? 'Тренировка завершена' : 'Session Complete'}
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isRu ? 'Итог · Капли слов' : 'Word Rain Summary'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                        <p className="font-mono-num text-xl font-bold text-sky-700 dark:text-sky-300">
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
                          {setsCleared}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isRu ? 'Наборов' : 'Sets'}
                        </p>
                      </div>
                    </div>

                    {missedWords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {isRu
                            ? 'Растёкшиеся слова (нажмите для озвучки):'
                            : 'Splashed words (tap to listen):'}
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
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700 whitespace-nowrap"
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

            {/* Bottom 3 Translation Choices */}
            <div className="shrink-0 pb-safe">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(activeSet?.options ?? []).map((opt, idx) => {
                  const isHighlighted = selectedBtnIdx?.idx === idx;
                  const stateClasses = isHighlighted
                    ? selectedBtnIdx.ok
                      ? 'border-2 border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/25 scale-[1.03] dark:bg-emerald-900/60'
                      : 'border-2 border-rose-500 bg-rose-500/20 dark:bg-rose-950/60'
                    : 'glass-surface hover:bg-white dark:hover:bg-slate-800/90';

                  return (
                    <button
                      key={`${activeSet?.setId}-${opt.wordId}-${idx}`}
                      type="button"
                      disabled={
                        gameState !== 'PLAYING' ||
                        phase !== 'FALLING' ||
                        isFastDropping
                      }
                      onClick={() => handleChooseOption(idx)}
                      className={`flex min-h-[76px] sm:min-h-[84px] flex-col items-center justify-center rounded-2xl px-2.5 py-2.5 text-center transition-all active:scale-[0.97] disabled:opacity-70 ${stateClasses}`}
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {opt.label}
                      </span>
                      <span className="mt-1 hidden sm:inline text-[10px] font-mono-num text-slate-400">
                        [{idx + 1}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
