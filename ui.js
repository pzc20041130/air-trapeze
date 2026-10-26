/* 空中飞人 · 界面与交互 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const D = window.FXData;
  const E = window.FXEngine;
  const DEFAULT_SETTINGS = { nickname: '大肥鱼', advancedTrading: false, sfxOn: true, sfxVol: 70, musicOn: false, musicVol: 60, newsOn: true, newsFreq: 'mid', theme: 'day', difficulty: 'standard' };

  let historyExpanded = false;
  let tutorialStep = 0;
  let shareDataUrl = null;
  let newsFloatQueue = [];
  let newsFloatActive = false;
  let newsFloatTimer = null;
  let modalQueue = [];
  let modalOpen = false;
  let modalAction = null;
  let modalExtraAction = null;
  let riskPositionId = null;
  let loanQuoteActive = false;
  let progressActive = false;
  let progressTimer = null;
  let previewing = false;
  let toastTimer = null;
  let narratorTimer = null;
  let casesFilter = 'all';
  let contractPromptTimer = null;
  let practiceMode = false;
  let practicePending = false;
  let tutorialPractice = false;
  let tickerKey = '';

  const isPlayback = () => E.state.mode === 'real' || E.state.mode === 'battle';
  const GLOSSARY_TERMS = Object.keys(D.GLOSSARY || {}).sort((a, b) => b.length - a.length);
  const GLOSSARY_RE = GLOSSARY_TERMS.length
    ? new RegExp(GLOSSARY_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
    : null;
  let termifyScheduled = false;

  function decorateTerms(root) {
    if (!GLOSSARY_RE || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.term, .glossary-pop, .field-label, button, a, input, textarea, select, option, script, style, svg, canvas, #accountOwner, .brand, [data-no-terms]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue;
      GLOSSARY_RE.lastIndex = 0;
      if (!GLOSSARY_RE.test(text)) return;
      GLOSSARY_RE.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let last = 0;
      let match;
      while ((match = GLOSSARY_RE.exec(text))) {
        if (match.index > last) fragment.append(document.createTextNode(text.slice(last, match.index)));
        const span = document.createElement('span');
        span.className = 'term';
        span.dataset.term = match[0];
        span.textContent = match[0];
        span.tabIndex = 0;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `术语：${match[0]}`);
        fragment.append(span);
        last = match.index + match[0].length;
      }
      if (last < text.length) fragment.append(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(fragment, node);
    });
  }

  function scheduleTermify() {
    if (termifyScheduled) return;
    termifyScheduled = true;
    requestAnimationFrame(() => {
      termifyScheduled = false;
      decorateTerms(document.body);
    });
  }

  function showGlossary(term, anchor) {
    const info = D.GLOSSARY && D.GLOSSARY[term];
    if (!info) return;
    $('glossaryTerm').textContent = term;
    $('glossaryDef').textContent = info.def;
    $('glossaryExample').textContent = info.example ? `例：${info.example}` : '';
    $('glossaryPop').classList.remove('hidden');
    requestAnimationFrame(() => positionGlossary(anchor));
  }

  function positionGlossary(anchor) {
    const pop = $('glossaryPop');
    if (window.innerWidth <= 720 || !anchor) {
      pop.style.left = '50%';
      pop.style.top = 'auto';
      pop.style.bottom = '';
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    const center = Math.min(Math.max(rect.left + rect.width / 2, width / 2 + 10), window.innerWidth - width / 2 - 10);
    let top = rect.top - height - 10;
    if (top < 64) top = Math.min(window.innerHeight - height - 12, rect.bottom + 10);
    pop.style.left = `${center}px`;
    pop.style.top = `${top}px`;
    pop.style.bottom = 'auto';
  }

  function hideGlossary() {
    $('glossaryPop').classList.add('hidden');
  }
  const modeName = mode => mode === 'real' ? '真实数据账户' : mode === 'battle' ? '经典战役账户' : mode === 'challenge' ? '每日挑战账户' : '模拟数据账户';
  const sessionName = mode => mode === 'real' ? '真实回放' : mode === 'battle' ? '经典战役' : mode === 'challenge' ? '每日挑战' : '模拟账户';

  /* ================= 渲染 ================= */
  function render() {
    if (!E.state) return;
    renderPairs();
    renderAccount();
    renderOrder();
    renderPositions();
    renderHistory();
    renderChartHeader();
    renderBattleShelf();
    renderChallenge();
    renderTicker();
    renderActiveEvents();
    drawChart();
    scheduleTermify();
  }

  function renderPairs() {
    const list = $('pairList');
    list.replaceChildren();
    D.PAIRS.forEach(pair => {
      const price = E.price(pair.id);
      const change = E.changeOf(pair.id);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pair-row' + (E.state.pair === pair.id ? ' selected' : '');
      row.disabled = E.state.mode === 'battle' && pair.id !== E.state.pair;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(E.state.pair === pair.id));
      row.innerHTML = `<span><strong>${pair.id}</strong><small>${pair.name}</small></span>
        <span class="pair-numbers"><strong>${D.priceText(pair.id, price)}</strong><small class="${change >= 0 ? 'positive' : 'negative'}">${D.pct(change)}</small></span>`;
      row.addEventListener('click', () => E.setPair(pair.id));
      list.append(row);
    });
    const mobile = $('mobilePairSelect');
    if (!mobile.options.length) D.PAIRS.forEach(pair => mobile.add(new Option(`${pair.id} · ${pair.name}`, pair.id)));
    mobile.value = E.state.pair;
    mobile.disabled = E.state.mode === 'battle';
  }

  function renderAccount() {
    const a = E.account();
    const s = E.state;
    $('accountModeName').textContent = modeName(s.mode);
    $('accountOwner').textContent = E.settings.nickname || '大肥鱼';
    $('difficultyBadge').textContent = E.isSafe() ? '安全网' : '标准';
    $('difficultyBadge').className = 'difficulty-chip' + (E.isSafe() ? ' safe' : '');
    $('sessionLabel').textContent = sessionName(s.mode);
    $('equity').textContent = D.money(a.equity);
    $('cash').textContent = D.money(s.cash);
    $('floating').textContent = D.signedMoney(a.floating);
    $('floating').className = a.floating >= 0 ? 'positive' : 'negative';
    $('usedMargin').textContent = D.money(a.used);
    $('debt').textContent = D.money(s.debt);
    const peak = Math.max(Number(s.peakEquity) || 10000, a.equity);
    const drawdown = peak - a.equity;
    $('cashoutValue').textContent = D.money(a.equity);
    $('peakNote').textContent = drawdown > 0.01
      ? ` · 峰值 ${D.money(peak)} · 已回撤 ${D.money(drawdown)}`
      : ` · 本局峰值 ${D.money(peak)}`;
    const contract = E.contractStatus();
    const contractChip = $('contractChip');
    const contractLine = $('contractLine');
    const hasContract = !!contract && s.contract && s.contract.id !== 'free';
    contractChip.classList.toggle('hidden', !hasContract);
    contractLine.classList.toggle('hidden', !hasContract);
    if (hasContract) {
      const done = !!contract.complete;
      contractChip.textContent = `${contract.title}${done ? ' · 达成' : ''}`;
      contractChip.className = 'contract-chip' + (done ? ' done' : '');
      contractLine.className = 'contract-line' + (done ? ' done' : '');
      if (done) {
        contractLine.textContent = '目标达成。现在收手，还是再贪一点？';
      } else if (contract.goalType === 'debt') {
        contractLine.textContent = `${contract.title} · 权益 ${D.money(a.equity)} / ${D.money(contract.targetEquity)} · 贷款 ${D.money(s.debt)} · 交易 ${contract.trades || 0}/${contract.maxTrades}`;
      } else {
        contractLine.textContent = `${contract.title} · 已赚 ${D.signedMoney(contract.profit)} / ${D.money(contract.targetProfit)} · 还差 ${D.money(contract.remaining)} · 交易 ${contract.trades || 0}/${contract.maxTrades}`;
      }
    }
    const closed = !!s.runClosed;
    $('cashoutBtn').classList.toggle('hidden', s.mode === 'challenge');
    $('cashoutBtn').textContent = closed ? '再来一局' : '收手离场';
    $('cashoutBtn').classList.toggle('closed', closed);
    if (closed) {
      $('loanInfo').textContent = s.closeReason === 'bankrupt'
        ? '本局已穿仓结案。点「再来一局」重新开始。'
        : '本局已收手。等你想再来一把的时候，点「再来一局」。';
    } else if (s.mode === 'challenge') {
      $('loanInfo').textContent = '挑战模式不开放贷款。肥鱼也想赚你利息，但规则不允许。';
    } else if (E.contractNoLoans()) {
      $('loanInfo').textContent = '这份合同不开放借款。先按合同目标走。';
    } else if (E.isSafe()) {
      $('loanInfo').textContent = '安全网不开放贷款。想借钱加仓，先把安全网撤掉。';
    } else if (s.debt > 0) {
      $('loanInfo').textContent = `肥鱼信贷提醒：借款 ${D.money(s.loanPrincipal)} · 日利率 ${D.rateText(s.loanRate)} · 待还 ${D.money(s.debt)}。每交易日计息；模拟数据每 30 秒计一天。`;
    } else {
      $('loanInfo').textContent = '肥鱼信贷，随借随到。最多 $200,000，日利率 0.01%–0.04%（按金额分级）。模拟数据每 30 秒计一天。';
    }
    if (!closed && s.mode !== 'challenge') $('loanInfo').textContent += ` · 空中飞人线 ${D.money(E.airborneThreshold())}`;
    $('borrowBtn').disabled = s.mode === 'challenge' || E.isSafe() || closed || E.contractNoLoans();
    $('repayBtn').disabled = s.mode === 'challenge' || s.debt <= 0 || closed;
  }

  function renderOrder() {
    const s = E.state;
    const safe = E.isSafe();
    const maxLev = E.maxLeverage();
    const closed = !!s.runClosed;
    const advanced = !!E.settings.advancedTrading;
    $('runClosedNote').classList.toggle('hidden', !closed);
    $('contractLimitNote').classList.toggle('hidden', !E.contractBlocked());
    $('advancedOrder').classList.toggle('hidden', !advanced);
    $('stopPriceInput').disabled = closed;
    $('takePriceInput').disabled = closed;
    $('marginInput').disabled = closed;
    $('leverageRange').disabled = closed;
    $('maxBtn').disabled = closed;
    $('orderPair').textContent = s.pair;
    $('orderCash').textContent = D.money(s.cash);
    $('orderMargin').textContent = D.money(s.positions.reduce((sum, pos) => sum + pos.margin, 0));
    if (document.activeElement !== $('marginInput')) $('marginInput').value = s.margin;
    $('leverageRange').max = maxLev;
    $('leverageRange').value = s.leverage;
    $('leverageRange').style.setProperty('--progress', `${(s.leverage - 1) / Math.max(1, maxLev - 1) * 100}%`);
    $('leverageValue').textContent = `${s.leverage}×`;
    const ticks = maxLev <= 20 ? [1, 5, 10, 15, 20] : [1, 25, 50, 75, 100];
    [...$('leverageTicks').children].forEach((span, index) => { span.textContent = `${ticks[index]}×`; });
    $('notional').textContent = D.money(s.margin * s.leverage);
    $('tradeFee').textContent = D.money(D.tradeFee(s.margin, s.leverage));
    $('riskPercent').textContent = `${(80 / s.leverage).toFixed(2)}%`;
    const myPositions = s.positions.filter(pos => pos.pair === s.pair);
    const orderPosition = $('orderPosition');
    if (!myPositions.length) {
      orderPosition.classList.add('hidden');
    } else {
      const totalPnl = myPositions.reduce((sum, pos) => sum + E.positionPnl(pos), 0);
      const sameSide = myPositions.every(pos => pos.side === myPositions[0].side);
      $('orderPosDir').textContent = sameSide
        ? `${myPositions[0].side === 1 ? '做多' : '做空'} · ${myPositions.length} 笔`
        : `多空混合 · ${myPositions.length} 笔`;
      $('orderPosPnl').textContent = D.signedMoney(totalPnl);
      $('orderPosPnl').classList.toggle('negative', totalPnl < 0);
      $('orderPosMeta').textContent = myPositions.length === 1
        ? `开仓 ${D.priceText(s.pair, myPositions[0].entry)} · 距爆仓 ${E.distanceToLiquidation(myPositions[0]).toFixed(2)}%`
        : `合计保证金 ${D.money(myPositions.reduce((sum, pos) => sum + pos.margin, 0))}`;
      orderPosition.classList.remove('hidden');
    }
    if (s.lastOneCount > 0 && !E.isSafe() && !closed) {
      $('lastOneNote').textContent = `「最后一次」× ${s.lastOneCount} · 这次真的`;
      $('lastOneNote').classList.remove('hidden');
    } else {
      $('lastOneNote').classList.add('hidden');
    }
  }

  function renderPositions() {
    const s = E.state;
    $('positionCount').textContent = s.positions.length;
    $('riskHint').textContent = s.positions.length ? `合计 ${D.money(E.account().used)} 保证金` : '空仓中，暂时像个人';
    const root = $('positions');
    root.replaceChildren();
    if (!s.positions.length) {
      root.innerHTML = s.runClosed
        ? '<div class="empty-state"><div class="empty-icon">■</div>本局已收手，等下一局。</div>'
        : '<div class="empty-state"><div class="empty-icon">♡</div>空仓。难得清醒，保持住。</div>';
      return;
    }
    s.positions.forEach(pos => {
      const pnl = E.positionPnl(pos);
      const ratio = E.riskRatio(pos);
      const liq = E.liquidationPrice(pos);
      const distance = E.distanceToLiquidation(pos);
      const levels = [
        pos.stopPrice != null ? `止损 ${D.priceText(pos.pair, pos.stopPrice)}` : '',
        pos.takePrice != null ? `止盈 ${D.priceText(pos.pair, pos.takePrice)}` : ''
      ].filter(Boolean).join(' · ');
      const row = document.createElement('div');
      row.className = 'position-row';
      row.innerHTML = `<div class="pos-name"><strong>${pos.pair}<span class="direction ${pos.side === 1 ? 'long' : 'short'}">${pos.side === 1 ? '做多' : '做空'}</span>${ratio >= 0.6 ? '<span class="risk-tag">风险偏高</span>' : ''}</strong><small>${D.money(pos.margin)} 保证金 · ${D.money(pos.notional)} 仓位 · ${pos.leverage}× · 爆仓 ${D.priceText(pos.pair, liq)} · 现价距爆仓 ${distance.toFixed(2)}%</small>${levels ? `<small class="pos-stops">${levels}</small>` : ''}</div>
        <div class="pos-cell pos-entry"><strong>${D.priceText(pos.pair, pos.entry)}</strong><small>开仓价格</small></div>
        <div class="pos-cell"><strong>${D.priceText(pos.pair, E.price(pos.pair))}</strong><small>当前价格</small></div>
        <div class="pos-cell"><strong class="${pnl >= 0 ? 'positive' : 'negative'}">${D.signedMoney(pnl)}</strong><small>浮动盈亏</small></div>
        <div class="pos-actions">
          <button class="partial-btn" type="button" data-fraction="0.25" title="平掉 25%">25%</button>
          <button class="partial-btn" type="button" data-fraction="0.5" title="平掉 50%">50%</button>
          <button class="partial-btn" type="button" data-fraction="0.75" title="平掉 75%">75%</button>
          <button class="close-btn" type="button">平仓</button>
        </div>`;
      row.querySelectorAll('[data-fraction]').forEach(btn => {
        btn.addEventListener('click', () => E.partialClose(pos.id, Number(btn.dataset.fraction)));
      });
      row.querySelector('.close-btn').addEventListener('click', () => {
        const wasPractice = practiceMode;
        E.closePosition(pos.id, false);
        if (wasPractice && !E.state.positions.length) {
          practiceMode = false;
          practicePending = true;
          hidePracticeHint();
        }
      });
      root.append(row);
    });
  }

  function renderHistory() {
    $('history').classList.toggle('hidden', !historyExpanded);
    $('historyToggle').textContent = historyExpanded ? '收起记录' : '展开记录';
    if (!historyExpanded) return;
    const root = $('history');
    root.replaceChildren();
    const history = E.state.history;
    if (!history.length) {
      root.innerHTML = '<div class="empty-state">还没有结算记录。第一笔总是最像样的。</div>';
      return;
    }
    history.slice(0, 8).forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `<span>${item.pair} · ${item.side === 1 ? '做多' : '做空'} · ${item.trigger === 'stop' ? '止损触发' : item.trigger === 'take' ? '止盈触发' : item.liquidated ? '爆仓' : item.partial ? `部分平仓 ${Math.round((item.fraction || 0) * 100)}%` : '平仓'} · ${item.time}</span><strong class="${item.pnl >= 0 ? 'positive' : 'negative'}">${D.signedMoney(item.pnl)}</strong>`;
      root.append(row);
    });
  }

  function renderChartHeader() {
    const s = E.state;
    const pair = s.pair;
    const price = E.price(pair);
    const change = E.changeOf(pair);
    const picking = E.battlePickerOpen && s.mode !== 'battle';
    const playback = isPlayback() && !picking;
    const closed = !!s.runClosed;
    const series = playback ? E.series() : null;
    $('pairTitle').textContent = pair.replace('/', ' / ');
    $('pairName').textContent = (D.PAIRS.find(p => p.id === pair) || {}).name || '';
    $('currentPrice').textContent = D.priceText(pair, price);
    $('priceChange').textContent = D.pct(change);
    $('priceChange').className = change >= 0 ? 'positive' : 'negative';
    const badgeMode = picking ? 'battle' : s.mode;
    $('modeBadge').textContent = badgeMode === 'real' ? '真实历史数据' : badgeMode === 'battle' ? '经典战役' : badgeMode === 'challenge' ? '每日挑战' : '模拟行情';
    $('modeBadge').className = 'mode-badge' + (badgeMode === 'real' ? ' real' : badgeMode === 'battle' ? ' battle' : badgeMode === 'challenge' ? ' challenge' : '');
    $('simMode').classList.toggle('active', s.mode === 'sim' && !picking);
    $('realMode').classList.toggle('active', s.mode === 'real' && !picking);
    $('battleMode').classList.toggle('active', s.mode === 'battle' || picking);
    $('challengeMode').classList.toggle('active', s.mode === 'challenge');
    $('nextDayBtn').classList.toggle('hidden', !playback);
    $('playBtn').classList.toggle('hidden', !playback);
    $('replayBtn').classList.toggle('hidden', !playback);
    $('playBtn').textContent = E.autoPlay ? '暂停播放' : '自动播放';
    $('nextDayBtn').disabled = !playback || !series || series.loading || !series.items.length || series.cursor >= series.items.length - 1 || closed;
    $('playBtn').disabled = !playback || !series || series.loading || !series.items.length || series.cursor >= series.items.length - 1 || closed;
    $('replayBtn').disabled = !playback || !series || !series.items.length || s.positions.length > 0 || closed;
    if (closed) {
      $('dataStatus').textContent = '本局已收手';
    } else if (picking) {
      $('dataStatus').textContent = '选择一份事故档案开始回放';
    } else if (playback) {
      $('dataStatus').textContent = series.loading ? '读取中…' : series.items[series.cursor] ? `历史回放 · ${series.items[series.cursor].date}` : '尚未载入数据';
    } else {
      $('dataStatus').textContent = s.mode === 'challenge' ? '挑战行情 · 每 1.5 秒更新' : '每 1.5 秒更新';
    }
    $('chartLegend').textContent = picking ? '事故档案 · 历史日度参考汇率' : playback ? 'Frankfurter · 日度参考汇率（影线为示意）' : s.mode === 'challenge' ? '挑战模式 · 随机模拟 K 线' : '模拟数据 · 模拟 K 线';
    $('chartDate').textContent = closed ? '本局已结束' : picking ? '等待选择' : playback ? `${series.items.length ? series.cursor + 1 : 0} / ${series.items.length} 个交易日` : s.mode === 'challenge' ? (E.challenge.active ? '挑战进行中' : '等待开始') : '实时模拟';
    $('chartLoading').classList.toggle('hidden', picking || !playback || !series || !series.loading);
    if (playback && series && series.loading) $('chartLoading').textContent = series === E.real ? (E.real.loadingText || '正在读取历史汇率…') : '正在读取历史汇率…';
    $('playbackTools').classList.toggle('hidden', !playback);
    if (playback) {
      const tf = series.tf || '1d';
      [...$('tfSeg').children].forEach(btn => btn.classList.toggle('active', btn.dataset.tf === tf));
      const progress = $('progressBar');
      progress.max = Math.max(0, series.items.length - 1);
      if (!progressActive) progress.value = series.cursor;
      const pctValue = progress.max > 0 ? (series.cursor / progress.max) * 100 : 0;
      progress.style.setProperty('--progress', `${pctValue}%`);
      $('progressDateLabel').textContent = series.items[series.cursor]?.date || '—';
      $('rangeDaysNote').textContent = s.mode === 'real' && E.real.items.length ? `共 ${E.real.items.length} 个交易日` : '';
    }
    $('realRangeBar').classList.toggle('hidden', s.mode !== 'real' || picking);
    if (s.mode === 'real' && !picking && s.realRange) {
      $('rangeStart').value = s.realRange.start;
      $('rangeEnd').value = s.realRange.end;
    }
    [...$('rangeQuickSeg').children].forEach(btn => btn.classList.remove('active'));
    if (s.mode === 'real' && !picking && s.realRange) {
      const start = Date.parse(`${s.realRange.start}T00:00:00Z`);
      const end = Date.parse(`${s.realRange.end}T00:00:00Z`);
      const days = Math.round((end - start) / 86400000) + 1;
      const today = new Date();
      const ytdStart = Date.UTC(today.getUTCFullYear(), 0, 1);
      let active = null;
      if (start === ytdStart) active = $('rangeQuickSeg').querySelector('button[data-days="ytd"]');
      else active = $('rangeQuickSeg').querySelector(`button[data-days="${days}"]`);
      if (active) active.classList.add('active');
    }
    renderRangeStats();
  }

  function renderBattleShelf() {
    const visible = E.battlePickerOpen || E.state.mode === 'battle';
    $('battleShelf').classList.toggle('hidden', !visible);
    if (!visible) return;
    const selected = E.selectedBattle();
    $('battleShelfTitle').textContent = E.battlePickerOpen ? '选择一份事故档案' : selected?.title || '选择一份事故档案';
    $('battleChooseBtn').classList.toggle('hidden', E.battlePickerOpen || E.state.mode !== 'battle');
    $('battleList').classList.toggle('hidden', !E.battlePickerOpen);
    if (E.battlePickerOpen) {
      $('battleInfo').textContent = `共 ${D.BATTLES.length} 份档案，按事发时间排序。选择一份，用当年的日度参考汇率逐日回放。`;
      if ($('battleList').childElementCount) return;
      D.BATTLES.forEach(item => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'battle-card';
        card.innerHTML = `<span class="battle-grade grade-${item.grade || 'B'}">${item.grade || 'B'}</span><span class="battle-date">${item.event}</span><strong>${item.title}</strong><span class="battle-pair">${item.pair}</span><small>${item.description}</small>`;
        card.addEventListener('click', () => E.selectBattle(item.id));
        $('battleList').append(card);
      });
    } else {
      $('battleList').replaceChildren();
      if (selected) {
        $('battleInfo').innerHTML = `事故等级 ${selected.grade || 'B'} · ${selected.pair} · ${selected.event}<br>${selected.description}<br><span style="color:var(--text-dim)">${selected.tagline}</span><br>从重大事件前数周开始；推进日期时会出现当时的政策与市场快讯。日度参考价不展示盘中极端波动。`;
      } else {
        $('battleInfo').textContent = '选择一份档案开始回放。';
      }
    }
  }

  function renderChallenge() {
    const picking = E.battlePickerOpen && E.state.mode !== 'battle';
    const visible = E.state.mode === 'challenge' && !picking;
    const closed = !!E.state.runClosed;
    $('challengeBar').classList.toggle('hidden', !visible);
    if (!visible) {
      if (E.state.mode !== 'challenge') {
        $('longBtn').disabled = closed || E.contractBlocked();
        $('shortBtn').disabled = closed || E.contractBlocked();
        $('resetBtn').disabled = false;
      }
      return;
    }
    const ch = E.challenge;
    const ready = ch.loaded && !ch.loading;
    $('challengeAttempts').textContent = ready ? `今日剩余 ${ch.remaining} 次${ch.active ? ' · 当前挑战进行中' : ''}` : '正在读取挑战记录…';
    $('challengeStatus').textContent = ch.active ? `当前权益 ${D.money(E.account().equity)} · 收益 ${D.signedMoney(E.account().equity - 10000)}` : ch.remaining > 0 ? '一万元开局，随时可以体面离场' : '今日机会已经用完，明天再来';
    $('challengeStartBtn').textContent = ch.active ? '继续挑战' : '开始挑战';
    $('challengeStartBtn').disabled = !ready || ch.active || ch.remaining <= 0;
    $('challengeRetireBtn').disabled = !ready || !ch.active;
    $('longBtn').disabled = !ch.active || closed;
    $('shortBtn').disabled = !ch.active || closed;
    $('resetBtn').disabled = ch.active;
  }

  function renderTicker() {
    const on = E.settings.newsOn;
    $('newsTicker').classList.toggle('hidden', !on);
    if (!on) return;
    const items = (E.newsFeed || []).slice(0, 5);
    const fallback = [
      { tag: '开盘', title: 'EUR/USD 模拟行情已启动', body: '先看方向，再决定仓位；空仓也是一种仓位。' },
      { tag: '提示', title: '杠杆会同时放大盈亏和手续费', body: '新手先用 10×，别一上来就 100×。' },
      { tag: '提示', title: '没有行情的时候，等也是一种操作', body: '不必每一秒都下单。' }
    ];
    const displayItems = items.length ? items : fallback;
    const key = `${displayItems.map(item => `${item.tag || ''}:${item.title}:${item.body}`).join('|')}|${on}`;
    if (key === tickerKey) return;
    tickerKey = key;
    const track = $('tickerTrack');
    const text = displayItems.map(item => `【${item.tag || '快讯'}】${item.title} · ${item.body}`).join('　　✦　　');
    track.className = 'ticker-track';
    track.replaceChildren();
    [0, 1].forEach(index => {
      const copy = document.createElement('span');
      copy.className = 'ticker-copy';
      copy.textContent = text;
      if (index === 1) copy.setAttribute('aria-hidden', 'true');
      track.append(copy);
    });
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
    track.style.animationDuration = `${Math.max(24, Math.min(60, text.length * 0.16))}s`;
  }

  function renderActiveEvents() {
    const events = E.settings.newsOn ? (E.activeNews || []) : [];
    const root = $('activeEvents');
    if (!events.length) {
      root.classList.add('hidden');
      root.replaceChildren();
      return;
    }
    root.classList.remove('hidden');
    root.replaceChildren();
    events.slice(0, 3).forEach(event => {
      const card = document.createElement('div');
      card.className = `active-event tone-${event.tone || 'normal'}${event.rare || event.kind === 'breaking' ? ' rare' : ''}`;
      const top = document.createElement('div');
      top.className = 'active-event-top';
      const tag = document.createElement('span');
      tag.className = 'active-event-tag';
      tag.textContent = event.tag || '快讯';
      const time = document.createElement('span');
      time.className = 'active-event-time';
      time.textContent = `${event.rare || event.kind === 'breaking' || event.tone === 'breaking' ? 'BREAKING · ' : ''}剩 ${Math.max(0, event.remaining || 0)} 根`;
      top.append(tag, time);
      const title = document.createElement('strong');
      title.textContent = event.title || '';
      const body = document.createElement('p');
      body.textContent = event.body || '';
      const quote = document.createElement('em');
      quote.className = 'active-event-quote';
      quote.textContent = event.quote || '';
      card.append(top, title, body);
      if (event.quote) card.append(quote);
      root.append(card);
    });
  }

  function renderRangeStats() {
    const el = $('rangeStats');
    if (E.battlePickerOpen) { el.classList.add('hidden'); return; }
    const stats = E.rangeStats();
    if (!stats) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.innerHTML = `<span>区间最高 <b>${D.priceText(E.state.pair, stats.high)}</b></span>
      <span>区间最低 <b>${D.priceText(E.state.pair, stats.low)}</b></span>
      <span>振幅 <b>${D.pct(stats.amplitude)}</b></span>
      <span>区间涨跌 <b class="${stats.change >= 0 ? 'positive' : 'negative'}">${D.pct(stats.change)}</b></span>`;
  }

  function drawChart() {
    const canvas = $('chart');
    if (!canvas) return;
    const data = E.chartData();
    const width = canvas.clientWidth || 640;
    const visible = Math.max(30, Math.min(70, Math.floor((width - 74) / 9)));
    const candles = data.playback ? data.candles.slice(-visible) : data.candles;
    const dates = data.playback ? data.dates.slice(-visible) : [];
    const series = isPlayback() ? E.series() : null;
    const current = E.price(E.state.pair);
    const lines = [];
    E.state.positions.filter(pos => pos.pair === E.state.pair).forEach(pos => {
      lines.push({ price: pos.entry, color: '#e6b35c', label: `开仓 ${D.priceText(pos.pair, pos.entry)}` });
      const liq = E.liquidationPrice(pos);
      if (Number.isFinite(liq) && Number.isFinite(current) && Math.abs(liq - current) / current < 0.15) {
        lines.push({ price: liq, color: '#e06e81', label: `爆仓 ${D.priceText(pos.pair, liq)}` });
      }
      if (pos.stopPrice != null && Number.isFinite(pos.stopPrice) && Math.abs(pos.stopPrice - current) / current < 0.15) {
        lines.push({ price: pos.stopPrice, color: '#e49a5c', label: `止损 ${D.priceText(pos.pair, pos.stopPrice)}` });
      }
      if (pos.takePrice != null && Number.isFinite(pos.takePrice) && Math.abs(pos.takePrice - current) / current < 0.15) {
        lines.push({ price: pos.takePrice, color: '#43a77a', label: `止盈 ${D.priceText(pos.pair, pos.takePrice)}` });
      }
    });
    window.FXChart.render(canvas, {
      candles,
      dates,
      digits: (D.PAIRS.find(p => p.id === E.state.pair) || {}).digits || 5,
      playback: data.playback,
      current,
      lines,
      theme: E.settings.theme,
      emptyText: data.playback ? (series?.loading ? '正在读取历史汇率…' : series?.error ? '数据读取失败，请重试' : '暂无数据') : '等待行情…'
    });
  }

  /* ================= 提示与新闻 ================= */
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function narrate(message) {
    const el = $('narrator');
    if (!el) return;
    $('narratorText').textContent = message;
    el.classList.add('show');
    clearTimeout(narratorTimer);
    narratorTimer = setTimeout(() => el.classList.remove('show'), 5200);
  }

  function queueNewsFloat(item) {
    if (!E.settings.newsOn) return;
    newsFloatQueue.push(item);
    if (newsFloatQueue.length > 3) newsFloatQueue = newsFloatQueue.slice(-3);
    if (!newsFloatActive) showNextNewsFloat();
  }

  function showNextNewsFloat() {
    const item = newsFloatQueue.shift();
    if (!item) { newsFloatActive = false; return; }
    newsFloatActive = true;
    $('nfTag').textContent = item.tag || '快讯';
    $('nfTag').className = 'nf-tag' + (item.ach ? ' ach' : '') + (item.rare || item.tone === 'breaking' ? ' rare' : '');
    $('nfTitle').textContent = item.title || '';
    $('nfBody').textContent = `${item.body || ''}${item.quote ? `\n${item.quote}` : ''}`;
    $('nfDate').textContent = item.date || '';
    $('newsFloat').classList.add('show');
    clearTimeout(newsFloatTimer);
    newsFloatTimer = setTimeout(dismissNewsFloat, 6800);
  }

  function dismissNewsFloat() {
    $('newsFloat').classList.remove('show');
    clearTimeout(newsFloatTimer);
    newsFloatActive = false;
    if (newsFloatQueue.length) setTimeout(showNextNewsFloat, 420);
  }

  function pushNews(item) {
    renderTicker();
    queueNewsFloat(item);
  }

  function achievementUnlocked(def) {
    queueNewsFloat({ tag: '确诊', title: `确诊「${def.name}」`, body: def.desc, date: '已建档', ach: true });
    if (!$('achModal').classList.contains('hidden')) renderAchBook();
  }

  function renderNewsCenter() {
    const list = $('newsCenterList');
    list.replaceChildren();
    if (!E.newsFeed.length) {
      list.innerHTML = '<div class="empty-state">还没有快讯。市场很安静，适合收手。</div>';
      return;
    }
    E.newsFeed.forEach(item => {
      const row = document.createElement('div');
      row.className = 'news-center-item';
      row.innerHTML = `<div class="nci-head"><b>${item.tag || '快讯'}</b><span>${item.date || ''}</span></div><h4>${item.title || ''}</h4><p>${item.body || ''}${item.quote ? `\n${item.quote}` : ''}</p>`;
      list.append(row);
    });
  }

  /* ================= 弹窗 ================= */
  function updateLoanQuote() {
    if (!loanQuoteActive) return;
    const amount = Number($('modalInput').value);
    if (!Number.isFinite(amount) || amount < 1 || amount > D.LOAN_MAX) {
      $('modalDetail').textContent = `请输入 $1–${D.money(D.LOAN_MAX)}。`;
      return;
    }
    const rate = D.loanDailyRate(amount);
    $('modalDetail').textContent = `日利率 ${D.rateText(rate)} · 每交易日约 ${D.money(Math.round(amount * rate * 100) / 100)} 利息`;
  }

  function openModal(options) {
    if (modalOpen) { modalQueue.push(options); return; }
    modalOpen = true;
    modalAction = options.action || null;
    modalExtraAction = options.extraAction || null;
    riskPositionId = options.riskPositionId || null;
    loanQuoteActive = !!options.loanQuote;
    $('modalIcon').textContent = options.icon || '✦';
    if (options.iconImage) $('modalIcon').innerHTML = `<img class="modal-icon-img" src="${options.iconImage}" alt="大肥鱼">`;
    $('modalIcon').classList.toggle('loss', !!options.loss);
    $('modalTitle').textContent = options.title || '';
    $('modalMessage').textContent = options.message || '';
    $('modalDetail').textContent = options.detail || '';
    $('modalDetail').classList.toggle('preline', !!options.preline);
    $('modalExtraBtn').classList.toggle('hidden', !options.extraText);
    $('modalExtraBtn').textContent = options.extraText || '';
    $('modalInputWrap').classList.toggle('hidden', !options.input);
    $('modalInputLabel').textContent = options.input?.label || '';
    $('modalInput').value = options.input?.value ?? '';
    $('modalInput').min = options.input?.min ?? 1;
    $('modalInput').max = options.input?.max ?? '';
    $('modalInput').step = options.input?.step ?? 1;
    $('modalConfirm').textContent = options.confirm || '知道了';
    const showCancel = !!options.action;
    $('modalCancel').classList.toggle('hidden', !showCancel);
    $('modalCancel').textContent = options.cancelText || '取消';
    $('modalRiskActions').classList.toggle('hidden', !options.riskPositionId);
    $('halfCloseBtn').disabled = !options.riskPositionId;
    $('addMarginBtn').disabled = !options.riskPositionId || E.state.cash < 1;
    $('loanMarginBtn').disabled = !options.riskPositionId || E.state.debt > 0 || E.state.mode === 'challenge' || E.isSafe() || E.contractNoLoans();
    $('modal').classList.remove('hidden');
    updateLoanQuote();
    scheduleTermify();
    setTimeout(() => { if (options.input) $('modalInput').focus(); else $('modalConfirm').focus(); }, 40);
  }

  function closeModal(options = {}) {
    const hadRisk = !!riskPositionId;
    $('modal').classList.add('hidden');
    modalOpen = false;
    modalAction = null;
    modalExtraAction = null;
    riskPositionId = null;
    loanQuoteActive = false;
    if (hadRisk) E.resolveRisk(!!options.skipRiskPenalty);
    if (modalQueue.length) setTimeout(() => openModal(modalQueue.shift()), 90);
    if (practicePending && !modalOpen && !modalQueue.length) {
      practicePending = false;
      setTimeout(() => {
        E.resetMode();
        toast('练习结束。选一份合同，开始这一局。');
        openContractPicker();
      }, 240);
    }
  }

  function openRiskModal({ position, ratio, suggested }) {
    openModal({
      icon: '!', loss: true, riskPositionId: position.id,
      title: ratio >= 0.8 ? '仓位已触及爆仓线' : '仓位接近爆仓线',
      message: `${position.pair} 已亏损保证金的 ${(ratio * 100).toFixed(1)}%。${ratio >= 0.8 ? '行情已穿过爆仓线，关闭提醒后会按当前价格结算，亏损可能超过保证金；平掉一半只会先结算一半，剩余仍可能被强平。' : E.isSafe() ? '安全网下可以追加保证金、平掉一半，或者直接平仓；借款补仓不开放。' : '你可以在这里补保证金、平掉一半，或借款直接补仓。借款按金额分级计息；已有未还贷款时无法借款补仓。'}`,
      detail: `当前浮亏 ${D.signedMoney(E.positionPnl(position))} · 爆仓线 80% · 平掉一半先锁定一半盈亏，剩余仓位风险比例不变`,
      input: { label: `补仓金额（建议 ${D.money(suggested)}）`, value: suggested },
      confirm: '暂不处理'
    });
  }

  function showCloseModal({ liquidated, pnl, pair, side, cash, margin, leverage, trigger, triggerPrice, stopPrice, takePrice }) {
    const automated = trigger === 'stop' || trigger === 'take';
    const canRevenge = !automated && !liquidated && pnl < 0 && !E.isSafe();
    const level = trigger === 'stop' ? stopPrice : takePrice;
    openModal({
      icon: trigger === 'stop' ? '!' : trigger === 'take' ? '✦' : liquidated ? '✕' : pnl >= 0 ? '✦' : '♡',
      loss: (liquidated || pnl < 0) && trigger !== 'take',
      title: trigger === 'stop'
        ? '止损触发。你居然真的按了。'
        : trigger === 'take'
          ? '止盈触发。你居然真的走了。'
          : liquidated ? '哎呀，仓位爆掉了' : pnl >= 0 ? '平仓成功，漂亮！' : E.isSafe() ? '亏损平仓。安全网兜住了。' : '亏损平仓。要不再来一把？',
      message: automated
        ? `${pair} 已触发${trigger === 'stop' ? '止损' : '止盈'}价 ${D.priceText(pair, level)}，按当前价 ${D.priceText(pair, E.price(pair))} 结算。跳空时成交价可能更差。`
        : liquidated
          ? `${pair} 的亏损穿过保证金 80% 爆仓线，已按当前可得价格结算。跳空时亏损可能超过保证金。`
          : `${pair} ${side === 1 ? '做多' : '做空'}仓位已结算，盈亏计入可用余额。`,
      detail: `${automated ? (trigger === 'stop' ? '止损触发盈亏' : '止盈触发盈亏') : liquidated ? '本次爆仓盈亏' : '本次交易盈亏'}  ${D.signedMoney(pnl)}${cash < 0 ? ` · 账户已穿仓 ${D.money(cash)}` : ''}\n诊断：${E.diagnosis()}`,
      preline: true,
      confirm: canRevenge ? '最后一把，回本就走' : '知道了',
      cancelText: canRevenge ? '算了，收手' : '知道了',
      action: canRevenge ? () => {
        const lastSide = side, lastMargin = margin, lastLeverage = leverage;
        closeModal();
        E.revengeTrade(lastSide, lastMargin, lastLeverage);
      } : null
    });
  }

  function showSettlementModal(summary) {
    const bankrupt = summary.reason === 'bankrupt';
    const player = E.settings.nickname || '大肥鱼';
    const endingTitle = summary.endingTitle || '';
    const contractLine = summary.contractTitle
      ? `合同：${summary.contractTitle} · ${summary.contractDone ? '已完成' : '未完成'}${summary.grade ? ` · 评级 ${summary.grade}` : ''}\n`
      : '';
    const endingLine = endingTitle ? `结局：${endingTitle}\n` : '';
    openModal({
      icon: bankrupt ? '✕' : '■',
      loss: bankrupt || summary.equity <= 0,
      title: bankrupt
        ? `账户已穿仓 · ${endingTitle || '本局结案'}`
        : `收手离场 · ${endingTitle || '本局结束'}`,
      message: summary.endingText
        ? summary.endingText
        : bankrupt
          ? `${player}，行情穿过了保证金，本局结束。好消息是，游戏结束了。`
          : `${player}，所有持仓已按当前价格结算。你带走了 ${D.money(summary.equity)}。`,
      detail: `${contractLine}${endingLine}最终权益 ${D.money(summary.equity)}\n本局峰值 ${D.money(summary.peak)}\n最大回撤 ${D.money(summary.drawdown)}\n待还贷款 ${D.money(summary.debt)}${summary.airborneLine ? ` · 空中飞人线 ${D.money(summary.airborneLine)}` : ''}\n「最后一次」× ${summary.lastOneCount}\n诊断：${summary.diagnosis}`,
      preline: true,
      confirm: '再来一局',
      cancelText: '先看看',
      extraText: '查看病历库',
      extraAction: () => { closeModal(); openCases(); },
      action: () => {
        const mode = E.state.mode;
        closeModal();
        E.resetMode();
        if (mode === 'real') E.loadReal();
        if (mode === 'sim') maybeOpenContractPicker();
      }
    });
  }

  /* ================= 成就 ================= */
  function renderAchBook() {
    const grid = $('achGrid');
    grid.replaceChildren();
    const unlocked = E.achievements.unlocked;
    const count = D.ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
    $('achProgressLine').textContent = `已确诊 ${count} / ${D.ACHIEVEMENTS.length} · 建议继续观察`;
    const caseCount = E.getCases().length;
    if ($('caseCount')) $('caseCount').textContent = caseCount;
    D.ACHIEVEMENTS.forEach(def => {
      const stamp = unlocked[def.id];
      const card = document.createElement('div');
      card.className = 'ach-card ' + (stamp ? 'unlocked' : 'locked');
      card.innerHTML = `<span class="ach-medal">${stamp ? '💊' : '❔'}</span>
        <span class="ach-name">${stamp ? def.name : '？？？'}</span>
        <span class="ach-desc">${stamp ? def.desc : def.hint}</span>
        ${stamp ? `<span class="ach-date">${stamp}</span>` : ''}`;
      grid.append(card);
    });
    scheduleTermify();
  }

  /* ================= 病历库 ================= */
  const CASE_MODES = { sim: '模拟数据', real: '真实数据', battle: '经典战役', challenge: '每日挑战' };
  const CASE_REASONS = { cashout: '收手', bankrupt: '穿仓', challenge: '挑战结算' };

  function formatCaseDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso || '—';
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function renderCases() {
    const all = E.getCases();
    const list = all.filter(item => casesFilter === 'all' || item.mode === casesFilter);
    $('casesSummary').textContent = all.length
      ? `共 ${all.length} 份病历，当前显示 ${list.length} 份。每局收手、穿仓或挑战结算后自动建档。`
      : '还没有病历。去开一局，然后收手或让账户穿仓。';
    if ($('caseCount')) $('caseCount').textContent = all.length;
    [...$('casesFilter').children].forEach(btn => btn.classList.toggle('active', btn.dataset.mode === casesFilter));
    $('casesClear').disabled = all.length === 0;
    renderEndingsCount();
    const root = $('casesList');
    root.replaceChildren();
    if (!list.length) {
      root.innerHTML = `<div class="cases-empty">${all.length ? '这个模式下还没有病历。' : '病历库是空的。<br>收手离场或穿仓结案后，这里会自动多一份记录。'}</div>`;
      return;
    }
    list.forEach(item => {
      const mode = CASE_MODES[item.mode] || item.mode || '未知模式';
      const reason = CASE_REASONS[item.reason] || '结算';
      const safety = item.safety === 'safe' ? '安全网' : '标准';
      const card = document.createElement('div');
      card.className = 'case-card';
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.innerHTML = `<div class="case-top"><span>${formatCaseDate(item.date)}</span><span class="case-badge ${item.reason || 'cashout'}">${reason}</span></div>
        <div class="case-title"><span>${mode} · ${safety}</span><em class="${item.equity >= 0 ? 'positive' : 'negative'}">${D.money(item.equity)}</em></div>
        <div class="case-meta">峰值 ${D.money(item.peak)} · 回撤 ${D.money(item.drawdown)} · 诊断：${item.diagnosis || '未记录'}${item.contractTitle ? ` · ${item.contractTitle}${item.contractDone ? ' ✓' : ''}` : ''}${item.endingTitle ? ` · 结局：${item.endingTitle}` : ''}</div>
        <div class="case-detail"></div>`;
      const eventLines = (item.events || []).map(event => {
        const effects = [];
        if (event.effects && event.effects.cash) effects.push(D.signedMoney(event.effects.cash));
        if (event.effects && event.effects.debt) effects.push(`债务 ${D.signedMoney(event.effects.debt)}`);
        return `· ${event.title || event.id} → ${event.choice}${effects.length ? `（${effects.join('，')}）` : ''}`;
      });
      const detail = [
        `最终权益：${D.money(item.equity)}`,
        `本局峰值：${D.money(item.peak)}`,
        `最大回撤：${D.money(item.drawdown)}`,
        `待还贷款：${D.money(item.debt)}${item.airborneLine ? ` · 空中飞人线：${D.money(item.airborneLine)}` : ''}`,
        item.contractTitle ? `合同：${item.contractTitle} · ${item.contractDone ? '已完成' : '未完成'}${item.grade ? ` · 评级 ${item.grade}` : ''}` : '',
        item.endingTitle ? `结局：${item.endingTitle}\n${item.endingText || ''}` : '',
        eventLines.length ? `本局事件：\n${eventLines.join('\n')}` : '',
        `交易笔数：${item.trades || 0} · 爆仓：${item.liquidations || 0} · 「最后一次」× ${item.lastOneCount || 0}`,
        `诊断：${item.diagnosis || '未记录'}`
      ].filter(Boolean).join('\n');
      card.querySelector('.case-detail').textContent = detail;
      const toggle = () => card.classList.toggle('expanded');
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
      root.append(card);
    });
    scheduleTermify();
  }

  function openCases() {
    $('achModal').classList.add('hidden');
    renderCases();
    $('casesModal').classList.remove('hidden');
    window.FXAudio?.click();
  }

  function closeCases() {
    $('casesModal').classList.add('hidden');
  }

  /* ================= 结局图鉴 ================= */
  function renderEndingsCount() {
    const unlocked = Object.keys(E.getEndings()).length;
    const total = Object.keys(D.ENDINGS || {}).length;
    if ($('endingsCount')) $('endingsCount').textContent = `${unlocked}/${total}`;
  }

  function renderEndings() {
    const seen = E.getEndings();
    const items = Object.entries(D.ENDINGS || {});
    const unlocked = items.filter(([id]) => seen[id]).length;
    $('endingsSummary').textContent = `已解锁 ${unlocked} / ${items.length} · 每个结局都是一次落地方式`;
    const root = $('endingsList');
    root.replaceChildren();
    const order = ['通用', '房租', '还债', '裁员'];
    order.forEach(group => {
      const groupItems = items.filter(([, item]) => (item.group || '其他') === group);
      if (!groupItems.length) return;
      const title = document.createElement('div');
      title.className = 'endings-group-title';
      title.textContent = group;
      root.append(title);
      groupItems.forEach(([id, item]) => {
        const stamp = seen[id];
        const card = document.createElement('div');
        card.className = `ending-card ${stamp ? 'unlocked' : 'locked'}`;
        card.innerHTML = `<span class="ending-group">${group}</span>
          <h3>${stamp ? item.title : '？？？'}</h3>
          <p class="${stamp ? 'ending-text' : 'ending-hint'}">${stamp ? String(item.text || '').replace('{debt}', '一屁股') : item.hint || '还没有解锁。'}</p>
          ${stamp ? `<span class="ending-date">${formatCaseDate(stamp.date)}</span>` : '<span class="ending-hint">未解锁</span>'}`;
        root.append(card);
      });
    });
    renderEndingsCount();
  }

  function openEndings() {
    $('casesModal').classList.add('hidden');
    renderEndings();
    $('endingsModal').classList.remove('hidden');
    window.FXAudio?.click();
  }

  function closeEndings() {
    $('endingsModal').classList.add('hidden');
  }

  /* ================= 开局合同 ================= */
  function renderContractCards() {
    const root = $('contractList');
    root.replaceChildren();
    (D.CONTRACTS || []).forEach(item => {
      const card = document.createElement('div');
      card.className = `contract-card ${item.tone || ''}`;
      card.innerHTML = `<span class="contract-kicker">${item.kicker}</span>
        <h3>${item.title}</h3>
        <p class="contract-bg">${item.background}</p>
        <div class="contract-goal"><b>目标</b> ${item.goalText}</div>
        <div class="contract-meta">${item.limitText}<br>${item.specialText}</div>
        <button type="button" data-contract="${item.id}">${item.id === 'free' ? '自由交易' : '签下合同'}</button>`;
      card.querySelector('button').addEventListener('click', () => selectContract(item.id));
      root.append(card);
    });
    scheduleTermify();
  }

  function openContractPicker() {
    if (E.state.mode !== 'sim' || E.state.contract || E.state.positions.length || E.state.history.length || E.state.runClosed) return;
    if (!$('welcome').classList.contains('hidden') || !$('tutorial').classList.contains('hidden') || modalOpen) return;
    renderContractCards();
    $('contractModal').classList.remove('hidden');
    window.FXAudio?.click();
  }

  function maybeOpenContractPicker() {
    clearTimeout(contractPromptTimer);
    contractPromptTimer = setTimeout(openContractPicker, 220);
  }

  function selectContract(id) {
    if (!E.startContract(id)) {
      toast('现在不能签合同：请先结束当前这一局。');
      return;
    }
    $('contractModal').classList.add('hidden');
    stopPractice();
    const item = (D.CONTRACTS || []).find(entry => entry.id === id);
    toast(id === 'free' ? '自由模式：没有目标，想走就走。' : `已签下「${item ? item.title : '合同'}」。`);
    render();
  }

  function showPracticeHint(text) {
    $('practiceText').textContent = text;
    $('practiceHint').classList.remove('hidden');
  }

  function flashMetric(id, direction) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('metric-flash-up', 'metric-flash-down');
    void el.offsetWidth;
    el.classList.add(direction === 'up' ? 'metric-flash-up' : 'metric-flash-down');
  }

  function pulseOrderPosition() {
    const card = $('orderPosition');
    if (!card || card.classList.contains('hidden')) return;
    card.classList.remove('just-opened');
    void card.offsetWidth;
    card.classList.add('just-opened');
  }

  function hidePracticeHint() {
    $('practiceHint').classList.add('hidden');
  }

  function stopPractice() {
    practiceMode = false;
    practicePending = false;
    hidePracticeHint();
  }

  function startPractice() {
    if (E.state.mode !== 'sim') E.setMode('sim');
    E.setDifficulty('safe');
    E.resetMode();
    E.setMargin(100);
    E.setLeverage(10);
    practiceMode = true;
    practicePending = false;
    render();
    showPracticeHint('第一笔练习：保证金 100，杠杆 10，点「做多 / 买入」。');
    toast('练习不算合同：用 $100 保证金、10 倍杠杆做多，练完再选合同。');
  }

  function showContractEvent({ event, contractTitle }) {
    $('eventKicker').textContent = `${contractTitle} · CONTRACT EVENT`;
    $('eventTitle').textContent = event.title;
    $('eventText').textContent = event.text;
    const root = $('eventChoices');
    root.replaceChildren();
    (event.choices || []).forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'event-choice';
      button.textContent = choice.label;
      button.addEventListener('click', () => {
        E.resolveContractEvent(event.id, index);
        $('eventModal').classList.add('hidden');
        render();
      });
      root.append(button);
    });
    $('eventModal').classList.remove('hidden');
    scheduleTermify();
  }

  /* ================= 事故报告 ================= */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed'));
      img.src = src;
    });
  }

  async function buildShareCard() {
    const W = 1080, H = 1440;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const night = E.settings.theme === 'night';
    const T = night
      ? { bg0: '#13292d', bg1: '#0a1719', ink: '#eef8f2', sub: '#93b8ab', card: '#15282c' }
      : { bg0: '#eaf6ef', bg1: '#cfe9dc', ink: '#173d3a', sub: '#5f827b', card: '#ffffff' };
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, T.bg0); grad.addColorStop(1, T.bg1);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const upColor = night ? '#57cf9b' : '#2f9c76';
    const downColor = night ? '#ef8ba0' : '#e06e81';

    try {
      const avatar = await loadImage('./assets/icon.svg');
      ctx.save();
      roundRect(ctx, 72, 64, 108, 108, 30);
      ctx.clip();
      ctx.drawImage(avatar, 72, 64, 108, 108);
      ctx.restore();
    } catch (_) {
      ctx.fillStyle = night ? '#1c4434' : '#dff2e8';
      roundRect(ctx, 72, 64, 108, 108, 30); ctx.fill();
      ctx.fillStyle = night ? '#67d3a0' : '#4f8e74';
      ctx.font = '900 52px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♡', 126, 136);
      ctx.textAlign = 'left';
    }

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = T.ink;
    ctx.font = '900 62px "Microsoft YaHei", sans-serif';
    ctx.fillText('空中飞人', 208, 126);
    ctx.fillStyle = T.sub;
    ctx.font = '800 26px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('上头观察室 · 事故报告', 210, 168);

    const modeLabel = E.state.mode === 'real' ? '真实历史数据' : E.state.mode === 'battle' ? '经典战役' : E.state.mode === 'challenge' ? '每日挑战' : '模拟行情';
    ctx.fillStyle = T.card;
    roundRect(ctx, 72, 224, 380, 56, 28); ctx.fill();
    ctx.fillStyle = T.sub;
    ctx.font = '800 24px "Microsoft YaHei", sans-serif';
    ctx.fillText(`当前模式 · ${modeLabel}`, 102, 261);

    const a = E.account();
    const profit = a.equity - 10000;
    const peak = Math.max(Number(E.state.peakEquity) || 10000, a.equity);
    ctx.fillStyle = T.ink;
    ctx.font = '900 40px "Microsoft YaHei", sans-serif';
    ctx.fillText('账户总权益', 74, 366);
    ctx.font = '500 104px "DM Mono", Consolas, monospace';
    ctx.fillText(D.money(a.equity), 66, 474);
    ctx.fillStyle = profit >= 0 ? upColor : downColor;
    ctx.font = '900 44px "Microsoft YaHei", sans-serif';
    ctx.fillText(`累计收益 ${D.signedMoney(profit)}`, 70, 552);
    ctx.fillStyle = T.sub;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText(`本局峰值 ${D.money(peak)} · 回撤 ${D.money(Math.max(0, peak - a.equity))}`, 72, 588);

    const wins = E.state.history.filter(h => h.pnl > 0).length;
    const total = E.state.history.length;
    const winRate = total ? Math.round(wins / total * 100) : 0;
    const achCount = D.ACHIEVEMENTS.filter(x => E.achievements.unlocked[x.id]).length;
    ctx.fillStyle = T.card;
    roundRect(ctx, 72, 606, 936, 128, 32); ctx.fill();
    ctx.font = '800 20px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = T.sub;
    ctx.fillText('近 30 笔胜率', 112, 656);
    ctx.fillText('确诊进度', 340, 656);
    ctx.fillText('交易笔数', 570, 656);
    ctx.fillText('最后一次', 800, 656);
    ctx.font = '500 38px "DM Mono", Consolas, monospace';
    ctx.fillStyle = T.ink;
    ctx.fillText(`${winRate}%`, 112, 708);
    ctx.fillText(`${achCount} / ${D.ACHIEVEMENTS.length}`, 340, 708);
    ctx.fillText(`${total}`, 570, 708);
    ctx.fillText(`× ${E.state.lastOneCount || 0}`, 800, 708);

    ctx.fillStyle = T.card;
    roundRect(ctx, 72, 766, 936, 320, 32); ctx.fill();
    const trail = Array.isArray(E.state.equityTrail) ? E.state.equityTrail : [];
    if (trail.length >= 2) {
      const min = Math.min(...trail), max = Math.max(...trail), span = (max - min) || 1;
      ctx.strokeStyle = profit >= 0 ? upColor : downColor;
      ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      trail.forEach((v, i) => {
        const x = 112 + i / (trail.length - 1) * 856;
        const y = 806 + (1 - (v - min) / span) * 240;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.stroke();
    } else {
      ctx.fillStyle = T.sub;
      ctx.font = '800 28px "Microsoft YaHei", sans-serif';
      ctx.fillText('继续交易，这里会生成你的权益曲线', 112, 940);
    }

    // 红色印章
    ctx.save();
    ctx.translate(884, 122);
    ctx.rotate(-0.17);
    ctx.strokeStyle = profit >= 0 ? 'rgba(47,156,118,0.55)' : 'rgba(224,110,129,0.65)';
    ctx.lineWidth = 4;
    roundRect(ctx, -92, -30, 184, 60, 10);
    ctx.stroke();
    ctx.fillStyle = profit >= 0 ? 'rgba(47,156,118,0.7)' : 'rgba(224,110,129,0.8)';
    ctx.font = '900 30px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(profit >= 0 ? '暂时清醒' : '建议休市', 0, 10);
    ctx.restore();
    ctx.textAlign = 'left';

    ctx.fillStyle = T.ink;
    ctx.font = '900 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(`诊断：${E.diagnosis()}`, 72, H - 230);
    ctx.fillStyle = T.sub;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('建议：关机，睡觉。明天再战，或者别战。', 72, H - 196);

    ctx.fillStyle = T.ink;
    ctx.font = '900 30px "Microsoft YaHei", sans-serif';
    ctx.fillText('空中飞人 · 上头观察室', 72, H - 148);
    ctx.fillStyle = T.sub;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('黑色喜剧 · 盈亏与数据仅供娱乐，不涉及真实资金', 72, H - 102);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  async function openShare() {
    $('shareModal').classList.remove('hidden');
    $('sharePlaceholder').textContent = '正在生成事故报告…';
    $('sharePlaceholder').classList.remove('hidden');
    $('shareImg').classList.add('hidden');
    $('shareDownloadBtn').classList.add('hidden');
    shareDataUrl = null;
    try {
      shareDataUrl = await buildShareCard();
      $('shareImg').src = shareDataUrl;
      $('sharePlaceholder').classList.add('hidden');
      $('shareImg').classList.remove('hidden');
      $('shareDownloadBtn').classList.remove('hidden');
    } catch (error) {
      console.warn('share card failed', error);
      $('sharePlaceholder').textContent = '生成失败，请关闭后重试';
      toast('事故报告生成失败，请重试。');
    }
  }

  function downloadShare() {
    if (!shareDataUrl) return;
    const link = document.createElement('a');
    link.download = 'air-fx-case.jpg';
    link.href = shareDataUrl;
    document.body.append(link);
    link.click();
    link.remove();
  }

  /* ================= 设置 / 音乐 ================= */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = $('metaTheme');
    if (meta) meta.content = theme === 'night' ? '#0d1a1c' : '#eff5f2';
  }

  function renderSettingsControls() {
    const s = E.settings;
    $('nicknameInput').value = s.nickname || '大肥鱼';
    $('advancedToggle').checked = !!s.advancedTrading;
    $('sfxToggle').checked = s.sfxOn;
    $('sfxVolume').value = s.sfxVol;
    $('musicToggle').checked = s.musicOn;
    $('musicVolume').value = s.musicVol;
    $('musicStatus').textContent = window.FXAudio?.name ? `已导入：${window.FXAudio.name}` : '尚未导入音乐（音频仅保存在本机浏览器）';
    [...$('newsFreqSeg').children].forEach(btn => btn.classList.toggle('active', btn.dataset.freq === s.newsFreq));
    [...$('themeSeg').children].forEach(btn => btn.classList.toggle('active', btn.dataset.theme === s.theme));
    [...$('difficultySeg').children].forEach(btn => btn.classList.toggle('active', btn.dataset.difficulty === s.difficulty));
    $('difficultyHint').textContent = s.difficulty === 'safe'
      ? '安全网：最高 20×，不开放贷款，不出现「最后一把」'
      : '标准：最高 100×，开放贷款，会出现「最后一把」';
    $('musicPreviewBtn').textContent = previewing ? '停止试听' : '试听';
  }

  function commitNickname() {
    const input = $('nicknameInput');
    if (!input) return;
    input.value = E.setNickname(input.value);
  }

  async function onMusicFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const name = await window.FXAudio.saveMusicFile(file);
      renderSettingsControls();
      toast(`已导入音乐：${name}`);
      if (E.settings.musicOn) window.FXAudio.playMusic();
    } catch (error) {
      console.warn(error);
      toast('音乐导入失败，请换一个音频文件。');
    }
  }

  function toggleMusicPreview() {
    if (!window.FXAudio?.buffer) { toast('请先导入一个音频文件。'); return; }
    if (previewing) {
      window.FXAudio.stopMusic();
      previewing = false;
    } else {
      previewing = window.FXAudio.previewMusic();
      if (previewing) setTimeout(() => { previewing = false; renderSettingsControls(); }, 6200);
    }
    renderSettingsControls();
  }

  async function clearMusic() {
    window.FXAudio.stopMusic();
    previewing = false;
    await window.FXAudio.clearMusic();
    renderSettingsControls();
    toast('已清除本地音乐。');
  }

  async function restoreMusic() {
    try {
      const ok = await window.FXAudio.restoreMusic();
      if (ok) {
        renderSettingsControls();
        if (E.settings.musicOn) window.FXAudio.playMusic();
      }
    } catch (_) {}
  }

  /* ================= 教程 ================= */
  function renderTutorial() {
    const step = D.TUTORIAL[tutorialStep];
    $('tutorialStep').textContent = `${tutorialStep + 1} / ${D.TUTORIAL.length}`;
    $('tutorialIcon').textContent = step.icon;
    $('tutorialTitle').textContent = step.title;
    $('tutorialText').textContent = step.text;
    $('tutorialExample').textContent = step.example;
    $('tutorialBack').disabled = tutorialStep === 0;
    $('tutorialNext').textContent = tutorialStep === D.TUTORIAL.length - 1 ? '开始上头' : '下一步';
    scheduleTermify();
  }

  function openTutorial() {
    tutorialStep = 0;
    renderTutorial();
    $('welcome').classList.add('hidden');
    $('tutorial').classList.remove('hidden');
    window.FXAudio?.click();
  }

  function closeTutorial() {
    $('tutorial').classList.add('hidden');
    try { localStorage.setItem('af-intro-v1', 'done'); } catch (_) {}
    const shouldPractice = tutorialPractice;
    tutorialPractice = false;
    if (shouldPractice) startPractice();
    else maybeOpenContractPicker();
  }

  function openHelp() {
    $('helpModal').classList.remove('hidden');
    window.FXAudio?.click();
  }

  function closeHelp() {
    $('helpModal').classList.add('hidden');
  }

  /* ================= 事件绑定 ================= */
  function bindEvents() {
    const submitOrder = side => {
      const stops = E.settings.advancedTrading
        ? { stopPrice: $('stopPriceInput').value, takePrice: $('takePriceInput').value }
        : null;
      if (E.openPosition(side, false, stops)) {
        $('stopPriceInput').value = '';
        $('takePriceInput').value = '';
        flashMetric('cash', 'down');
        flashMetric('usedMargin', 'up');
        flashMetric('orderCash', 'down');
        flashMetric('orderMargin', 'up');
        pulseOrderPosition();
        const pressed = side === 1 ? $('longBtn') : $('shortBtn');
        pressed.classList.add('pressed');
        setTimeout(() => pressed.classList.remove('pressed'), 180);
        if (practiceMode) showPracticeHint('仓位开好了。等 2–3 秒，看看浮动盈亏，然后点持仓里的「平仓」。');
      }
    };
    $('longBtn').addEventListener('click', () => submitOrder(1));
    $('shortBtn').addEventListener('click', () => submitOrder(-1));
    $('simMode').addEventListener('click', () => { stopPractice(); E.setMode('sim'); maybeOpenContractPicker(); });
    $('realMode').addEventListener('click', () => { stopPractice(); E.setMode('real'); });
    $('battleMode').addEventListener('click', () => { stopPractice(); E.setMode('battle'); });
    $('challengeMode').addEventListener('click', () => { stopPractice(); E.setMode('challenge'); });

    $('challengeStartBtn').addEventListener('click', () => E.startChallenge());
    $('challengeRetireBtn').addEventListener('click', () => {
      openModal({
        icon: '♡', title: '现在金盆洗手？',
        message: '所有未平仓仓位会按当前价格结算，本次挑战随即结束，收益将记入今日榜单。',
        confirm: '确认结算',
        action: () => { closeModal(); E.finishChallenge(); }
      });
    });
    $('challengeRankBtn').addEventListener('click', () => E.showChallengeRank());

    $('battleChooseBtn').addEventListener('click', () => {
      if (E.state.positions.length) { toast('经典战役账户仍有持仓，请先平仓再更换档案。'); return; }
      E.setBattlePicker(true);
    });

    $('nextDayBtn').addEventListener('click', () => E.nextDay());
    $('replayBtn').addEventListener('click', () => E.replay());
    $('playBtn').addEventListener('click', () => E.setAutoPlay(!E.autoPlay));

    $('mobilePairSelect').addEventListener('change', event => E.setPair(event.target.value));
    $('leverageRange').addEventListener('input', event => {
      E.setLeverage(event.target.value);
      renderOrder();
    });
    $('marginInput').addEventListener('input', event => {
      E.setMargin(event.target.value);
      renderOrder();
    });
    $('maxBtn').addEventListener('click', () => { E.maxMargin(); renderOrder(); });

    $('historyToggle').addEventListener('click', () => { historyExpanded = !historyExpanded; renderHistory(); });

    $('cashoutBtn').addEventListener('click', () => {
      const s = E.state;
      if (practiceMode) return toast('先完成练习：点持仓里的「平仓」。');
      if (s.mode === 'challenge') return;      if (s.runClosed) {
        openModal({
          icon: '↻', title: '再来一局？',
          message: '本局已经结束。重新开始会把当前模式的余额、持仓、贷款和记录清空。',
          confirm: '重新开始',
          action: () => {
            const mode = E.state.mode;
            closeModal();
            E.resetMode();
            if (mode === 'real') E.loadReal();
            if (mode === 'sim') maybeOpenContractPicker();
          }
        });
        return;
      }
      if (!s.positions.length && !s.history.length) return toast('本局还没开始，先开一笔再收手。');
      openModal({
        icon: '■', title: '现在收手？',
        message: '所有持仓会按当前价格结算，本局结束。之后可以点「再来一局」重新开始。',
        detail: `现在能带走 ${D.money(E.account().equity)}\n本局峰值 ${D.money(Math.max(Number(s.peakEquity) || 10000, E.account().equity))}`,
        preline: true,
        confirm: '确认收手',
        action: () => { closeModal(); E.cashOut(); }
      });
    });

    $('borrowBtn').addEventListener('click', () => {
      if (E.state.mode === 'challenge') return toast('挑战模式不开放贷款。');
      if (E.state.debt > 0) return toast('请先偿还当前贷款，再申请新贷款。');
      openModal({
        iconImage: './assets/dafeiyu.svg',
        icon: '$', title: '申请周转贷款',
        message: '最多可借 $200,000。借得越多，日利率越高；真实数据与经典战役每推进一个交易日计息，模拟数据每 30 秒计息一次。',
        loanQuote: true,
        input: { label: '借款金额（最多 $200,000）', value: 1000, max: D.LOAN_MAX },
        confirm: '确认借入',
        action: amount => {
          if (!E.borrowLoan(amount)) return toast('请输入 $1–$200,000 的借款金额。');
          closeModal();
          toast(`已借入 ${D.money(amount)}，日利率 ${D.rateText(E.state.loanRate)}。`);
        }
      });
    });

    $('repayBtn').addEventListener('click', () => {
      if (E.state.debt <= 0) return toast('现在没有待还贷款。');
      if (E.state.cash < 0.01) return toast('可用余额不足，暂时无法还款。');
      const max = Math.min(E.state.debt, E.state.cash);
      openModal({
        icon: '♡', title: '偿还贷款',
        message: `当前待还 ${D.money(E.state.debt)}，可用余额 ${D.money(E.state.cash)}。`,
        input: { label: '还款金额', value: Math.floor(max * 100) / 100, min: 0.01, step: 0.01, max },
        confirm: '确认还款',
        action: amount => {
          if (!E.repayLoan(amount)) return toast('还款金额超出可用范围。');
          closeModal();
          toast(`已偿还 ${D.money(amount)}。`);
        }
      });
    });

    $('resetBtn').addEventListener('click', () => {
      if (E.challenge.active && E.state.mode === 'challenge') return toast('挑战进行中不能重置，请选择金盆洗手完成结算。');
      openModal({
        icon: '↺', title: '重置当前模式？',
        message: '只会重置当前模式的余额、持仓、贷款和交易记录，其他模式不受影响。',
        confirm: '确认重置',
        action: () => {
          const mode = E.state.mode;
          closeModal();
          stopPractice();
          E.resetMode();
          if (mode === 'real') E.loadReal();
          if (mode === 'sim') maybeOpenContractPicker();
        }
      });
    });

    $('modalConfirm').addEventListener('click', () => {
      if (modalAction) modalAction(Number($('modalInput').value));
      else closeModal();
    });
    $('modalInput').addEventListener('input', updateLoanQuote);
    $('modalInput').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); $('modalConfirm').click(); }
    });
    $('modalCancel').addEventListener('click', closeModal);
    $('modalClose').addEventListener('click', closeModal);
    $('modal').addEventListener('click', event => { if (event.target === $('modal')) closeModal(); });
    $('modalExtraBtn').addEventListener('click', () => { if (modalExtraAction) modalExtraAction(); });
    $('halfCloseBtn').addEventListener('click', () => {
      if (!riskPositionId) return;
      if (E.partialClose(riskPositionId, 0.5)) closeModal({ skipRiskPenalty: true });
    });

    $('addMarginBtn').addEventListener('click', () => {
      const value = Number($('modalInput').value);
      if (E.addMargin(value, false)) closeModal();
    });
    $('loanMarginBtn').addEventListener('click', () => {
      const value = Number($('modalInput').value);
      if (E.addMargin(value, true)) closeModal();
    });

    $('tutorialBtn').addEventListener('click', () => { tutorialPractice = false; openTutorial(); });
    $('helpBtn').addEventListener('click', openHelp);
    $('welcomeHelpBtn').addEventListener('click', openHelp);
    $('helpClose').addEventListener('click', closeHelp);
    $('helpOk').addEventListener('click', closeHelp);
    $('helpModal').addEventListener('click', event => { if (event.target === $('helpModal')) closeHelp(); });
    $('newPlayerBtn').addEventListener('click', () => {
      tutorialPractice = true;
      E.setDifficulty('safe');
      openTutorial();
    });
    $('veteranBtn').addEventListener('click', () => {
      E.setDifficulty('standard');
      try { localStorage.setItem('af-intro-v1', 'done'); } catch (_) {}
      $('welcome').classList.add('hidden');
      window.FXAudio?.click();
      maybeOpenContractPicker();
    });
    $('tutorialBack').addEventListener('click', () => { tutorialStep = Math.max(0, tutorialStep - 1); renderTutorial(); });
    $('tutorialNext').addEventListener('click', () => {
      if (tutorialStep >= D.TUTORIAL.length - 1) closeTutorial();
      else { tutorialStep++; renderTutorial(); }
    });
    $('tutorialClose').addEventListener('click', closeTutorial);
    $('tutorialSkip').addEventListener('click', closeTutorial);

    $('settingsBtn').addEventListener('click', () => { renderSettingsControls(); $('settingsModal').classList.remove('hidden'); window.FXAudio?.click(); });
    $('settingsClose').addEventListener('click', () => { commitNickname(); $('settingsModal').classList.add('hidden'); });
    $('settingsDone').addEventListener('click', () => { commitNickname(); $('settingsModal').classList.add('hidden'); window.FXAudio?.click(); });
    $('settingsReset').addEventListener('click', () => {
      E.saveSettings({ ...DEFAULT_SETTINGS });
      window.FXAudio?.stopMusic();
      previewing = false;
      applyTheme(E.settings.theme);
      renderSettingsControls();
      render();
      renderTicker();
      drawChart();
      toast('已恢复默认设置。');
    });
    $('nicknameInput').addEventListener('change', event => {
      const name = E.setNickname(event.target.value);
      event.target.value = name;
      toast(`名字已改成「${name}」。`);
    });
    $('nicknameInput').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); event.target.blur(); }
    });
    $('advancedToggle').addEventListener('change', event => {
      E.saveSettings({ advancedTrading: event.target.checked });
      renderOrder();
      toast(event.target.checked ? '进阶交易已开启：下单时可以填止损/止盈。' : '进阶交易已关闭。');
    });
    $('sfxToggle').addEventListener('change', event => {
      E.saveSettings({ sfxOn: event.target.checked });
      window.FXAudio?.configure(E.settings);
      window.FXAudio?.click();
    });
    $('sfxVolume').addEventListener('input', event => {
      E.saveSettings({ sfxVol: Number(event.target.value) });
      window.FXAudio?.configure(E.settings);
    });
    $('sfxVolume').addEventListener('change', () => window.FXAudio?.click());
    $('musicToggle').addEventListener('change', event => {
      E.saveSettings({ musicOn: event.target.checked });
      window.FXAudio?.configure(E.settings);
      if (E.settings.musicOn) {
        if (window.FXAudio?.buffer) window.FXAudio.playMusic();
        else toast('尚未导入音乐，请先选择本地音频文件。');
      } else window.FXAudio?.stopMusic();
    });
    $('musicVolume').addEventListener('input', event => {
      E.saveSettings({ musicVol: Number(event.target.value) });
      window.FXAudio?.configure(E.settings);
    });
    $('musicFile').addEventListener('change', onMusicFile);
    $('musicPreviewBtn').addEventListener('click', toggleMusicPreview);
    $('musicClearBtn').addEventListener('click', clearMusic);
    $('newsToggle').addEventListener('change', event => {
      E.saveSettings({ newsOn: event.target.checked });
      renderTicker();
      if (!E.settings.newsOn) {
        newsFloatQueue = [];
        dismissNewsFloat();
      }
    });
    $('newsFreqSeg').addEventListener('click', event => {
      const btn = event.target.closest('button[data-freq]');
      if (!btn) return;
      E.saveSettings({ newsFreq: btn.dataset.freq });
      renderSettingsControls();
      toast('新闻频率已调整。');
    });
    $('themeSeg').addEventListener('click', event => {
      const btn = event.target.closest('button[data-theme]');
      if (!btn) return;
      E.saveSettings({ theme: btn.dataset.theme });
      applyTheme(E.settings.theme);
      renderSettingsControls();
      drawChart();
    });

    $('difficultySeg').addEventListener('click', event => {
      const btn = event.target.closest('button[data-difficulty]');
      if (!btn) return;
      const changed = E.setDifficulty(btn.dataset.difficulty);
      renderSettingsControls();
      if (changed) render();
    });

    $('shareBtn').addEventListener('click', openShare);
    $('shareClose').addEventListener('click', () => $('shareModal').classList.add('hidden'));
    $('shareCloseBtn').addEventListener('click', () => $('shareModal').classList.add('hidden'));
    $('shareDownloadBtn').addEventListener('click', downloadShare);
    $('shareModal').addEventListener('click', event => { if (event.target === $('shareModal')) $('shareModal').classList.add('hidden'); });

    $('achBtn').addEventListener('click', () => { renderAchBook(); $('achModal').classList.remove('hidden'); window.FXAudio?.click(); });
    $('achOk').addEventListener('click', () => $('achModal').classList.add('hidden'));
    $('achClose').addEventListener('click', () => $('achModal').classList.add('hidden'));

    $('openCasesBtn').addEventListener('click', openCases);
    $('casesClose').addEventListener('click', closeCases);
    $('casesDone').addEventListener('click', closeCases);
    $('casesModal').addEventListener('click', event => { if (event.target === $('casesModal')) closeCases(); });
    $('casesFilter').addEventListener('click', event => {
      const btn = event.target.closest('button[data-mode]');
      if (!btn) return;
      casesFilter = btn.dataset.mode;
      renderCases();
    });
    $('casesClear').addEventListener('click', () => {
      if (!E.getCases().length) return;
      openModal({
        icon: '🗂', title: '清空病历库？',
        message: '所有已保存的病历会从本机删除，不能恢复。',
        confirm: '清空',
        action: () => {
          E.clearCases();
          closeModal();
          renderCases();
          renderAchBook();
          toast('病历库已清空。');
        }
      });
    });

    $('contractClose').addEventListener('click', () => selectContract('free'));
    $('contractModal').addEventListener('click', event => {
      if (event.target === $('contractModal')) selectContract('free');
    });

    $('openEndingsBtn').addEventListener('click', openEndings);
    $('endingsClose').addEventListener('click', closeEndings);
    $('endingsDone').addEventListener('click', closeEndings);
    $('endingsModal').addEventListener('click', event => { if (event.target === $('endingsModal')) closeEndings(); });

    $('newsCenterBtn').addEventListener('click', () => { renderNewsCenter(); $('newsCenter').classList.remove('hidden'); });
    $('newsCenterOk').addEventListener('click', () => $('newsCenter').classList.add('hidden'));
    $('newsCenterClose').addEventListener('click', () => $('newsCenter').classList.add('hidden'));
    $('newsFloatClose').addEventListener('click', dismissNewsFloat);

    $('tfSeg').addEventListener('click', event => {
      const btn = event.target.closest('button[data-tf]');
      if (!btn || !isPlayback()) return;
      E.setTimeframe(btn.dataset.tf);
    });

    $('rangeQuickSeg').addEventListener('click', event => {
      const btn = event.target.closest('button[data-days]');
      if (!btn) return;
      const startValue = $('rangeStart').value;
      let start, end;
      if (btn.dataset.days === 'ytd') {
        const today = new Date();
        start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
        end = today;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(startValue)) {
        start = new Date(`${startValue}T00:00:00Z`);
        end = new Date(start.getTime() + (Number(btn.dataset.days) - 1) * 86400000);
      } else {
        end = new Date();
        start = new Date();
        start.setUTCDate(start.getUTCDate() - (Number(btn.dataset.days) - 1));
      }
      $('rangeStart').value = start.toISOString().slice(0, 10);
      $('rangeEnd').value = end.toISOString().slice(0, 10);
      E.applyRealRange({ start: $('rangeStart').value, end: $('rangeEnd').value });
    });
    $('rangeApplyBtn').addEventListener('click', () => E.applyRealRange({ start: $('rangeStart').value, end: $('rangeEnd').value }));

    $('progressBar').addEventListener('input', event => {
      progressActive = true;
      clearTimeout(progressTimer);
      progressTimer = setTimeout(() => { progressActive = false; }, 600);
      E.setCursor(Number(event.target.value));
    });
    $('progressBar').addEventListener('change', () => {
      progressActive = false;
      E.setCursor(Number($('progressBar').value));
      E.save();
    });

    document.addEventListener('click', event => {
      const term = event.target.closest && event.target.closest('.term');
      if (term) {
        event.preventDefault();
        event.stopPropagation();
        showGlossary(term.dataset.term, term);
        return;
      }
      if (!$('glossaryPop').classList.contains('hidden') && !event.target.closest('#glossaryPop')) hideGlossary();
    }, true);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('glossaryPop').classList.contains('hidden')) {
        event.preventDefault();
        event.stopPropagation();
        hideGlossary();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target.classList?.contains('term')) {
        event.preventDefault();
        event.stopPropagation();
        showGlossary(event.target.dataset.term, event.target);
      }
    }, true);
    $('glossaryClose').addEventListener('click', hideGlossary);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (modalOpen) { closeModal(); return; }
        const layers = ['endingsModal', 'contractModal', 'casesModal', 'settingsModal', 'newsCenter', 'achModal', 'shareModal', 'tutorial', 'helpModal'];
        const open = layers.find(id => !$(id).classList.contains('hidden'));
        if (open === 'tutorial') closeTutorial();
        else if (open === 'endingsModal') closeEndings();
        else if (open === 'contractModal') selectContract('free');
        else if (open === 'settingsModal') { commitNickname(); $(open).classList.add('hidden'); }
        else if (open) $(open).classList.add('hidden');
      }
    });

    window.addEventListener('resize', drawChart);
    window.addEventListener('beforeunload', () => E.save());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') E.save(); });
  }

  /* ================= 启动 ================= */
  function init() {
    bindEvents();
    applyTheme(E.settings.theme);
    window.FXAudio?.configure(E.settings);
    render();
    renderSettingsControls();
    window.addEventListener('fx:update', render);
    try {
      if (!localStorage.getItem('af-intro-v1')) {
        $('welcome').classList.remove('hidden');
        $('newPlayerBtn').focus();
      }
    } catch (_) {}
    restoreMusic();
    scheduleTermify();
    maybeOpenContractPicker();
  }

  window.FXUI = {
    init,
    render,
    toast,
    narrate,
    pushNews,
    achievementUnlocked,
    openModal,
    openRiskModal,
    showCloseModal,
    showSettlementModal,
    showContractEvent,
    renderAchBook,
    renderNewsCenter,
    renderTicker
  };
})();
