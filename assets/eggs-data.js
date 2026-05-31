/* eggs-data.js — static data for all Easter egg modules
   Loaded once, used by eggs-mobile.js / eggs-tablet.js / eggs-desktop.js */
window.__EGG_DATA = {

  /* M1 — career snapshot rows */
  snapshot: [
    { n: '7+',   l: 'years shipping' },
    { n: '5',    l: 'products built'  },
    { n: '50k+', l: 'daily users'     },
    { n: '3',    l: 'domains'         }
  ],
  snapshotNote: 'SaaS · GovTech · Automotive Retail',

  /* M2 — long-press stat sparklines (keyed by stat-n text content) */
  sparklines: {
    '7+':   { label: 'Career growth',      points: [8, 18, 32, 48, 62, 78, 90, 100], caption: '2016 → now' },
    '50k+': { label: 'Daily active users',  points: [3,  9, 20, 35, 54, 71, 88, 100], caption: 'Tekion → Lifesight' },
    '30%':  { label: 'Perf improvement',    points: [100, 95, 88, 78, 70, 72, 71, 70], caption: 'Webpack MF migration' },
    '8+':   { label: 'Engineers mentored',  points: [10, 22, 36, 48, 60, 74, 86, 100], caption: '2020 → present' }
  },

  /* T2 — skill orbit nodes */
  orbitNodes: [
    { label: 'React',       color: '#61DAFB' },
    { label: 'TypeScript',  color: '#6baed6' },
    { label: 'Next.js',     color: '#BF5A32' },
    { label: 'MFE',         color: '#4E7A68' },
    { label: 'D3.js',       color: '#F9A825' },
    { label: 'Node.js',     color: '#68A063' },
    { label: 'GraphQL',     color: '#E535AB' },
    { label: 'Playwright',  color: '#2EAD33' }
  ],

  /* D2 — faux terminal lines */
  terminalLines: [
    { text: '$ npm test',                                            delay:    0, cls: 'tm-cmd'  },
    { text: '',                                                      delay:  320, cls: 'tm-gap'  },
    { text: 'PASS  src/components/HeroSection.test.tsx',            delay:  460, cls: 'tm-pass' },
    { text: 'PASS  src/hooks/useMMM.test.ts',                       delay:  660, cls: 'tm-pass' },
    { text: 'PASS  src/services/attributionEngine.test.ts',         delay:  860, cls: 'tm-pass' },
    { text: 'PASS  src/utils/formatMetric.test.ts',                 delay: 1060, cls: 'tm-pass' },
    { text: '',                                                      delay: 1180, cls: 'tm-gap'  },
    { text: 'Test Suites:  4 passed, 4 total',                      delay: 1260, cls: 'tm-stat' },
    { text: 'Tests:       12 passed, 12 total',                     delay: 1320, cls: 'tm-stat' },
    { text: 'Time:         2.847 s',                                 delay: 1380, cls: 'tm-stat' },
    { text: '',                                                      delay: 1440, cls: 'tm-gap'  },
    { text: 'Jest v29  ·  coverage 87 %  ·  0 skipped',            delay: 1540, cls: 'tm-meta' },
    { text: '',                                                      delay: 1600, cls: 'tm-gap'  },
    { text: '✓ All green. Ship it.',                           delay: 1820, cls: 'tm-ok'   }
  ],

  /* X2 — theme-toggle wink messages (cycle through them) */
  themeWinks: [
    'System: please pick a lane.',
    'Dark · Light · Dark · Light · …ok.',
    'Both look great - commit to one?',
    'Achievement unlocked: indecisive.'
  ]
};
