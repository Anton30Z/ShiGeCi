import {
  ArrowRight,
  Flame,
  Heart,
  Link2,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CURATED_CHAIN_WORDS, type ChainWordNode } from '../../data/miniGamesData';
import { getWordMeanings } from '../../data/starterHsk1';
import {
  playErrorSound,
  playGameOverSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface WordChainGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

const MAX_HEARTS = 3;
const ROUND_SEC = 10;
const BEST_KEY = 'shigeci_chain_best_v1';

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

export const WordChainGame: React.FC<WordChainGameProps> = ({
  vocabWords,
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';

  // Combine curated chain nodes + active multi-char HSK words
  const allNodes = useMemo(() => {
    const map = new Map<string, ChainWordNode>();
    for (const item of CURATED_CHAIN_WORDS) {
      map.set(item.zh, item);
    }
    for (const w of vocabWords) {
      const chars = Array.from(w.simplified);
      if (chars.length >= 2 && chars.every((c) => /[\u4e00-\u9fff]/.test(c))) {
        if (!map.has(w.simplified)) {
          map.set(w.simplified, {
            zh: w.simplified,
            pinyin: w.pinyin,
            ru: getWordMeanings(w, 'ru')[0] ?? w.simplified,
            en: getWordMeanings(w, 'en')[0] ?? w.simplified,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [vocabWords]);

  // Only nodes whose tail character has >= 1 valid continuation in allNodes
  const extendableNodes = useMemo(() => {
    const byHead = new Map<string, ChainWordNode[]>();
    for (const node of allNodes) {
      const head = Array.from(node.zh)[0];
      const arr = byHead.get(head) ?? [];
      arr.push(node);
      byHead.set(head, arr);
    }
    return { all: allNodes, byHead };
  }, [allNodes]);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [streak, setStreak] = useState(0);
  const [chainHistory, setChainHistory] = useState<ChainWordNode[]>([]);
  const [currentNode, setCurrentNode] = useState<ChainWordNode>(CURATED_CHAIN_WORDS[0]);
  const [options, setOptions] = useState<Array<{ node: ChainWordNode; isCorrect: boolean }>>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [feedback, setFeedback] = useState<{ pickedZh?: string; ok: boolean } | null>(null);

  const timerRef = useRef<number | null>(null);
  const frozenRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const setupStepFromNode = useCallback(
    (seedNode: ChainWordNode) => {
      const chars = Array.from(seedNode.zh);
      const tail = chars[chars.length - 1];
      let validNexts = (extendableNodes.byHead.get(tail) ?? []).filter(
        (n) => n.zh !== seedNode.zh
      );

      // Prefer a next node that itself has continuations so the chain keeps flowing!
      const deepNexts = validNexts.filter((n) => {
        const nextChars = Array.from(n.zh);
        const nextTail = nextChars[nextChars.length - 1];
        return (extendableNodes.byHead.get(nextTail) ?? []).some((x) => x.zh !== n.zh);
      });
      if (deepNexts.length > 0) validNexts = deepNexts;

      let chosenSeed = seedNode;
      if (validNexts.length === 0) {
        // Fallback to a guaranteed extendable start node
        const fallbackPool = CURATED_CHAIN_WORDS.filter((n) => {
          const nc = Array.from(n.zh);
          return (extendableNodes.byHead.get(nc[nc.length - 1]) ?? []).length > 0;
        });
        chosenSeed = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        const cChars = Array.from(chosenSeed.zh);
        validNexts = (extendableNodes.byHead.get(cChars[cChars.length - 1]) ?? []).filter(
          (n) => n.zh !== chosenSeed.zh
        );
      }

      const correct = validNexts[Math.floor(Math.random() * validNexts.length)];
      const chosenTail = Array.from(chosenSeed.zh).slice(-1)[0];

      const wrongPool = shuffle(
        extendableNodes.all.filter(
          (n) => n.zh !== chosenSeed.zh && Array.from(n.zh)[0] !== chosenTail
        )
      ).slice(0, 3);

      setCurrentNode(chosenSeed);
      setOptions(
        shuffle([
          { node: correct, isCorrect: true },
          ...wrongPool.map((n) => ({ node: n, isCorrect: false })),
        ])
      );
      setTimeLeft(ROUND_SEC);
      setFeedback(null);
      frozenRef.current = false;
    },
    [extendableNodes]
  );

  const startGame = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const startSeed =
      CURATED_CHAIN_WORDS[Math.floor(Math.random() * CURATED_CHAIN_WORDS.length)];
    setScore(0);
    setHearts(MAX_HEARTS);
    setStreak(0);
    setChainHistory([startSeed]);
    setGameState('PLAYING');
    setupStepFromNode(startSeed);
    onSpeak(startSeed.zh);
  }, [onSpeak, setupStepFromNode]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const id = window.setInterval(() => {
      if (frozenRef.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          frozenRef.current = true;
          playErrorSound(false);
          setStreak(0);
          setFeedback({ ok: false });
          const correctOpt = options.find((o) => o.isCorrect)?.node ?? currentNode;
          setHearts((h) => {
            const nh = h - 1;
            timerRef.current = window.setTimeout(() => {
              if (nh <= 0) {
                playGameOverSound(false);
                setGameState('GAME_OVER');
              } else {
                setupStepFromNode(correctOpt);
              }
            }, 950);
            return nh;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [currentNode, gameState, options, setupStepFromNode]);

  const handleChoose = useCallback(
    (opt: { node: ChainWordNode; isCorrect: boolean }) => {
      if (frozenRef.current || gameState !== 'PLAYING') return;
      frozenRef.current = true;
      onSpeak(opt.node.zh);

      if (opt.isCorrect) {
        playSuccessSound(false);
        const gained = 15 + timeLeft * 2;
        setStreak((s) => s + 1);
        setScore((prev) => {
          const next = prev + gained;
          setBestScore((b) => {
            const nb = Math.max(b, next);
            if (nb > b) saveBest(nb);
            return nb;
          });
          return next;
        });
        setChainHistory((prev) => [...prev.slice(-7), opt.node]);
        setFeedback({ pickedZh: opt.node.zh, ok: true });
        timerRef.current = window.setTimeout(() => setupStepFromNode(opt.node), 680);
      } else {
        playErrorSound(false);
        setStreak(0);
        setFeedback({ pickedZh: opt.node.zh, ok: false });
        const right = options.find((o) => o.isCorrect)?.node ?? currentNode;
        setHearts((h) => {
          const nh = h - 1;
          timerRef.current = window.setTimeout(() => {
            if (nh <= 0) {
              playGameOverSound(false);
              setGameState('GAME_OVER');
            } else {
              setupStepFromNode(right);
            }
          }, 950);
          return nh;
        });
      }
    },
    [currentNode, gameState, onSpeak, options, setupStepFromNode, timeLeft]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const curChars = Array.from(currentNode.zh);
  const tailChar = curChars[curChars.length - 1] ?? '';

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
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                {isRu ? 'Аркада запоминания · Игра 7' : 'Memory Arcade · Game 7'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isRu ? 'Цепочка иероглифов' : 'Shi Ge Ci · Word Chain'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Словарное домино: следующее китайское слово должно начинаться с последнего иероглифа текущего слова (например, 今天 → 天气 → 汽车).'
                  : 'Vocabulary dominoes: pick the next word starting with the last character of the current word (e.g. 今天 → 天气 → 汽车).'}
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
              {isRu ? 'Цепочка прервалась' : 'Chain Ended'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
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
            {/* Timer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                  <Link2 className="h-4 w-4" />
                  {isRu ? `Продолжите слово на «${tailChar}»` : `Continue from "${tailChar}"`}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    timeLeft <= 3 ? 'bg-rose-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
                />
              </div>
            </div>

            {/* Chain Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {chainHistory.map((item, idx) => (
                <React.Fragment key={`${item.zh}-${idx}`}>
                  {idx > 0 && <ArrowRight className="h-3 w-3 opacity-50" />}
                  <span className="font-hanzi font-semibold">{item.zh}</span>
                </React.Fragment>
              ))}
            </div>

            {/* Current Anchor Card */}
            <div className="glass-surface rounded-3xl p-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-1 font-hanzi text-5xl sm:text-6xl font-bold">
                {curChars.map((ch, idx) => (
                  <span
                    key={idx}
                    className={
                      idx === curChars.length - 1
                        ? 'text-teal-600 dark:text-teal-400 underline decoration-2 underline-offset-8'
                        : 'text-slate-900 dark:text-white'
                    }
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {currentNode.pinyin} · {isRu ? currentNode.ru : currentNode.en}
              </p>
              <button
                type="button"
                onClick={() => onSpeak(currentNode.zh)}
                className="glass-subtle inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-teal-700 dark:text-teal-300"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {isRu ? 'Озвучить' : 'Speak'}
              </button>
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const isPicked = feedback?.pickedZh === opt.node.zh;
                return (
                  <button
                    key={opt.node.zh}
                    type="button"
                    onClick={() => handleChoose(opt)}
                    className={`glass-surface flex min-h-[84px] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                      feedback
                        ? opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : isPicked
                            ? 'border-rose-500 bg-rose-500/15'
                            : 'border-transparent opacity-60'
                        : 'border-transparent hover:border-teal-500/40'
                    }`}
                  >
                    <span className="font-hanzi text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {opt.node.zh}
                    </span>
                    <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {opt.node.pinyin} · {isRu ? opt.node.ru : opt.node.en}
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
