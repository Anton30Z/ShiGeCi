import { STARTER_HSK1_WORDS } from '../data/starterHsk1';
import type { HskLevel, TopicId, VocabWord } from '../types/vocab';
import { stripPinyinTones } from '../utils/tones';
import { classifyWordTopic } from '../utils/topics';
import { getCachedHskList, setCachedHskList } from './storage';

const HSK_CDN_BASES = [
  'https://cdn.jsdelivr.net/gh/drkameleon/complete-hsk-vocabulary@main/wordlists/exclusive/new',
  'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/new',
];

interface RawCompleteHskFormFull {
  transcriptions?: {
    pinyin?: string;
    numeric?: string;
  };
  meanings?: string[];
}

interface RawCompleteHskFormCompact {
  i?: {
    y?: string;
    n?: string;
  };
  m?: string[];
}

interface RawHskEntry {
  // Full complete-hsk-vocabulary schema
  simplified?: string;
  radical?: string;
  forms?: RawCompleteHskFormFull[];
  // Compact / bundled bilingual schema
  s?: string;
  p?: string;
  n?: string;
  r?: string;
  m?: string[];
  ru?: string[];
  t?: TopicId;
  f?: RawCompleteHskFormCompact[];
}

const STARTER_BY_SIMPLIFIED = new Map(
  STARTER_HSK1_WORDS.map((word) => [word.simplified, word])
);

function normalizeHskEntry(raw: RawHskEntry, level: HskLevel): VocabWord | null {
  const simplified =
    typeof raw.simplified === 'string'
      ? raw.simplified.trim()
      : typeof raw.s === 'string'
        ? raw.s.trim()
        : '';
  if (!simplified) return null;

  const starterMatch = level === 1 ? STARTER_BY_SIMPLIFIED.get(simplified) : undefined;
  const firstFullForm = Array.isArray(raw.forms) && raw.forms.length > 0 ? raw.forms[0] : undefined;
  const firstCompactForm = Array.isArray(raw.f) && raw.f.length > 0 ? raw.f[0] : undefined;

  const pinyin = (
    raw.p ||
    firstFullForm?.transcriptions?.pinyin ||
    firstCompactForm?.i?.y ||
    starterMatch?.pinyin ||
    ''
  ).trim();

  const numericPinyin = (
    raw.n ||
    firstFullForm?.transcriptions?.numeric ||
    firstCompactForm?.i?.n ||
    starterMatch?.numericPinyin ||
    ''
  ).trim();

  const radical = (raw.radical || raw.r || starterMatch?.radical || '').trim();

  let meanings: string[] = [];
  if (Array.isArray(raw.m) && raw.m.length > 0) {
    meanings = raw.m.filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
  } else if (Array.isArray(raw.forms)) {
    const collected = new Set<string>();
    for (const form of raw.forms) {
      if (Array.isArray(form.meanings)) {
        for (const meaning of form.meanings) {
          if (typeof meaning === 'string' && meaning.trim().length > 0) {
            collected.add(meaning.trim());
          }
        }
      }
    }
    meanings = Array.from(collected);
  } else if (Array.isArray(raw.f)) {
    const collected = new Set<string>();
    for (const form of raw.f) {
      if (Array.isArray(form.m)) {
        for (const meaning of form.m) {
          if (typeof meaning === 'string' && meaning.trim().length > 0) {
            collected.add(meaning.trim());
          }
        }
      }
    }
    meanings = Array.from(collected);
  }

  if (meanings.length === 0 && starterMatch) {
    meanings = starterMatch.meanings;
  }

  const meaningsRu =
    starterMatch?.meaningsRu && starterMatch.meaningsRu.length > 0
      ? starterMatch.meaningsRu
      : Array.isArray(raw.ru)
        ? raw.ru.filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
        : undefined;

  const finalMeanings = meanings.length > 0 ? meanings : ['Mandarin vocabulary item'];

  return {
    id: `hsk${level}-${simplified}`,
    simplified,
    pinyin: pinyin || numericPinyin,
    numericPinyin,
    plainPinyin: stripPinyinTones(numericPinyin || pinyin),
    radical: radical || '—',
    meanings: finalMeanings,
    meaningsRu,
    level,
    topic: classifyWordTopic({
      simplified,
      meanings: finalMeanings,
      meaningsRu,
      topic: raw.t,
    }),
    example: starterMatch?.example,
  };
}

