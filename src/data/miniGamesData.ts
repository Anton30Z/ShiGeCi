export interface OddRadicalRound {
  id: string;
  radical: string;
  radicalNameRu: string;
  radicalNameEn: string;
  sameThree: Array<{ char: string; pinyin: string; ru: string; en: string }>;
  oddOne: { char: string; pinyin: string; ru: string; en: string; oddRadical: string };
}

export const ODD_RADICAL_ROUNDS: OddRadicalRound[] = [
  {
    id: 'odd-water',
    radical: '氵',
    radicalNameRu: 'три капли воды (水)',
    radicalNameEn: 'three drops of water (水)',
    sameThree: [
      { char: '河', pinyin: 'hé', ru: 'река', en: 'river' },
      { char: '汤', pinyin: 'tāng', ru: 'суп', en: 'soup' },
      { char: '洗', pinyin: 'xǐ', ru: 'мыть', en: 'wash' },
    ],
    oddOne: { char: '热', pinyin: 'rè', ru: 'горячий', en: 'hot', oddRadical: '灬' },
  },
  {
    id: 'odd-mouth',
    radical: '口',
    radicalNameRu: 'рот (口)',
    radicalNameEn: 'mouth (口)',
    sameThree: [
      { char: '吃', pinyin: 'chī', ru: 'есть', en: 'eat' },
      { char: '喝', pinyin: 'hē', ru: 'пить', en: 'drink' },
      { char: '叫', pinyin: 'jiào', ru: 'звать', en: 'call' },
    ],
    oddOne: { char: '打', pinyin: 'dǎ', ru: 'бить / звонить', en: 'hit / call', oddRadical: '扌' },
  },
  {
    id: 'odd-wood',
    radical: '木',
    radicalNameRu: 'дерево (木)',
    radicalNameEn: 'wood / tree (木)',
    sameThree: [
      { char: '杯', pinyin: 'bēi', ru: 'чашка', en: 'cup' },
      { char: '桌', pinyin: 'zhuō', ru: 'стол', en: 'table' },
      { char: '椅', pinyin: 'yǐ', ru: 'стул', en: 'chair' },
    ],
    oddOne: { char: '灯', pinyin: 'dēng', ru: 'лампа', en: 'lamp', oddRadical: '火' },
  },
  {
    id: 'odd-grass',
    radical: '艹',
    radicalNameRu: 'трава / растение (艹)',
    radicalNameEn: 'grass / plant (艹)',
    sameThree: [
      { char: '茶', pinyin: 'chá', ru: 'чай', en: 'tea' },
      { char: '菜', pinyin: 'cài', ru: 'овощи / блюдо', en: 'dish / veg' },
      { char: '花', pinyin: 'huā', ru: 'цветок', en: 'flower' },
    ],
    oddOne: { char: '雪', pinyin: 'xuě', ru: 'снег', en: 'snow', oddRadical: '雨' },
  },
  {
    id: 'odd-speech',
    radical: '讠',
    radicalNameRu: 'речь (言)',
    radicalNameEn: 'speech (言)',
    sameThree: [
      { char: '请', pinyin: 'qǐng', ru: 'просить', en: 'please' },
      { char: '谢', pinyin: 'xiè', ru: 'благодарить', en: 'thank' },
      { char: '说', pinyin: 'shuō', ru: 'говорить', en: 'speak' },
    ],
    oddOne: { char: '问', pinyin: 'wèn', ru: 'спрашивать', en: 'ask', oddRadical: '门' },
  },
  {
    id: 'odd-woman',
    radical: '女',
    radicalNameRu: 'женщина (女)',
    radicalNameEn: 'woman (女)',
    sameThree: [
      { char: '妈', pinyin: 'mā', ru: 'мама', en: 'mom' },
      { char: '姐', pinyin: 'jiě', ru: 'старшая сестра', en: 'older sister' },
      { char: '好', pinyin: 'hǎo', ru: 'хороший', en: 'good' },
    ],
    oddOne: { char: '男', pinyin: 'nán', ru: 'мужчина', en: 'man', oddRadical: '田+力' },
  },
  {
    id: 'odd-hand',
    radical: '扌',
    radicalNameRu: 'рука (手)',
    radicalNameEn: 'hand (手)',
    sameThree: [
      { char: '打', pinyin: 'dǎ', ru: 'бить / звонить', en: 'hit / call' },
      { char: '找', pinyin: 'zhǎo', ru: 'искать', en: 'look for' },
      { char: '拉', pinyin: 'lā', ru: 'тянуть', en: 'pull' },
    ],
    oddOne: { char: '跑', pinyin: 'pǎo', ru: 'бежать', en: 'run', oddRadical: '⻊' },
  },
  {
    id: 'odd-heart',
    radical: '忄',
    radicalNameRu: 'сердце / чувства (心)',
    radicalNameEn: 'heart / emotion (心)',
    sameThree: [
      { char: '快', pinyin: 'kuài', ru: 'быстрый', en: 'fast' },
      { char: '忙', pinyin: 'máng', ru: 'занятой', en: 'busy' },
      { char: '情', pinyin: 'qíng', ru: 'чувство', en: 'feeling' },
    ],
    oddOne: { char: '明', pinyin: 'míng', ru: 'яркий', en: 'bright', oddRadical: '日' },
  },
  {
    id: 'odd-sun',
    radical: '日',
    radicalNameRu: 'солнце / время (日)',
    radicalNameEn: 'sun / time (日)',
    sameThree: [
      { char: '明', pinyin: 'míng', ru: 'завтра / яркий', en: 'bright' },
      { char: '早', pinyin: 'zǎo', ru: 'утро', en: 'morning' },
      { char: '时', pinyin: 'shí', ru: 'время', en: 'time' },
    ],
    oddOne: { char: '月', pinyin: 'yuè', ru: 'луна / месяц', en: 'moon / month', oddRadical: '月' },
  },
  {
    id: 'odd-roof',
    radical: '宀',
    radicalNameRu: 'крыша / дом (宀)',
    radicalNameEn: 'roof / shelter (宀)',
    sameThree: [
      { char: '家', pinyin: 'jiā', ru: 'дом / семья', en: 'home / family' },
      { char: '客', pinyin: 'kè', ru: 'гость', en: 'guest' },
      { char: '字', pinyin: 'zì', ru: 'иероглиф', en: 'character' },
    ],
    oddOne: { char: '门', pinyin: 'mén', ru: 'дверь', en: 'door', oddRadical: '门' },
  },
  {
    id: 'odd-metal',
    radical: '钅',
    radicalNameRu: 'металл / деньги (金)',
    radicalNameEn: 'metal / money (金)',
    sameThree: [
      { char: '钱', pinyin: 'qián', ru: 'деньги', en: 'money' },
      { char: '钟', pinyin: 'zhōng', ru: 'часы / колокол', en: 'clock / bell' },
      { char: '铁', pinyin: 'tiě', ru: 'железо', en: 'iron' },
    ],
    oddOne: { char: '碗', pinyin: 'wǎn', ru: 'миска / пиала', en: 'bowl', oddRadical: '石' },
  },
  {
    id: 'odd-person',
    radical: '亻',
    radicalNameRu: 'человек (人)',
    radicalNameEn: 'person (人)',
    sameThree: [
      { char: '你', pinyin: 'nǐ', ru: 'ты', en: 'you' },
      { char: '他', pinyin: 'tā', ru: 'он', en: 'he' },
      { char: '休', pinyin: 'xiū', ru: 'отдыхать', en: 'rest' },
    ],
    oddOne: { char: '她', pinyin: 'tā', ru: 'она', en: 'she', oddRadical: '女' },
  },
];

