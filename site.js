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
