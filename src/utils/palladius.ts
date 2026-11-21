const TONE_VOWEL_TO_PLAIN: Record<string, string> = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
};

// Complete standard Palladius (система Палладия) Mandarin syllable mapping
const PALLADIUS_SYLLABLES: Record<string, string> = {
  a: 'а', ai: 'ай', an: 'ань', ang: 'ан', ao: 'ао',
  ba: 'ба', bai: 'бай', ban: 'бань', bang: 'бан', bao: 'бао',
  bei: 'бэй', ben: 'бэнь', beng: 'бэн', bi: 'би', bian: 'бянь',
  biao: 'бяо', bie: 'бе', bin: 'бинь', bing: 'бин', bo: 'бо', bu: 'бу',
  ca: 'ца', cai: 'цай', can: 'цань', cang: 'цан', cao: 'цао',
  ce: 'цэ', cei: 'цэй', cen: 'цэнь', ceng: 'цэн', ci: 'цы',
  cong: 'цун', cou: 'цоу', cu: 'цу', cuan: 'цуань', cui: 'цуй',
  cun: 'цунь', cuo: 'цо',
  cha: 'ча', chai: 'чай', chan: 'чань', chang: 'чан', chao: 'чао',
  che: 'чэ', chen: 'чэнь', cheng: 'чэн', chi: 'чи', chong: 'чун',
  chou: 'чоу', chu: 'чу', chua: 'чуа', chuai: 'чуай', chuan: 'чуань',
  chuang: 'чуан', chui: 'чуй', chun: 'чунь', chuo: 'чо',
  da: 'да', dai: 'дай', dan: 'дань', dang: 'дан', dao: 'дао',
  de: 'дэ', dei: 'дэй', den: 'дэнь', deng: 'дэн', di: 'ди',
  dia: 'дя', dian: 'дянь', diao: 'дяо', die: 'де', ding: 'дин',
  diu: 'дю', dong: 'дун', dou: 'доу', du: 'ду', duan: 'дуань',
  dui: 'дуй', dun: 'дунь', duo: 'до',
  e: 'э', ei: 'эй', en: 'энь', eng: 'эн', er: 'эр',
  fa: 'фа', fan: 'фань', fang: 'фан', fei: 'фэй', fen: 'фэнь',
  feng: 'фэн', fo: 'фо', fou: 'фоу', fu: 'фу',
  ga: 'га', gai: 'гай', gan: 'гань', gang: 'ган', gao: 'гао',
  ge: 'гэ', gei: 'гэй', gen: 'гэнь', geng: 'гэн', gong: 'гун',
  gou: 'гоу', gu: 'гу', gua: 'гуа', guai: 'гуай', guan: 'гуань',
  guang: 'гуан', gui: 'гуй', gun: 'гунь', guo: 'го',
  ha: 'ха', hai: 'хай', han: 'хань', hang: 'хан', hao: 'хао',
  he: 'хэ', hei: 'хэй', hen: 'хэнь', heng: 'хэн', hong: 'хун',
  hou: 'хоу', hu: 'ху', hua: 'хуа', huai: 'хуай', huan: 'хуань',
  huang: 'хуан', hui: 'хуэй', hun: 'хунь', huo: 'хо',
  ji: 'цзи', jia: 'цзя', jian: 'цзянь', jiang: 'цзян', jiao: 'цзяо',
  jie: 'цзе', jin: 'цзинь', jing: 'цзин', jiong: 'цзюн', jiu: 'цзю',
  ju: 'цзюй', juan: 'цзюань', jue: 'цзюэ', jun: 'цзюнь',
  ka: 'ка', kai: 'кай', kan: 'кань', kang: 'кан', kao: 'као',
  ke: 'кэ', kei: 'кэй', ken: 'кэнь', keng: 'кэн', kong: 'кун',
  kou: 'коу', ku: 'ку', kua: 'куа', kuai: 'куай', kuan: 'куань',
  kuang: 'куан', kui: 'куй', kun: 'кунь', kuo: 'ко',
  la: 'ла', lai: 'лай', lan: 'лань', lang: 'лан', lao: 'лао',
  le: 'лэ', lei: 'лэй', leng: 'лэн', li: 'ли', lia: 'ля',
  lian: 'лянь', liang: 'лян', liao: 'ляо', lie: 'ле', lin: 'линь',
  ling: 'лин', liu: 'лю', lo: 'ло', long: 'лун', lou: 'лоу',
  lu: 'лу', luan: 'луань', lun: 'лунь', luo: 'ло',
  lü: 'люй', lüe: 'люэ', lve: 'люэ', lv: 'люй',
  ma: 'ма', mai: 'май', man: 'мань', mang: 'ман', mao: 'мао',
  me: 'мэ', mei: 'мэй', men: 'мэнь', meng: 'мэн', mi: 'ми',
  mian: 'мянь', miao: 'мяо', mie: 'ме', min: 'минь', ming: 'мин',
  miu: 'мю', mo: 'мо', mou: 'моу', mu: 'му',
  na: 'на', nai: 'най', nan: 'нань', nang: 'нан', nao: 'нао',
  ne: 'нэ', nei: 'нэй', nen: 'нэнь', neng: 'нэн', ni: 'ни',
  nian: 'нянь', niang: 'нян', niao: 'няо', nie: 'не', nin: 'нинь',
  ning: 'нин', niu: 'ню', nong: 'нун', nou: 'ноу', nu: 'ну',
  nuan: 'нуань', nun: 'нунь', nuo: 'но',
  nü: 'нюй', nüe: 'нюэ', nve: 'нюэ', nv: 'нюй',
  o: 'о', ou: 'оу',
  pa: 'па', pai: 'пай', pan: 'пань', pang: 'пан', pao: 'пао',
  pei: 'пэй', pen: 'пэнь', peng: 'пэн', pi: 'пи', pian: 'пянь',
  piao: 'пяо', pie: 'пе', pin: 'пинь', ping: 'пин', po: 'по',
  pou: 'поу', pu: 'пу',
  qi: 'ци', qia: 'ця', qian: 'цянь', qiang: 'цян', qiao: 'цяо',
  qie: 'це', qin: 'цинь', qing: 'цин', qiong: 'цюн', qiu: 'цю',
  qu: 'цюй', quan: 'цюань', que: 'цюэ', qun: 'цюнь',
  ran: 'жань', rang: 'жан', rao: 'жао', re: 'жэ', ren: 'жэнь',
  reng: 'жэн', ri: 'жи', rong: 'жун', rou: 'жоу', ru: 'жу',
  rua: 'жуа', ruan: 'жуань', rui: 'жуй', run: 'жунь', ruo: 'жо',
  sa: 'са', sai: 'сай', san: 'сань', sang: 'сан', sao: 'сао',
  se: 'сэ', sei: 'сэй', sen: 'сэнь', seng: 'сэн', si: 'сы',
  song: 'сун', sou: 'соу', su: 'су', suan: 'суань', sui: 'суй',
  sun: 'сунь', suo: 'со',
  sha: 'ша', shai: 'шай', shan: 'шань', shang: 'шан', shao: 'шао',
  she: 'шэ', shei: 'шэй', shen: 'шэнь', sheng: 'шэн', shi: 'ши',
  shou: 'шоу', shu: 'шу', shua: 'шуа', shuai: 'шуай', shuan: 'шуань',
  shuang: 'шуан', shui: 'шуй', shun: 'шунь', shuo: 'шо',
  ta: 'та', tai: 'тай', tan: 'тань', tang: 'тан', tao: 'тао',
  te: 'тэ', tei: 'тэй', teng: 'тэн', ti: 'ти', tian: 'тянь',
  tiao: 'тяо', tie: 'те', ting: 'тин', tong: 'тун', tou: 'тоу',
  tu: 'ту', tuan: 'туань', tui: 'туй', tun: 'тунь', tuo: 'то',
  wa: 'ва', wai: 'вай', wan: 'вань', wang: 'ван', wei: 'вэй',
  wen: 'вэнь', weng: 'вэн', wo: 'во', wu: 'у',
  xi: 'си', xia: 'ся', xian: 'сянь', xiang: 'сян', xiao: 'сяо',
  xie: 'се', xin: 'синь', xing: 'син', xiong: 'сюн', xiu: 'сю',
  xu: 'сюй', xuan: 'сюань', xue: 'сюэ', xun: 'сюнь',
  ya: 'я', yan: 'янь', yang: 'ян', yao: 'яо', ye: 'е',
  yi: 'и', yin: 'инь', ying: 'ин', yo: 'ё', yong: 'юн',
  you: 'ю', yu: 'юй', yuan: 'юань', yue: 'юэ', yun: 'юнь',
  za: 'цза', zai: 'цзай', zan: 'цзань', zang: 'цзан', zao: 'цзао',
  ze: 'цзэ', zei: 'цзэй', zen: 'цзэнь', zeng: 'цзэн', zi: 'цзы',
  zong: 'цзун', zou: 'цзоу', zu: 'цзу', zuan: 'цзуань', zui: 'цзуй',
  zun: 'цзунь', zuo: 'цзо',
  zha: 'чжа', zhai: 'чжай', zhan: 'чжань', zhang: 'чжан', zhao: 'чжао',
  zhe: 'чжэ', zhei: 'чжэй', zhen: 'чжэнь', zheng: 'чжэн', zhi: 'чжи',
  zhong: 'чжун', zhou: 'чжоу', zhu: 'чжу', zhua: 'чжуа', zhuai: 'чжуай',
  zhuan: 'чжуань', zhuang: 'чжуан', zhui: 'чжуй', zhun: 'чжунь', zhuo: 'чжо',
};

