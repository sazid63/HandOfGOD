/* The pixel sky behind the Hand of GOD page.
   The hand is the same pixel-for-pixel sprite the game draws, built the same
   way (rounded shapes on a small grid, then shaded from its own silhouette). */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* The hand                                                            */
  /* ------------------------------------------------------------------ */

  const SPR_W = 56;
  const SPR_H = 68;

  function buildHand() {
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
    const capsule = (x0, y0, x1, y1, r, v) => {
      const vx = x1 - x0;
      const vy = y1 - y0;
      const len2 = vx * vx + vy * vy || 1;
      for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++) {
        for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
          const cxp = x + 0.5;
          const cyp = y + 0.5;
          let t = ((cxp - x0) * vx + (cyp - y0) * vy) / len2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const dx = cxp - (x0 + vx * t);
          const dy = cyp - (y0 + vy * t);
          if (dx * dx + dy * dy <= r * r) setCell(x, y, v);
        }
      }
    };

    /* palm and wrist as one tapering profile */
    const profile = [
      [23, 11, 44],
      [26, 9, 45],
      [32, 8, 46],
      [39, 9, 45],
      [44, 10, 44],
      [49, 12, 42],
      [54, 14, 40],
      [59, 15, 39],
      [64, 17, 37],
      [67, 20, 34]
    ];
    for (let i = 0; i < profile.length - 1; i++) {
      const y0 = profile[i][0];
      const l0 = profile[i][1];
      const r0 = profile[i][2];
      const y1 = profile[i + 1][0];
      const l1 = profile[i + 1][1];
      const r1 = profile[i + 1][2];
      for (let y = y0; y < y1; y++) {
        const t = (y - y0) / (y1 - y0);
        const left = Math.round(l0 + (l1 - l0) * t);
        const right = Math.round(r0 + (r1 - r0) * t);
        for (let x = left; x <= right; x++) setCell(x, y, 1);
      }
    }

    /* folded fingers */
    round(10, 20, 10, 16, 5, 1);
    round(31, 21, 9, 14, 5, 1);
    round(40, 25, 8, 14, 4, 1);
    round(20, 18, 11, 18, 5, 1);
    /* thumb */
    capsule(8, 48, 25, 41, 5.5, 1);

    /* shading + outline from the silhouette */
    const solid = grid.slice();
    const isSolid = (x, y) => x >= 0 && y >= 0 && x < SPR_W && y < SPR_H && solid[y * SPR_W + x] !== 0;
    for (let y = 0; y < SPR_H; y++) {
      for (let x = 0; x < SPR_W; x++) {
        const i = y * SPR_W + x;
        const v = solid[i];
        if (!v) {
          if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) grid[i] = 5;
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

    const paint = (x, y, v, from) => {
      if (x < 0 || y < 0 || x >= SPR_W || y >= SPR_H) return;
      const i = y * SPR_W + x;
      if (from && from.indexOf(grid[i]) === -1) return;
      grid[i] = v;
    };

    /* seams between the fingers */
    for (let y = 21; y <= 30; y++) paint(19, y, 3, [1, 2]);
    for (let y = 20; y <= 30; y++) paint(30, y, 3, [1, 2]);
    for (let y = 26; y <= 34; y++) paint(39, y, 3, [1, 2]);

    /* knuckle folds */
    const folded = (x0, x1, foldY) => {
      for (let x = x0 + 1; x <= x1 - 1; x++) paint(x, foldY, 3, [1, 2]);
    };
    folded(11, 18, 27);
    folded(32, 38, 28);
    folded(41, 46, 32);
    folded(21, 29, 25);

    /* thumb ridges */
    for (let i = 0; i <= 17; i++) paint(8 + i, 43 - Math.round(i * 0.35), 3, [1, 2]);
    for (let i = 1; i <= 15; i++) paint(9 + i, 52 - Math.round(i * 0.28), 3, [1, 2]);

    /* palm line, then the wrist */
    for (let x = 17; x <= 37; x++) {
      const y = 57 + Math.round(1.5 * Math.sin((x - 17) / 5.6));
      paint(x, y, 3, [1, 2]);
    }
    for (let x = 19; x <= 35; x++) paint(x, 63, 3, [1, 2]);

    return grid;
  }

  const GRID = buildHand();

  /* a hand of ash and embers, glowing from behind */
  const PALETTE = { 1: '#4b1220', 2: '#63202f', 3: '#2c0a13', 4: '#74283a', 5: '#100308' };

  let minX = SPR_W, maxX = -1, minY = SPR_H, maxY = -1;
  for (let y = 0; y < SPR_H; y++) {
    for (let x = 0; x < SPR_W; x++) {
      if (!GRID[y * SPR_W + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const BOUNDS = { cx: (minX + maxX + 1) / 2, cy: (minY + maxY + 1) / 2, h: maxY - minY + 1 };

  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = SPR_W;
    c.height = SPR_H;
    const g = c.getContext('2d');
    for (let y = 0; y < SPR_H; y++) {
      for (let x = 0; x < SPR_W; x++) {
        const v = GRID[y * SPR_W + x];
        if (!v) continue;
        g.fillStyle = PALETTE[v];
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  })();

  /* ------------------------------------------------------------------ */
  /* The sky                                                             */
  /* ------------------------------------------------------------------ */

  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let vw = 0;
  let vh = 0;
  let embers = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(90, Math.max(24, (vw * vh) / 22000)));
    embers = [];
    for (let i = 0; i < count; i++) {
      embers.push({
        x: Math.random() * vw,
        y: Math.random() * vh,
        r: Math.random() < 0.75 ? 2 : 3,
        vy: 8 + Math.random() * 26,
        drift: 6 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.6
      });
    }
  }

  function drawSky(t) {
    const cx = vw / 2;
    const glowY = vh * 0.28;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#08040a';
    ctx.fillRect(0, 0, vw, vh);

    /* the light from above */
    const dome = ctx.createRadialGradient(cx, glowY, 0, cx, glowY, Math.max(vw, vh) * 0.75);
    dome.addColorStop(0, 'rgba(255,138,64,0.30)');
    dome.addColorStop(0.32, 'rgba(170,26,52,0.16)');
    dome.addColorStop(1, 'rgba(8,4,10,0)');
    ctx.fillStyle = dome;
    ctx.fillRect(0, 0, vw, vh);

    /* slow rays of judgement */
    ctx.globalCompositeOperation = 'lighter';
    const spin = reduced ? 0.4 : (t / 44000) % (Math.PI * 2);
    const rays = 9;
    ctx.save();
    ctx.translate(cx, vh * 0.02);
    for (let i = 0; i < rays; i++) {
      const a = spin + (i / rays) * Math.PI * 2;
      const spread = 0.055 + (i % 3) * 0.02;
      const len = Math.max(vw, vh) * 1.6;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, 'rgba(255,200,120,0.13)');
      g.addColorStop(0.55, 'rgba(255,120,60,0.045)');
      g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - spread) * len, Math.sin(a - spread) * len);
      ctx.lineTo(Math.cos(a + spread) * len, Math.sin(a + spread) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    /* the hand, looming */
    const scale = Math.max(2, Math.round(Math.min(vh * 0.64, vw * 0.62) / BOUNDS.h));
    const bob = reduced ? 0 : Math.sin(t / 2600) * vh * 0.012;
    const hx = cx - BOUNDS.cx * scale;
    const hy = vh * 0.44 - BOUNDS.cy * scale + bob;
    const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 2400);

    ctx.save();
    ctx.globalAlpha = 0.78;
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = 'rgba(255,120,50,0.55)';
    ctx.shadowBlur = 46 + pulse * 34;
    ctx.drawImage(sprite, Math.round(hx), Math.round(hy), SPR_W * scale, SPR_H * scale);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.24 + pulse * 0.2;
    ctx.drawImage(sprite, Math.round(hx), Math.round(hy), SPR_W * scale, SPR_H * scale);
    ctx.restore();

    /* embers on the updraft */
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      if (!reduced) {
        e.y -= (e.vy * 16) / 1000;
        if (e.y < -6) {
          e.y = vh + 6;
          e.x = Math.random() * vw;
        }
      }
      const sway = Math.sin(t / 1400 + e.phase) * e.drift;
      const flick = 0.55 + 0.45 * Math.sin(t / 260 + e.phase);
      ctx.globalAlpha = e.alpha * flick;
      ctx.fillStyle = e.r > 2 ? '#ffd257' : '#ff8a3c';
      ctx.fillRect(Math.round(e.x + sway), Math.round(e.y), e.r, e.r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = 0;
  function frame(t) {
    if (t - last > 33) {
      last = t;
      drawSky(t);
    }
    if (!reduced) requestAnimationFrame(frame);
  }

  resize();
  drawSky(0);
  window.addEventListener('resize', () => {
    resize();
    drawSky(performance.now());
  });
  if (!reduced) requestAnimationFrame(frame);
})();
