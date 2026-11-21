import type { VocabWord } from '../types/vocab';
import { STARTER_HSK1_WORDS } from './starterHsk1';

export interface RadicalBrickMeta {
  char: string;
  pinyin: string;
  numericPinyin: string;
  meaningRu: string;
  meaningEn: string;
  variantHintRu?: string;
  variantHintEn?: string;
  exampleWords: Array<{ zh: string; pinyin: string; ru: string; en: string }>;
}

/**
 * 30 foundational semantic radicals / "mini-bricks" used to build Mandarin characters.
 * Every standalone form has full HanziWriter stroke order and clear zh-CN TTS audio.
 */
export const RADICAL_BRICKS_META: RadicalBrickMeta[] = [
  {
    char: '人',
    pinyin: 'rén',
    numericPinyin: 'ren2',
    meaningRu: 'человек',
    meaningEn: 'person, human',
    variantHintRu: 'Слева в иероглифе сжимается в 亻 (你 ты, 他 он, 休 отдыхать)',
    variantHintEn: 'Compresses to 亻 on the left (你 you, 他 he, 休 rest)',
    exampleWords: [
      { zh: '你', pinyin: 'nǐ', ru: 'ты', en: 'you' },
      { zh: '他', pinyin: 'tā', ru: 'он', en: 'he' },
    ],
  },
  {
    char: '口',
    pinyin: 'kǒu',
    numericPinyin: 'kou3',
    meaningRu: 'рот, вход',
    meaningEn: 'mouth, opening',
    variantHintRu: 'Всё, что связано с речью и едой: 吃 есть, 喝 пить, 叫 звать',
    variantHintEn: 'Speech, eating, sounds: 吃 eat, 喝 drink, 叫 call',
    exampleWords: [
      { zh: '吃', pinyin: 'chī', ru: 'есть', en: 'eat' },
      { zh: '喝', pinyin: 'hē', ru: 'пить', en: 'drink' },
    ],
  },
  {
    char: '心',
    pinyin: 'xīn',
    numericPinyin: 'xin1',
    meaningRu: 'сердце, чувства',
    meaningEn: 'heart, mind, feeling',
    variantHintRu: 'Слева пишется как 忄 (快 быстро, 忙 занят), снизу — 心 (想 думать)',
    variantHintEn: 'On the left becomes 忄 (快 fast, 忙 busy); at bottom stays 心 (想 think)',
    exampleWords: [
      { zh: '想', pinyin: 'xiǎng', ru: 'думать, скучать', en: 'think, miss' },
      { zh: '忙', pinyin: 'máng', ru: 'занятой', en: 'busy' },
    ],
  },
  {
    char: '手',
    pinyin: 'shǒu',
    numericPinyin: 'shou3',
    meaningRu: 'рука, действие',
    meaningEn: 'hand, action',
    variantHintRu: 'Слева превращается в 扌 (打 бить/звонить, 找 искать)',
    variantHintEn: 'On the left becomes 扌 (打 hit/call, 找 look for)',
    exampleWords: [
      { zh: '打', pinyin: 'dǎ', ru: 'бить, звонить', en: 'hit, call' },
      { zh: '手机', pinyin: 'shǒu jī', ru: 'телефон', en: 'mobile phone' },
    ],
  },
  {
    char: '水',
    pinyin: 'shuǐ',
    numericPinyin: 'shui3',
    meaningRu: 'вода, жидкость',
    meaningEn: 'water, liquid',
    variantHintRu: 'Слева в виде «трёх капель» 氵 (河 река, 汤 суп, 没 нет)',
    variantHintEn: 'Becomes three water drops 氵 on the left (河 river, 汤 soup)',
    exampleWords: [
      { zh: '河', pinyin: 'hé', ru: 'река', en: 'river' },
      { zh: '水果', pinyin: 'shuǐ guǒ', ru: 'фрукты', en: 'fruit' },
    ],
  },
  {
    char: '火',
    pinyin: 'huǒ',
    numericPinyin: 'huo3',
    meaningRu: 'огонь, тепло',
    meaningEn: 'fire, heat',
    variantHintRu: 'Снизу рассыпается в «четыре уголька» 灬 (热 горячий, 点 точка)',
    variantHintEn: 'At bottom becomes four embers 灬 (热 hot, 点 dot)',
    exampleWords: [
      { zh: '热', pinyin: 'rè', ru: 'горячий', en: 'hot' },
      { zh: '火车', pinyin: 'huǒ chē', ru: 'поезд', en: 'train' },
    ],
  },
  {
    char: '木',
    pinyin: 'mù',
    numericPinyin: 'mu4',
    meaningRu: 'дерево, древесина',
    meaningEn: 'tree, wood',
    variantHintRu: 'Деревья и деревянные вещи: 杯 чашка, 桌 стол, 椅 стул',
    variantHintEn: 'Trees & wooden objects: 杯 cup, 桌 table, 椅 chair',
    exampleWords: [
      { zh: '杯子', pinyin: 'bēi zi', ru: 'чашка', en: 'cup' },
      { zh: '桌子', pinyin: 'zhuō zi', ru: 'стол', en: 'table' },
    ],
  },
  {
    char: '土',
    pinyin: 'tǔ',
    numericPinyin: 'tu3',
    meaningRu: 'земля, почва',
    meaningEn: 'earth, soil, ground',
    variantHintRu: 'Места и земля: 地 земля/пол, 坐 сидеть (двое на земле), 场 площадь',
    variantHintEn: 'Places & ground: 地 ground, 坐 sit, 场 field',
    exampleWords: [
      { zh: '坐', pinyin: 'zuò', ru: 'сидеть', en: 'sit' },
      { zh: '机场', pinyin: 'jī chǎng', ru: 'аэропорт', en: 'airport' },
    ],
  },
  {
    char: '日',
    pinyin: 'rì',
    numericPinyin: 'ri4',
    meaningRu: 'солнце, день',
    meaningEn: 'sun, day',
    variantHintRu: 'Свет и время: 明 яркий/завтра, 早 утро, 时 время',
    variantHintEn: 'Light & time: 明 bright/tomorrow, 早 morning, 时 time',
    exampleWords: [
      { zh: '明天', pinyin: 'míng tiān', ru: 'завтра', en: 'tomorrow' },
      { zh: '早上', pinyin: 'zǎo shang', ru: 'утро', en: 'morning' },
    ],
  },
  {
    char: '月',
    pinyin: 'yuè',
    numericPinyin: 'yue4',
    meaningRu: 'луна, месяц, тело',
    meaningEn: 'moon, month, body part',
    variantHintRu: 'Также обозначает органы тела: 朋 друг, 脑 мозг, 肚 живот',
    variantHintEn: 'Also marks body parts: 朋 friend, 脑 brain',
    exampleWords: [
      { zh: '朋友', pinyin: 'péng you', ru: 'друг', en: 'friend' },
      { zh: '八月', pinyin: 'bā yuè', ru: 'август', en: 'August' },
    ],
  },
  {
    char: '山',
    pinyin: 'shān',
    numericPinyin: 'shan1',
    meaningRu: 'гора',
    meaningEn: 'mountain, hill',
    variantHintRu: 'Силуэт трёх горных вершин: 岁 год возраста, 岛 остров',
    variantHintEn: 'Three mountain peaks silhouette: 岁 year of age, 岛 island',
    exampleWords: [
      { zh: '山', pinyin: 'shān', ru: 'гора', en: 'mountain' },
      { zh: '岁', pinyin: 'suì', ru: 'год (возраст)', en: 'years old' },
    ],
  },
  {
    char: '女',
    pinyin: 'nǚ',
    numericPinyin: 'nv3',
    meaningRu: 'женщина',
    meaningEn: 'woman, female',
    variantHintRu: 'Семья и добро: 妈 мама, 姐 старшая сестра, 好 хороший',
    variantHintEn: 'Family & warmth: 妈 mom, 好 good (woman + child)',
    exampleWords: [
      { zh: '妈妈', pinyin: 'mā ma', ru: 'мама', en: 'mom' },
      { zh: '好', pinyin: 'hǎo', ru: 'хороший', en: 'good' },
    ],
  },
  {
    char: '子',
    pinyin: 'zǐ',
    numericPinyin: 'zi3',
    meaningRu: 'ребёнок, предмет',
    meaningEn: 'child, small object suffix',
    variantHintRu: 'Даёт смысл «учёба/дитя» или суффикс существительных: 学 учить, 杯子 чашка',
    variantHintEn: 'Child or noun suffix: 学 study, 杯子 cup',
    exampleWords: [
      { zh: '儿子', pinyin: 'ér zi', ru: 'сын', en: 'son' },
      { zh: '学习', pinyin: 'xué xí', ru: 'учиться', en: 'study' },
    ],
  },
  {
    char: '目',
    pinyin: 'mù',
    numericPinyin: 'mu4',
    meaningRu: 'глаз, взгляд',
    meaningEn: 'eye, look',
    variantHintRu: 'Зрение и сон: 看 смотреть (рука над глазом), 睡 спать',
    variantHintEn: 'Vision & sleep: 看 look (hand over eye), 睡 sleep',
    exampleWords: [
      { zh: '看', pinyin: 'kàn', ru: 'смотреть', en: 'look / watch' },
      { zh: '睡觉', pinyin: 'shuì jiào', ru: 'спать', en: 'sleep' },
    ],
  },
  {
    char: '耳',
    pinyin: 'ěr',
    numericPinyin: 'er3',
    meaningRu: 'ухо',
    meaningEn: 'ear',
    variantHintRu: 'Слух и звук: 闻 слышать/нюхать, 聊 болтать',
    variantHintEn: 'Hearing & sound: 闻 hear/smell, 聊 chat',
    exampleWords: [
      { zh: '耳朵', pinyin: 'ěr duo', ru: 'ухо', en: 'ear' },
      { zh: '新闻', pinyin: 'xīn wén', ru: 'новости', en: 'news' },
    ],
  },
  {
    char: '言',
    pinyin: 'yán',
    numericPinyin: 'yan2',
    meaningRu: 'речь, слово',
    meaningEn: 'speech, word',
    variantHintRu: 'Слева упрощается до 讠 (说 говорить, 话 слово, 请 просить, 谢 благодарить)',
    variantHintEn: 'Left side becomes 讠 (说 speak, 请 please, 谢 thank)',
    exampleWords: [
      { zh: '请', pinyin: 'qǐng', ru: 'пожалуйста', en: 'please' },
      { zh: '谢谢', pinyin: 'xiè xie', ru: 'спасибо', en: 'thank you' },
    ],
  },
  {
    char: '足',
    pinyin: 'zú',
    numericPinyin: 'zu2',
    meaningRu: 'нога, шаг',
    meaningEn: 'foot, step',
    variantHintRu: 'Движение ногами: 跑 бежать, 跳 прыгать, 路 дорога',
    variantHintEn: 'Foot movement & paths: 跑 run, 路 road',
    exampleWords: [
      { zh: '足球', pinyin: 'zú qiú', ru: 'футбол', en: 'football' },
      { zh: '路', pinyin: 'lù', ru: 'дорога', en: 'road' },
    ],
  },
  {
    char: '门',
    pinyin: 'mén',
    numericPinyin: 'men2',
    meaningRu: 'дверь, ворота',
    meaningEn: 'door, gate',
    variantHintRu: 'Обрамляет слова о проходе и вопросах: 问 спрашивать (рот в дверях), 间 комната',
    variantHintEn: 'Frames doorway words: 问 ask (mouth at door), 间 room',
    exampleWords: [
      { zh: '问', pinyin: 'wèn', ru: 'спрашивать', en: 'ask' },
      { zh: '房间', pinyin: 'fáng jiān', ru: 'комната', en: 'room' },
    ],
  },
  {
    char: '宀',
    pinyin: 'mián',
    numericPinyin: 'mian2',
    meaningRu: 'крыша, дом',
    meaningEn: 'roof, house',
    variantHintRu: 'Накрывает иероглифы уюта и жилья: 家 семья/дом, 客 гость, 字 буква/знак',
    variantHintEn: 'Covers home & shelter words: 家 home/family, 客 guest, 字 character',
    exampleWords: [
      { zh: '家', pinyin: 'jiā', ru: 'дом, семья', en: 'home, family' },
      { zh: '不客气', pinyin: 'bù kè qi', ru: 'не за что', en: "you're welcome" },
    ],
  },
  {
    char: '艹',
    pinyin: 'cǎo',
    numericPinyin: 'cao3',
    meaningRu: 'трава, растение',
    meaningEn: 'grass, plant',
    variantHintRu: 'Шапка над растениями и едой: 茶 чай, 菜 овощи/блюдо, 苹果 яблоко',
    variantHintEn: 'Top crown for plants & tea: 茶 tea, 菜 vegetable, 苹果 apple',
    exampleWords: [
      { zh: '茶', pinyin: 'chá', ru: 'чай', en: 'tea' },
      { zh: '菜', pinyin: 'cài', ru: 'овощи, блюдо', en: 'dish, vegetable' },
    ],
  },
  {
    char: '竹',
    pinyin: 'zhú',
    numericPinyin: 'zhu2',
    meaningRu: 'бамбук',
    meaningEn: 'bamboo',
    variantHintRu: 'Сверху пишется как ⺮ (筷 палочки для еды, 笑 смеяться, 笔 кисть/ручка)',
    variantHintEn: 'Top form ⺮: 筷 chopsticks, 笔 pen, 笑 laugh',
    exampleWords: [
      { zh: '笑', pinyin: 'xiào', ru: 'смеяться', en: 'laugh' },
      { zh: '笔', pinyin: 'bǐ', ru: 'ручка, кисть', en: 'pen, brush' },
    ],
  },
  {
    char: '雨',
    pinyin: 'yǔ',
    numericPinyin: 'yu3',
    meaningRu: 'дождь, погода',
    meaningEn: 'rain, weather',
    variantHintRu: 'Явления неба: 雪 снег, 云 облако, 电 молния/электричество (раньше)',
    variantHintEn: 'Sky & weather: 雪 snow, 零 zero, 雷 thunder',
    exampleWords: [
      { zh: '下雨', pinyin: 'xià yǔ', ru: 'идёт дождь', en: 'rain' },
      { zh: '雪', pinyin: 'xuě', ru: 'снег', en: 'snow' },
    ],
  },
  {
    char: '金',
    pinyin: 'jīn',
    numericPinyin: 'jin1',
    meaningRu: 'металл, золото',
    meaningEn: 'metal, gold, money',
    variantHintRu: 'Слева становится 钅 (钱 деньги, 钟 часы/колокол, 铁 железо)',
    variantHintEn: 'Left form 钅: 钱 money, 钟 clock/bell, 铁 iron',
    exampleWords: [
      { zh: '钱', pinyin: 'qián', ru: 'деньги', en: 'money' },
      { zh: '分钟', pinyin: 'fēn zhōng', ru: 'минута', en: 'minute' },
    ],
  },
  {
    char: '石',
    pinyin: 'shí',
    numericPinyin: 'shi2',
    meaningRu: 'камень',
    meaningEn: 'stone, rock',
    variantHintRu: 'Твёрдые вещи: 碗 пиала (раньше каменная), 破 разбить, 硬 твёрдый',
    variantHintEn: 'Hard objects: 碗 bowl, 破 break, 硬 hard',
    exampleWords: [
      { zh: '石头', pinyin: 'shí tou', ru: 'камень', en: 'stone' },
      { zh: '碗', pinyin: 'wǎn', ru: 'пиала, миска', en: 'bowl' },
    ],
  },
  {
    char: '刀',
    pinyin: 'dāo',
    numericPinyin: 'dao1',
    meaningRu: 'нож, резать',
    meaningEn: 'knife, cut, divide',
    variantHintRu: 'Справа превращается в 刂 (分 делить/минута, 到 прийти, 别 не делай)',
    variantHintEn: 'Right form 刂: 分 divide/minute, 到 arrive',
    exampleWords: [
      { zh: '分', pinyin: 'fēn', ru: 'делить, минута', en: 'divide, minute' },
      { zh: '到', pinyin: 'dào', ru: 'прибыть', en: 'arrive' },
    ],
  },
  {
    char: '力',
    pinyin: 'lì',
    numericPinyin: 'li4',
    meaningRu: 'сила, усилие',
    meaningEn: 'power, strength, effort',
    variantHintRu: 'Работа и мужская сила: 男 мужчина (сила на поле 田), 加 добавить, 动 двигать',
    variantHintEn: 'Work & effort: 男 man (strength in field), 动 move',
    exampleWords: [
      { zh: '努力', pinyin: 'nǔ lì', ru: 'стараться', en: 'work hard' },
      { zh: '帮忙', pinyin: 'bāng máng', ru: 'помогать', en: 'help' },
    ],
  },
  {
    char: '车',
    pinyin: 'chē',
    numericPinyin: 'che1',
    meaningRu: 'машина, повозка',
    meaningEn: 'vehicle, car, wheel',
    variantHintRu: 'Транспорт: 出租车 такси, 火车 поезд, 汽车 автомобиль',
    variantHintEn: 'Transport: 出租车 taxi, 火车 train, 汽车 car',
    exampleWords: [
      { zh: '汽车', pinyin: 'qì chē', ru: 'автомобиль', en: 'car' },
      { zh: '出租车', pinyin: 'chū zū chē', ru: 'такси', en: 'taxi' },
    ],
  },
  {
    char: '马',
    pinyin: 'mǎ',
    numericPinyin: 'ma3',
    meaningRu: 'лошадь',
    meaningEn: 'horse',
    variantHintRu: 'Частый фонетик для слога «ма»: 妈 мама, 吗 частица «ли?», 骑 ехать верхом',
    variantHintEn: 'Common phonetic "ma": 妈 mom, 吗 question particle',
    exampleWords: [
      { zh: '马上', pinyin: 'mǎ shàng', ru: 'сразу, сейчас', en: 'right away' },
      { zh: '骑', pinyin: 'qí', ru: 'ехать верхом', en: 'ride' },
    ],
  },
  {
    char: '鱼',
    pinyin: 'yú',
    numericPinyin: 'yu2',
    meaningRu: 'рыба',
    meaningEn: 'fish',
    variantHintRu: 'Силуэт рыбки с головой, телом и хвостом: 鲜 свежий (рыба + баран)',
    variantHintEn: 'Fish shape with head & tail: 鲜 fresh (fish + lamb)',
    exampleWords: [
      { zh: '鱼', pinyin: 'yú', ru: 'рыба', en: 'fish' },
      { zh: '新鲜', pinyin: 'xīn xiān', ru: 'свежий', en: 'fresh' },
    ],
  },
  {
    char: '米',
    pinyin: 'mǐ',
    numericPinyin: 'mi3',
    meaningRu: 'рис (зерно)',
    meaningEn: 'rice (uncooked)',
    variantHintRu: 'Зёрна и еда: 米饭 варёный рис, 粉 лапша/порошок, 糖 сахар/конфета',
    variantHintEn: 'Grains & food: 米饭 cooked rice, 糖 sugar/candy',
    exampleWords: [
      { zh: '米饭', pinyin: 'mǐ fàn', ru: 'варёный рис', en: 'cooked rice' },
      { zh: '糖', pinyin: 'táng', ru: 'сахар, конфета', en: 'sugar' },
    ],
  },
];

