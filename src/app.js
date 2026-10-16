// The page: a first screen that says everything at a glance, and a sheet for each section with every item
// expandable. Deep links like #papers/pace open a section and an item directly.
(function () {
  'use strict';
  const D = window.SITE;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const store = { get(k, d) { try { const v = localStorage.getItem('jp.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('jp.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };

  const THEMES = [
    { id: 'matrix', name: 'Matrix', dot: '#39ff7a' },
    { id: 'amber', name: 'Amber CRT', dot: '#ffb000' },
    { id: 'neon', name: 'Neon', dot: '#ff2bd6' },
    { id: 'ice', name: 'Ice', dot: '#4cc3ff' },
    { id: 'redteam', name: 'Red team', dot: '#ff3b3b' },
    { id: 'ghost', name: 'Ghost', dot: '#e0e0e0' },
    { id: 'paper', name: 'Paper', dot: '#0b6e4f' },
  ];

  // every list of papers below keeps this one order (src/order.js): thesis journals first
  D.papers = window.Order.papers(D.papers || []);
  const papers = D.papers;
  // papers under double-blind review are counted, never named
  const blind = (D.blindReview && D.blindReview.count) || 0;
  const blindLine = blind ? 'Also ' + blind + ' paper' + (blind === 1 ? '' : 's') + ' ' + (D.blindReview.note || 'under double-blind review') + '.' : '';
  const inReview = () => papers.filter((p) => p.status === 'under review').length + blind;
  const byKind = (k) => papers.filter((p) => p.kind === k);
  const tools = (D.tools && D.tools.tools) || [];
  const patents = D.patents || [];
  const books = D.books || [];
  const P = D.profile;

  // ---- the sections ------------------------------------------------------------------------------------------
  const SECTIONS = {
    research: { title: 'Research', sub: 'PhD, BITS Pilani', render: renderResearch },
    papers: { title: 'Publications', sub: papers.filter((p) => p.status !== 'under review').length + ' published or accepted, ' + inReview() + ' under review', render: renderPapers, search: true },
    patents: { title: 'Patents', sub: patents.length + ' published applications', render: renderPatents, search: true },
    books: { title: 'Books', sub: books.length + ' with De Gruyter Brill', render: renderBooks },
    tools: { title: 'Teaching tools', sub: tools.length + ' free tools that run in a browser', render: renderTools, search: true },
    experience: { title: 'Experience', sub: P.years.total + ' years: ' + P.years.industry + ' in industry, ' + P.years.teaching + ' teaching', render: renderExperience },
    education: { title: 'Education', sub: 'BITS Pilani, UW-Madison', render: renderEducation },
    teaching: { title: 'Teaching and outreach', sub: 'lectures, videos, writing', render: renderTeaching },
    contact: { title: 'Contact', sub: 'and the rest', render: renderContact },
    cv: { title: 'Full CV', sub: 'everything on one page, ready to print', render: renderCV },
  };

  // ---- the first screen -----------------------------------------------------------------------------------------
  function home() {
    const main = $('#main');
    const pub = papers.filter((p) => p.status !== 'under review');
    const yt = D.tools && D.tools.online && D.tools.online.youtube;
    const views = yt && (yt.views || yt.totalViews);
    const stats = [
      ['papers', pub.length, 'papers'], ['patents', patents.length, 'patents'], ['books', books.length, 'books'],
      ['tools', tools.length, 'teaching tools'], ['experience', P.years.total, 'years of work'], ['teaching', views ? shortNum(views) : '78', views ? 'YouTube views' : 'lecture videos'],
    ];
    const t = D.thesis || {};
    const tile = (key, title, count, lead, lines, wide) => `
      <button class="card tile${wide ? ' wide' : ''}" data-open="${key}" aria-label="Open ${esc(title)}">
        <div class="th"><h2>${esc(title)}</h2><span class="count">${esc(count)}</span></div>
        ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
        <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        <span class="more">open ↵</span>
      </button>`;
    main.innerHTML = `
      <section class="card id" aria-label="About">
        <div class="photo" id="photo"><span class="label" id="photoLabel"></span></div>
        <div>
          <h1 class="name"><span class="glitch" data-text="${esc(P.name)}">${esc(P.name)}</span></h1>
        </div>
        <ul class="roles">${P.roles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        <p class="tagline">${esc(P.tagline)}</p>
        <div class="links">
          <a href="mailto:${esc(P.contact.email)}">email</a>
          <a href="${esc(P.contact.linkedin)}" target="_blank" rel="noopener">linkedin</a>
          <a href="${esc(P.contact.github)}" target="_blank" rel="noopener">github</a>
          <a href="${esc(P.contact.blog)}" target="_blank" rel="noopener">blog</a>
          ${yt && yt.url ? `<a href="${esc(yt.url)}" target="_blank" rel="noopener">youtube</a>` : ''}
          ${D.profiles && D.profiles.scholar ? `<a href="${esc(D.profiles.scholar)}" target="_blank" rel="noopener">scholar</a>` : ''}
          <a href="#cv" data-open="cv">full cv</a>
        </div>
        <div class="stats">${stats.map(([k, n, l]) => `<button class="stat" data-open="${k}"><b data-count="${esc(n)}">${esc(n)}</b><span>${esc(l)}</span></button>`).join('')}</div>
      </section>
      <section class="tiles" aria-label="The work">
        ${tile('research', 'Research', 'PhD · BITS Pilani', t.glance || 'Side-channel security of open-source RISC-V processors.', thesisLines().concat((t.keyResults || []).slice(0, 2).map(esc)))}
        ${tile('papers', 'Publications', pub.length + ' + ' + inReview() + ' in review', null, pub.slice(0, 7).map(pubLine))}
        ${tile('tools', 'Teaching tools', tools.length + ' live', 'Free, open tools that show students what a machine is really doing.', tools.slice(0, 9).map((x) => `<b>${esc(x.name)}</b> ${esc(x.tagline || x.glance || '')}`))}
        ${tile('patents', 'Patents', patents.length + ' published', 'RISC-V hardware for security and memory, filed in India.', patents.map((x) => esc(x.short || x.title)))}
        ${tile('books', 'Books', books.length + ' · De Gruyter Brill', null, books.map((b) => `<b>${esc(b.short || b.title)}</b> ${esc(b.status || '')}`))}
        ${tile('experience', 'Experience', P.years.total + ' years', null, expLines())}
        ${tile('education', 'Education', 'PhD · MS · BE', null, P.education.slice(0, 3).map((e) => `<b>${esc(e.degree.replace(' in Computer Science', ''))}</b> ${esc(e.org)} · ${esc(e.status)}`))}
        ${tile('teaching', 'Teaching', 'KIIT · YouTube · blog', null, teachingLines().map(esc))}
        ${tile('contact', 'Contact', P.contact.email, null, ['<b>email</b> ' + esc(P.contact.email), '<b>company</b> eninehq.com', '<b>languages</b> ' + esc(P.languages.map((l) => l.split(' ')[0]).join(', ')), '<b>skills</b> ' + esc(P.skills[0].items.slice(0, 4).join(', '))])}
      </section>`;
    window.Photo.mount($('#photo'), 'assets/photo.jpg', () => window.Photo.set(theme()));
    window.Photo.onLabel = (l) => { const e = $('#photoLabel'); if (e) e.textContent = '[' + l + ']'; };
    countUp();
    fitTiles();
    if (!window.__fitWired) {
      window.__fitWired = true;
      const again = () => { clearTimeout(window.__fitT); window.__fitT = setTimeout(fitTiles, 60); };
      // the photo and the fonts change the layout after the first draw
      if (window.ResizeObserver) new ResizeObserver(again).observe($('.tiles')); else window.addEventListener('resize', again);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    }
  }
  /** show only the lines of each tile that fit whole: no line is ever cut in half */
  function fitTiles() {
    document.querySelectorAll('.tile').forEach((t) => {
      t.querySelectorAll('.cut').forEach((x) => x.classList.remove('cut'));
      const ul = t.querySelector('ul');
      if (!ul) return;
      const lis = [...ul.children];
      const bottom = ul.getBoundingClientRect().bottom + 0.5;
      for (const li of lis) if (li.getBoundingClientRect().bottom > bottom) li.classList.add('cut');
      const lead = t.querySelector('.lead');
      if (lead && lis.length && lis.every((li) => li.classList.contains('cut')) && t.scrollHeight > t.clientHeight + 2) lead.classList.add('cut');
    });
  }
  /** one line per place: the newest role at each, and the research internships too */
  function expLines() {
    const seen = new Set(), out = [];
    for (const e of P.experience) {
      const org = e.org.replace(/ Pvt\. Ltd\.| \(KIIT\)|, Computer Division/g, '');
      if (seen.has(org)) continue;
      if (/Teaching Assistant/.test(e.role)) continue;
      seen.add(org);
      const role = /Intern/.test(e.role) ? (/Research/.test(e.role) ? 'research intern' : 'intern') : e.role.replace(/ \(.*\)/, '');
      out.push(`<b>${esc(org.replace('Kalinga Institute of Industrial Technology', 'KIIT'))}</b> ${esc(role)} · ${esc(e.from === e.to ? e.from : e.from + '–' + e.to)}`);
    }
    return out;
  }
  function byStatus(s) { return papers.filter((p) => p.status === s); }
  const phdTag = (p) => (p.thesis ? '<span class="phd">PhD thesis</span>' : '');
  /** a paper in a tile: the thesis tag, its venue, its title */
  function pubLine(p) { return p.short ? `${phdTag(p)}<b>${esc(p.short)}</b> ${esc(window.Order.short(p))} · ${esc(p.glance || p.title)}` : `${phdTag(p)}<b>${esc(window.Order.short(p))}</b> ${esc(p.title)}`; }
  function thesisLines() { return window.Order.thesis(papers).map(pubLine); }
  function shortNum(n) { n = Number(String(n).replace(/[^0-9.]/g, '')) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n); }
  function teachingLines() {
    const o = (D.tools && D.tools.online) || {};
    const out = [];
    if (o.youtube) out.push('YouTube: ' + (o.youtube.videos || 78) + ' lectures, ' + (o.youtube.views ? shortNum(o.youtube.views) + ' views' : 'OS and networks'));
    out.push('KIIT: architecture, operating systems, programming');
    if (o.blog) out.push('blog.jyotiprakash.org: ' + (o.blog.glance || 'systems, security, CS fundamentals'));
    out.push('UW-Madison: TA for operating systems, 2014–2016');
    return out;
  }
  function countUp() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.stat b').forEach((b) => {
      const target = b.dataset.count;
      const n = parseFloat(target);
      if (!Number.isFinite(n) || /[a-z]/i.test(target)) return;
      let k = 0;
      const step = () => { k++; b.textContent = String(Math.round(n * Math.min(1, k / 18))); if (k < 18) requestAnimationFrame(step); };
      step();
    });
  }

  // ---- the sheet -----------------------------------------------------------------------------------------------
  let current = null;
  function open(key, itemId, push) {
    const s = SECTIONS[key];
    if (!s) return;
    current = key;
    const sheet = $('#sheet');
    sheet.hidden = false;
    sheet.innerHTML = `<div class="sheet" role="document">
      <div class="sheet-head"><h2 id="sheetTitle">${esc(s.title)}<small>${esc(s.sub)}</small></h2>
        ${s.search ? '<input type="search" id="sheetSearch" placeholder="filter…" aria-label="Filter">' : ''}
        <button class="x" id="sheetClose" aria-label="Close">esc ✕</button></div>
      <div id="sheetTabs"></div>
      <div class="sheet-body" id="sheetBody"></div></div>`;
    s.render($('#sheetBody'), $('#sheetTabs'));
    $('#sheetClose').addEventListener('click', close);
    const q = $('#sheetSearch');
    if (q) q.addEventListener('input', () => filter(q.value));
    sheet.onclick = (e) => { if (e.target === sheet) close(); };
    if (itemId) { const it = document.getElementById('it-' + itemId); if (it) { toggle(it, true); setTimeout(() => it.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); } }
    if (push !== false) history.replaceState(null, '', '#' + key + (itemId ? '/' + itemId : ''));
    document.title = s.title + ' · Jyotiprakash Mishra';
    setTimeout(() => { const f = q || $('#sheetClose'); if (f) f.focus({ preventScroll: true }); }, 30);
  }
  function close() {
    $('#sheet').hidden = true; $('#sheet').innerHTML = ''; current = null;
    history.replaceState(null, '', location.pathname + location.search);
    document.title = 'Jyotiprakash Mishra';
  }
  function filter(q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('#sheetBody .item').forEach((it) => { it.style.display = !q || it.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  }
  function toggle(it, on) {
    const o = on === undefined ? !it.classList.contains('open') : on;
    it.classList.toggle('open', o);
    const b = it.querySelector('button.head'); if (b) b.setAttribute('aria-expanded', String(o));
    if (o && current) history.replaceState(null, '', '#' + current + '/' + it.id.slice(3));
  }

  /** an expandable item: head line, glance, meta on the right, and a body */
  function item(id, title, glance, meta, body) {
    return `<article class="item" id="it-${esc(id)}"><button class="head" aria-expanded="false"><span class="t">${esc(title)}</span><span class="meta">${meta || ''}</span><span class="g">${esc(glance || '')}</span></button><div class="body">${body}</div></article>`;
  }
  const sec = (h, x) => (x && (!Array.isArray(x) || x.length) ? `<h4>${esc(h)}</h4>` + (Array.isArray(x) ? `<ul>${x.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>` : `<p>${esc(x)}</p>`) : '');
  const kw = (k) => (k && k.length ? `<div class="kw">${k.map((v) => `<span>${esc(v)}</span>`).join('')}</div>` : '');
  const tabs = (el, list, on, fn) => {
    el.className = 'sheet-tabs';
    el.innerHTML = list.map(([k, l]) => `<button data-tab="${k}" class="${k === on ? 'on' : ''}">${esc(l)}</button>`).join('');
    el.onclick = (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.tab); };
  };

  // ---- research ------------------------------------------------------------------------------------------------
  function renderResearch(body) {
    const t = D.thesis || {};
    let h = `<p class="intro">${esc(t.glance || '')}</p>` + fig('thesis');
    h += item('thesis', t.title || 'PhD thesis', (t.institution || 'BITS Pilani') + ' · ' + (t.status || ''), `<span class="st">${esc(t.statusShort || 'submitted')}</span>`,
      sec('The problem', t.problem) + sec('Why', t.why) + sec('What I did', t.approach) + (t.thesisStatement ? `<h4>Thesis statement</h4><blockquote>${esc(t.thesisStatement)}</blockquote>` : '') + sec('Research questions', t.researchQuestions) + sec('Contributions', t.contributions) + sec('Key results', t.keyResults) + `<p class="authors">Advisor: ${esc(t.advisor || 'Prof. Sanjay K. Sahay')}</p>`);
    h += '<div class="group-t" id="thesisPapers">Published from the thesis</div>' + window.Order.thesis(papers).map(paperItem).join('');
    if (t.defenseStory && t.defenseStory.length) h += item('story', 'The story in one minute', 'The defence, in short', '', `<ul>${t.defenseStory.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`);
    h += '<div class="group-t">Chapters</div>';
    (t.chapters || []).forEach((c, i) => {
      const rel = (c.papers || c.paperIds || []).map((id) => papers.find((p) => p.id === id)).filter(Boolean);
      h += item('ch' + (i + 1), (i + 1) + '. ' + c.title, firstSentence(c.summary), '', sec('Summary', c.summary) + sec('Results', c.results) + (rel.length ? '<h4>Papers</h4><ul>' + rel.map((p) => `<li><a href="#papers/${esc(p.id)}" data-jump="papers/${esc(p.id)}">${esc(p.title)}</a></li>`).join('') + '</ul>' : ''));
    });
    body.innerHTML = h;
  }
  const firstSentence = (s) => { s = String(s || ''); const m = /^(.{20,170}?[.!?])\s/.exec(s + ' '); return m ? m[1] : s.slice(0, 160); };

  // ---- publications ---------------------------------------------------------------------------------------------
  function paperMeta(p) {
    return `<span class="st">${esc(p.status === 'published' ? p.year : p.status)}</span>${phdTag(p)}${esc(p.venueShort || '')}${p.indexing ? `<span class="badge">${esc(p.indexing)}</span>` : ''}`;
  }
  function bibtex(p) {
    const key = (p.authors && p.authors[0] ? p.authors[0].split(' ').pop() : 'mishra').toLowerCase() + (p.year || '') + (p.id || '').replace(/[^a-z0-9]/gi, '');
    const isJ = p.kind === 'journal';
    const f = [['title', p.title], ['author', (p.authors || []).join(' and ')], [isJ ? 'journal' : 'booktitle', p.venue], ['year', p.year], ['volume', p.volume], ['number', p.issue], ['pages', p.pages], ['doi', p.doi], ['url', p.url]].filter(([, v]) => v);
    return '@' + (p.kind === 'preprint' ? 'misc' : isJ ? 'article' : 'inproceedings') + '{' + key + ',\n' + f.map(([k, v]) => '  ' + k + ' = {' + v + '}').join(',\n') + '\n}';
  }
  const fig = (id) => (window.Diagrams && window.Diagrams.specs[id] ? window.Diagrams.render(window.Diagrams.specs[id]) : '');
  function paperItem(p) {
    // papers under review are listed by title only
    if (p.status === 'under review') return `<article class="item plain" id="it-${esc(p.id)}"><div class="head"><span class="t">${esc(p.title)}</span><span class="meta"><span class="st">under review</span></span></div></article>`;
    const links = [p.url && `<a href="${esc(p.url)}" target="_blank" rel="noopener">read it</a>`, p.doi && !String(p.url || '').includes(p.doi) && `<a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">doi</a>`, p.code && `<a href="${esc(p.code)}" target="_blank" rel="noopener">code</a>`, p.status !== 'under review' && `<button data-bib="${esc(p.id)}">copy bibtex</button>`].filter(Boolean).join('');
    return item(p.id, p.title, p.glance, paperMeta(p),
      fig(p.id) + `<p class="authors">${esc((p.authors || []).join(', '))}<br>${esc(p.venue || '')}${p.doi ? ' · doi:' + esc(p.doi) : ''}</p>` +
      sec('The problem', p.problem) + sec('Why I wrote it', p.why) + sec('What we did', p.approach) + sec('What we found', p.results) + sec('Contributions', p.contributions) +
      (p.abstract ? `<h4>Abstract</h4><blockquote>${esc(p.abstract)}</blockquote>` : '') + kw(p.keywords) + (links ? `<div class="acts">${links}</div>` : ''));
  }
  function renderPapers(body, tabEl) {
    const groups = [['all', 'All'], ['journal', 'Journals'], ['conference', 'Conferences'], ['review', 'Surveys'], ['under', 'Under review']];
    const draw = (k) => {
      const list = papers.filter((p) => k === 'all' || (k === 'under' ? p.status === 'under review' : p.kind === k && p.status !== 'under review'));
      const order = ['published', 'accepted', 'preprint', 'under review'];
      let h = k === 'all' ? '<p class="intro">Every paper, with the problem it tackles and why I wrote it. Open any one for the approach, the results and the abstract.</p>' : '';
      const th = list.filter((p) => p.thesis);
      if (th.length) h += `<div class="group-t">PhD journal papers · ${th.length}</div>` + th.map(paperItem).join('');
      for (const st of order) {
        const g = list.filter((p) => p.status === st && !p.thesis);
        if (!g.length) continue;
        h += `<div class="group-t">${esc({ published: 'Published', accepted: 'Accepted', preprint: 'Preprints', 'under review': 'Under review' }[st])} · ${g.length + (st === 'under review' ? blind : 0)}</div>` + g.map(paperItem).join('');
        if (st === 'under review' && blindLine) h += `<p class="blind-note">${esc(blindLine)}</p>`;
      }
      body.innerHTML = h || '<p class="empty">Nothing here.</p>';
      const q = $('#sheetSearch'); if (q && q.value) filter(q.value);
    };
    tabs(tabEl, groups, 'all', draw);
    draw('all');
  }

  // ---- patents ---------------------------------------------------------------------------------------------------
  function renderPatents(body) {
    body.innerHTML = `<p class="intro">${esc(D.patentsIntro || 'Six published patent applications from my doctoral work: hardware inside RISC-V processors that watches for attacks, encrypts what leaves the chip, and manages memory.')}</p>` +
      patents.map((x) => item(x.id, x.title, x.glance, `<span class="st">${esc(x.status || 'published')}</span>${esc(x.publicationNo || '')}`,
        `<p class="authors">${esc((x.inventors || []).join(', '))}<br>Application ${esc(x.applicationNo || '')} · Publication ${esc(x.publicationNo || '')}${x.publicationDate ? ' · ' + esc(x.publicationDate) : ''}</p>` +
        sec('The problem', x.problem) + sec('Why', x.why) + sec('How it works', x.approach) + sec('What it claims', x.claims || x.claimsSummary) + sec('Measurements', x.results || x.measurements) + kw(x.keywords))).join('');
  }

  // ---- books -------------------------------------------------------------------------------------------------------
  function renderBooks(body) {
    let h = books.map((b) => item(b.id, b.title, b.glance, `<span class="st">${esc(b.status || '')}</span>${esc(b.publisher || 'De Gruyter Brill')}`,
      (b.subtitle ? `<p><b>${esc(b.subtitle)}</b></p>` : '') + `<p class="authors">${esc((b.authors || []).join(' and '))} · ${esc(b.publisher || '')}${b.isbn ? ' · ISBN ' + esc(b.isbn) : ''}${b.expected ? ' · expected ' + esc(b.expected) : ''}</p>` +
      sec('Why I wrote it', b.why) + sec('Who it is for', b.audience || b.whoFor) + sec('What makes it different', b.different || b.whatMakesItDifferent) +
      toc(b.toc || b.chapters || []) +
      (b.url ? `<div class="acts"><a href="${esc(b.url)}" target="_blank" rel="noopener">publisher page</a></div>` : ''))).join('');
    body.innerHTML = h;
  }

  /** a table of contents: chapters, or parts holding chapters */
  function toc(list) {
    if (!list.length) return '';
    const ch = (c) => `<li><b>${c.n ? esc(c.n) + '. ' : ''}${esc(c.title || c)}</b>${c.summary ? ': ' + esc(c.summary) : ''}</li>`;
    return '<h4>Contents</h4>' + list.map((x) => (x && x.chapters ? `<p><b>${esc(x.part || x.title || '')}</b></p><ul>${x.chapters.map(ch).join('')}</ul>` : `<ul>${ch(x)}</ul>`)).join('');
  }

  // ---- tools --------------------------------------------------------------------------------------------------------
  function paperOf(ref) { if (!ref) return null; const r = String(ref).toLowerCase(); return papers.find((p) => p.id === ref || r.includes(p.title.toLowerCase().slice(0, 30)) || p.title.toLowerCase().includes(r.slice(0, 30))) || null; }
  function renderTools(body) {
    body.innerHTML = `<p class="intro">I build these because students learn a machine best when they can see inside it. They are free, they need no install, and the source is open.</p>` +
      tools.map((x) => item(x.id, x.name, x.glance || x.tagline, x.url ? `<span class="st">live</span>${esc(x.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}` : '<span class="st">in review</span>',
        sec('What students struggle with', x.problem) + sec('Why I built it', x.why) + sec('What it does', x.features) + (x.tech ? sec('Built with', x.tech) : '') +
        ((x.shots || []).length ? '<div class="shots">' + x.shots.map((s) => `<figure><img src="${esc(s.src)}" alt="${esc(s.caption || x.name)}" loading="lazy">${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''}</figure>`).join('') + '</div>' : '') +
        `<div class="acts">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">open ${esc(x.name)}</a>` : ''}${x.repo ? `<a href="${esc(x.repo)}" target="_blank" rel="noopener">source</a>` : ''}${paperOf(x.paper) ? `<a href="#papers/${esc(paperOf(x.paper).id)}" data-jump="papers/${esc(paperOf(x.paper).id)}">the paper</a>` : ''}</div>`)).join('');
  }

  // ---- experience, education ------------------------------------------------------------------------------------------
  function renderExperience(body) {
    const c = D.tools && D.tools.company;
    body.innerHTML = '<div class="timeline">' + P.experience.map((e, i) => item('x' + i, e.role, e.org + ' · ' + e.glance, `<span class="st">${esc(e.from)} – ${esc(e.to)}</span>${esc(e.place || '')}`,
      `<ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` + (i === 0 && c && c.products ? sec('Products', c.products.map((p) => (p.name ? p.name + ': ' + (p.glance || p.description || '') : p))) : '') + (e.url ? `<div class="acts"><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.url.replace(/^https?:\/\//, ''))}</a></div>` : ''))).join('') + '</div>';
  }
  function renderEducation(body) {
    body.innerHTML = P.education.map((e, i) => item('e' + i, e.degree, e.org + ' · ' + e.glance, `<span class="st">${esc(e.from)} – ${esc(e.to)}</span>${esc(e.status)}`, e.points.length ? `<ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : `<p>${esc(e.status)}</p>`)).join('') +
      '<div class="group-t">Honours</div>' + item('honours', 'Honours and awards', P.honors[0], '', `<ul>${P.honors.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
  }

  // ---- teaching -------------------------------------------------------------------------------------------------------
  function renderTeaching(body) {
    const o = (D.tools && D.tools.online) || {};
    let h = '<p class="intro">Most of what I build and write is for students. These are the places where it lives.</p>';
    if (o.youtube) h += item('youtube', o.youtube.name || 'YouTube: Jyotiprakash Mishra CS', o.youtube.glance || 'Full university courses, free.', `<span class="st">${esc(o.youtube.videos || 78)} videos</span>${o.youtube.views ? esc(shortNum(o.youtube.views)) + ' views' : ''}`,
      sec('What is there', o.youtube.description) + sec('Playlists', (o.youtube.playlists || []).map((p) => (p.name || p) + (p.videos ? ' (' + p.videos + ' videos)' : ''))) + (o.youtube.url ? `<div class="acts"><a href="${esc(o.youtube.url)}" target="_blank" rel="noopener">watch</a></div>` : ''));
    if (o.blog) h += item('blog', 'blog.jyotiprakash.org', o.blog.glance || 'Writing on systems, security and computer science.', '<span class="st">writing</span>',
      sec('What it covers', o.blog.description || o.blog.covers) + ((o.blog.posts || []).length ? '<h4>Some posts</h4><ul>' + o.blog.posts.map((p) => `<li>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title || p)}</li>`).join('') + '</ul>' : '') + `<div class="acts"><a href="https://blog.jyotiprakash.org" target="_blank" rel="noopener">read</a></div>`);
    h += item('kiit', 'Courses at KIIT', 'Computer architecture, operating systems and programming.', '<span class="st">since 2020</span>', '<p>I teach core computer science to undergraduate and graduate students, set and run examinations, and sit on faculty recruitment interviews. The tools on this site started as things I needed in my own classes.</p>');
    h += item('uw', 'Teaching assistant, UW-Madison', 'Introduction to Operating Systems, 2014 to 2016.', '<span class="st">2014–2016</span>', '<p>Taught operating systems concepts, set and graded examinations and weekly assignments, and held office hours, throughout the MS.</p>');
    h += '<div class="group-t">Tools</div>' + tools.map((x) => item('t-' + x.id, x.name, x.glance || x.tagline, x.url ? '<span class="st">live</span>' : '', `<div class="acts">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">open</a>` : ''}<button data-jump="tools/${esc(x.id)}">more</button></div>`)).join('');
    const apps = (D.tools && D.tools.apps) || [];
    if (apps.length) h += '<div class="group-t">Apps</div>' + apps.map((a, i) => item('app' + i, a.name, a.glance || a.description, a.url ? '<span class="st">play store</span>' : '', a.url ? `<div class="acts"><a href="${esc(a.url)}" target="_blank" rel="noopener">get it</a></div>` : `<p>${esc(a.description || a.glance || '')}</p>`)).join('');
    body.innerHTML = h;
  }

  // ---- contact ----------------------------------------------------------------------------------------------------------
  function renderContact(body) {
    const c = P.contact, pr = D.profiles || {};
    const row = (k, v, href) => `<p><b>${esc(k)}</b> &nbsp; ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v)}</p>`;
    body.innerHTML = `<p class="intro">The best way to reach me is email. I am glad to hear from students, researchers and anyone who found a bug in one of my tools.</p>
      <div class="card" style="padding:14px 16px;margin-bottom:12px">
        <p><b>email</b> &nbsp; <a href="mailto:${esc(c.email)}">${esc(c.email)}</a> &nbsp; <button class="copy" data-copy="${esc(c.email)}" style="background:none;border:1px solid var(--line);border-radius:5px;cursor:pointer;color:var(--muted)">copy</button></p>
        ${row('linkedin', 'linkedin.com/in/mishrajp88', c.linkedin)}${row('github', 'github.com/ShowMeTheStack', c.github)}${row('blog', 'blog.jyotiprakash.org', c.blog)}${row('company', 'eninehq.com', c.company)}
        ${pr.scholar ? row('scholar', 'Google Scholar', pr.scholar) : ''}${pr.orcid ? row('orcid', pr.orcid.replace(/^https?:\/\/orcid.org\//, ''), pr.orcid) : ''}${pr.dblp ? row('dblp', 'DBLP', pr.dblp) : ''}${pr.researchgate ? row('researchgate', 'ResearchGate', pr.researchgate) : ''}
      </div>
      <div class="group-t">Skills</div>${P.skills.map((s) => `<p><b>${esc(s.area)}</b></p><div class="chips" style="margin-bottom:10px">${s.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`).join('')}
      <div class="group-t">Languages</div><div class="chips">${P.languages.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`;
  }

  // ---- the full CV ------------------------------------------------------------------------------------------------------
  function renderCV(body) {
    const pub = (st) => papers.filter((p) => p.status === st);
    const ref = (p) => `<li><b>${esc(p.title)}</b>${p.thesis ? ' [PhD thesis]' : ''}${p.indexing ? ' [' + esc(p.indexing) + ']' : ''}<br><span class="authors">${esc((p.authors || []).join(', '))}</span><br>${esc(p.venue || '')}${p.year ? ', ' + esc(p.year) : ''}${p.doi ? '. doi:' + esc(p.doi) : ''}</li>`;
    body.innerHTML = `<div class="acts" style="margin-bottom:12px"><button id="printCV">print or save as PDF</button></div>
      <h3 style="margin:0">${esc(P.name)}</h3><p class="authors">${esc(P.roles.join(' · '))}<br>${esc(P.contact.email)} · jyotiprakash.org</p>
      <h4 class="cvh">Profile</h4><p>${esc(P.summary)}</p>
      <h4 class="cvh">Education</h4><ul>${P.education.map((e) => `<li><b>${esc(e.degree)}</b>, ${esc(e.org)}, ${esc(e.from)}–${esc(e.to)}. ${esc(e.status)}.</li>`).join('')}</ul>
      <h4 class="cvh">Experience</h4><ul>${P.experience.map((e) => `<li><b>${esc(e.role)}</b>, ${esc(e.org)}, ${esc(e.from)}–${esc(e.to)}. ${esc(e.glance)}</li>`).join('')}</ul>
      <h4 class="cvh">Books</h4><ul>${books.map((b) => `<li><b>${esc(b.title)}</b>. ${esc((b.authors || []).join(' and '))}. ${esc(b.publisher || '')}${b.isbn ? ', ISBN ' + esc(b.isbn) : ''}. ${esc(b.status || '')}.</li>`).join('')}</ul>
      <h4 class="cvh">Patents</h4><ul>${patents.map((x) => `<li><b>${esc(x.title)}</b><br><span class="authors">${esc((x.inventors || []).join(', '))}</span><br>Application ${esc(x.applicationNo || '')}, publication ${esc(x.publicationNo || '')}.</li>`).join('')}</ul>
      <h4 class="cvh">Publications</h4><ol>${pub('published').concat(pub('accepted'), pub('preprint')).map(ref).join('')}</ol>
      <h4 class="cvh">Under review</h4><ol>${pub('under review').map((p) => `<li><b>${esc(p.title)}</b></li>`).join('')}</ol>${blindLine ? `<p>${esc(blindLine)}</p>` : ''}
      <h4 class="cvh">Teaching tools</h4><ul>${tools.map((x) => `<li><b>${esc(x.name)}</b>${x.url ? ' (' + esc(x.url.replace(/^https?:\/\//, '')) + ')' : ''}: ${esc(x.glance || x.tagline || '')}</li>`).join('')}</ul>
      <h4 class="cvh">Honours</h4><ul>${P.honors.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4 class="cvh">Skills</h4><ul>${P.skills.map((s) => `<li><b>${esc(s.area)}</b>: ${esc(s.items.join(', '))}</li>`).join('')}</ul>
      <h4 class="cvh">Languages</h4><p>${esc(P.languages.join(', '))}</p>`;
    body.classList.add('cv');
  }

  // ---- themes, the typed prompt, the boot ----------------------------------------------------------------------------------
  function theme() { return document.documentElement.dataset.theme; }
  function setTheme(id, quiet) {
    if (!THEMES.some((t) => t.id === id)) return false;
    document.documentElement.dataset.theme = id;
    store.set('theme', id);
    document.querySelectorAll('#themes button').forEach((b) => b.classList.toggle('on', b.dataset.theme === id));
    const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (window.Rain && window.Rain.ctx) window.Rain.theme();
    if (window.Photo) window.Photo.set(id);
    if (!quiet) flash();
    return true;
  }
  function flash() { const e = $('#crt'); if (!e || matchMedia('(prefers-reduced-motion: reduce)').matches) return; e.animate([{ background: 'rgba(255,255,255,0.08)' }, { background: '' }], { duration: 260 }); }
  function themeButtons() {
    $('#themes').innerHTML = THEMES.map((t, i) => `<button data-theme="${t.id}" title="Theme: ${t.name} (key ${i + 1})"><i style="background:${t.dot}"></i>${t.name}</button>`).join('');
    $('#themes').addEventListener('click', (e) => { const b = e.target.closest('button[data-theme]'); if (b) setTheme(b.dataset.theme); });
  }
  function typed() {
    const lines = ['whoami', 'cat research/thesis.txt', 'ls papers/ | wc -l', 'open strux', 'grep -r "side channel" .', 'make teaching-tools', 'sudo make me a sandwich'];
    const el = $('#typed');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = 'whoami'; return; }
    let k = 0, i = 0, del = false;
    const step = () => {
      const s = lines[k];
      if (!del) { i++; el.textContent = s.slice(0, i); if (i >= s.length) { del = true; return setTimeout(step, 2200); } }
      else { i--; el.textContent = s.slice(0, i); if (i <= 0) { del = false; k = (k + 1) % lines.length; } }
      setTimeout(step, del ? 28 : 70 + Math.random() * 60);
    };
    step();
  }
  function boot(done) {
    let seen = false;
    try { seen = sessionStorage.getItem('jp.booted') === '1'; sessionStorage.setItem('jp.booted', '1'); } catch (e) { seen = true; }
    if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noboot/.test(location.search) || location.hash) { done(); return; }
    const b = $('#boot');
    b.classList.add('on');
    const pub = papers.filter((p) => p.status !== 'under review').length;
    const L = ['JM-BIOS v2026.10  (c) Jyotiprakash Mishra', 'CPU: RISC-V rv64gc, BOOM out-of-order, side channels: being closed', '',
      '[ ok ] mounting /research ............ PhD thesis, BITS Pilani',
      '[ ok ] mounting /papers .............. ' + pub + ' published, ' + inReview() + ' under review',
      '[ ok ] mounting /patents ............. ' + patents.length + ' published',
      '[ ok ] mounting /books ............... ' + books.length + ' with De Gruyter Brill',
      '[ ok ] starting teaching tools ....... ' + tools.map((t) => t.name.toLowerCase().replace(/[^a-z0-9]/g, '')).join(' '),
      '[ ok ] loading 16 years of experience', '', 'press any key'];
    let i = 0, stop = false;
    const end = () => { if (stop) return; stop = true; b.classList.add('out'); setTimeout(() => { b.classList.remove('on', 'out'); b.textContent = ''; }, 360); done(); };
    const tick = () => { if (stop) return; if (i < L.length) { b.textContent += L[i++] + '\n'; setTimeout(tick, 75); } else setTimeout(end, 500); };
    window.addEventListener('keydown', end, { once: true });
    b.addEventListener('click', end, { once: true });
    tick();
  }

  // ---- wiring ------------------------------------------------------------------------------------------------------------------
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) { if (current) close(); return; }
    const [k, id] = h.split('/');
    if (SECTIONS[k]) open(k, id, false);
  }
  function wire() {
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); open(o.dataset.open); return; }
      const j = e.target.closest('[data-jump]');
      if (j) { e.preventDefault(); const [k, id] = j.dataset.jump.split('/'); open(k, id); return; }
      const hd = e.target.closest('.item > button.head');
      if (hd) { toggle(hd.parentNode); return; }
      const bb = e.target.closest('[data-bib]');
      if (bb) { const p = papers.find((x) => x.id === bb.dataset.bib); copy(bibtex(p), bb); return; }
      const cp = e.target.closest('[data-copy]');
      if (cp) { copy(cp.dataset.copy, cp); return; }
      if (e.target.id === 'printCV') { window.print(); return; }
      if (e.target.id === 'openTerm') { window.Term.open(); }
    });
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toUpperCase();
      if (e.key === 'Escape') { if (!$('#term').hidden) { window.Term.close(); return; } if (current) { close(); return; } }
      if (/INPUT|TEXTAREA/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '`' || e.key === '~' || e.key === ':') { e.preventDefault(); window.Term.open(); return; }
      if (e.key === '/' && current && $('#sheetSearch')) { e.preventDefault(); $('#sheetSearch').focus(); return; }
      if (/^[1-7]$/.test(e.key) && !current) { setTheme(THEMES[+e.key - 1].id); return; }
      const keys = { r: 'research', p: 'papers', t: 'tools', b: 'books', x: 'experience', e: 'education', c: 'contact' };
      if (!current && keys[e.key]) open(keys[e.key]);
    });
    window.addEventListener('hashchange', route);
    // printing always gives the full CV, whatever is on screen
    window.addEventListener('beforeprint', () => { if (current !== 'cv') open('cv'); });
  }
  function copy(text, btn) {
    const ok = () => { if (btn) { const t = btn.textContent; btn.textContent = 'copied'; setTimeout(() => { btn.textContent = t; }, 1200); } };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, ok); else ok();
  }
  function footer() {
    $('#foot').innerHTML = `<span>© 2026 Jyotiprakash Mishra · <a href="mailto:${esc(P.contact.email)}">${esc(P.contact.email)}</a></span>
      <span>keys: <kbd>1</kbd>–<kbd>7</kbd> themes · <kbd>p</kbd> papers · <kbd>t</kbd> tools · <kbd>\`</kbd> <button id="openTerm">terminal</button> · <kbd>esc</kbd> close</span>`;
  }

  window.App = { open, close, setTheme, THEMES, SECTIONS, bibtex, data: D };
  function start() {
    themeButtons();
    const saved = store.get('theme', null);
    setTheme(THEMES.some((t) => t.id === saved) ? saved : (matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'matrix'), true);
    home(); footer(); wire(); typed();
    window.Rain.start();
    boot(() => { route(); window.__siteReady = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
