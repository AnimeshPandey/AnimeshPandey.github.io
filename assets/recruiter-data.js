/**
 * recruiter-data.js — Single source of truth for the Recruiter Briefing panel.
 *
 * To update brief copy:
 *   1. Edit the values in window.__RECRUITER_BRIEF below.
 *   2. Do NOT invent metrics — pull numbers from index.html content.
 *   3. Save and push; the SW cache will serve the new file on next visit
 *      (bump CACHE version in sw.js if you need instant invalidation).
 *
 * Loaded lazily on first recruiter-mode toggle — not on page load.
 */
(function () {
  'use strict';

  window.__RECRUITER_BRIEF = {

    meta: {
      candidate:    'Animesh Pandey',
      title:        'Senior Frontend Engineer',
      location:     'Bangalore, India · remote-friendly',
      status:       'Open to senior & staff roles',
      availability: 'Available now',
      email:        'animeshpandey1909@gmail.com',
      linkedin:     'https://linkedin.com/in/pandeyanimesh',
      resume:       '/resume.pdf'
    },

    executiveSummary: [
      'Senior frontend engineer with 7+ years shipping data-dense SaaS products — MMM dashboards, microfrontend platforms for 50k+ daily users, and agentic AI interfaces.',
      'At Lifesight, leads frontend for the Unified Measurement OS and built Mia, an agentic AI analytics product with real-time LLM streaming and tool-call visualisation.',
      'At Tekion, owned 10+ enterprise automotive retail modules, cut load times 30% via Webpack Module Federation, and automated the React 16→18 migration across the entire codebase in days.'
    ],

    atAGlance: [
      { label: 'Experience',  value: '7+ years' },
      { label: 'Scale',       value: '50k+ daily users' },
      { label: 'Core stack',  value: 'React · TS · Next.js' },
      { label: 'Domains',     value: 'SaaS · MMM · Automotive · GovTech' },
      { label: 'Education',   value: 'B.Tech CSE · IIITDM Jabalpur · 2019' }
    ],

    fitSignals: [
      'Staff-ready: platform architecture, CI performance guardrails, team-wide engineering standards',
      'Strong in data-dense interfaces — MMM curves, time-series attribution, geospatial dashboards',
      'Agentic AI experience: real-time LLM streaming, tool-call UX, progressive disclosure of confidence',
      'Open to senior & staff roles · remote-friendly · Bangalore base'
    ],

    highlights: [
      { label: 'Lifesight',  period: '2022–present', detail: 'Unified Measurement OS · SSR dashboards · Mia agentic AI',              anchor: '#experience' },
      { label: 'Tekion',     period: '2019–2022',    detail: '10+ MFE modules · Webpack Module Federation · 30% faster loads',         anchor: '#experience' },
      { label: 'IIITDM',    period: '2015–2019',    detail: 'B.Tech CSE · 8.7 CGPA · ACM ICPC participant',                          anchor: '#education'  }
    ],

    topProjects: [
      {
        name:   'Microfrontend Platform — Tekion',
        metric: '50k+ DAU · −30% load time · 10+ independent teams',
        anchor: '#projects',
        tags:   ['Module Federation', 'React', 'TypeScript']
      },
      {
        name:   'Lifesight Measurement OS',
        metric: 'Enterprise MMM dashboards · incrementality · SSR',
        anchor: '#projects',
        tags:   ['Next.js', 'SSR', 'Core Web Vitals']
      },
      {
        name:   'Mia — Agentic AI Analytics Interface',
        metric: 'Real-time LLM streaming · tool-call panels · progressive confidence UI',
        anchor: '#projects',
        tags:   ['Agentic AI', 'LangChain', 'Streaming']
      }
    ],

    skillsTier: {
      primary:   ['React', 'TypeScript', 'Next.js', 'Microfrontends', 'Module Federation'],
      secondary: ['Node.js', 'Playwright', 'Design Systems', 'D3.js', 'GraphQL', 'Storybook'],
      also:      ['Agentic AI', 'LangChain', 'WCAG 2.1', 'AWS', 'Docker', 'RAG', 'Highcharts']
    },

    scanSteps: [
      { id: 'experience', label: 'Experience' },
      { id: 'projects',   label: 'Projects'   },
      { id: 'skills',     label: 'Skills'     },
      { id: 'metrics',    label: 'Metrics'    },
      { id: 'education',  label: 'Education'  }
    ]

  };

})();
