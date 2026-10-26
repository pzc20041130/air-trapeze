/* 空中飞人 · 音效与本地音乐 */
(function () {
  'use strict';

  const DB_NAME = 'af-audio';
  const STORE = 'music';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, 'track');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbGet() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get('track');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbClear() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  const FXAudio = {
    ctx: null,
    sfxGain: null,
    musicGain: null,
    musicSource: null,
    buffer: null,
    name: '',
    previewing: false,
    previewTimer: null,
    settings: { sfxOn: true, sfxVol: 70, musicOn: false, musicVol: 60 },

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return this.ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      this.sfxGain = ctx.createGain();
      this.musicGain = ctx.createGain();
      this.sfxGain.connect(ctx.destination);
      this.musicGain.connect(ctx.destination);
      this.applyVolumes();
      return ctx;
    },

    applyVolumes() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.sfxGain.gain.setTargetAtTime(this.settings.sfxOn ? this.settings.sfxVol / 100 : 0, now, 0.02);
      this.musicGain.gain.setTargetAtTime(this.settings.musicOn ? this.settings.musicVol / 100 : 0, now, 0.05);
    },

    configure(settings) {
      this.settings = { ...this.settings, ...settings };
      this.applyVolumes();
    },

    tone(freq, delay, dur, type, gainValue, slideTo) {
      const ctx = this.ensure();
      if (!ctx || !this.settings.sfxOn || this.settings.sfxVol <= 0) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(t); osc.stop(t + dur + 0.02);
    },

    click() { this.tone(520, 0, 0.06, 'triangle', 0.05); },
    open() { this.tone(420, 0, 0.1, 'triangle', 0.09); this.tone(640, 0.06, 0.12, 'triangle', 0.07); },
    win() { this.tone(523, 0, 0.12, 'sine', 0.1); this.tone(659, 0.09, 0.14, 'sine', 0.1); this.tone(784, 0.19, 0.2, 'sine', 0.09); },
    lose() { this.tone(330, 0, 0.16, 'sine', 0.08, 240); this.tone(220, 0.12, 0.24, 'sine', 0.07); },
    blow() { this.tone(300, 0, 0.5, 'sawtooth', 0.06, 60); this.tone(120, 0.1, 0.5, 'triangle', 0.08, 40); },
    alarm() { this.tone(880, 0, 0.1, 'square', 0.05); this.tone(880, 0.18, 0.1, 'square', 0.05); this.tone(660, 0.36, 0.16, 'square', 0.05); },
    achieve() { this.tone(659, 0, 0.1, 'triangle', 0.08); this.tone(880, 0.08, 0.12, 'triangle', 0.08); this.tone(1046, 0.17, 0.24, 'triangle', 0.07); },

    async saveMusicFile(file) {
      const raw = await file.arrayBuffer();
      await idbPut({ name: file.name, buf: raw });
      this.name = file.name;
      await this.loadBuffer(raw);
      return file.name;
    },

    async restoreMusic() {
      try {
        const record = await idbGet();
        if (!record || !record.buf) return false;
        this.name = record.name || '本地音乐';
        await this.loadBuffer(record.buf);
        return true;
      } catch (_) { return false; }
    },

    async loadBuffer(raw) {
      const ctx = this.ensure();
      if (!ctx) return;
      this.buffer = await ctx.decodeAudioData(raw.slice(0));
    },

    playMusic() {
      const ctx = this.ensure();
      if (!ctx || !this.buffer || !this.settings.musicOn) return;
      this.stopMusic();
      const src = ctx.createBufferSource();
      src.buffer = this.buffer;
      src.loop = true;
      src.connect(this.musicGain);
      src.start();
      this.musicSource = src;
    },

    stopMusic() {
      if (this.musicSource) {
        try { this.musicSource.stop(); } catch (_) {}
        this.musicSource = null;
      }
    },

    previewMusic() {
      const ctx = this.ensure();
      if (!ctx || !this.buffer) return false;
      clearTimeout(this.previewTimer);
      this.stopMusic();
      const wasOn = this.settings.musicOn;
      this.musicGain.gain.setTargetAtTime(Math.max(0.0001, this.settings.musicVol / 100), ctx.currentTime, 0.02);
      const src = ctx.createBufferSource();
      src.buffer = this.buffer;
      src.connect(this.musicGain);
      src.start();
      this.musicSource = src;
      this.previewTimer = setTimeout(() => {
        try { src.stop(); } catch (_) {}
        this.musicSource = null;
        if (!wasOn) this.applyVolumes();
      }, 6000);
      return true;
    },

    async clearMusic() {
      this.stopMusic();
      this.buffer = null;
      this.name = '';
      try { await idbClear(); } catch (_) {}
    }
  };

  window.FXAudio = FXAudio;
})();
