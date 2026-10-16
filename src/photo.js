// The photo, drawn differently in every theme: green glyphs for Matrix, an amber CRT, a neon duotone that
// glitches, a blue halftone, a thermal camera with a scanning crosshair, ASCII art, and plain paper.
(function () {
  'use strict';
  const GL = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ01';
  const ASCII = ' .:-=+*#%@';
  const P = {
    img: null, canvas: null, ctx: null, luma: null, rgb: null, N: 0, theme: 'matrix', t: 0, timer: null,
    mount(box, src, onReady) {
      this.canvas = document.createElement('canvas');
      box.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.img = new Image();
      this.img.onload = () => { this.sample(); this.resize(); if (onReady) onReady(); };
      this.img.src = src;
      this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(box);
      document.addEventListener('visibilitychange', () => this.tick());
    },
    /** brightness and colour of the photo on a coarse grid, read once */
    sample() {
      const S = 160;
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const x = c.getContext('2d');
      x.drawImage(this.img, 0, 0, S, S);
      const d = x.getImageData(0, 0, S, S).data;
      this.N = S;
      this.luma = new Float32Array(S * S);
      this.rgb = d;
      for (let i = 0; i < S * S; i++) this.luma[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      // a gentle contrast stretch so the face reads well in every style
      let lo = 1, hi = 0;
      for (const v of this.luma) { if (v < lo) lo = v; if (v > hi) hi = v; }
      for (let i = 0; i < this.luma.length; i++) this.luma[i] = Math.min(1, Math.max(0, (this.luma[i] - lo) / (hi - lo || 1)));
    },
    resize() {
      if (!this.canvas || !this.img.complete) return;
      const r = this.canvas.parentNode.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = Math.max(60, Math.round(r.width));
      this.canvas.width = this.W * dpr; this.canvas.height = this.W * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    },
    set(theme) { this.theme = theme; this.draw(); this.tick(); },
    css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
    L(u, v) { const N = this.N; const x = Math.min(N - 1, Math.max(0, (u * N) | 0)), y = Math.min(N - 1, Math.max(0, (v * N) | 0)); return this.luma[y * N + x]; },
    tick() {
      clearTimeout(this.timer);
      if (this.reduced || document.hidden || !this.luma) return;
      const live = { matrix: 140, neon: 120, redteam: 60, amber: 160 }[this.theme];
      if (!live) return;
      this.timer = setTimeout(() => { this.t++; this.draw(); this.tick(); }, live);
    },
    label() { return { matrix: 'decoded', amber: 'crt 1983', neon: 'signal: unstable', ice: 'halftone', redteam: 'thermal / target', ghost: 'ascii', paper: 'photo' }[this.theme] || ''; },
    draw() {
      if (!this.luma || !this.W) return;
      const ctx = this.ctx, W = this.W;
      ctx.save();
      ctx.clearRect(0, 0, W, W);
      const f = this['draw_' + this.theme] || this.draw_paper;
      f.call(this, ctx, W);
      ctx.restore();
      if (this.onLabel) this.onLabel(this.label());
    },
    // ---- the styles ------------------------------------------------------------------------------------------
    draw_paper(ctx, W) {
      ctx.filter = 'sepia(0.18) contrast(1.04)';
      ctx.drawImage(this.img, 0, 0, W, W);
      ctx.filter = 'none';
    },
    draw_matrix(ctx, W) {
      // the face, faint and green, under a grid of glyphs whose brightness follows it
      ctx.filter = 'grayscale(1) contrast(1.3) brightness(0.55)';
      ctx.drawImage(this.img, 0, 0, W, W);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#39ff7a'; ctx.fillRect(0, 0, W, W);
      ctx.globalCompositeOperation = 'source-over';
      const cell = Math.max(7, Math.round(W / 40));
      ctx.font = 'bold ' + cell + 'px monospace';
      ctx.textBaseline = 'top';
      const n = Math.ceil(W / cell);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const l = Math.pow(this.L((x + 0.5) / n, (y + 0.5) / n), 0.75);
        if (l < 0.08) continue;
        // a few glyphs change every frame, like the code is still running
        const k = (x * 7 + y * 13 + (((x * 31 + y * 17 + this.t) % 9 === 0) ? this.t : 0)) % GL.length;
        const g = Math.round(90 + l * 165);
        ctx.fillStyle = l > 0.86 ? '#eaffef' : 'rgb(' + Math.round(l * 60) + ',' + g + ',' + Math.round(40 + l * 60) + ')';
        ctx.globalAlpha = 0.45 + l * 0.55;
        ctx.fillText(GL[k], x * cell, y * cell);
      }
      ctx.globalAlpha = 1;
    },
    draw_amber(ctx, W) {
      ctx.filter = 'grayscale(1) contrast(1.25) brightness(1.05)';
      ctx.drawImage(this.img, 0, 0, W, W);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#ffb000'; ctx.fillRect(0, 0, W, W);
      ctx.globalCompositeOperation = 'source-over';
      // scan lines, a soft glow and the curved dark edge of an old tube
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      for (let y = 0; y < W; y += 3) ctx.fillRect(0, y, W, 1);
      const flick = this.reduced ? 0 : (Math.sin(this.t * 1.7) + 1) * 0.02;
      ctx.fillStyle = 'rgba(255,190,60,' + (0.04 + flick) + ')'; ctx.fillRect(0, 0, W, W);
      const g = ctx.createRadialGradient(W / 2, W / 2, W * 0.35, W / 2, W / 2, W * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      const bar = ((this.t * 4) % (W + 60)) - 30;
      ctx.fillStyle = 'rgba(255,220,140,0.06)'; ctx.fillRect(0, bar, W, 22);
    },
    draw_neon(ctx, W) {
      // duotone: shadows in deep violet, highlights in cyan, the middle in magenta
      const N = this.N, im = ctx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const l = this.luma[i];
        const a = [20, 4, 40], b = [255, 43, 214], c = [0, 240, 255];
        const t = l < 0.5 ? l * 2 : (l - 0.5) * 2, p = l < 0.5 ? a : b, q = l < 0.5 ? b : c;
        im.data[i * 4] = p[0] + (q[0] - p[0]) * t; im.data[i * 4 + 1] = p[1] + (q[1] - p[1]) * t; im.data[i * 4 + 2] = p[2] + (q[2] - p[2]) * t; im.data[i * 4 + 3] = 255;
      }
      const off = document.createElement('canvas'); off.width = N; off.height = N; off.getContext('2d').putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, W, W);
      // every few frames, a glitch: slices of the picture jump sideways and the colours split
      const glitch = !this.reduced && this.t % 23 < 3;
      if (glitch) {
        for (let k = 0; k < 6; k++) {
          const y = Math.random() * W, h = 4 + Math.random() * 18, dx = (Math.random() - 0.5) * 30;
          ctx.drawImage(this.canvas, 0, y * (this.canvas.width / W), this.canvas.width, h * (this.canvas.width / W), dx, y, W, h);
        }
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5;
        ctx.drawImage(off, 4, 0, W, W);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = 0; y < W; y += 2) ctx.fillRect(0, y, W, 1);
    },
    draw_ice(ctx, W) {
      ctx.fillStyle = '#020a18'; ctx.fillRect(0, 0, W, W);
      const cell = Math.max(5, Math.round(W / 58));
      const n = Math.ceil(W / cell);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const l = this.L((x + 0.5) / n, (y + 0.5) / n);
        const r = (cell / 2) * Math.sqrt(l) * 1.05;
        if (r < 0.4) continue;
        ctx.fillStyle = l > 0.8 ? '#e6f7ff' : '#4cc3ff';
        ctx.beginPath(); ctx.arc(x * cell + cell / 2 + (y % 2 ? cell / 2 : 0), y * cell + cell / 2, r, 0, Math.PI * 2); ctx.fill();
      }
    },
    draw_redteam(ctx, W) {
      // a thermal camera: dark is cold blue-black, warm is red, hot is yellow-white
      const N = this.N, im = ctx.createImageData(N, N);
      const stops = [[0, [6, 0, 18]], [0.25, [70, 0, 110]], [0.5, [200, 20, 40]], [0.72, [255, 110, 0]], [0.9, [255, 220, 40]], [1, [255, 255, 230]]];
      for (let i = 0; i < N * N; i++) {
        const l = this.luma[i];
        let k = 0; while (k < stops.length - 2 && l > stops[k + 1][0]) k++;
        const [a, ca] = stops[k], [b, cb] = stops[k + 1], t = (l - a) / (b - a || 1);
        for (let j = 0; j < 3; j++) im.data[i * 4 + j] = ca[j] + (cb[j] - ca[j]) * Math.min(1, Math.max(0, t));
        im.data[i * 4 + 3] = 255;
      }
      const off = document.createElement('canvas'); off.width = N; off.height = N; off.getContext('2d').putImageData(im, 0, 0);
      ctx.drawImage(off, 0, 0, W, W);
      // the HUD: a crosshair sweeping over the face, and a readout
      const cx = W * (0.5 + 0.09 * Math.sin(this.t / 18)), cy = W * (0.42 + 0.06 * Math.cos(this.t / 23));
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
      const s = W * 0.14;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy - s + 10); ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx - s + 10, cy - s);
      ctx.moveTo(cx + s - 10, cy - s); ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx + s, cy - s + 10);
      ctx.moveTo(cx - s, cy + s - 10); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx - s + 10, cy + s);
      ctx.moveTo(cx + s - 10, cy + s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s, cy + s - 10);
      ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
      ctx.stroke();
      ctx.font = 'bold ' + Math.max(9, W / 34) + 'px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('TGT 01  ' + (36.4 + (this.t % 7) / 10).toFixed(1) + '°C', 8, 16);
      ctx.fillText('LOCK ' + (this.t % 20 < 10 ? '■' : '□'), W - Math.max(9, W / 34) * 5, 16);
    },
    draw_ghost(ctx, W) {
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, W);
      const cols = Math.max(30, Math.round(W / 6.2));
      const cw = W / cols, ch = cw * 1.9;
      ctx.font = 'bold ' + (ch * 0.95) + 'px monospace';
      ctx.textBaseline = 'top';
      const rows = Math.ceil(W / ch);
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) line += ASCII[Math.min(ASCII.length - 1, Math.floor(this.L((x + 0.5) / cols, (y + 0.5) * ch / W) * ASCII.length))];
        ctx.fillStyle = '#e8e8e8';
        // the font may not be exactly cw wide: draw char by char for a clean grid
        for (let x = 0; x < cols; x++) if (line[x] !== ' ') ctx.fillText(line[x], x * cw, y * ch);
      }
    },
  };
  window.Photo = P;
})();
