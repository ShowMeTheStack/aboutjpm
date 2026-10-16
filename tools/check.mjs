// Checks the built page in headless Chrome: every theme at every size, every section and item, the
// terminal, the deep links. Usage: node tools/check.mjs
import { launch } from './cdp.mjs';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

execSync('node build.mjs', { cwd: join(dirname(fileURLToPath(import.meta.url)), '..'), stdio: 'ignore' });
const SIZES = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 700], [820, 1180], [768, 1024], [390, 844], [360, 640]];
let fail = 0, pass = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const b = await launch({ width: 1440, height: 900 });
try {
  for (const [w, h] of SIZES) {
    await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 800 });
    await b.send('Page.navigate', { url: b.url + 'index.html?noboot' });
    await b.waitFor('window.__siteReady === true', 20000);
    await b.sleep(300);
    const n0 = b.logs.length;
    const r = await b.eval(`(() => {
      const de = document.documentElement;
      const cut = [...document.querySelectorAll('.tile li:not(.cut)')].filter((li) => li.getBoundingClientRect().bottom > li.closest('ul').getBoundingClientRect().bottom + 1).length;
      return { hs: de.scrollWidth > innerWidth + 1, vs: de.scrollHeight > innerHeight + 1, cut, tiles: document.querySelectorAll('.tile').length, photo: !!document.querySelector('#photo canvas') };
    })()`);
    ok(!r.hs, w + 'x' + h + ': scrolls sideways');
    if (w >= 1000 && h >= 640) ok(!r.vs, w + 'x' + h + ': the first screen needs scrolling');
    ok(r.cut === 0, w + 'x' + h + ': ' + r.cut + ' tile lines cut in half');
    ok(r.tiles === 9 && r.photo, w + 'x' + h + ': tiles or photo missing');
    for (const t of ['matrix', 'amber', 'neon', 'ice', 'redteam', 'ghost', 'paper']) {
      await b.eval(`App.setTheme('${t}')`);
      await b.sleep(60);
      const st = await b.eval(`[document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor, document.querySelector('#themes button.on').dataset.theme]`);
      ok(st[0] === t && st[2] === t, w + 'x' + h + ': theme ' + t + ' not applied');
    }
    ok(b.logs.slice(n0).filter((l) => /exception|error/i.test(l.type)).length === 0, w + 'x' + h + ': page errors ' + JSON.stringify(b.logs.slice(n0)));
  }
  // every section, every item opened, nothing broken in the text
  const sec = await b.eval(`(() => { const out = []; for (const k of Object.keys(App.SECTIONS)) { App.open(k); const items = document.querySelectorAll('#sheetBody .item:not(.plain)'); document.querySelectorAll('#sheetBody .item > button.head').forEach((x) => x.click()); const t = document.getElementById('sheetBody').innerText; out.push([k, items.length, t.length, /\\bundefined\\b(?! flag)|NaN|\\[object/.test(t), document.querySelectorAll('#sheetBody .item.open').length]); App.close(); } return out; })()`);
  for (const [k, n, len, bad, open] of sec) { ok(len > 300, k + ': almost empty'); ok(!bad, k + ': shows undefined, NaN or [object'); ok(open === n, k + ': not every item opens'); }
  // deep links
  for (const h of ['papers/pace', 'tools/strux', 'patents', 'research/ch1', 'cv']) {
    await b.send('Page.navigate', { url: b.url + 'index.html?noboot#' + h });
    await b.waitFor('window.__siteReady === true', 20000);
    await b.sleep(200);
    const r = await b.eval(`[!document.getElementById('sheet').hidden, ${h.includes('/') ? `!!document.querySelector('#it-${h.split('/')[1]}.open')` : 'true'}]`);
    ok(r[0] && r[1], 'deep link #' + h);
  }
  // the terminal
  await b.eval("Term.open(); Term.run('help'); Term.run('papers spectre'); Term.run('theme amber'); Term.run('cat tools')");
  ok(await b.eval("document.documentElement.dataset.theme === 'amber' && !document.getElementById('sheet').hidden && /Spectre/.test(document.querySelector('#term .out').innerText)"), 'the terminal');
  // every link to a paper, tool or section resolves
  const dead = await b.eval(`(() => { const bad = []; for (const k of Object.keys(App.SECTIONS)) { App.open(k); document.querySelectorAll('#sheetBody [data-jump]').forEach((a) => { const [s, id] = a.dataset.jump.split('/'); if (!App.SECTIONS[s]) bad.push(a.dataset.jump); else { App.open(s, id); if (id && !document.getElementById('it-' + id)) bad.push(a.dataset.jump); App.open(k); } }); App.close(); } return bad; })()`);
  ok(dead.length === 0, 'links inside the page lead nowhere: ' + dead.join(', '));
  // the thesis journal papers lead everywhere, in the same order, tagged as thesis papers
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await b.send('Page.navigate', { url: b.url + 'index.html?noboot' });
  await b.waitFor('window.__siteReady === true', 20000);
  const want = await b.eval("Order.thesis(SITE.papers).map((p) => p.id)");
  const titles = await b.eval("Order.thesis(SITE.papers).map((p) => p.title)");
  const shorts = await b.eval("Order.thesis(SITE.papers).map((p) => p.short)");
  ok(want.length === 3 && want.join() === 'pace,archer,novel-riscv-sca', 'the thesis papers are ' + want.join());
  const pl = await b.eval(`(() => {
    const tile = (k) => [...document.querySelectorAll('[data-open=' + k + '] li')].map((li) => li.innerText);
    const r = { research: tile('research'), papers: tile('papers') };
    App.open('research'); r.rsheet = [...document.querySelectorAll('#thesisPapers ~ .item')].slice(0, 3).map((e) => e.id.slice(3));
    r.chapters = [3, 4, 5].map((n) => [...document.querySelectorAll('#it-ch' + n + ' [data-jump]')].map((a) => a.dataset.jump.split('/')[1]).join());
    r.rgroupBefore = !!document.querySelector('#it-thesis + .group-t#thesisPapers, #it-thesis ~ #thesisPapers') && document.querySelector('#thesisPapers').compareDocumentPosition(document.querySelector('#it-ch1')) === 4;
    App.open('papers'); r.psheet = [...document.querySelectorAll('#sheetBody .item')].slice(0, 3).map((e) => e.id.slice(3));
    r.ptags = [...document.querySelectorAll('#sheetBody .item')].filter((e) => e.querySelector('.meta .phd')).map((e) => e.id.slice(3));
    App.open('cv'); r.cv = [...document.querySelectorAll('#sheetBody ol')[0].querySelectorAll('li')].slice(0, 3).map((li) => li.querySelector('b').innerText);
    r.cvtag = [...document.querySelectorAll('#sheetBody ol')[0].querySelectorAll('li')].filter((li) => li.innerText.includes('[PhD thesis]')).length;
    App.close(); return r; })()`);
  for (const k of ['research', 'papers']) {
    ok(pl[k].slice(0, 3).every((l, i) => l.startsWith('PHD THESIS') || l.startsWith('PhD thesis')) && pl[k].slice(0, 3).every((l, i) => l.includes(shorts[i])), 'the ' + k + ' tile does not lead with the tagged thesis papers: ' + JSON.stringify(pl[k].slice(0, 3)));
    ok(pl[k].slice(3).every((l) => !/^PhD thesis/i.test(l)), 'the ' + k + ' tile tags a paper that is not a thesis paper');
  }
  ok(pl.rsheet.join() === want.join(), 'the research sheet lists ' + pl.rsheet.join());
  ok(pl.rgroupBefore, 'the thesis papers do not come right after the thesis, before the chapters');
  ok(pl.chapters.join('|') === 'novel-riscv-sca|archer|pace', 'chapters 3 to 5 link to ' + pl.chapters.join('|'));
  ok(pl.psheet.join() === want.join(), 'the publications sheet starts with ' + pl.psheet.join());
  ok(pl.ptags.sort().join() === want.slice().sort().join(), 'thesis tags in the publications sheet: ' + pl.ptags.join());
  ok(pl.cv.join('|') === titles.join('|') && pl.cvtag === 3, 'the CV page does not lead with the thesis papers');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const pubs = readme.slice(readme.indexOf('## Publications'));
  const first = [...pubs.matchAll(/^#### (.+)$/gm)].slice(0, 3).map((m) => m[1]);
  ok(first.join('|') === titles.join('|'), 'README publications start with ' + first.join(' | '));
  ok((readme.match(/`PhD thesis` paper/g) || []).length === 3, 'README tags the thesis papers');
  const rs = readme.slice(readme.indexOf('## Research'), readme.indexOf('## Publications'));
  ok(titles.every((t) => rs.includes(t)), 'README research section lists the thesis papers');
  // on the landing page only the thesis journals name their indexing
  const idx = await b.eval("[...document.querySelectorAll('.tile li')].map((l) => l.innerText).filter((t) => /scopus|esci|core c|xplore/i.test(t))");
  ok(idx.every((t) => /^PHD THESIS/i.test(t) && (/ESCI, Scopus Q1/.test(t) ? /^PHD THESISARCHER/i.test(t) : /Chips · ESCI ·/.test(t))), 'indexing on the landing page: ' + JSON.stringify(idx));
  // the boot sequence plays once
  await b.send('Page.navigate', { url: b.url + 'index.html' });
  await b.sleep(400);
  ok(await b.eval("document.getElementById('boot').classList.contains('on') || window.__siteReady === true"), 'boot');
} finally { await b.close(); }
console.log(pass + ' checks passed, ' + fail + ' failed');
process.exitCode = fail ? 1 : 0;