export interface MemoryRadicalPair {
  id: string;
  radical: string;
  radicalHintRu: string;
  radicalHintEn: string;
  wordChar: string;
  pinyin: string;
  meaningRu: string;
  meaningEn: string;
}

export const MEMORY_RADICAL_WORD_PAIRS: MemoryRadicalPair[] = [
  { id: 'mr-1', radical: '氵', radicalHintRu: 'вода', radicalHintEn: 'water', wordChar: '河', pinyin: 'hé', meaningRu: 'река', meaningEn: 'river' },
  { id: 'mr-2', radical: '艹', radicalHintRu: 'растение', radicalHintEn: 'plant', wordChar: '茶', pinyin: 'chá', meaningRu: 'чай', meaningEn: 'tea' },
  { id: 'mr-3', radical: '木', radicalHintRu: 'дерево', radicalHintEn: 'wood', wordChar: '杯', pinyin: 'bēi', meaningRu: 'чашка', meaningEn: 'cup' },
  { id: 'mr-4', radical: '口', radicalHintRu: 'рот', radicalHintEn: 'mouth', wordChar: '吃', pinyin: 'chī', meaningRu: 'есть', meaningEn: 'eat' },
  { id: 'mr-5', radical: '女', radicalHintRu: 'женщина', radicalHintEn: 'woman', wordChar: '妈', pinyin: 'mā', meaningRu: 'мама', meaningEn: 'mom' },
  { id: 'mr-6', radical: '日', radicalHintRu: 'солнце', radicalHintEn: 'sun', wordChar: '早', pinyin: 'zǎo', meaningRu: 'утро', meaningEn: 'morning' },
  { id: 'mr-7', radical: '门', radicalHintRu: 'дверь', radicalHintEn: 'door', wordChar: '问', pinyin: 'wèn', meaningRu: 'спрашивать', meaningEn: 'ask' },
  { id: 'mr-8', radical: '讠', radicalHintRu: 'речь', radicalHintEn: 'speech', wordChar: '说', pinyin: 'shuō', meaningRu: 'говорить', meaningEn: 'speak' },
  { id: 'mr-9', radical: '扌', radicalHintRu: 'рука', radicalHintEn: 'hand', wordChar: '打', pinyin: 'dǎ', meaningRu: 'бить / звонить', meaningEn: 'hit / call' },
  { id: 'mr-10', radical: '忄', radicalHintRu: 'сердце', radicalHintEn: 'heart', wordChar: '忙', pinyin: 'máng', meaningRu: 'занятой', meaningEn: 'busy' },
  { id: 'mr-11', radical: '钅', radicalHintRu: 'металл', radicalHintEn: 'metal', wordChar: '钱', pinyin: 'qián', meaningRu: 'деньги', meaningEn: 'money' },
  { id: 'mr-12', radical: '宀', radicalHintRu: 'крыша', radicalHintEn: 'roof', wordChar: '家', pinyin: 'jiā', meaningRu: 'дом / семья', meaningEn: 'home' },
  { id: 'mr-13', radical: '雨', radicalHintRu: 'дождь', radicalHintEn: 'rain', wordChar: '雪', pinyin: 'xuě', meaningRu: 'снег', meaningEn: 'snow' },
  { id: 'mr-14', radical: '石', radicalHintRu: 'камень', radicalHintEn: 'stone', wordChar: '碗', pinyin: 'wǎn', meaningRu: 'миска', meaningEn: 'bowl' },
];

