export type ToneNumber = 1 | 2 | 3 | 4 | 5;

const TONE_MARK_MAP: Record<string, ToneNumber> = {
  'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1,
  'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2,
  'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3,
  'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4,
};

const DIACRITIC_STRIP_MAP: Record<string, string> = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v',
};

export function stripPinyinTones(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => DIACRITIC_STRIP_MAP[ch] ?? ch)
    .join('')
    .replace(/[1-5\s'’\-]/g, '');
}

export function detectSyllableTone(syllable: string): ToneNumber {
  const numMatch = syllable.match(/([1-5])/);
  if (numMatch) {
    return Number(numMatch[1]) as ToneNumber;
  }
  for (const ch of syllable.toLowerCase()) {
    if (TONE_MARK_MAP[ch]) {
      return TONE_MARK_MAP[ch];
    }
  }
  return 5;
}

export function extractTonesForCharacters(
  simplified: string,
  numericPinyin: string,
  pinyin: string
): ToneNumber[] {
  const chars = Array.from(simplified);
  const source = (numericPinyin || pinyin || '').trim();
  if (!source) {
    return chars.map(() => 5);
  }

  // Split by whitespace or numeric boundaries (e.g., "ni3hao3" or "ni3 hao3" or "nǐ hǎo")
  let tokens = source.split(/\s+/).filter(Boolean);
  if (tokens.length < chars.length && /\d/.test(source)) {
    const numSplit = source.match(/[a-zA-ZüÜ]+[1-5]?/g);
    if (numSplit && numSplit.length > 0) {
      tokens = numSplit;
    }
  }

  return chars.map((_, idx) => {
    const token = tokens[idx];
    if (!token) return 5;
    return detectSyllableTone(token);
  });
}

export function getToneColorClass(tone: ToneNumber): string {
  switch (tone) {
    case 1:
      return 'text-rose-600 dark:text-rose-400';
    case 2:
      return 'text-emerald-600 dark:text-emerald-400';
    case 3:
      return 'text-sky-600 dark:text-sky-400';
    case 4:
      return 'text-violet-600 dark:text-violet-400';
    case 5:
    default:
      return 'text-slate-500 dark:text-slate-400';
  }
}

export const TONE_LEGEND = [
  { tone: 1 as ToneNumber, label: '1st Flat', mark: 'ā', colorClass: 'text-rose-600 dark:text-rose-400' },
  { tone: 2 as ToneNumber, label: '2nd Rising', mark: 'á', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  { tone: 3 as ToneNumber, label: '3rd Dip', mark: 'ǎ', colorClass: 'text-sky-600 dark:text-sky-400' },
  { tone: 4 as ToneNumber, label: '4th Falling', mark: 'à', colorClass: 'text-violet-600 dark:text-violet-400' },
  { tone: 5 as ToneNumber, label: 'Neutral', mark: 'a', colorClass: 'text-slate-500 dark:text-slate-400' },
];
