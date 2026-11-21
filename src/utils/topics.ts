import { getWordLearningStatus } from '../services/fsrsEngine';
import type { TopicId, VocabWord, WordProgress } from '../types/vocab';

export const DAILY_LIMIT_OPTIONS = [3, 5, 7, 10, 15, 20] as const;

export function normalizeDailyLimit(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 10;
  let closest: number = DAILY_LIMIT_OPTIONS[0];
  let minDiff = Math.abs(num - closest);
  for (const opt of DAILY_LIMIT_OPTIONS) {
    const diff = Math.abs(num - opt);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }
  return closest;
}

export const TOPIC_ORDER: TopicId[] = [
  'basics',
  'people',
  'time',
  'food',
  'home',
  'places',
  'travel',
  'work',
  'health',
  'communication',
  'descriptions',
  'actions',
  'custom',
];

export function classifyWordTopic(
  word: Pick<VocabWord, 'simplified' | 'meanings' | 'meaningsRu' | 'topic' | 'isCustom'>
): TopicId {
  if (word.isCustom) return 'custom';
  if (word.topic && TOPIC_ORDER.includes(word.topic)) {
    return word.topic;
  }

  const blob = `${word.meanings.join(' ')} ${(word.meaningsRu ?? []).join(' ')}`.toLowerCase();

  if (
    /(eat|drink|food|meal|breakfast|lunch|dinner|tea|coffee|water|milk|rice|noodle|bread|meat|fruit|apple|vegetable|dish|soup|sugar|restaurant|delicious|еда|пить|чай|кофе|блюдо|суп|мясо|рыба|фрукт|овощ|ресторан|завтрак|обед|ужин)/.test(
      blob
    )
  ) {
    return 'food';
  }
  if (
    /(train|plane|airplane|airport|bus|taxi|car|bicycle|subway|station|ticket|hotel|trip|travel|flight|drive|road|street|поезд|самолёт|самолет|такси|автобус|метро|билет|вокзал|аэропорт|путешеств|поездк|гостиниц)/.test(
      blob
    )
  ) {
    return 'travel';
  }
  if (
    /(doctor|hospital|medicine|sick|ill|disease|pain|head|eye|ear|hand|foot|heart|body|health|sport|swim|run|sleep|tired|врач|больниц|лекарств|болезн|здоров|тело|голова|рука|нога|спорт|спать)/.test(
      blob
    )
  ) {
    return 'health';
  }
  if (
    /(father|dad|mother|mom|son|daughter|brother|sister|husband|wife|family|parent|child|friend|people|person|teacher|student|семья|отец|папа|мать|мама|сын|дочь|брат|сестра|муж|жена|друг|человек|ребёнок|ребенок)/.test(
      blob
    )
  ) {
    return 'people';
  }
  if (
    /(school|university|class|lesson|exam|study|learn|book|read|write|work|job|office|company|business|computer|internet|phone|школа|университет|урок|экзамен|учить|книга|работа|офис|компьютер|телефон)/.test(
      blob
    )
  ) {
    return 'work';
  }
  if (
    /(time|hour|minute|second|day|week|month|year|morning|afternoon|evening|night|today|tomorrow|yesterday|season|spring|summer|autumn|winter|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|время|час|минут|день|недел|месяц|год|утро|вечер|сегодня|завтра|вчера|один|два|три|четыре|пять|шесть|семь|восемь|девять|десять)/.test(
      blob
    )
  ) {
    return 'time';
  }
  if (
    /(house|home|room|door|window|table|chair|bed|clothes|shirt|shoes|bag|cup|glass|watch|clock|money|price|buy|sell|shop|store|дом|комнат|дверь|окно|стол|стул|одежд|деньги|цена|купить|магазин|чашка|стакан)/.test(
      blob
    )
  ) {
    return 'home';
  }
  if (
    /(city|country|china|beijing|shanghai|world|sun|moon|weather|rain|snow|wind|mountain|river|sea|tree|flower|dog|cat|park|north|south|east|west|город|страна|мир|погода|дождь|снег|гора|река|море|собака|кошка|пекин)/.test(
      blob
    )
  ) {
    return 'places';
  }
  if (
    /(speak|say|talk|tell|ask|answer|hello|thank|sorry|please|welcome|goodbye|language|chinese|english|word|sentence|music|movie|film|говорить|сказать|привет|спасибо|извин|пожалуйста|язык|слово|фильм|музыка)/.test(
      blob
    )
  ) {
    return 'communication';
  }
  if (
    /(big|small|large|little|good|bad|new|old|long|short|high|tall|fast|slow|easy|hard|happy|sad|love|like|beautiful|color|red|blue|green|white|black|большой|маленький|хороший|плохой|новый|старый|красный|синий|зелёный|белый|чёрный|любить|нравиться)/.test(
      blob
    )
  ) {
    return 'descriptions';
  }
  if (
    /(possessive|particle|measure word|pronoun|all|both|many|much|more|no|not|how much|how many|частиц|счётное|местоимен|все|оба|много|сколько|не|нет)/.test(
      blob
    )
  ) {
    return 'basics';
  }
  return 'actions';
}

export interface TopicPack {
  packNumber: number;
  startIndex: number;
  endIndex: number;
  words: VocabWord[];
  learnedCount: number;
  masteredCount: number;
}

export interface TopicSummary {
  topic: TopicId;
  words: VocabWord[];
  packs: TopicPack[];
  learnedCount: number;
  masteredCount: number;
}

export function buildTopicSummaries(
  words: VocabWord[],
  customWords: VocabWord[],
  progressMap: Record<string, WordProgress>,
  packSize: number
): TopicSummary[] {
  const safeSize = Math.max(1, packSize);
  const grouped = new Map<TopicId, VocabWord[]>();
  for (const topic of TOPIC_ORDER) {
    grouped.set(topic, []);
  }

  for (const word of customWords) {
    grouped.get('custom')?.push(word);
  }
  for (const word of words) {
    const topic = classifyWordTopic(word);
    grouped.get(topic)?.push(word);
  }

  const summaries: TopicSummary[] = [];
  for (const topic of TOPIC_ORDER) {
    const topicWords = grouped.get(topic) ?? [];
    if (topicWords.length === 0) continue;

    let learnedCount = 0;
    let masteredCount = 0;
    for (const w of topicWords) {
      const st = getWordLearningStatus(progressMap[w.id]);
      if (st !== 'new') learnedCount++;
      if (st === 'mastered') masteredCount++;
    }

    const packs: TopicPack[] = [];
    for (let i = 0; i < topicWords.length; i += safeSize) {
      const slice = topicWords.slice(i, i + safeSize);
      let packLearned = 0;
      let packMastered = 0;
      for (const w of slice) {
        const st = getWordLearningStatus(progressMap[w.id]);
        if (st !== 'new') packLearned++;
        if (st === 'mastered') packMastered++;
      }
      packs.push({
        packNumber: packs.length + 1,
        startIndex: i + 1,
        endIndex: i + slice.length,
        words: slice,
        learnedCount: packLearned,
        masteredCount: packMastered,
      });
    }

    summaries.push({
      topic,
      words: topicWords,
      packs,
      learnedCount,
      masteredCount,
    });
  }

  return summaries;
}
