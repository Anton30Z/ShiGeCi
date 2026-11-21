import {
  Blocks,
  Crosshair,
  Droplets,
  Gamepad2,
  Grid2x2,
  Layers,
  Link2,
  MessageCircle,
  PenTool,
  Play,
  SearchX,
  Trophy,
  Waves,
} from 'lucide-react';
import React, { useState } from 'react';
import type { LanguageCode } from '../../types/vocab';

export type ActiveGameId =
  | 'tetris'
  | 'rain-drop'
  | 'builder'
  | 'audio-shooter'
  | 'stroke-blitz'
  | 'memory-pairs'
  | 'odd-radical'
  | 'word-chain'
  | 'quick-dialogue'
  | 'tone-coaster';

type GameCategory = 'all' | 'speed' | 'bricks' | 'audio';

interface GamesSectionProps {
  language: LanguageCode;
  onStartGame: (gameId: ActiveGameId) => void;
}

function readBest(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

export const GamesSection: React.FC<GamesSectionProps> = ({ language, onStartGame }) => {
  const isRu = language === 'ru';
  const [filter, setFilter] = useState<GameCategory>('all');

  const games: Array<{
    id: ActiveGameId;
    category: Exclude<GameCategory, 'all'>;
    kicker: string;
    title: string;
    desc: string;
    best: number;
    icon: React.ComponentType<{ className?: string }>;
    accentBtn: string;
  }> = [
    {
      id: 'tetris',
      category: 'speed',
      kicker: isRu ? 'Игра 1 · Реакция' : 'Game 1 · Reflex',
      title: isRu ? 'Тетрис · Shi Ge Ci' : 'Shi Ge Ci · Tetris Drop',
      desc: isRu
        ? 'Сверху падает иероглиф, снизу 3 слова. Ошибка сразу сбрасывает блок в стакан.'
        : 'Characters drop with 3 choices below. Wrong taps stack blocks up like Tetris.',
      best: readBest('shigeci_tetris_best_v1'),
      icon: Grid2x2,
      accentBtn: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    {
      id: 'rain-drop',
      category: 'speed',
      kicker: isRu ? 'Игра 10 · Капли' : 'Game 10 · Droplets',
      title: isRu ? 'Капли слов · Shi Ge Ci' : 'Word Rain · Shi Ge Ci',
      desc: isRu
        ? 'Сверху падают 3 капли-иероглифа по очереди. Поймайте 1 из 3 — услышите озвучку, а промах растекается по воде.'
        : '3 character droplets fall one by one over 3 words. Catch 1 to hear Mandarin audio; misses splash on the surface.',
      best: readBest('shigeci_raindrop_best_v1'),
      icon: Droplets,
      accentBtn: 'bg-sky-600 text-white hover:bg-sky-700',
    },
    {
      id: 'builder',
      category: 'bricks',
      kicker: isRu ? 'Игра 2 · 4 этапа' : 'Game 2 · 4 Stages',
      title: isRu ? 'Сборка иероглифов и фраз' : 'Shi Ge Ci · Word Builder',
      desc: isRu
        ? 'Ловите падающие части: составные знаки, иероглифы, слова и предложения.'
        : 'Catch falling parts to build composite bricks, characters, words, and sentences.',
      best: readBest('shigeci_builder_best_v1'),
      icon: Blocks,
      accentBtn: 'bg-sky-600 text-white hover:bg-sky-700',
    },
    {
      id: 'audio-shooter',
      category: 'audio',
      kicker: isRu ? 'Игра 3 · Слух' : 'Game 3 · Listening',
      title: isRu ? 'Звуковой тир' : 'Audio Target Shoot',
      desc: isRu
        ? 'Прозвучало слово — успейте сбить нужную движущуюся мишень среди 4 похожих.'
        : 'Hear the word and shoot the matching target among 4 moving character tiles.',
      best: readBest('shigeci_audio_best_v1'),
      icon: Crosshair,
      accentBtn: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    {
      id: 'stroke-blitz',
      category: 'bricks',
      kicker: isRu ? 'Игра 4 · Письмо' : 'Game 4 · Strokes',
      title: isRu ? 'Скоропись штрихов' : 'Stroke Blitz',
      desc: isRu
        ? 'Напишите иероглиф пальцем по чертам на время, опираясь только на перевод.'
        : 'Write each character in the right stroke order against a 20-second clock.',
      best: readBest('shigeci_stroke_best_v1'),
      icon: PenTool,
      accentBtn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    {
      id: 'memory-pairs',
      category: 'bricks',
      kicker: isRu ? 'Игра 5 · Память' : 'Game 5 · Memory',
      title: isRu ? 'Китайские пары' : 'Memory Pairs 4×4',
      desc: isRu
        ? 'Сетка 4×4: ищите пары Иероглиф ↔ Перевод, Ключ ↔ Слово или Звук ↔ Знак.'
        : 'Flip 4×4 cards to match Character ↔ Meaning, Radical ↔ Word, or Audio ↔ Character.',
      best: readBest('shigeci_memory_best_v1'),
      icon: Layers,
      accentBtn: 'bg-sky-600 text-white hover:bg-sky-700',
    },
    {
      id: 'odd-radical',
      category: 'bricks',
      kicker: isRu ? 'Игра 6 · Ключи' : 'Game 6 · Radicals',
      title: isRu ? 'Охота на лишний ключ' : 'Odd Radical Out',
      desc: isRu
        ? 'Из 4 иероглифов три содержат общий смысловой ключ. Найдите лишний за 10 сек.'
        : 'Three of 4 characters share a radical brick — spot the odd intruder fast.',
      best: readBest('shigeci_odd_best_v1'),
      icon: SearchX,
      accentBtn: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      id: 'word-chain',
      category: 'speed',
      kicker: isRu ? 'Игра 7 · Домино' : 'Game 7 · Domino',
      title: isRu ? 'Цепочка иероглифов' : 'Shi Ge Ci · Word Chain',
      desc: isRu
        ? 'Следующее слово начинается с последнего знака предыдущего (今天 → 天气).'
        : 'Pick the next word starting with the last character of the current word.',
      best: readBest('shigeci_chain_best_v1'),
      icon: Link2,
      accentBtn: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    {
      id: 'quick-dialogue',
      category: 'speed',
      kicker: isRu ? 'Игра 8 · Разговор' : 'Game 8 · Dialogue',
      title: isRu ? 'Быстрый диалог' : 'Quick Dialogue Sprint',
      desc: isRu
        ? 'Собеседник задаёт вопрос на китайском со звуком — выберите уместный ответ.'
        : 'Listen to a real-life Mandarin prompt and pick the natural reply quickly.',
      best: readBest('shigeci_dialogue_best_v1'),
      icon: MessageCircle,
      accentBtn: 'bg-sky-600 text-white hover:bg-sky-700',
    },
    {
      id: 'tone-coaster',
      category: 'audio',
      kicker: isRu ? 'Игра 9 · Тоны' : 'Game 9 · Tones',
      title: isRu ? 'Башня тонов' : 'Tone Coaster',
      desc: isRu
        ? 'Свайпните кривую нужного тона прямо на карточке или выберите горку внизу.'
        : 'Swipe the Mandarin tone contour on the pad or tap the matching tone track.',
      best: readBest('shigeci_tonecoaster_best_v1'),
      icon: Waves,
      accentBtn: 'bg-violet-600 text-white hover:bg-violet-700',
    },
  ];

  const visibleGames =
    filter === 'all' ? games : games.filter((g) => g.category === filter);

  const tabs: Array<{ id: GameCategory; label: string }> = [
    { id: 'all', label: isRu ? `Все (${games.length})` : `All (${games.length})` },
    { id: 'speed', label: isRu ? 'Реакция и слова' : 'Speed & Words' },
    { id: 'bricks', label: isRu ? 'Кирпичики и письмо' : 'Bricks & Writing' },
    { id: 'audio', label: isRu ? 'Слух и тоны' : 'Audio & Tones' },
  ];

  return (
    <section aria-labelledby="games-module-heading">
      <div className="glass-surface rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="games-module-heading"
              className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white"
            >
              <Gamepad2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {isRu ? 'Игры для запоминания' : 'Memory Games'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isRu
                ? 'Попробуйте все 10 мини-игр — потом оставим только самые любимые'
                : 'Try all 10 mini-games and pick your favorites to keep'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-900/5 p-1 dark:bg-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {visibleGames.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-900/8 bg-white/55 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-900/45"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{game.kicker}</span>
                    {game.best > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono-num font-semibold text-amber-600 dark:text-amber-400">
                        <Trophy className="h-3.5 w-3.5" />
                        {game.best}
                      </span>
                    )}
                  </div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{game.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {game.desc}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onStartGame(game.id)}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] whitespace-nowrap shrink-0 ${game.accentBtn}`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isRu ? 'Играть' : 'Play'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
