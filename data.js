/* 空中飞人 · 静态数据与通用格式化 */
(function () {
  'use strict';

  const PAIRS = [
    { id: 'EUR/USD', name: '欧元 / 美元', initial: 1.08742, digits: 5 },
    { id: 'GBP/USD', name: '英镑 / 美元', initial: 1.27486, digits: 5 },
    { id: 'USD/JPY', name: '美元 / 日元', initial: 149.382, digits: 3 },
    { id: 'USD/CHF', name: '美元 / 瑞郎', initial: 0.88521, digits: 5 },
    { id: 'EUR/CHF', name: '欧元 / 瑞郎', initial: 0.94170, digits: 5 },
    { id: 'AUD/USD', name: '澳元 / 美元', initial: 0.65432, digits: 5 },
    { id: 'USD/CAD', name: '美元 / 加元', initial: 1.37185, digits: 5 }
  ];

  const BATTLES = [
    {
      id: 'euro-2000', title: '欧元保卫战', pair: 'EUR/USD', event: '2000-09-22', grade: 'B',
      start: '2000-08-01', end: '2000-11-30',
      description: '欧元兑美元跌至历史低位，G7 联手干预，欧洲央行连续加息。',
      tagline: '欧元刚学会走路，就被市场按在地上摩擦。',
      news: [
        { date: '2000-09-14', tag: '央行喊话', title: '官员称不欢迎欧元过度疲软', body: '欧洲央行官员释放口头干预信号，但欧元反弹只持续了很短的时间。' },
        { date: '2000-09-22', tag: '联合干预', title: 'G7 央行买入欧元', body: '主要央行联合干预外汇市场，欧元短线跳涨，空头被迫回补。' },
        { date: '2000-10-26', tag: '余波', title: '干预效果开始衰减', body: '市场重新关注欧美增长差，欧元在短暂反弹后再度承压。' }
      ]
    },
    {
      id: 'sept-11', title: '9·11 避险日', pair: 'USD/CHF', event: '2001-09-11', grade: 'A',
      start: '2001-08-01', end: '2001-10-31',
      description: '袭击发生后全球市场避险，瑞郎与日元走强，美元承压。',
      tagline: '那天，所有屏幕都在跌，只有瑞郎在涨。',
      news: [
        { date: '2001-09-10', tag: '暴风雨前', title: '市场平静，波动率处于低位', body: '外汇市场窄幅震荡，交易者关注的是欧洲央行与日本央行的政策会议。' },
        { date: '2001-09-11', tag: '突发事件', title: '纽约与华盛顿遭到袭击', body: '美国金融市场关闭，避险资金涌入瑞郎、日元与黄金，美元流动性骤降。' },
        { date: '2001-09-17', tag: '重新开盘', title: '美股重开，美元剧烈震荡', body: '市场在避险需求与美元流动性需求之间来回拉扯，波动率维持高位。' }
      ]
    },
    {
      id: 'lehman-2008', title: '雷曼时刻', pair: 'GBP/USD', event: '2008-09-15', grade: 'S',
      start: '2008-08-01', end: '2008-11-28',
      description: '雷曼兄弟破产，全球信贷市场冻结，英镑与风险货币暴跌。',
      tagline: '系统性风险的意思是：系统没事，你有事。',
      news: [
        { date: '2008-09-07', tag: '救助', title: '美国政府接管房利美与房地美', body: '两家住房抵押贷款巨头被接管，市场短暂松一口气，但银行间市场继续收紧。' },
        { date: '2008-09-15', tag: '破产', title: '雷曼兄弟申请破产保护', body: '全球风险资产遭到抛售，英镑等高收益货币快速下跌，避险货币走强。' },
        { date: '2008-10-08', tag: '联合降息', title: '主要央行罕见同步降息', body: '市场短暂反弹，但信贷紧缩与衰退担忧很快重新占据上风。' }
      ]
    },
    {
      id: 'flash-crash-2010', title: '闪电崩盘', pair: 'EUR/USD', event: '2010-05-06', grade: 'A',
      start: '2010-04-01', end: '2010-06-30',
      description: '希腊债务危机升级，道指盘中闪崩，欧元与风险资产剧烈波动。',
      tagline: '九分钟蒸发一万亿，你的止损用了十秒。',
      news: [
        { date: '2010-05-02', tag: '救助', title: '欧元区与 IMF 同意救助希腊', body: '1100 亿欧元救助方案落地，但市场担心危机向葡萄牙、西班牙蔓延。' },
        { date: '2010-05-06', tag: '盘中闪崩', title: '道指一度暴跌近千点', body: '流动性瞬间消失，报价出现极端跳动，外汇市场的点差同时扩大。' },
        { date: '2010-05-09', tag: '稳定基金', title: '欧盟推出 7500 亿欧元稳定机制', body: '欧元短线反弹，但主权债务的基本面担忧并未消失。' }
      ]
    },
    {
      id: 'euro-debt-2011', title: '欧债降级夜', pair: 'EUR/USD', event: '2011-08-05', grade: 'A',
      start: '2011-07-01', end: '2011-09-30',
      description: '美国主权评级被下调，欧债危机蔓延，欧元区银行体系承压。',
      tagline: '美国被降级，欧元先崩；逻辑不重要，波动才重要。',
      news: [
        { date: '2011-07-21', tag: '救助', title: '欧元区同意第二轮希腊救助', body: '领导人试图用更低的利率和更长的期限换取时间，市场并不完全买账。' },
        { date: '2011-08-05', tag: '降级', title: '标普下调美国主权评级', body: '美国失去 AAA 评级，风险资产普跌，欧元兑美元在避险与欧洲自身问题之间剧烈震荡。' },
        { date: '2011-09-06', tag: '瑞郎上限', title: '瑞士央行设定欧元兑瑞郎下限', body: '瑞郎大幅走弱，外汇市场重新定价避险交易，波动向欧元交叉盘传导。' }
      ]
    },
    {
      id: 'draghi-2012', title: '德拉吉时刻', pair: 'EUR/USD', event: '2012-07-26', grade: 'B',
      start: '2012-06-01', end: '2012-09-28',
      description: '德拉吉承诺“不惜一切代价”捍卫欧元，欧元空头遭遇剧烈反转。',
      tagline: '不惜一切代价——包括你的仓位。',
      news: [
        { date: '2012-06-09', tag: '银行救助', title: '欧元区同意救助西班牙银行', body: '最多 1000 亿欧元的救助计划公布，市场短暂缓和，但欧元仍然脆弱。' },
        { date: '2012-07-26', tag: '关键讲话', title: '德拉吉：不惜一切代价捍卫欧元', body: '一句话改变了市场预期，欧元空头开始迅速回补。' },
        { date: '2012-09-06', tag: 'OMT', title: '欧洲央行公布直接货币交易计划', body: '欧洲央行承诺在严格条件下购买主权债，欧元获得阶段性支撑。' }
      ]
    },
    {
      id: 'franc-2015', title: '瑞郎脱钩之夜', pair: 'EUR/CHF', event: '2015-01-15', grade: 'S',
      start: '2014-12-01', end: '2015-02-20',
      description: '瑞士央行突然放弃欧元兑瑞郎 1.20 的下限，汇率在几分钟内剧烈重估。',
      tagline: '一条保持了三年的政策底线，在一个上午消失。',
      news: [
        { date: '2014-12-18', tag: '央行政策', title: '瑞士央行把利率压到负值', body: '瑞士央行对超额活期存款实施负利率，同时再次强调会守住 1 欧元兑 1.20 瑞郎的底线。' },
        { date: '2015-01-12', tag: '市场观察', title: '所有人都盯着 1.20', body: '交易者把 1.20 当成不会破的政策底，围绕它堆积了大量期权与止损。' },
        { date: '2015-01-15', tag: '突发决议', title: '下限被取消', body: '瑞士央行宣布不再维持最低汇率，并进一步降息。报价瞬间失去流动性，点差急剧扩大。' }
      ]
    },
    {
      id: 'brexit-2016', title: '公投之夜', pair: 'GBP/USD', event: '2016-06-24', grade: 'A',
      start: '2016-05-16', end: '2016-07-22',
      description: '英国脱欧公投结果落地，英镑在亚洲时段快速下挫。',
      tagline: '民调、赔率与结果，在同一个夜里全部失效。',
      news: [
        { date: '2016-06-14', tag: '风险提示', title: '英国央行提示公投风险', body: '英国央行把公投列为短期金融稳定风险，市场开始为英镑的大幅波动定价。' },
        { date: '2016-06-23', tag: '投票日', title: '投票结束，等待计票', body: '各地结果陆续公布，博彩赔率与民调仍然指向留欧，市场情绪相对乐观。' },
        { date: '2016-06-24', tag: '结果公布', title: '脱欧阵营胜出', body: '计票结果逆转预期，英镑快速下跌。英国央行表示已准备好提供流动性支持。' }
      ]
    },
    {
      id: 'covid-2020', title: '疫情美元荒', pair: 'GBP/USD', event: '2020-03-19', grade: 'S',
      start: '2020-02-03', end: '2020-04-30',
      description: '疫情全球扩散，美元流动性紧张，英镑兑美元跌至 35 年低位附近。',
      tagline: '病毒没让你隔离，杠杆让你。',
      news: [
        { date: '2020-02-24', tag: '疫情扩散', title: '意大利北部疫情暴发', body: '欧洲市场开始避险，风险货币承压，美元与日元获得买盘。' },
        { date: '2020-03-09', tag: '油价崩跌', title: '原油价格战引发全球抛售', body: '风险资产同步下跌，流动性快速收缩，外汇点差明显扩大。' },
        { date: '2020-03-19', tag: '美元荒', title: '主要央行扩大美元互换额度', body: '美元融资压力达到极点，英镑兑美元跌至数十年低位附近。' },
        { date: '2020-03-23', tag: '无限量 QE', title: '美联储宣布无限量量化宽松', body: '流动性预期逆转，风险资产开始剧烈反弹，空头被打了个措手不及。' }
      ]
    },
    {
      id: 'parity-2022', title: '逼近平价', pair: 'EUR/USD', event: '2022-07-12', grade: 'B',
      start: '2022-06-01', end: '2022-08-12',
      description: '能源危机与美元走强叠加，欧元兑美元二十年来首次逼近 1:1。',
      tagline: '二十年的平价心理关口，被能源账单推到了眼前。',
      news: [
        { date: '2022-06-09', tag: '政策预告', title: '欧洲央行释放加息信号', body: '欧洲央行表示将在 7 月结束净资产购买并加息，市场开始重估欧元区利率路径。' },
        { date: '2022-07-12', tag: '关键价位', title: '欧元跌向平价', body: '能源供应担忧、增长放缓与强势美元叠加，欧元兑美元逼近 1.00。' },
        { date: '2022-07-21', tag: '利率决议', title: '欧洲央行加息 50 个基点', body: '加息幅度高于此前指引，并推出传导保护工具，欧元短线获得支撑。' }
      ]
    },
    {
      id: 'yen-2022', title: '日元干预时刻', pair: 'USD/JPY', event: '2022-09-22', grade: 'A',
      start: '2022-08-15', end: '2022-10-28',
      description: '日本央行坚持宽松，美元兑日元快速上行，财务省入场买入日元。',
      tagline: '当利差遇见干预，方向对了也可能被甩下车。',
      news: [
        { date: '2022-09-07', tag: '口头干预', title: '官员警告单边波动', body: '美元兑日元快速走高，日本财务省官员对单边、急剧的汇率波动表达强烈担忧。' },
        { date: '2022-09-22', tag: '市场干预', title: '日本买入日元', body: '在日本央行维持宽松政策后，日本当局进入市场实施买入日元的干预。' },
        { date: '2022-10-21', tag: '剧烈波动', title: '高位急跌', body: '美元兑日元在高位突然回落，市场随后确认日本再次进行了干预。' }
      ]
    },
    {
      id: 'gilt-2022', title: '英债风暴', pair: 'GBP/USD', event: '2022-09-26', grade: 'A',
      start: '2022-08-15', end: '2022-11-30',
      description: '英国迷你预算引发英债与英镑暴跌，英国央行紧急干预。',
      tagline: '养老金差点爆仓，你抢先一步。',
      news: [
        { date: '2022-09-23', tag: '迷你预算', title: '英国公布大规模减税计划', body: '市场担忧财政可持续性，英债收益率飙升，英镑承压。' },
        { date: '2022-09-26', tag: '历史低位', title: '英镑兑美元逼近历史低位', body: '汇率剧烈波动，杠杆账户的保证金压力在短时间内集中爆发。' },
        { date: '2022-09-28', tag: '央行救市', title: '英国央行紧急购买长期国债', body: '央行出手稳定养老金体系的流动性，英镑与英债短暂企稳。' }
      ]
    },
    {
      id: 'svb-2023', title: '硅谷银行 48 小时', pair: 'USD/CHF', event: '2023-03-10', grade: 'B',
      start: '2023-02-01', end: '2023-04-28',
      description: '硅谷银行在 48 小时内倒闭，避险资金涌入瑞郎与黄金。',
      tagline: '存款保险保存款，不保你。',
      news: [
        { date: '2023-03-08', tag: '银行风波', title: 'Silvergate 宣布自愿清盘', body: '市场开始重新审视美国地区银行的资产负债表与存款稳定性。' },
        { date: '2023-03-10', tag: '倒闭', title: '硅谷银行被监管机构接管', body: '挤兑速度创下纪录，避险资金流向瑞郎、日元与黄金。' },
        { date: '2023-03-19', tag: '瑞信', title: '瑞银同意收购瑞信', body: '监管机构推动合并以避免系统性风险，市场情绪仍然脆弱。' }
      ]
    },
    {
      id: 'yen-carry-2024', title: '日元套息平仓', pair: 'USD/JPY', event: '2024-08-05', grade: 'A',
      start: '2024-07-01', end: '2024-09-30',
      description: '日本央行加息，美国就业数据走弱，日元套息交易集中平仓。',
      tagline: '借日元、买美元，然后日元涨了。',
      news: [
        { date: '2024-07-31', tag: '日本央行', title: '日本央行加息并缩减购债', body: '日元开始走强，套息交易的利差逻辑出现裂缝。' },
        { date: '2024-08-02', tag: '就业数据', title: '美国就业数据弱于预期', body: '市场押注美联储降息，美元走弱，日元空头开始撤退。' },
        { date: '2024-08-05', tag: '集中平仓', title: '日元套息交易剧烈去杠杆', body: '美元兑日元暴跌，风险资产同步承压，流动性在亚洲时段明显变薄。' }
      ]
    }
  ].sort((a, b) => a.event.localeCompare(b.event));

  const SIM_NEWS = [
    { tag: '通胀数据', title: '核心通胀高于预期', body: '利率路径被重新定价，美元短线走强。', volatility: 1.5, bias: { 'EUR/USD': -0.00045, 'GBP/USD': -0.00035, 'USD/JPY': 0.00038, 'USD/CHF': 0.0003, 'AUD/USD': -0.00042, 'USD/CAD': 0.00025 } },
    { tag: '就业数据', title: '新增就业明显降温', body: '紧缩预期降温，但各货币对的资金流向仍有分歧。', volatility: 1.35, bias: { 'EUR/USD': 0.00035, 'GBP/USD': 0.0003, 'USD/JPY': -0.00035, 'USD/CHF': -0.00025, 'AUD/USD': 0.00028, 'USD/CAD': -0.0002 } },
    { tag: '风险事件', title: '避险情绪突然升温', body: '股市与商品承压，避险货币获得买盘，流动性变薄。', volatility: 1.7, bias: { 'EUR/USD': -0.00025, 'GBP/USD': -0.00032, 'USD/JPY': -0.00022, 'USD/CHF': -0.00018, 'AUD/USD': -0.0005, 'USD/CAD': 0.0003 } },
    { tag: '央行讲话', title: '官员强调继续看数据', body: '市场同时听出了鹰派与鸽派，价格可能先冲高再回落。', volatility: 1.25, bias: {} },
    { tag: '能源市场', title: '能源价格快速反弹', body: '通胀与贸易条件预期变化，欧系与商品货币波动加大。', volatility: 1.45, bias: { 'EUR/USD': -0.00028, 'GBP/USD': -0.00016, 'AUD/USD': 0.0002, 'USD/CAD': -0.00034 } },
    { tag: '市场传闻', title: '大型资金调整月底仓位', body: '跨市场再平衡带来短时订单流，方向不一定延续。', volatility: 1.2, bias: {} },
    { tag: '数据修正', title: '前值被大幅上修', body: '市场重新评估增长前景，风险货币获得短暂支撑。', volatility: 1.3, bias: { 'AUD/USD': 0.0003, 'EUR/USD': 0.00018, 'USD/JPY': -0.0002 } },
    { tag: '流动性', title: '假期临近，成交变薄', body: '报价跳动放大，止损更容易被扫，追单风险上升。', volatility: 1.8, bias: {} },
    { tag: '央行突袭', title: '央行意外加息', body: '利差交易被重新定价，美元快速走强，非美货币承压。', volatility: 1.9, bias: { 'EUR/USD': -0.00055, 'GBP/USD': -0.0005, 'USD/JPY': 0.0005, 'USD/CHF': 0.00038, 'AUD/USD': -0.00048 } },
    { tag: '日本干预', title: '日本央行口头干预汇市', body: '美元/日元短线跳水，套息仓位开始松动。', volatility: 1.9, bias: { 'USD/JPY': -0.00065, 'EUR/JPY': -0.0004, 'GBP/JPY': -0.00045 } },
    { tag: '英国财政', title: '英国财政计划提前泄露', body: '市场担心赤字扩张，英镑与英国国债同时承压。', volatility: 1.6, bias: { 'GBP/USD': -0.00055, 'EUR/GBP': 0.00032 } },
    { tag: '地缘冲突', title: '海湾局势突然升级', body: '油价跳涨，避险货币获得买盘，商品货币分化。', volatility: 2.1, bias: { 'USD/CAD': -0.00045, 'USD/JPY': -0.0003, 'USD/CHF': -0.00032, 'AUD/USD': -0.0002 } },
    { tag: '亚洲数据', title: '亚洲出口数据超预期', body: '风险偏好回升，澳元领涨，日元走弱。', volatility: 1.4, bias: { 'AUD/USD': 0.00045, 'USD/JPY': 0.00025, 'EUR/USD': 0.00012 } },
    { tag: '美元流动性', title: '美元短端流动性突然收紧', body: '融资成本上升，所有美元对手盘波动放大。', volatility: 1.65, bias: { 'EUR/USD': -0.0002, 'GBP/USD': -0.00018, 'USD/JPY': 0.00025, 'USD/CHF': 0.0002, 'AUD/USD': -0.0003 } },
    { id: 'strait-1', tag: '航运', tone: 'breaking', title: '某海峡货轮搁浅，航道只剩一条', body: '油轮开始排队，航运保险报价翻倍，市场先交易“供应中断”。', quote: '船长：我只是想省点油。', volatility: 1.8, bias: { 'EUR/USD': -0.0002, 'AUD/USD': -0.00025, 'USD/CAD': -0.0003, 'USD/JPY': -0.0002, 'USD/CHF': 0.0002 }, followUp: 'strait-2' },
    { id: 'strait-2', tag: '后续', tone: 'breaking', chainOnly: true, title: '航运保险暴涨，绕行好望角', body: '船公司宣布改道，运费上涨，交付延迟，交易员开始买避险货币。', quote: '货主：我的货还在海上，钱已经到对岸了。', volatility: 2.0, bias: { 'AUD/USD': -0.00035, 'USD/CAD': -0.0004, 'EUR/USD': -0.00025, 'USD/JPY': -0.00025, 'USD/CHF': 0.0003 }, followUp: 'strait-3' },
    { id: 'strait-3', tag: '后续', tone: 'neutral', chainOnly: true, title: '航道恢复，但运费没降', body: '船是通了，价格没回去。航运公司说这叫“新常态”。', quote: '分析师：供应链有韧性，直到它断了。', volatility: 1.5, bias: { 'USD/CAD': 0.0002, 'AUD/USD': 0.0001 } },
    { id: 'strait-4', tag: '黑天鹅', tone: 'rare', rare: true, title: '某海峡全面封锁', body: '所有船舶暂停通行，油价跳涨，全球风险资产同步下跌。', quote: '交易员：我只是想赚点房租，不是想参与地缘政治。', volatility: 2.6, bias: { 'EUR/USD': -0.0005, 'GBP/USD': -0.0004, 'AUD/USD': -0.0006, 'USD/JPY': -0.0004, 'USD/CHF': 0.0004 } },
    { id: 'trade-1', tag: '贸易战', tone: 'breaking', title: '贸易战：新一轮关税清单公布', body: '清单很长，市场只看了第一页就开始卖出风险货币。', quote: '分析师：关税是谈判工具。市场：先跌为敬。', volatility: 1.8, bias: { 'AUD/USD': -0.0004, 'EUR/USD': -0.0003, 'GBP/USD': -0.00025, 'USD/CHF': 0.00025 }, followUp: 'trade-2' },
    { id: 'trade-2', tag: '后续', tone: 'breaking', chainOnly: true, title: '对方反制：农产品和飞机中枪', body: '谈判代表说“建设性”，市场听到的是“继续加”。', quote: '农民：我种的不是大豆，是波动率。', volatility: 1.95, bias: { 'AUD/USD': -0.00045, 'EUR/USD': -0.00025, 'USD/CAD': 0.0002 }, followUp: 'trade-3' },
    { id: 'trade-3', tag: '后续', tone: 'neutral', chainOnly: true, title: '谈判重启，但先加税', body: '双方同意“继续沟通”，同时把下一轮关税生效日提前。', quote: '市场：这集我看过。', volatility: 1.6, bias: { 'AUD/USD': 0.0002, 'EUR/USD': 0.00015 } },
    { id: 'virus-1', tag: '疫情', tone: 'breaking', title: '疫情：新变种被命名为“奥密克戎 2.0”', body: '传播速度更快，市场先卖出航空、旅游和商品货币。', quote: '病毒：我只是想优化一下传播效率。', volatility: 1.7, bias: { 'AUD/USD': -0.0003, 'EUR/USD': -0.0002, 'USD/JPY': -0.00025, 'USD/CHF': 0.0002 }, followUp: 'virus-2' },
    { id: 'virus-2', tag: '后续', tone: 'breaking', chainOnly: true, title: '多国重新收紧入境', body: '机场排起长队，航空公司取消航班，避险买盘回归。', quote: '旅客：我上一次隔离的行李还没拆。', volatility: 1.9, bias: { 'AUD/USD': -0.00035, 'EUR/USD': -0.00025, 'USD/JPY': -0.0003, 'USD/CHF': 0.0003 }, followUp: 'virus-3' },
    { id: 'virus-3', tag: '后续', tone: 'neutral', chainOnly: true, title: '疫苗更新，市场先涨为敬', body: '有效率数据不错，但市场只关心副作用和产能。', quote: '药企：这次真的有效。市场：上次也这么说。', volatility: 1.5, bias: { 'AUD/USD': 0.00025, 'EUR/USD': 0.0002, 'USD/JPY': 0.00015 } },
    { id: 'virus-4', tag: '黑天鹅', tone: 'rare', rare: true, title: '某地全面封锁，港口停摆', body: '供应链再次被按下暂停键，油价和运费一起上涨。', quote: '交易员：我已经分不清这是第几波了。', volatility: 2.4, bias: { 'AUD/USD': -0.00045, 'EUR/USD': -0.0003, 'USD/CAD': -0.0003, 'USD/CHF': 0.00035 } },
    { id: 'oil-1', tag: '能源', tone: 'breaking', title: 'OPEC+ 突然宣布减产', body: '油价跳涨，能源进口国货币承压，商品货币先涨后跌。', quote: '产油国：我们只是维护市场稳定。', volatility: 1.9, bias: { 'USD/CAD': -0.00045, 'USD/JPY': 0.0002, 'AUD/USD': 0.00015 }, followUp: 'oil-2' },
    { id: 'oil-2', tag: '后续', tone: 'breaking', chainOnly: true, title: '油价跳涨，航空公司先哭', body: '燃油对冲不足的航空公司开始削减航班，通胀预期抬头。', quote: '航空公司：机票价格已经尽力了。', volatility: 1.8, bias: { 'USD/CAD': -0.0003, 'EUR/USD': -0.0002, 'USD/JPY': 0.0002 } },
    { id: 'supply-1', tag: '供应链', tone: 'meme', title: '港口排队 40 艘船，货架开始变空', body: '零售商说库存充足，但仓库里只有空气和标签。', quote: '供应链经理：我们在优化，优化掉了货。', volatility: 1.6, bias: { 'AUD/USD': -0.0002, 'EUR/USD': -0.00015, 'USD/CAD': -0.00015 } },
    { id: 'chip-1', tag: '芯片', tone: 'meme', title: '芯片厂停电三小时，全球缺货三个月', body: '汽车厂减产，手机厂延期，交易员开始交易“缺货预期”。', quote: '芯片：我只是跳了个闸。', volatility: 1.7, bias: { 'AUD/USD': -0.0002, 'USD/JPY': -0.00015, 'USD/CHF': 0.00015 } },
    { id: 'war-1', tag: '地缘', tone: 'breaking', title: '边境演习升级，双方互相喊话', body: '市场先买入避险资产，再问“这次是真的吗”。', quote: '分析师：局势可控。市场：你上次也这么说。', volatility: 2.0, bias: { 'EUR/USD': -0.0003, 'AUD/USD': -0.00035, 'USD/JPY': -0.0003, 'USD/CHF': 0.0003 }, followUp: 'war-2' },
    { id: 'war-2', tag: '后续', tone: 'neutral', chainOnly: true, title: '停火传闻出现，风险资产反弹', body: '消息源是“接近谈判的人”，市场先信了半小时。', quote: '交易员：先买，再核实。', volatility: 1.9, bias: { 'EUR/USD': 0.00025, 'AUD/USD': 0.0003, 'USD/CHF': -0.0002, 'USD/JPY': 0.0002 } },
    { id: 'sanction-1', tag: '制裁', tone: 'breaking', title: '某银行被移出结算系统', body: '跨境支付开始绕路，企业紧急换汇，流动性变薄。', quote: '银行：我们只是系统升级。市场：升级到哪？', volatility: 2.2, bias: { 'EUR/USD': -0.0003, 'GBP/USD': -0.0002, 'USD/CHF': 0.0003, 'USD/JPY': -0.00015 } },
    { id: 'cyber-1', tag: '网络', tone: 'meme', title: '交易所被钓鱼邮件骗走一笔保证金', body: '客服说“请放心”，然后发来一个新的充值链接。', quote: '交易员：这次链接看着比上次真。', volatility: 1.8, bias: { 'EUR/USD': -0.00015, 'AUD/USD': -0.0002 } },
    { id: 'weather-1', tag: '天气', tone: 'meme', title: '台风关闭港口，物流公司开始背课文', body: '“不可抗力”四个字，今天已经被用了 80 次。', quote: '货代：船在等风，我在等你打款。', volatility: 1.6, bias: { 'AUD/USD': -0.00015, 'USD/CAD': -0.0002 } },
    { id: 'food-1', tag: '粮食', tone: 'breaking', title: '粮食出口禁令，食品通胀抬头', body: '小麦期货先涨，进口国货币承压，央行开始头疼。', quote: '面包店：面粉涨价，爱情也涨价。', volatility: 1.7, bias: { 'AUD/USD': 0.00015, 'EUR/USD': -0.00015, 'USD/CAD': -0.00015 } },
    { id: 'election-1', tag: '选举', tone: 'meme', title: '大选结果难产，市场开始数票', body: '两边都宣布胜利，交易员开始交易“谁先认输”。', quote: '分析师：不确定性上升。市场：这词能不能换一个。', volatility: 1.5, bias: {} },
    { id: 'expert-1', tag: '专家建议', tone: 'meme', title: '专家：年轻人可以把闲置资金拿来炒汇', body: '专家称，只要控制杠杆，风险完全可控，还能锻炼心态。', quote: '网友：你先控制一下自己。', volatility: 1.35, bias: { 'EUR/USD': 0.00012, 'GBP/USD': 0.0001 }, followUp: 'expert-2' },
    { id: 'expert-2', tag: '后续', tone: 'meme', chainOnly: true, title: '专家被骂到关闭评论区', body: '专家表示，自己只是建议，不构成投资建议，也不构成人生建议。', quote: '专家：我也在扛单。', volatility: 1.45, bias: { 'EUR/USD': -0.0001 }, followUp: 'expert-3' },
    { id: 'expert-3', tag: '后续', tone: 'meme', chainOnly: true, title: '专家删号，市场情绪暂时稳定', body: '没人再给建议了。交易员突然有点不习惯。', quote: '群友：老师只是去马尔代夫考察。', volatility: 1.15, bias: {} },
    { id: 'guru-1', tag: '财经大V', tone: 'meme', title: '大V：满仓干，这次不一样', body: '大V在直播里拍桌子，背景是一辆借来的保时捷。', quote: '大V：我早说了，只是没说方向。', volatility: 1.55, bias: { 'AUD/USD': 0.00025, 'EUR/USD': 0.0002 }, followUp: 'guru-2' },
    { id: 'guru-2', tag: '后续', tone: 'meme', chainOnly: true, title: '大V删号，群友开始维权', body: '群公告改成「老师去度假了」，群主同时注销了三个号。', quote: '群友：度假为什么要换手机号？', volatility: 1.6, bias: { 'AUD/USD': -0.0002 }, followUp: 'guru-3' },
    { id: 'guru-3', tag: '后续', tone: 'meme', chainOnly: true, title: '群友：老师只是去度假了', body: '维权群改名为「老师全球粉丝后援会」，气氛重新热烈。', quote: '群友：这次一定。', volatility: 1.2, bias: {} },
    { id: 'landlord-1', kind: 'flavor', tag: '生活', tone: 'meme', title: '房东：在吗', body: '你盯着 K 线，房东盯着你。', quote: '你：在，但不在家。', volatility: 1.1, bias: {}, followUp: 'landlord-2' },
    { id: 'landlord-2', kind: 'flavor', tag: '后续', tone: 'meme', chainOnly: true, title: '房东：我换锁了', body: '你问能不能再宽限三天，房东问你杠杆多少倍。', quote: '房东：你这仓位，住天桥也够大。', volatility: 1.2, bias: {}, followUp: 'landlord-3' },
    { id: 'landlord-3', kind: 'flavor', tag: '后续', tone: 'meme', chainOnly: true, title: '房东把房子挂到了短租平台', body: '标题：安静小区，适合盯盘，租客情绪稳定。', quote: '你：那是我。', volatility: 1.05, bias: {} },
    { id: 'cafe-1', kind: 'flavor', tag: '交易所', tone: 'meme', title: '交易所咖啡机坏了', body: '交易员集体下楼买咖啡，流动性骤降，点差扩大。', quote: '交易员：难怪今天滑点这么大。', volatility: 1.45, bias: { 'EUR/USD': -0.00012, 'GBP/USD': -0.0001 }, followUp: 'cafe-2' },
    { id: 'cafe-2', kind: 'flavor', tag: '后续', tone: 'meme', chainOnly: true, title: '咖啡机修好，流动性恢复', body: '交易员回到工位，第一件事是平掉刚才接的飞刀。', quote: '咖啡机：我只是想休息一下。', volatility: 1.2, bias: { 'EUR/USD': 0.00008 } },
    { id: 'analyst-1', tag: '研报', tone: 'meme', title: '分析师：这次不一样', body: '研报把目标价上调 300%，风险提示写在第 47 页。', quote: '分析师：涨了是逻辑兑现，跌了是市场非理性。', volatility: 1.5, bias: { 'USD/JPY': 0.00025, 'AUD/USD': 0.0002 } },
    { id: 'macro-1', tag: '宏观', tone: 'meme', title: '经济学家预测了过去五次衰退中的七次', body: '准确率不重要，重要的是每次都很自信。', quote: '经济学家：这次衰退一定会来，具体哪年不确定。', volatility: 1.3, bias: {} },
    { id: 'takeout-1', kind: 'flavor', tag: '生活', tone: 'meme', title: '外卖备注：不要打电话，我在扛单', body: '骑手把餐挂在门把手上，并在备注里回了一个「保重」。', quote: '骑手：兄弟，止损了吗？', volatility: 1.1, bias: {} },
    { id: 'doctor-1', kind: 'flavor', tag: '体检', tone: 'meme', title: '体检报告：建议减少杠杆', body: '医生说你最近波动率偏高，血压也是。', quote: '医生：先平仓，再复查。', volatility: 1.2, bias: {} },
    { id: 'flavor-ppt', kind: 'flavor', tag: '整活', tone: 'meme', title: '券商晨会 PPT 放错页，研究员开始讲旅游', body: '台下没人提醒，大家认真记了三页酒店推荐。', quote: '研究员：这条线路的赔率不错。' },
    { id: 'flavor-cat', kind: 'flavor', tag: '整活', tone: 'meme', title: '基金经理的猫踩到键盘，组合意外清仓', body: '猫没有接受采访，基金公司表示“风控正常”。', quote: '猫：我只是想关掉弹窗。' },
    { id: 'flavor-stop-phone', kind: 'flavor', tag: '整活', tone: 'meme', title: '交易员把止损设在手机壳后面', body: '手机壳表示压力很大，但暂时没有表态。', quote: '交易员：这样比较有安全感。' },
    { id: 'flavor-subway', kind: 'flavor', tag: '整活', tone: 'meme', title: '地铁上有人看 K 线坐过站', body: '他抬头时已经在终点站，账户还在半山腰。', quote: '广播：本次列车已到达“回本”。' },
    { id: 'flavor-date', kind: 'flavor', tag: '整活', tone: 'meme', title: '相亲对象：你做外汇？能帮我还房贷吗', body: '你说可以，但要看杠杆。她问杠杆是不是一种理财产品。', quote: '介绍人：你们聊得挺投机。' },
    { id: 'flavor-temple', kind: 'flavor', tag: '整活', tone: 'meme', title: '交易员去寺庙求签，签文写着“不要加杠杆”', body: '他拍照发群，群友说这是空头陷阱。', quote: '大师：我只负责解签，不负责解套。' },
    { id: 'flavor-team', kind: 'flavor', tag: '整活', tone: 'meme', title: '公司团建安排在交易所楼下，员工集体沉默', body: 'HR 说这是“沉浸式行业参访”，大家说想回家。', quote: 'HR：这次团建不强制交易。' },
    { id: 'flavor-anchor', kind: 'flavor', tag: '整活', tone: 'meme', title: '财经主播把“买入”说成了“外卖”', body: '观众问在哪下单，主播说“先点关注”。', quote: '导播：这段剪掉。' },
    { id: 'flavor-tarot', kind: 'flavor', tag: '整活', tone: 'meme', title: '交易员用塔罗牌判断非农', body: '抽到“倒吊人”，他决定做空，然后被行情倒吊。', quote: '塔罗牌：我早就说了。' },
    { id: 'flavor-trainer', kind: 'flavor', tag: '整活', tone: 'meme', title: '健身房教练建议先练心态，再练胸肌', body: '他说你卧推很稳，但持仓一点都不稳。', quote: '教练：核心收紧，止损也收紧。' },
    { id: 'flavor-code', kind: 'flavor', tag: '整活', tone: 'meme', title: '程序员把止损价写成了 0.0001', body: '上线三分钟后，全公司都知道了什么叫“精确止损”。', quote: '产品经理：这个需求不是这样理解的。' },
    { id: 'flavor-noodles', kind: 'flavor', tag: '整活', tone: 'meme', title: '交易所前台收到一箱泡面', body: '没有寄件人，箱子上写着“给夜盘交易员补补”。', quote: '前台：我们这里不能收食物。' },
    { id: 'flavor-fortune', kind: 'flavor', tag: '整活', tone: 'meme', title: '算命先生说今天不宜做空', body: '你问他那做多呢，他说“也不宜”。', quote: '先生：今天适合空仓。' },
    { id: 'flavor-group-photo', kind: 'flavor', tag: '整活', tone: 'meme', title: '群友把模拟盘截图发朋友圈，配文“今天又赚了”', body: '评论区都在问带不带，只有你知道他开的是模拟。', quote: '群友：模拟也是实力的一部分。' },
    { id: 'flavor-nfp', kind: 'flavor', tag: '整活', tone: 'meme', title: '外卖小哥问今天是不是非农', body: '你说不是，他说那为什么整栋楼都没人接电话。', quote: '小哥：那我放门口了，祝你们今晚顺利。' },
    { id: 'cb-1', tag: '央行', tone: 'breaking', title: '央行行长打了个喷嚏', body: '市场解读为鹰派信号，美元短线走强。', quote: '央行：我只是感冒。', volatility: 1.7, bias: { 'EUR/USD': -0.0003, 'GBP/USD': -0.00025, 'USD/JPY': 0.0003 } },
    { id: 'japan-1', tag: '日本', tone: 'breaking', title: '日本央行：密切关注汇市', body: '市场：你上次也这么说。日本央行：这次真的。', quote: '日元：我先跌为敬。', volatility: 1.8, bias: { 'USD/JPY': -0.00045 } },
    { id: 'uk-1', tag: '英国', tone: 'breaking', title: '英国财政：我们有一份减税计划', body: '市场：你确定？英镑先跌为敬。', quote: '英国国债：别看我。', volatility: 1.65, bias: { 'GBP/USD': -0.0004 } },
    { id: 'chf-1', tag: '黑天鹅', tone: 'rare', rare: true, title: '瑞郎：我脱钩了', body: '某央行突然取消汇率下限，所有报价瞬间失效。', quote: '交易员：我裂开了。', volatility: 2.4, bias: { 'USD/CHF': -0.0012, 'EUR/CHF': -0.001 } },
    { id: 'blackout-1', tag: '黑天鹅', tone: 'rare', rare: true, title: '某交易所：系统维护，五分钟', body: '五分钟后，所有挂单消失，客服电话开始排队。', quote: '交易所：请相信我们。', volatility: 2.2, bias: {} },
    { id: 'break-eurusd', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '欧盟紧急会议：对美关税反制', body: '会议还没结束，欧元已经先跌了。', quote: '欧盟：我们不想打，但也不怕打。市场：那到底打不打？', volatility: 2.8, bias: { 'EUR/USD': -0.0009, 'GBP/USD': -0.0003, 'USD/CHF': 0.0003 } },
    { id: 'break-usdjpy', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '日本央行紧急发布会', body: '行长说“正在关注”，交易员已经开始平仓。', quote: '日元：我先走一步。', volatility: 2.8, bias: { 'USD/JPY': -0.00085, 'AUD/USD': -0.0002 } },
    { id: 'break-gbpusd', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '英国首相紧急讲话', body: '讲话内容还没公布，英镑先跌为敬。', quote: '英镑：你们先聊，我下去看看。', volatility: 2.7, bias: { 'GBP/USD': -0.00085, 'USD/CHF': 0.00025 } },
    { id: 'break-usdchf', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '瑞士央行紧急声明', body: '声明只有两句话，市场读出了三种意思。', quote: '瑞郎：我什么都没说。', volatility: 2.7, bias: { 'USD/CHF': 0.00075, 'EUR/CHF': 0.0005 } },
    { id: 'break-audusd', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '澳洲央行紧急加息', body: '加息幅度超预期，澳元短线跳涨，随后开始回吐。', quote: '澳洲央行：我们也没想到。', volatility: 2.7, bias: { 'AUD/USD': 0.0008, 'EUR/USD': 0.0002 } },
    { id: 'break-usdcad', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '加拿大能源出口突然中断', body: '油管压力异常，加元先涨后跌，油价跳涨。', quote: '加拿大：我们只是关了个阀门。', volatility: 2.7, bias: { 'USD/CAD': -0.00075, 'USD/JPY': 0.0002 } },
    { id: 'break-eurchf', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '欧洲银行流动性事件', body: '一家银行被传“暂时无法提款”，欧系货币集体承压。', quote: '银行：只是系统升级。市场：第几次了？', volatility: 2.9, bias: { 'EUR/CHF': -0.0008, 'EUR/USD': -0.0004, 'USD/CHF': 0.0004 } },
    { id: 'break-global', kind: 'breaking', tag: '突发', tone: 'breaking', duration: 9, title: '某海峡突发封锁，油轮开始掉头', body: '所有船舶暂停通行，油价跳涨，避险资产获得买盘。', quote: '交易员：这次是真的，还是又一次“演习”？', volatility: 3.0, bias: { 'EUR/USD': -0.0005, 'GBP/USD': -0.0004, 'AUD/USD': -0.0006, 'USD/JPY': -0.0004, 'USD/CHF': 0.0005, 'USD/CAD': -0.0003 } }
  ];

  const TUTORIAL = [
    { icon: '↗', title: '先选方向：做多还是做空', text: '做多赌涨，做空赌跌。选好货币对，点「做多 / 买入」或「做空 / 卖出」。平仓时，价格高于开仓价，多单赚；低于开仓价，空单赚。', example: '例：EUR/USD 从 1.0800 涨到 1.0900，做多方向有利。' },
    { icon: '$', title: '保证金和杠杆', text: '保证金是你先押的钱；杠杆放大名义仓位，也放大盈亏和手续费。杠杆越高，同样的保证金能扛住的波动越小。', example: '例：$500 保证金 × 20 倍 = $10,000 名义仓位，手续费约 $1.50。' },
    { icon: '×', title: '风险：60% 提醒，80% 爆仓', text: '浮亏达到保证金 60% 会提醒，80% 会强制平仓。跳空时亏损可能超过保证金。新手可以先设止损，或者用部分平仓减仓。', example: '例：20 倍杠杆下，价格反向约 4% 就会触及爆仓线。' },
    { icon: '■', title: '收手：唯一的赢法', text: '盈利时离开，或者至少别再借钱。屏幕上没有安全网，只有你自己按下的退出键。', example: '例：在峰值附近点「收手离场」，比爆仓后再截图体面。' }
  ];

  const ACHIEVEMENTS = [
    { id: 'air-trapeze', name: '空中飞人（晚期）', desc: '账户权益比初始资金多出 $100,000。', hint: '让权益比 $10,000 高出十万' },
    { id: 'buy-top', name: '精准接盘', desc: '在近 40 根 K 线的最高点附近开多。', hint: '在近期最高价 0.2% 范围内做多' },
    { id: 'finger-support', name: '手指支撑线', desc: '借款补仓救过的仓位，最后还是爆了。', hint: '借款补仓后仍被强制平仓' },
    { id: 'never-sell', name: '不卖就不算亏', desc: '单笔仓位持续浮亏仍不平仓（模拟 3 分钟 / 回放 15 个交易日）。', hint: '长时间抱着亏损单不撒手' },
    { id: 'just-kill-me', name: '杀就杀吧', desc: '风险提醒里选了「暂不处理」，随后爆仓。', hint: '拒绝补仓，直到爆仓' },
    { id: 'black-swan', name: '亲历黑天鹅', desc: '在瑞郎脱钩战役里推进到 2015-01-15。', hint: '推进瑞郎脱钩战役到事件日' },
    { id: 'first-blowup', name: '初诊：爆仓', desc: '第一次被强制平仓。欢迎建档。', hint: '经历一次爆仓' },
    { id: 'sorry-family', name: '最对不起的就是家人', desc: '贷款本金达到 $100,000。', hint: '一次性借入十万' },
    { id: 'sure-win', name: '我有必胜法', desc: '账户权益比初始资金多出 $1,000,000。', hint: '收益达到一百万' },
    { id: 'honest-work', name: '老实赚钱，很枯燥吧', desc: '完成第一次盈利平仓。', hint: '盈利平仓一次' },
    { id: 'freefall', name: '自由落体', desc: '账户权益比初始资金少了 $100,000。', hint: '权益比 $10,000 低十万' },
    { id: 'retire', name: '金盆洗手', desc: '完成一次每日挑战并结算成绩。', hint: '开始并结束一次挑战' },
    { id: 'last-word', name: '最后一次', desc: '第 10 次按下「最后一把，回本就走」。', hint: '把「最后一次」按满十次' }
  ];

  const LOAN_MAX = 200000;
  const loanDailyRate = amount => amount <= 10000 ? 0.0001 : amount <= 50000 ? 0.0002 : amount <= 100000 ? 0.0003 : 0.0004;
  const tradeFee = (margin, leverage) => margin * leverage * (0.00005 + leverage * 0.000005);

  const money = n => `${n < 0 ? '-' : ''}$${Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const signedMoney = n => `${n >= 0 ? '+' : '-'}$${Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = n => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
  const priceText = (pair, n) => {
    const def = PAIRS.find(p => p.id === pair);
    return def && Number.isFinite(n) ? n.toFixed(def.digits) : '—';
  };
  const rateText = rate => `${(rate * 100).toFixed(2)}%`;

  const GLOSSARY = {
    '账户总权益': { def: '你在这个账户里真正拥有的钱：可用余额 + 已用保证金 + 浮动盈亏 − 待还贷款。', example: '权益 $10,000，不代表可用余额也是 $10,000；开仓后有一部分被锁住了。' },
    '总权益': { def: '账户总权益的简称，算法同上。', example: '平仓后浮盈落袋，权益才会真正变化。' },
    '可用余额': { def: '没有被仓位锁住、可以拿去开新仓或还款的钱。', example: '开仓 $500 后，可用余额会减少 $500 左右。' },
    '浮动盈亏': { def: '持仓还没平仓时账面上的盈亏，会随价格变化；平仓后才真正落袋。', example: '浮盈 +$20 不等于已经赚到 $20。' },
    '浮盈': { def: '持仓还没平仓时的账面盈利，可能回吐。', example: '浮盈 +$20 平仓后才变成现金。' },
    '浮亏': { def: '持仓还没平仓时的账面亏损，可能继续扩大。', example: '浮亏达到保证金 80% 会强制平仓。' },
    '已用保证金': { def: '锁在持仓里的保证金；平仓后会释放回可用余额。', example: '保证金 $500，已用保证金就是 $500。' },
    '待还贷款': { def: '欠肥鱼信贷的本金加利息，会从账户权益里扣。', example: '借 $1,000，过几天待还就会大于 $1,000。' },
    '保证金': { def: '开仓时先押在仓位里的钱。它不是手续费；平仓后会回来，亏损会从里面扣。', example: '保证金 $500、20 倍杠杆，名义仓位是 $10,000。' },
    '杠杆': { def: '放大仓位的倍数。10 倍就是 1 块钱保证金控制 10 块钱仓位，涨跌和亏损也放大 10 倍。', example: '$100 保证金 × 10 倍 = $1,000 名义仓位。' },
    '名义仓位': { def: '你实际暴露在行情里的仓位大小，等于保证金 × 杠杆；盈亏按它算。', example: '$500 × 20 倍 = $10,000 名义仓位。' },
    '仓位': { def: '你持有的交易规模。游戏里通常指名义仓位；空仓就是没有持仓。', example: '$1,000 仓位涨 1%，盈亏大约是 $10。' },
    '做多': { def: '赌价格涨。价格涨就赚，价格跌就亏。', example: 'EUR/USD 做多，欧元升值时盈利。' },
    '做空': { def: '赌价格跌。价格跌就赚，价格涨就亏。', example: 'EUR/USD 做空，欧元贬值时盈利。' },
    '开仓价': { def: '建仓时的价格，之后的盈亏和爆仓线都从这里算。', example: '开仓价 1.0800，现价 1.0900，多单赚约 0.93%。' },
    '开仓价格': { def: '建仓时的价格，之后的盈亏和爆仓线都从这里算。', example: '开仓价 1.0800，现价 1.0900，多单赚约 0.93%。' },
    '当前价': { def: '最新行情价格。持仓行里的“现价距爆仓”就是按它算的。', example: '当前价离爆仓价越近，越危险。' },
    '当前价格': { def: '最新行情价格。持仓行里的“现价距爆仓”就是按它算的。', example: '当前价离爆仓价越近，越危险。' },
    '平仓': { def: '把仓位卖掉或买回，结算盈亏并释放保证金。', example: '平仓后浮动盈亏变成现金盈亏。' },
    '部分平仓': { def: '只平掉一部分仓位，剩下的继续跑；当前风险比例不会因为平掉一半就自动下降。', example: '保证金 $500 平掉一半，剩 $250 继续跑。' },
    '止损': { def: '提前设置一个认亏价，价格到了自动平仓，防止亏更多；跳空时成交价可能比止损价更差。', example: '多单 1.0800，止损 1.0700，跌到附近自动平仓。' },
    '止盈': { def: '提前设置一个满意价，价格到了自动平仓，把利润落袋。', example: '多单 1.0800，止盈 1.1000，涨到附近自动平仓。' },
    '进阶交易': { def: '设置里的开关，打开后下单可以填止损价和止盈价；默认关闭。', example: '第一次玩可以先不开，熟悉杠杆后再用。' },
    '爆仓价': { def: '按当前保证金和仓位算出的、亏损达到保证金 80% 的价格；补保证金会让它移动。', example: '20 倍杠杆，反向约 4% 就是爆仓价。' },
    '爆仓': { def: '亏损达到保证金 80% 时被系统强制平仓。不是归零，但可能穿仓。', example: '保证金 $500，亏掉约 $400 就可能爆仓。' },
    '强制平仓': { def: '系统在风险过高时替你平仓，通常发生在亏损达到保证金 80% 时。', example: '爆仓就是强制平仓的一种。' },
    '风险度': { def: '浮亏占保证金的比例。60% 弹提醒，80% 强制平仓。', example: '保证金 $500，浮亏 $300，风险度约 60%。' },
    '风险比例': { def: '浮亏占保证金的比例。60% 弹提醒，80% 强制平仓。', example: '保证金 $500，浮亏 $300，风险度约 60%。' },
    '手续费': { def: '开仓时按名义仓位和杠杆收一次；平仓不再收。', example: '$1,000 仓位、10 倍，手续费约 $0.10。' },
    '追加保证金': { def: '从可用余额拿钱补进仓位，降低风险比例；不是加仓。', example: '补 $100 后，爆仓线会往远处移动。' },
    '借款补仓': { def: '向肥鱼信贷借钱补保证金；会增加待还贷款和每天利息。', example: '借款补仓后，仓位更安全，但欠款更多。' },
    '穿仓': { def: '亏损超过保证金，账户出现负余额。跳空时可能发生。', example: '保证金 $500，跳空亏 $700，账户就穿仓 $200。' },
    '峰值': { def: '本局账户权益达到过的最高点，用来计算回撤。', example: '峰值 $10,500，现在 $10,000，回撤 $500。' },
    '回撤': { def: '从本局峰值掉下来多少；不是手续费，也不代表一定亏了本金。', example: '峰值 $10,500，现在 $10,000，回撤 $500。' },
    '最后一次': { def: '标准模式下亏损平仓后的复仇按钮；安全网没有。点一次计数 +1。', example: '第 10 次点“最后一把”，会确诊“最后一次”。' },
    '日利率': { def: '贷款每天按这个比例生利息；模拟数据每 30 秒算一天。', example: '借 $1,000，日利率 0.02%，一天利息约 $0.20。' },
    '跳空': { def: '价格直接跳过某个价位，止损或爆仓可能按更差的价格成交。', example: '止损 1.0800，跳空开盘 1.0700，只能按更差的价走。' },
    '安全网': { def: '新手难度：最高 20 倍杠杆、不开放贷款、不出现“最后一次”。', example: '第一次玩建议先选安全网。' },
    '空中飞人线': { def: '触发「空中飞人」结局所需的负债门槛。交易越多、正收益越高，这条线越高。', example: '刚开局约 $5,000；打过几笔、赚到钱之后，门槛会往上抬。' },
    '诊断': { def: '结算时按你的行为给的黑喜剧标签，不参与交易计算。', example: '“暂时清醒”“回撤幻觉型”都是诊断。' }
  };

  const CONTRACTS = [
    {
      id: 'free', kicker: 'NO CONTRACT', title: '自由模式', tone: 'free',
      background: '不签合同，也没有目标。\n想开几笔开几笔，想什么时候走就什么时候走。',
      goalText: '没有目标，玩到你想收手。', limitText: '不限交易次数',
      specialText: '安全网 / 标准、贷款规则照旧。', goalType: 'free', events: []
    },
    {
      id: 'rent', kicker: 'CONTRACT 01', title: '这个月房租', tone: 'rent',
      background: '房东在群里发了第三次「在吗」。\n工资还有 9 天到账，房租还差 $800。\n这时你看到一条广告：\n「在家做外汇，一天赚回房租。」',
      goalText: '净赚 $800 后收手。', limitText: '最多 5 笔交易',
      specialText: '本合同不开放借款。', goalType: 'profit', targetProfit: 800, maxTrades: 5, noLoans: true,
      events: [
        {
          id: 'rent-1', at: 1, title: '房东第三次「在吗」',
          text: '房东在群里 @ 了你。\n「小伙子，这个月什么时候方便？」',
          choices: [
            { label: '先转 $200', cash: -200, flag: 'paidLandlord', note: '房东收下 $200，说剩下的月底前。' },
            { label: '已读不回', cash: 0, flag: 'ignoredLandlord', note: '你把群设成了免打扰。' }
          ]
        },
        {
          id: 'rent-2', at: 3, title: '朋友结婚，随礼 $500',
          text: '大学室友发来请柬。\n你去，这个月更紧；不去，朋友可能觉得你变了。',
          choices: [
            { label: '去，随 $500', cash: -500, flag: 'wentWedding', note: '你去了，笑得很体面。' },
            { label: '不去', cash: 0, flag: 'skippedWedding', note: '朋友说没事，然后没再说话。' }
          ]
        },
        {
          id: 'rent-3', at: 5, title: '工资还没到账',
          text: '财务说流程卡住了。\n房东的消息又亮了一次。',
          choices: [
            { label: '刷信用卡', cash: 300, debt: 300, rate: 0.0001, flag: 'cardDebt', note: '你刷了 $300，账单下个月见。' },
            { label: '吃泡面', cash: 0, flag: 'frugal', note: '你连吃三天泡面，至少没借钱。' }
          ]
        }
      ]
    },
    {
      id: 'debt', kicker: 'CONTRACT 02', title: '还清肥鱼信贷', tone: 'debt',
      background: '你已经在肥鱼信贷借了 $3,000。\n今天不还，明天利息翻倍。\n你看了看账户里最后 $10,000，\n决定「翻本就走」。',
      goalText: '还清 $3,000 贷款，并让权益达到 $8,000。', limitText: '最多 10 笔交易',
      specialText: '初始负债 $3,000；不开放新增借款。', goalType: 'debt', startDebt: 3000, targetEquity: 8000, maxTrades: 10, noLoans: true,
      events: [
        {
          id: 'debt-1', at: 2, title: '最后提醒',
          text: '肥鱼信贷发来一条消息：\n「今天不还，明天利率上浮。」',
          choices: [
            { label: '先还 $300', cash: -300, debt: -300, flag: 'paidEarly', note: '你还了 $300，催收安静了一会儿。' },
            { label: '再展期一次', rate: 0.0001, flag: 'extendedLoan', note: '你选择了展期，利息又高了一点。' }
          ]
        },
        {
          id: 'debt-2', at: 4, title: '家人来电',
          text: '妈妈问你最近是不是缺钱。\n她说：「别硬撑。」',
          choices: [
            { label: '说实话', cash: 500, flag: 'toldFamily', note: '妈妈转来 $500，说别饿着。' },
            { label: '说挺好', cash: 0, flag: 'hidDebt', note: '你说挺好的，然后挂了电话。' }
          ]
        },
        {
          id: 'debt-3', at: 6, title: '卖点东西',
          text: '二手平台有人问你那台游戏机。\n「还在吗？」',
          choices: [
            { label: '卖掉游戏机', cash: 300, flag: 'soldConsole', note: '你卖了游戏机，房间空了一块。' },
            { label: '不卖', cash: 0, flag: 'keptConsole', note: '你说再等等，虽然也不知道在等什么。' }
          ]
        }
      ]
    },
    {
      id: 'layoff', kicker: 'CONTRACT 03', title: '被裁员的第 30 天', tone: 'layoff',
      background: 'HR 说「公司感谢你的贡献」。\n你算了算，赔偿金只够交两个月房租。\n招聘软件上全是已读不回。\n你决定先赚 $3,000 过渡费。\n你告诉自己：找到工作就收手。',
      goalText: '净赚 $3,000 后收手。', limitText: '最多 8 笔交易',
      specialText: '初始现金 $6,000；不开放借款。', goalType: 'profit', startCash: 6000, targetProfit: 3000, maxTrades: 8, noLoans: true,
      events: [
        {
          id: 'layoff-1', at: 1, title: 'HR 约谈',
          text: 'HR 把一份协议推过来。\n「签了，今天就能走。」',
          choices: [
            { label: '签协商离职', cash: 1500, flag: 'signedSeverance', note: '赔偿金到账，你签得很快。' },
            { label: '争取更多赔偿', cash: 1000, flag: 'foughtSeverance', note: '你据理力争，最后只多拿了一点。' }
          ]
        },
        {
          id: 'layoff-2', at: 3, title: '三天后有个面试',
          text: '面试在三天后。\n这三天，你是停手准备，还是再赚一笔？',
          choices: [
            { label: '停手准备', cash: -100, flag: 'preparedInterview', note: '你买了件像样的衬衫，把软件全关了。' },
            { label: '再赚一笔', cash: 0, flag: 'keptTrading', note: '你决定面试前再赌一把。' }
          ]
        },
        {
          id: 'layoff-3', at: 5, title: '前同事拉你进群',
          text: '前同事说群里有「内部消息」。\n截图很模糊，语气很确定。',
          choices: [
            { label: '听消息', cash: 500, flag: 'listenedRumor', note: '消息费 $500，群里的截图还是很模糊。' },
            { label: '不信', cash: 0, flag: 'ignoredRumor', note: '你退群了，世界安静了一点。' }
          ]
        },
        {
          id: 'layoff-4', at: 7, title: '父母来电',
          text: '电话接通后，他们先问：「吃饭了吗？」',
          choices: [
            { label: '说实话', cash: 1000, flag: 'toldParents', note: '他们没骂你，只转来 $1,000。' },
            { label: '说挺好', cash: 0, flag: 'hidParents', note: '你说挺好的，然后挂了电话。' }
          ]
        }
      ]
    }
  ];

  const ENDINGS = {
    airborne: {
      title: '空中飞人', tone: 'bad', group: '通用',
      hint: '负债达到当前空中飞人线。',
      text: '你没有落地。\n你只是带着{debt}的债，继续挂在空中。\n肥鱼信贷说会一直等你。'
    },
    fall: {
      title: '自由落体', tone: 'bad', group: '通用',
      hint: '账户穿仓结案。',
      text: '你从高空落地。\n姿势一般，节目效果满分。'
    },
    'rent-paid': {
      title: '交上房租', tone: 'good', group: '房租',
      hint: '完成房租目标，并且给过房东钱。',
      text: '房东收下房租，说下个月别再拖。\n你把交易软件关掉，房间第一次这么安静。'
    },
    'rent-drag': {
      title: '下个月再说', tone: 'neutral', group: '房租',
      hint: '完成房租目标，但一直已读不回。',
      text: '房租交上了。\n房东看你的眼神，像在看一个惯犯。'
    },
    'rent-card': {
      title: '账单替你记住', tone: 'neutral', group: '房租',
      hint: '完成房租目标，但留下信用卡债。',
      text: '房租交上了。\n信用卡账单留到了下个月，利息替你记住了这笔账。'
    },
    'rent-run': {
      title: '换个城市', tone: 'bad', group: '房租',
      hint: '没完成房租目标就收手。',
      text: '你没交上房租，也没脸回去。\n中介把锁换了，你带着手机继续找下一个出租屋。'
    },
    'debt-clear': {
      title: '上岸', tone: 'good', group: '还债',
      hint: '完成还债目标。',
      text: '肥鱼信贷的待还归零。\n你把 App 拖进一个叫「以后再说」的文件夹。'
    },
    'debt-family': {
      title: '家人兜底', tone: 'neutral', group: '还债',
      hint: '完成目标，并在家人来电时说实话。',
      text: '债还清了。\n妈妈没问钱从哪来，只问你最近睡得好不好。'
    },
    'debt-console': {
      title: '轻装上阵', tone: 'neutral', group: '还债',
      hint: '完成目标，并卖掉游戏机。',
      text: '游戏机没了，债也没了。\n房间空了一块，但至少没人再打电话。'
    },
    'debt-run': {
      title: '跑路', tone: 'bad', group: '还债',
      hint: '没还清贷款就收手。',
      text: '你把肥鱼信贷拉黑了。\n它换了个号码继续打。'
    },
    'layoff-job': {
      title: '重新入职', tone: 'good', group: '裁员',
      hint: '完成过渡费目标，并停手准备面试。',
      text: '面试过了。\n你把交易软件删了三天，第四天又装回来了，但至少先去上班。'
    },
    'layoff-flex': {
      title: '灵活就业', tone: 'neutral', group: '裁员',
      hint: '完成目标，并听了前同事的消息。',
      text: '群里的消息没让你发财，但让你有了一个新身份：灵活就业。'
    },
    'layoff-gig': {
      title: '先干着', tone: 'neutral', group: '裁员',
      hint: '完成目标，但没准备面试。',
      text: '你没准备好面试，也没赚够钱。\n先干着吧，至少社保还没断。'
    },
    'layoff-run': {
      title: '换个城市', tone: 'bad', group: '裁员',
      hint: '没赚够过渡费就收手。',
      text: '你换了城市，换了号码，\n没换掉账户里的那点余额。'
    }
  };

  window.FXData = {
    PAIRS, BATTLES, SIM_NEWS, TUTORIAL, ACHIEVEMENTS, GLOSSARY, CONTRACTS, ENDINGS,
    LOAN_MAX, loanDailyRate, tradeFee,
    money, signedMoney, pct, priceText, rateText,
    CHALLENGE_BOARD_SIZE: 3,
    REAL_MAX_SPAN: 600,
    SIM_TICK_MS: 1500
  };
})();
