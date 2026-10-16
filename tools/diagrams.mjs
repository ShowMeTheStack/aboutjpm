// Writes every diagram as a standalone animated SVG in docs/diagrams/, in the Matrix colours, for the README.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['diagrams.js', 'figs.js']) vm.runInContext(readFileSync(join(root, 'src', f), 'utf8'), ctx, { filename: f });
const D = ctx.window.Diagrams;
const C = { bg: '#020904', panel: '#08220f', fg: '#c9ffd9', muted: '#6fb98a', dim: '#2d6b43', line: '#134a2a', a: '#39ff7a', b: '#b6ff3b', w: '#ff4d6d', wt: '#ff8fa3' };
const STYLE = `
text { font-family: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace; }
.dg-bg { fill: ${C.bg}; } .dg-grid { fill: none; stroke: ${C.line}; stroke-width: 0.5; opacity: 0.6; }
.dg-group rect { fill: none; stroke: ${C.dim}; stroke-dasharray: 4 4; } .dg-group text { fill: ${C.muted}; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
.dg-node rect, .dg-node circle, .dg-node path { fill: ${C.panel}; stroke: ${C.a}; stroke-width: 1.4; }
.dg-node .lid { fill: none; } .dg-node .pin { stroke: ${C.a}; }
.dg-node.b rect, .dg-node.b circle, .dg-node.b path { stroke: ${C.b}; fill: #142a08; } .dg-node.b .pin { stroke: ${C.b}; }
.dg-node.w rect, .dg-node.w circle, .dg-node.w path { stroke: ${C.w}; fill: #2a0c12; } .dg-node.w .pin { stroke: ${C.w}; }
.dg-node.d rect, .dg-node.d circle, .dg-node.d path { stroke: ${C.dim}; }
.dg-node .lid { fill: none; }
.dg-node .t { fill: ${C.fg}; font-weight: 700; } .dg-node.w .t { fill: ${C.wt}; } .dg-node .s { fill: ${C.muted}; }
.dg-link { fill: none; stroke: ${C.dim}; stroke-width: 1.4; }
.dg-link.leak, .dg-link.block { stroke: ${C.w}; stroke-dasharray: 5 4; animation: dash 1.2s linear infinite; }
.dg-link.ctrl { stroke-dasharray: 2 4; stroke: ${C.muted}; }
@keyframes dash { to { stroke-dashoffset: -18; } }
.dg-head { fill: ${C.dim}; } .dg-head.w { fill: ${C.w}; }
.dg-dot { fill: ${C.a}; } .dg-dot.leak, .dg-dot.block { fill: ${C.w}; }
.dg-ltext { fill: ${C.muted}; font-size: 9.5px; paint-order: stroke; stroke: ${C.bg}; stroke-width: 3.5px; stroke-linejoin: round; }
.dg-ltext.leak, .dg-ltext.block { fill: ${C.wt}; }
.dg-shield path { fill: ${C.b}; stroke: ${C.bg}; stroke-width: 1.5; } .dg-shield .tick { fill: none; stroke: ${C.bg}; stroke-width: 2; }
.dg-note { fill: ${C.b}; font-size: 10.5px; font-weight: 700; } .dg-note.w { fill: ${C.wt}; }
.dg-node.actor circle { animation: pulse 2.4s ease-in-out infinite; } @keyframes pulse { 50% { stroke-width: 3; } }`;
mkdirSync(join(root, 'docs/diagrams'), { recursive: true });
const out = {};
for (const [id, spec] of Object.entries(D.specs)) {
  let svg = D.render(spec).match(/<svg[\s\S]*<\/svg>/)[0];
  svg = svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ').replace(/<mpath href="([^"]+)"\/>/g, '<mpath href="$1" xlink:href="$1"/>');
  svg = svg.replace(/(<svg[^>]*>)/, `$1<style>${STYLE}</style>`);
  writeFileSync(join(root, 'docs/diagrams', id + '.svg'), svg);
  out[id] = spec.caption || '';
}
console.log(Object.keys(out).length + ' diagrams written to docs/diagrams/');
