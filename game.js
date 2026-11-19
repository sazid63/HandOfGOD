'use strict';

/*
 * HAND OF GOD
 * A pixelated hand with divine powers. Allegedly.
 */

(function () {
  const W = 960;
  const H = 540;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const easeIn = (k) => Math.pow(clamp(k, 0, 1), 3);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ------------------------------------------------------------------ */
  /* Options (volume is the only one, as foretold)                       */
  /* ------------------------------------------------------------------ */

  const OPT_KEY = 'handofgod.options.v1';
  const options = { volume: 60 };

  try {
    const saved = JSON.parse(localStorage.getItem(OPT_KEY) || 'null');
    if (saved && typeof saved.volume === 'number') {
      options.volume = clamp(Math.round(saved.volume), 0, 100);
    }
  } catch (err) {
    /* storage is optional */
  }

  function saveOptions() {
    try {
      localStorage.setItem(OPT_KEY, JSON.stringify(options));
    } catch (err) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Audio                                                               */
  /* ------------------------------------------------------------------ */

  const Sound = {
    ac: null,
    master: null,

    ensure() {
      if (this.ac) {
        if (this.ac.state === 'suspended') this.ac.resume();
        return true;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        this.ac = new AC();
      } catch (err) {
        return false;
      }
      this.master = this.ac.createGain();
      this.master.gain.value = this.gain();
      this.master.connect(this.ac.destination);
      return true;
    },

    gain() {
      return (options.volume / 100) * 0.55;
    },

    setVolume() {
      if (this.master && this.ac) {
        this.master.gain.setTargetAtTime(this.gain(), this.ac.currentTime, 0.02);
      }
    },

    tone(o) {
      if (!this.ensure()) return;
      const ac = this.ac;
      const freq = o.freq || 440;
      const dur = o.dur || 0.15;
      const start = ac.currentTime + (o.at || 0);
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(Math.max(20, freq), start);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), start + dur);
      const peak = Math.max(0.0002, o.vol == null ? 0.15 : o.vol);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(peak, start + Math.min(dur * 0.4, 0.02));
      amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(amp);
      amp.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    },

    noise(o) {
      if (!this.ensure()) return;
      const ac = this.ac;
      const dur = o.dur || 0.3;
      const start = ac.currentTime + (o.at || 0);
      const len = Math.max(1, Math.floor(ac.sampleRate * dur));
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(o.from || 1800, start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, o.to || 300), start + dur);
      filter.Q.value = o.q || 1;
      const amp = ac.createGain();
      amp.gain.setValueAtTime(Math.max(0.0002, o.vol == null ? 0.2 : o.vol), start);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(filter);
      filter.connect(amp);
      amp.connect(this.master);
      src.start(start);
      src.stop(start + dur);
    }
  };

  const SFX = {
    move() {
      Sound.tone({ freq: 560, to: 700, dur: 0.05, type: 'square', vol: 0.07 });
    },
    select() {
      Sound.tone({ freq: 660, dur: 0.07, type: 'square', vol: 0.11 });
      Sound.tone({ freq: 880, dur: 0.08, type: 'square', vol: 0.09, at: 0.07 });
      Sound.tone({ freq: 1320, dur: 0.12, type: 'square', vol: 0.07, at: 0.14 });
    },
    back() {
      Sound.tone({ freq: 420, to: 240, dur: 0.12, type: 'square', vol: 0.09 });
    },
    tick() {
      Sound.tone({ freq: 120, dur: 0.05, type: 'square', vol: 0.05 });
    },
    whisper() {
      Sound.noise({ dur: 1.4, vol: 0.05, from: 900, to: 200 });
      Sound.tone({ freq: 82, dur: 1.6, type: 'sine', vol: 0.09 });
    },
    rise() {
      Sound.tone({ freq: 70, to: 520, dur: 6.5, type: 'sawtooth', vol: 0.05 });
      Sound.tone({ freq: 105, to: 780, dur: 6.5, type: 'triangle', vol: 0.035, at: 0.2 });
    },
    chime() {
      Sound.tone({ freq: 1180, dur: 0.5, type: 'sine', vol: 0.09 });
      Sound.tone({ freq: 1770, dur: 0.45, type: 'sine', vol: 0.05, at: 0.02 });
    },
    charge() {
      Sound.tone({ freq: 180, to: 1500, dur: 3.0, type: 'square', vol: 0.06 });
      Sound.noise({ dur: 3.0, vol: 0.06, from: 400, to: 3000 });
    },
    danger() {
      Sound.tone({ freq: 110, dur: 0.5, type: 'square', vol: 0.12 });
      Sound.tone({ freq: 165, dur: 0.5, type: 'square', vol: 0.08, at: 0.06 });
      Sound.noise({ dur: 0.6, vol: 0.1, from: 2500, to: 200 });
    },
    boom() {
      Sound.noise({ dur: 1.1, vol: 0.38, from: 6000, to: 120, q: 0.8 });
      Sound.tone({ freq: 120, to: 28, dur: 1.0, type: 'sine', vol: 0.34 });
      Sound.tone({ freq: 70, to: 40, dur: 1.4, type: 'triangle', vol: 0.2, at: 0.02 });
    },
    womp() {
      Sound.tone({ freq: 300, to: 250, dur: 0.26, type: 'square', vol: 0.16 });
      Sound.tone({ freq: 225, to: 180, dur: 0.26, type: 'square', vol: 0.15, at: 0.28 });
      Sound.tone({ freq: 160, to: 105, dur: 0.62, type: 'square', vol: 0.16, at: 0.56 });
      Sound.noise({ dur: 0.18, vol: 0.14, from: 2600, to: 400 });
    },
    bell() {
      Sound.tone({ freq: 392, dur: 1.6, type: 'sine', vol: 0.12 });
      Sound.tone({ freq: 784, dur: 1.1, type: 'sine', vol: 0.04, at: 0.01 });
    },
    hum() {
      Sound.tone({ freq: 55, dur: 3.2, type: 'triangle', vol: 0.1 });
      Sound.tone({ freq: 82.5, dur: 3.2, type: 'sine', vol: 0.06 });
    }
  };

  const Music = {
    timer: null,
    step: 0,
    on: false,
    pattern: [
      440, 0, 523, 0, 659, 0, 523, 0,
      392, 0, 494, 0, 587, 0, 494, 0,
      349, 0, 440, 0, 523, 0, 440, 0,
      392, 0, 466, 0, 587, 0, 466, 0
    ],
    bass: [110, 98, 87, 98],

    start() {
      if (this.on) return;
      if (!Sound.ensure()) return;
      this.on = true;
      this.step = 0;
      this.timer = setInterval(() => this.tick(), 200);
    },

    stop() {
      this.on = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    tick() {
      if (!this.on) return;
      const i = this.step % this.pattern.length;
      const note = this.pattern[i];
      if (note) Sound.tone({ freq: note, dur: 0.16, type: 'triangle', vol: 0.045 });
      if (i % 4 === 0) {
        Sound.tone({ freq: this.bass[(this.step / 4) % this.bass.length | 0], dur: 0.42, type: 'sine', vol: 0.075 });
      }
      this.step++;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Drawing helpers                                                     */
  /* ------------------------------------------------------------------ */

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function label(text, x, y, o) {
    const opt = o || {};
    ctx.save();
    ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    ctx.font = (opt.size || 16) + 'px "Press Start 2P", monospace';
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = opt.baseline || 'middle';
    if (opt.glow) {
      ctx.shadowColor = opt.glowColor || opt.color || '#ffffff';
      ctx.shadowBlur = opt.glow;
    }
    ctx.fillStyle = opt.color || '#ffffff';
    ctx.fillText(text, Math.round(x), Math.round(y));
    ctx.restore();
  }

  const stars = [];
  for (let i = 0; i < 110; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() < 0.75 ? 2 : 3,
      p: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 1.7
    });
  }

  function drawVignette(strength) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength == null ? 0.75 : strength) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBackdrop(brightness) {
    const b = brightness == null ? 1 : brightness;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#08051a');
    g.addColorStop(0.52, '#150c2e');
    g.addColorStop(1, '#2a0e38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(globalTime * s.sp * 0.55 + s.p));
      ctx.fillStyle = 'rgba(205,195,255,' + (tw * 0.55 * b) + ')';
      ctx.fillRect(Math.round(s.x), Math.round(s.y + Math.sin(globalTime * 0.25 + s.p) * 4), s.s, s.s);
    }

    drawVignette();
  }

  function drawScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }

  /* ------------------------------------------------------------------ */
  /* The Hand (built out of pixels, like the gods intended)              */
  /* ------------------------------------------------------------------ */

  const SPR_W = 48;
  const SPR_H = 54;
  const FINGER_ROOT = 19;

  function buildHandGrid(extended) {
    const grid = new Array(SPR_W * SPR_H).fill(0);
    const setCell = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < SPR_W && y < SPR_H) grid[y * SPR_W + x] = v;
    };
    const round = (x, y, w, h, r, v) => {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const cx0 = x + i;
          const cy0 = y + j;
          const nearL = i < r;
          const nearR = i >= w - r;
          const nearT = j < r;
          const nearB = j >= h - r;
          let cx = null;
          let cy = null;
          if (nearL && nearT) { cx = x + r - 0.5; cy = y + r - 0.5; }
          else if (nearR && nearT) { cx = x + w - 0.5 - r; cy = y + r - 0.5; }
          else if (nearL && nearB) { cx = x + r - 0.5; cy = y + h - 0.5 - r; }
          else if (nearR && nearB) { cx = x + w - 0.5 - r; cy = y + h - 0.5 - r; }
          let ok = true;
          if (cx !== null) {
            const dx = cx0 - cx;
            const dy = cy0 - cy;
            if (dx * dx + dy * dy > (r - 0.1) * (r - 0.1)) ok = false;
          }
          if (ok) setCell(cx0, cy0, v);
        }
      }
    };

    /* palm / back of hand */
    round(10, 26, 34, 20, 5, 1);
    /* thumb, folded across */
    round(4, 31, 10, 12, 4, 1);
    round(7, 37, 10, 7, 3, 1);
    /* folded fingers */
    round(11, 22, 8, 12, 3, 1);
    round(19, 19, 9, 14, 3, 1);
    round(36, 21, 8, 12, 3, 1);
    /* the star of the show */
    if (extended) {
      round(27, 4, 9, 32, 4, 1);
      /* nail */
      round(29, 6, 5, 6, 1, 4);
    } else {
      round(27, 21, 9, 12, 3, 1);
    }

    /* shading + outline (from the silhouette, so it stays crisp) */
    const solid = grid.slice();
    const isSolid = (x, y) => x >= 0 && y >= 0 && x < SPR_W && y < SPR_H && solid[y * SPR_W + x] !== 0;

    for (let y = 0; y < SPR_H; y++) {
      for (let x = 0; x < SPR_W; x++) {
        const i = y * SPR_W + x;
        const v = solid[i];
        if (!v) {
          if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) {
            grid[i] = 5;
          }
          continue;
        }
        if (v === 4) continue;
        const bottom = !isSolid(x, y + 1);
        const right = !isSolid(x + 1, y);
        const top = !isSolid(x, y - 1);
        const left = !isSolid(x - 1, y);
        if (bottom || right) grid[i] = 3;
        else if (top || left) grid[i] = 2;
        else grid[i] = 1;
      }
    }

    /* knuckle creases */
    if (extended) {
      for (let x = 28; x <= 34; x++) grid[26 * SPR_W + x] = 3;
    }

    return grid;
  }

  const GRID_FIST = buildHandGrid(false);
  const GRID_UP = buildHandGrid(true);

  const PALETTES = {
    skin: { 1: '#f0bd8b', 2: '#ffdcae', 3: '#c9884f', 4: '#ffeacb', 5: '#2a1420' },
    gold: { 1: '#ffd257', 2: '#fff4b8', 3: '#df9b1a', 4: '#fffce0', 5: '#3b1d08' },
    ghost: { 1: '#43335f', 2: '#5b4880', 3: '#2e2147', 4: '#6b5590', 5: '#150d24' }
  };

  const spriteCache = {};

  function spriteFor(extended, paletteName) {
    const key = (extended ? 'up-' : 'fist-') + paletteName;
    if (spriteCache[key]) return spriteCache[key];
    const grid = extended ? GRID_UP : GRID_FIST;
    const pal = PALETTES[paletteName] || PALETTES.skin;
    const c = document.createElement('canvas');
    c.width = SPR_W;
    c.height = SPR_H;
    const c2 = c.getContext('2d');
    for (let y = 0; y < SPR_H; y++) {
      for (let x = 0; x < SPR_W; x++) {
        const v = grid[y * SPR_W + x];
        if (!v) continue;
        c2.fillStyle = pal[v];
        c2.fillRect(x, y, 1, 1);
      }
    }
    spriteCache[key] = c;
    return c;
  }

  function drawHand(cx, cy, scale, o) {
    const opt = o || {};
    const extended = !!opt.extended;
    const grow = opt.grow == null ? 1 : opt.grow;
    const src = spriteFor(extended, opt.palette || 'skin');
    const alpha = opt.alpha == null ? 1 : opt.alpha;
    const rot = opt.rotation || 0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(cx), Math.round(cy));
    if (rot) ctx.rotate(rot);
    ctx.imageSmoothingEnabled = false;

    const dx = (-SPR_W * scale) / 2;
    const dy = -SPR_H * scale;

    if (opt.glow) {
      ctx.shadowColor = opt.glowColor || '#c58bff';
      ctx.shadowBlur = opt.glow;
      ctx.drawImage(src, dx, dy, SPR_W * scale, SPR_H * scale);
      ctx.drawImage(src, dx, dy, SPR_W * scale, SPR_H * scale);
      ctx.shadowBlur = 0;
    }

    if (!extended || grow >= 1) {
      ctx.drawImage(src, dx, dy, SPR_W * scale, SPR_H * scale);
    } else {
      const bodyH = SPR_H - FINGER_ROOT;
      ctx.drawImage(src, 0, FINGER_ROOT, SPR_W, bodyH, dx, dy + FINGER_ROOT * scale, SPR_W * scale, bodyH * scale);
      const fingerH = FINGER_ROOT * scale * grow;
      if (fingerH >= 1) {
        ctx.drawImage(src, 0, 0, SPR_W, FINGER_ROOT, dx, dy + FINGER_ROOT * scale - fingerH, SPR_W * scale, fingerH);
      }
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */

  const input = {
    x: W / 2,
    y: H / 2,
    inside: false,
    down: false,
    clicked: false,
    hover: null,
    keys: new Set(),
    pressed: new Set()
  };

  function syncPointer(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    input.x = clamp((e.clientX - r.left) * (W / r.width), 0, W);
    input.y = clamp((e.clientY - r.top) * (H / r.height), 0, H);
    input.inside = true;
  }

  canvas.addEventListener('mousemove', syncPointer);
  canvas.addEventListener('mousedown', (e) => {
    syncPointer(e);
    input.down = true;
    input.clicked = true;
    Sound.ensure();
  });
  window.addEventListener('mouseup', () => {
    input.down = false;
  });
  canvas.addEventListener('mouseleave', () => {
    input.inside = false;
    input.down = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const IGNORED_KEYS = new Set(['F5', 'F12', 'Tab']);

  window.addEventListener('keydown', (e) => {
    if (IGNORED_KEYS.has(e.key)) return;
    if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
    if (!input.keys.has(e.key)) input.pressed.add(e.key);
    input.keys.add(e.key);
    Sound.ensure();
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  function pressedFirst(list) {
    for (let i = 0; i < list.length; i++) if (input.pressed.has(list[i])) return true;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Cursor                                                              */
  /* ------------------------------------------------------------------ */

  const CURSOR = [
    'X',
    'XX',
    'X.X',
    'X..X',
    'X...X',
    'X....X',
    'X.....X',
    'X......X',
    'X.......X',
    'X........X',
    'X.....XXXX',
    'X..X..X',
    'X..X..X',
    'X..X..X',
    'X..X..X',
    'X..XXX',
    'X..X',
    'XXXX'
  ];

  function drawCursor() {
    if (!input.inside) return;
    const unit = 2;
    const hot = input.hover ? '#ffd257' : '#ffffff';
    ctx.save();
    for (let pass = 0; pass < 2; pass++) {
      for (let row = 0; row < CURSOR.length; row++) {
        for (let col = 0; col < CURSOR[row].length; col++) {
          if (CURSOR[row][col] !== 'X') continue;
          if (pass === 0) {
            px(input.x + col * unit + 1, input.y + row * unit + 1, unit, unit, 'rgba(0,0,0,0.55)');
          } else {
            px(input.x + col * unit, input.y + row * unit, unit, unit, hot);
          }
        }
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* State machine                                                       */
  /* ------------------------------------------------------------------ */

  let state = 'menu';
  let stateTime = 0;
  let globalTime = 0;
  let menuIndex = 0;
  let lastHover = null;

  let curtain = 0;
  let curtainPhase = 'none';
  let pendingState = null;

  function transitionTo(next) {
    if (pendingState !== null || curtainPhase === 'out') return;
    pendingState = next;
    curtainPhase = 'out';
  }

  function beginState(next) {
    state = next;
    stateTime = 0;
    enterState(next);
  }

  function enterState(next) {
    if (next === 'menu') {
      menuIndex = 0;
      Music.start();
    } else if (next === 'settings') {
      sliderDrag = false;
      Music.start();
    } else if (next === 'loading') {
      Music.stop();
      loadTickAt = -1;
      SFX.hum();
      Sound.tone({ freq: 60, to: 150, dur: 20, type: 'sawtooth', vol: 0.035 });
    } else if (next === 'ritual') {
      Music.stop();
      cueIndex = 0;
      resetMotes();
      shake = 0;
      flash = 0;
      fingerGrow = 0;
    } else if (next === 'gameover') {
      Music.stop();
      gameOverCue = 0;
      SFX.hum();
    } else if (next === 'farewell') {
      Music.stop();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Menu                                                                */
  /* ------------------------------------------------------------------ */

  const MENU_ITEMS = [
    { id: 'new', label: 'NEW GAME' },
    { id: 'settings', label: 'SETTINGS' },
    { id: 'exit', label: 'EXIT GAME' }
  ];

  function menuRects() {
    const w = 400;
    const h = 52;
    const gap = 20;
    const startY = 286;
    return MENU_ITEMS.map((item, i) => ({
      id: item.id,
      label: item.label,
      x: (W - w) / 2,
      y: startY + i * (h + gap),
      w: w,
      h: h
    }));
  }

  function hit(rect) {
    return input.x >= rect.x && input.x <= rect.x + rect.w && input.y >= rect.y && input.y <= rect.y + rect.h;
  }

  const tips = [
    'Calibrating fingers... uh, finger.',
    'Downloading more RAM.',
    'Polishing the knuckles.',
    'Asking the gods for permission.',
    'Converting prayers into polygons.',
    'Warming up the dramatic orchestra.',
    'Checking if you deserve this.',
    'Rendering 65,536 pixels of destiny.',
    'Compressing the universe (99% done).',
    'Bribing the physics engine.',
    'Reheating yesterday\u2019s miracle.',
    'Counting to 20 dramatically.'
  ];

  const LOAD_SECONDS = 20;
  const RITUAL_END = 15.2;
  const GAMEOVER_END = 11.6;

  let loadTickAt = -1;

  function drawTitle(y) {
    const text = 'HAND OF GOD';
    const spacing = 58;
    const startX = W / 2 - ((text.length - 1) * spacing) / 2;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      const x = startX + i * spacing;
      const wob = Math.sin(globalTime * 2.1 + i * 0.6) * 7;
      const grad = ctx.createLinearGradient(0, y - 34, 0, y + 34);
      grad.addColorStop(0, '#fff6cf');
      grad.addColorStop(0.45, '#ffd257');
      grad.addColorStop(1, '#ff6fc4');
      ctx.save();
      ctx.font = '42px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff4fc8';
      ctx.shadowBlur = 26;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#160a20';
      ctx.strokeText(ch, x, y + wob);
      ctx.fillStyle = grad;
      ctx.fillText(ch, x, y + wob);
      ctx.restore();
    }

    const glow = 0.35 + 0.25 * Math.sin(globalTime * 3);
    ctx.save();
    ctx.globalAlpha = glow;
    px(startX - 34, y + 46, text.length * spacing, 4, '#ff7ac2');
    ctx.restore();
  }

  function drawButton(rect, labelText, active) {
    ctx.fillStyle = 'rgba(8,4,16,0.85)';
    ctx.fillRect(rect.x + 5, rect.y + 5, rect.w, rect.h);
    ctx.fillStyle = active ? 'rgba(255,210,87,0.16)' : 'rgba(30,18,52,0.92)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = active ? '#ffd257' : '#63449c';
    ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.w - 3, rect.h - 3);

    if (active) {
      for (let i = 0; i < 4; i++) {
        const hh = (8 - i * 2) * 2;
        const yy = rect.y + rect.h / 2 - (8 - i * 2);
        px(rect.x + 16 + i * 3, yy, 3, hh, '#ffd257');
        px(rect.x + rect.w - 19 - i * 3, yy, 3, hh, '#ffd257');
      }
    }

    label(labelText, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, {
      size: 15,
      color: active ? '#fff4c8' : '#c9b9f2',
      glow: active ? 14 : 0,
      glowColor: '#ffd257'
    });
  }

  function updateMenu() {
    const rects = menuRects();
    let hoverIndex = -1;
    for (let i = 0; i < rects.length; i++) {
      if (hit(rects[i])) hoverIndex = i;
    }
    if (hoverIndex !== -1 && hoverIndex !== menuIndex) {
      menuIndex = hoverIndex;
      SFX.move();
    }

    if (pressedFirst(['ArrowUp', 'w', 'W'])) {
      menuIndex = (menuIndex + rects.length - 1) % rects.length;
      SFX.move();
    }
    if (pressedFirst(['ArrowDown', 's', 'S'])) {
      menuIndex = (menuIndex + 1) % rects.length;
      SFX.move();
    }

    let activate = -1;
    if (pressedFirst(['Enter', ' ', 'ArrowRight'])) activate = menuIndex;
    if (input.clicked) {
      for (let i = 0; i < rects.length; i++) {
        if (hit(rects[i])) activate = i;
      }
    }

    if (activate !== -1) {
      const id = rects[activate].id;
      SFX.select();
      if (id === 'new') transitionTo('loading');
      else if (id === 'settings') transitionTo('settings');
      else if (id === 'exit') exitGame();
    }
  }

  function exitGame() {
    if (window.handOfGOD && window.handOfGOD.isDesktop) {
      transitionTo('farewell');
      setTimeout(() => {
        try {
          window.handOfGOD.quit();
        } catch (err) {
          window.close();
        }
      }, 650);
    } else {
      transitionTo('farewell');
    }
  }

  function drawMenu() {
    drawBackdrop(1);

    /* a shy, giant hand lurking behind the title */
    ctx.save();
    ctx.globalAlpha = 0.09;
    drawHand(W / 2, H + 80, 5.4, {
      extended: true,
      palette: 'ghost',
      rotation: Math.sin(globalTime * 0.35) * 0.05
    });
    ctx.restore();

    drawTitle(158);
    label('a divine experience', W / 2, 226, { size: 10, color: '#a894e8' });

    const rects = menuRects();
    input.hover = null;
    for (let i = 0; i < rects.length; i++) {
      const active = i === menuIndex;
      drawButton(rects[i], rects[i].label, active);
      if (active) input.hover = rects[i].id;
    }

    label('MOUSE OR ARROW KEYS + ENTER', W / 2, H - 34, { size: 9, color: '#7d6fb0' });
    label('v1.0.0', W - 20, 20, { size: 8, color: '#544a7a', align: 'right' });
  }

  /* ------------------------------------------------------------------ */
  /* Loading (twenty whole seconds, as promised)                         */
  /* ------------------------------------------------------------------ */

  function drawLoading() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const p = clamp(stateTime / LOAD_SECONDS, 0, 1);

    /* rotating summoning rings */
    const cx = W / 2;
    const cy = 196;
    ctx.save();
    ctx.globalAlpha = 0.75;
    for (let ring = 0; ring < 3; ring++) {
      const r = 44 + ring * 26;
      const dir = ring % 2 === 0 ? 1 : -1;
      for (let i = 0; i < 20; i++) {
        const a = globalTime * (0.35 + ring * 0.2) * dir + (i * Math.PI * 2) / 20;
        const size = i % 4 === 0 ? 4 : 2;
        const col = ring === 1 ? '#ff7ac2' : '#a37bff';
        px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, size, col);
      }
    }
    ctx.restore();

    label('HAND OF GOD', cx, 150, { size: 22, color: '#e9dcff', glow: 20, glowColor: '#8b5cff' });
    label('SUMMONING...', cx, 200, {
      size: 12,
      color: '#b9a5ff',
      alpha: 0.5 + 0.5 * Math.abs(Math.sin(globalTime * 2.4))
    });

    /* segmented progress bar */
    const bx = 160;
    const by = 292;
    const bw = W - 320;
    const bh = 30;
    const segs = 32;
    const gap = 4;
    const sw = (bw - (segs + 1) * gap) / segs;
    ctx.strokeStyle = '#4a3672';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 8.5, by - 8.5, bw + 17, bh + 17);

    const filled = p * segs;
    for (let i = 0; i < segs; i++) {
      const amount = clamp(filled - i, 0, 1);
      const sx = bx + gap + i * (sw + gap);
      px(sx, by, sw, bh, '#1a1130');
      if (amount > 0) {
        const col = i < segs * 0.55 ? '#7b4dff' : i < segs * 0.85 ? '#c35bff' : '#ffd257';
        px(sx, by, sw * amount, bh, col);
        if (amount > 0.6) px(sx, by, sw * amount, 4, 'rgba(255,255,255,0.35)');
      }
    }

    label(Math.floor(p * 100) + '%', cx, 356, { size: 16, color: '#ffd257', glow: 10, glowColor: '#ff9c3c' });
    label('Please wait. Gods do not load quickly.', cx, 396, { size: 9, color: '#8b7db8' });

    const tip = tips[Math.floor(stateTime / 2.6) % tips.length];
    label(tip, cx, 452, { size: 10, color: '#b6a6e6', alpha: 0.9 });

    /* soft pulse */
    px(0, 0, W, H, 'rgba(123,77,255,' + (0.03 + 0.03 * Math.sin(globalTime * 3)) + ')');
  }

  /* ------------------------------------------------------------------ */
  /* The ritual                                                          */
  /* ------------------------------------------------------------------ */

  const RITUAL_LINES = [
    { t0: 0.5, t1: 3.0, text: 'You have been chosen.' },
    { t0: 3.2, t1: 5.7, text: 'Something ancient is waking...' },
    { t0: 5.9, t1: 7.7, text: 'The heavens hold their breath.' },
    { t0: 7.9, t1: 9.25, text: 'BEHOLD THE POWER OF GOD!', big: true },
    { t0: 10.3, t1: 12.1, text: '...huh.', small: true },
    { t0: 12.3, t1: 14.9, text: 'It was at this moment, you knew.' }
  ];

  const RITUAL_CUES = [
    { at: 0.15, fn: () => SFX.whisper() },
    { at: 1.2, fn: () => SFX.rise() },
    { at: 3.3, fn: () => SFX.chime() },
    { at: 6.0, fn: () => SFX.charge() },
    { at: 7.9, fn: () => SFX.danger() },
    { at: 9.25, fn: () => SFX.boom() },
    { at: 9.62, fn: () => SFX.womp() },
    { at: 10.4, fn: () => SFX.tick() },
    { at: 12.3, fn: () => SFX.chime() }
  ];

  const T_RISE_START = 1.2;
  const T_RISE_END = 6.2;
  const T_PEAK = 9.25;
  const T_FLIP = 9.62;

  let cueIndex = 0;
  let shake = 0;
  let flash = 0;
  let fingerGrow = 0;

  const motes = [];

  function newMote(seeded) {
    return {
      a: Math.random() * Math.PI * 2,
      r: seeded ? rand(40, 420) : rand(380, 520),
      va: rand(0.5, 2.4) * (Math.random() < 0.5 ? -1 : 1),
      vr: -rand(18, 78),
      s: Math.random() < 0.7 ? 3 : 5,
      c: Math.random() < 0.45 ? '#ffd257' : Math.random() < 0.5 ? '#ff7ac2' : '#8fd8ff'
    };
  }

  function resetMotes() {
    motes.length = 0;
    for (let i = 0; i < 130; i++) motes.push(newMote(true));
  }

  function updateRitual(dt, anim) {
    while (cueIndex < RITUAL_CUES.length && stateTime >= RITUAL_CUES[cueIndex].at) {
      RITUAL_CUES[cueIndex].fn();
      cueIndex++;
    }

    const shakeTarget = stateTime < T_PEAK ? clamp((stateTime - 6) * 2.2, 0, 9) : Math.max(0, 16 - (stateTime - T_PEAK) * 9);
    shake = lerp(shake, shakeTarget, Math.min(1, anim * 8));

    flash = Math.max(0, flash - anim * 2.2);

    if (stateTime >= T_FLIP) {
      const k = clamp((stateTime - T_FLIP) / 0.42, 0, 1);
      fingerGrow = k < 0.72 ? (k / 0.72) * 1.3 : 1.3 - ((k - 0.72) / 0.28) * 0.3;
      fingerGrow = clamp(fingerGrow, 0, 1.3);
    } else {
      fingerGrow = 0;
    }

    /* motes spiral toward the hand */
    const cx = W / 2;
    const cy = 330;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.a += m.va * anim;
      m.r += m.vr * anim * (stateTime > T_PEAK / 1.6 ? 1.9 : 1);
      if (m.r < 26) {
        Object.assign(m, newMote(false));
      }
    }

    if (stateTime >= RITUAL_END) transitionTo('gameover');
  }

  function drawRitual() {
    /* background: darkness with a growing aura */
    ctx.fillStyle = '#040209';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = 336;
    const build = clamp(stateTime / T_PEAK, 0, 1);

    const aura = ctx.createRadialGradient(cx, cy, 20, cx, cy, 80 + 420 * build);
    aura.addColorStop(0, 'rgba(255,214,120,' + (0.28 + 0.45 * build) + ')');
    aura.addColorStop(0.35, 'rgba(150,80,255,' + (0.22 * build + 0.06) + ')');
    aura.addColorStop(1, 'rgba(10,4,24,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    /* rotating runes */
    if (stateTime > 1.0) {
      const runeIn = clamp((stateTime - 1.0) / 1.5, 0, 1);
      ctx.save();
      ctx.globalAlpha = runeIn * (0.35 + 0.5 * build);
      for (let ring = 0; ring < 3; ring++) {
        const r = 110 + ring * 62;
        const dir = ring % 2 === 0 ? 1 : -1;
        const count = 26 + ring * 8;
        for (let i = 0; i < count; i++) {
          const a = globalTime * (0.25 + ring * 0.22) * dir + (i * Math.PI * 2) / count;
          const size = i % 5 === 0 ? 5 : 2;
          px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, size, ring === 1 ? '#ff9ede' : '#b48bff');
        }
      }
      ctx.restore();
    }

    /* light column */
    if (stateTime > 2.4) {
      const k = clamp((stateTime - 2.4) / 4.2, 0, 1);
      const cw = 26 + 54 * k;
      const g2 = ctx.createLinearGradient(0, 0, 0, cy);
      g2.addColorStop(0, 'rgba(255,240,180,0)');
      g2.addColorStop(1, 'rgba(255,230,150,' + (0.10 + 0.22 * k) + ')');
      ctx.fillStyle = g2;
      ctx.fillRect(cx - cw / 2, 0, cw, cy);
    }

    /* motes */
    ctx.save();
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = cx + Math.cos(m.a) * m.r;
      const y = cy + Math.sin(m.a) * m.r * 0.72;
      const fade = clamp(1 - m.r / 520, 0, 1);
      ctx.globalAlpha = 0.25 + fade * 0.75;
      px(x, y, m.s, m.s, m.c);
    }
    ctx.restore();

    /* the hand itself */
    const riseRaw = clamp((stateTime - T_RISE_START) / (T_RISE_END - T_RISE_START), 0, 1);
    const rise = easeOut(riseRaw);
    const handY = H + 190 - (190 + 44) * rise;
    const handScale = 2.55 + 0.42 * build;
    const rotation = lerp(-0.55, 0, rise) + Math.sin(globalTime * 1.6) * 0.03 * (1 - build);

    const shx = Math.sin(globalTime * 61) * shake;
    const shy = Math.cos(globalTime * 47) * shake * 0.7;

    const preFlip = stateTime < T_FLIP;
    const handAlpha = stateTime > 9.25 && stateTime < 9.5 ? clamp((stateTime - 9.25) / 0.12, 0, 1) * 0.6 : 1;

    if (stateTime > T_RISE_START) {
      drawHand(cx + shx, handY + shy, handScale, {
        extended: !preFlip,
        grow: preFlip ? 1 : fingerGrow,
        palette: preFlip ? 'gold' : 'skin',
        rotation: rotation,
        alpha: handAlpha,
        glow: preFlip ? 26 + 60 * build : 0,
        glowColor: '#ffe08a'
      });

      /* halo behind the hand before the reveal */
      if (preFlip) {
        ctx.save();
        ctx.globalAlpha = 0.16 + 0.4 * build;
        ctx.strokeStyle = '#ffe9a8';
        ctx.lineWidth = 2;
        const hr = 120 + 30 * Math.sin(globalTime * 2);
        ctx.beginPath();
        ctx.ellipse(cx + shx, 268 + shy, hr, hr * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* shockwave after the reveal */
    if (stateTime > T_FLIP) {
      const k = clamp((stateTime - T_FLIP) / 0.85, 0, 1);
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.strokeStyle = '#ff5f5f';
      ctx.lineWidth = 5 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(cx, 190, 40 + 520 * easeOut(k), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      /* little comic sparks */
      if (stateTime < 11.2) {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + globalTime * 2;
          const r = 120 + Math.sin(globalTime * 6 + i) * 14;
          px(cx + Math.cos(a) * r, 190 + Math.sin(a) * r * 0.4, 4, 4, i % 2 ? '#ffd257' : '#ff7ac2');
        }
      }
    }

    /* narration */
    for (let i = 0; i < RITUAL_LINES.length; i++) {
      const line = RITUAL_LINES[i];
      if (stateTime < line.t0 || stateTime > line.t1) continue;
      const local = stateTime - line.t0;
      const total = line.t1 - line.t0;
      const fadeIn = clamp(local / 0.55, 0, 1);
      const fadeOut = clamp((total - local) / 0.6, 0, 1);
      const a = Math.min(fadeIn, fadeOut);
      const y = line.big ? 118 : 96;
      label(line.text, cx, y, {
        size: line.big ? 18 : line.small ? 11 : 13,
        color: line.big ? '#ffe07a' : '#d8caff',
        alpha: a,
        glow: line.big ? 22 : 10,
        glowColor: line.big ? '#ff9a3c' : '#8b5cff'
      });
    }

    /* white flash on the beat */
    const sinceFlash = stateTime - T_PEAK;
    if (sinceFlash >= 0 && sinceFlash < 0.55) {
      const f = 1 - sinceFlash / 0.55;
      px(0, 0, W, H, 'rgba(255,255,255,' + (f * 0.95) + ')');
    }

    /* after the reveal, a smug vignette */
    if (stateTime > T_FLIP) {
      const k = clamp((stateTime - T_FLIP) / 1.2, 0, 1);
      ctx.fillStyle = 'rgba(30,0,6,' + (0.35 * k) + ')';
      ctx.fillRect(0, 0, W, H);
      drawVignette(0.55 + 0.3 * k);
    }

    drawScanlines();
  }

  /* ------------------------------------------------------------------ */
  /* Game over                                                           */
  /* ------------------------------------------------------------------ */

  const GAME_OVER_TEXT = 'GAME OVER';
  let gameOverCue = 0;

  function updateGameOver() {
    const shown = Math.floor((stateTime - 0.8) / 0.55);
    if (gameOverCue < shown + 1) {
      gameOverCue++;
      SFX.bell();
    }
    if (stateTime >= GAMEOVER_END) transitionTo('menu');
  }

  function drawGameOver() {
    const dim = clamp(stateTime / 2.2, 0, 1);
    ctx.fillStyle = '#06020a';
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 210, 20, W / 2, 210, 460);
    glow.addColorStop(0, 'rgba(120,10,30,' + (0.25 * dim) + ')');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* letters crawl in one by one, slowly */
    const spacing = 54;
    const startX = W / 2 - ((GAME_OVER_TEXT.length - 1) * spacing) / 2;
    const shown = Math.floor((stateTime - 0.8) / 0.55);

    for (let i = 0; i < GAME_OVER_TEXT.length; i++) {
      if (i > shown) continue;
      const ch = GAME_OVER_TEXT[i];
      if (ch === ' ') continue;
      const local = clamp((stateTime - 0.8 - i * 0.55) / 0.5, 0, 1);
      const y = 212 + (1 - local) * 12;
      ctx.save();
      ctx.font = '52px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = local;
      ctx.shadowColor = '#ff1e4d';
      ctx.shadowBlur = 26 * local;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#18020a';
      ctx.strokeText(ch, startX + i * spacing, y);
      ctx.fillStyle = '#ff4d63';
      ctx.fillText(ch, startX + i * spacing, y);
      ctx.restore();
    }

    label('The hand has spoken.', W / 2, 288, {
      size: 12,
      color: '#d5c6ff',
      alpha: clamp((stateTime - 6.1) / 1.1, 0, 1),
      glow: 8,
      glowColor: '#7b4dff'
    });

    const backA = clamp((stateTime - 7.8) / 1.0, 0, 1);
    if (backA > 0) {
      label('RETURNING TO THE MAIN MENU', W / 2, 386, { size: 9, color: '#8d7fbd', alpha: backA });
      const dots = '.'.repeat(Math.floor(stateTime * 2.2) % 4);
      label(dots, W / 2, 412, { size: 11, color: '#c9b9f2', alpha: backA });
    }

    drawVignette(0.7);
    drawScanlines();
  }

  /* ------------------------------------------------------------------ */
  /* Settings                                                            */
  /* ------------------------------------------------------------------ */

  let sliderDrag = false;

  function sliderRect() {
    return { x: 300, y: 300, w: 360, h: 26 };
  }

  function volumeFromX(x) {
    const r = sliderRect();
    return clamp(Math.round(((x - r.x) / r.w) * 100), 0, 100);
  }

  function setVolume(v, fromUser) {
    const before = options.volume;
    options.volume = clamp(Math.round(v), 0, 100);
    if (options.volume !== before) {
      saveOptions();
      Sound.setVolume();
      if (fromUser && Math.abs(options.volume - before) >= 5) SFX.move();
    }
  }

  function updateSettings() {
    const r = sliderRect();
    const padRect = { x: r.x - 12, y: r.y - 18, w: r.w + 24, h: r.h + 36 };

    if (input.clicked && hit(padRect)) {
      sliderDrag = true;
      setVolume(volumeFromX(input.x), true);
    }
    if (!input.down) sliderDrag = false;
    if (sliderDrag && input.down) setVolume(volumeFromX(input.x), true);

    if (pressedFirst(['ArrowLeft', 'a', 'A'])) setVolume(options.volume - 5, true);
    if (pressedFirst(['ArrowRight', 'd', 'D'])) setVolume(options.volume + 5, true);

    input.hover = null;
    if (hit(padRect)) input.hover = 'slider';

    const backRect = { x: W / 2 - 110, y: 400, w: 220, h: 46 };
    if (hit(backRect)) input.hover = 'back';
    if ((input.clicked && hit(backRect)) || pressedFirst(['Escape', 'Enter', 'Backspace'])) {
      SFX.back();
      transitionTo('menu');
    }
  }

  function drawSettings() {
    drawBackdrop(0.75);

    label('SETTINGS', W / 2, 116, { size: 24, color: '#ffe9a8', glow: 18, glowColor: '#ff9c3c' });

    ctx.fillStyle = 'rgba(14,8,26,0.9)';
    ctx.fillRect(180, 190, W - 360, 300);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5b3f95';
    ctx.strokeRect(181.5, 191.5, W - 363, 297);

    label('VOLUME', W / 2, 240, { size: 12, color: '#c9b9f2' });

    const r = sliderRect();
    /* track */
    px(r.x, r.y, r.w, r.h, '#1a1130');
    ctx.strokeStyle = '#4a3672';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

    const fill = (options.volume / 100) * r.w;
    const grad = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
    grad.addColorStop(0, '#7b4dff');
    grad.addColorStop(0.6, '#c35bff');
    grad.addColorStop(1, '#ffd257');
    ctx.fillStyle = grad;
    ctx.fillRect(r.x + 2, r.y + 2, Math.max(0, fill - 4), r.h - 4);

    /* notches */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 1; i < 10; i++) px(r.x + (r.w / 10) * i, r.y + 2, 2, r.h - 4, 'rgba(0,0,0,0.35)');

    /* knob */
    const kx = r.x + fill;
    px(kx - 7, r.y - 8, 14, r.h + 16, '#0b0616');
    px(kx - 5, r.y - 6, 10, r.h + 12, '#ffd257');
    px(kx - 5, r.y - 6, 10, 4, '#fff3c4');

    label(String(options.volume) + '%', W / 2, 366, { size: 15, color: '#ffd257', glow: 8, glowColor: '#ff9c3c' });
    label('only the volume. the hand decides the rest.', W / 2, 448, { size: 8, color: '#7d6fb0' });

    const backRect = { x: W / 2 - 110, y: 400, w: 220, h: 46 };
    drawButton(backRect, 'BACK', input.hover === 'back');
    label('CLICK + DRAG, OR ARROW KEYS', W / 2, H - 30, { size: 8, color: '#5e5488' });
  }

  /* ------------------------------------------------------------------ */
  /* Farewell                                                            */
  /* ------------------------------------------------------------------ */

  function drawFarewell() {
    ctx.fillStyle = '#04020a';
    ctx.fillRect(0, 0, W, H);
    label('THE GODS DISMISS YOU.', W / 2, H / 2 - 24, {
      size: 16,
      color: '#d5c6ff',
      glow: 16,
      glowColor: '#7b4dff',
      alpha: clamp(stateTime / 0.8, 0, 1)
    });
    label('(this window is closing)', W / 2, H / 2 + 30, {
      size: 9,
      color: '#7d6fb0',
      alpha: clamp((stateTime - 0.5) / 0.8, 0, 1)
    });
    drawScanlines();
  }

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */

  function update(dt, anim) {
    if (curtainPhase === 'out') {
      curtain += dt * 3.6;
      if (curtain >= 1) {
        curtain = 1;
        const next = pendingState;
        pendingState = null;
        curtainPhase = 'in';
        beginState(next);
      }
    } else if (curtainPhase === 'in') {
      curtain -= dt * 2.4;
      if (curtain <= 0) {
        curtain = 0;
        curtainPhase = 'none';
      }
    }

    if (state === 'menu') {
      updateMenu();
    } else if (state === 'loading') {
      const sec = Math.floor(stateTime);
      if (sec !== loadTickAt) {
        loadTickAt = sec;
        if (sec > 0) SFX.tick();
      }
      if (stateTime >= LOAD_SECONDS) transitionTo('ritual');
    } else if (state === 'ritual') {
      updateRitual(dt, anim);
    } else if (state === 'gameover') {
      updateGameOver();
    } else if (state === 'settings') {
      updateSettings();
    } else if (state === 'farewell') {
      if (!(window.handOfGOD && window.handOfGOD.isDesktop)) {
        input.hover = null;
      }
    }
  }

  function draw() {
    if (state === 'menu') drawMenu();
    else if (state === 'loading') drawLoading();
    else if (state === 'ritual') drawRitual();
    else if (state === 'gameover') drawGameOver();
    else if (state === 'settings') drawSettings();
    else if (state === 'farewell') drawFarewell();

    if (state !== 'ritual' && state !== 'gameover' && state !== 'loading') drawScanlines();

    if (curtain > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + clamp(curtain, 0, 1) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    drawCursor();
  }

  let lastFrame = performance.now();

  function frame(now) {
    let dt = (now - lastFrame) / 1000;
    lastFrame = now;
    if (!(dt >= 0)) dt = 0;
    if (dt > 5) dt = 5; /* tab was asleep: never fast-forward more than that */

    /* story timers use real time so "20 seconds" means 20 seconds;
       animation smoothing uses a small step so it stays smooth */
    const anim = Math.min(dt, 0.05);

    globalTime += anim;
    stateTime += dt;

    update(dt, anim);
    draw();

    input.clicked = false;
    input.pressed.clear();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* Window scaling                                                      */
  /* ------------------------------------------------------------------ */

  function fitCanvas() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.max(1, Math.round(W * s)) + 'px';
    canvas.style.height = Math.max(1, Math.round(H * s)) + 'px';
  }

  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  if (document.fonts && document.fonts.load) {
    document.fonts.load('16px "Press Start 2P"').catch(() => {});
  }

  enterState('menu');
  requestAnimationFrame(frame);
})();