export interface ChainWordNode {
  zh: string;
  pinyin: string;
  ru: string;
  en: string;
}

/**
 * Dense cyclic vocabulary graph so every tail character has valid next words.
 */
export const CURATED_CHAIN_WORDS: ChainWordNode[] = [
  { zh: '今天', pinyin: 'jīntiān', ru: 'сегодня', en: 'today' },
  { zh: '天气', pinyin: 'tiānqì', ru: 'погода', en: 'weather' },
  { zh: '汽车', pinyin: 'qìchē', ru: 'автомобиль', en: 'car' },
  { zh: '车站', pinyin: 'chēzhàn', ru: 'станция, вокзал', en: 'station' },
  { zh: '站台', pinyin: 'zhàntái', ru: 'перрон, платформа', en: 'platform' },
  { zh: '台湾', pinyin: 'Táiwān', ru: 'Тайвань', en: 'Taiwan' },
  { zh: '明天', pinyin: 'míngtiān', ru: 'завтра', en: 'tomorrow' },
  { zh: '天安门', pinyin: 'Tiān’ānmén', ru: 'Тяньаньмэнь', en: 'Tiananmen' },
  { zh: '门口', pinyin: 'ménkǒu', ru: 'вход, у двери', en: 'doorway' },
  { zh: '口水', pinyin: 'kǒushuǐ', ru: 'слюна', en: 'saliva' },
  { zh: '水果', pinyin: 'shuǐguǒ', ru: 'фрукты', en: 'fruit' },
  { zh: '果汁', pinyin: 'guǒzhī', ru: 'фруктовый сок', en: 'juice' },
  { zh: '水杯', pinyin: 'shuǐbēi', ru: 'стакан для воды', en: 'water cup' },
  { zh: '杯子', pinyin: 'bēizi', ru: 'чашка, стакан', en: 'cup, glass' },
  { zh: '子女', pinyin: 'zǐnǚ', ru: 'дети (сын и дочь)', en: 'children' },
  { zh: '女儿', pinyin: 'nǚ’ér', ru: 'дочь', en: 'daughter' },
  { zh: '儿子', pinyin: 'érzi', ru: 'сын', en: 'son' },
  { zh: '火车', pinyin: 'huǒchē', ru: 'поезд', en: 'train' },
  { zh: '车票', pinyin: 'chēpiào', ru: 'билет', en: 'ticket' },
  { zh: '票价', pinyin: 'piàojià', ru: 'стоимость билета', en: 'ticket price' },
  { zh: '价格', pinyin: 'jiàgé', ru: 'цена', en: 'price' },
  { zh: '中国', pinyin: 'Zhōngguó', ru: 'Китай', en: 'China' },
  { zh: '国家', pinyin: 'guójiā', ru: 'страна, государство', en: 'country' },
  { zh: '家人', pinyin: 'jiārén', ru: 'члены семьи', en: 'family' },
  { zh: '人民', pinyin: 'rénmín', ru: 'народ', en: 'people' },
  { zh: '北京', pinyin: 'Běijīng', ru: 'Пекин', en: 'Beijing' },
  { zh: '京剧', pinyin: 'jīngjù', ru: 'пекинская опера', en: 'Peking opera' },
  { zh: '学习', pinyin: 'xuéxí', ru: 'учиться', en: 'study' },
  { zh: '习惯', pinyin: 'xíguàn', ru: 'привычка', en: 'habit' },
  { zh: '学校', pinyin: 'xuéxiào', ru: 'школа', en: 'school' },
  { zh: '校长', pinyin: 'xiàozhǎng', ru: 'директор школы', en: 'principal' },
  { zh: '长城', pinyin: 'Chángchéng', ru: 'Великая стена', en: 'Great Wall' },
  { zh: '城市', pinyin: 'chéngshì', ru: 'город', en: 'city' },
  { zh: '市场', pinyin: 'shìchǎng', ru: 'рынок', en: 'market' },
  { zh: '机场', pinyin: 'jīchǎng', ru: 'аэропорт', en: 'airport' },
  { zh: '手机', pinyin: 'shǒujī', ru: 'мобильный телефон', en: 'mobile phone' },
  { zh: '电脑', pinyin: 'diànnǎo', ru: 'компьютер', en: 'computer' },
  { zh: '电视', pinyin: 'diànshì', ru: 'телевизор', en: 'television' },
  { zh: '电影', pinyin: 'diànyǐng', ru: 'фильм, кино', en: 'movie' },
  { zh: '时间', pinyin: 'shíjiān', ru: 'время', en: 'time' },
  { zh: '房间', pinyin: 'fángjiān', ru: 'комната', en: 'room' },
  { zh: '饭店', pinyin: 'fàndiàn', ru: 'ресторан, отель', en: 'restaurant' },
  { zh: '米饭', pinyin: 'mǐfàn', ru: 'варёный рис', en: 'cooked rice' },
  { zh: '飞机', pinyin: 'fēijī', ru: 'самолёт', en: 'airplane' },
  { zh: '医生', pinyin: 'yīshēng', ru: 'врач', en: 'doctor' },
  { zh: '生日', pinyin: 'shēngrì', ru: 'день рождения', en: 'birthday' },
  { zh: '日本', pinyin: 'Rìběn', ru: 'Япония', en: 'Japan' },
  { zh: '本子', pinyin: 'běnzi', ru: 'тетрадь', en: 'notebook' },
  { zh: '早上', pinyin: 'zǎoshang', ru: 'утро', en: 'morning' },
  { zh: '上午', pinyin: 'shàngwǔ', ru: 'до полудня', en: 'morning' },
  { zh: '午饭', pinyin: 'wǔfàn', ru: 'обед', en: 'lunch' },
  { zh: '朋友', pinyin: 'péngyou', ru: 'друг', en: 'friend' },
  { zh: '友好', pinyin: 'yǒuhǎo', ru: 'дружелюбный', en: 'friendly' },
  { zh: '好吃', pinyin: 'hǎochī', ru: 'вкусный', en: 'delicious' },
  { zh: '吃饭', pinyin: 'chīfàn', ru: 'кушать', en: 'eat a meal' },
  { zh: '开心', pinyin: 'kāixīn', ru: 'радостный', en: 'happy' },
  { zh: '心爱', pinyin: 'xīn’ài', ru: 'любимый', en: 'beloved' },
  { zh: '爱好', pinyin: 'àihào', ru: 'хобби, увлечение', en: 'hobby' },
  { zh: '工作', pinyin: 'gōngzuò', ru: 'работа', en: 'work' },
  { zh: '中文', pinyin: 'Zhōngwén', ru: 'китайский язык', en: 'Chinese' },
  { zh: '文化', pinyin: 'wénhuà', ru: 'культура', en: 'culture' },
  { zh: '牛奶', pinyin: 'niúnǎi', ru: 'молоко', en: 'milk' },
  { zh: '奶茶', pinyin: 'nǎichá', ru: 'молочный чай', en: 'milk tea' },
  { zh: '茶叶', pinyin: 'cháyè', ru: 'чайный лист', en: 'tea leaves' },
];

