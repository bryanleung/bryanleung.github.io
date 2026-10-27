/* Flow grid background. A grid of short lines that turn with a slow, wavy
   current and swing away from the pointer. Drawn on a canvas.

   Colors and opacity are set in site.css (.flow). Size and pointer effect are
   set on the element:

     data-spacing      px between lines (35)
     data-length       line length in px (14)
     data-near-length  line length next to the pointer (22)
     data-width        stroke width in px (1.2)
     data-speed        how fast the current moves, 0 holds still (1)
     data-radius       how far the pointer reaches in px, 0 turns it off (220)
     data-strength     how far lines turn from the pointer, 0 to 1 (1)
     data-until        the grid runs from the top of the page to the bottom of
                       this element (".intro") */

(function () {
  var host = document.querySelector('.flow');
  if (!host) return;
  var until = document.querySelector(host.dataset.until || '.intro');

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  host.appendChild(canvas);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  var mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
  var width = 0;
  var height = 0;
  var time = 0;
  var frame = 0;
  var visible = true;
  var s = {};

  function num(key, fallback) {
    var v = parseFloat(host.dataset[key]);
    return isNaN(v) ? fallback : v;
  }

  // Read settings once, and again when the theme or the element's settings change.
  function readSettings() {
    var cs = getComputedStyle(host);
    var css = function (name, fallback) { return cs.getPropertyValue(name).trim() || fallback; };
    s = {
      line: css('--flow-line', 'rgb(28, 62, 87)'),
      near: css('--flow-near', 'rgb(73, 94, 212)'),
      alpha: parseFloat(css('--flow-alpha', '0.12')),
      vary: parseFloat(css('--flow-alpha-vary', '0.06')),
      nearAlpha: parseFloat(css('--flow-near-alpha', '0.5')),
      spacing: Math.max(8, num('spacing', 35)),
      length: num('length', 14),
      nearLength: num('nearLength', 22),
      width: num('width', 1.2),
      speed: num('speed', 1),
      radius: num('radius', 220),
      strength: Math.min(1, Math.max(0, num('strength', 1)))
    };
  }

  // Stretch the grid down to the bottom of the hero, then size the canvas to match.
  function fit() {
    if (until) host.style.height = Math.ceil(until.getBoundingClientRect().bottom + window.scrollY) + 'px';
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = host.clientWidth;
    height = host.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';

    var cols = Math.ceil(width / s.spacing) + 1;
    var rows = Math.ceil(height / s.spacing) + 1;

    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = i * s.spacing;
        var y = j * s.spacing;

        // The current: a smooth angle field that shifts over time.
        var angle = Math.sin(x * 0.003 + time) + Math.cos(y * 0.003 + time);

        // Lines near the pointer swing away from it and grow brighter.
        var force = 0;
        if (s.radius > 0) {
          var dx = mouse.x - x;
          var dy = mouse.y - y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < s.radius) {
            force = (1 - dist / s.radius) * s.strength;
            angle = angle * (1 - force) + (Math.atan2(dy, dx) + Math.PI) * force;
          }
        }

        var len = s.length + (s.nearLength - s.length) * force;
        var base = s.alpha + Math.sin(x * 0.01 + y * 0.01 + time) * s.vary;

        ctx.globalAlpha = Math.max(0, base + (s.nearAlpha - base) * force);
        ctx.strokeStyle = force > 0 ? s.near : s.line;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick() {
    frame = 0;
    time += 0.008 * s.speed;
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    draw();
    frame = requestAnimationFrame(tick);
  }

  // Animate while the hero is on screen, unless the visitor has asked for
  // reduced motion; then draw one still frame.
  function start() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (reduced.matches) draw();
    else if (visible) tick();
  }

  readSettings();
  fit();
  resize();
  start();

  if (until) new ResizeObserver(fit).observe(until);
  new ResizeObserver(function () {
    resize();
    draw();
  }).observe(host);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    start();
  }).observe(host);

  window.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    mouse.targetX = e.clientX - r.left;
    mouse.targetY = e.clientY - r.top;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () {
    mouse.targetX = -1000;
    mouse.targetY = -1000;
  });
  reduced.addEventListener('change', start);

  function refresh() {
    readSettings();
    if (reduced.matches) draw();
  }
  dark.addEventListener('change', refresh);
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(refresh).observe(host, { attributes: true });
})();
