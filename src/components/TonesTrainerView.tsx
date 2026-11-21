import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Ear,
  Snail,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import type { TranslationDict } from '../i18n/translations';

interface ToneExample {
  tone: 1 | 2 | 3 | 4 | 5;
  pinyin: string;
  char: string;
  ru: string;
  en: string;
}

interface SyllableGroup {
  id: string;
  base: string;
  items: ToneExample[];
}

// Uses authentic Mandarin single characters so OS/browser zh-CN TTS pronounces exact tones accurately
const SYLLABLE_GROUPS: SyllableGroup[] = [
  {
    id: 'ma',
    base: 'ma',
    items: [
      { tone: 1, pinyin: 'mā', char: '妈', ru: 'мама', en: 'mom' },
      { tone: 2, pinyin: 'má', char: '麻', ru: 'конопля / онемевший', en: 'hemp / numb' },
      { tone: 3, pinyin: 'mǎ', char: '马', ru: 'лошадь', en: 'horse' },
      { tone: 4, pinyin: 'mà', char: '骂', ru: 'ругать', en: 'scold' },
      { tone: 5, pinyin: 'ma', char: '吗', ru: 'вопр. частица', en: 'question particle' },
    ],
  },
  {
    id: 'ba',
    base: 'ba',
    items: [
      { tone: 1, pinyin: 'bā', char: '八', ru: 'восемь', en: 'eight' },
      { tone: 2, pinyin: 'bá', char: '拔', ru: 'вытягивать', en: 'pull out' },
      { tone: 3, pinyin: 'bǎ', char: '把', ru: 'держать / счёт. слово', en: 'hold / handle' },
      { tone: 4, pinyin: 'bà', char: '爸', ru: 'папа', en: 'dad' },
    ],
  },
  {
    id: 'tang',
    base: 'tang',
    items: [
      { tone: 1, pinyin: 'tāng', char: '汤', ru: 'суп', en: 'soup' },
      { tone: 2, pinyin: 'táng', char: '糖', ru: 'сахар / конфета', en: 'sugar / candy' },
      { tone: 3, pinyin: 'tǎng', char: '躺', ru: 'лежать', en: 'lie down' },
      { tone: 4, pinyin: 'tàng', char: '烫', ru: 'горячий / обжигать', en: 'scalding hot' },
    ],
  },
  {
    id: 'shi',
    base: 'shi',
    items: [
      { tone: 1, pinyin: 'shī', char: '诗', ru: 'стихотворение', en: 'poem' },
      { tone: 2, pinyin: 'shí', char: '十', ru: 'десять', en: 'ten' },
      { tone: 3, pinyin: 'shǐ', char: '史', ru: 'история', en: 'history' },
      { tone: 4, pinyin: 'shì', char: '是', ru: 'быть / да', en: 'to be / yes' },
    ],
  },
  {
    id: 'yi',
    base: 'yi',
    items: [
      { tone: 1, pinyin: 'yī', char: '衣', ru: 'одежда', en: 'clothes' },
      { tone: 2, pinyin: 'yí', char: '移', ru: 'передвигать', en: 'move / shift' },
      { tone: 3, pinyin: 'yǐ', char: '椅', ru: 'стул', en: 'chair' },
      { tone: 4, pinyin: 'yì', char: '意', ru: 'смысл / идея', en: 'meaning / idea' },
    ],
  },
  {
    id: 'shu',
    base: 'shu',
    items: [
      { tone: 1, pinyin: 'shū', char: '书', ru: 'книга', en: 'book' },
      { tone: 2, pinyin: 'shú', char: '熟', ru: 'знакомый / спелый', en: 'familiar / ripe' },
      { tone: 3, pinyin: 'shǔ', char: '鼠', ru: 'мышь', en: 'mouse' },
      { tone: 4, pinyin: 'shù', char: '树', ru: 'дерево', en: 'tree' },
    ],
  },
];

const TONE_COLOR_CLASSES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10',
  2: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  3: 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10',
  4: 'text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10',
  5: 'text-slate-600 dark:text-slate-300 border-slate-400/30 bg-slate-500/10',
};

const TONE_SVG_PATHS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'M 8 14 L 56 14',
  2: 'M 8 34 L 56 12',
  3: 'M 8 24 Q 30 44 56 16',
  4: 'M 8 12 L 56 36',
  5: 'M 24 24 L 40 24',
};

function pickRandomDrillQuestion(): { group: SyllableGroup; item: ToneExample } {
  const group = SYLLABLE_GROUPS[Math.floor(Math.random() * SYLLABLE_GROUPS.length)];
  const fourTones = group.items.filter((i) => i.tone !== 5);
  const item = fourTones[Math.floor(Math.random() * fourTones.length)];
  return { group, item };
}

