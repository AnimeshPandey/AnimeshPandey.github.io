/* visuals.three.js — Three.js desktop easter egg constellation
   Lazy-loaded only when user presses ? or clicks [ press ? ].
   Exposes window.__launchThreeEgg(onCloseCb).
   Auto-closes in 12s or on Escape / click-outside / close button. */
(function () {
  'use strict';
  if (!window.THREE) return;

  window.__threeEggReady = true;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Technology nodes — positions assigned by force-spring during init */
  var TECH = [
    { label:'React',           color:0xbf5a32 },
    { label:'TypeScript',      color:0x4e8fa4 },
    { label:'Next.js',         color:0x4e7a68 },
    { label:'Microfrontends',  color:0x9060a8 },
    { label:'Node.js',         color:0x6db899 },
    { label:'D3.js',           color:0x7072ba },
    { label:'GraphQL',         color:0xe535ab },
    { label:'Webpack',         color:0x8a6952 },
    { label:'Vite',            color:0xad9e1d },
    { label:'AWS',             color:0xd68910 },
    { label:'Docker',          color:0x2496ed },
    { label:'Playwright',      color:0x45ba4b },
    { label:'Tailwind',        color:0x38bdf8 },
    { label:'Agentic AI',      color:0x9060a8 },
    { label:'OpenAI API',      color:0x10a37f },
    { label:'SSR',             color:0x4e8fa4 },
    { label:'Design Systems',  color:0xbf5a32 },
    { label:'Module Fed.',     color:0x8a6952 },
    { label:'Highcharts',      color:0x7072ba },
    { label:'Azure',           color:0x0089d6 },
    { label:'LangChain',       color:0x1c3a5e },
    { label:'Redux',           color:0x764abc },
    { label:'WCAG 2.1',        color:0x4e7a68 },
    { label:'GitHub Actions',  color:0x2dba4e }
  ];

  window.__launchThreeEgg = function (onClose) {
    /* ── Overlay shell ── */
    var overlay = document.createElement('div');
    overlay.id = 'egg-three-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Tech stack constellation — press Escape or click to close');
    overlay.innerHTML =
      '<div class="egg-three-inner">' +
        '<canvas id="egg-three-canvas" aria-hidden="true" focusable="false"></canvas>' +
        '<div class="egg-three-labels" aria-hidden="true" id="egg-three-labels"></div>' +
        '<div class="egg-three-ui">' +
          '<p class="egg-three-title">// tech stack · constellation</p>' +
          '<button class="egg-three-close" id="egg-three-close" aria-label="Close constellation">✕ close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    /* Trap scroll */
    document.body.style.overflow = 'hidden';

    /* Fade in */
    requestAnimationFrame(function () { overlay.classList.add('open'); });

    /* ── Three.js setup ── */
    var canvas = document.getElementById('egg-three-canvas');
    var labelsDiv = document.getElementById('egg-three-labels');
    var W = window.innerWidth, H = window.innerHeight;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 420;

    /* ── Place nodes on a sphere surface ── */
    var R_SPHERE = 160;
    var positions = [];
    var N = TECH.length;
    /* Fibonacci sphere for even distribution */
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var radius = Math.sqrt(1 - y * y);
      var theta = goldenAngle * i;
      positions.push(new THREE.Vector3(
        radius * Math.cos(theta) * R_SPHERE,
        y * R_SPHERE,
        radius * Math.sin(theta) * R_SPHERE
      ));
    }

    /* ── Node spheres ── */
    var spheres = [];
    var labelEls = [];
    for (var j = 0; j < N; j++) {
      var geo = new THREE.SphereGeometry(5 + Math.random() * 3, 12, 8);
      var mat = new THREE.MeshBasicMaterial({
        color: TECH[j].color,
        transparent: true,
        opacity: 0.85
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(positions[j]);
      scene.add(mesh);
      spheres.push(mesh);

      /* HTML label overlay */
      var lbl = document.createElement('span');
      lbl.className = 'egg-three-lbl';
      lbl.textContent = TECH[j].label;
      lbl.style.color = '#' + TECH[j].color.toString(16).padStart(6, '0');
      labelsDiv.appendChild(lbl);
      labelEls.push(lbl);
    }

    /* ── Connection lines between nearby nodes ── */
    var linePositions = [];
    var CONNECT_DIST = 120;
    for (var a = 0; a < N; a++) {
      for (var b = a + 1; b < N; b++) {
        if (positions[a].distanceTo(positions[b]) < CONNECT_DIST) {
          linePositions.push(positions[a].x, positions[a].y, positions[a].z);
          linePositions.push(positions[b].x, positions[b].y, positions[b].z);
        }
      }
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0xfaf8f4, transparent: true, opacity: 0.06 });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    /* ── Camera mouse tilt ── */
    var camTargetX = 0, camTargetY = 0, camCurX = 0, camCurY = 0;
    overlay.addEventListener('mousemove', function (e) {
      camTargetX = (e.clientX / W - 0.5) * 60;
      camTargetY = -(e.clientY / H - 0.5) * 40;
    });

    /* ── Orbit group (whole scene rotates) ── */
    var group = new THREE.Group();
    spheres.forEach(function (s) { group.add(s); });
    /* move lines to group */
    scene.remove(scene.children[scene.children.length - 1]);
    var linesSegments = new THREE.LineSegments(lineGeo, lineMat);
    group.add(linesSegments);
    scene.add(group);

    /* ── Animation ── */
    var raf;
    var startTime = Date.now();
    var projVec = new THREE.Vector3();

    function animate() {
      raf = requestAnimationFrame(animate);
      var t = (Date.now() - startTime) * 0.001;

      if (!REDUCED) {
        group.rotation.y = t * 0.12;
        group.rotation.x = Math.sin(t * 0.07) * 0.08;
        /* Camera tilt toward mouse */
        camCurX += (camTargetX - camCurX) * 0.04;
        camCurY += (camTargetY - camCurY) * 0.04;
        camera.position.x = camCurX;
        camera.position.y = camCurY;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);

      /* Project 3D → 2D for HTML labels */
      for (var k = 0; k < N; k++) {
        projVec.copy(spheres[k].position);
        group.localToWorld(projVec);
        projVec.project(camera);

        /* Only show labels on the front hemisphere */
        var visible = spheres[k].position.z > -60 || !REDUCED;
        var sx = (projVec.x *  0.5 + 0.5) * W;
        var sy = (projVec.y * -0.5 + 0.5) * H;
        labelEls[k].style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
        labelEls[k].style.opacity   = visible ? (REDUCED ? 0.7 : Math.max(0, (spheres[k].position.z + 60) / 120 * 0.8)) : '0';
      }
    }
    animate();

    /* ── Close logic ── */
    var autoTimer = setTimeout(doClose, 12000);

    function doClose() {
      clearTimeout(autoTimer);
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      overlay.classList.remove('open');
      /* cleanup after transition */
      setTimeout(function () {
        renderer.dispose();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 400);
      if (typeof onClose === 'function') onClose();
    }

    document.getElementById('egg-three-close').addEventListener('click', doClose);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('egg-three-inner')) doClose();
    });
    var escHandler = function (e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); doClose(); }
    };
    document.addEventListener('keydown', escHandler);
    /* Move focus to close button */
    document.getElementById('egg-three-close').focus();
  };

}());
