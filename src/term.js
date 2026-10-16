// A small shell for those who would rather type: help, ls, open, papers, theme, whoami...
(function () {
  'use strict';
  const T = {
    el: null, out: null, input: null, hist: [], hi: 0,
    build() {
      this.el = document.getElementById('term');
      this.el.innerHTML = '<div class="bar"><span>jm-sh: type help</span><button aria-label="Close the terminal">✕</button></div><div class="out" aria-live="polite"></div><div class="in"><span>guest@jyotiprakash.org:~$</span><input aria-label="Command" autocomplete="off" spellcheck="false" autocapitalize="off"></div>';
      this.out = this.el.querySelector('.out');
      this.input = this.el.querySelector('input');
      this.el.querySelector('.bar button').addEventListener('click', () => this.close());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { const v = this.input.value; this.input.value = ''; this.run(v); }
        else if (e.key === 'ArrowUp') { if (this.hi > 0) this.input.value = this.hist[--this.hi] || ''; e.preventDefault(); }
        else if (e.key === 'ArrowDown') { this.input.value = this.hist[++this.hi] || ''; if (this.hi > this.hist.length) this.hi = this.hist.length; e.preventDefault(); }
        else if (e.key === 'Tab') { e.preventDefault(); this.complete(); }
      });
      this.print('Welcome. This is a toy shell over this page. Try: help, ls, cat thesis, papers spectre, open strux, theme amber.\n');
    },
    open() { if (!this.el) this.build(); this.el.hidden = false; this.input.focus(); },
    close() { if (this.el) this.el.hidden = true; },
    print(s, cls) { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = s; this.out.appendChild(d); this.out.scrollTop = this.out.scrollHeight; },
    complete() {
      const v = this.input.value, words = Object.keys(this.cmds).concat(Object.keys(window.App.SECTIONS), (window.App.data.tools.tools || []).map((t) => t.id), window.App.THEMES.map((t) => t.id));
      const parts = v.split(' '), last = parts.pop();
      const m = words.filter((w) => w.startsWith(last));
      if (m.length === 1) { parts.push(m[0]); this.input.value = parts.join(' ') + ' '; } else if (m.length) this.print(m.join('  '));
    },
    run(line) {
      line = line.trim();
      this.print('$ ' + line, 'p');
      if (!line) return;
      this.hist.push(line); this.hi = this.hist.length;
      const [c, ...a] = line.split(/\s+/);
      const f = this.cmds[c.toLowerCase()];
      if (!f) { this.print(c + ': command not found. Type help.', 'e'); return; }
      try { f.call(this, a); } catch (e) { this.print('error: ' + e.message, 'e'); }
    },
    cmds: {
      help() { this.print('help                 this list\nls                   the sections\ncat <section>        open a section (research, papers, patents, books, tools, experience, education, teaching, contact, cv)\npapers [words]       list papers, or search them\nopen <tool>          open a teaching tool in a new tab\ntheme [name]         list or change the theme\nwhoami               who this is\ncontact              how to reach me\nrain <0-3>           how fast the rain falls (0 stops it)\nclear, exit'); },
      ls() { this.print(Object.keys(window.App.SECTIONS).map((k) => k + '/').join('  ')); },
      cat(a) { const k = (a[0] || '').replace(/\/$/, '').replace(/\.txt$/, ''); const alias = { thesis: 'research', phd: 'research', cv: 'cv', resume: 'cv' }; const s = alias[k] || k; if (!window.App.SECTIONS[s]) { this.print('cat: ' + (a[0] || '') + ': no such section', 'e'); return; } window.App.open(s); this.close(); },
      papers(a) {
        const q = a.join(' ').toLowerCase();
        const list = window.App.data.papers.filter((p) => !q || (p.title + ' ' + (p.keywords || []).join(' ') + ' ' + (p.glance || '')).toLowerCase().includes(q));
        if (!list.length) { this.print('no papers match "' + q + '"'); return; }
        list.forEach((p) => this.print((p.year || '----') + '  ' + (p.thesis ? 'phd' : p.status === 'published' ? '   ' : p.status === 'under review' ? 'rev' : 'acc') + '  ' + p.title));
        const br = window.App.data.blindReview;
        if (!q && br && br.count) this.print('      +' + br.count + ' under double-blind review (titles withheld)');
        this.print(list.length + ' paper' + (list.length === 1 ? '' : 's') + '. cat papers to read them.');
      },
      open(a) {
        const id = (a[0] || '').toLowerCase();
        const t = (window.App.data.tools.tools || []).find((x) => x.id === id || x.name.toLowerCase().replace(/[^a-z0-9]/g, '') === id.replace(/[^a-z0-9]/g, ''));
        if (!t) { this.print('open: which tool? ' + (window.App.data.tools.tools || []).map((x) => x.id).join(' '), 'e'); return; }
        if (!t.url) { this.print(t.name + ' has no public link yet.'); return; }
        window.open(t.url, '_blank', 'noopener'); this.print('opening ' + t.url);
      },
      theme(a) { if (!a[0]) { this.print(window.App.THEMES.map((t) => t.id).join('  ')); return; } if (!window.App.setTheme(a[0].toLowerCase())) this.print('theme: no theme called ' + a[0], 'e'); },
      whoami() { const P = window.App.data.profile; this.print(P.name + '\n' + P.roles.join('\n') + '\n\n' + P.summary); },
      contact() { const c = window.App.data.profile.contact; this.print('email     ' + c.email + '\nlinkedin  ' + c.linkedin + '\ngithub    ' + c.github + '\nblog      ' + c.blog); },
      rain(a) { const v = Math.max(0, Math.min(3, Number(a[0]))); if (!Number.isFinite(v)) return; window.Rain.speed = v; this.print('rain speed ' + v); },
      clear() { this.out.innerHTML = ''; },
      exit() { this.close(); },
      sudo() { this.print('Nice try. This incident will be reported.', 'e'); },
      rm() { this.print('rm: permission denied. The papers stay.', 'e'); },
      vim() { this.print('You are now trapped in vim. Type exit to escape.'); },
      emacs() { this.print('A fine operating system. It lacks a good editor.'); },
      ssh() { this.print('Connection refused. Send an email instead: mail@jyotiprakash.org'); },
    },
  };
  window.Term = T;
})();
