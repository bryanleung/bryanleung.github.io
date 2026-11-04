// Sky cycle: one forward loop through the day.
//   Day → night:  morning → noon → dusk            (the sun crosses and sets, the moon rises)
//   Night → day:  dusk → midnight → morning        (the moon crosses and sets, the sun rises)
// The loop is a phase p from 0 to 1: morning at 0, dusk (night mode) at 0.5, back to morning at 1,
// which is the same as 0. Colours have four palettes (morning, noon, dusk, midnight); KEY says
// where on the loop each one is reached, and between them colours blend in straight lines, so
// nothing pauses. The sun and moon each move at a steady angle along their arcs. The only easing
// is a gentle start and finish to each run. Interrupting a run turns it around from where it is.
function SkyCycle(o) {
  var MORNING = 0, NOON = 1, DUSK = 2, MIDNIGHT = 3;
  var KEY = o.key || [[0, MORNING], [0.21, NOON], [0.425, DUSK], [0.5, DUSK], [0.72, MIDNIGHT], [0.95, MORNING], [1, MORNING]];
  var p = 0, anim = 0;

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

  function ellipse(e, deg) { var r = deg * Math.PI / 180; return [e.cx + e.rx * Math.cos(r), e.cy - e.ry * Math.sin(r)]; }
  function place(el, pt, op) { if (!el) return; el.setAttribute('cx', pt[0].toFixed(1)); el.setAttribute('cy', pt[1].toFixed(1)); el.style.opacity = op; }

  function apply() {
    var el = o.el(); if (!el) return;
    Object.keys(tokens).forEach(function (k) { el.style.setProperty('--' + k, fmt(blend(tokens[k], p))); });
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
    var mo = o.geom.moon, ma = mo.angles, moonAng;
    moonAng = p <= 0.5 ? mixN(ma[0], ma[1], span(p, 0.35, 0.5)) : mixN(ma[1], mo.set, span(p, 0.5, 0.9));
    var moonO = p <= 0.5 ? span(p, 0.35, 0.4) : 1 - span(p, 0.86, 0.9);
    var mp = ellipse(mo, moonAng);
    place(c.moon, mp, moonO); place(c.moonGlow, mp, moonO * 0.7);

    // Stars: faint at dusk, brightest around midnight, gone by morning.
    if (c.stars) c.stars.style.opacity = p <= 0.5 ? 0.45 * span(p, 0.4, 0.5) : mixN(0.45, 1, span(p, 0.5, 0.7)) * (1 - span(p, 0.78, 0.92));
  }

  function still() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  return {
    get t() { return p; },
    // 0 = day (morning), 1 = night (dusk). Jumps straight there.
    set: function (mode) { if (anim) cancelAnimationFrame(anim); anim = 0; p = mode ? 0.5 : 0; apply(); },
    apply: apply,
    // Play to day (0) or night (1). To night: forward to dusk. To day: forward through midnight to
    // the next morning. If a run is interrupted, the new one turns back from where the sky is.
    go: function (mode, done) {
      if (anim) cancelAnimationFrame(anim);
      var dest = mode ? 0.5 : (p >= 0.5 ? 1 : 0);
      var finish = function () { if (dest === 1) p = 0; apply(); if (done) done(); };
      if (still()) { p = dest; finish(); return; }
      var from = p, dur = (o.duration || 3600) * Math.abs(dest - from) / 0.5, t0 = 0;
      if (Math.abs(dest - from) < 0.001) { finish(); return; }
      function step(now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0) / dur);
        p = from + (dest - from) * (0.5 - Math.cos(Math.PI * k) / 2); apply();
        if (k < 1) anim = requestAnimationFrame(step); else { anim = 0; finish(); }
      }
      anim = requestAnimationFrame(step);
    }
  };
}
