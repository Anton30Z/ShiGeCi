import {
  Grid2x2,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEMORY_RADICAL_WORD_PAIRS } from '../../data/miniGamesData';
import { getWordMeanings, STARTER_HSK1_WORDS } from '../../data/starterHsk1';
import {
  playErrorSound,
  playSnapSound,
  playSuccessSound,
} from '../../services/gameAudio';
import type { LanguageCode, VocabWord } from '../../types/vocab';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';
type MemoryMode = 'hanzi-meaning' | 'radical-word' | 'audio-hanzi';

interface MemoryPairsGameProps {
  vocabWords: VocabWord[];
  language: LanguageCode;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

interface MemoryCard {
  uid: string;
  pairId: string;
  kind: 'hanzi' | 'meaning' | 'radical' | 'audio';
  primaryText: string;
  subText?: string;
  speakText?: string;
  flipped: boolean;
  matched: boolean;
}

const BEST_KEY = 'shigeci_memory_best_v1';

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

export const MemoryPairsGame: React.FC<MemoryPairsGameProps> = ({
  vocabWords,
  language,
  onSpeak,
  onClose,
}) => {
  const isRu = language === 'ru';
  const wordPool = useMemo(
    () => (vocabWords.length >= 8 ? vocabWords : STARTER_HSK1_WORDS),
    [vocabWords]
  );

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mode, setMode] = useState<MemoryMode>('hanzi-meaning');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const lockBoardRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [gameState]);

  const buildDeck = useCallback(
    (selectedMode: MemoryMode): MemoryCard[] => {
      if (selectedMode === 'radical-word') {
        const chosen = shuffle(MEMORY_RADICAL_WORD_PAIRS).slice(0, 8);
        const raw: MemoryCard[] = [];
        for (const p of chosen) {
          raw.push({
            uid: `${p.id}-r`,
            pairId: p.id,
            kind: 'radical',
            primaryText: p.radical,
            subText: isRu ? p.radicalHintRu : p.radicalHintEn,
            flipped: false,
            matched: false,
          });
          raw.push({
            uid: `${p.id}-w`,
            pairId: p.id,
            kind: 'hanzi',
            primaryText: p.wordChar,
            subText: isRu ? p.meaningRu : p.meaningEn,
            speakText: p.wordChar,
            flipped: false,
            matched: false,
          });
        }
        return shuffle(raw);
      }

      const chosen = shuffle(wordPool).slice(0, 8);
      const raw: MemoryCard[] = [];
      for (const w of chosen) {
        const meaning = getWordMeanings(w, language)[0] ?? w.simplified;
        if (selectedMode === 'audio-hanzi') {
          raw.push({
            uid: `${w.id}-a`,
            pairId: w.id,
            kind: 'audio',
            primaryText: isRu ? 'Звук' : 'Audio',
            speakText: w.simplified,
            flipped: false,
            matched: false,
          });
          raw.push({
            uid: `${w.id}-h`,
            pairId: w.id,
            kind: 'hanzi',
            primaryText: w.simplified,
            subText: meaning,
            flipped: false,
            matched: false,
          });
        } else {
          raw.push({
            uid: `${w.id}-h`,
            pairId: w.id,
            kind: 'hanzi',
            primaryText: w.simplified,
            subText: w.pinyin,
            speakText: w.simplified,
            flipped: false,
            matched: false,
          });
          raw.push({
            uid: `${w.id}-m`,
            pairId: w.id,
            kind: 'meaning',
            primaryText: meaning,
            flipped: false,
            matched: false,
          });
        }
      }
      return shuffle(raw);
    },
    [isRu, language, wordPool]
  );

  const startGame = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    lockBoardRef.current = false;
    setCards(buildDeck(mode));
    setSelectedIds([]);
    setMoves(0);
    setElapsedSec(0);
    setScore(0);
    setGameState('PLAYING');
  }, [buildDeck, mode]);

  const handleFlipCard = useCallback(
    (uid: string) => {
      if (lockBoardRef.current || gameState !== 'PLAYING') return;
      const target = cards.find((c) => c.uid === uid);
      if (!target || target.matched) return;

      // In audio mode, clicking an already flipped audio card replays sound
      if (target.flipped) {
        if (target.speakText) onSpeak(target.speakText);
        return;
      }

      if (target.speakText) {
        onSpeak(target.speakText);
      } else {
        playSnapSound(false);
      }

      const nextCards = cards.map((c) =>
        c.uid === uid ? { ...c, flipped: true } : c
      );
      setCards(nextCards);

      const nextSelected = [...selectedIds, uid];
      setSelectedIds(nextSelected);

      if (nextSelected.length < 2) return;

      lockBoardRef.current = true;
      setMoves((m) => m + 1);

      const [firstId, secondId] = nextSelected;
      const c1 = nextCards.find((c) => c.uid === firstId);
      const c2 = nextCards.find((c) => c.uid === secondId);

      if (c1 && c2 && c1.pairId === c2.pairId) {
        playSuccessSound(false);
        const matchedDeck = nextCards.map((c) =>
          c.pairId === c1.pairId ? { ...c, matched: true } : c
        );
        setCards(matchedDeck);
        setSelectedIds([]);
        lockBoardRef.current = false;

        if (matchedDeck.every((c) => c.matched)) {
          const finalMoves = moves + 1;
          const finalScore = Math.max(50, 400 - finalMoves * 10 - elapsedSec * 2);
          setScore(finalScore);
          setBestScore((prev) => {
            const nb = Math.max(prev, finalScore);
            if (nb > prev) saveBest(nb);
            return nb;
          });
          timerRef.current = window.setTimeout(() => setGameState('GAME_OVER'), 450);
        }
      } else {
        playErrorSound(false);
        timerRef.current = window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === firstId || c.uid === secondId ? { ...c, flipped: false } : c
            )
          );
          setSelectedIds([]);
          lockBoardRef.current = false;
        }, 720);
      }
    },
    [cards, elapsedSec, gameState, moves, onSpeak, selectedIds]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const matchedPairs = cards.filter((c) => c.matched).length / 2;

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

          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold font-mono-num">
            <span className="text-teal-700 dark:text-teal-300">
              {matchedPairs}/8
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {isRu ? 'Ходы' : 'Moves'}: {moves}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {elapsedSec}s
            </span>
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
                {isRu ? 'Аркада запоминания · Игра 5' : 'Memory Arcade · Game 5'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isRu ? 'Китайские пары (Мемори)' : 'Memory Pairs'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRu
                  ? 'Сетка 4×4 (8 пар). Открывайте карточки и находите соответствия как можно быстрее и за меньшее число ходов.'
                  : '4×4 memory grid (8 pairs). Flip cards and match pairs in as few moves and seconds as possible.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ['hanzi-meaning', isRu ? 'Иероглиф ↔ Перевод' : 'Character ↔ Meaning'],
                  ['radical-word', isRu ? 'Ключ ↔ Слово' : 'Radical ↔ Word'],
                  ['audio-hanzi', isRu ? 'Звук ↔ Иероглиф' : 'Audio ↔ Character'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`min-h-[48px] rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                    mode === id
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                      : 'glass-subtle text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
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
              {isRu ? 'Все пары найдены!' : 'All Pairs Matched!'}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-teal-700 dark:text-teal-300">
                  {score}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Очки' : 'Score'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white">
                  {moves}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Ходов' : 'Moves'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/5 p-3 dark:bg-white/5">
                <p className="font-mono-num text-xl font-bold text-amber-600 dark:text-amber-400">
                  {elapsedSec}s
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isRu ? 'Время' : 'Time'}
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
          <div className="grid flex-1 grid-cols-4 gap-2 sm:gap-3 py-1">
            {cards.map((card) => {
              const revealed = card.flipped || card.matched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleFlipCard(card.uid)}
                  className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border-2 p-2 text-center transition-all active:scale-95 ${
                    card.matched
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                      : revealed
                        ? 'border-teal-500 bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-white'
                        : 'border-slate-900/10 bg-slate-900/5 text-slate-400 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {!revealed ? (
                    <Grid2x2 className="h-5 w-5 opacity-40" />
                  ) : card.kind === 'audio' ? (
                    <div className="flex flex-col items-center gap-1 text-teal-600 dark:text-teal-300">
                      <Volume2 className="h-6 w-6" />
                      <span className="text-[11px] font-semibold">{card.primaryText}</span>
                    </div>
                  ) : (
                    <>
                      <span
                        className={
                          card.kind === 'hanzi' || card.kind === 'radical'
                            ? 'font-hanzi text-2xl sm:text-3xl font-bold leading-none'
                            : 'text-xs sm:text-sm font-semibold leading-snug line-clamp-2'
                        }
                      >
                        {card.primaryText}
                      </span>
                      {card.subText && (
                        <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                          {card.subText}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