export const RADICAL_BRICK_WORDS: VocabWord[] = RADICAL_BRICKS_META.map((item) => ({
  id: `radical-${item.char}`,
  simplified: item.char,
  pinyin: item.pinyin,
  numericPinyin: item.numericPinyin,
  plainPinyin: item.numericPinyin.replace(/[1-5]/g, ''),
  radical: item.char,
  meanings: [item.meaningEn, ...(item.variantHintEn ? [item.variantHintEn] : [])],
  meaningsRu: [item.meaningRu, ...(item.variantHintRu ? [item.variantHintRu] : [])],
  level: 1,
  topic: 'basics',
  example: {
    zh: item.exampleWords.map((w) => w.zh).join('、'),
    pinyin: item.exampleWords.map((w) => w.pinyin).join(' · '),
    en: item.exampleWords.map((w) => `${w.zh} (${w.en})`).join(', '),
    ru: item.exampleWords.map((w) => `${w.zh} (${w.ru})`).join(', '),
  },
}));

export interface CharacterDetail {
  char: string;
  pinyin: string;
  meaningRu: string;
  meaningEn: string;
  isRadical: boolean;
  noteRu?: string;
  noteEn?: string;
  compounds: Array<{ zh: string; pinyin: string; ru: string; en: string }>;
}