export interface QuickDialogueRound {
  id: string;
  promptZh: string;
  promptPinyin: string;
  promptRu: string;
  promptEn: string;
  correct: ChainWordNode;
  wrong: [ChainWordNode, ChainWordNode];
}

export const QUICK_DIALOGUE_ROUNDS: QuickDialogueRound[] = [
  {
    id: 'dlg-1',
    promptZh: '你好吗？',
    promptPinyin: 'Nǐ hǎo ma?',
    promptRu: 'Как дела?',
    promptEn: 'How are you?',
    correct: { zh: '我很好，谢谢！', pinyin: 'Wǒ hěn hǎo, xièxie!', ru: 'У меня всё хорошо, спасибо!', en: "I'm very good, thank you!" },
    wrong: [
      { zh: '现在三点了。', pinyin: 'Xiànzài sān diǎn le.', ru: 'Сейчас три часа.', en: "It's three o'clock now." },
      { zh: '我是医生。', pinyin: 'Wǒ shì yīshēng.', ru: 'Я врач.', en: 'I am a doctor.' },
    ],
  },
  {
    id: 'dlg-2',
    promptZh: '谢谢你的帮助！',
    promptPinyin: 'Xièxie nǐ de bāngzhù!',
    promptRu: 'Спасибо за твою помощь!',
    promptEn: 'Thank you for your help!',
    correct: { zh: '不客气！', pinyin: 'Bù kèqi!', ru: 'Не за что!', en: "You're welcome!" },
    wrong: [
      { zh: '对不起。', pinyin: 'Duìbuqǐ.', ru: 'Извините.', en: "I'm sorry." },
      { zh: '明天见！', pinyin: 'Míngtiān jiàn!', ru: 'До завтра!', en: 'See you tomorrow!' },
    ],
  },
  {
    id: 'dlg-3',
    promptZh: '对不起，我来晚了。',
    promptPinyin: 'Duìbuqǐ, wǒ lái wǎn le.',
    promptRu: 'Извините, я опоздал.',
    promptEn: "I'm sorry I'm late.",
    correct: { zh: '没关系！', pinyin: 'Méi guānxi!', ru: 'Ничего страшного!', en: "It's okay!" },
    wrong: [
      { zh: '很好吃！', pinyin: 'Hěn hǎochī!', ru: 'Очень вкусно!', en: 'Delicious!' },
      { zh: '太贵了。', pinyin: 'Tài guì le.', ru: 'Слишком дорого.', en: 'Too expensive.' },
    ],
  },
  {
    id: 'dlg-4',
    promptZh: '你想喝什么？',
    promptPinyin: 'Nǐ xiǎng hē shénme?',
    promptRu: 'Что ты хочешь попить?',
    promptEn: 'What would you like to drink?',
    correct: { zh: '我想喝一杯热茶。', pinyin: 'Wǒ xiǎng hē yī bēi rè chá.', ru: 'Я хочу чашку горячего чая.', en: 'I want a cup of hot tea.' },
    wrong: [
      { zh: '我想去北京。', pinyin: 'Wǒ xiǎng qù Běijīng.', ru: 'Я хочу поехать в Пекин.', en: 'I want to go to Beijing.' },
      { zh: '桌子很大。', pinyin: 'Zhuōzi hěn dà.', ru: 'Стол очень большой.', en: 'The table is big.' },
    ],
  },
  {
    id: 'dlg-5',
    promptZh: '这杯茶多少钱？',
    promptPinyin: 'Zhè bēi chá duōshao qián?',
    promptRu: 'Сколько стоит эта чашка чая?',
    promptEn: 'How much is this cup of tea?',
    correct: { zh: '十块钱。', pinyin: 'Shí kuài qián.', ru: 'Десять юаней.', en: 'Ten yuan.' },
    wrong: [
      { zh: '八点上课。', pinyin: 'Bā diǎn shàngkè.', ru: 'Урок в восемь часов.', en: 'Class starts at eight.' },
      { zh: '我的朋友。', pinyin: 'Wǒ de péngyou.', ru: 'Мой друг.', en: 'My friend.' },
    ],
  },
  {
    id: 'dlg-6',
    promptZh: '现在几点了？',
    promptPinyin: 'Xiànzài jǐ diǎn le?',
    promptRu: 'Который сейчас час?',
    promptEn: 'What time is it now?',
    correct: { zh: '现在下午两点。', pinyin: 'Xiànzài xiàwǔ liǎng diǎn.', ru: 'Сейчас два часа дня.', en: "It's 2 PM now." },
    wrong: [
      { zh: '今天天气很好。', pinyin: 'Jīntiān tiānqì hěn hǎo.', ru: 'Сегодня отличная погода.', en: 'The weather is nice today.' },
      { zh: '我喜欢吃米饭。', pinyin: 'Wǒ xǐhuan chī mǐfàn.', ru: 'Я люблю есть рис.', en: 'I like eating rice.' },
    ],
  },
  {
    id: 'dlg-7',
    promptZh: '你爸爸做什么工作？',
    promptPinyin: 'Nǐ bàba zuò shénme gōngzuò?',
    promptRu: 'Кем работает твой папа?',
    promptEn: 'What does your dad do?',
    correct: { zh: '他是医生。', pinyin: 'Tā shì yīshēng.', ru: 'Он врач.', en: 'He is a doctor.' },
    wrong: [
      { zh: '他在家看电视。', pinyin: 'Tā zài jiā kàn diànshì.', ru: 'Он смотрит ТВ дома.', en: 'He watches TV at home.' },
      { zh: '我有两本书。', pinyin: 'Wǒ yǒu liǎng běn shū.', ru: 'У меня есть две книги.', en: 'I have two books.' },
    ],
  },
  {
    id: 'dlg-8',
    promptZh: '你中午想吃什么？',
    promptPinyin: 'Nǐ zhōngwǔ xiǎng chī shénme?',
    promptRu: 'Что ты хочешь съесть на обед?',
    promptEn: 'What do you want to eat for lunch?',
    correct: { zh: '我想吃中国菜。', pinyin: 'Wǒ xiǎng chī Zhōngguó cài.', ru: 'Я хочу китайские блюда.', en: 'I want to eat Chinese food.' },
    wrong: [
      { zh: '我坐出租车去。', pinyin: 'Wǒ zuò chūzūchē qù.', ru: 'Я поеду на такси.', en: 'I will go by taxi.' },
      { zh: '这是我的电脑。', pinyin: 'Zhè shì wǒ de diànnǎo.', ru: 'Это мой компьютер.', en: 'This is my computer.' },
    ],
  },
  {
    id: 'dlg-9',
    promptZh: '你怎么去机场？',
    promptPinyin: 'Nǐ zěnme qù jīchǎng?',
    promptRu: 'Как ты доберёшься до аэропорта?',
    promptEn: 'How are you getting to the airport?',
    correct: { zh: '我坐出租车去。', pinyin: 'Wǒ zuò chūzūchē qù.', ru: 'Я поеду на такси.', en: "I'm taking a taxi." },
    wrong: [
      { zh: '请再等五分钟。', pinyin: 'Qǐng zài děng wǔ fēnzhōng.', ru: 'Подождите ещё 5 минут.', en: 'Please wait 5 minutes.' },
      { zh: '今天不下雨。', pinyin: 'Jīntiān bù xià yǔ.', ru: 'Сегодня нет дождя.', en: "It's not raining today." },
    ],
  },
  {
    id: 'dlg-10',
    promptZh: '你喜欢看电影吗？',
    promptPinyin: 'Nǐ xǐhuan kàn diànyǐng ma?',
    promptRu: 'Тебе нравится смотреть фильмы?',
    promptEn: 'Do you like watching movies?',
    correct: { zh: '很喜欢，周末常看。', pinyin: 'Hěn xǐhuan, zhōumò cháng kàn.', ru: 'Очень люблю, часто смотрю на выходных.', en: 'Yes, I often watch on weekends.' },
    wrong: [
      { zh: '我今年二十岁。', pinyin: 'Wǒ jīnnián èrshí suì.', ru: 'Мне двадцать лет.', en: 'I am 20 years old.' },
      { zh: '房间很明亮。', pinyin: 'Fángjiān hěn míngliàng.', ru: 'Комната очень светлая.', en: 'The room is bright.' },
    ],
  },
  {
    id: 'dlg-11',
    promptZh: '你叫什么名字？',
    promptPinyin: 'Nǐ jiào shénme míngzi?',
    promptRu: 'Как тебя зовут?',
    promptEn: 'What is your name?',
    correct: { zh: '我叫安娜。', pinyin: 'Wǒ jiào Ānnà.', ru: 'Меня зовут Анна.', en: 'My name is Anna.' },
    wrong: [
      { zh: '我住在北京。', pinyin: 'Wǒ zhù zài Běijīng.', ru: 'Я живу в Пекине.', en: 'I live in Beijing.' },
      { zh: '我不喝牛奶。', pinyin: 'Wǒ bù hē niúnǎi.', ru: 'Я не пью молоко.', en: "I don't drink milk." },
    ],
  },
  {
    id: 'dlg-12',
    promptZh: '今天冷不冷？',
    promptPinyin: 'Jīntiān lěng bu lěng?',
    promptRu: 'Сегодня холодно?',
    promptEn: 'Is it cold today?',
    correct: { zh: '不冷，今天很暖和。', pinyin: 'Bù lěng, jīntiān hěn nuǎnhuo.', ru: 'Не холодно, сегодня тепло.', en: 'Not cold, it is warm today.' },
    wrong: [
      { zh: '我学习汉语。', pinyin: 'Wǒ xuéxí Hànyǔ.', ru: 'Я учу китайский.', en: 'I study Chinese.' },
      { zh: '请喝水。', pinyin: 'Qǐng hē shuǐ.', ru: 'Пожалуйста, попей воды.', en: 'Please drink water.' },
    ],
  },
];

