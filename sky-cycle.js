// Sky cycle: one forward loop through the day.
//   Day → night:  morning → noon → dusk            (the sun crosses and sets, the moon rises)
//   Night → day:  dusk → midnight → morning        (the moon crosses and sets, the sun rises)
// The loop is a phase p from 0 to 1: morning at 0, dusk (night mode) at 0.5, back to morning at 1,
// which is the same as 0. Colours have four palettes (morning, noon, dusk, midnight); KEY says
// where on the loop each one is reached, and between them colours blend in straight lines, so
// nothing pauses. The sun and moon each move at a steady angle along their arcs. The only easing
// is a gentle start and finish to each run.
// The page rests at one of four times of day: morning, noon, dusk or midnight (SkyCycle.TIMES).
// Choosing another plays the sky forward around the loop to it.
function SkyCycle(o) {
  var MORNING = 0, NOON = 1, DUSK = 2, MIDNIGHT = 3;
  var KEY = o.key || [[0, MORNING], [0.21, NOON], [0.425, DUSK], [0.5, DUSK], [0.72, MIDNIGHT], [0.95, MORNING], [1, MORNING]];
  var ph = 0, anim = 0;   // ph can run past 1 mid-animation; apply wraps it

  function parse(c) {
    if (typeof c === 'number') return [c];
    if (c.charAt(0) === '#') return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16), 1];
    var m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]];
  }
  function fmt(v) {
    if (v.length === 1) return String(Math.round(v[0] * 1000) / 1000);
    var r = Math.round(v[0]), g = Math.round(v[1]), b = Math.round(v[2]);
    return v[3] >= 0.999 ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + (Math.round(v[3] * 1000) / 1000) + ')';
  }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function span(x, a, b) { return clamp01((x - a) / (b - a)); } // 0 → 1 as x runs from a to b
  function mixN(a, b, u) { return a + (b - a) * u; }
  function prep(list) { return list.map(parse); }
  // Colour at phase x: find the KEY pair around x and blend that pair's palettes in a straight line.
  function blend(pal, x) {
    for (var i = 0; i < KEY.length - 2; i++) if (x <= KEY[i + 1][0]) break;
    var u = span(x, KEY[i][0], KEY[i + 1][0]), a = pal[KEY[i][1]], b = pal[KEY[i + 1][1]], out = [];
    for (var k = 0; k < a.length; k++) out.push(mixN(a[k], b[k], u));
    return out;
  }

  var tokens = {}; Object.keys(o.tokens || {}).forEach(function (k) { tokens[k] = prep(o.tokens[k]); });
  var grads = (o.gradients || []).map(function (g) { return { name: g.name, at: g.at, stops: g.stops.map(prep) }; });
  var sky = {}; Object.keys(o.skyline || {}).forEach(function (id) {
    var row = o.skyline[id], per = [];
    for (var s = 0; s < 5; s++) per.push([parse(row[s]), parse(row[5 + s]), parse(row[10 + s]), parse(row[15 + s])]);
    sky[id] = per;
  });
  var sunFill = prep(['#FFF3DA', '#FFFDF0', '#FFE7CF', '#FFE7CF']);
  // City life: how strong each effect is at morning, noon, dusk and midnight (see SkyCycle.ambient).
  var AMB = {
    'amb-fog': [0.75, 0.08, 0.3, 0.2], 'amb-day': [1, 0.2, 0, 0], 'amb-people': [1, 1, 0.85, 0.45], 'amb-win': [0, 0, 0.6, 0.95], 'amb-beacon': [0, 0, 0.9, 1], 'amb-light': [0, 0, 0.75, 1],
    'amb-fog-color': ['#FFFFFF', '#FFFFFF', '#F6D3CB', '#8E8CC8'], 'amb-person-color': ['#2B2C5E', '#2C4C6E', '#3A2238', '#2A2752']
  };
  var amb = {}; Object.keys(AMB).forEach(function (k) { amb[k] = prep(AMB[k]); });

  function smoothKeys(k, x) {
    if (x <= k[0][0]) return k[0][1];
    if (x >= k[k.length - 1][0]) return k[k.length - 1][1];
    var n = k.length, d = [], m = [], i;
    for (i = 0; i < n - 1; i++) d.push((k[i + 1][1] - k[i][1]) / (k[i + 1][0] - k[i][0]));
    m.push(d[0]); for (i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
    for (i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } var a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b; if (h > 9) { var t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
    for (i = 0; i < n - 2 && x > k[i + 1][0]; i++);
    var x0 = k[i][0], x1 = k[i + 1][0], hh = x1 - x0, u = (x - x0) / hh, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * k[i][1] + (u3 - 2 * u2 + u) * hh * m[i] + (-2 * u3 + 3 * u2) * k[i + 1][1] + (u3 - u2) * hh * m[i + 1];
  }
  function ellipse(e, deg) { var r = deg * Math.PI / 180; return [e.cx + e.rx * Math.cos(r), e.cy - e.ry * Math.sin(r)]; }
  function place(el, pt, op) { if (!el) return; el.setAttribute('cx', pt[0].toFixed(1)); el.setAttribute('cy', pt[1].toFixed(1)); el.style.opacity = op; }

  function apply() {
    var el = o.el(); if (!el) return;
    var p = ph % 1;
    Object.keys(tokens).forEach(function (k) { el.style.setProperty('--' + k, fmt(blend(tokens[k], p))); });
    Object.keys(amb).forEach(function (k) { el.style.setProperty('--' + k, fmt(blend(amb[k], p))); });
    grads.forEach(function (g) {
      el.style.setProperty('--' + g.name, 'linear-gradient(180deg,' + g.stops.map(function (s, i) { return fmt(blend(s, p)) + ' ' + g.at[i]; }).join(',') + ')');
    });
    var doc = o.doc || document;
    Object.keys(sky).forEach(function (id) {
      var gEl = doc.getElementById(id); if (!gEl) return;
      var st = gEl.getElementsByTagName('stop');
      for (var s = 0; s < st.length && s < 5; s++) st[s].style.stopColor = fmt(blend(sky[id][s], p));
    });
    var c = o.celestial && o.celestial(); if (!c) return;

    // Sun: across the sky from morning (low right) until it sets behind the skyline at 0.46,
    // then up again from behind the skyline on the right for the next morning (0.9 → 1).
    var su = o.geom.sun, sa = su.angles, sunAng, sunO;
    if (p <= 0.5) { sunAng = mixN(sa[0], sa[1], p / 0.46); sunO = 1 - span(p, 0.42, 0.46); }
    else { sunAng = mixN(su.rise, sa[0], span(p, 0.9, 1)); sunO = span(p, 0.9, 0.94); }
    var sp = ellipse(su, sunAng);
    place(c.sun, sp, sunO); if (c.sun) c.sun.style.fill = fmt(blend(sunFill, p));
    place(c.sunGlow, sp, sunO * 0.65);

    // Moon: rises on the right as the sun sets (0.35 → 0.5, its night-mode spot), then carries on
    // over the top and sets behind the skyline on the left through midnight (0.5 → 0.9).
    var mo = o.geom.moon, moonO = p <= 0.5 ? span(p, 0.35, 0.4) : 1 - span(p, 0.86, 0.9), mp;
    if (mo.keys) {
      // An elliptical arc like the sun's. The angle passes through set [phase, degrees] keys (resting clear
      // of the page text at dusk and midnight) along a smooth monotone curve, so the moon never stops or jerks.
      mp = ellipse(mo, smoothKeys(mo.keys, p));
    } else {
      var ma = mo.angles;
      mp = ellipse(mo, p <= 0.5 ? mixN(ma[0], ma[1], span(p, 0.35, 0.5)) : mixN(ma[1], mo.set, span(p, 0.5, 0.9)));
    }
    // Softer at dusk while the sky is still light, full brightness by midnight.
    var moonDim = p <= 0.5 ? 0.55 : mixN(0.55, 1, span(p, 0.5, 0.68));
    place(c.moon, mp, moonO * moonDim); place(c.moonGlow, mp, moonO * moonDim * 0.6);

    // Stars: faint at dusk, brightest around midnight, gone by morning.
    if (c.stars) c.stars.style.opacity = p <= 0.5 ? 0.45 * span(p, 0.4, 0.5) : mixN(0.45, 1, span(p, 0.5, 0.7)) * (1 - span(p, 0.78, 0.92));
  }

  function still() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  return {
    get t() { return ph % 1; },
    apply: apply,
    // Jump straight to a time of day ('morning', 'noon', 'dusk', 'midnight').
    set: function (name) { if (anim) cancelAnimationFrame(anim); anim = 0; ph = SkyCycle.TIMES[name] || 0; apply(); },
    // Animate to a time of day, always forward around the loop (dusk to morning runs through midnight).
    go: function (name, done) {
      if (anim) cancelAnimationFrame(anim);
      var from = ph % 1, dest = SkyCycle.TIMES[name] || 0;
      if (dest < from - 0.001) dest += 1;
      var finish = function () { ph = dest % 1; anim = 0; apply(); if (done) done(); };
      if (still() || dest - from < 0.001) { finish(); return; }
      var dur = Math.max(900, Math.min(5000, (o.duration || 3600) * (dest - from) / 0.5)), t0 = 0;
      function step(now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0) / dur);
        ph = from + (dest - from) * (0.5 - Math.cos(Math.PI * k) / 2); apply();
        if (k < 1) anim = requestAnimationFrame(step); else finish();
      }
      anim = requestAnimationFrame(step);
    }
  };
}

