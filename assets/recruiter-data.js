/**
 * recruiter-data.js — Recruiter Briefing content.
 *
 * Loaded AFTER profile-facts.js. Key fields (dates, score, role)
 * are derived from window.__PROFILE_FACTS so there is one source of
 * truth. Prose / editorial content lives here.
 *
 * Do NOT hand-edit dates, education score, or metrics — update
 * profile-facts.js and re-verify index.html instead.
 */
(function () {
  'use strict';

  /* ── Pull canonical facts ── */
  var F    = window.__PROFILE_FACTS || {};
  var id   = F.identity   || {};
  var emp  = F.employment || [];
  var edu  = (F.education && F.education[0]) || {};
  var proj = F.projects   || [];

  /* Helper: find first non-internship job at a company */
  function job(company) {
    return emp.filter(function (j) { return j.company === company && !j.internship; });
  }

  var lifesightJobs = job('Lifesight');   // [0] = Senior SWE
  var tekionJobs    = job('Tekion');      // [0] = SWE, [1] = Assoc SWE
  var vassarJobs    = job('Vassar Labs'); // [0] = SDE

  /* Helper: build display period for a job entry */
  function period(j) { return j ? j.display : ''; }

  /* ── Brief data ── */
  window.__RECRUITER_BRIEF = {

    meta: {
      candidate:    id.name    || 'Animesh Pandey',
      title:        id.publicTitle || 'Senior Frontend Engineer',
      location:     id.location    || 'Bangalore, India · remote-friendly',
      status:       id.status      || 'Open to senior & staff roles',
      availability: id.availability || 'Available now',
      email:        id.email   || 'animeshpandey1909@gmail.com',
      linkedin:     id.linkedin || 'https://linkedin.com/in/pandeyanimesh',
      resume:       id.resume  || '/resume.pdf'
    },

    executiveSummary: [
      'Senior frontend engineer with 7+ years shipping data-dense SaaS products - MMM dashboards, microfrontend platforms for 50k+ daily users, and agentic AI interfaces.',
      'At Lifesight, leads frontend for the Unified Measurement OS and built Mia, an agentic AI analytics product with real-time LLM streaming and tool-call visualisation.',
      'At Tekion, owned 10+ enterprise automotive retail modules, cut load times 30% via Webpack Module Federation, and automated the React 16→18 migration across the entire codebase in days.'
    ],

    atAGlance: [
      { label: 'Experience',  value: '7+ years' },
      { label: 'Scale',       value: '50k+ daily users' },
      { label: 'Core stack',  value: 'React · TS · Next.js' },
      { label: 'Domains',     value: 'SaaS · MMM · Automotive · GovTech' },
      {
        label: 'Education',
        value: 'B.Tech CSE · IIITDM Jabalpur · ' +
               (edu.score ? edu.score.unit + ' ' + edu.score.value + ' / ' + edu.score.scale : 'CPI 7.9 / 10') +
               ' · ' + (edu.end || 2019)
      }
    ],

    fitSignals: [
      'Staff-ready: platform architecture, CI performance guardrails, team-wide engineering standards',
      'Strong in data-dense interfaces - MMM curves, time-series attribution, geospatial dashboards',
      'Agentic AI experience: real-time LLM streaming, tool-call UX, progressive disclosure of confidence',
      'Open to senior & staff roles · remote-friendly · Bangalore base'
    ],

    /* Experience highlights — derived from employment facts */
    highlights: [
      {
        label:  (lifesightJobs[0] && lifesightJobs[0].company) || 'Lifesight',
        role:   (lifesightJobs[0] && lifesightJobs[0].role)    || 'Senior Software Engineer',
        period: period(lifesightJobs[0]),
        detail: (lifesightJobs[0] && lifesightJobs[0].detail)  || 'Unified Measurement OS · SSR dashboards · Mia agentic AI',
        anchor: '#experience'
      },
      {
        label:  (tekionJobs[0] && tekionJobs[0].company) || 'Tekion',
        role:   (tekionJobs[0] && tekionJobs[0].role)    || 'Software Engineer',
        period: period(tekionJobs[0]) + (tekionJobs[1] ? ' (SWE) · ' + period(tekionJobs[1]) + ' (Assoc)' : ''),
        detail: '10+ MFE modules · Webpack Module Federation · 30% faster loads',
        anchor: '#experience'
      },
      {
        label:  (vassarJobs[0] && vassarJobs[0].company) || 'Vassar Labs',
        role:   (vassarJobs[0] && vassarJobs[0].role)    || 'Software Development Engineer',
        period: period(vassarJobs[0]),
        detail: (vassarJobs[0] && vassarJobs[0].detail)  || 'Kerala-WRIS GovTech water intelligence platform',
        anchor: '#experience'
      },
      {
        label:  (edu.school) || 'IIITDM Jabalpur',
        role:   (edu.degree) || 'B.Tech Computer Science and Engineering',
        period: (edu.start || 2015) + ' – ' + (edu.end || 2019),
        detail: edu.score
          ? edu.score.unit + ' ' + edu.score.value + ' / ' + edu.score.scale + ' · ACM ICPC participant'
          : 'CPI 7.9 / 10 · ACM ICPC participant',
        anchor: '#education'
      }
    ],

    topProjects: [
      {
        name:   'Microfrontend Architecture at Scale',
        metric: '50k+ DAU · −30% load time · 10+ independent teams',
        anchor: '#projects',
        tags:   ['Module Federation', 'React', 'TypeScript']
      },
      {
        name:   'Mia: Agentic AI Analytics Interface',
        metric: 'Real-time LLM streaming · tool-call panels · progressive confidence UI',
        anchor: '#projects',
        tags:   ['Agentic AI', 'LangChain', 'Streaming']
      },
      {
        name:   'Marketing Intelligence Dashboard',
        metric: 'Enterprise MMM · incrementality · SSR · Core Web Vitals CI',
        anchor: '#projects',
        tags:   ['Next.js', 'SSR', 'Playwright']
      }
    ],

    skillsTier: {
      primary:   (F.skills && F.skills.primary)   || ['React', 'TypeScript', 'Next.js', 'Microfrontends', 'Module Federation'],
      secondary: (F.skills && F.skills.secondary) || ['Node.js', 'Playwright', 'Design Systems', 'D3.js', 'GraphQL', 'Storybook'],
      also:      (F.skills && F.skills.also)       || ['Agentic AI', 'LangChain', 'WCAG 2.1', 'AWS', 'Docker', 'RAG', 'Highcharts']
    },

    scanSteps: [
      { id: 'experience', label: 'Experience' },
      { id: 'projects',   label: 'Projects'   },
      { id: 'skills',     label: 'Skills'     },
      { id: 'metrics',    label: 'Metrics'    },
      { id: 'education',  label: 'Education'  }
    ],

    alsoExplore: [
      {
        label: 'Fundamentals of Functional JavaScript',
        href:  '/fundamentals-of-functional-javascript/',
        note:  'Article · JavaScript in Plain English'
      },
      {
        label: 'How Well Do You Know "this"?',
        href:  '/how-well-do-you-know-this/',
        note:  'Article · HackerNoon · 1.2k reads'
      },
      {
        label: 'About & values',
        href:  '/#about',
        note:  'Background, what I\'m looking for'
      }
    ]

  };

}());
