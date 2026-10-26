/* 空中飞人 · 行情与交易引擎 */
(function () {
  'use strict';

  const D = window.FXData;
  const { PAIRS, BATTLES, SIM_NEWS, ACHIEVEMENTS, LOAN_MAX } = D;
  const SAVE_KEY = 'af-save-v1';
  const SETTINGS_KEY = 'af-settings-v1';
  const ACH_KEY = 'af-ach-v1';
  const CH_KEY = 'af-challenge-v1';
  const CH_STATE_KEY = 'af-challenge-state-v1';
  const BOARD_KEY = 'af-board-v1';
  const CASES_KEY = 'af-cases-v1';
  const ENDINGS_KEY = 'af-endings-v1';
  const DEFAULT_SETTINGS = { nickname: '大肥鱼', advancedTrading: false, sfxOn: true, sfxVol: 70, musicOn: false, musicVol: 60, newsOn: true, newsFreq: 'mid', theme: 'day', difficulty: 'standard' };
  const NEWS_FREQ_TICKS = { low: [40, 70], mid: [12, 22], high: [5, 10] };
  const REAL_MAX_SPAN = 600;
  const todayKey = () => new Date().toLocaleDateString('en-CA');

  function ui(name, ...args) {
    const U = window.FXUI;
    if (U && typeof U[name] === 'function') {
      try { return U[name](...args); } catch (error) { console.warn('UI error', name, error); }
    }
  }

  const accountSeed = () => ({
    cash: 10000, debt: 0, loanPrincipal: 0, loanRate: 0, simLoanTicks: 0,
    positions: [], history: [], pair: 'EUR/USD', leverage: 20, margin: 500,
    feesPaid: 0, equityTrail: [], realProgress: {}, realRangeKey: null, realRange: null,
    battleId: null, lastRealDate: null, lastBattleDate: null,
    lastOneCount: 0, peakEquity: 10000, runClosed: false, closeReason: '', contract: null
  });
  const initialState = mode => ({ ...accountSeed(), mode: mode || 'sim' });

  let settings = { ...DEFAULT_SETTINGS };
  try { settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {}) }; } catch (_) {}
  let achievements = { unlocked: {} };
  try { achievements = { unlocked: (JSON.parse(localStorage.getItem(ACH_KEY) || 'null') || {}).unlocked || {} }; } catch (_) {}

  let state = initialState('sim');
  let accounts = { sim: null, real: null, battle: null, challenge: null };
  let sim = {};
  let challengeSim = {};
  let savedSim = null;
  let real = { items: [], cursor: 0, loading: false, error: '', loadingText: '', tf: '1d' };
  let battle = { items: [], cursor: 0, loading: false, error: '', id: null, tf: '1d', shownNews: [], endNotified: false };
  let battlePickerOpen = false;
  let autoPlay = false;
  let riskPaused = false;
  let riskPositionId = null;
  let marginHelpDone = false;
  let requestCounter = 0;
  let battleRequestCounter = 0;
  let simNewsTicks = 5 + Math.floor(Math.random() * 6);
  let simFlavorTicks = 7 + Math.floor(Math.random() * 8);
  let activeSimNews = [];
  let simTickCount = 0;
  let newsFeed = [];
  let challengeSaveTimer = null;
  let challenge = { date: todayKey(), remaining: 3, active: false, loaded: false, loading: false, saving: false };
  let challengeStateSaved = null;

  const CHALLENGE_SCORE_MIN = -16777216;
  const CHALLENGE_SCORE_MAX = 16777215;
  const CHALLENGE_SCORE_DOLLARS = 100;
  const challengeScore = profit => Math.max(CHALLENGE_SCORE_MIN, Math.min(CHALLENGE_SCORE_MAX, Math.trunc(profit / CHALLENGE_SCORE_DOLLARS)));

  /* ---------- 工具 ---------- */
  function isSafe() {
    return settings.difficulty === 'safe' && state.mode !== 'challenge';
  }

  function isContractActive() {
    return state.mode === 'sim' && !!state.contract && state.contract.id !== 'free';
  }

  function contractBlocked() {
    const c = state.contract;
    return !!c && c.maxTrades && (c.trades || 0) >= c.maxTrades;
  }

  function contractNoLoans() {
    return !!state.contract && !!state.contract.noLoans;
  }

  function contractStatus() {
    if (!isContractActive()) return null;
    const c = state.contract;
    const a = account();
    const profit = a.equity - c.startEquity;
    if (c.goalType === 'debt') {
      const span = Math.max(1, c.targetEquity - c.startEquity);
      const complete = state.debt <= 0 && a.equity >= c.targetEquity;
      return {
        ...c, complete, profit, debt: state.debt,
        progress: Math.max(0, Math.min(1, (a.equity - c.startEquity) / span)),
        remaining: Math.max(0, c.targetEquity - a.equity)
      };
    }
    const target = Math.max(1, c.targetProfit || 1);
    const complete = profit >= target;
    return {
      ...c, complete, profit,
      progress: Math.max(0, Math.min(1, profit / target)),
      remaining: Math.max(0, target - profit)
    };
  }

  function maybeContractGoal() {
    if (!isContractActive() || state.contract.goalAnnounced) return;
    const status = contractStatus();
    if (!status || !status.complete) return;
    state.contract.goalAnnounced = true;
    save();
    narrate('合同目标达成。现在收手，还是再贪一点？');
  }

  function maybeContractEvent() {
    if (!isContractActive() || state.runClosed) return null;
    const contract = state.contract;
    if (!contract || contract.eventPending) return null;
    const event = (contract.events || [])[contract.eventIndex];
    if (!event || (contract.trades || 0) < event.at) return null;
    contract.eventPending = true;
    save();
    ui('showContractEvent', { event, contractTitle: contract.title, eventIndex: contract.eventIndex });
    return event;
  }

  function resolveContractEvent(eventId, choiceIndex) {
    const contract = state.contract;
    if (!contract || !contract.eventPending) return null;
    const event = (contract.events || [])[contract.eventIndex];
    if (!event || event.id !== eventId) return null;
    const choice = (event.choices || [])[Number(choiceIndex)];
    if (!choice) return null;
    const effects = {
      cash: Number(choice.cash) || 0,
      debt: Number(choice.debt) || 0,
      rate: Number(choice.rate) || 0
    };
    if (choice.cash) state.cash = Math.max(0, state.cash + Number(choice.cash));
    if (choice.debt) {
      const before = state.debt;
      const next = Math.max(0, before + Number(choice.debt));
      if (next > before) state.loanPrincipal += next - before;
      else state.loanPrincipal = Math.max(0, Math.min(state.loanPrincipal, next));
      state.debt = next;
      if (state.debt <= 0) { state.loanPrincipal = 0; state.loanRate = 0; state.simLoanTicks = 0; }
    }
    if (choice.rate && state.debt > 0) state.loanRate = Math.max(0, Math.min(0.001, state.loanRate + Number(choice.rate)));
    if (choice.flag) contract.flags[choice.flag] = true;
    contract.eventIndex += 1;
    contract.eventPending = false;
    contract.eventLog = contract.eventLog || [];
    contract.eventLog.push({
      id: event.id, title: event.title, choice: choice.label,
      flag: choice.flag || null, effects,
      time: new Date().toLocaleDateString('zh-CN')
    });
    save();
    emit();
    maybeContractGoal();
    if (choice.note) narrate(choice.note);
    return choice;
  }

  function contractGrade() {
    if (!isContractActive()) return null;
    const status = contractStatus();
    if (!status) return null;
    if (state.runClosed && state.closeReason === 'bankrupt') return 'D';
    if (status.complete) {
      const used = status.trades || 0;
      return used <= Math.ceil((status.maxTrades || 99) * 0.6) ? 'S' : 'A';
    }
    return account().equity >= state.contract.startEquity ? 'B' : 'C';
  }

  function airborneThreshold() {
    const start = state.contract ? Number(state.contract.startEquity) : 10000;
    const base = Number.isFinite(start) ? start : 10000;
    const trades = Math.max(state.contract ? (state.contract.trades || 0) : 0, state.history.length || 0);
    const peak = Math.max(base, Number(state.peakEquity) || 0, account().equity);
    const profit = Math.max(0, peak - base);
    return Math.round((5000 + trades * 250 + profit * 0.5) / 100) * 100;
  }

  function resolveEnding() {
    const contract = state.contract;
    const status = contractStatus();
    const complete = !!(status && status.complete);
    const flags = (contract && contract.flags) || {};
    const ending = id => {
      const item = D.ENDINGS && D.ENDINGS[id];
      return item ? { id, ...item, text: String(item.text || '').replace('{debt}', D.money(state.debt)) } : null;
    };
    if (state.debt >= airborneThreshold()) return ending('airborne');
    if (state.runClosed && state.closeReason === 'bankrupt') return ending('fall');
    if (!contract || contract.id === 'free') return null;
    if (!complete) return ending(`${contract.id}-run`);
    if (contract.id === 'rent') {
      if (state.debt > 0) return ending('rent-card');
      return ending(flags.paidLandlord ? 'rent-paid' : 'rent-drag');
    }
    if (contract.id === 'debt') {
      if (state.debt > 0) return ending('debt-run');
      if (flags.toldFamily) return ending('debt-family');
      if (flags.soldConsole) return ending('debt-console');
      return ending('debt-clear');
    }
    if (contract.id === 'layoff') {
      if (flags.preparedInterview) return ending('layoff-job');
      if (flags.listenedRumor) return ending('layoff-flex');
      return ending('layoff-gig');
    }
    return null;
  }

  function startContract(id) {
    if (state.mode !== 'sim') return false;
    if (state.positions.length || state.history.length || state.runClosed) return false;
    const config = (D.CONTRACTS || []).find(item => item.id === id);
    if (!config) return false;
    state.cash = Number(config.startCash) || 10000;
    state.debt = 0;
    state.loanPrincipal = 0;
    state.loanRate = 0;
    state.simLoanTicks = 0;
    state.feesPaid = 0;
    state.positions = [];
    state.history = [];
    state.lastOneCount = 0;
    state.runClosed = false;
    state.closeReason = '';
    if (config.startDebt) {
      state.debt = config.startDebt;
      state.loanPrincipal = config.startDebt;
      state.loanRate = 0.0002;
    }
    state.peakEquity = account().equity;
    state.contract = {
      ...config,
      trades: 0,
      startEquity: account().equity,
      goalAnnounced: false,
      eventIndex: 0,
      eventPending: false,
      eventLog: [],
      flags: {}
    };
    state.leverage = Math.min(state.leverage, maxLeverage());
    save();
    emit();
    return true;
  }

  function maxLeverage() {
    const base = isSafe() ? 20 : 100;
    const cap = isContractActive() && state.contract.leverageCap ? state.contract.leverageCap : base;
    return Math.min(base, cap);
  }

  function normalizeAccount() {
    state.positions = Array.isArray(state.positions) ? state.positions : [];
    state.history = Array.isArray(state.history) ? state.history : [];
    state.equityTrail = Array.isArray(state.equityTrail) ? state.equityTrail : [];
    state.realProgress = state.realProgress && typeof state.realProgress === 'object' ? state.realProgress : {};
    state.leverage = Math.max(1, Math.min(100, Number(state.leverage) || 20));
    state.margin = Math.max(10, Number(state.margin) || 500);
    state.cash = Number.isFinite(Number(state.cash)) ? Number(state.cash) : 10000;
    state.debt = Math.max(0, Number(state.debt) || 0);
    state.loanPrincipal = state.debt > 0 ? Math.max(1, Number(state.loanPrincipal) || state.debt) : 0;
    state.loanRate = state.debt > 0 ? D.loanDailyRate(state.loanPrincipal) : 0;
    state.simLoanTicks = Math.max(0, Math.min(19, Math.floor(Number(state.simLoanTicks) || 0)));
    state.lastOneCount = Math.max(0, Math.floor(Number(state.lastOneCount) || 0));
    state.peakEquity = Math.max(0, Number(state.peakEquity) || 10000);
    state.runClosed = !!state.runClosed;
    state.closeReason = state.runClosed ? String(state.closeReason || 'cashout') : '';
    if (!state.contract || !['free', 'rent', 'debt', 'layoff'].includes(state.contract.id)) state.contract = null;
    if (state.contract) {
      state.contract.trades = Math.max(0, Math.floor(Number(state.contract.trades) || 0));
      state.contract.startEquity = Number.isFinite(Number(state.contract.startEquity)) ? Number(state.contract.startEquity) : account().equity;
      state.contract.eventIndex = Math.max(0, Math.floor(Number(state.contract.eventIndex) || 0));
      state.contract.eventPending = false;
      state.contract.eventLog = Array.isArray(state.contract.eventLog) ? state.contract.eventLog : [];
      state.contract.flags = state.contract.flags && typeof state.contract.flags === 'object' ? state.contract.flags : {};
    }
    if (!PAIRS.some(p => p.id === state.pair)) state.pair = 'EUR/USD';
    state.positions.forEach(pos => {
      pos.notional = Number.isFinite(pos.notional) ? pos.notional : pos.margin * pos.leverage;
      pos.margin = Number(pos.margin) || 0;
      pos.warned = false;
      pos.stopPrice = Number.isFinite(Number(pos.stopPrice)) && Number(pos.stopPrice) > 0 ? Number(pos.stopPrice) : null;
      pos.takePrice = Number.isFinite(Number(pos.takePrice)) && Number(pos.takePrice) > 0 ? Number(pos.takePrice) : null;
    });
    if (isSafe() && state.leverage > 20) state.leverage = 20;
    if (state.mode === 'sim' && state.contract && state.contract.leverageCap && state.leverage > state.contract.leverageCap) {
      state.leverage = state.contract.leverageCap;
    }
  }

  function snapshot() {
    return {
      cash: state.cash, debt: state.debt, loanPrincipal: state.loanPrincipal, loanRate: state.loanRate,
      simLoanTicks: state.simLoanTicks, positions: state.positions, history: state.history.slice(0, 30),
      pair: state.pair, leverage: state.leverage, margin: state.margin, feesPaid: state.feesPaid || 0,
      battleId: state.battleId, lastRealDate: state.lastRealDate, lastBattleDate: state.lastBattleDate,
      equityTrail: state.equityTrail, realProgress: state.realProgress, realRangeKey: state.realRangeKey, realRange: state.realRange,
      lastOneCount: state.lastOneCount, peakEquity: state.peakEquity,
      runClosed: state.runClosed, closeReason: state.closeReason, contract: state.contract
    };
  }

  function save() {
    accounts[state.mode] = snapshot();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ mode: state.mode, accounts, sim }));
    } catch (_) {}
  }

  function loadSave() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (_) {}
    if (!saved || !saved.accounts) return;
    accounts = { ...accounts, ...saved.accounts };
    state = { ...initialState('sim'), ...(accounts.sim || {}), mode: 'sim' };
    if (saved.sim) savedSim = saved.sim;
    normalizeAccount();
  }

  /* ---------- 市场 ---------- */
  function buildMarket() {
    const market = {};
    PAIRS.forEach((pair, index) => {
      let value = pair.initial;
      const candles = [];
      for (let i = 0; i < 76; i++) {
        const open = value;
        const wave = Math.sin(i * 0.43 + index * 1.9) * 0.0008 + Math.cos(i * 0.19 + index) * 0.00055;
        value = open * (1 + wave + (Math.random() - 0.5) * 0.0019);
        const spread = open * (0.0005 + Math.random() * 0.00065);
        candles.push({ open, high: Math.max(open, value) + spread, low: Math.min(open, value) - spread, close: value });
      }
      market[pair.id] = { candles, price: value };
    });
    return market;
  }

  function seedSim() {
    if (savedSim) {
      const valid = PAIRS.every(p => Array.isArray(savedSim[p.id]?.candles) && Number.isFinite(savedSim[p.id]?.price));
      if (valid) { sim = savedSim; savedSim = null; return; }
      savedSim = null;
    }
    if (!PAIRS.every(p => sim[p.id]?.candles?.length)) sim = buildMarket();
  }

  function seedChallengeSim() {
    challengeSim = buildMarket();
  }

  function currentPrice(pair) {
    if (state.mode === 'real') return real.items[real.cursor]?.prices[pair] ?? NaN;
    if (state.mode === 'battle') return battle.items[battle.cursor]?.prices[pair] ?? NaN;
    const market = state.mode === 'challenge' ? challengeSim : sim;
    return market[pair]?.price ?? NaN;
  }

  function previousPrice(pair) {
    if (state.mode === 'real') return real.items[Math.max(0, real.cursor - 1)]?.prices[pair] ?? currentPrice(pair);
    if (state.mode === 'battle') return battle.items[Math.max(0, battle.cursor - 1)]?.prices[pair] ?? currentPrice(pair);
    const candles = (state.mode === 'challenge' ? challengeSim : sim)[pair]?.candles || [];
    return candles[candles.length - 2]?.close ?? currentPrice(pair);
  }

  function changeOf(pair) {
    const now = currentPrice(pair), prev = previousPrice(pair);
    return Number.isFinite(now) && Number.isFinite(prev) && prev > 0 ? (now / prev - 1) * 100 : 0;
  }

  function positionPnl(pos) {
    const price = currentPrice(pos.pair);
    if (!Number.isFinite(price) || !Number.isFinite(pos.entry) || pos.entry <= 0) return 0;
    return pos.notional * pos.side * (price / pos.entry - 1);
  }

  function riskRatio(pos) { return Math.max(0, -positionPnl(pos) / Math.max(1, pos.margin)); }

  function liquidationPrice(pos) {
    if (!pos || !Number.isFinite(pos.entry) || pos.entry <= 0) return NaN;
    const move = Math.min(0.95, 0.8 * pos.margin / Math.max(1, pos.notional));
    return pos.side === 1 ? pos.entry * (1 - move) : pos.entry * (1 + move);
  }

  function distanceToLiquidation(pos) {
    const liq = liquidationPrice(pos);
    const price = currentPrice(pos.pair);
    if (!Number.isFinite(liq) || !Number.isFinite(price) || price <= 0) return 0;
    return pos.side === 1
      ? Math.max(0, (price - liq) / price * 100)
      : Math.max(0, (liq - price) / price * 100);
  }

  function account() {
    const used = state.positions.reduce((sum, p) => sum + p.margin, 0);
    const floating = state.positions.reduce((sum, p) => sum + positionPnl(p), 0);
    return { used, floating, equity: state.cash + used + floating - state.debt };
  }

  function trackPeak() {
    const equity = account().equity;
    if (Number.isFinite(equity)) state.peakEquity = Math.max(Number(state.peakEquity) || 10000, equity);
  }

  function diagnosis() {
    const liquidations = state.history.filter(item => item.liquidated).length;
    if ((state.lastOneCount || 0) >= 10) return '「最后一次」综合征（晚期）';
    if ((state.lastOneCount || 0) >= 5) return '回本型上头';
    if (liquidations >= 3) return '反复爆仓型';
    if (state.debt > 0) return '以贷养贷型';
    if ((state.peakEquity || 0) - account().equity > 2000) return '回撤幻觉型';
    return '暂时清醒';
  }

  function series() {
    if (state.mode === 'battle') return battle;
    if (state.mode === 'real') return real;
    return null;
  }

  /* ---------- 音效 / 通知 ---------- */
  function toast(message) { ui('toast', message); }
  function narrate(message) { ui('narrate', message); }

  function pushNews(item) {
    newsFeed.unshift(item);
    if (newsFeed.length > 40) newsFeed.length = 40;
    ui('pushNews', item);
  }

  function unlock(id) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def || achievements.unlocked[id]) return false;
    achievements.unlocked[id] = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem(ACH_KEY, JSON.stringify(achievements)); } catch (_) {}
    if (window.FXAudio) FXAudio.achieve();
    toast(`📋 确诊「${def.name}」`);
    ui('achievementUnlocked', def);
    return true;
  }

  function checkEquityAchievements() {
    const profit = account().equity - 10000;
    if (profit >= 100000) unlock('air-trapeze');
    if (profit >= 1000000) unlock('sure-win');
    if (profit <= -100000) unlock('freefall');
  }

  /* ---------- 交易 ---------- */
  function validateStopPrices(side, entry, margin, leverage, raw) {
    const source = raw || {};
    const stop = source.stopPrice === '' || source.stopPrice == null ? null : Number(source.stopPrice);
    const take = source.takePrice === '' || source.takePrice == null ? null : Number(source.takePrice);
    if ((stop !== null && (!Number.isFinite(stop) || stop <= 0)) || (take !== null && (!Number.isFinite(take) || take <= 0))) {
      return { error: '止损/止盈价格格式不对。' };
    }
    const buffer = 0.8 / Math.max(1, leverage);
    const liquidation = side === 1 ? entry * (1 - buffer) : entry * (1 + buffer);
    if (stop !== null) {
      if (side === 1 && stop >= entry) return { error: '多单止损价要低于当前价。' };
      if (side === -1 && stop <= entry) return { error: '空单止损价要高于当前价。' };
      if (side === 1 && stop <= liquidation) return { error: '止损价必须高于爆仓价，否则会先爆仓。' };
      if (side === -1 && stop >= liquidation) return { error: '止损价必须低于爆仓价，否则会先爆仓。' };
    }
    if (take !== null) {
      if (side === 1 && take <= entry) return { error: '多单止盈价要高于当前价。' };
      if (side === -1 && take >= entry) return { error: '空单止盈价要低于当前价。' };
    }
    return { stopPrice: stop, takePrice: take };
  }

  function openPosition(side, silent = false, stops = null) {
    if (state.runClosed) { toast('本局已收手，点「再来一局」重新开始。'); return null; }
    if (state.mode === 'challenge' && !challenge.active) { toast('请先开始一次挑战。'); return null; }
    if (state.mode === 'challenge' && state.positions.length >= 5) { toast('挑战模式最多同时持有 5 笔仓位。'); return null; }
    if (isContractActive() && contractBlocked()) { toast('这份合同的交易次数已经用完，先收手。'); return null; }
    if (state.leverage > maxLeverage()) {
      toast(isContractActive() && state.contract.leverageCap
        ? `这份合同杠杆最高 ${maxLeverage()}×。`
        : '安全网最高 20×；想加杠杆，先撤掉安全网。');
      return null;
    }
    const margin = Number(state.margin);
    if (!Number.isFinite(margin) || margin < 10) { toast('保证金至少为 $10。'); return null; }
    const fee = D.tradeFee(margin, state.leverage);
    if (margin + fee > state.cash + 0.001) { toast(`可用余额不足：保证金与手续费合计 ${D.money(margin + fee)}。`); return null; }
    const entry = currentPrice(state.pair);
    if (!Number.isFinite(entry)) { toast('行情尚未准备好，请稍后再试。'); return null; }
    const stopPrices = validateStopPrices(side, entry, margin, state.leverage, stops);
    if (stopPrices.error) { toast(stopPrices.error); return null; }
    const isFirstTrade = state.history.length === 0 && state.positions.length === 0;
    state.margin = margin;
    state.cash -= margin + fee;
    state.feesPaid = (state.feesPaid || 0) + fee;
    const position = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pair: state.pair, side, entry, margin, leverage: state.leverage,
      notional: margin * state.leverage, fee, warned: false, borrowed: false,
      stopPrice: stopPrices.stopPrice, takePrice: stopPrices.takePrice,
      loseMs: 0, loseDays: 0, opened: new Date().toLocaleString('zh-CN')
    };
    state.positions.unshift(position);
    if (isContractActive()) state.contract.trades = (state.contract.trades || 0) + 1;
    if (window.FXAudio) FXAudio.open();
    if (side === 1) {
      const playback = state.mode === 'real' || state.mode === 'battle';
      const s = series();
      const windowPrices = playback
        ? s.items.slice(Math.max(0, s.cursor - 39), s.cursor + 1).map(row => row.prices[state.pair])
        : (state.mode === 'challenge' ? challengeSim : sim)[state.pair].candles.slice(-40).map(c => c.high);
      const top = Math.max(...windowPrices.filter(Number.isFinite));
      if (Number.isFinite(top) && entry >= top * 0.998) unlock('buy-top');
    }
    save();
    if (state.mode === 'challenge') scheduleChallengeSave();
    checkEquityAchievements();
    trackPeak();
    emit();
    toast(`${state.pair} ${side === 1 ? '做多' : '做空'}开仓成功，已收手续费 ${D.money(fee)}。可用余额 ${D.money(state.cash)}。`);
    if (!silent) {
      if (isFirstTrade) narrate('第一笔。每个赌狗都从「试试水」开始。');
      else if (state.leverage >= 100) narrate('100 倍。安全网？这里没有那种东西。');
      else if (state.leverage >= 50) narrate('这个高度，风有点大。');
    }
    maybeContractEvent();
    return position;
  }

  function closePosition(id, liquidated, meta = {}) {
    const index = state.positions.findIndex(p => p.id === id);
    if (index < 0) return;
    const pos = state.positions[index];
    const pnl = positionPnl(pos);
    state.cash += pos.margin + pnl;
    state.positions.splice(index, 1);
    state.history.unshift({
      pair: pos.pair, side: pos.side, pnl, liquidated: !!liquidated,
      trigger: meta.trigger || null, triggerPrice: meta.triggerPrice ?? null,
      time: new Date().toLocaleDateString('zh-CN')
    });
    state.history = state.history.slice(0, 30);
    if (riskPositionId === id) { riskPositionId = null; riskPaused = false; }
    if (liquidated) {
      if (window.FXAudio) FXAudio.blow();
      unlock('first-blowup');
      if (pos.borrowed) unlock('finger-support');
      if (pos.refusedHelp) unlock('just-kill-me');
    } else {
      if (window.FXAudio) (pnl >= 0 ? FXAudio.win() : FXAudio.lose());
      if (pnl > 0) unlock('honest-work');
    }
    checkEquityAchievements();
    trackPeak();
    maybeContractGoal();
    save();
    if (state.mode === 'challenge') scheduleChallengeSave();
    emit();
    if (meta.trigger === 'stop') narrate('止损触发。系统替你按了。');
    else if (meta.trigger === 'take') narrate('止盈触发。难得。');
    else if (liquidated) narrate('落地。姿势一般，节目效果满分。');
    else if (pnl > 0) narrate('赚钱了。比亏损更危险的是，你开始觉得自己行了。');
    else narrate('亏损平仓。至少你还有「重新开始」。');
    const bankruptNow = !state.positions.length && state.mode !== 'challenge' && (state.cash < 0 || account().equity <= 0);
    if (bankruptNow) {
      checkBankruptcy();
    } else {
      ui('showCloseModal', {
        liquidated: !!liquidated,
        pnl,
        pair: pos.pair,
        side: pos.side,
        cash: state.cash,
        margin: pos.margin,
        leverage: pos.leverage,
        trigger: meta.trigger || null,
        triggerPrice: meta.triggerPrice ?? null,
        stopPrice: pos.stopPrice,
        takePrice: pos.takePrice
      });
    }
  }

  function partialClose(id, fraction) {
    if (state.runClosed) { toast('本局已收手，不能再平仓。'); return false; }
    const pos = state.positions.find(p => p.id === id);
    const f = Number(fraction);
    if (!pos || !Number.isFinite(f) || f <= 0) return false;
    if (f >= 0.999) { closePosition(id, false); return true; }
    const released = pos.margin * f;
    const pnl = positionPnl(pos) * f;
    state.cash += released + pnl;
    pos.margin -= released;
    pos.notional *= (1 - f);
    state.history.unshift({
      pair: pos.pair, side: pos.side, pnl, liquidated: false,
      partial: true, fraction: f, time: new Date().toLocaleDateString('zh-CN')
    });
    state.history = state.history.slice(0, 30);
    checkEquityAchievements();
    trackPeak();
    maybeContractGoal();
    save();
    if (state.mode === 'challenge') scheduleChallengeSave();
    emit();
    toast(`已平掉 ${Math.round(f * 100)}%：本段盈亏 ${D.signedMoney(pnl)}，剩余保证金 ${D.money(pos.margin)}。`);
    return true;
  }

  function settleAllPositions() {
    [...state.positions].forEach(pos => {
      const pnl = positionPnl(pos);
      state.cash += pos.margin + pnl;
      state.history.unshift({ pair: pos.pair, side: pos.side, pnl, liquidated: false, time: new Date().toLocaleDateString('zh-CN') });
    });
    state.positions = [];
    state.history = state.history.slice(0, 30);
  }

  function caseSummary(reason) {
    const a = account();
    const peak = Math.max(Number(state.peakEquity) || 10000, a.equity);
    const contract = contractStatus();
    const ending = resolveEnding();
    return {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      mode: state.mode,
      reason,
      equity: Math.round(a.equity * 100) / 100,
      peak: Math.round(peak * 100) / 100,
      drawdown: Math.round(Math.max(0, peak - a.equity) * 100) / 100,
      debt: Math.round(state.debt * 100) / 100,
      airborneLine: airborneThreshold(),
      lastOneCount: state.lastOneCount || 0,
      diagnosis: diagnosis(),
      safety: state.mode === 'challenge' ? 'standard' : (settings.difficulty || 'standard'),
      contractId: state.contract ? state.contract.id : null,
      contractTitle: state.contract && state.contract.id !== 'free' ? state.contract.title : null,
      contractDone: !!(contract && contract.complete),
      contractTrades: state.contract ? (state.contract.trades || 0) : 0,
      contractGoal: state.contract ? state.contract.goalText : null,
      endingId: ending ? ending.id : null,
      endingTitle: ending ? ending.title : null,
      endingText: ending ? ending.text : null,
      events: state.contract ? (state.contract.eventLog || []) : [],
      flags: state.contract ? (state.contract.flags || {}) : {},
      grade: contractGrade(),
      trades: state.history.length,
      liquidations: state.history.filter(item => item.liquidated).length
    };
  }

  function saveCase(summary) {
    try {
      if (summary.endingId) recordEnding(summary);
      const cases = JSON.parse(localStorage.getItem(CASES_KEY) || '[]') || [];
      cases.unshift(summary);
      localStorage.setItem(CASES_KEY, JSON.stringify(cases.slice(0, 30)));
    } catch (_) {}
  }

  function recordEnding(summary) {
    try {
      const seen = JSON.parse(localStorage.getItem(ENDINGS_KEY) || '{}') || {};
      seen[summary.endingId] = { date: summary.date || new Date().toISOString(), title: summary.endingTitle || '' };
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(seen));
    } catch (_) {}
  }

  function getEndings() {
    try {
      const seen = JSON.parse(localStorage.getItem(ENDINGS_KEY) || '{}') || {};
      getCases().forEach(item => {
        if (item.endingId && !seen[item.endingId]) {
          seen[item.endingId] = { date: item.date || new Date().toISOString(), title: item.endingTitle || '' };
        }
      });
      return seen && typeof seen === 'object' ? seen : {};
    } catch (_) {
      return {};
    }
  }

  function getCases() {
    try {
      const cases = JSON.parse(localStorage.getItem(CASES_KEY) || '[]');
      return Array.isArray(cases) ? cases : [];
    } catch (_) {
      return [];
    }
  }

  function clearCases() {
    try { localStorage.removeItem(CASES_KEY); } catch (_) {}
  }

  function cashOut() {
    if (state.mode === 'challenge') { finishChallenge(); return false; }
    if (state.runClosed) return false;
    if (!state.positions.length && !state.history.length) {
      toast('本局还没开始，先开一笔再收手。');
      return false;
    }
    settleAllPositions();
    state.runClosed = true;
    state.closeReason = 'cashout';
    autoPlay = false;
    riskPaused = false;
    riskPositionId = null;
    trackPeak();
    const summary = caseSummary('cashout');
    saveCase(summary);
    save();
    emit();
    narrate('收手离场。你居然真的走了。');
    ui('showSettlementModal', summary);
    return true;
  }

  function checkBankruptcy(show = true) {
    if (state.runClosed || state.mode === 'challenge' || state.positions.length) return null;
    const a = account();
    if (state.cash >= 0 && a.equity > 0) return null;
    state.runClosed = true;
    state.closeReason = 'bankrupt';
    autoPlay = false;
    riskPaused = false;
    riskPositionId = null;
    trackPeak();
    const summary = caseSummary('bankrupt');
    saveCase(summary);
    save();
    emit();
    if (show) ui('showSettlementModal', summary);
    return summary;
  }

  function checkStops() {
    if (riskPaused) return;
    for (const pos of [...state.positions]) {
      const price = currentPrice(pos.pair);
      if (!Number.isFinite(price)) continue;
      let trigger = null;
      if (pos.stopPrice != null && (pos.side === 1 ? price <= pos.stopPrice : price >= pos.stopPrice)) trigger = 'stop';
      if (!trigger && pos.takePrice != null && (pos.side === 1 ? price >= pos.takePrice : price <= pos.takePrice)) trigger = 'take';
      if (!trigger) continue;
      autoPlay = false;
      closePosition(pos.id, false, { trigger, triggerPrice: price });
      if (state.runClosed) break;
    }
  }

  function checkRisk() {
    if (riskPaused) return;
    for (const pos of [...state.positions]) {
      const ratio = riskRatio(pos);
      if (ratio < 0.55) pos.warned = false;
      if (ratio >= 0.6 && !pos.warned) {
        pos.warned = true;
        riskPaused = true;
        autoPlay = false;
        riskPositionId = pos.id;
        save();
        if (window.FXAudio) FXAudio.alarm();
        const suggested = Math.max(1, Math.ceil(-positionPnl(pos) / 0.55 - pos.margin));
        ui('openRiskModal', { position: pos, ratio, suggested });
        return;
      }
      if (ratio >= 0.8) closePosition(pos.id, true);
    }
  }

  function resolveRisk(skipPenalty = false) {
    const pos = state.positions.find(p => p.id === riskPositionId);
    riskPaused = false;
    riskPositionId = null;
    if (pos && !marginHelpDone && !skipPenalty) {
      pos.refusedHelp = true;
      narrate('「暂不处理」。翻译：交给命运。');
    }
    marginHelpDone = false;
    if (pos && riskRatio(pos) >= 0.8) closePosition(pos.id, true);
    else { checkStops(); checkRisk(); }
    save();
    emit();
  }

  function addMargin(amount, borrow) {
    if (state.runClosed) { toast('本局已收手。'); return false; }
    const pos = state.positions.find(p => p.id === riskPositionId);
    const value = Number(amount);
    const available = borrow ? LOAN_MAX : state.cash;
    if (!pos || !Number.isFinite(value) || value < 1 || value > available + 0.001) {
      toast(borrow ? '借款补仓金额应为 $1–$200,000。' : '补仓金额不能超过可用余额。');
      return false;
    }
    if (borrow && state.debt > 0) { toast('请先偿还当前贷款，才能再次借入。'); return false; }
    marginHelpDone = true;
    if (borrow) {
      if (!borrowLoan(value, pos)) return false;
      pos.borrowed = true;
    } else {
      state.cash = Math.max(0, state.cash - value);
      pos.margin += value;
    }
    pos.warned = true;
    save();
    emit();
    toast(`${borrow ? '已借款' : '已追加'} ${D.money(value)} 至 ${pos.pair} 保证金。`);
    if (!borrow) narrate('再补一点就能翻本——赌狗圣经第一章。');
    return true;
  }

  function borrowLoan(amount, position) {
    const value = Number(amount);
    if (state.runClosed) { toast('本局已收手，不能再借钱。'); return false; }
    if (state.mode === 'challenge') return false;
    if (isSafe()) { toast('安全网不开放贷款。'); return false; }
    if (contractNoLoans()) { toast('这份合同不开放借款。'); return false; }
    if (!Number.isFinite(value) || value < 1 || value > LOAN_MAX || state.debt > 0) return false;
    state.debt = value;
    state.loanPrincipal = value;
    state.loanRate = D.loanDailyRate(value);
    state.simLoanTicks = 0;
    if (position) position.margin += value;
    else state.cash += value;
    if (state.loanPrincipal >= 100000) unlock('sorry-family');
    save(); emit();
    narrate('借钱加仓。熟悉的配方。');
    return true;
  }

  function accrueLoanInterest() {
    if (state.debt <= 0) return;
    state.debt = Math.round((state.debt + Math.round(state.debt * state.loanRate * 100) / 100) * 100) / 100;
  }

  function revengeTrade(side, margin, leverage) {
    if (state.runClosed) { toast('本局已收手。'); return null; }
    if (isSafe()) { toast('安全网不提供「最后一次」。'); return null; }
    state.lastOneCount = Math.max(0, Math.floor(Number(state.lastOneCount) || 0)) + 1;
    state.margin = Math.max(10, Number(margin) || state.margin);
    state.leverage = Math.max(1, Math.min(100, Number(leverage) || state.leverage));
    save(); emit();
    if (state.lastOneCount >= 10) unlock('last-word');
    narrate(`第 ${state.lastOneCount} 次「最后一次」。`);
    const position = openPosition(side, true);
    if (!position) narrate('连回本的钱都不够了。');
    return position;
  }

  function repayLoan(amount) {
    const value = Number(amount);
    const max = Math.min(state.debt, state.cash);
    if (!Number.isFinite(value) || value < 0.01 || value > max + 0.001) return false;
    state.cash = Math.max(0, state.cash - value);
    state.debt = Math.max(0, state.debt - value);
    if (state.debt < 0.005) {
      state.debt = 0; state.loanPrincipal = 0; state.loanRate = 0; state.simLoanTicks = 0;
    }
    save(); emit();
    maybeContractGoal();
    return true;
  }

  /* ---------- 模拟行情 ---------- */
  function triggerSimNews(preferredId = null) {
    let template = preferredId ? SIM_NEWS.find(item => item.id === preferredId) : null;
    if (!template) {
      const breaking = SIM_NEWS.filter(item => item.kind === 'breaking' && item.bias?.[state.pair] && !activeSimNews.some(event => event.id === item.id));
      const hasBreaking = activeSimNews.some(event => event.kind === 'breaking');
      if (breaking.length && !hasBreaking && Math.random() < 0.18) {
        template = breaking[Math.floor(Math.random() * breaking.length)];
      } else {
        const available = SIM_NEWS.filter(item => item.kind !== 'breaking' && item.kind !== 'flavor' && !item.chainOnly && !activeSimNews.some(event => event.title === item.title));
        const rare = available.filter(item => item.rare);
        template = rare.length && Math.random() < 0.12
          ? rare[Math.floor(Math.random() * rare.length)]
          : available[Math.floor(Math.random() * available.length)];
      }
    }
    if (!template || (template.id && activeSimNews.some(event => event.id === template.id))) return;
    const duration = Number(template.duration) || 16 + Math.floor(Math.random() * 12);
    activeSimNews.push({
      ...template,
      id: template.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      remaining: duration,
      duration,
      volatility: Number(template.volatility) || 1.3
    });
    if (activeSimNews.length > 3) activeSimNews.shift();
    const range = NEWS_FREQ_TICKS[settings.newsFreq] || NEWS_FREQ_TICKS.mid;
    simNewsTicks = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    pushNews({
      tag: template.tag, title: template.title, body: template.body,
      quote: template.quote || '', tone: template.tone || '', rare: !!template.rare, kind: template.kind || '',
      date: '模拟事件'
    });
  }

  function seedActiveNews() {
    if (!settings.newsOn || activeSimNews.length || (state.mode !== 'sim' && !challenge.active)) return;
    const memes = SIM_NEWS.filter(template => template.tone === 'meme' && template.kind !== 'flavor' && !template.chainOnly);
    const pick = memes[Math.floor(Math.random() * memes.length)];
    triggerSimNews(pick ? pick.id : null);
  }

  function triggerFlavorNews() {
    const recent = new Set((newsFeed || []).slice(0, 5).map(item => item.title));
    const pool = SIM_NEWS.filter(item => item.kind === 'flavor' && !recent.has(item.title));
    const pick = (pool.length ? pool : SIM_NEWS.filter(item => item.kind === 'flavor'))[Math.floor(Math.random() * (pool.length || 1))];
    if (!pick) return;
    simFlavorTicks = 12 + Math.floor(Math.random() * 14);
    pushNews({
      tag: pick.tag || '整活', title: pick.title, body: pick.body,
      quote: pick.quote || '', tone: 'flavor', kind: 'flavor', date: '生活'
    });
  }

  function seedFlavorNews() {
    if (settings.newsOn && (state.mode === 'sim' || challenge.active)) triggerFlavorNews();
  }

  function tickMarket(market, marketIndex) {
    PAIRS.forEach((pair, index) => {
      const s = market[pair.id];
      if (!s) return;
      const open = s.price;
      const drift = Math.sin(Date.now() / 13000 + index * 2 + marketIndex * 0.7) * 0.00036;
      let eventBias = 0;
      let volatility = 1;
      const marketEvents = settings.newsOn ? activeSimNews : [];
      marketEvents.forEach(event => {
        if (event.tone === 'meme') {
          volatility += Math.max(0, (Number(event.volatility) || 1.3) - 1);
          return;
        }
        eventBias += (event.bias?.[pair.id] || 0) * (0.55 + Math.random() * 0.9);
        volatility += Math.max(0, (Number(event.volatility) || 1.3) - 1);
      });
      eventBias = Math.max(-0.0025, Math.min(0.0025, eventBias));
      volatility = Math.min(2.8, volatility);
      const shock = Math.random() < 0.018 * volatility ? (Math.random() - 0.5) * 0.019 : 0;
      const close = Math.max(open * 0.5, open * (1 + drift + (Math.random() - 0.5) * 0.0042 * volatility + shock + eventBias));
      const wick = open * (Math.random() * 0.0007 + 0.00015);
      s.candles.push({ open, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, close });
      if (s.candles.length > 150) s.candles.shift();
      s.price = close;
    });
  }

  function tick() {
    tickMarket(sim, 0);
    tickMarket(challengeSim, 1);
    if (state.mode === 'sim' || state.mode === 'challenge') {
      if (settings.newsOn && (state.mode === 'sim' || challenge.active) && --simNewsTicks <= 0) triggerSimNews();
      if (settings.newsOn && (state.mode === 'sim' || challenge.active) && --simFlavorTicks <= 0) triggerFlavorNews();
      if (activeSimNews.length) {
        const expired = [];
        activeSimNews = activeSimNews.filter(event => {
          event.remaining -= 1;
          if (event.remaining <= 0) { expired.push(event); return false; }
          return true;
        });
        if (settings.newsOn) {
          expired.forEach(event => {
            if (event.followUp && Math.random() < 0.7) triggerSimNews(event.followUp);
          });
        }
      }
      if (state.mode === 'sim' && state.debt > 0 && ++state.simLoanTicks >= 20) {
        state.simLoanTicks = 0;
        accrueLoanInterest();
      }
      state.positions.forEach(pos => {
        if (positionPnl(pos) < 0) {
          pos.loseMs = (pos.loseMs || 0) + D.SIM_TICK_MS;
          if (pos.loseMs >= 3 * 60 * 1000) unlock('never-sell');
        }
      });
      if (++simTickCount % 20 === 0) {
        state.equityTrail.push(Math.round(account().equity * 100) / 100);
        if (state.equityTrail.length > 120) state.equityTrail = state.equityTrail.slice(-120);
        save();
      }
      checkEquityAchievements();
      trackPeak();
      maybeContractGoal();
      checkStops();
      checkRisk();
      checkBankruptcy();
      emit();
      if (state.mode === 'challenge') scheduleChallengeSave();
    }
    if (autoPlay && (state.mode === 'real' || state.mode === 'battle')) nextDay();
  }

  /* ---------- 历史数据 ---------- */
  function defaultRealRange() {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 364);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  function normalizeRealRange(range) {
    let { start, end } = range || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
    if (start > end) [start, end] = [end, start];
    const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
    if (days > REAL_MAX_SPAN) {
      start = new Date(Date.parse(`${end}T00:00:00Z`) - (REAL_MAX_SPAN - 1) * 86400000).toISOString().slice(0, 10);
      toast(`区间超过 ${REAL_MAX_SPAN} 天，已调整为 ${start} → ${end}。`);
    }
    return { start, end };
  }

  async function requestJson(url, timeout = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchFrankfurter(path, attempts = 3) {
    let lastError = null;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt) {
        real.loadingText = `正在读取历史汇率…（自动重试 ${attempt}/${attempts - 1}）`;
        emit();
        await new Promise(resolve => setTimeout(resolve, 700 * attempt));
      }
      try {
        return await requestJson(`https://api.frankfurter.dev/v1${path}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('网络错误');
  }

  function parseFrankfurter(data) {
    return Object.entries(data.rates || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rate]) => {
        if (!['USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'].every(key => Number.isFinite(rate[key]) && rate[key] > 0)) return null;
        return {
          date,
          prices: {
            'EUR/USD': rate.USD, 'GBP/USD': rate.USD / rate.GBP, 'USD/JPY': rate.JPY / rate.USD,
            'USD/CHF': rate.CHF / rate.USD, 'EUR/CHF': rate.CHF, 'AUD/USD': rate.USD / rate.AUD,
            'USD/CAD': rate.CAD / rate.USD
          }
        };
      })
      .filter(Boolean);
  }

  function chunkRange(start, end, days = 120) {
    const chunks = [];
    let cursor = start;
    while (cursor <= end) {
      const chunkEnd = new Date(Math.min(Date.parse(`${cursor}T00:00:00Z`) + (days - 1) * 86400000, Date.parse(`${end}T00:00:00Z`))).toISOString().slice(0, 10);
      chunks.push([cursor, chunkEnd]);
      cursor = new Date(Date.parse(`${chunkEnd}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
    }
    return chunks;
  }

  async function fetchHistory(start, end) {
    const symbols = 'USD,GBP,JPY,CHF,AUD,CAD';
    const path = `/${start}..${end}?base=EUR&symbols=${symbols}`;
    try {
      return parseFrankfurter(await fetchFrankfurter(path));
    } catch (_) {}
    const chunks = chunkRange(start, end);
    const merged = [];
    for (let i = 0; i < chunks.length; i++) {
      real.loadingText = `正在读取历史汇率… ${i + 1}/${chunks.length} 段`;
      emit();
      merged.push(...parseFrankfurter(await fetchFrankfurter(`/${chunks[i][0]}..${chunks[i][1]}?base=EUR&symbols=${symbols}`, 2)));
    }
    const seen = new Set();
    return merged.filter(row => !seen.has(row.date) && seen.add(row.date)).sort((a, b) => a.date.localeCompare(b.date));
  }

  async function loadReal(range) {
    const target = normalizeRealRange(range || state.realRange || defaultRealRange());
    if (!target) { toast('请选择有效的起止日期。'); return false; }
    const key = `${target.start}~${target.end}`;
    if (real.items.length && state.realRangeKey === key) return true;
    real.loading = true;
    real.error = '';
    real.loadingText = '正在读取历史汇率…';
    emit();
    const request = ++requestCounter;
    try {
      const items = await fetchHistory(target.start, target.end);
      if (request !== requestCounter || state.mode !== 'real') return false;
      if (items.length < 15) throw new Error('历史数据不足');
      real = { items, cursor: 0, loading: false, error: '', loadingText: '', tf: real.tf || '1d' };
      state.realRange = target;
      state.realRangeKey = key;
      const progressDate = state.realProgress?.[key];
      const savedCursor = progressDate ? items.findIndex(item => item.date === progressDate) : -1;
      real.cursor = savedCursor >= 0 ? savedCursor : Math.min(29, items.length - 1);
      state.lastRealDate = items[real.cursor].date;
      save(); emit();
      return true;
    } catch (error) {
      if (request !== requestCounter || state.mode !== 'real') return false;
      real.loading = false;
      real.error = error?.name === 'AbortError' ? '请求超时' : (error?.message || '网络错误');
      real.loadingText = '';
      emit();
      toast(`真实历史数据读取失败（${real.error}），请重试。`);
      return false;
    }
  }

  async function applyRealRange(range) {
    const normalized = normalizeRealRange(range);
    if (!normalized) { toast('请选择有效的起止日期。'); return; }
    if (state.positions.length) { toast('真实数据账户仍有持仓，请先平仓再更换区间。'); return; }
    autoPlay = false;
    const ok = await loadReal(normalized);
    if (ok) toast(`已载入 ${real.items.length} 个交易日（${normalized.start} → ${normalized.end}）。`);
    emit();
  }

  /* ---------- 模式 ---------- */
  function activateMode(mode) {
    if (state.mode === mode) return;
    accounts[state.mode] = snapshot();
    state = { ...initialState(mode), ...(accounts[mode] || {}), mode };
    normalizeAccount();
  }

  async function setMode(mode) {
    if (mode === 'challenge') { await enterChallenge(); return; }
    if (mode === 'battle') { battlePickerOpen = true; emit(); return; }
    battlePickerOpen = false;
    if (state.mode === mode) {
      if (mode === 'real' && !real.items.length && !real.loading) await loadReal(state.realRange || defaultRealRange());
      emit();
      return;
    }
    autoPlay = false;
    battleRequestCounter++;
    activateMode(mode);
    if (mode === 'real') {
      const ok = await loadReal(state.realRange || defaultRealRange());
      if (ok) state.lastRealDate = real.items[real.cursor].date;
      save();
      emit();
      toast(ok ? '已切换为真实历史汇率回放。' : '未能读取真实数据，请重试或更换区间。');
      return;
    }
    save(); emit();
    toast('已切换为模拟数据行情。');
  }

  async function selectBattle(id, resume = false) {
    const item = BATTLES.find(candidate => candidate.id === id);
    if (!item) return;
    const existing = state.mode === 'battle'
      ? { battleId: state.battleId, positions: state.positions, lastBattleDate: state.lastBattleDate }
      : (accounts.battle || {});
    if (existing.positions?.length && existing.battleId && existing.battleId !== id) {
      toast('经典战役账户仍有持仓，请先平仓再更换档案。');
      return;
    }
    const autoResume = !!(existing.positions?.length && existing.battleId === id);
    const previousMode = state.mode;
    const previousBattle = battle;
    autoPlay = false;
    battlePickerOpen = false;
    activateMode('battle');
    const resumeDate = (resume || autoResume || state.battleId === id) ? state.lastBattleDate : null;
    state.battleId = id;
    state.pair = item.pair;
    const request = ++battleRequestCounter;
    battle = { items: [], cursor: 0, loading: true, error: '', id, tf: '1d', shownNews: [], endNotified: false };
    emit();
    try {
      const items = await fetchHistory(item.start, item.end);
      if (request !== battleRequestCounter) return;
      const eventIndex = items.findIndex(row => row.date >= item.event);
      if (items.length < 15 || eventIndex < 2) throw new Error('战役历史数据不足');
      const savedCursor = resumeDate ? items.findIndex(row => row.date === resumeDate) : -1;
      battle = { items, cursor: savedCursor >= 0 ? savedCursor : Math.min(14, items.length - 1), loading: false, error: '', id, tf: '1d', shownNews: [], endNotified: false };
      state.lastBattleDate = items[battle.cursor].date;
      save(); emit();
      checkStops();
      checkRisk();
      checkBankruptcy();
      triggerBattleNews();
      toast(`${item.title} 已就绪，从事件前数周开始回放。`);
    } catch (error) {
      if (request !== battleRequestCounter) return;
      battle = previousMode === 'battle' ? previousBattle : { items: [], cursor: 0, loading: false, error: error.message || '网络错误', id: null, tf: '1d', shownNews: [], endNotified: false };
      activateMode(previousMode);
      battlePickerOpen = true;
      emit();
      toast(`战役数据读取失败（${error?.message || '网络错误'}），请稍后重试。`);
    }
  }

  function triggerBattleNews() {
    if (state.mode !== 'battle' || !battle.items.length) return;
    const item = BATTLES.find(candidate => candidate.id === state.battleId);
    const date = battle.items[battle.cursor]?.date;
    if (!item || !date) return;
    battle.shownNews ||= [];
    item.news.filter(news => news.date <= date && !battle.shownNews.includes(news.date)).forEach(news => {
      battle.shownNews.push(news.date);
      pushNews({ tag: news.tag, title: news.title, body: news.body, date: news.date });
    });
  }

  function checkBattleAchievements(row) {
    if (state.mode === 'battle' && state.battleId === 'franc-2015' && row?.date >= '2015-01-15') unlock('black-swan');
  }

  function nextDay() {
    if (state.runClosed) return;
    if (riskPaused || state.mode === 'sim' || state.mode === 'challenge') return;
    const s = series();
    if (!s || s.loading || s.cursor >= s.items.length - 1) { autoPlay = false; emit(); return; }
    s.cursor++;
    accrueLoanInterest();
    if (state.mode === 'battle') state.lastBattleDate = s.items[s.cursor].date;
    else {
      state.lastRealDate = s.items[s.cursor].date;
      if (state.realRangeKey) state.realProgress[state.realRangeKey] = state.lastRealDate;
    }
    state.positions.forEach(pos => {
      if (positionPnl(pos) < 0) {
        pos.loseDays = (pos.loseDays || 0) + 1;
        if (pos.loseDays >= 15) unlock('never-sell');
      }
    });
    const row = s.items[s.cursor], prevRow = s.items[s.cursor - 1];
    if ((s.tf || '1d') === '1d' && row && prevRow) {
      const move = row.prices[state.pair] / prevRow.prices[state.pair] - 1;
      if (Math.abs(move) >= 0.015) toast(`⚡ ${row.date} ${state.pair} 单日波动 ${D.pct(move * 100)}`);
    }
    checkBattleAchievements(row);
    state.equityTrail.push(Math.round(account().equity * 100) / 100);
    if (state.equityTrail.length > 120) state.equityTrail = state.equityTrail.slice(-120);
    checkEquityAchievements();
    trackPeak();
    checkStops();
    checkRisk();
    checkBankruptcy();
    save(); emit();
    if (state.mode === 'battle') triggerBattleNews();
    if (s.cursor >= s.items.length - 1) {
      autoPlay = false;
      emit();
      if (state.mode === 'battle' && !s.endNotified) {
        s.endNotified = true;
        ui('openModal', {
          icon: '✦', title: '这场战役回放结束',
          message: '你可以平掉剩余持仓，随后选择下一份事故档案。',
          detail: `当前账户总权益 ${D.money(account().equity)}`
        });
      } else if (state.mode === 'real') {
        const firstPrice = real.items[0]?.prices[state.pair];
        const lastPrice = real.items[real.items.length - 1]?.prices[state.pair];
        const buyHold = firstPrice && lastPrice ? (lastPrice / firstPrice - 1) * 100 : 0;
        const mine = (account().equity - 10000) / 10000 * 100;
        ui('openModal', {
          icon: '✦', title: '回放到最后一个交易日',
          message: `区间 ${real.items[0].date} → ${real.items[real.items.length - 1].date} 回放完毕。`,
          detail: `你的收益 ${D.pct(mine)}\n买入持有对照 ${D.pct(buyHold)}`, preline: true
        });
      }
    }
  }

  function replay() {
    if (state.positions.length) { toast('请先平掉当前持仓，再回到起点。'); return; }
    if (state.mode === 'sim' || state.mode === 'challenge') return;
    const s = series();
    if (!s || !s.items.length) return;
    autoPlay = false;
    s.cursor = 0;
    s.endNotified = false;
    s.shownNews = [];
    if (state.mode === 'battle') { state.lastBattleDate = s.items[0].date; triggerBattleNews(); }
    else {
      state.lastRealDate = s.items[0].date;
      if (state.realRangeKey) state.realProgress[state.realRangeKey] = state.lastRealDate;
    }
    save(); emit();
    toast('已回到回放起点。');
  }

  function setCursor(index) {
    const s = series();
    if (!s || !s.items.length) return;
    const target = Math.max(0, Math.min(s.items.length - 1, Number(index) || 0));
    if (target === s.cursor) return;
    autoPlay = false;
    if (target > s.cursor) {
      for (let i = s.cursor; i < target; i++) accrueLoanInterest();
    }
    s.cursor = target;
    if (state.mode === 'battle') state.lastBattleDate = s.items[target].date;
    else {
      state.lastRealDate = s.items[target].date;
      if (state.realRangeKey) state.realProgress[state.realRangeKey] = state.lastRealDate;
    }
    if (state.mode === 'battle') {
      const row = s.items[target];
      if (row) checkBattleAchievements(row);
      triggerBattleNews();
    }
    trackPeak();
    emit();
    checkStops();
    checkRisk();
    checkBankruptcy();
  }

  function setTimeframe(tf) {
    if (!['1d', '1w', '1M'].includes(tf)) return;
    const s = series();
    if (!s) return;
    s.tf = tf;
    emit();
  }

  function setPair(pair) {
    if (!PAIRS.some(p => p.id === pair)) return;
    if (state.mode === 'battle' && pair !== state.pair) return;
    state.pair = pair;
    save(); emit();
  }

  function setMargin(value) {
    state.margin = Math.max(0, Number(value) || 0);
    save();
  }

  function setLeverage(value) {
    const cap = maxLeverage();
    const next = Math.max(1, Math.min(cap, Math.round(Number(value) || 20)));
    if (Number(value) > cap) {
      toast(isContractActive() && state.contract.leverageCap
        ? `这份合同杠杆最高 ${cap}×。`
        : '安全网最高 20×；想加杠杆，先撤掉安全网。');
    }
    state.leverage = next;
    save();
  }

  function setDifficulty(mode) {
    if (!['safe', 'standard'].includes(mode)) return false;
    if (state.positions.length) { toast('还有持仓，平仓后再切换安全措施。'); return false; }
    if (settings.difficulty === mode) return true;
    saveSettings({ difficulty: mode });
    if (isSafe() && state.leverage > 20) {
      state.leverage = 20;
      save();
      emit();
    }
    narrate(mode === 'safe' ? '安全网已就位。摔下来不会死，但会很难看。' : '安全网已撤走。祝你好运。');
    return true;
  }

  function maxMargin() {
    const multiplier = 1 + state.leverage * (0.00005 + state.leverage * 0.000005);
    state.margin = Math.max(0, Math.floor(state.cash / multiplier * 100) / 100);
    save();
    emit();
  }

  /* ---------- 每日挑战 ---------- */
  function challengeMeta() {
    try { return JSON.parse(localStorage.getItem(CH_KEY) || 'null'); } catch (_) { return null; }
  }

  function saveChallengeMeta() {
    try {
      localStorage.setItem(CH_KEY, JSON.stringify({ date: challenge.date, remaining: challenge.remaining, active: challenge.active }));
    } catch (_) {}
  }

  function compactChallengeState() {
    return {
      c: Math.round(state.cash * 100) / 100,
      p: state.positions.slice(0, 5).map(pos => [pos.pair, pos.side, pos.entry, pos.margin, pos.leverage, pos.notional, pos.fee || 0, pos.stopPrice ?? null, pos.takePrice ?? null]),
      q: state.pair, l: state.leverage, m: state.margin,
      o: state.lastOneCount || 0, e: state.peakEquity || 10000,
      r: PAIRS.map(pair => Math.round((challengeSim[pair.id]?.price || pair.initial) * 100000) / 100000)
    };
  }

  function saveChallengeLocal() {
    try {
      if (challenge.active && state.mode === 'challenge') localStorage.setItem(CH_STATE_KEY, JSON.stringify(compactChallengeState()));
      else if (!challenge.active) localStorage.removeItem(CH_STATE_KEY);
    } catch (_) {}
  }

  function scheduleChallengeSave() {
    if (state.mode !== 'challenge' || !challenge.active) return;
    clearTimeout(challengeSaveTimer);
    challengeSaveTimer = setTimeout(saveChallengeLocal, 700);
  }

  function hydrateChallengeState(data) {
    if (!data || !Number.isFinite(data.c)) return;
    const restored = initialState('challenge');
    restored.cash = data.c;
    restored.pair = PAIRS.some(pair => pair.id === data.q) ? data.q : 'EUR/USD';
    restored.leverage = Math.max(1, Math.min(100, Number(data.l) || 20));
    restored.margin = Math.max(10, Number(data.m) || 500);
    restored.lastOneCount = Math.max(0, Math.floor(Number(data.o) || 0));
    restored.peakEquity = Math.max(10000, Number(data.e) || 10000);
    restored.positions = Array.isArray(data.p) ? data.p.slice(0, 5).map((pos, index) => ({
      id: `challenge-${Date.now()}-${index}`, pair: pos[0], side: pos[1], entry: pos[2], margin: pos[3],
      leverage: pos[4], notional: pos[5], fee: pos[6] || 0, warned: false, borrowed: false,
      stopPrice: Number.isFinite(Number(pos[7])) && Number(pos[7]) > 0 ? Number(pos[7]) : null,
      takePrice: Number.isFinite(Number(pos[8])) && Number(pos[8]) > 0 ? Number(pos[8]) : null,
      loseMs: 0, loseDays: 0, opened: '恢复存档'
    })).filter(pos => PAIRS.some(pair => pair.id === pos.pair) && Number.isFinite(pos.entry)) : [];
    accounts.challenge = { ...restored };
    if (state.mode === 'challenge') state = { ...restored };
    seedChallengeSim();
    if (Array.isArray(data.r)) PAIRS.forEach((pair, index) => {
      const price = Number(data.r[index]);
      if (!Number.isFinite(price) || price <= 0) return;
      const s = challengeSim[pair.id];
      const last = s.candles[s.candles.length - 1];
      last.close = price;
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      s.price = price;
    });
  }

  function loadChallengeLocal() {
    const meta = challengeMeta();
    let savedState = null;
    try { savedState = JSON.parse(localStorage.getItem(CH_STATE_KEY) || 'null'); } catch (_) {}
    if (meta && meta.date === todayKey()) {
      challenge.date = meta.date;
      challenge.remaining = Math.max(0, Math.min(3, Number(meta.remaining) || 0));
      challenge.active = !!meta.active;
      challengeStateSaved = challenge.active ? savedState : null;
    } else {
      challenge = { ...challenge, date: todayKey(), remaining: 3, active: false };
      challengeStateSaved = null;
      accounts.challenge = null;
      try { localStorage.removeItem(CH_STATE_KEY); } catch (_) {}
    }
    challenge.loaded = true;
    saveChallengeMeta();
  }

  function refreshChallengeDay() {
    if (challenge.date === todayKey()) return false;
    challenge = { ...challenge, date: todayKey(), remaining: 3, active: false };
    challengeStateSaved = null;
    accounts.challenge = null;
    try { localStorage.removeItem(CH_STATE_KEY); } catch (_) {}
    if (state.mode === 'challenge') {
      state = initialState('challenge');
      seedChallengeSim();
    }
    saveChallengeMeta();
    return true;
  }

  async function enterChallenge() {
    battlePickerOpen = false;
    autoPlay = false;
    battleRequestCounter++;
    refreshChallengeDay();
    activateMode('challenge');
    emit();
    if (challenge.active && challengeStateSaved) {
      hydrateChallengeState(challengeStateSaved);
      challengeStateSaved = null;
    }
    save(); emit();
    if (challenge.active) toast('已恢复今天尚未结束的挑战。');
  }

  function startChallenge() {
    if (!challenge.loaded) return toast('挑战记录仍在读取，请稍候。');
    refreshChallengeDay();
    if (challenge.active) return;
    if (challenge.remaining <= 0) return toast('今天的三次挑战机会已经用完。');
    state = initialState('challenge');
    accounts.challenge = null;
    seedChallengeSim();
    challenge.remaining--;
    challenge.active = true;
    saveChallengeMeta();
    save(); emit();
    ui('openModal', {
      icon: '⚑', title: '今日病例已建档',
      message: '初始本金 $10,000，不开放贷款。三次机会，随便你怎么用。',
      detail: `今日剩余机会 ${challenge.remaining} 次`
    });
    narrate('今日三次机会。你打算用几次？');
  }

  function leaderboard() {
    const today = todayKey();
    let recorded = [];
    try { recorded = (JSON.parse(localStorage.getItem(BOARD_KEY) || 'null') || {})[today] || []; } catch (_) {}
    const names = ['韭菜盒子', '瑞郎幸存者', '东京对冲客', '最后一次', '满仓哥', '摸鱼交易员', '回本路上', '外汇老登'];
    const bots = names.map((name, index) => {
      let seed = 2166136261;
      const key = `${today}|${name}`;
      for (let i = 0; i < key.length; i++) { seed ^= key.charCodeAt(i); seed = Math.imul(seed, 16777619); }
      const value = ((seed >>> 0) % 10000) / 10000;
      const profit = Math.round((value - 0.42) * 16000 / 100) * 100;
      return { name, profit, bot: true };
    });
    recorded.forEach((profit, index) => bots.push({ name: index === 0 ? '我' : `我（第 ${index + 1} 次）`, profit, me: true, latest: index === recorded.length - 1 }));
    return bots.sort((a, b) => b.profit - a.profit);
  }

  function recordChallenge(profit) {
    try {
      const board = JSON.parse(localStorage.getItem(BOARD_KEY) || 'null') || {};
      board[todayKey()] = [...(board[todayKey()] || []), Math.round(profit * 100) / 100];
      Object.keys(board).slice(0, -14).forEach(key => delete board[key]);
      localStorage.setItem(BOARD_KEY, JSON.stringify(board));
    } catch (_) {}
  }

  function finishChallenge() {
    if (!challenge.active || state.mode !== 'challenge') return;
    [...state.positions].forEach(pos => {
      const pnl = positionPnl(pos);
      state.cash += pos.margin + pnl;
      state.history.unshift({ pair: pos.pair, side: pos.side, pnl, liquidated: false, time: new Date().toLocaleDateString('zh-CN') });
    });
    state.positions = [];
    state.history = state.history.slice(0, 30);
    const profit = state.cash - 10000;
    challenge.active = false;
    challengeStateSaved = null;
    saveChallengeMeta();
    recordChallenge(profit);
    unlock('retire');
    saveCase(caseSummary('challenge'));
    save(); emit();
    const rows = leaderboard();
    const rank = rows.findIndex(row => row.latest) + 1;
    ui('openModal', {
      icon: profit >= 0 ? '✦' : '♡', loss: profit < 0,
      title: '金盆洗手 · 挑战结束',
      message: '所有未平仓仓位已按当前价格结算，成绩已记入今日病历。',
      detail: `最终权益 ${D.money(state.cash)}\n挑战收益 ${D.signedMoney(profit)}\n今日排名 第 ${rank} 名\n诊断：${diagnosis()}`,
      preline: true
    });
    narrate('金盆洗手。真的假的？');
  }

  function showChallengeRank() {
    const rows = leaderboard();
    const rowsText = rows.slice(0, 10).map((row, index) => `${index + 1}. ${row.name}  ${D.signedMoney(row.profit)}`);
    const rank = rows.findIndex(row => row.latest) + 1;
    ui('openModal', {
      icon: '♛', title: '今日病历榜',
      message: '榜单每天重置；其他玩家为本地模拟对手。收益越高，病得越重。',
      detail: rowsText.join('\n') + (rank ? `\n\n我的排名：第 ${rank} 名` : '\n\n今天还没有提交成绩'),
      preline: true
    });
  }

  /* ---------- 重置 ---------- */
  function resetMode() {
    const mode = state.mode;
    if (mode === 'challenge' && challenge.active) { toast('挑战进行中不能重置，请选择金盆洗手完成结算。'); return false; }
    state = initialState(mode);
    accounts[mode] = null;
    if (mode === 'real') real = { items: [], cursor: 0, loading: false, error: '', loadingText: '', tf: '1d' };
    if (mode === 'battle') {
      battle = { items: [], cursor: 0, loading: false, error: '', id: null, tf: '1d', shownNews: [], endNotified: false };
      battlePickerOpen = true;
    } else battlePickerOpen = false;
    autoPlay = false;
    riskPaused = false;
    riskPositionId = null;
    requestCounter++;
    battleRequestCounter++;
    if (mode === 'sim') { savedSim = null; sim = buildMarket(); }
    if (mode === 'sim') { activeSimNews = []; seedActiveNews(); seedFlavorNews(); }
    save(); emit();
    toast('已清档。下次一定。');
    return true;
  }

  /* ---------- 图表数据 ---------- */
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 1000) / 1000;
  }

  function isoWeekKey(dateStr) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }

  function candleFromRows(rows, pair, tf) {
    const out = [];
    let open = rows.length ? rows[0].prices[pair] : NaN;
    let group = null;
    const push = candle => {
      if (!candle || !Number.isFinite(candle.open) || !Number.isFinite(candle.close)) return;
      const wick = Math.abs(candle.close) * (0.00035 + hashSeed(candle.key || candle.date || '') * 0.00095);
      out.push({ open: candle.open, close: candle.close, high: Math.max(candle.open, candle.close) + wick, low: Math.min(candle.open, candle.close) - wick, date: candle.date });
    };
    rows.forEach(row => {
      const price = row.prices[pair];
      if (!Number.isFinite(price)) return;
      if (tf === '1w' || tf === '1M') {
        const key = tf === '1w' ? isoWeekKey(row.date) : row.date.slice(0, 7);
        if (!group || group.key !== key) {
          if (group) push(group);
          group = { key, open, close: price, date: row.date };
        } else group.close = price;
      } else push({ open, close: price, date: row.date });
      open = price;
    });
    if (group) push(group);
    return out;
  }

  function chartData() {
    const playback = state.mode === 'real' || state.mode === 'battle';
    if (playback) {
      const s = series();
      if (!s || !s.items.length || s.loading) return { candles: [], dates: [], playback: true };
      const rows = s.items.slice(0, s.cursor + 1);
      const all = candleFromRows(rows, state.pair, s.tf || '1d');
      const candles = all.slice(-70);
      return { candles, dates: candles.map(c => c.date), playback: true };
    }
    const market = state.mode === 'challenge' ? challengeSim : sim;
    const candles = (market[state.pair]?.candles || []).slice(-54);
    return { candles, dates: [], playback: false };
  }

  function rangeStats() {
    if (state.mode !== 'real' || !real.items.length) return null;
    const prices = real.items.map(row => row.prices[state.pair]).filter(Number.isFinite);
    if (prices.length < 2) return null;
    const hi = Math.max(...prices), lo = Math.min(...prices);
    const change = (prices[prices.length - 1] / prices[0] - 1) * 100;
    return { high: hi, low: lo, amplitude: (hi / lo - 1) * 100, change };
  }

  function selectedBattle() { return BATTLES.find(item => item.id === state.battleId) || null; }

  /* ---------- 设置 ---------- */
  function setNickname(value) {
    const name = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || '大肥鱼';
    saveSettings({ nickname: name });
    return name;
  }

  function saveSettings(patch) {
    settings = { ...settings, ...(patch || {}) };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
    if (window.FXAudio) FXAudio.configure(settings);
    emit();
    return settings;
  }

  /* ---------- 事件 ---------- */
  let emitTimer = null;
  function emit() {
    if (emitTimer) return;
    emitTimer = setTimeout(() => {
      emitTimer = null;
      try { window.dispatchEvent(new CustomEvent('fx:update')); } catch (_) {}
    }, 0);
  }

  function init() {
    loadSave();
    loadChallengeLocal();
    seedSim();
    seedChallengeSim();
    seedActiveNews();
    seedFlavorNews();
    normalizeAccount();
    if (window.FXAudio) FXAudio.configure(settings);
    document.documentElement.dataset.theme = settings.theme;
    emit();
  }

  window.FXEngine = {
    init,
    get state() { return state; },
    get settings() { return settings; },
    get sim() { return sim; },
    get challengeSim() { return challengeSim; },
    get real() { return real; },
    get battle() { return battle; },
    get challenge() { return challenge; },
    get achievements() { return achievements; },
    get autoPlay() { return autoPlay; },
    get battlePickerOpen() { return battlePickerOpen; },
    get newsFeed() { return newsFeed; },
    get activeNews() { return (state.mode === 'sim' || challenge.active) ? activeSimNews : []; },
    setAutoPlay(value) { autoPlay = !!value; emit(); },
    setBattlePicker(value) { battlePickerOpen = !!value; emit(); },
    hasSavedGame() { try { return !!localStorage.getItem(SAVE_KEY); } catch (_) { return false; } },

    price: currentPrice,
    previousPrice,
    changeOf,
    positionPnl,
    riskRatio,
    liquidationPrice,
    distanceToLiquidation,
    isSafe,
    maxLeverage,
    startContract,
    contractStatus,
    contractBlocked,
    contractNoLoans,
    resolveContractEvent,
    setDifficulty,
    setNickname,
    account,
    series,
    selectedBattle,
    chartData,
    rangeStats,
    leaderboard,
    challengeScore,
    diagnosis,
    narrate,
    getCases,
    getEndings,
    clearCases,
    airborneThreshold,

    setPair,
    setMargin,
    setLeverage,
    maxMargin,
    openPosition,
    closePosition,
    partialClose,
    resolveRisk,
    addMargin,
    borrowLoan,
    repayLoan,
    accrueLoanInterest,
    revengeTrade,
    cashOut,
    checkBankruptcy,

    setMode,
    loadReal,
    applyRealRange,
    setTimeframe,
    nextDay,
    replay,
    setCursor,
    selectBattle,

    enterChallenge,
    startChallenge,
    finishChallenge,
    showChallengeRank,

    unlock,
    resetMode,
    save,
    saveSettings,
    tick,
    defaultRealRange,
    normalizeRealRange,
    todayKey
  };
})();