// Where each time of day sits on the loop.
SkyCycle.TIMES = { morning: 0, noon: 0.21, dusk: 0.5, midnight: 0.72 };
SkyCycle.ORDER = ['morning', 'noon', 'dusk', 'midnight'];
SkyCycle.isNight = function (name) { return name === 'dusk' || name === 'midnight'; };

// The visitor's time of day: their saved pick, or else the device setting (light: morning, dark: dusk).
SkyCycle.saved = function () {
  try { var v = localStorage.getItem('sky'); if (SkyCycle.TIMES.hasOwnProperty(v)) return SkyCycle.isNight(v) ? 'dusk' : 'morning'; } catch (e) {}
  return null;
};
SkyCycle.preferred = function () {
  var v = SkyCycle.saved(); if (v) return v;
  try { if (matchMedia('(prefers-color-scheme: dark)').matches) return 'dusk'; } catch (e) {}
  return 'morning';
};
SkyCycle.remember = function (name) {
  try { localStorage.setItem('sky', name); localStorage.setItem('theme', SkyCycle.isNight(name) ? 'dark' : 'light'); } catch (e) {}
};
// Call fn(name) when the device switches light/dark while the visitor hasn't picked a time.
SkyCycle.watchDevice = function (fn) {
  try {
    var mq = matchMedia('(prefers-color-scheme: dark)'), last = SkyCycle.preferred();
    var check = function () { if (SkyCycle.saved()) return; var v = mq.matches ? 'dusk' : 'morning'; if (v !== last) { last = v; fn(v); } };
    if (mq.addEventListener) mq.addEventListener('change', check); else mq.addListener(check);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  } catch (e) {}
};

