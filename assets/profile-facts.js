/**
 * profile-facts.js — Canonical single source of truth for portfolio data.
 *
 * Priority rule (when sources conflict):
 *   1. index.html visible content   ← this file must match exactly
 *   2. animesh_pandey_resume.tex    ← verified against on every edit
 *   3. recruiter-data.js            ← derived from this file, never overrides 1–2
 *
 * Loaded before recruiter-data.js in the lazy load chain so the brief
 * can read window.__PROFILE_FACTS at construction time.
 */
(function () {
  'use strict';

  window.__PROFILE_FACTS = {

    identity: {
      name:           'Animesh Pandey',
      publicTitle:    'Senior Frontend Engineer',      // meta, hero, Open Graph
      currentRole:    'Senior Software Engineer',      // employer title at Lifesight
      currentCompany: 'Lifesight',
      location:       'Bangalore, India · remote-friendly',
      status:         'Open to senior & staff roles',
      availability:   'Available now',
      email:          'animeshpandey1909@gmail.com',
      linkedin:       'https://linkedin.com/in/pandeyanimesh',
      github:         'https://github.com/AnimeshPandey',
      resume:         '/resume.pdf'
    },

    /* Mirror of .stat-n values in index.html */
    stats: [
      { label: 'Experience',    value: '7+',   unit: 'years' },
      { label: 'Daily users',   value: '50k+', unit: 'at scale'  },
      { label: 'Load time cut', value: '30%',  unit: 'Webpack MF migration' },
      { label: 'Mentored',      value: '8+',   unit: 'engineers' }
    ],

    /* Matches <time datetime> values on #experience timeline.
       internship: true entries are shown separately / omitted from highlights. */
    employment: [
      {
        company:   'Lifesight',
        location:  'Bangalore',
        role:      'Senior Software Engineer',
        start:     '2025-12',           // Dec 2025
        end:       null,                // Present
        display:   'Dec 2025 – Present',
        detail:    'Unified Measurement OS · SSR dashboards · Mia agentic AI',
        anchor:    '#experience'
      },
      {
        company:   'Tekion',
        location:  'Bangalore',
        role:      'Software Engineer',
        start:     '2022-04',           // Apr 2022
        end:       '2025-09',           // Sept 2025
        display:   'Apr 2022 – Sept 2025',
        detail:    'MFE platform · Module Federation · 30% faster loads',
        anchor:    '#experience'
      },
      {
        company:   'Tekion',
        location:  'Bangalore',
        role:      'Associate Software Engineer',
        start:     '2021-01',           // Jan 2021
        end:       '2022-04',           // Apr 2022
        display:   'Jan 2021 – Apr 2022',
        detail:    '10+ enterprise automotive retail modules',
        anchor:    '#experience'
      },
      {
        company:   'Vassar Labs',
        location:  'Hyderabad',
        role:      'Software Development Engineer',
        start:     '2019-06',           // Jun 2019
        end:       '2021-01',           // Jan 2021
        display:   'Jun 2019 – Jan 2021',
        detail:    'Kerala-WRIS GovTech water intelligence platform',
        anchor:    '#experience'
      },
      {
        company:   'Vassar Labs',
        location:  'Hyderabad',
        role:      'Software Development Intern',
        start:     '2018-05',           // May 2018
        end:       '2018-11',           // Nov 2018
        display:   'May 2018 – Nov 2018',
        detail:    'Internship during B.Tech',
        anchor:    '#experience',
        internship: true
      }
    ],

    education: [
      {
        school:    'IIITDM Jabalpur',
        fullName:  'Indian Institute of Information Technology, Design and Management (IIITDM) Jabalpur',
        degree:    'B.Tech Computer Science and Engineering',
        score:     { value: 7.9, unit: 'CPI', scale: 10 },  // NOT CGPA; NOT 8.7
        start:     2015,
        end:       2019,
        anchor:    '#education'
      }
    ],

    /* Matches .pc-name values in index.html */
    projects: [
      { name: 'Microfrontend Architecture at Scale',   metric: '50k+ DAU · −30% load time · 10+ teams', anchor: '#projects', tags: ['Module Federation', 'React', 'TypeScript'] },
      { name: 'Kerala-WRIS Water Intelligence Platform', metric: 'GovTech · geospatial dashboards · D3.js', anchor: '#projects', tags: ['GovTech', 'D3.js', 'Node.js'] },
      { name: 'Mia: Agentic AI Analytics Interface',   metric: 'Real-time LLM streaming · tool-call panels', anchor: '#projects', tags: ['Agentic AI', 'LangChain', 'Streaming'] },
      { name: 'Attribution Anomaly Intelligence',      metric: 'AI layer · PELT changepoint detection',     anchor: '#projects', tags: ['AI', 'Attribution', 'Lifesight'] },
      { name: 'Marketing Intelligence Dashboard',      metric: 'Enterprise MMM · SSR · Core Web Vitals CI', anchor: '#projects', tags: ['Next.js', 'SSR', 'Playwright'] },
      { name: 'Enterprise Component Library',          metric: '20+ components · 25% less duplicate code',  anchor: '#projects', tags: ['Design Systems', 'Storybook', 'WCAG 2.1'] },
      { name: 'AI Dev Tooling Suite',                  metric: '−30% overhead · React 16→18 migration',    anchor: '#projects', tags: ['CLI', 'GitHub Actions', 'GPT-4'] },
      { name: 'Dealer Operations Mobile App',          metric: 'Offline-first · SQLite sync · React Native', anchor: '#projects', tags: ['React Native', 'Redux', 'SQLite'] },
      { name: 'Performance CI Guard',                  metric: 'Webpack bundle budgets · automated regress', anchor: '#projects', tags: ['CI', 'Webpack', 'Performance'] }
    ],

    skills: {
      primary:   ['React', 'TypeScript', 'Next.js', 'Microfrontends', 'Module Federation'],
      secondary: ['Node.js', 'Playwright', 'Design Systems', 'D3.js', 'GraphQL', 'Storybook'],
      also:      ['Agentic AI', 'LangChain', 'WCAG 2.1', 'AWS', 'Docker', 'RAG', 'Highcharts']
    }

  };

}());
