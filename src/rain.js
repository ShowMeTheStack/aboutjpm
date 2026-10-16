// The falling characters behind everything. Now and then a column spells a word from the work.
(function () {
  'use strict';
  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>=+*#$%';
  const WORDS = ['RISC-V', 'SPECTRE', 'XV6', 'CACHE', 'TLB', 'BOOM', 'ROCKET', 'AES', 'DPA', 'SV39', 'FENCE.I', 'ECALL', 'MRET', 'LLC', 'PRIME+PROBE', 'FLUSH+RELOAD', 'C89', 'GW-BASIC', 'LOGO', '8086', 'TCP', 'MALLOC', 'FREE', 'NULL'];
  const R = {
    canvas: null, ctx: null, cols: [], size: 16, last: 0, running: false, colour: '#39ff7a', head: '#ffffff', speed: 1,
    start() {
      this.canvas = document.getElementById('rain');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.loop(); });
      this.resize();
      this.running = true;
      this.loop();
    },
    theme() {
      const cs = getComputedStyle(document.documentElement);
      this.colour = cs.getPropertyValue('--rain').trim() || '#39ff7a';
      this.head = cs.getPropertyValue('--rain-head').trim() || '#ffffff';
      this.bg = cs.getPropertyValue('--bg').trim() || '#000';
      this.ctx.fillStyle = this.bg;
      this.ctx.fillRect(0, 0, this.w, this.h);
      if (this.reduced) this.still();
    },
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = window.innerWidth; this.h = window.innerHeight;
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.size = this.w < 600 ? 13 : 16;
      const n = Math.ceil(this.w / this.size);
      this.cols = Array.from({ length: n }, () => this.column(true));
      this.theme();
    },
    column(scatter) {
      const word = Math.random() < 0.08 ? WORDS[(Math.random() * WORDS.length) | 0] : null;
      return { y: scatter ? Math.random() * -60 : -Math.random() * 30, v: 0.35 + Math.random() * 0.75, word, k: 0, cell: -1, prev: '' };
    },
    glyph(c) {
      if (c.word) { const ch = c.word[c.k % c.word.length]; c.k++; return ch; }
      return GLYPHS[(Math.random() * GLYPHS.length) | 0];
    },
    still() {
      const ctx = this.ctx, s = this.size;
      ctx.font = s + 'px monospace';
      for (let i = 0; i < this.cols.length; i++) for (let y = 0; y < this.h / s; y++) if (Math.random() < 0.08) { ctx.fillStyle = this.colour; ctx.globalAlpha = Math.random() * 0.5; ctx.fillText(this.glyph({}), i * s, y * s); }
      ctx.globalAlpha = 1;
    },
    loop() {
      if (this.reduced || !this.running || document.hidden) return;
      requestAnimationFrame((t) => {
        if (t - this.last > 45) { this.last = t; this.step(); }
        this.loop();
      });
    },
    step() {
      const ctx = this.ctx, s = this.size;
      // fade what is there, so each column leaves a tail
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = this.bg;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
      ctx.font = s + 'px monospace';
      ctx.textBaseline = 'top';
      for (let i = 0; i < this.cols.length; i++) {
        const c = this.cols[i];
        c.y += c.v * this.speed;
        const cell = Math.floor(c.y);
        if (cell !== c.cell) {
          // the old head dims to the column colour, and a new bright head appears below it
          if (c.cell >= 0 && c.prev) { ctx.fillStyle = this.bg; ctx.fillRect(i * s, c.cell * s, s, s); ctx.fillStyle = this.colour; ctx.fillText(c.prev, i * s, c.cell * s); }
          c.cell = cell;
          if (cell >= 0) { c.prev = this.glyph(c); ctx.fillStyle = this.head; ctx.fillText(c.prev, i * s, cell * s); }
        } else if (cell >= 0 && c.prev) { ctx.fillStyle = this.head; ctx.fillText(c.prev, i * s, cell * s); }
        if (cell * s > this.h && Math.random() > 0.975) this.cols[i] = this.column(false);
      }
    },
  };
  window.Rain = R;
})();
