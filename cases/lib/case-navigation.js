/**
 * Live-case navigation helpers for Eleventy templates.
 */
const manifest = require('../src/_data/manifest.json');

const liveCases = manifest.cases.filter((c) => c.status === 'live');

function titleCaseTrack(track) {
  return String(track || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function caseNav(slug) {
  if (!slug) return null;
  const idx = liveCases.findIndex((c) => c.slug === slug);
  if (idx === -1) return null;

  const current = liveCases[idx];
  const inTrack = liveCases.filter((c) => c.track === current.track);
  const trackIdx = inTrack.findIndex((c) => c.slug === slug);

  let next = inTrack[trackIdx + 1] || null;
  if (!next && liveCases.length > 1) {
    next = liveCases[(idx + 1) % liveCases.length];
    if (next.slug === slug) next = liveCases[(idx + 2) % liveCases.length] || null;
  }

  let prev = inTrack[trackIdx - 1] || null;
  if (!prev && liveCases.length > 1) {
    prev = liveCases[(idx - 1 + liveCases.length) % liveCases.length];
    if (prev.slug === slug) prev = liveCases[(idx - 2 + liveCases.length) % liveCases.length] || null;
  }

  function pack(c) {
    if (!c) return null;
    return {
      slug: c.slug,
      title: c.title,
      track: c.track,
      href: `/${c.slug}/`,
    };
  }

  return {
    current: pack(current),
    next: pack(next),
    prev: pack(prev),
    trackIndex: trackIdx + 1,
    trackTotal: inTrack.length,
    liveIndex: idx + 1,
    liveTotal: liveCases.length,
    trackLabel: titleCaseTrack(current.track),
  };
}

module.exports = {
  liveCases,
  liveCaseCount: liveCases.length,
  caseNav,
};
