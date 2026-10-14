(function () {
  var bar = document.querySelector('.progress');
  var queued = false;
  function update() {
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var done = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 1;
    bar.style.transform = 'scaleX(' + done + ')';
  }
  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  update();
})();

(function () {
  var button = document.querySelector('.copy');
  if (!button) return;
  var label = button.querySelector('.copy-label');
  var email = button.getAttribute('data-email');
  var reset;
  button.addEventListener('click', function () {
    if (!navigator.clipboard) { location.href = 'mailto:' + email; return; }
    navigator.clipboard.writeText(email).then(function () {
      button.classList.add('is-copied');
      label.textContent = 'Copied ' + email;
      clearTimeout(reset);
      reset = setTimeout(function () {
        button.classList.remove('is-copied');
        label.textContent = 'Copy email';
      }, 2500);
    }, function () {
      location.href = 'mailto:' + email;
    });
  });
})();

document.querySelector('.theme').addEventListener('click', function () {
  var root = document.documentElement;
  var current = root.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  var next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// Lightbox: figure images open in place, with arrows to step through the page's images.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('a.zoom'));
  if (!links.length || !window.HTMLDialogElement) return;

  var icon = function (d) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  };
  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML =
    '<div class="lb-stage"><img alt=""></div>' +
    '<p class="lb-meta"><span class="lb-caption"></span><span class="lb-count"></span></p>' +
    '<button class="lb-close" type="button" aria-label="Close">' + icon('M3 3l10 10M13 3L3 13') + '</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous image">' + icon('M10 3L5 8l5 5') + '</button>' +
    '<button class="lb-next" type="button" aria-label="Next image">' + icon('M6 3l5 5-5 5') + '</button>';
  document.body.appendChild(box);

  var stage = box.querySelector('.lb-stage');
  var image = stage.querySelector('img');
  var caption = box.querySelector('.lb-caption');
  var count = box.querySelector('.lb-count');
  var prev = box.querySelector('.lb-prev');
  var next = box.querySelector('.lb-next');
  var current = 0;

  function show(i) {
    current = (i + links.length) % links.length;
    var link = links[current];
    var thumb = link.querySelector('img');
    var full = link.href;
    // Show what is already loaded, then swap in the full-size file.
    image.src = thumb.currentSrc || thumb.src;
    image.alt = thumb.alt;
    var loader = new Image();
    loader.onload = function () { if (links[current] === link) image.src = full; };
    loader.src = full;
    caption.textContent = thumb.alt;
    count.textContent = (current + 1) + ' / ' + links.length;
    prev.hidden = next.hidden = links.length < 2;
  }

  links.forEach(function (link, i) {
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      show(i);
      box.showModal();
      document.documentElement.classList.add('lb-open');
    });
  });

  prev.addEventListener('click', function () { show(current - 1); });
  next.addEventListener('click', function () { show(current + 1); });
  box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
  stage.addEventListener('click', function (event) { if (event.target === stage) box.close(); });
  box.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  box.addEventListener('close', function () {
    document.documentElement.classList.remove('lb-open');
    links[current].focus();
  });
})();

// Case study table of contents, built from each section's h2.
(function () {
  var sections = [].slice.call(document.querySelectorAll('.section > h2[id]'));
  var masthead = document.querySelector('.masthead');
  if (sections.length < 3 || !masthead) return;
  var root = document.documentElement;
  root.classList.add('has-toc');

  var BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 8H2M7 3 2 8l5 5"/></svg>';

  // A plain list of section links, built once for the rail and once for the menu.
  function buildList() {
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Sections');
    var list = document.createElement('ol');
    list.className = 'toc-list';
    var links = sections.map(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a); list.appendChild(li);
      return a;
    });
    nav.appendChild(list);
    return { nav: nav, links: links };
  }

  // Desktop rail: name, the way back, the sections, the theme switch.
  var rail = document.createElement('aside');
  rail.className = 'toc-rail';
  rail.setAttribute('aria-label', 'Case study navigation');
  var brand = masthead.querySelector('.brand').cloneNode(true);
  var back = document.createElement('a');
  back.className = 'toc-back'; back.href = './#work'; back.innerHTML = BACK + '<span>All work</span>';
  var desk = buildList();
  var theme = masthead.querySelector('.theme');
  var themeCopy = theme.cloneNode(true);
  themeCopy.addEventListener('click', function () { theme.click(); });
  rail.append(brand, back, desk.nav, themeCopy);
  document.body.appendChild(rail);

  // Mobile: menu button in the masthead opens a card over a blurred page.
  var toggle = document.createElement('button');
  toggle.className = 'toc-toggle'; toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open sections menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'toc-pop');
  toggle.innerHTML = '<svg class="open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M8 17h12"/></svg><svg class="close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  masthead.querySelector('nav').appendChild(toggle);
  var pop = document.createElement('div');
  pop.className = 'toc-pop'; pop.id = 'toc-pop';
  var mob = buildList();
  var popBack = back.cloneNode(true);
  pop.append(mob.nav, popBack);
  var scrim = document.createElement('div');
  scrim.className = 'toc-scrim';
  document.body.append(scrim, pop);

  var open = false;
  function setOpen(v) {
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    toggle.setAttribute('aria-label', v ? 'Close sections menu' : 'Open sections menu');
    if (v) {
      root.classList.add('toc-open');
      requestAnimationFrame(function () { root.classList.add('toc-shown'); });
      var cur = pop.querySelector('[aria-current]') || pop.querySelector('a');
      if (cur) cur.focus({ preventScroll: true });
    } else {
      root.classList.remove('toc-shown');
      setTimeout(function () { if (!open) root.classList.remove('toc-open'); }, 250);
    }
  }
  toggle.addEventListener('click', function () { setOpen(!open); });
  scrim.addEventListener('click', function () { setOpen(false); });
  pop.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { setOpen(false); toggle.focus(); }
  });

  // The current section is the last one whose top has passed 30% of the screen.
  function paint() {
    var line = window.innerHeight * 0.3, k = -1;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].parentElement.getBoundingClientRect().top <= line) k = i;
    }
    // At the very bottom, a short last section can never reach the line.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) k = sections.length - 1;
    [desk, mob].forEach(function (r) {
      r.links.forEach(function (a, j) {
        if (j === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }

  var queued = false;
  function queue() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; paint(); }); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  paint();
})();
