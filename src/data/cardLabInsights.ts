import type { LanguageCode, VocabWord } from '../types/vocab';

export interface CharacterBreakdownPart {
  symbol: string;
  glossRu: string;
  glossEn: string;
}

export interface NeighborWord {
  zh: string;
  pinyin: string;
  meaningRu: string;
  meaningEn: string;
}

export interface WordDeepInsight {
  parts: CharacterBreakdownPart[];
  formulaRu?: string;
  formulaEn?: string;
  mnemonicRu: string;
  mnemonicEn: string;
  neighbors: NeighborWord[];
}

const INSIGHTS_BY_WORD_ID: Record<string, WordDeepInsight> = {
  'hsk1-爱': {
    parts: [
      { symbol: '爫', glossRu: 'рука сверху', glossEn: 'hand above' },
      { symbol: '冖', glossRu: 'покров', glossEn: 'cover' },
      { symbol: '友', glossRu: 'друг', glossEn: 'friend' },
    ],
    formulaRu: 'рука бережно укрывает друга = любить',
    formulaEn: 'a hand shelters a friend = to love',
    mnemonicRu: 'Рука под крышей бережно оберегает друга — так рождается любовь.',
    mnemonicEn: 'A hand under a roof gently shelters a friend — that is love.',
    neighbors: [
      { zh: '爱好', pinyin: 'ài hào', meaningRu: 'хобби, увлечение', meaningEn: 'hobby' },
      { zh: '可爱', pinyin: 'kě ài', meaningRu: 'милый, симпатичный', meaningEn: 'cute, lovely' },
      { zh: '爱情', pinyin: 'ài qíng', meaningRu: 'любовь, романтика', meaningEn: 'romance, love' },
    ],
  },
  'hsk1-茶': {
    parts: [
      { symbol: '艹', glossRu: 'трава, листья', glossEn: 'grass / leaves' },
      { symbol: '人', glossRu: 'человек', glossEn: 'person' },
      { symbol: '木', glossRu: 'дерево', glossEn: 'tree' },
    ],
    formulaRu: 'человек между листьями и деревом = чай',
    formulaEn: 'person between leaves and tree = tea',
    mnemonicRu: 'Человек под навесом из листьев у чайного дерева — время пить чай.',
    mnemonicEn: 'A person under a leafy canopy beside a tree — tea harvest.',
    neighbors: [
      { zh: '喝茶', pinyin: 'hē chá', meaningRu: 'пить чай', meaningEn: 'drink tea' },
      { zh: '绿茶', pinyin: 'lǜ chá', meaningRu: 'зелёный чай', meaningEn: 'green tea' },
      { zh: '奶茶', pinyin: 'nǎi chá', meaningRu: 'чай с молоком', meaningEn: 'milk tea' },
    ],
  },
  'hsk1-八': {
    parts: [
      { symbol: '丿', glossRu: 'черта влево', glossEn: 'left sweep' },
      { symbol: '㇏', glossRu: 'черта вправо', glossEn: 'right sweep' },
    ],
    formulaRu: 'две расходящиеся черты = деление, восемь',
    formulaEn: 'two parting strokes = divide, eight',
    mnemonicRu: 'Две черты расходятся как крылья в стороны — счастливое число восемь.',
    mnemonicEn: 'Two strokes spread apart like wings — the lucky number eight.',
    neighbors: [
      { zh: '八月', pinyin: 'bā yuè', meaningRu: 'август', meaningEn: 'August' },
      { zh: '八点', pinyin: 'bā diǎn', meaningRu: 'восемь часов', meaningEn: "8 o'clock" },
      { zh: '十八', pinyin: 'shí bā', meaningRu: 'восемнадцать', meaningEn: 'eighteen' },
    ],
  },
  'hsk1-爸爸': {
    parts: [
      { symbol: '父', glossRu: 'отец', glossEn: 'father' },
      { symbol: '巴', glossRu: 'слог «ба» (звук)', glossEn: 'phonetic "ba"' },
    ],
    formulaRu: 'образ отца 父 + звук «ба» = папа',
    formulaEn: 'father root 父 + sound "ba" = dad',
    mnemonicRu: 'Сверху скрещённые черты отца 父, снизу мягкий звук «ба» — папа.',
    mnemonicEn: 'Crossed brows of father 父 on top, soft "ba" sound below.',
    neighbors: [
      { zh: '爸妈', pinyin: 'bà mā', meaningRu: 'папа и мама', meaningEn: 'mom and dad' },
      { zh: '老爸', pinyin: 'lǎo bà', meaningRu: 'папуля, батя', meaningEn: 'pops / dad' },
      { zh: '父亲', pinyin: 'fù qīn', meaningRu: 'отец (офиц.)', meaningEn: 'father (formal)' },
    ],
  },
  'hsk1-北京': {
    parts: [
      { symbol: '北', glossRu: 'север', glossEn: 'north' },
      { symbol: '京', glossRu: 'столица', glossEn: 'capital' },
    ],
    formulaRu: 'север + столица = Пекин',
    formulaEn: 'north + capital = Beijing',
    mnemonicRu: 'Двое спиной к холоду (北 север) у высокой башни столицы (京).',
    mnemonicEn: 'Two figures back-to-back (北 north) by the high capital tower (京).',
    neighbors: [
      { zh: '北方', pinyin: 'běi fāng', meaningRu: 'север, северный край', meaningEn: 'the north' },
      { zh: '南京', pinyin: 'Nán jīng', meaningRu: 'Нанкин («Южная столица»)', meaningEn: 'Nanjing' },
      { zh: '京剧', pinyin: 'jīng jù', meaningRu: 'пекинская опера', meaningEn: 'Beijing opera' },
    ],
  },
  'hsk1-杯子': {
    parts: [
      { symbol: '木', glossRu: 'дерево', glossEn: 'wood' },
      { symbol: '不', glossRu: 'бутон / звук', glossEn: 'cup shape' },
      { symbol: '子', glossRu: 'предмет (суффикс)', glossEn: 'noun suffix' },
    ],
    formulaRu: 'деревянный сосуд + предмет = чашка',
    formulaEn: 'wooden vessel + noun suffix = cup',
    mnemonicRu: 'Из дерева (木) вырезали перевёрнутый бутон — получилась чашка.',
    mnemonicEn: 'Carved from wood (木) like a flower cup — a drinking glass.',
    neighbors: [
      { zh: '水杯', pinyin: 'shuǐ bēi', meaningRu: 'стакан для воды', meaningEn: 'water glass' },
      { zh: '茶杯', pinyin: 'chá bēi', meaningRu: 'чайная чашка', meaningEn: 'teacup' },
      { zh: '干杯', pinyin: 'gān bēi', meaningRu: 'до дна! (тост)', meaningEn: 'cheers!' },
    ],
  },
  'hsk1-对不起': {
    parts: [
      { symbol: '对', glossRu: 'лицом к', glossEn: 'facing' },
      { symbol: '不', glossRu: 'не', glossEn: 'not' },
      { symbol: '起', glossRu: 'подняться', glossEn: 'rise / look up' },
    ],
    formulaRu: 'напротив не могу поднять взгляд = извините',
    formulaEn: 'unable to look up facing you = sorry',
    mnemonicRu: 'Стою напротив (对) и не (不) могу поднять (起) глаза от неловкости — простите.',
    mnemonicEn: 'Standing opposite (对), unable (不) to lift (起) my gaze — I am sorry.',
    neighbors: [
      { zh: '对', pinyin: 'duì', meaningRu: 'правильный, верный', meaningEn: 'correct, right' },
      { zh: '起床', pinyin: 'qǐ chuáng', meaningRu: 'вставать с постели', meaningEn: 'get up' },
      { zh: '没关系', pinyin: 'méi guān xi', meaningRu: 'ничего страшного', meaningEn: "it's okay" },
    ],
  },
  'hsk1-大': {
    parts: [
      { symbol: '人', glossRu: 'человек', glossEn: 'person' },
      { symbol: '一', glossRu: 'раскинутые руки', glossEn: 'outstretched arms' },
    ],
    formulaRu: 'человек широко развёл руки = большой',
    formulaEn: 'person stretching arms wide = big',
    mnemonicRu: 'Человек широко раскинул руки в стороны, показывая: «Вот такой большой!»',
    mnemonicEn: 'A person stretching both arms wide to show how huge something is.',
    neighbors: [
      { zh: '大学', pinyin: 'dà xué', meaningRu: 'университет', meaningEn: 'university' },
      { zh: '大家', pinyin: 'dà jiā', meaningRu: 'все, публика', meaningEn: 'everyone' },
      { zh: '大小', pinyin: 'dà xiǎo', meaningRu: 'размер', meaningEn: 'size' },
    ],
  },
};