// Day/night toggle: one round button showing the current mode (sun for day, moon for night).
// Day rests at morning and night at dusk. Clicking it switches and calls onPick(name).
SkyCycle.picker = function (host, current, onPick) {
  var ICON = {
    morning: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    dusk: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>'
  };
  var svg = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; };
  if (!document.getElementById('sky-pick-css')) {
    var css = document.createElement('style'); css.id = 'sky-pick-css';
    css.textContent =
      '.sky-pick{position:relative;flex:none}' +
      '.sky-pick-btn{display:grid;place-items:center;width:44px;height:44px;padding:0;border-radius:50%;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;transition:background-color .2s}' +
      '.sky-pick-btn:hover{background:color-mix(in srgb,currentColor 12%,transparent)}' +
      '.sky-pick svg{width:20px;height:20px;display:block}' +
      '.sky-pick-btn:focus-visible{outline:2px solid currentColor;outline-offset:3px}' +
      '@media (prefers-reduced-motion: reduce){.sky-pick-btn{transition:none}}';
    document.head.appendChild(css);
  }
  host.classList.add('sky-pick');
  host.innerHTML = '<button type="button" class="sky-pick-btn"></button>';
  var btn = host.querySelector('.sky-pick-btn');
  function show(name) {
    current = SkyCycle.isNight(name) ? 'dusk' : 'morning';
    var night = current === 'dusk';
    btn.innerHTML = svg(current);
    btn.setAttribute('aria-label', night ? 'Night mode. Switch to day' : 'Day mode. Switch to night');
    btn.title = night ? 'Switch to day' : 'Switch to night';
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); var n = current === 'dusk' ? 'morning' : 'dusk'; show(n); onPick(n); });
  show(current);
  return { show: show };
};

