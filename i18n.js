/* Air Trapeze — language layer. Chinese is the source language; English is overlaid at boot. */
(function () {
  'use strict';

  const SETTINGS_KEY = 'af-settings-v1';
  let lang = 'zh';
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {};
    lang = saved.language === 'en' ? 'en' : 'zh';
  } catch (_) {}

  const EN_EVENTS = {
    'rent-1': {
      title: 'The Landlord, "You There?", Part 3',
      text: 'Your landlord @s you in the group chat.\n"So, when is it convenient this month?"',
      choices: [
        { label: 'Send $200 now', note: 'The landlord takes $200 and says the rest can wait until month-end.' },
        { label: 'Leave it on read', note: 'You mute the group chat.' }
      ]
    },
    'rent-2': {
      title: 'A Friend Is Getting Married. Gift: $500',
      text: 'Your old roommate sends a wedding invitation.\nGo, and this month gets tighter. Skip it, and he may think you changed.',
      choices: [
        { label: 'Go, give $500', note: 'You go. You smile very properly.' },
        { label: 'Don\'t go', note: 'He says it\'s fine, then says nothing else.' }
      ]
    },
    'rent-3': {
      title: 'Payday Still Hasn\'t Landed',
      text: 'Finance says the process is stuck.\nThe landlord\'s message lights up again.',
      choices: [
        { label: 'Use the credit card', note: 'You put $300 on the card. The bill arrives next month.' },
        { label: 'Eat instant noodles', note: 'Three days of noodles. At least you didn\'t borrow.' }
      ]
    },
    'debt-1': {
      title: 'Final Reminder',
      text: 'Fat Fish Credit sends a message:\n"Pay today, or the rate goes up tomorrow."',
      choices: [
        { label: 'Pay $300 first', note: 'You pay $300. Collections goes quiet for a while.' },
        { label: 'Extend it again', note: 'You extend. The interest goes up a little more.' }
      ]
    },
    'debt-2': {
      title: 'A Call From Family',
      text: 'Mom asks if you\'re short on money.\nShe says, "Don\'t tough it out alone."',
      choices: [
        { label: 'Tell the truth', note: 'Mom sends $500 and tells you not to skip meals.' },
        { label: 'Say you\'re fine', note: 'You say you\'re fine, then hang up.' }
      ]
    },
    'debt-3': {
      title: 'Sell Something',
      text: 'Someone on the second-hand app asks about your console.\n"Still available?"',
      choices: [
        { label: 'Sell the console', note: 'You sell it. A corner of the room is empty now.' },
        { label: 'Don\'t sell', note: 'You say you\'ll wait. You\'re not sure what for.' }
      ]
    },
    'layoff-1': {
      title: 'HR Wants a Chat',
      text: 'HR slides an agreement across the table.\n"Sign it and you can leave today."',
      choices: [
        { label: 'Sign the separation deal', note: 'The payout lands. You sign quickly.' },
        { label: 'Push for more', note: 'You argue your case. In the end you get a little more.' }
      ]
    },
    'layoff-2': {
      title: 'An Interview in Three Days',
      text: 'The interview is in three days.\nDo you stop and prepare, or try to make one more trade?',
      choices: [
        { label: 'Stop and prepare', note: 'You buy a decent shirt and close every trading window.' },
        { label: 'One more trade', note: 'You decide to gamble once more before the interview.' }
      ]
    },
    'layoff-3': {
      title: 'A Former Colleague Adds You to a Group',
      text: 'He says there\'s "inside information" in the group.\nThe screenshot is blurry. The tone is certain.',
      choices: [
        { label: 'Listen to the tip', note: 'The tip costs $500. The screenshot is still blurry.' },
        { label: 'Don\'t believe it', note: 'You leave the group. The world gets a little quieter.' }
      ]
    },
    'layoff-4': {
      title: 'Your Parents Call',
      text: 'When the call connects, they ask, "Have you eaten?"',
      choices: [
        { label: 'Tell the truth', note: 'They don\'t scold you. They just send $1,000.' },
        { label: 'Say you\'re fine', note: 'You say you\'re fine, then hang up.' }
      ]
    }
  };

  const ENDING_GROUP = { '通用': 'General', '房租': 'Rent', '还债': 'Debt', '裁员': 'Layoff', '其他': 'Other' };
  const PAIR_NAMES = {
    'EUR/USD': 'Euro / US Dollar',
    'GBP/USD': 'British Pound / US Dollar',
    'USD/JPY': 'US Dollar / Japanese Yen',
    'USD/CHF': 'US Dollar / Swiss Franc',
    'EUR/CHF': 'Euro / Swiss Franc',
    'AUD/USD': 'Australian Dollar / US Dollar',
    'USD/CAD': 'US Dollar / Canadian Dollar'
  };

  const EXTRA_UI = {
    '语言 / Language': 'Language',
    '切换后页面会刷新': 'The page reloads after switching.',
    '中文': '中文',
    'English': 'English',
    '上头观察室': 'Headrush Observatory',
    '本地单机版': 'Local single-player',
    '重新开始': 'Start Over',
    '大肥鱼': 'Big Fat Fish',
    '账户总权益': 'Total Equity',
    '各模式独立账户；亏完不影响其他模式，真贴心。': 'Each mode keeps its own account; blowing one up never touches the others. How thoughtful.',
    '现在收手：': 'Cash out now: ',
    '已用保证金': 'Margin Used',
    '待还贷款（含利息）': 'Loan Due (incl. interest)',
    '货币对': 'Currency Pairs',
    '每 1.5 秒更新': 'Updated every 1.5s',
    '剩 {n} 根 / {s} 秒': '{n} bars left / {s}s',
    '交易员：这次链接看着比上次真。': 'Trader: this feed looks more real than last time.',
    '模拟数据 · 模拟 K 线': 'Simulated data · Simulated candles',
    '空仓中，暂时像个人': 'Flat. For now, you look like a functioning person.',
    '最近结算': 'Recent settlements',
    '交易货币对': 'Currency pair',
    '止损': 'Stop Loss',
    '止盈': 'Take Profit',
    '爆仓价': 'Liquidation price',
    '跳空': 'Gap',
    ' · 本局峰值 {money}': ' · Run peak {money}',
    '本局峰值 {money}': 'Run peak {money}',
    '· 本局峰值 {money}': '· Run peak {money}',
    '合同目标': 'Contract target',
    '交易台': 'Trading desk',
    '策略商店': 'Strategy shop',
    '研究等级': 'Research level',
    '高费': 'High-cost',
    '本幕利息 +{money}（不计入合同盈亏）。': 'Interest this act +{money} (not counted toward contract P&L).',
    '没有利息。': 'No interest.',
    '手续费': 'Fee',
    '开仓价': 'Entry price',
    '杠杆': 'Leverage',
    '日利率': 'Daily rate',
    '空中飞人线': 'Air Trapeze line',
    '借一笔': 'Borrow',
    '还债': 'Repay',
    '数据来源：Frankfurter ↗': 'Data: Frankfurter ↗',
    '这一局，你打算怎么活？': 'How do you plan to survive this run?',
    '这份合同不开放借款。先按合同目标走。': 'This contract does not allow borrowing. Work toward the contract target.',
    '合同只在模拟模式生效。目标完成后可以收手，也可以继续贪；失败照样进病历。': 'Contracts apply only in Sim mode. Hit the goal and you can cash out or keep pushing; fail and it still goes in your records.',
    '上一份': 'Previous',
    '下一份': 'Next',
    '不想签合同就选自由模式，按现在的规则玩。': 'Not signing anything? Pick Free Mode and play by the current rules.',
    '交易台：{terms}': 'Trading desk: {terms}',
    '交易台最多 3 张策略卡。先选一张，决定这一局的交易方式。': 'Up to 3 strategy cards fit on the desk. Pick one to define how you trade this run.',
    '追加保证金': 'Add Margin',
    '平掉一半': 'Close Half',
    '借款补仓': 'Borrow to Add',
    '空仓': 'Flat',
    '取消': 'Cancel',
    '知道了': 'Got it',
    '关闭': 'Close',
    '病历本': 'Casebook',
    '病历库': 'Case Archive',
    '结局图鉴': 'Ending Codex',
    '成就': 'Achievements',
    '已解锁': 'Unlocked',
    '未解锁': 'Locked',
    '当前价格': 'Current price',
    '模拟账户': 'Sim Account',
    '模拟数据账户': 'Simulated data account',
    '标准': 'Standard',
    '大肥鱼': 'Big Fat Fish',
    '模拟行情': 'Simulated market',
    '实时模拟': 'Live simulation',
    '合计 {money} 保证金': '{money} total margin',
    '做多': 'Long',
    '做空': 'Short',
    '浮动盈亏': 'Floating P&L',
    '平仓': 'Close',
    '开仓': 'Entry',
    '保证金': 'Margin',
    '爆仓': 'Blowup',
    '现价距爆仓': 'Distance to blowup',
    '风险偏高': 'Elevated risk',
    '交易记录': 'Trade history',
    '持仓': 'Positions',
    '买下': 'Buy',
    '升级': 'Upgrade',
    '刷新策略': 'Reroll',
    '免费': 'Free',
    '本幕利息': 'Interest this act',
    '不计入合同盈亏': 'not counted toward contract P&L',
    '新闻积分': 'News points',
    '每点让策略卡便宜': 'Each point makes strategy cards cheaper by',
    '本幕利息 +{money}（不计入合同盈亏）。': 'Interest this act +{money} (not counted toward contract P&L).',
    '新闻积分 {n}：每点让策略卡便宜 $50（最多 -$300）。': 'News points {n}: each point makes strategy cards $50 cheaper (max -$300).',
    '收手离场': 'Cash Out',
    '当前价格': 'Current price',
    '← 过去': '← Past',
    '现在 →': 'Present →',
    '等待行情…': 'Waiting for prices...',
    '警报': 'Alert',
    '合计 {money} 保证金': '{money} total margin'
  };
  if (window.FX_EN_UI) Object.assign(window.FX_EN_UI, EXTRA_UI);

  const CONTRACT_GOALS = {    free: { goal: 'No target. Play until you decide to walk away.' },
    rent: {
      goal: 'Make $500 net profit, then stop.',
      hard: 'Make $800 net profit, then stop.',
      coach: 'Make $100 net profit, then stop.'
    },
    debt: {
      goal: 'Clear the $3,000 loan and reach $7,500 equity.',
      hard: 'Clear the $3,000 loan and reach $8,000 equity.',
      coach: 'Clear the $3,000 loan and reach $7,200 equity.'
    },
    layoff: {
      goal: 'Make $1,500 net profit, then stop.',
      hard: 'Make $3,000 net profit, then stop.',
      coach: 'Make $200 net profit, then stop.'
    }
  };

  const ENDING_HINT = {
    airborne: 'Debt reached the current Air Trapeze line.',
    fall: 'The account blew through zero and closed.',
    'rent-paid': 'Made rent and paid the landlord something.',
    'rent-drag': 'Made rent but kept leaving the landlord on read.',
    'rent-card': 'Made rent but left credit-card debt behind.',
    'rent-run': 'Walked away before making rent.',
    'debt-clear': 'Cleared the debt target.',
    'debt-family': 'Cleared the target and told the truth when family called.',
    'debt-console': 'Cleared the target and sold the console.',
    'debt-run': 'Walked away before clearing the loan.',
    'layoff-job': 'Made the runway target and stopped to prepare for the interview.',
    'layoff-flex': 'Made the target and listened to the former colleague\'s tip.',
    'layoff-fought': 'Made the target and pushed HR for more severance.',
    'layoff-gig': 'Made the target but never prepared for the interview.',
    'layoff-run': 'Walked away before making the runway target.'
  };

  function localizeData() {
    if (lang !== 'en' || !window.FXData) return;
    const d = window.FXData;
    const en = window.FX_EN_DATA || {};
    const enNews = window.FX_EN_NEWS || [];

    (d.PAIRS || []).forEach(pair => {
      if (PAIR_NAMES[pair.id]) pair.name = PAIR_NAMES[pair.id];
    });

    (d.CONTRACTS || []).forEach(contract => {
      const e = en.contracts && en.contracts[contract.id];
      if (!e) return;
      Object.assign(contract, {
        kicker: e.kicker || contract.kicker,
        title: e.title || contract.title,
        background: e.background || contract.background,
        goalText: e.goalText || contract.goalText,
        limitText: e.limitText || contract.limitText,
        specialText: e.specialText || contract.specialText
      });
      const goals = CONTRACT_GOALS[contract.id];
      if (goals) {
        contract.goalText = goals.goal || contract.goalText;
        if (goals.hard) contract.hardGoalText = goals.hard;
        if (goals.coach) contract.coachGoalText = goals.coach;
      }
      (contract.events || []).forEach(event => {
        const ee = EN_EVENTS[event.id];
        if (!ee) return;
        event.title = ee.title;
        event.text = ee.text;
        (event.choices || []).forEach((choice, index) => {
          const ec = ee.choices && ee.choices[index];
          if (!ec) return;
          choice.label = ec.label || choice.label;
          choice.note = ec.note || choice.note;
        });
      });
    });

    (d.ENVIRONMENTS || []).forEach(env => {
      const e = en.environments && en.environments[env.id];
      if (!e) return;
      env.title = e.title || env.title;
      env.kicker = e.kicker || env.kicker;
      env.desc = e.desc || env.desc;
      env.rewardText = e.rewardText || env.rewardText;
    });

    (d.SHOP_ITEMS || []).forEach(item => {
      const e = en.shopItems && en.shopItems[item.id];
      if (!e) return;
      item.title = e.title || item.title;
      item.kicker = e.kicker || item.kicker;
      item.desc = e.desc || item.desc;
    });

    (d.STRATEGY_CARDS || []).forEach(card => {
      const e = en.cards && en.cards[card.id];
      if (!e) return;
      card.name = e.name || card.name;
      card.styleLabel = e.styleLabel || card.styleLabel;
      card.desc = e.desc || card.desc;
    });

    (d.ACHIEVEMENTS || []).forEach(item => {
      const e = en.achievements && en.achievements[item.id];
      if (!e) return;
      item.name = e.name || item.name;
      item.desc = e.desc || item.desc;
      item.hint = e.hint || item.hint;
    });

    (d.TUTORIAL || []).forEach((item, index) => {
      const e = (en.tutorial || [])[index];
      if (!e) return;
      item.title = e.title || item.title;
      item.text = e.text || item.text;
      item.example = e.example || item.example;
    });

    Object.keys(d.ENDINGS || {}).forEach(id => {
      const item = d.ENDINGS[id];
      const e = en.endings && en.endings[id];
      if (e) {
        item.title = e.title || item.title;
        item.text = e.text || item.text;
      }
      if (ENDING_GROUP[item.group]) item.group = ENDING_GROUP[item.group];
      if (ENDING_HINT[id]) item.hint = ENDING_HINT[id];
    });

    (d.BATTLES || []).forEach((battle, index) => {
      const e = (en.battles || [])[index];
      if (!e) return;
      battle.title = e.title || battle.title;
      battle.description = e.description || battle.description;
      battle.tagline = e.tagline || battle.tagline;
      (battle.news || []).forEach((item, newsIndex) => {
        const ne = (e.news || [])[newsIndex];
        if (!ne) return;
        item.tag = ne.tag || item.tag;
        item.title = ne.title || item.title;
        item.body = ne.body || item.body;
      });
    });

    (d.SIM_NEWS || []).forEach((item, index) => {
      const e = enNews[index];
      if (!e) return;
      item.tag = e.tag || item.tag;
      item.title = e.title || item.title;
      item.body = e.body || item.body;
    });

    const extra = window.FX_EN_EXTRA || {};
    (d.SIM_NEWS || []).forEach(item => {
      if (!item.quote) return;
      if (extra.quotes && extra.quotes[item.quote]) item.quote = extra.quotes[item.quote];
      else if (/[\u4e00-\u9fff]/.test(item.quote)) item.quote = '';
    });
    Object.keys(d.GLOSSARY || {}).forEach(term => {
      const e = extra.glossary && extra.glossary[term];
      const info = d.GLOSSARY[term];
      if (!e || !info) {
        if (info) {
          info.def = 'English definition unavailable in this build.';
          info.example = '';
        }
        return;
      }
      if (e.def) info.def = e.def;
      if (e.example) info.example = e.example;
    });
  }

  function translated(text) {
    const key = String(text || '');
    const trimmed = key.trim();
    if (!trimmed) return text;
    const map = window.FX_EN_UI || {};
    if (Object.prototype.hasOwnProperty.call(map, trimmed)) {
      return key.replace(trimmed, map[trimmed]);
    }
    for (const rule of uiTemplates) {
      const match = trimmed.match(rule.regex);
      if (!match) continue;
      let out = rule.value;
      rule.names.forEach((name, index) => { out = out.replaceAll(`{${name}}`, match[index + 1]); });
      return key.replace(trimmed, out);
    }
    let out = key;
    CONTENT_PHRASES.forEach(([from, to]) => { out = out.split(from).join(to); });
    return out;
  }

  const CONTENT_PHRASES = [
    ['第一幕', 'Act I'], ['第二幕', 'Act II'], ['第三幕', 'Act III'],
    ['当前浮盈亏', 'Current P&L'], ['合同盈亏', 'Contract P&L'], ['目标缺口', 'Gap to goal'],
    ['合同目标', 'contract target'], ['不开放借款', 'does not allow borrowing'], ['先按', 'work toward '],
    ['有效成交', 'Valid fills'], ['有效权益', 'Effective equity'], ['已赚', 'Earned'],
    ['持仓 ', 'positions: '], [' 笔', ''], ['当前浮盈亏', 'Current P&L'],
    ['追加保证金（防守）', 'Add Margin (Defense)'], ['追加保证金', 'Add Margin'],
    ['对冲卡', 'Hedge Card'], ['应急卡', 'Emergency cards'],
    ['冲 ×', 'Hedge ×'], ['保证金', 'Margin'], ['仓位', 'Position'],
    ['开仓价格', 'Entry price'], ['开仓价', 'Entry'], ['当前价格', 'Current price'],
    ['浮盈', 'Floating profit'], ['浮亏', 'Floating loss'], ['峰值', 'Peak'], ['回撤', 'Drawdown'],
    ['消息 ', 'News '], ['趋势 ', 'Trend '], ['逆势 ', 'Contrarian '], ['防守 ', 'Defense '],
    ['交易台', 'Trading desk'], ['成交 ', 'Fills '], ['买下', 'Buy'], ['升级', 'Upgrade'],
    ['刷新策略', 'Reroll'], ['免费', 'Free'], ['本幕利息', 'Interest this act'],
    ['不计入合同盈亏', 'not counted toward contract P&L'], ['新闻积分', 'News points'],
    ['这份合同', 'This contract '], ['走。', '.'],
    ['警报', 'Alert'], ['剩 ', ''], [' 根', ' bars'], [' 秒', 's'],
    ['（', ' ('], ['）', ')'], ['。', '. '], ['，', ', '], ['：', ': '], ['、', ', '],
    ['不计入Contract P&L', 'not counted toward contract P&L'], ['不计入', 'not counted toward '],
    ['交易 ', 'Trades '], ['目标', 'Target'], ['租赁', 'Rent'],
    ['10 秒内做出选择。时间到默认硬扛。', 'Choose within 10 seconds. Timeout = hold.'],
    ['第一笔。每个赌狗都从「试试水」开始。', 'First trade. Every degenerate starts with "just testing the water."']
  ];

  const uiTemplates = (() => {
    const map = window.FX_EN_UI || {};
    return Object.entries(map)
      .filter(([key]) => /\{[a-zA-Z]+\}/.test(key))
      .map(([key, value]) => {
        const names = [...key.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]);
        const source = key.split(/(\{[a-zA-Z]+\})/).map(part => {
          if (/^\{[a-zA-Z]+\}$/.test(part)) return '(.+?)';
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        return { regex: new RegExp(`^${source}$`), value, names };
      })
      .sort((a, b) => b.regex.source.length - a.regex.source.length);
  })();

  function translateAttributes(element) {
    ['placeholder', 'title', 'aria-label', 'alt'].forEach(name => {
      if (!element.hasAttribute || !element.hasAttribute(name)) return;
      const value = element.getAttribute(name);
      if (!value) return;
      const next = translated(value);
      if (next !== value) element.setAttribute(name, next);
    });
  }

  let applying = false;
  function apply(root) {
    if (lang !== 'en' || applying || !root) return;
    applying = true;
    try {
      root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(translateAttributes);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || parent.closest('script,style,textarea,option')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const next = translated(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      });
    } finally {
      applying = false;
    }
  }

  function init() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    if (lang === 'en') {
      localizeData();
      document.title = 'Air Trapeze · Vertigo Observation Room';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', 'Air Trapeze · Vertigo Observation Room — a black-comedy forex trading game with crisis archives.');
    }
    apply(document.body);
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        apply(document.body);
      }, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'] });
  }

  window.FX_I18N = {
    get lang() { return lang; },
    get isEnglish() { return lang === 'en'; },
    localizeData,
    apply,
    translate: translated
  };

  if (lang === 'en') localizeData();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
