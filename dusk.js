// Dusk preview helpers for the case study pages.
(function () {
  var head = document.querySelector('.case-head');
  if (!head) return;
  var root = document.documentElement;
  var still = false;
  try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Layered skyline with parallax: each layer drifts down slower than the page scrolls,
  // far layers lag most. Same speeds as the homepage (screen px per px scrolled).
  var SPEED = { 'sky-far': 0.45, 'sky-mid': 0.34, 'sky-near': 0.24, 'sky-refl': 0.18, 'sky-bridge': 0.1 };
  var layers = [];
  var cssParallax = false;   // dusk.css moves the layers itself where scroll-driven animations exist
  try { cssParallax = CSS.supports('animation-timeline: scroll()'); } catch (e) {}
  fetch('img/dusk/skyline-layers.svg').then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (svg) {
    var box = document.createElement('div');
    box.className = 'dusk-skyline';
    box.setAttribute('aria-hidden', 'true');
    // Split the art into one SVG per layer that all share the art definitions, so each layer is
    // moved with a CSS transform (a GPU slide) instead of repainting the whole skyline every frame.
    var tmp = document.createElement('div'); tmp.innerHTML = svg;   // HTML parsing puts the art in the SVG namespace
    var src = tmp.querySelector('svg');
    var NS = 'http://www.w3.org/2000/svg';
    var defs = document.createElementNS(NS, 'svg');
    defs.setAttribute('class', 'sky-defs'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true');
    var d = src.querySelector('defs'); if (d) defs.appendChild(d);
    box.appendChild(defs);
    Object.keys(SPEED).forEach(function (k) {
      var g = src.querySelector('g.' + k); if (!g) return;
      var layer = document.createElementNS(NS, 'svg');
      layer.setAttribute('class', 'sky-layer ' + k + '-layer');
      layer.setAttribute('viewBox', src.getAttribute('viewBox'));
      layer.setAttribute('preserveAspectRatio', src.getAttribute('preserveAspectRatio') || 'xMidYMax meet');
      var gg = g; gg.removeAttribute('transform');
      layer.appendChild(gg); box.appendChild(layer);
      layers.push([layer, SPEED[k]]);
    });
    head.appendChild(box);
    // City life on the skyline; each life layer rides with its art layer.
    SkyCycle.ambient(box, SkyCycle.tweaks());
    [].slice.call(box.querySelectorAll('svg.amb')).forEach(function (el) {
      var k = Object.keys(SPEED).filter(function (n) { return el.classList.contains(n + '-layer'); })[0];
      if (k) layers.push([el, SPEED[k]]);
    });
    SkyCycle.twinkle(cel.querySelector('.stars'), SkyCycle.tweaks().twinkle > 0);
    SkyCycle.tweakPanel(function (cfg) {
      SkyCycle.ambient(box, cfg);
      layers = layers.filter(function (l) { return !l[0].classList.contains('amb'); });
      [].slice.call(box.querySelectorAll('svg.amb')).forEach(function (el) {
        var k = Object.keys(SPEED).filter(function (n) { return el.classList.contains(n + '-layer'); })[0];
        if (k) layers.push([el, SPEED[k]]);
      });
      SkyCycle.twinkle(cel.querySelector('.stars'), cfg.twinkle > 0);
      queue();
    });
    var fade = document.createElement('div');   // static fade over the moving layers
    fade.className = 'dusk-fade'; fade.setAttribute('aria-hidden', 'true');
    head.appendChild(fade);
    root.classList.add('sky-live');
    if (sky) sky.apply();
    queue();
  }).catch(function () {});

  // Sun, moon and stars in the header sky, behind the skyline.
  var cel = document.createElement('div');
  cel.className = 'dusk-celestial';
  cel.setAttribute('aria-hidden', 'true');
  cel.innerHTML = '<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">' +
    '<defs><radialGradient id="sunGlow"><stop offset="0" stop-color="#FFF6E0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6E0" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="moonGlow"><stop offset="0" stop-color="#DCD8FF" stop-opacity=".55"/><stop offset="1" stop-color="#DCD8FF" stop-opacity="0"/></radialGradient></defs>' +
    '<g class="stars" style="opacity:0"><circle cx="1063" cy="326" r="1.8" fill="#FFFFFF" opacity="0.70"/><circle cx="1120" cy="340" r="1.2" fill="#FFFFFF" opacity="0.50"/><circle cx="1124" cy="283" r="1.2" fill="#FFFFFF" opacity="0.50"/><circle cx="1057" cy="195" r="1.2" fill="#FFFFFF" opacity="0.50"/><circle cx="1151" cy="395" r="1.0" fill="#FFFFFF" opacity="0.90"/><circle cx="1005" cy="271" r="1.2" fill="#FFFFFF" opacity="0.90"/><circle cx="615" cy="310" r="1.0" fill="#FFFFFF" opacity="0.50"/><circle cx="636" cy="137" r="1.2" fill="#FFFFFF" opacity="0.90"/><circle cx="630" cy="438" r="1.8" fill="#FFFFFF" opacity="0.70"/><circle cx="1051" cy="342" r="1.2" fill="#FFFFFF" opacity="0.90"/><circle cx="839" cy="367" r="1.5" fill="#FFFFFF" opacity="0.70"/><circle cx="604" cy="379" r="1.0" fill="#FFFFFF" opacity="0.70"/><circle cx="1270" cy="182" r="1.8" fill="#FFFFFF" opacity="0.90"/><circle cx="685" cy="402" r="1.5" fill="#FFFFFF" opacity="0.70"/><circle cx="1376" cy="157" r="1.5" fill="#FFFFFF" opacity="0.50"/><circle cx="671" cy="328" r="1.0" fill="#FFFFFF" opacity="0.70"/><circle cx="710" cy="188" r="1.8" fill="#FFFFFF" opacity="0.50"/><circle cx="617" cy="390" r="1.0" fill="#FFFFFF" opacity="0.50"/><circle cx="814" cy="66" r="1.8" fill="#FFFFFF" opacity="0.70"/><circle cx="1325" cy="243" r="1.8" fill="#FFFFFF" opacity="0.50"/><circle cx="1179" cy="362" r="1.2" fill="#FFFFFF" opacity="0.90"/><circle cx="876" cy="212" r="1.0" fill="#FFFFFF" opacity="0.70"/><circle cx="940" cy="47" r="1.8" fill="#FFFFFF" opacity="0.50"/><circle cx="737" cy="166" r="1.0" fill="#FFFFFF" opacity="0.50"/></g>' +
    '<circle class="sun-glow" r="170" fill="url(#sunGlow)"/><circle class="sun" r="60"/>' +
    '<circle class="moon-glow" r="120" fill="url(#moonGlow)"/><circle class="moon" r="42" fill="#F4F1FF"/></svg>';
  head.insertBefore(cel, head.firstChild);

  // Footer skyline (San Francisco silhouette), coloured by the theme tokens --f1 … --f5.
  var foot = document.querySelector('footer');
  if (foot) fetch('img/dusk/footer-skyline.svg').then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (svg) {
    var w = document.createElement('div');
    w.innerHTML = svg;
    var el = w.querySelector('svg');
    el.setAttribute('class', 'foot-sky'); el.setAttribute('aria-hidden', 'true');
    foot.insertBefore(el, foot.firstChild);
  }).catch(function () {});

  // Day/night: animate morning → noon → dusk → midnight (and back) whenever the theme flips.
  var sky = (typeof SkyCycle === 'function') ? SkyCycle({
    el: function () { return root; },
    tokens: SKY_TOKENS, gradients: [SKY_GRADIENT], skyline: SKY_SKYLINE, duration: 3600,
    celestial: function () {
      return { sun: cel.querySelector('.sun'), sunGlow: cel.querySelector('.sun-glow'), moon: cel.querySelector('.moon'), moonGlow: cel.querySelector('.moon-glow'), stars: cel.querySelector('.stars') };
    },
    // Arcs in the 1440×900 header sky; they rise and set behind the skyline on the right.
    geom: { sun: { cx: 1000, cy: 700, rx: 330, ry: 560, angles: [20, 195], rise: -15 },
            moon: { cx: 760, cy: 720, rx: 740.1, ry: 672.6, keys: [[0.35, 0], [0.5, 43.1], [0.72, 56.4], [0.9, 180]] } }
  }) : null;
  // Time of day: the visitor's saved pick, or else the device setting (light: morning, dark: dusk).
  // data-theme follows it (morning and noon are light, dusk and midnight dark) for the static styles.
  var time = SkyCycle.preferred(), pickers = [];
  var toTime = function (n, animate) {
    time = n;
    root.setAttribute('data-theme', SkyCycle.isNight(n) ? 'dark' : 'light');
    if (sky) { if (animate) sky.go(n); else sky.set(n); }
    pickers.forEach(function (p) { p.show(n); });
  };
  toTime(time, false);
  // One picker in the masthead (phones and tablets) and one pinned top right with the contents rail.
  [document.querySelector('.masthead nav'), document.querySelector('.toc-rail')].forEach(function (where) {
    if (!where) return;
    var host = document.createElement('div');
    var theme = where.querySelector('.theme');
    if (theme) theme.insertAdjacentElement('afterend', host); else where.appendChild(host);
    pickers.push(SkyCycle.picker(host, time, function (n) { SkyCycle.remember(n); toTime(n, true); }));
  });
  // Until the visitor picks, follow the device.
  SkyCycle.watchDevice(function (n) { toTime(n, true); });

  // While the light part of the sky is behind the contents rail and the day/night pill,
  // mark the page .over-sky so they use dark ink; below that the night body is dark.
  var raf = 0;
  function update() {
    raf = 0;
    var r = head.getBoundingClientRect();
    root.classList.toggle('over-sky', r.top + r.height * 0.5 > 260);
    if (still || cssParallax || !layers.length) return;
    var y = Math.min(window.scrollY || 0, 1400);
    // The art is 3000 units wide and drawn at least 1440px wide: convert screen px to its units.
    for (var i = 0; i < layers.length; i++) {
      layers[i][0].style.transform = 'translateX(-50%) translate3d(0, ' + (y * layers[i][1]).toFixed(1) + 'px, 0)';
    }
  }
  function queue() { if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
