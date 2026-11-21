"""Rebuild offline card material and audit every row against downloaded reference dictionaries."""
import argparse
import collections
import gzip
import json
from pathlib import Path
import re
import unicodedata

parser = argparse.ArgumentParser()
for name in ('cedict', 'russian', 'hanzi', 'bkrs', 'ru_hsk'):
    parser.add_argument('--' + name, type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
levels = [root / f'public/data/hsk-{n}.json' for n in range(1, 7)]
decks = [json.loads(p.read_text(encoding='utf8')) for p in levels]
words = [w for deck in decks for w in deck]
index = {w['s']: w for w in words}
hanzi = {v['character']: v for v in map(json.loads, args.hanzi.read_text(encoding='utf8').splitlines())}
cedict = collections.defaultdict(set)
def reading(s):
    return re.sub(r"[ '’·-]", '', s.lower().replace('u:', 'ü').replace('v', 'ü'))
with gzip.open(args.cedict, 'rt', encoding='utf-8-sig') as f:
    for line in f:
        m = re.match(r'\S+ (\S+) \[([^\]]+)\]', line)
        if m:
            cedict[m[1]].add(reading(m[2]))
russian = collections.defaultdict(set)
with args.russian.open(encoding='utf8') as f:
    for line in f:
        entry = json.loads(line)
        for sense in entry.get('senses', []):
            russian[entry['word']].update(sense.get('glosses', []))
bkrs = collections.defaultdict(list)
with gzip.open(args.bkrs, 'rt', encoding='utf-8-sig') as f:
    head = ''
    for line in f:
        if line and not line[0].isspace():
            head = line.strip()
        elif head in index and '[m' in line:
            definition = re.sub(r'\[ex\].*?\[/ex\]', '', line)
            bkrs[head].append(re.sub(r'\[[^\]]+\]', ' ', definition))
ru_hsk = {row['hanzi']: row['translations'].get('rus', []) for row in json.loads(args.ru_hsk.read_text(encoding='utf8'))}
def norm(s):
    return s.lower().replace('ё','е').replace('\u0301','').strip(' .')
def glosses(items):
    return {norm(g) for item in items for g in re.split('[,;]', item) if norm(g)}

topics = {
    'people': '爱人 小学生 太太 服务员 兵 夫妇 夫妻 夫人 士兵 战士 丈夫 军人 厨师 家长 行人 部长 公务员 教练 球迷 主任 老百姓 宝宝 宝贝 嘉宾 车主 船长',
    'time': '上午 下午 晚点 季度 到期 端午节',
    'work': '下课 成立 充电 石油 资源 管道 项目 机器 培训 培育 机关 机械 机制 经营 大学 本子',
    'places': '边境 晴天 太阳 阳光 阳台 桃花 雨水 果树 地下 北边 东边 南边 西边 外边 北部 东方 阴天 冰 动物 前头 后边 后面 右 对面 球场 操场',
    'communication': '图 图画 描写 图案 传说 听说 电视台 电台 网站 电话 手机 上网 听写 汇报 流传 形容 访问',
    'descriptions': '结实 危险 大方 浅 五颜六色 鲜 新鲜 瘦 糟 低 冷 凉 凉快 流行 薄 激烈 宝贵 珍贵 亲爱 吉利 不大 常见',
    'actions': '带来 加油 团结 危害 下来 冲 进口 晒 闪 烧 同情 摘 爆 出场 启动 帮忙 记住 动作 回 回来 回去 交 交给 练习 碰到 碰见 提 养 把握 保留 记录 领 领先 面对 设立 支持 摆动 抱 戴 归 含 缓解 收回 挑 摸 打开 关机 练 带动 分配 输 训练 规划 签 运行 持有 出动 跌 错过 过渡 开通',
    'home': '洗衣机 手表 球鞋 手套 帽子 房子 钱 箱子 剪子 电饭锅 台阶',
    'health': '消化',
    'basics': '八 百 十 二 三 四 五 六 七 九 两 零 千 万 亿 数字 们 次',
}
overrides = {s:t for t, group in topics.items() for s in group.split()}
corrections = {'闭幕':['закрываться, завершаться (о собрании или мероприятии)','опускаться (о занавесе)'],
               '闭幕式':['церемония закрытия'], '至':['до, вплоть до','достигать, прибывать','крайне, в высшей степени'],
               '爱好':['увлекаться','увлечение, хобби'], '以便':['чтобы, для того чтобы'],
               '不至于':['вряд ли дойдёт до этого','не до такой степени']}
corrections.update({'车上':['в машине, в транспорте'], '真的':['действительно','настоящий'],
    '见过':['доводилось видеть'], '放到':['положить, поставить куда-либо'], '能不能':['можно ли, возможно ли'],
    '不一会儿':['вскоре, через короткое время'], '有空儿':['иметь свободное время'],
    '电动车':['электротранспорт','электровелосипед, электроскутер'], '没法儿':['нет возможности, никак не получается'],
    '胡同儿':['переулок'], '有劲儿':['сильный, энергичный','интересный'], '匹':['счётное слово для лошадей и рулонов ткани'],
    '一番':['один раз, один заход (о действии или усилии)'], '指着':['указывать на','рассчитывать на']})
readings = {'匹':('pǐ','pi3'), '码头':('mǎ tou','ma3 tou5'), '看得见':('kàn de jiàn','kan4 de5 jian4'),
    '不一会儿':('bù yīhuìr','bu4 yi1 hui4 r5'), '没法儿':('méi fǎr','mei2 fa3 r5'),
    '胡同儿':('hú tòngr','hu2 tong4 r5'), '小偷儿':('xiǎo tōur','xiao3 tou1 r5'),
    '名牌儿':('míng páir','ming2 pai2 r5'), '笑话儿':('xiào huar','xiao4 hua5 r5'),
    '有空儿':('yǒu kòngr','you3 kong4 r5'), '有劲儿':('yǒu jìnr','you3 jin4 r5')}
overrides.update({'闭幕':'actions','闭幕式':'communication'})
for line in (root/'scripts/reviewed-topics.txt').read_text(encoding='utf8').splitlines():
    topic, headwords = line.split('|')
    overrides.update(dict.fromkeys(headwords.split(), topic))

def numbered(pinyin):
    syllables = []
    for syllable in pinyin.split():
        letters = ''
        tone = 5
        for c in unicodedata.normalize('NFD', syllable):
            if c in '\u0304\u0301\u030c\u0300':
                tone = '\u0304\u0301\u030c\u0300'.index(c) + 1
            else:
                letters += c
        erhua = letters.endswith('r') and letters != 'er'
        syllables.append(unicodedata.normalize('NFC', letters[:-1] if erhua else letters) + str(tone))
        if erhua:
            syllables.append('r5')
    return ' '.join(syllables)

for line in (root/'scripts/reviewed-words.txt').read_text(encoding='utf8').splitlines():
    s, p, ru, en, topic = line.split('|')
    readings[s] = (p, numbered(p))
    corrections[s] = ru.split(';')
    overrides[s] = topic
    index[s]['m'] = en.split(';')

# Restrict matches to whole English words in the primary gloss. Substrings
# such as "tea" in "teacher" caused many of the old topic assignments.
topic_terms = {
    'food': 'food meal breakfast lunch dinner supper vegetable fruit noodle noodles bread meat soup rice apple pear peach banana flour milk juice shrimp beef chicken pork fish potato restaurant dumpling biscuit cookie cake tea coffee egg eggs duck grape mushroom vinegar garlic ginger',
    'health': 'health illness disease hospital medical medicine medication diagnosis surgery surgical symptom fever headache pain tooth teeth lung liver kidney stomach bladder artery blood injury bone muscle skin waist neck knee shoulder wrist ankle throat brain nurse dentist patient',
    'people': 'person people father mother parent sister brother son daughter uncle aunt nephew cousin husband wife child children teenager pupil student teacher professor engineer officer chairman director leader athlete journalist employee employer singer actor actress musician lawyer worker farmer passenger soldier tourist',
    'time': 'yesterday tomorrow morning afternoon evening midnight noon week month year decade century autumn winter spring summer annual monthly weekly weekend monday tuesday wednesday thursday friday saturday sunday',
    'travel': 'train airplane aeroplane aircraft airport railway subway bus taxi bicycle motorcycle ferry flight highway motorway passport visa luggage baggage railway railroad traffic vehicle truck journey tourism tourist',
    'places': 'river lake mountain hill ocean island continent province village country city valley forest desert meadow cliff coast beach peninsula park canyon district county capital border courtyard glacier garden',
    'home': 'furniture table chair cabinet bed bedroom kitchen bathroom refrigerator curtain sofa towel mattress wardrobe skirt socks trousers jeans shirt pants boots shoes jacket sweater bracelet necklace',
    'work': 'business firm company enterprise employee salary wage accounting accountant bank investment finance financial contract factory industry classroom university college curriculum exam homework laboratory equipment technology engineering computer software',
    'communication': 'sentence language dialect pronunciation dialogue conversation translation speech letter message article newspaper magazine television cinema reporter interview advertisement broadcast poetry poem novel',
    'descriptions': 'beautiful handsome ugly tall short wide narrow long thin thick strong weak expensive cheap red blue yellow green purple orange black white grey gray soft hard round square sweet sour bitter salty spicy bright dark empty full',
}
term_map = {k:set(v.split()) for k,v in topic_terms.items()}
def topic_evidence(w):
    words_in_gloss = set(re.findall('[a-z]+', w['m'][0].lower()))
    categories = [t for t,terms in term_map.items() if terms & words_in_gloss]
    return categories[0] if len(categories) == 1 else None

by_char = collections.defaultdict(list)
by_radical = collections.defaultdict(list)
for w in words:
    if w['s'] in readings:
        w['p'], w['n'] = readings[w['s']]
    if w['s'] == '匹':
        w['m'] = ['classifier for horses and bolts of cloth']
    w['ru'] = corrections.get(w['s'], w['ru'])
    w['t'] = overrides.get(w['s'], topic_evidence(w) or w['t'])
    for c in set(w['s']):
        by_char[c].append(w['s'])
    by_radical[w['r']].append(w['s'])
def dump(x):
    return json.dumps(x, ensure_ascii=False, separators=(',',':'))
report = []
for level, deck in enumerate(decks, 1):
    for w in deck:
        s = w['s']
        pool = dict.fromkeys(x for c in s for x in by_char[c] if x != s)
        ranked = sorted(pool, key=lambda x: (not (s in x or x in s), -len(set(x) & set(s)), len(x)))
        if not ranked:
            ranked = [x for x in by_radical[w['r']] if x != s]
        relation = 'character' if pool else 'radical'
        if not ranked:
            ranked = [u['s'] for u in words if u['s'] != s and u['t'] == w['t']]
            relation = 'topic'
        assert ranked
        neighbors = [[x,index[x]['p'],index[x]['ru'][0],index[x]['m'][0]] for x in ranked[:3]]
        parts = []
        layout = ''
        if len(s) == 1:
            decomposition = hanzi.get(s, {}).get('decomposition','')
            if len(decomposition) == 3 and '？' not in decomposition:
                layout = {'⿰':'horizontal', '⿱':'vertical'}.get(decomposition[0], '')
            symbols = [c for c in decomposition if ord(c) >= 0x2e80 and c != '？'] if '？' not in decomposition else []
        else:
            symbols = list(s)
        for i,c in enumerate(symbols or [s]):
            single = index.get(c)
            syl = w['p'].split()
            pronunciation = syl[i] if len(s)>1 and len(syl)==len(s) else ''
            ru = single['ru'][0] if single else pronunciation or ('ключ' if c == w['r'] else 'элемент')
            en = single['m'][0] if single else pronunciation or ('radical' if c == w['r'] else 'component')
            parts.append([c,ru,en])
        w['study'] = {'parts':parts,'neighbors':neighbors,'relation':relation}
        if layout:
            w['study']['layout'] = layout
        refs = russian.get(s,set()) | set(ru_hsk.get(s, []))
        ref_text = norm(' '.join(bkrs.get(s, [])))
        matched = [g for g in w['ru'] if norm(g) in glosses(refs) or re.search(r'(?<!\w)'+re.escape(norm(g))+r'(?!\w)',ref_text)]
        report.append({'editedGloss': s in corrections, 'level':level,'word':s,'reading':w['p'],'topic':w['t'],'ru':w['ru'],
                       'cedict': 'match' if reading(w['n']) in cedict[s] else 'different reading' if cedict[s] else 'no entry',
                       'bkrsHeadword': bool(ref_text), 'matchedGlosses': matched,
                       'topicEvidence': 'reviewed' if s in overrides else 'primary gloss cue' if topic_evidence(w) else 'original classification',
                       'ruComparison': 'all glosses found' if len(matched)==len(w['ru']) else 'some glosses found' if matched else 'compare senses' if refs or ref_text else 'no entry'})
    levels[level-1].write_text(dump(deck)+'\n',encoding='utf8')
out = root / 'audit'
out.mkdir(exist_ok=True)
(out/'vocabulary.jsonl').write_text('\n'.join(map(dump,report))+'\n',encoding='utf8')
for col in ('cedict','ruComparison'):
    print(col,collections.Counter(r[col] for r in report))
print('rows',len(report),'unique headwords',len(index))