// ---------- City life ----------
// Small, slow touches on the skyline, each in its own light SVG that rides with its art layer's parallax:
// fog over the city, the water and the bridge (strongest in the morning), the first lit windows,
// tower lights and headlights crossing the bridge at dusk, and lit windows, tower lights and twinkling stars at midnight. Strength per time of day comes from the
// --amb-* variables SkyCycle sets; counts and multipliers come from the settings below.
SkyCycle.AMB_DEFAULTS = { windows: 36, headlights: 3, fog: 1, bridgeFog: 1, people: 9, beacons: 1, twinkle: 1, speed: 1 };
// Positions in the skyline art (3000 x 1070 units, y from 330): the bridge deck, tower and building tops,
// and points inside the middle and front buildings for lit windows.
SkyCycle.AMB_GEOM = {"deck":[[120,1166],[560,1184],[960,1207],[1220,1224],[1600,1252],[2000,1287],[2400,1326],[2800,1371],[2980,1393]],"beacons":{"bridge":[[1090,336]],"far":[[2270,505]],"mid":[[2690,494]]},"win":{"near":[[1673,839],[1481,916],[971,996],[1012,971],[2627,951],[2972,968],[2973,905],[2085,995],[1716,805],[1527,837],[1975,955],[1407,905],[1122,956],[2549,942],[2760,965],[1519,888],[2512,981],[2097,956],[1187,989],[2821,930],[1555,917],[2015,914],[1662,794],[1681,921],[1852,992],[1909,986],[2563,879],[1689,977],[1622,991],[2585,835],[1424,992],[2021,964],[2879,913],[1516,769],[2669,990],[1369,931],[2525,822],[2703,937]],"mid":[[2698,876],[2686,718],[2386,838],[2084,951],[1931,911],[1423,940],[2324,803],[2144,867],[2156,741],[2244,830],[2199,813],[1755,728],[1719,832],[2289,716],[1749,793],[1993,936],[2320,956],[1959,797],[1404,849],[2666,776],[1624,829],[1858,863],[1082,928],[1590,926],[1726,656],[2296,893],[2378,913],[1701,726],[2204,861],[2230,755],[2070,859],[2110,751]]}};
SkyCycle.tweaks = function () {
  var t = {}; try { t = JSON.parse(localStorage.getItem('amb-tweak') || '{}') || {}; } catch (e) {}
  var out = {}; Object.keys(SkyCycle.AMB_DEFAULTS).forEach(function (k) { out[k] = typeof t[k] === 'number' ? t[k] : SkyCycle.AMB_DEFAULTS[k]; });
  return out;
};
SkyCycle.ambient = function (box, cfg) {
  if (!box) return;
  cfg = cfg || SkyCycle.tweaks();
  var NS = 'http://www.w3.org/2000/svg', G = SkyCycle.AMB_GEOM, sp = Math.max(0.2, cfg.speed || 1);
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  if (!document.getElementById('sky-amb-css')) {
    var css = document.createElement('style'); css.id = 'sky-amb-css';
    css.textContent =
      '.amb{pointer-events:none}' +
      '.amb-drift{animation:amb-drift var(--dur) ease-in-out infinite alternate;animation-delay:var(--delay,0s)}' +
      '@keyframes amb-drift{from{transform:translateX(-170px)}to{transform:translateX(170px)}}' +
      '.amb-roll{animation:amb-roll var(--dur) ease-in-out infinite alternate;animation-delay:var(--delay,0s)}' +
      '@keyframes amb-roll{from{transform:translateX(-360px)}to{transform:translateX(360px)}}' +
      '.amb-win rect{animation:amb-win var(--dur) ease-in-out infinite;animation-delay:var(--delay)}' +
      '@keyframes amb-win{0%,40%,60%,100%{opacity:1}48%,52%{opacity:.12}}' +
      '.amb-beacon{animation:amb-beacon 2.8s infinite;animation-delay:var(--delay)}' +
      '@keyframes amb-beacon{0%,14%{opacity:1}22%,100%{opacity:.08}}' +
      '.amb-tw{animation:amb-tw var(--dur) ease-in-out infinite alternate;animation-delay:var(--delay)}' +
      '@keyframes amb-tw{from{opacity:1}to{opacity:.2}}' +
      '.amb-paused,.amb-paused *{animation-play-state:paused!important}' +
      '@media (prefers-reduced-motion: reduce){.amb *,.amb-tw{animation:none!important}}';
    document.head.appendChild(css);
  }
  [].slice.call(box.querySelectorAll('svg.amb')).forEach(function (n) { n.remove(); });
  var deck = 'M' + G.deck.map(function (q) { return q[0] + ' ' + (q[1] - 6); }).join(' L');
  var group = function (opVar, k, inner) { return '<g style="opacity:calc(var(' + opVar + ',0) * ' + k + ')">' + inner + '</g>'; };
  var glowN = 0;
  var beacon = function (pts) {
    var id = 'ambGlow' + (glowN++);
    return '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="#FF5A48" stop-opacity=".75"></stop>' +
      '<stop offset=".35" stop-color="#FF4A3A" stop-opacity=".28"></stop><stop offset="1" stop-color="#FF4A3A" stop-opacity="0"></stop></radialGradient></defs>' +
      pts.map(function (q, i) { var d = 'style="--delay:' + (-i * 0.9).toFixed(1) + 's"';
        return '<circle class="amb-beacon" cx="' + q[0] + '" cy="' + q[1] + '" r="34" fill="url(#' + id + ')" ' + d + '></circle>' +
          '<circle class="amb-beacon" cx="' + q[0] + '" cy="' + q[1] + '" r="4.5" fill="#FF6A55" ' + d + '></circle>'; }).join('');
  };
  // Soft oval wisps of fog: [cx, cy, rx, ry, drift seconds, opacity].
  var wisps = function (list) {
    var id = 'ambWisp' + (glowN++);
    return '<defs><radialGradient id="' + id + '"><stop offset="0" style="stop-color:var(--amb-fog-color);stop-opacity:.7"></stop>' +
      '<stop offset=".55" style="stop-color:var(--amb-fog-color);stop-opacity:.3"></stop><stop offset="1" style="stop-color:var(--amb-fog-color);stop-opacity:0"></stop></radialGradient></defs>' +
      list.map(function (w) { return '<ellipse class="amb-drift" cx="' + w[0] + '" cy="' + w[1] + '" rx="' + w[2] + '" ry="' + w[3] + '" fill="url(#' + id + ')" opacity="' + w[5] + '" style="--dur:' + (w[4] / sp).toFixed(0) + 's;--delay:-' + (w[4] * ((w[0] % 7) / 7)).toFixed(0) + 's"></ellipse>'; }).join('');
  };
  var windows = function (pts, n) {
    var out = ''; for (var i = 0; i < Math.min(n, pts.length); i++) {
      var q = pts[i]; out += '<rect x="' + (q[0] - 4) + '" y="' + (q[1] - 5) + '" width="8" height="10" rx="1" fill="#FFE3A0" style="--dur:' + ((9 + rnd() * 14) / sp).toFixed(1) + 's;--delay:-' + (rnd() * 20).toFixed(1) + 's"></rect>';
    } return out;
  };
  var fog = function (y, h, dur) {
    return '<rect class="amb-drift" x="-300" y="' + y + '" width="3600" height="' + h + '" fill="url(#ambFog' + y + ')" style="--dur:' + (dur / sp).toFixed(0) + 's"></rect>' +
      '<defs><linearGradient id="ambFog' + y + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--amb-fog-color);stop-opacity:0"></stop>' +
      '<stop offset=".5" style="stop-color:var(--amb-fog-color);stop-opacity:.55"></stop><stop offset="1" style="stop-color:var(--amb-fog-color);stop-opacity:0"></stop></linearGradient></defs>';
  };
  // Headlights crossing the bridge: each car is a small bright light carrying a soft warm pool that lights
  // the deck and the lower cables around it as it passes. Oncoming cars show a red taillight glow instead.
  var road = 'M' + G.deck.map(function (q) { return q[0] + ' ' + (q[1] - 12); }).join(' L');
  var headlights = function (n) {
    var id = 'ambHead' + (glowN++);
    var out = '<defs><radialGradient id="' + id + 'w"><stop offset="0" stop-color="#FFE9C2" stop-opacity=".6"></stop><stop offset=".4" stop-color="#FFD9A0" stop-opacity=".2"></stop><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"></stop></radialGradient>' +
      '<radialGradient id="' + id + 'r"><stop offset="0" stop-color="#FF6A55" stop-opacity=".5"></stop><stop offset=".45" stop-color="#FF4A3A" stop-opacity=".14"></stop><stop offset="1" stop-color="#FF4A3A" stop-opacity="0"></stop></radialGradient></defs>';
    for (var i = 0; i < n; i++) {
      var back = i % 2 === 1, dur = (22 + rnd() * 14) / sp, tone = back ? 'r' : 'w';
      // the tall pool sits above the road so it catches the cables and tower legs, the small one hugs the deck
      out += '<g><ellipse cx="0" cy="-70" rx="210" ry="125" fill="url(#' + id + tone + ')"></ellipse>' +
        '<ellipse cx="0" cy="-6" rx="70" ry="20" fill="url(#' + id + tone + ')"></ellipse>' +
        '<circle r="3.2" fill="' + (back ? '#FF7A64' : '#FFF6E2') + '"></circle>' +
        '<animateMotion dur="' + dur.toFixed(1) + 's" begin="-' + (rnd() * dur).toFixed(1) + 's" repeatCount="indefinite" rotate="auto" path="' + road + '"' +
        (back ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '') + '></animateMotion></g>';
    }
    return out;
  };
  // A low fog bank that only shows in the daytime: wisps rolling over the city's middle and along the waterfront.
  var dayFog = function (list) {
    var id = 'ambDay' + (glowN++);
    return '<defs><radialGradient id="' + id + '"><stop offset="0" style="stop-color:var(--amb-fog-color);stop-opacity:.8"></stop>' +
      '<stop offset=".5" style="stop-color:var(--amb-fog-color);stop-opacity:.38"></stop><stop offset="1" style="stop-color:var(--amb-fog-color);stop-opacity:0"></stop></radialGradient></defs>' +
      list.map(function (w, i) { return '<ellipse class="amb-roll" cx="' + w[0] + '" cy="' + w[1] + '" rx="' + w[2] + '" ry="' + w[3] + '" fill="url(#' + id + ')" opacity="' + w[5] + '" style="--dur:' + (w[4] / sp).toFixed(0) + 's;--delay:-' + (w[4] * (i % 5) / 5).toFixed(0) + 's"></ellipse>'; }).join('');
  };
  // People on the waterfront walk and boats on the bay: tiny silhouettes at the foot of the city.
  // Each one is drawn facing right with its feet at 0,0 and carried along a straight path.
  var still = false; try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var swing = function (cx, cy, deg, dur, phase) {
    return '<animateTransform attributeName="transform" type="rotate" values="' + (-deg) + ' ' + cx + ' ' + cy + ';' + deg + ' ' + cx + ' ' + cy + ';' + (-deg) + ' ' + cx + ' ' + cy +
      '" dur="' + dur + 's" begin="-' + (phase * dur).toFixed(2) + 's" repeatCount="indefinite"></animateTransform>';
  };
  var legs = function (hip, len, deg, dur) {
    return '<g stroke="var(--amb-person-color)" stroke-width="1.7" stroke-linecap="round">' +
      '<line x1="0" y1="' + hip + '" x2="0" y2="' + (hip + len) + '">' + (still ? '' : swing(0, hip, deg, dur, 0)) + '</line>' +
      '<line x1="0" y1="' + hip + '" x2="0" y2="' + (hip + len) + '">' + (still ? '' : swing(0, hip, deg, dur, 0.5)) + '</line></g>';
  };
  var walker = function () { return '<circle cx=".4" cy="-14.6" r="2.1"></circle><rect x="-1.5" y="-12.4" width="3.2" height="6.8" rx="1.4"></rect>' + legs(-6.2, 6.2, 20, 1.05); };
  var jogger = function () { return '<g transform="rotate(8 0 -6)"><circle cx=".6" cy="-14.4" r="2"></circle><rect x="-1.4" y="-12.2" width="3" height="6.4" rx="1.3"></rect></g>' + legs(-6, 6, 34, 0.55); };
  var dogWalker = function () {
    return walker() + '<path d="M1.6 -9 L9 -3.6" stroke="var(--amb-person-color)" stroke-width=".5" fill="none"></path>' +
      '<g transform="translate(10 0)"><rect x="-3.4" y="-4.6" width="6" height="2.6" rx="1.2"></rect><circle cx="3" cy="-5.2" r="1.5"></circle>' + legs(-2.4, 2.4, 30, 0.42) + '</g>';
  };
  var cyclist = function () {
    var spin = still ? '' : '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur=".6s" repeatCount="indefinite"></animateTransform>';
    return '<g fill="none" stroke="var(--amb-person-color)" stroke-width="1.1"><circle cx="-5" cy="-3.2" r="3.2"></circle><circle cx="5" cy="-3.2" r="3.2"></circle>' +
      '<path d="M-5 -3.2 L-1 -3.2 L3 -8 M-1 -3.2 L-2.4 -8.4 M5 -3.2 L3 -8"></path></g>' +
      '<g transform="translate(-1 -3.2)"><line x1="-1.6" y1="0" x2="1.6" y2="0" stroke="var(--amb-person-color)" stroke-width="1">' + spin + '</line></g>' +
      '<g transform="rotate(16 -2 -9)"><circle cx="-.6" cy="-17" r="2"></circle><rect x="-3.4" y="-14.8" width="3" height="6.6" rx="1.3"></rect></g>';
  };
  var boat = function () {
    var bob = still ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="3.6s" repeatCount="indefinite"></animateTransform>';
    return '<g>' + bob + '<path d="M-14 -3 L14 -3 L10 2 L-11 2 Z"></path><path d="M0 -4 L0 -34 L13 -6 Z" style="fill:var(--amb-fog-color)"></path>' +
      '<path d="M-1.6 -6 L-1.6 -28 L-11 -6 Z" style="fill:var(--amb-fog-color);opacity:.85"></path></g>';
  };
  // [figure, units per second, path y, scale]: walkers, a jogger, a dog walker and a cyclist on the promenade.
  var cast = [[walker, 20], [dogWalker, 17], [jogger, 46], [walker, 22], [cyclist, 82], [walker, 19], [walker, 21], [jogger, 42], [walker, 18], [cyclist, 76], [walker, 20], [walker, 23], [dogWalker, 16], [walker, 20]];
  var mover = function (draw, speed, y, n, i, total, size) {
    var left = i % 2 === 1, dur = 3400 / speed / sp, start = (i + rnd() * 0.6) / total;
    var flip = ' transform="scale(' + (left ? -size : size) + ' ' + size + ')"';
    var path = 'M-200 ' + y + ' L3200 ' + y;
    if (still) return '<g transform="translate(' + (-200 + 3400 * start).toFixed(0) + ' ' + y + ')"><g' + flip + '>' + draw() + '</g></g>';
    return '<g><g' + flip + '>' + draw() + '</g><animateMotion dur="' + dur.toFixed(1) + 's" begin="-' + (start * dur).toFixed(1) + 's" repeatCount="indefinite" path="' + path + '"' +
      (left ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '') + '></animateMotion></g>';
  };
  var people = function (n) {
    var out = '', total = Math.min(n, cast.length);
    for (var i = 0; i < total; i++) out += mover(cast[i][0], cast[i][1], 1111, n, i, total, 1.5);
    return '<g style="fill:var(--amb-person-color)">' + out + '</g>';
  };
  var boats = function (n) {
    var out = '', ys = [1130, 1150], total = Math.min(n, 2);
    for (var i = 0; i < total; i++) out += mover(boat, 7 + i * 3, ys[i], n, i, total, 1.2);
    return '<g style="fill:var(--amb-person-color)">' + out + '</g>';
  };
  var nWin = Math.round(cfg.windows), nNear = Math.round(nWin * 0.55), nMid = nWin - nNear;
  var parts = {
    'sky-far': group('--amb-fog', cfg.fog, fog(930, 150, 30)) + group('--amb-beacon', cfg.beacons, beacon(G.beacons.far)),
    'sky-mid': group('--amb-win', 1, '<g class="amb-win">' + windows(G.win.mid, nMid) + '</g>') + group('--amb-beacon', cfg.beacons, beacon(G.beacons.mid)),
    'sky-near': group('--amb-win', 1, '<g class="amb-win">' + windows(G.win.near, nNear) + '</g>') +
      group('--amb-day', cfg.fog, dayFog([[500, 760, 700, 70, 44, 0.5], [1900, 700, 820, 80, 56, 0.45], [2700, 820, 600, 60, 40, 0.4]])) +
      group('--amb-day', cfg.fog, dayFog([[900, 1092, 900, 40, 50, 0.55], [2300, 1100, 1000, 44, 62, 0.5]])) +
      group('--amb-people', 1, people(Math.round(cfg.people))),
    'sky-refl': group('--amb-fog', cfg.fog, fog(1090, 120, 36)) + group('--amb-people', 1, boats(Math.round(cfg.people) > 0 ? 2 : 0)),
    // Layered fog over the bridge: wisps at three heights drift at different speeds across the tower and deck.
    'sky-bridge': group('--amb-beacon', cfg.beacons, beacon(G.beacons.bridge)) +
      group('--amb-light', 1, headlights(Math.round(cfg.headlights))) +
      group('--amb-fog', cfg.bridgeFog, wisps([
        [700, 820, 760, 70, 54, 0.55], [1700, 870, 900, 80, 70, 0.5],
        [400, 1010, 820, 90, 62, 0.65], [1500, 1060, 1000, 95, 80, 0.6], [2600, 1030, 700, 80, 58, 0.5],
        [1000, 1180, 1100, 110, 90, 0.7], [2300, 1210, 900, 100, 74, 0.6]
      ]))
  };
  Object.keys(parts).forEach(function (k) {
    var art = box.querySelector('svg.' + k + '-layer:not(.amb)'); if (!art) return;
    var el = document.createElementNS(NS, 'svg');
    el.setAttribute('class', art.getAttribute('class') + ' amb');
    el.setAttribute('viewBox', art.getAttribute('viewBox'));
    el.setAttribute('preserveAspectRatio', art.getAttribute('preserveAspectRatio') || 'xMidYMax meet');
    el.setAttribute('aria-hidden', 'true');
    if (art.getAttribute('style')) el.setAttribute('style', art.getAttribute('style'));
    el.innerHTML = parts[k];
    art.insertAdjacentElement('afterend', el);
  });
  // Rest while the skyline is off screen.
  if ('IntersectionObserver' in window && !box.__ambIO) {
    box.__ambIO = new IntersectionObserver(function (e) {
      var on = e[0].isIntersecting;
      [].slice.call(box.querySelectorAll('svg.amb')).forEach(function (n) {
        n.classList.toggle('amb-paused', !on);
        try { if (on) n.unpauseAnimations(); else n.pauseAnimations(); } catch (x) {}
      });
    });
    box.__ambIO.observe(box);
  }
};
// Twinkle some of the night stars.
SkyCycle.twinkle = function (stars, on) {
  if (!stars) return;
  [].slice.call(stars.querySelectorAll('circle')).forEach(function (c, i) {
    var t = on && i % 2 === 0;
    c.classList.toggle('amb-tw', t);
    if (t) { c.style.setProperty('--dur', (2.5 + (i % 5) * 0.7) + 's'); c.style.setProperty('--delay', (-(i % 7) * 0.6) + 's'); }
  });
};