const EXTRA_CHAR_MAP: Record<
  string,
  {
    pinyin: string;
    meaningRu: string;
    meaningEn: string;
    isRadical?: boolean;
    noteRu?: string;
    noteEn?: string;
  }
> = {
  // Positional / structural variants seen in breakdowns
  '亻': {
    pinyin: 'rén',
    meaningRu: 'человек (левая форма 人)',
    meaningEn: 'person (left form of 人)',
    isRadical: true,
    noteRu: 'Ставится слева у слов о людях: 你 ты, 他 он, 休 отдыхать.',
    noteEn: 'Placed on the left in people words: 你 you, 他 he.',
  },
  '氵': {
    pinyin: 'shuǐ',
    meaningRu: 'вода (три капли 水)',
    meaningEn: 'water (three drops of 水)',
    isRadical: true,
    noteRu: 'Встречается слева в словах о воде и жидкостях: 河 река, 汤 суп.',
    noteEn: 'Appears on the left in liquid words: 河 river, 汤 soup.',
  },
  '扌': {
    pinyin: 'shǒu',
    meaningRu: 'рука (левая форма 手)',
    meaningEn: 'hand (left form of 手)',
    isRadical: true,
    noteRu: 'Действия руками: 打 бить/звонить, 找 искать, 拉 тянуть.',
    noteEn: 'Hand actions: 打 hit/call, 找 search.',
  },
  '忄': {
    pinyin: 'xīn',
    meaningRu: 'сердце (левая форма 心)',
    meaningEn: 'heart (left form of 心)',
    isRadical: true,
    noteRu: 'Чувства и состояния: 快 быстрый, 忙 занятый, 情 чувство.',
    noteEn: 'Feelings and moods: 快 fast, 忙 busy, 情 emotion.',
  },
  '讠': {
    pinyin: 'yán',
    meaningRu: 'речь (левая форма 言)',
    meaningEn: 'speech (left form of 言)',
    isRadical: true,
    noteRu: 'Слова о языке и общении: 请 просить, 谢 благодарить, 读 читать.',
    noteEn: 'Language & communication: 请 please, 谢 thank, 读 read.',
  },
  '爫': {
    pinyin: 'zhǎo',
    meaningRu: 'рука / ладонь сверху',
    meaningEn: 'hand / claw above',
    isRadical: true,
    noteRu: 'Верхний ключ в иероглифе 爱 (любовь): рука бережно укрывает.',
    noteEn: 'Top radical in 爱 (love): a gentle sheltering hand.',
  },
  '冖': {
    pinyin: 'mì',
    meaningRu: 'покров, навес',
    meaningEn: 'cover, canopy',
    isRadical: true,
    noteRu: 'Означает укрытие сверху: в 爱 защищает друга.',
    noteEn: 'Represents a protective cover from above.',
  },
  '灬': {
    pinyin: 'huǒ',
    meaningRu: 'огонь снизу (форма 火)',
    meaningEn: 'fire at bottom (form of 火)',
    isRadical: true,
    noteRu: 'Четыре уголька внизу: 热 горячий, 点 точка, 煮 варить.',
    noteEn: 'Four embers below: 热 hot, 点 dot.',
  },
  '丿': {
    pinyin: 'piě',
    meaningRu: 'черта влево-вниз',
    meaningEn: 'left-falling stroke',
    isRadical: true,
  },
  '㇏': {
    pinyin: 'nà',
    meaningRu: 'черта вправо-вниз',
    meaningEn: 'right-falling stroke',
    isRadical: true,
  },
  '一': {
    pinyin: 'yī',
    meaningRu: 'один, единица',
    meaningEn: 'one, single',
    isRadical: true,
  },

  // Lab characters, examples & neighbor words
  '爱': { pinyin: 'ài', meaningRu: 'любить, любовь', meaningEn: 'love, be fond of' },
  '友': { pinyin: 'yǒu', meaningRu: 'друг, товарищ', meaningEn: 'friend' },
  '好': { pinyin: 'hǎo', meaningRu: 'хороший, добрый', meaningEn: 'good, well' },
  '可': { pinyin: 'kě', meaningRu: 'можно, милый (в 可爱)', meaningEn: 'can, may, -able' },
  '情': { pinyin: 'qíng', meaningRu: 'чувство, эмоция', meaningEn: 'feeling, emotion' },
  '我': { pinyin: 'wǒ', meaningRu: 'я, мне, мой', meaningEn: 'I, me, my' },
  '的': { pinyin: 'de', meaningRu: 'частица принадлежности («мой»)', meaningEn: 'possessive particle' },
  '家': { pinyin: 'jiā', meaningRu: 'дом, семья', meaningEn: 'home, family' },

  '茶': { pinyin: 'chá', meaningRu: 'чай', meaningEn: 'tea' },
  '喝': { pinyin: 'hē', meaningRu: 'пить', meaningEn: 'drink' },
  '绿': { pinyin: 'lǜ', meaningRu: 'зелёный', meaningEn: 'green' },
  '奶': { pinyin: 'nǎi', meaningRu: 'молоко, бабушка', meaningEn: 'milk' },
  '请': { pinyin: 'qǐng', meaningRu: 'пожалуйста, приглашать', meaningEn: 'please, invite' },
  '杯': { pinyin: 'bēi', meaningRu: 'чашка, стакан', meaningEn: 'cup, glass' },
  '热': { pinyin: 'rè', meaningRu: 'горячий, жаркий', meaningEn: 'hot, warm' },

  '八': { pinyin: 'bā', meaningRu: 'восемь', meaningEn: 'eight' },
  '十': { pinyin: 'shí', meaningRu: 'десять', meaningEn: 'ten' },
  '点': { pinyin: 'diǎn', meaningRu: 'час (времени), точка', meaningEn: "o'clock, dot" },
  '今': { pinyin: 'jīn', meaningRu: 'сейчас, нынешний', meaningEn: 'today, now' },
  '天': { pinyin: 'tiān', meaningRu: 'небо, день', meaningEn: 'sky, day' },
  '早': { pinyin: 'zǎo', meaningRu: 'рано, утро', meaningEn: 'early, morning' },
  '上': { pinyin: 'shàng', meaningRu: 'верх, на, начинать', meaningEn: 'up, on, start' },
  '课': { pinyin: 'kè', meaningRu: 'урок, занятие', meaningEn: 'lesson, class' },

  '爸': { pinyin: 'bà', meaningRu: 'папа, отец', meaningEn: 'dad, father' },
  '父': { pinyin: 'fù', meaningRu: 'отец (ключ)', meaningEn: 'father (radical)', isRadical: true },
  '巴': { pinyin: 'bā', meaningRu: 'фонетик «ба» / ждать', meaningEn: 'phonetic "ba" / wish' },
  '妈': { pinyin: 'mā', meaningRu: 'мама', meaningEn: 'mom' },
  '老': { pinyin: 'lǎo', meaningRu: 'старый, уважаемый', meaningEn: 'old, respected' },
  '亲': { pinyin: 'qīn', meaningRu: 'родной, близкий', meaningEn: 'parent, relative, close' },
  '是': { pinyin: 'shì', meaningRu: 'быть, являться', meaningEn: 'to be, is' },
  '名': { pinyin: 'míng', meaningRu: 'имя, счёт. слово (люди)', meaningEn: 'name, measure word' },
  '医': { pinyin: 'yī', meaningRu: 'лечить, медицина', meaningEn: 'medicine, heal' },
  '生': { pinyin: 'shēng', meaningRu: 'рождаться, жизнь, ученик', meaningEn: 'born, life, student' },

  '北': { pinyin: 'běi', meaningRu: 'север', meaningEn: 'north' },
  '京': { pinyin: 'jīng', meaningRu: 'столица', meaningEn: 'capital city' },
  '方': { pinyin: 'fāng', meaningRu: 'сторона, направление', meaningEn: 'direction, square' },
  '南': { pinyin: 'nán', meaningRu: 'юг', meaningEn: 'south' },
  '剧': { pinyin: 'jù', meaningRu: 'театр, пьеса, драма', meaningEn: 'opera, drama' },
  '想': { pinyin: 'xiǎng', meaningRu: 'хотеть, думать', meaningEn: 'want, think' },
  '明': { pinyin: 'míng', meaningRu: 'яркий, следующий (明 года)', meaningEn: 'bright, next' },
  '年': { pinyin: 'nián', meaningRu: 'год', meaningEn: 'year' },
  '去': { pinyin: 'qù', meaningRu: 'идти, ехать', meaningEn: 'go' },
  '旅': { pinyin: 'lǚ', meaningRu: 'путешествовать', meaningEn: 'travel' },
  '游': { pinyin: 'yóu', meaningRu: 'плавать, гулять, путешествовать', meaningEn: 'swim, tour' },

  '桌': { pinyin: 'zhuō', meaningRu: 'стол', meaningEn: 'table, desk' },
  '面': { pinyin: 'miàn', meaningRu: 'поверхность, сторона, лапша', meaningEn: 'surface, side, noodles' },
  '有': { pinyin: 'yǒu', meaningRu: 'иметь, находиться', meaningEn: 'have, there is' },
  '个': { pinyin: 'gè', meaningRu: 'универсальное счётное слово', meaningEn: 'general measure word' },
  '干': { pinyin: 'gān', meaningRu: 'сухой, досуха', meaningEn: 'dry, cheers (empty glass)' },

  '对': { pinyin: 'duì', meaningRu: 'правильный, напротив', meaningEn: 'correct, facing' },
  '不': { pinyin: 'bù', meaningRu: 'не, нет', meaningEn: 'no, not' },
  '起': { pinyin: 'qǐ', meaningRu: 'вставать, подниматься', meaningEn: 'rise, get up' },
  '床': { pinyin: 'chuáng', meaningRu: 'кровать, постель', meaningEn: 'bed' },
  '没': { pinyin: 'méi', meaningRu: 'нет, не иметь', meaningEn: 'not have' },
  '关': { pinyin: 'guān', meaningRu: 'закрывать, связь', meaningEn: 'close, relate' },
  '系': { pinyin: 'xì', meaningRu: 'связь, система', meaningEn: 'system, tie' },
  '来': { pinyin: 'lái', meaningRu: 'приходить', meaningEn: 'come' },
  '晚': { pinyin: 'wǎn', meaningRu: 'поздно, вечер', meaningEn: 'late, evening' },
  '了': { pinyin: 'le', meaningRu: 'частица завершённости', meaningEn: 'completed-action particle' },

  '大': { pinyin: 'dà', meaningRu: 'большой, крупный', meaningEn: 'big, large' },
  '学': { pinyin: 'xué', meaningRu: 'учиться, наука', meaningEn: 'study, learn' },
  '小': { pinyin: 'xiǎo', meaningRu: 'маленький', meaningEn: 'small, little' },
  '这': { pinyin: 'zhè', meaningRu: 'этот', meaningEn: 'this' },
  '房': { pinyin: 'fáng', meaningRu: 'комната, дом', meaningEn: 'room, house' },
  '间': { pinyin: 'jiān', meaningRu: 'промежуток, комната', meaningEn: 'space, room' },
  '很': { pinyin: 'hěn', meaningRu: 'очень', meaningEn: 'very' },
  '也': { pinyin: 'yě', meaningRu: 'тоже, также', meaningEn: 'also, too' },
  '亮': { pinyin: 'liàng', meaningRu: 'светлый, яркий', meaningEn: 'bright, light' },
};