interface TonesTrainerViewProps {
  t: TranslationDict;
  speechRate: number;
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

export const TonesTrainerView: React.FC<TonesTrainerViewProps> = ({
  t,
  speechRate,
  onSpeak,
  onClose,
}) => {
  const [tab, setTab] = useState<'guide' | 'drill'>('guide');
  const [groupId, setGroupId] = useState<string>('ma');

  const [question, setQuestion] = useState<{ group: SyllableGroup; item: ToneExample }>(() =>
    pickRandomDrillQuestion()
  );
  const [selectedTone, setSelectedTone] = useState<1 | 2 | 3 | 4 | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const activeGroup =
    SYLLABLE_GROUPS.find((g) => g.id === groupId) ?? SYLLABLE_GROUPS[0];

  const nextDrill = useCallback(() => {
    const next = pickRandomDrillQuestion();
    setQuestion(next);
    setSelectedTone(null);
    onSpeak(next.item.char, speechRate);
  }, [onSpeak, speechRate]);

  useEffect(() => {
    if (tab === 'drill') {
      onSpeak(question.item.char, speechRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleGuessTone = (tone: 1 | 2 | 3 | 4) => {
    if (selectedTone !== null) return;
    setSelectedTone(tone);
    const isCorrect = tone === question.item.tone;
    setTotalAnswered((n) => n + 1);
    if (isCorrect) {
      setTotalCorrect((n) => n + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="glass-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.tonesTrainer.close}
          </button>

          <div className="glass-subtle inline-flex rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTab('guide')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                tab === 'guide'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.tonesTrainer.guideTab}
            </button>
            <button
              type="button"
              onClick={() => setTab('drill')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-all whitespace-nowrap ${
                tab === 'drill'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Ear className="h-3.5 w-3.5" />
              {t.tonesTrainer.drillTab}
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t.tonesTrainer.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.tonesTrainer.subtitle}
          </p>
        </div>
      </div>

      {tab === 'guide' ? (
        <div className="space-y-5">
          {/* Minimal Pair Group Selector */}
          <div className="glass-surface rounded-3xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.tonesTrainer.syllableGroup}:
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.tonesTrainer.tapToListen}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SYLLABLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupId(g.id)}
                  className={`min-h-[40px] rounded-xl px-4 text-xs font-bold transition-all whitespace-nowrap ${
                    g.id === activeGroup.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'glass-subtle text-slate-700 hover:bg-white/85 dark:text-slate-200'
                  }`}
                >
                  {g.base}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeGroup.items.map((item) => (
              <button
                key={`${activeGroup.id}-${item.tone}`}
                type="button"
                onClick={() => onSpeak(item.char, speechRate)}
                className={`glass-surface rounded-3xl p-5 text-left flex items-center justify-between gap-4 border transition-all hover:scale-[1.01] active:scale-[0.99] ${TONE_COLOR_CLASSES[item.tone]}`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-hanzi text-3xl font-bold">{item.char}</span>
                    <span className="text-xl font-bold">{item.pinyin}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {t.tonesTrainer.toneNames[item.tone]}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.ru} · {item.en}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                    {t.tonesTrainer.toneDescs[item.tone]}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                  <svg className="w-16 h-12" viewBox="0 0 64 48" aria-hidden="true">
                    <line
                      x1="6"
                      y1="12"
                      x2="58"
                      y2="12"
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="6"
                      y1="36"
                      x2="58"
                      y2="36"
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeDasharray="3 3"
                    />
                    <path
                      d={TONE_SVG_PATHS[item.tone]}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/50">
                    <Volume2 className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Listening Drill */
        <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs font-mono-num text-slate-600 dark:text-slate-300">
            <span>{t.tonesTrainer.streakLabel(streak)}</span>
            <span>{t.tonesTrainer.accuracyLabel(totalCorrect, totalAnswered)}</span>
          </div>

          <div className="text-center space-y-4 py-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t.tonesTrainer.drillPrompt}
            </p>

            <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              {selectedTone !== null ? (
                <span className="inline-flex items-baseline gap-3">
                  <span className="font-hanzi">{question.item.char}</span>
                  <span className="text-teal-700 dark:text-teal-300">
                    {question.item.pinyin}
                  </span>
                </span>
              ) : (
                <span className="tracking-wide text-slate-700 dark:text-slate-200">
                  {question.group.base} <span className="text-teal-600">?</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => onSpeak(question.item.char, 1.0)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
              >
                <Volume2 className="h-4 w-4" />
                {t.tonesTrainer.playNormal}
              </button>
              <button
                type="button"
                onClick={() => onSpeak(question.item.char, 0.7)}
                className="glass-subtle inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                <Snail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                {t.tonesTrainer.playSlow}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([1, 2, 3, 4] as const).map((tone) => {
              const isSelected = selectedTone === tone;
              const isAnswer = question.item.tone === tone;
              let extra = 'hover:scale-[1.02]';
              if (selectedTone !== null) {
                if (isAnswer) {
                  extra = 'ring-2 ring-emerald-500';
                } else if (isSelected) {
                  extra = 'ring-2 ring-rose-500 opacity-75';
                } else {
                  extra = 'opacity-45';
                }
              }
              return (
                <button
                  key={tone}
                  type="button"
                  disabled={selectedTone !== null}
                  onClick={() => handleGuessTone(tone)}
                  className={`rounded-2xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${TONE_COLOR_CLASSES[tone]} ${extra}`}
                >
                  <svg className="w-16 h-11" viewBox="0 0 64 48" aria-hidden="true">
                    <path
                      d={TONE_SVG_PATHS[tone]}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.session.toneLabels[tone]}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedTone !== null && (
            <div
              className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                selectedTone === question.item.tone
                  ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-500/12 border-rose-500/30 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {selectedTone === question.item.tone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">
                    {selectedTone === question.item.tone
                      ? t.tonesTrainer.correctTone
                      : t.tonesTrainer.wrongTone(question.item.tone)}
                  </p>
                  <p>
                    <span className="font-hanzi font-bold text-sm">{question.item.char}</span> ·{' '}
                    {question.item.pinyin} · {question.item.ru} ({question.item.en})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={nextDrill}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap shrink-0"
              >
                {t.tonesTrainer.nextQuestion}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
