// Build: join the styles, the scripts and the data in src/ into one index.html.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, 'src', p), 'utf8');
const json = (p, d) => (existsSync(join(root, 'src/data', p)) ? JSON.parse(src('data/' + p)) : d);

const profile = json('profile.json');
const papers = json('papers.json', { papers: [] });
const data = {
  profile,
  papers: papers.papers,
  blindReview: papers.blindReview || null,
  profiles: papers.profiles || {},
  thesis: json('thesis.json', {}),
  figures: (json('thesis.json', {}).figures || []).filter((f) => f.src),
  patents: json('patents.json', { patents: [] }).patents,
  patentsIntro: json('patents.json', {}).intro,
  books: json('books.json', { books: [] }).books,
  inProgress: json('books.json', { inProgress: [] }).inProgress,
  tools: json('tools.json', { tools: [], online: {}, apps: [], company: {} }),
};

let html = src('shell.html');
html = html.replace('/*@@CSS@@*/', () => src('styles.css'));
html = html.replace('/*@@DATA@@*/null', () => JSON.stringify(data).replace(/</g, '\\u003c'));
html = html.replace('//@@JS@@', () => ['order.js', 'rain.js', 'photo.js', 'diagrams.js', 'figs.js', 'term.js', 'app.js'].map((f) => `// ==== ${f} ====\n` + src(f)).join('\n').replace(/<\/script/gi, '<\\/script'));
writeFileSync(join(root, 'index.html'), html);
console.log('index.html: ' + (html.length / 1024).toFixed(1) + ' KB, ' + data.papers.length + ' papers, ' + data.patents.length + ' patents, ' + data.books.length + ' books, ' + (data.tools.tools || []).length + ' tools');
