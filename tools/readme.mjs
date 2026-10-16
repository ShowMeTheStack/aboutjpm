// Writes README.md: the whole CV, every section open, with the diagrams. node tools/readme.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(readFileSync(join(root, 'src/data', f), 'utf8'));
const P = J('profile.json'), papers = J('papers.json'), thesis = J('thesis.json'), patents = J('patents.json').patents, books = J('books.json').books, T = J('tools.json');
const figs = readFileSync(join(root, 'src/figs.js'), 'utf8');
// the same order as the page: src/order.js
const ctx = {}; vm.createContext(ctx); vm.runInContext(readFileSync(join(root, 'src/order.js'), 'utf8'), ctx);
const Order = ctx.Order;
papers.papers = Order.papers(papers.papers);
const anchor = (t) => t.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
const hasFig = (id) => figs.includes(`S['${id}'] =`) || figs.includes(`S.${id} =`);
const cap = (id) => { const m = new RegExp(`S(?:\\['${id}'\\]|\\.${id}) = \\{[\\s\\S]*?caption: '((?:[^'\\\\]|\\\\.)*)'`).exec(figs); return m ? m[1].replace(/\\'/g, "'") : ''; };
const L = [];
const p = (...x) => L.push(...x);
const list = (a) => (a || []).forEach((x) => p('- ' + x));
const fig = (id) => { if (!hasFig(id)) return; p('', `<p align="center"><img src="docs/diagrams/${id}.svg" alt="${cap(id).replace(/"/g, '&quot;')}" width="100%"></p>`, '', '*' + cap(id) + '*', ''); };

p('# ' + P.name, '');
p(P.roles.join(' · '), '');
p(`**Website:** [jyotiprakash.org](https://jyotiprakash.org) · **Email:** [${P.contact.email}](mailto:${P.contact.email}) · [LinkedIn](${P.contact.linkedin}) · [GitHub](${P.contact.github}) · [Blog](${P.contact.blog})` + (papers.profiles.scholar ? ` · [Google Scholar](${papers.profiles.scholar})` : '') + (papers.profiles.orcid ? ` · [ORCID](${papers.profiles.orcid})` : ''), '');
// the screenshot's file name carries a hash of its contents, so a new picture is never hidden by an old cached one
const shot = readdirSync(join(root, 'docs')).find((f) => /^home-[0-9a-f]+\.png$/.test(f));
if (shot) p(`![The home page of jyotiprakash.org in the Matrix theme](docs/${shot})`, '');
p('This repository is my website. The page at [jyotiprakash.org](https://jyotiprakash.org) shows everything below at a glance on one screen, with seven themes, and lets you open any item for the detail. This README is the same CV with every section open.', '');

p('## Contents', '');
['Profile', 'Research', 'Publications', 'Papers under review', 'Patents', 'Books', 'Teaching tools', 'Experience', 'Education', 'Teaching and outreach', 'Honours', 'Skills', 'Languages', 'Contact'].forEach((s) => p(`- [${s}](#${s.toLowerCase().replace(/ /g, '-')})`));
p('');

p('## Profile', '', P.summary, '');
p(`${P.years.total} years of work: ${P.years.industry} in industry and ${P.years.teaching} in teaching. ${papers.papers.filter((x) => x.status !== 'under review').length} papers published or accepted, ${patents.length} published patent applications, ${books.length} books with De Gruyter Brill, and ${T.tools.length} free teaching tools.`, '');

p('## Research', '');
p(`**${thesis.title}**`, '', `${thesis.degree || 'PhD'}, ${thesis.institution}. Advisor: ${thesis.advisor}. ${thesis.status}.`, '');
fig('thesis');
p('**Published from the thesis**', '');
Order.thesis(papers.papers).forEach((x) => p(`- **[${x.title}](#${anchor(x.title)})** (${Order.label(x)}${x.doi ? ', DOI ' + x.doi : ''})`));
p('');
p('**The problem.** ' + thesis.problem, '', '**Why.** ' + thesis.why, '', '**What I did.** ' + thesis.approach, '');
if (thesis.thesisStatement) p('**Thesis statement.** ' + thesis.thesisStatement, '');
if (thesis.researchQuestions) { p('**Research questions**', ''); list(thesis.researchQuestions); p(''); }
p('**Contributions**', ''); list(thesis.contributions); p('');
p('**Key results**', ''); list(thesis.keyResults); p('');
if (thesis.defenseStory) { p('**The story in one minute**', ''); list(thesis.defenseStory); p(''); }
p('**Chapters**', '');
(thesis.chapters || []).forEach((c, i) => {
  const rel = (c.papers || []).map((id) => papers.papers.find((x) => x.id === id)).filter(Boolean);
  p(`${i + 1}. **${c.title}.** ${c.summary}` + (rel.length ? ' Published as ' + rel.map((x) => `[${x.title.split(':')[0]}](#${anchor(x.title)})`).join(', ') + '.' : ''));
  (c.results || []).forEach((r) => p('   - ' + r));
});
p('');

const GROUPS = [['PhD journal papers', (x) => x.thesis], ['Published', (x) => x.status === 'published' && !x.thesis], ['Accepted', (x) => x.status === 'accepted'], ['Preprints', (x) => x.status === 'preprint']];
p('## Publications', '');
for (const [name, keep] of GROUPS) {
  const g = papers.papers.filter(keep);
  if (!g.length) continue;
  p('### ' + name, '');
  for (const x of g) {
    p(`#### ${x.title}`, '');
    if (x.thesis) p('`PhD thesis` paper', '');
    p(`${(x.authors || []).join(', ')}  `, `*${x.venue}*${x.year ? ', ' + x.year : ''}${x.indexing ? ' · ' + x.indexing : ''}${x.doi ? ` · DOI [${x.doi}](https://doi.org/${x.doi})` : ''}`, '');
    fig(x.id);
    p('**The problem.** ' + x.problem, '', '**Why I wrote it.** ' + x.why, '', '**What we did.** ' + x.approach, '');
    p('**What we found**', ''); list(x.results); p('');
    p('**Contributions**', ''); list(x.contributions); p('');
    if (x.abstract) p('**Abstract.** ' + x.abstract, '');
    if (x.keywords) p('*Keywords: ' + x.keywords.join(', ') + '*', '');
  }
}
p('## Papers under review', '');
papers.papers.filter((x) => x.status === 'under review').forEach((x) => p('- ' + x.title));
if (papers.blindReview && papers.blindReview.count) p('', 'Also ' + papers.blindReview.count + ' paper' + (papers.blindReview.count === 1 ? '' : 's') + ' ' + papers.blindReview.note + '.');
p('');

p('## Patents', '', 'Six published patent applications from my doctoral work: hardware inside RISC-V processors that watches for attacks, encrypts what leaves the chip, and manages memory.', '');
for (const x of patents) {
  p(`### ${x.title}`, '');
  p(`${(x.inventors || []).join(', ')}  `, `Application ${x.applicationNo} · Publication ${x.publicationNo}${x.status ? ' · ' + x.status : ''}`, '');
  p('**The problem.** ' + x.problem, '', '**Why.** ' + x.why, '', '**How it works.** ' + x.approach, '');
  if (x.claims) { p('**What it claims**', ''); list(x.claims); p(''); }
  if (x.results) { p('**Measurements**' + (x.measurementPlatform ? ' (' + x.measurementPlatform + ')' : ''), ''); list(x.results); p(''); }
}

p('## Books', '');
for (const b of books) {
  p(`### ${b.title}`, '');
  if (b.subtitle) p('*' + b.subtitle + '*', '');
  p(`${(b.authors || []).join(' and ')}. ${b.publisher}${b.series ? ', ' + b.series : ''}. ISBN ${b.isbn}. ${b.status}${b.expected ? ', expected ' + b.expected : ''}.` + (b.url ? ` [Publisher page](${b.url}).` : ''), '');
  p('**Why I wrote it.** ' + b.why, '');
  if (b.audience || b.audienceDetail) p('**Who it is for.** ' + (b.audienceDetail || b.audience), '');
  if (b.different) p('**What makes it different.** ' + b.different, '');
  p('**Contents**', '');
  for (const part of b.toc || []) {
    if (part.chapters) { p('', '*' + (part.part || '') + '*', ''); part.chapters.forEach((c) => p(`${c.n}. **${c.title}.** ${c.summary || ''}`)); }
    else p(`- **${part.title || part}.** ${part.summary || ''}`);
  }
  p('');
}

p('## Teaching tools', '', 'Free tools that run in a browser and show students what a machine is really doing. No install, no account, open source.', '');
for (const t of T.tools) {
  p(`### [${t.name}](${t.url})`, '', '*' + t.tagline + '*', '');
  p('**What students struggle with.** ' + t.problem, '', '**Why I built it.** ' + t.why, '');
  p('**What it does**', ''); list(t.features); p('');
  if (t.tech) p('**Built with:** ' + t.tech.join(', ') + '.', '');
  p(`Live at ${t.url}` + (t.repo ? ` · source: ${t.repo}` : '') + (t.license ? ` · ${t.license}` : ''), '');
  if (t.shots && t.shots[0]) p(`<img src="${t.shots[0].src}" alt="${(t.shots[0].caption || t.name).replace(/"/g, '&quot;')}" width="100%">`, '');
}

p('## Experience', '');
for (const e of P.experience) { p(`### ${e.role}, ${e.org}`, '', `*${e.from} to ${e.to}, ${e.place}*`, ''); list(e.points); p(''); }
const c = T.company;
if (c && c.verticals) { p('**ENineHQ, what it does**', ''); c.verticals.forEach((v) => p(`- **${v.name}:** ${(v.items || []).join(', ')}`)); p(''); }

p('## Education', '');
for (const e of P.education) { p(`### ${e.degree}, ${e.org}`, '', `*${e.from} to ${e.to}. ${e.status}.*`, ''); list(e.points); p(''); }

p('## Teaching and outreach', '');
const o = T.online;
if (o.youtube) p(`- **YouTube, [${o.youtube.name}](${o.youtube.url}):** ${o.youtube.videos} lectures and more than 437,000 views. Series: ${(o.youtube.playlists || []).join(', ')}.`);
if (o.blog) p(`- **[blog.jyotiprakash.org](${o.blog.url}):** ${o.blog.description}`);
p('- **KIIT, since 2020:** computer architecture, operating systems and programming, for undergraduate and graduate students.');
p('- **UW-Madison, 2014 to 2016:** teaching assistant for Introduction to Operating Systems.', '');
if (o.blog && o.blog.posts) { p('Some posts:', ''); o.blog.posts.forEach((x) => p(`- [${x.title}](${x.url})`)); p(''); }

p('## Honours', ''); list(P.honors); p('');
p('## Skills', ''); P.skills.forEach((s) => p(`- **${s.area}:** ${s.items.join(', ')}`)); p('');
p('## Languages', '', P.languages.join(', '), '');
p('## Contact', '', `Email [${P.contact.email}](mailto:${P.contact.email}). I am glad to hear from students, researchers, and anyone who found a bug in one of my tools.`, '');
p('## About this site', '', 'The page is one HTML file built from the data in `src/data/` by `node build.mjs`. The diagrams are drawn as vector graphics from small descriptions in `src/figs.js`; `node tools/diagrams.mjs` writes the copies used in this README, `node tools/readme.mjs` writes this README, and `node tools/check.mjs` tests the page in headless Chrome at nine screen sizes and in every theme.', '');
p('Copyright © 2026 Jyotiprakash Mishra. All rights reserved. The text, the photographs and the diagrams may not be reused without permission.', '');
writeFileSync(join(root, 'README.md'), L.join('\n'));
console.log('README.md: ' + L.length + ' lines');