export interface HskLoadResult {
  words: VocabWord[];
  source: 'cache' | 'network' | 'starter-fallback' | 'empty';
  error?: string;
}

async function fetchLevelJsonWithFallback(level: HskLevel): Promise<unknown> {
  const urls = [
    `/data/hsk-${level}.json`,
    ...HSK_CDN_BASES.map((base) => `${base}/${level}.json`),
  ];

  let lastError: Error | null = null;
  for (const url of urls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} while fetching HSK ${level}`);
        continue;
      }
      return (await response.json()) as unknown;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error(`Unable to fetch HSK ${level}`);
}

export async function loadHskLevel(level: HskLevel, forceRefresh = false): Promise<HskLoadResult> {
  if (!forceRefresh) {
    const cached = await getCachedHskList(level);
    if (cached && cached.length > 0) {
      const enriched = cached.map((w) => {
        const starter = level === 1 ? STARTER_BY_SIMPLIFIED.get(w.simplified) : undefined;
        return {
          ...w,
          meaningsRu: w.meaningsRu ?? starter?.meaningsRu,
          example: w.example ?? starter?.example,
          topic: w.topic ?? classifyWordTopic(w),
        };
      });
      return { words: enriched, source: 'cache' };
    }
  }

  try {
    const rawData = await fetchLevelJsonWithFallback(level);
    if (!Array.isArray(rawData)) {
      throw new Error('Unexpected HSK JSON structure');
    }

    const normalized: VocabWord[] = [];
    const seen = new Set<string>();
    for (const item of rawData) {
      const word = normalizeHskEntry(item as RawHskEntry, level);
      if (word && !seen.has(word.id)) {
        seen.add(word.id);
        normalized.push(word);
      }
    }

    if (normalized.length === 0) {
      throw new Error('Empty HSK wordlist returned');
    }

    await setCachedHskList(level, normalized);
    return { words: normalized, source: 'network' };
  } catch (err) {
    if (level === 1) {
      return {
        words: STARTER_HSK1_WORDS,
        source: 'starter-fallback',
        error:
          err instanceof Error
            ? err.message
            : 'Network unavailable; using offline HSK 1 starter pack.',
      };
    }
    return {
      words: [],
      source: 'starter-fallback',
      error:
        err instanceof Error
          ? `Could not load HSK ${level} (${err.message}). Connect to the internet to download this level.`
          : `Could not load HSK ${level} offline.`,
    };
  }
}

export async function loadHskLevels(
  levels: HskLevel[],
  forceRefresh = false
): Promise<HskLoadResult> {
  const sorted = Array.from(new Set(levels)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { words: [], source: 'empty' };
  }

  const results = await Promise.all(sorted.map((lvl) => loadHskLevel(lvl, forceRefresh)));
  const combined: VocabWord[] = [];
  const seenSimplified = new Set<string>();
  const errors: string[] = [];

  let hasNetwork = false;
  let hasFallback = false;

  for (const res of results) {
    if (res.source === 'network') hasNetwork = true;
    if (res.source === 'starter-fallback') hasFallback = true;
    if (res.error) errors.push(res.error);
    for (const word of res.words) {
      if (!seenSimplified.has(word.simplified)) {
        seenSimplified.add(word.simplified);
        combined.push(word);
      }
    }
  }

  const source: HskLoadResult['source'] = hasFallback
    ? 'starter-fallback'
    : hasNetwork
      ? 'network'
      : 'cache';

  return {
    words: combined,
    source,
    error: errors.length > 0 ? errors.join(' ') : undefined,
  };
}
