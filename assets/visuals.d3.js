/* visuals.d3.js — D3 force-directed skills graph
   Lazy-loaded when #skills enters viewport.
   Inserted ABOVE the existing .skills-grid list (both coexist).
   The existing list remains for accessibility / no-JS fallback. */
(function () {
  'use strict';
  if (!window.d3) return;

  var skillsSection = document.getElementById('skills');
  var skillsGrid    = skillsSection && skillsSection.querySelector('.skills-grid');
  if (!skillsGrid) return;

  var IS_MOBILE = window.matchMedia('(max-width: 819px)').matches;
  var REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Colour palette (7 categories) ── */
  var CAT_COLOR = {
    fe:      '#bf5a32', /* accent — frontend */
    arch:    '#4e8fa4', /* slate  — architecture */
    test:    '#4e7a68', /* sage   — testing */
    build:   '#8a6952', /* brown  — tooling */
    viz:     '#7072ba', /* indigo — data & viz */
    backend: '#4a7090', /* steel  — backend & cloud */
    ai:      '#9060a8'  /* purple — AI & agents */
  };

  /* ── Data ── */
  var NODES = [
    /* categories */
    { id:'fe',      label:'Frontend',        type:'cat', r:26, cat:null },
    { id:'arch',    label:'Architecture',    type:'cat', r:24, cat:null },
    { id:'test',    label:'Testing',         type:'cat', r:20, cat:null },
    { id:'build',   label:'Tooling',         type:'cat', r:20, cat:null },
    { id:'viz',     label:'Data & Viz',      type:'cat', r:22, cat:null },
    { id:'backend', label:'Backend & Cloud', type:'cat', r:22, cat:null },
    { id:'ai',      label:'AI & Agents',     type:'cat', r:22, cat:null },
    /* frontend */
    { id:'react',    label:'React',           type:'skill', r:18, cat:'fe',      featured:true  },
    { id:'ts',       label:'TypeScript',      type:'skill', r:16, cat:'fe',      featured:true  },
    { id:'nextjs',   label:'Next.js',         type:'skill', r:16, cat:'fe',      featured:true  },
    { id:'js',       label:'JavaScript',      type:'skill', r:13, cat:'fe',      featured:false },
    { id:'css',      label:'CSS3',            type:'skill', r:12, cat:'fe',      featured:false },
    { id:'redux',    label:'Redux',           type:'skill', r:12, cat:'fe',      featured:false },
    { id:'tailwind', label:'Tailwind',        type:'skill', r:12, cat:'fe',      featured:false },
    /* architecture */
    { id:'mfe',      label:'Microfrontends',  type:'skill', r:17, cat:'arch',    featured:true  },
    { id:'ssr',      label:'SSR',             type:'skill', r:13, cat:'arch',    featured:false },
    { id:'ds',       label:'Design Systems',  type:'skill', r:13, cat:'arch',    featured:false },
    { id:'modfed',   label:'Module Fed.',     type:'skill', r:12, cat:'arch',    featured:false },
    { id:'a11y',     label:'WCAG 2.1',        type:'skill', r:12, cat:'arch',    featured:false },
    /* testing */
    { id:'jest',     label:'Jest',            type:'skill', r:13, cat:'test',    featured:false },
    { id:'pw',       label:'Playwright',      type:'skill', r:13, cat:'test',    featured:false },
    { id:'rtl',      label:'RTL',             type:'skill', r:12, cat:'test',    featured:false },
    /* build */
    { id:'webpack',  label:'Webpack',         type:'skill', r:13, cat:'build',   featured:false },
    { id:'vite',     label:'Vite',            type:'skill', r:13, cat:'build',   featured:false },
    { id:'gha',      label:'GH Actions',      type:'skill', r:12, cat:'build',   featured:false },
    { id:'docker',   label:'Docker',          type:'skill', r:12, cat:'build',   featured:false },
    /* data & viz */
    { id:'d3',       label:'D3.js',           type:'skill', r:14, cat:'viz',     featured:false },
    { id:'graphql',  label:'GraphQL',         type:'skill', r:13, cat:'viz',     featured:false },
    { id:'hc',       label:'Highcharts',      type:'skill', r:12, cat:'viz',     featured:false },
    /* backend */
    { id:'node',     label:'Node.js',         type:'skill', r:14, cat:'backend', featured:false },
    { id:'aws',      label:'AWS',             type:'skill', r:13, cat:'backend', featured:false },
    { id:'azure',    label:'Azure',           type:'skill', r:12, cat:'backend', featured:false },
    /* AI */
    { id:'agentic',  label:'Agentic AI',      type:'skill', r:17, cat:'ai',      featured:true  },
    { id:'openai',   label:'OpenAI API',      type:'skill', r:12, cat:'ai',      featured:false },
    { id:'lc',       label:'LangChain',       type:'skill', r:12, cat:'ai',      featured:false }
  ];

  /* category → skill links */
  var LINKS = [];
  NODES.forEach(function (n) {
    if (n.type === 'skill') LINKS.push({ source: n.id, target: n.cat, color: CAT_COLOR[n.cat] });
  });
  /* cross-category links that reflect real relationships */
  LINKS.push(
    { source:'nextjs',  target:'arch',    color: CAT_COLOR['arch']    },
    { source:'mfe',     target:'build',   color: CAT_COLOR['build']   },
    { source:'graphql', target:'backend', color: CAT_COLOR['backend'] },
    { source:'d3',      target:'ai',      color: CAT_COLOR['ai']      }
  );

  /* ── Dimensions ── */
  var pad   = parseInt(getComputedStyle(skillsSection).paddingLeft, 10) || 24;
  var W     = skillsSection.offsetWidth - pad * 2;
  var H     = IS_MOBILE ? 420 : 530;
  var rScale = IS_MOBILE ? 0.75 : 1;

  /* ── Build wrapper — inserted before .skills-grid ── */
  var wrap = document.createElement('div');
  wrap.className = 'skills-d3-wrap fade-up';
  wrap.setAttribute('aria-hidden', 'true'); /* text list below is the a11y version */
  skillsGrid.parentNode.insertBefore(wrap, skillsGrid);

  /* ── SVG ── */
  var svg = d3.select(wrap)
    .append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('focusable', 'false')
    .attr('aria-hidden', 'true');

  svg.append('rect')
    .attr('width', W).attr('height', H).attr('rx', 12)
    .attr('fill', 'var(--surface)')
    .attr('stroke', 'var(--border)');

  /* "drag to explore" label */
  if (!IS_MOBILE) {
    svg.append('text')
      .attr('x', W - 10).attr('y', H - 9)
      .attr('text-anchor', 'end')
      .attr('font-family', 'var(--mono)').attr('font-size', '9px')
      .attr('letter-spacing', '.1em').attr('fill', 'var(--ink-3)')
      .attr('pointer-events', 'none')
      .text('drag nodes to explore');
  }

  /* ── Links ── */
  var linkSel = svg.append('g').selectAll('line')
    .data(LINKS).enter().append('line')
    .attr('stroke', function (d) { return d.color || 'var(--border-2)'; })
    .attr('stroke-opacity', 0.18)
    .attr('stroke-width', 1);

  /* ── Nodes ── */
  var nodeSel = svg.append('g').selectAll('.skn')
    .data(NODES).enter().append('g')
    .attr('class', function (d) { return 'skn skn-' + d.type + (d.featured ? ' skn-feat' : ''); })
    .style('cursor', IS_MOBILE ? 'default' : 'grab');

  nodeSel.append('circle')
    .attr('r', function (d) { return d.r * rScale; })
    .attr('fill', function (d) {
      return CAT_COLOR[d.type === 'cat' ? d.id : d.cat] || '#888';
    })
    .attr('fill-opacity', function (d) { return d.type === 'cat' ? 0.16 : (d.featured ? 0.12 : 0.07); })
    .attr('stroke', function (d) {
      return CAT_COLOR[d.type === 'cat' ? d.id : d.cat] || '#888';
    })
    .attr('stroke-opacity', function (d) { return d.type === 'cat' ? 0.75 : (d.featured ? 0.55 : 0.28); })
    .attr('stroke-width', function (d) { return d.type === 'cat' ? 1.5 : (d.featured ? 1.5 : 1); });

  nodeSel.append('text')
    .text(function (d) { return d.label; })
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('font-family', 'var(--mono)')
    .attr('font-size', function (d) {
      return (d.type === 'cat' ? (IS_MOBILE ? 8 : 9.5) : (IS_MOBILE ? 6.5 : 7.5)) + 'px';
    })
    .attr('fill', 'var(--ink)')
    .attr('fill-opacity', function (d) { return d.type === 'cat' ? 0.9 : (d.featured ? 0.78 : 0.58); })
    .attr('pointer-events', 'none')
    .attr('letter-spacing', '0.02em');

  /* ── Force simulation ── */
  var sim = d3.forceSimulation(NODES)
    .force('link', d3.forceLink(LINKS)
      .id(function (d) { return d.id; })
      .distance(function (d) { return d.target.type === 'cat' ? 78 : 55; })
      .strength(0.55))
    .force('charge', d3.forceManyBody().strength(function (d) {
      return d.type === 'cat' ? -310 : -120;
    }))
    .force('center', d3.forceCenter(W / 2, H / 2).strength(0.42))
    .force('collide', d3.forceCollide().radius(function (d) {
      return d.r * rScale + 5;
    }).strength(0.85));

  sim.on('tick', function () {
    linkSel
      .attr('x1', function (d) { return d.source.x; })
      .attr('y1', function (d) { return d.source.y; })
      .attr('x2', function (d) { return d.target.x; })
      .attr('y2', function (d) { return d.target.y; });

    nodeSel.attr('transform', function (d) {
      var r = d.r * rScale;
      d.x = Math.max(r + 2, Math.min(W - r - 2, d.x));
      d.y = Math.max(r + 2, Math.min(H - r - 2, d.y));
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  });

  /* Mobile / reduced-motion: settle fast then freeze */
  if (IS_MOBILE || REDUCED) {
    if (REDUCED) { sim.tick(200); sim.stop(); }
    else { setTimeout(function () { sim.alphaDecay(0.08); }, 1000); }
  }

  /* ── Drag (desktop) ── */
  if (!IS_MOBILE) {
    nodeSel.call(d3.drag()
      .on('start', function (event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', function (event, d) { d.fx = event.x; d.fy = event.y; })
      .on('end', function (event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    );

    /* Hover highlight */
    nodeSel
      .on('mouseenter', function (event, d) {
        var conn = {}; conn[d.id] = true;
        linkSel.each(function (l) {
          if (l.source.id === d.id || l.target.id === d.id) {
            conn[l.source.id] = true;
            conn[l.target.id] = true;
          }
        });
        nodeSel.select('circle')
          .attr('fill-opacity', function (nd) {
            return conn[nd.id] ? (nd.type === 'cat' ? 0.28 : (nd.featured ? 0.22 : 0.14)) : 0.03;
          })
          .attr('stroke-opacity', function (nd) {
            return conn[nd.id] ? (nd.type === 'cat' ? 1 : (nd.featured ? 0.85 : 0.55)) : 0.08;
          });
        nodeSel.select('text')
          .attr('fill-opacity', function (nd) {
            return conn[nd.id] ? (nd.type === 'cat' ? 1 : 0.9) : 0.15;
          });
        linkSel.attr('stroke-opacity', function (l) {
          return (l.source.id === d.id || l.target.id === d.id) ? 0.65 : 0.04;
        });
      })
      .on('mouseleave', function () {
        nodeSel.select('circle')
          .attr('fill-opacity', function (d) { return d.type === 'cat' ? 0.16 : (d.featured ? 0.12 : 0.07); })
          .attr('stroke-opacity', function (d) { return d.type === 'cat' ? 0.75 : (d.featured ? 0.55 : 0.28); });
        nodeSel.select('text')
          .attr('fill-opacity', function (d) { return d.type === 'cat' ? 0.9 : (d.featured ? 0.78 : 0.58); });
        linkSel.attr('stroke-opacity', 0.18);
      });
  }

  /* Keyboard: allow Tab through category nodes and Enter to highlight */
  if (!IS_MOBILE) {
    var catNodes = NODES.filter(function (n) { return n.type === 'cat'; });
    catNodes.forEach(function (d) {
      var g = nodeSel.filter(function (nd) { return nd.id === d.id; });
      g.attr('tabindex', '0')
       .attr('role', 'button')
       .attr('aria-label', function (nd) { return nd.label + ' category'; });
      g.on('focus', function (event, nd) { g.dispatch('mouseenter'); })
       .on('blur',  function ()          { nodeSel.dispatch('mouseleave'); })
       .on('keydown', function (event, nd) {
         if (event.key === 'Enter' || event.key === ' ') {
           event.preventDefault();
           g.dispatch('mouseenter');
         }
       });
    });
  }

  /* Fade in */
  wrap.style.opacity = '0';
  wrap.style.transition = 'opacity .7s ease';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { wrap.style.opacity = '1'; });
  });

}());
