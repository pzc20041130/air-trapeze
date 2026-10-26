/* 空中飞人 · Canvas K 线绘制 */
(function () {
  'use strict';

  const THEMES = {
    day: { bg: '#24383c', grid: '#3c5254', vgrid: '#32494b', axis: '#91a9a8', date: '#7f9999', up: '#8fddb1', down: '#f19aa8', dash: '#d5e1b3', empty: '#8fb3a9' },
    night: { bg: '#0e2023', grid: '#24413c', vgrid: '#1c3436', axis: '#7e9a94', date: '#5f7d78', up: '#8fddb1', down: '#f19aa8', dash: '#c9d8a8', empty: '#7e9a94' }
  };

  function render(canvas, opts) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const theme = THEMES[opts.theme] || THEMES.day;
    const w = rect.width, h = rect.height;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    const left = 14, right = w - 60, top = 22, bottom = h - 28;
    const candles = (opts.candles || []).filter(c => c && Number.isFinite(c.high) && Number.isFinite(c.low));
    if (!candles.length) {
      ctx.fillStyle = theme.empty;
      ctx.font = '12px "DM Mono", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(opts.emptyText || '等待行情…', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    const values = candles.flatMap(c => [c.high, c.low]);
    const lines = (opts.lines || []).filter(line => line && Number.isFinite(line.price));
    const lineValues = lines.map(line => line.price);
    let min = Math.min(...values, ...lineValues), max = Math.max(...values, ...lineValues);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    if (max === min) { max = min * 1.001 + 0.0001; min = min * 0.999 - 0.0001; }
    const pad = Math.max((max - min) * 0.16, Math.abs(min) * 0.0006);
    min -= pad; max += pad;
    const yOf = value => top + (max - value) / (max - min) * (bottom - top);
    const digits = Number.isInteger(opts.digits) ? opts.digits : 5;

    // 横向网格 + 价格刻度
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.axis;
    ctx.font = '10px "DM Mono", Consolas, monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i < 5; i++) {
      const y = top + i * (bottom - top) / 4;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
      ctx.fillText((max - i * (max - min) / 4).toFixed(digits), right + 7, y + 3);
    }
    // 纵向网格
    ctx.strokeStyle = theme.vgrid;
    for (let i = 0; i < 6; i++) {
      const x = left + i * (right - left) / 5;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    }

    const step = (right - left) / candles.length;
    const bodyWidth = Math.max(4, Math.min(13, step * 0.62));
    candles.forEach((c, i) => {
      const x = left + step * (i + 0.5);
      const rising = c.close >= c.open;
      ctx.strokeStyle = rising ? theme.up : theme.down;
      ctx.fillStyle = rising ? theme.up : theme.down;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yOf(c.high));
      ctx.lineTo(x, yOf(c.low));
      ctx.stroke();
      const yTop = yOf(Math.max(c.open, c.close));
      const yBottom = yOf(Math.min(c.open, c.close));
      ctx.fillRect(x - bodyWidth / 2, yTop, bodyWidth, Math.max(2, yBottom - yTop));
      if (opts.playback && c.open > 0) {
        const move = c.close / c.open - 1;
        if (Math.abs(move) >= 0.01) {
          const y = move > 0 ? Math.min(bottom - 3, yOf(c.low) + 9) : Math.max(top + 3, yOf(c.high) - 9);
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // 持仓线 / 爆仓线
    let lastLabelY = -99;
    const labelFont = w < 520 ? '10.5px "DM Mono", Consolas, monospace' : '11.5px "DM Mono", Consolas, monospace';
    lines.forEach(line => {
      if (!Number.isFinite(line.price) || line.price < min || line.price > max) return;
      const y = Math.max(top + 11, Math.min(bottom - 10, yOf(line.price)));
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = line.color || theme.dash;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.restore();
      if (Math.abs(y - lastLabelY) < 15) return;
      lastLabelY = y;
      const label = String(line.label || line.price.toFixed(digits));
      ctx.font = labelFont;
      const labelWidth = Math.min(right - left - 8, ctx.measureText(label).width + 12);
      const labelX = left + 4;
      const labelHeight = 17;
      const labelY = Math.max(top + 2, Math.min(bottom - labelHeight - 2, y - 16));
      ctx.fillStyle = 'rgba(14, 30, 30, 0.84)';
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      ctx.fillStyle = line.color || theme.axis;
      ctx.textAlign = 'left';
      ctx.fillText(label, labelX + 6, labelY + 12);
    });

    // 日期 / 时间轴
    ctx.fillStyle = theme.date;    ctx.font = '10px "DM Mono", Consolas, monospace';
    if (opts.playback && opts.dates && opts.dates.length) {
      ctx.textAlign = 'left';
      ctx.fillText(String(opts.dates[0]).slice(5), left, h - 9);
      ctx.textAlign = 'right';
      ctx.fillText(String(opts.dates[opts.dates.length - 1]).slice(5), right, h - 9);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText('← 过去', left, h - 9);
      ctx.textAlign = 'right';
      ctx.fillText('现在 →', right, h - 9);
    }
    ctx.textAlign = 'left';

    // 当前价虚线
    const price = opts.current;
    if (Number.isFinite(price) && price >= min && price <= max) {
      const y = yOf(price);
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = theme.dash;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  window.FXChart = { render, THEMES };
})();
