/* Visual enhancements: capability-gated, progressive, and safe by default */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isFinePointer = window.matchMedia('(pointer: fine)').matches;
    var prefersSaveData = !!(navigator.connection && navigator.connection.saveData);
    var cores = navigator.hardwareConcurrency || 2;
    var deviceMemory = navigator.deviceMemory || 4;
    var isLowEnd = prefersSaveData || cores <= 2 || deviceMemory <= 2;

    var heroAmbient = document.getElementById('hero-ambient');
    var projectChart = document.getElementById('projects-impact-chart');
    var chartFallback = document.getElementById('projects-impact-fallback');

    function initAmbientOrbs() {
      if (!heroAmbient || reducedMotion) return;
      var orbA = heroAmbient.querySelector('.viz-orb-a');
      var orbB = heroAmbient.querySelector('.viz-orb-b');
      if (!orbA || !orbB) return;

      var t = 0;
      function tick() {
        t += 0.012;
        orbA.style.transform = 'translate(' + (Math.sin(t) * 6).toFixed(2) + 'px,' + (Math.cos(t * 0.7) * 4).toFixed(2) + 'px)';
        orbB.style.transform = 'translate(' + (Math.cos(t * 0.85) * 5).toFixed(2) + 'px,' + (Math.sin(t * 0.65) * 3).toFixed(2) + 'px)';
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function initTimelineDash() {
      var spark = document.getElementById('experience-sparkline');
      if (!spark || reducedMotion) return;
      var line = spark.querySelector('polyline');
      if (!line) return;
      line.style.strokeDasharray = '120';
      line.style.strokeDashoffset = '120';
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          line.style.transition = 'stroke-dashoffset 850ms ease-out';
          line.style.strokeDashoffset = '0';
          io.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(spark);
    }

    function initSkillConstellation() {
      var constellation = document.getElementById('skills-constellation');
      if (!constellation || reducedMotion) return;
      var nodes = constellation.querySelectorAll('circle');
      if (!nodes.length) return;
      var i = 0;
      function pulse() {
        nodes.forEach(function (node, idx) {
          node.style.opacity = idx === i ? '1' : '.65';
        });
        i = (i + 1) % nodes.length;
      }
      pulse();
      window.setInterval(pulse, 980);
    }

    function maybeInitD3Chart() {
      if (!projectChart) return;
      if (reducedMotion || isLowEnd) return;
      if (chartFallback) chartFallback.hidden = true;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          import('/assets/visuals.d3.js')
            .then(function (mod) {
              if (mod && typeof mod.renderImpactChart === 'function') {
                mod.renderImpactChart(projectChart);
              }
            })
            .catch(function () {
              if (chartFallback) chartFallback.hidden = false;
            });
        });
      }, { threshold: 0.35 });
      io.observe(projectChart);
    }

    if (isFinePointer && !isLowEnd) initAmbientOrbs();
    initTimelineDash();
    initSkillConstellation();
    maybeInitD3Chart();
  });
})();