export function getWordInsight(word: VocabWord, language: LanguageCode): WordDeepInsight {
  const curated = INSIGHTS_BY_WORD_ID[word.id];
  if (curated) return curated;

  const chars = Array.from(word.simplified);
  const meaning = (language === 'ru' ? word.meaningsRu?.[0] : word.meanings[0]) ?? word.meanings[0] ?? '';

  return {
    parts: [
      {
        symbol: word.radical || chars[0] || word.simplified,
        glossRu: 'ключевой элемент',
        glossEn: 'radical element',
      },
      ...chars.slice(0, 2).map((ch) => ({
        symbol: ch,
        glossRu: 'знак слова',
        glossEn: 'character',
      })),
    ],
    formulaRu: `${word.simplified} = ${meaning}`,
    formulaEn: `${word.simplified} = ${meaning}`,
    mnemonicRu: `Запомните силуэт «${word.simplified}» через его ключ ${word.radical} и звучание «${word.pinyin}».`,
    mnemonicEn: `Anchor "${word.simplified}" with radical ${word.radical} and sound "${word.pinyin}".`,
    neighbors: [
      {
        zh: word.simplified,
        pinyin: word.pinyin,
        meaningRu: meaning,
        meaningEn: word.meanings[0] ?? '',
      },
    ],
  };
}
