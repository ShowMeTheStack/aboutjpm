// Vector diagrams of the work, drawn from small descriptions: boxes, groups, and links along which the data
// moves. Data flows as dots, leaks flow in the warning colour, and a blocked flow stops at a shield.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s === undefined ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let uid = 0;

  /** where a link leaves or enters a box: the edge facing the other end, or a named side */
  function anchor(n, toward, side) {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    if (!side) {
      const dx = toward.x - cx, dy = toward.y - cy;
      side = Math.abs(dx) * n.h > Math.abs(dy) * n.w ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'b' : 't';
    }
    return { r: [n.x + n.w, cy, 1, 0], l: [n.x, cy, -1, 0], b: [cx, n.y + n.h, 0, 1], t: [cx, n.y, 0, -1] }[side];
  }
  function path(a, b, bend) {
    const [x1, y1, dx1, dy1] = a, [x2, y2, dx2, dy2] = b;
    const d = Math.max(24, Math.hypot(x2 - x1, y2 - y1) * (bend === undefined ? 0.4 : bend));
    return `M${x1},${y1} C${x1 + dx1 * d},${y1 + dy1 * d} ${x2 + dx2 * d},${y2 + dy2 * d} ${x2},${y2}`;
  }

  /**
   * spec: {w, h, title, nodes: [{id, x, y, w, h, t, s (sub), k: 'box'|'chip'|'mem'|'actor'|'pill'|'shield', c: tone}],
   *        groups: [{x, y, w, h, t}], links: [{a, b, t, k: 'data'|'leak'|'ctrl'|'block', as, bs, bend, n (dots), dur}],
   *        notes: [{x, y, t, c, a}]}
   * tones: 'a' (accent), 'b' (accent2), 'w' (warning / attacker), 'd' (dim)
   */
  function render(spec) {
    const id = 'dg' + (++uid);
    const nodes = new Map(spec.nodes.map((n) => [n.id, n]));
    const out = [];
    out.push(`<svg class="dg" viewBox="0 0 ${spec.w || 640} ${spec.h || 300}" role="img" aria-label="${esc(spec.title || 'diagram')}" xmlns="${NS}">`);
    out.push(`<defs><marker id="${id}-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-head"/></marker>
      <marker id="${id}-arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-head w"/></marker>
      <pattern id="${id}-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16,0 L0,0 0,16" class="dg-grid"/></pattern>
      <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);
    out.push(`<rect width="100%" height="100%" fill="url(#${id}-grid)" class="dg-bg"/>`);
    for (const g of spec.groups || []) out.push(`<g class="dg-group"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="10"/><text x="${g.x + 10}" y="${g.y + 15}">${esc(g.t)}</text></g>`);
    // links under the boxes, their labels above everything
    const labels = [];
    (spec.links || []).forEach((l, i) => {
      const A = nodes.get(l.a), B = nodes.get(l.b);
      if (!A || !B) return;
      const a = anchor(A, { x: B.x + B.w / 2, y: B.y + B.h / 2 }, l.as), b = anchor(B, { x: A.x + A.w / 2, y: A.y + A.h / 2 }, l.bs);
      const d = path(a, b, l.bend);
      const k = l.k || 'data';
      const pid = id + '-p' + i;
      out.push(`<path id="${pid}" d="${d}" class="dg-link ${k}" marker-end="url(#${id}-${k === 'leak' || k === 'block' ? 'arw' : 'ar'})"/>`);
      if (k !== 'ctrl') {
        const n = l.n || 3, dur = l.dur || 2.6;
        for (let j = 0; j < n; j++) {
          out.push(`<circle r="${k === 'leak' || k === 'block' ? 2.6 : 3}" class="dg-dot ${k}" filter="url(#${id}-glow)"><animateMotion dur="${dur}s" begin="${(-dur * j / n).toFixed(2)}s" repeatCount="indefinite" ${k === 'block' ? 'keyPoints="0;0.5;0.5" keyTimes="0;0.8;1" calcMode="linear"' : ''}><mpath href="#${pid}"/></animateMotion>${k === 'block' ? `<animate attributeName="opacity" values="1;1;0" keyTimes="0;0.8;1" dur="${dur}s" begin="${(-dur * j / n).toFixed(2)}s" repeatCount="indefinite"/>` : ''}</circle>`);
        }
      }
      if (l.t) labels.push(() => {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        out.push(`<text x="${mx + (l.tx || 0)}" y="${my + (k === 'block' ? -17 : -6) + (l.ty || 0)}" class="dg-ltext ${k}" text-anchor="middle">${esc(l.t)}</text>`);
      });
      if (k === 'block') {
        const mx = (a[0] + b[0]) / 2 + (l.sx || 0), my = (a[1] + b[1]) / 2 + (l.sy || 0);
        out.push(`<g class="dg-shield" transform="translate(${mx},${my})"><path d="M0,-11 L9,-7 L9,1 C9,7 4,10 0,12 C-4,10 -9,7 -9,1 L-9,-7 Z"/><path d="M-4,0 L-1,3 L4,-3" class="tick"/></g>`);
      }
    });
    for (const n of spec.nodes) {
      const tone = n.c || 'a';
      const cls = 'dg-node ' + (n.k || 'box') + ' ' + tone;
      const cx = n.x + n.w / 2;
      const lines = String(n.t || '').split('\n');
      const ty = n.y + n.h / 2 - (lines.length - 1) * 6.5 + (n.s ? -5 : 4);
      let shape;
      if (n.k === 'mem') shape = `<path d="M${n.x},${n.y + 6} C${n.x},${n.y - 2} ${n.x + n.w},${n.y - 2} ${n.x + n.w},${n.y + 6} L${n.x + n.w},${n.y + n.h - 6} C${n.x + n.w},${n.y + n.h + 2} ${n.x},${n.y + n.h + 2} ${n.x},${n.y + n.h - 6} Z"/><path d="M${n.x},${n.y + 6} C${n.x},${n.y + 14} ${n.x + n.w},${n.y + 14} ${n.x + n.w},${n.y + 6}" class="lid"/>`;
      else if (n.k === 'actor') shape = `<circle cx="${cx}" cy="${n.y + n.h / 2}" r="${Math.min(n.w, n.h) / 2}"/>`;
      else if (n.k === 'chip') shape = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="5"/>` + [0.25, 0.5, 0.75].map((f) => `<path d="M${n.x + n.w * f},${n.y - 4} v4 M${n.x + n.w * f},${n.y + n.h} v4" class="pin"/>`).join('');
      else shape = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.k === 'pill' ? n.h / 2 : 8}"/>`;
      // text that would not fit its box is drawn smaller, never spilling over the edge
      const room = (n.k === 'actor' ? Math.min(n.w, n.h) * 0.92 : n.w) - 10;
      const fit = (str, base, k) => Math.max(7, Math.min(base, room / Math.max(1, String(str).length * k)));
      const ts = Math.min(...lines.map((l) => fit(l, 11.5, 0.64)));
      const ss = n.s ? fit(n.s, 9.5, 0.62) : 0;
      out.push(`<g class="${cls}">${shape}${lines.map((l, i) => `<text x="${cx}" y="${ty + i * 13}" text-anchor="middle" class="t" style="font-size:${ts.toFixed(1)}px">${esc(l)}</text>`).join('')}${n.s ? `<text x="${cx}" y="${n.y + n.h / 2 + 10 + (lines.length - 1) * 6.5}" text-anchor="middle" class="s" style="font-size:${ss.toFixed(1)}px">${esc(n.s)}</text>` : ''}</g>`);
    }
    for (const f of labels) f();
    for (const t of spec.notes || []) out.push(`<text x="${t.x}" y="${t.y}" class="dg-note ${t.c || ''}" text-anchor="${t.a || 'start'}">${esc(t.t)}</text>`);
    out.push('</svg>');
    return `<figure class="dgfig">${out.join('')}${spec.caption ? `<figcaption>${esc(spec.caption)}</figcaption>` : ''}</figure>`;
  }

  window.Diagrams = { render, specs: {} };
})();