export interface StrokeBlitzChar {
  char: string;
  pinyin: string;
  ru: string;
  en: string;
}

export const STROKE_BLITZ_CHARS: StrokeBlitzChar[] = [
  { char: '人', pinyin: 'rén', ru: 'человек', en: 'person' },
  { char: '大', pinyin: 'dà', ru: 'большой', en: 'big' },
  { char: '天', pinyin: 'tiān', ru: 'небо, день', en: 'sky, day' },
  { char: '木', pinyin: 'mù', ru: 'дерево', en: 'tree, wood' },
  { char: '水', pinyin: 'shuǐ', ru: 'вода', en: 'water' },
  { char: '火', pinyin: 'huǒ', ru: 'огонь', en: 'fire' },
  { char: '山', pinyin: 'shān', ru: 'гора', en: 'mountain' },
  { char: '日', pinyin: 'rì', ru: 'солнце, день', en: 'sun, day' },
  { char: '月', pinyin: 'yuè', ru: 'луна, месяц', en: 'moon, month' },
  { char: '口', pinyin: 'kǒu', ru: 'рот', en: 'mouth' },
  { char: '中', pinyin: 'zhōng', ru: 'середина, центр', en: 'middle, center' },
  { char: '好', pinyin: 'hǎo', ru: 'хороший', en: 'good' },
  { char: '女', pinyin: 'nǚ', ru: 'женщина', en: 'woman' },
  { char: '子', pinyin: 'zǐ', ru: 'ребёнок', en: 'child' },
  { char: '心', pinyin: 'xīn', ru: 'сердце', en: 'heart' },
  { char: '手', pinyin: 'shǒu', ru: 'рука', en: 'hand' },
  { char: '门', pinyin: 'mén', ru: 'дверь', en: 'door' },
  { char: '问', pinyin: 'wèn', ru: 'спрашивать', en: 'ask' },
  { char: '明', pinyin: 'míng', ru: 'яркий, завтра', en: 'bright' },
  { char: '茶', pinyin: 'chá', ru: 'чай', en: 'tea' },
  { char: '家', pinyin: 'jiā', ru: 'дом, семья', en: 'home, family' },
  { char: '学', pinyin: 'xué', ru: 'учиться', en: 'study' },
  { char: '北', pinyin: 'běi', ru: 'север', en: 'north' },
  { char: '京', pinyin: 'jīng', ru: 'столица', en: 'capital' },
  { char: '吃', pinyin: 'chī', ru: 'есть', en: 'eat' },
  { char: '喝', pinyin: 'hē', ru: 'пить', en: 'drink' },
  { char: '看', pinyin: 'kàn', ru: 'смотреть', en: 'look' },
  { char: '书', pinyin: 'shū', ru: 'книга', en: 'book' },
  { char: '车', pinyin: 'chē', ru: 'машина', en: 'car' },
  { char: '马', pinyin: 'mǎ', ru: 'лошадь', en: 'horse' },
];