const MAX_SYLLABLE_LEN = 6;

function normalizePinyinToken(raw: string): string {
  return raw
    .toLowerCase()
    .split('')
    .map((ch) => TONE_VOWEL_TO_PLAIN[ch] ?? ch)
    .join('')
    .replace(/[1-5]/g, '');
}

function transcribeContinuousToken(token: string): string {
  const norm = normalizePinyinToken(token);
  let i = 0;
  let out = '';

  while (i < norm.length) {
    if (norm[i] === "'" || norm[i] === '’') {
      i++;
      continue;
    }

    let matched = false;
    const maxLen = Math.min(MAX_SYLLABLE_LEN, norm.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const sub = norm.slice(i, i + len);
      const cyr = PALLADIUS_SYLLABLES[sub];
      if (cyr) {
        // Avoid trailing consonant ambiguity before another vowel-starting syllable (e.g. "n" + vowel)
        if (
          out.endsWith('н') &&
          /^[аяэеоёиыую]/.test(cyr)
        ) {
          out += 'ъ';
        }
        out += cyr;
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      out += norm[i];
      i++;
    }
  }

  return out;
}

/**
 * Converts a word's Mandarin Pinyin (e.g. "Běi jīng", "duì bu qǐ")
 * into fused Russian Palladius Cyrillic transcription ("бэйцзин", "дуйбуци").
 */
export function pinyinToPalladius(pinyin: string): string {
  if (!pinyin) return '';
  return pinyin
    .split(/(\s+|[.,!?;:—\-()""«»]+)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part)) return '';
      if (/^[.,!?;:—\-()""«»]+$/.test(part)) return part;
      if (/[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(part)) {
        return transcribeContinuousToken(part);
      }
      return part;
    })
    .join('')
    .trim();
}

/**
 * Converts a full Pinyin sentence preserving spaces between words.
 */
export function pinyinToPalladiusSentence(pinyin: string): string {
  if (!pinyin) return '';
  return pinyin
    .split(/(\s+|[.,!?;:—\-()""«»]+)/)
    .map((part) => {
      if (!part) return '';
      if (/^\s+$/.test(part)) return ' ';
      if (/^[.,!?;:—\-()""«»]+$/.test(part)) return part;
      if (/[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(part)) {
        return transcribeContinuousToken(part);
      }
      return part;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}