// Tweak panel, shown when the page address ends in #tweak. Sliders change the city life live and are
// remembered in this browser only; the panel prints the settings to send back.
SkyCycle.tweakPanel = function (onChange) {
  if (location.hash !== '#tweak') return;
  var cfg = SkyCycle.tweaks();
  var F = [
    ['windows', 'Lit windows', 0, 70, 1], ['headlights', 'Headlights', 0, 8, 1], ['fog', 'Fog over city and water', 0, 2, 0.1], ['bridgeFog', 'Fog over the bridge', 0, 2, 0.1], ['people', 'People on the waterfront', 0, 14, 1],
    ['beacons', 'Tower lights', 0, 1, 0.1], ['twinkle', 'Star twinkle', 0, 1, 1], ['speed', 'Speed', 0.4, 2, 0.1]
  ];
  var box = document.createElement('div');
  box.setAttribute('style', 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:16px;z-index:50;width:260px;padding:14px 16px;border-radius:14px;' +
    'background:rgba(20,18,40,.88);color:#F4F1FF;font:13px/1.4 system-ui,sans-serif;box-shadow:0 14px 40px -12px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)');
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:13px;letter-spacing:.06em">CITY LIFE</strong>' +
    '<button type="button" data-reset style="font:inherit;font-size:12px;color:#F4F1FF;background:none;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:2px 10px;cursor:pointer">Reset</button></div>' +
    F.map(function (f) {
      return '<label style="display:block;margin:8px 0 0">' + f[1] + ' <span data-v="' + f[0] + '" style="float:right;opacity:.75"></span>' +
        '<input id="amb-' + f[0] + '" type="range" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '" data-k="' + f[0] + '" style="width:100%;margin:4px 0 0"></label>';
    }).join('') +
    '<p style="margin:12px 0 4px;opacity:.75">Send me these settings:</p><textarea id="amb-out" readonly rows="2" style="width:100%;box-sizing:border-box;font:12px/1.4 ui-monospace,monospace;border-radius:8px;border:0;padding:6px 8px;background:rgba(255,255,255,.1);color:#F4F1FF;resize:none"></textarea>';
  document.body.appendChild(box);
  function sync() {
    F.forEach(function (f) { var i = box.querySelector('[data-k="' + f[0] + '"]'); i.value = cfg[f[0]]; box.querySelector('[data-v="' + f[0] + '"]').textContent = cfg[f[0]]; });
    box.querySelector('#amb-out').value = JSON.stringify(cfg);
  }
  box.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-k'); if (!k) return;
    cfg[k] = parseFloat(e.target.value);
    try { localStorage.setItem('amb-tweak', JSON.stringify(cfg)); } catch (x) {}
    sync(); onChange(cfg);
  });
  box.querySelector('[data-reset]').addEventListener('click', function () {
    cfg = Object.assign({}, SkyCycle.AMB_DEFAULTS);
    try { localStorage.removeItem('amb-tweak'); } catch (x) {}
    sync(); onChange(cfg);
  });
  box.querySelector('#amb-out').addEventListener('focus', function (e) { e.target.select(); });
  sync();
};
