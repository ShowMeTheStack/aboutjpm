// The one order papers are shown in, everywhere: the page, the CV, the terminal and the README.
// The thesis journal papers come first, by the impact rank set in the data; then the rest, published
// before accepted before preprints before those under review, newest first.
(function (root) {
  'use strict';
  const STATUS = { published: 0, accepted: 1, preprint: 2, 'under review': 3 };
  const KIND = { journal: 0, conference: 1, review: 2, preprint: 3 };
  const rankOf = (map, k) => (k in map ? map[k] : 9);
  function papers(list) {
    return list.slice().sort((a, b) =>
      (b.thesis ? 1 : 0) - (a.thesis ? 1 : 0) ||
      rankOf(STATUS, a.status) - rankOf(STATUS, b.status) ||
      (a.impact || 999) - (b.impact || 999) ||
      (b.year || 0) - (a.year || 0) ||
      rankOf(KIND, a.kind) - rankOf(KIND, b.kind) ||
      String(a.title).localeCompare(String(b.title)));
  }
  const thesis = (list) => papers(list.filter((p) => p.thesis));
  /** how a paper is labelled in a short list: its venue and indexing, and that it is a thesis paper */
  const label = (p) => [p.venueShort, p.indexing].filter(Boolean).join(' · ');
  /** the landing page names only the journal indexing of the thesis papers, and no indexing for the rest */
  const short = (p) => (p.thesis ? label(p) : p.venueShort || '');
  root.Order = { papers, thesis, label, short };
})(typeof window !== 'undefined' ? window : globalThis);