const RADICAL_BY_CHAR = new Map(RADICAL_BRICKS_META.map((item) => [item.char, item]));

export function lookupCharacterDetail(
  char: string,
  vocabWords: VocabWord[] = STARTER_HSK1_WORDS
): CharacterDetail {
  const pool = vocabWords.length > 0 ? vocabWords : STARTER_HSK1_WORDS;

  const findCompounds = (): Array<{ zh: string; pinyin: string; ru: string; en: string }> => {
    const found: Array<{ zh: string; pinyin: string; ru: string; en: string }> = [];
    for (const w of pool) {
      if (w.simplified.includes(char) && w.simplified !== char) {
        found.push({
          zh: w.simplified,
          pinyin: w.pinyin,
          ru: w.meaningsRu?.[0] ?? w.meanings[0] ?? '',
          en: w.meanings[0] ?? '',
        });
        if (found.length >= 3) break;
      }
    }
    return found;
  };

  // 1. Check dedicated radical bricks first
  const radicalMatch = RADICAL_BY_CHAR.get(char);
  if (radicalMatch) {
    return {
      char: radicalMatch.char,
      pinyin: radicalMatch.pinyin,
      meaningRu: radicalMatch.meaningRu,
      meaningEn: radicalMatch.meaningEn,
      isRadical: true,
      noteRu: radicalMatch.variantHintRu,
      noteEn: radicalMatch.variantHintEn,
      compounds: radicalMatch.exampleWords,
    };
  }

  // 2. Check curated single-character map
  const extra = EXTRA_CHAR_MAP[char];
  if (extra) {
    return {
      char,
      pinyin: extra.pinyin,
      meaningRu: extra.meaningRu,
      meaningEn: extra.meaningEn,
      isRadical: Boolean(extra.isRadical),
      noteRu: extra.noteRu,
      noteEn: extra.noteEn,
      compounds: findCompounds(),
    };
  }

  // 3. Check exact single-character match in active HSK + custom vocab
  const exactWord = pool.find((w) => w.simplified === char);
  if (exactWord) {
    return {
      char,
      pinyin: exactWord.pinyin,
      meaningRu: exactWord.meaningsRu?.join('; ') || exactWord.meanings.join('; '),
      meaningEn: exactWord.meanings.join('; '),
      isRadical: exactWord.radical === char,
      compounds: findCompounds(),
    };
  }

  // 4. Fallback via compound words containing this character
  const compounds = findCompounds();
  const firstComp = pool.find((w) => w.simplified.includes(char));
  if (firstComp) {
    const idx = Array.from(firstComp.simplified).indexOf(char);
    const syl = firstComp.pinyin.split(/\s+/)[idx] ?? firstComp.pinyin;
    return {
      char,
      pinyin: syl,
      meaningRu: `часть слова «${firstComp.simplified}» (${firstComp.meaningsRu?.[0] ?? firstComp.meanings[0]})`,
      meaningEn: `part of "${firstComp.simplified}" (${firstComp.meanings[0]})`,
      isRadical: false,
      compounds,
    };
  }

  return {
    char,
    pinyin: '',
    meaningRu: 'Китайский иероглиф',
    meaningEn: 'Chinese character',
    isRadical: false,
    compounds: [],
  };
}
