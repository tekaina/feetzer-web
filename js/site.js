/* ==========================================================================
   Feetzer Marketing Website — Progressive Enhancement & Moments Viewer
   Swipe/drag · Category filter · Keyboard arrows/Home/End · Polite SR · Sync
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js-ready');
  var isDe = (root.getAttribute('lang') || '').toLowerCase().indexOf('de') === 0;
  var prefersReducedMotion = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* 1. Theme toggle (light / dark) */
  var themeButtons = document.querySelectorAll('[data-theme-toggle]');
  function syncThemeControls() {
    var isDark = root.getAttribute('data-theme') === 'dark';
    var nextLabelEn = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    var nextLabelDe = isDark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln';
    themeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDe ? nextLabelDe : nextLabelEn);
      var iconSpan = btn.querySelector('[data-theme-icon]');
      if (iconSpan) {
        iconSpan.textContent = isDark ? '☀' : '◐';
      }
    });
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', 'dark');
      }
      try {
        localStorage.setItem('feetzer-theme', isDark ? 'light' : 'dark');
      } catch (e) {}
      syncThemeControls();
    });
  });
  syncThemeControls();

  /* 2. Mobile navigation drawer */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileDrawer = document.getElementById('mobile-nav');
  if (menuToggle && mobileDrawer) {
    var closeMobileNav = function () {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileDrawer.hidden = true;
    };

    menuToggle.addEventListener('click', function () {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      mobileDrawer.hidden = expanded;
    });

    mobileDrawer.querySelectorAll('a').forEach(function (navLink) {
      navLink.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !mobileDrawer.hidden) {
        closeMobileNav();
        menuToggle.focus();
      }
    });
  }

  /* 3. Interactive "Feetzer Moments" Experience */
  var viewer = document.getElementById('moments-viewer');
  var currentCategory = 'all';
  var currentMomentId = 'parking';

  if (viewer) {
    var allSlides = Array.prototype.slice.call(viewer.querySelectorAll('.moment-slide'));
    var catButtons = Array.prototype.slice.call(viewer.querySelectorAll('[data-cat-filter]'));
    var prevBtn = viewer.querySelector('[data-moment-prev]');
    var nextBtn = viewer.querySelector('[data-moment-next]');
    var autoplayBtn = viewer.querySelector('[data-moment-autoplay]');
    var counterEl = viewer.querySelector('[data-moment-counter]');
    var dotsWrap = viewer.querySelector('[data-moment-dots]');
    var announcer = document.getElementById('moments-announcer');
    var deckEl = viewer.querySelector('.moments-deck');

    var filteredSlides = allSlides.slice();
    var activeIndex = 0;
    var autoplayTimer = null;
    var autoplayEnabled = !prefersReducedMotion;
    var hoverOrFocusPaused = false;

    function syncAutoplayButton() {
      if (!autoplayBtn) return;
      var running = autoplayEnabled && !prefersReducedMotion;
      autoplayBtn.setAttribute('aria-pressed', running ? 'false' : 'true');
      autoplayBtn.textContent = running ? '⏸' : '▶';
      autoplayBtn.setAttribute(
        'aria-label',
        isDe
          ? (running ? 'Automatischen Beispielwechsel pausieren' : 'Automatischen Beispielwechsel starten')
          : (running ? 'Pause automatic example rotation' : 'Start automatic example rotation')
      );
    }

    function stopTimer() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startTimerIfAllowed() {
      stopTimer();
      if (!autoplayEnabled || prefersReducedMotion || hoverOrFocusPaused || filteredSlides.length < 2) {
        return;
      }
      autoplayTimer = setInterval(function () {
        showSlide(activeIndex + 1, false);
      }, 6200);
    }

    function pauseFromUserAction() {
      autoplayEnabled = false;
      stopTimer();
      syncAutoplayButton();
    }

    function rebuildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      filteredSlides.forEach(function (slide, idx) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'm-dot';
        dot.setAttribute(
          'aria-label',
          isDe ? 'Beispiel ' + (idx + 1) + ' anzeigen' : 'Show example ' + (idx + 1)
        );
        dot.setAttribute('aria-current', idx === activeIndex ? 'true' : 'false');
        dot.addEventListener('click', function () {
          pauseFromUserAction();
          showSlide(idx, true);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function persistState() {
      try {
        sessionStorage.setItem('feetzer-moment-cat', currentCategory);
        sessionStorage.setItem('feetzer-moment-id', currentMomentId);
      } catch (e) {}
    }

    function showSlide(nextIdx, announcePolite) {
      if (!filteredSlides.length) return;
      var len = filteredSlides.length;
      activeIndex = ((nextIdx % len) + len) % len;
      var activeSlide = filteredSlides[activeIndex];
      currentMomentId = activeSlide.getAttribute('data-moment-id') || '';

      allSlides.forEach(function (slide) {
        var isCurrent = slide === activeSlide;
        if (isCurrent) {
          /* Retrigger CSS entrance cleanly when switching */
          slide.classList.remove('is-active');
          void slide.offsetWidth;
          slide.classList.add('is-active');
          slide.removeAttribute('aria-hidden');
        } else {
          slide.classList.remove('is-active');
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      if (counterEl) {
        counterEl.textContent = (activeIndex + 1) + ' / ' + len;
      }

      if (dotsWrap) {
        var dots = dotsWrap.querySelectorAll('.m-dot');
        dots.forEach(function (d, i) {
          d.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
        });
      }

      persistState();

      if (announcePolite && announcer) {
        var quoteEl = activeSlide.querySelector('.m-quote');
        var catEl = activeSlide.querySelector('.m-cat-pill');
        var summaryText = (catEl ? catEl.textContent.trim() + ': ' : '') + (quoteEl ? quoteEl.textContent.trim() : '');
        announcer.textContent =
          (isDe ? 'Beispiel ' : 'Example ') + (activeIndex + 1) + '/' + len + ' — ' + summaryText;
      }
    }

    function applyCategory(cat, preferredMomentId, announcePolite) {
      var validCats = ['all', 'ask', 'help', 'discover', 'plan'];
      currentCategory = validCats.indexOf(cat) !== -1 ? cat : 'all';

      catButtons.forEach(function (btn) {
        var match = btn.getAttribute('data-cat-filter') === currentCategory;
        btn.setAttribute('aria-pressed', match ? 'true' : 'false');
      });

      filteredSlides = allSlides.filter(function (slide) {
        return currentCategory === 'all' || slide.getAttribute('data-category') === currentCategory;
      });

      var startIdx = 0;
      if (preferredMomentId) {
        var found = filteredSlides.findIndex(function (s) {
          return s.getAttribute('data-moment-id') === preferredMomentId;
        });
        if (found !== -1) {
          startIdx = found;
        }
      }

      activeIndex = startIdx;
      rebuildDots();
      showSlide(startIdx, Boolean(announcePolite));
    }

    /* Parse initial state from ?cat=...&moment=... or sessionStorage */
    var initCat = 'all';
    var initMoment = '';
    try {
      var params = new URLSearchParams(window.location.search);
      var qCat = params.get('cat');
      var qMoment = params.get('moment');
      if (qMoment) {
        initMoment = qMoment;
        if (qCat) {
          initCat = qCat;
        } else {
          /* If ?moment= is specified without ?cat=, keep 'all' so any moment resolves */
          initCat = 'all';
        }
      } else if (qCat) {
        initCat = qCat;
      } else {
        initCat = sessionStorage.getItem('feetzer-moment-cat') || 'all';
        initMoment = sessionStorage.getItem('feetzer-moment-id') || '';
      }
    } catch (e) {}

    applyCategory(initCat, initMoment, false);
    syncAutoplayButton();
    startTimerIfAllowed();

    /* Category chip clicks */
    catButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        pauseFromUserAction();
        applyCategory(btn.getAttribute('data-cat-filter'), '', true);
      });
    });

    /* Section C pillar jump buttons */
    document.querySelectorAll('[data-jump-cat]').forEach(function (jumpBtn) {
      jumpBtn.addEventListener('click', function () {
        pauseFromUserAction();
        var targetCat = jumpBtn.getAttribute('data-jump-cat');
        applyCategory(targetCat, '', true);
        viewer.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        var activeChip = viewer.querySelector('[data-cat-filter="' + targetCat + '"]');
        if (activeChip) {
          activeChip.focus({ preventScroll: true });
        }
      });
    });

    /* Prev / Next / Autoplay buttons */
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        pauseFromUserAction();
        showSlide(activeIndex - 1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        pauseFromUserAction();
        showSlide(activeIndex + 1, true);
      });
    }

    if (autoplayBtn) {
      if (prefersReducedMotion) {
        autoplayBtn.hidden = true;
      }
      autoplayBtn.addEventListener('click', function () {
        autoplayEnabled = !autoplayEnabled;
        syncAutoplayButton();
        if (autoplayEnabled) {
          startTimerIfAllowed();
        } else {
          stopTimer();
        }
      });
    }

    /* Pause autoplay while hovering or focusing inside viewer */
    viewer.addEventListener('mouseenter', function () {
      hoverOrFocusPaused = true;
      stopTimer();
    });
    viewer.addEventListener('mouseleave', function () {
      hoverOrFocusPaused = false;
      startTimerIfAllowed();
    });
    viewer.addEventListener('focusin', function () {
      hoverOrFocusPaused = true;
      stopTimer();
    });
    viewer.addEventListener('focusout', function (ev) {
      if (!viewer.contains(ev.relatedTarget)) {
        hoverOrFocusPaused = false;
        startTimerIfAllowed();
      }
    });

    /* Keyboard navigation inside viewer (ArrowLeft, ArrowRight, Home, End — no focus trap!) */
    viewer.addEventListener('keydown', function (ev) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        pauseFromUserAction();
        showSlide(activeIndex + 1, true);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        pauseFromUserAction();
        showSlide(activeIndex - 1, true);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        pauseFromUserAction();
        showSlide(0, true);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        pauseFromUserAction();
        showSlide(filteredSlides.length - 1, true);
      }
    });

    /* Touch & pointer swipe/drag (horizontal only; preserves vertical scroll) */
    if (deckEl) {
      var startX = 0;
      var startY = 0;
      var tracking = false;

      deckEl.addEventListener(
        'touchstart',
        function (ev) {
          if (!ev.touches || ev.touches.length !== 1) return;
          startX = ev.touches[0].clientX;
          startY = ev.touches[0].clientY;
          tracking = true;
          hoverOrFocusPaused = true;
          stopTimer();
        },
        { passive: true }
      );

      deckEl.addEventListener(
        'touchend',
        function (ev) {
          if (!tracking || !ev.changedTouches || !ev.changedTouches.length) return;
          tracking = false;
          var dx = ev.changedTouches[0].clientX - startX;
          var dy = ev.changedTouches[0].clientY - startY;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            pauseFromUserAction();
            if (dx < 0) {
              showSlide(activeIndex + 1, true);
            } else {
              showSlide(activeIndex - 1, true);
            }
          } else {
            hoverOrFocusPaused = false;
            startTimerIfAllowed();
          }
        },
        { passive: true }
      );

      /* Mouse drag support on desktop */
      var mouseDownX = null;
      deckEl.addEventListener('mousedown', function (ev) {
        if (ev.button !== 0) return;
        mouseDownX = ev.clientX;
      });
      deckEl.addEventListener('mouseup', function (ev) {
        if (mouseDownX === null) return;
        var dx = ev.clientX - mouseDownX;
        mouseDownX = null;
        if (Math.abs(dx) > 50) {
          pauseFromUserAction();
          if (dx < 0) {
            showSlide(activeIndex + 1, true);
          } else {
            showSlide(activeIndex - 1, true);
          }
        }
      });
    }
  }

  /* 4. Language switch: store manual preference + preserve selected category, moment & section hash */
  var langLinks = document.querySelectorAll('[data-lang-choice]');
  langLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      var chosen = link.getAttribute('data-lang-choice');
      if (chosen) {
        try {
          localStorage.setItem('feetzer-lang', chosen);
        } catch (e) {}
      }
      var rawHref = link.getAttribute('href').split('?')[0].split('#')[0];
      var qs = [];
      if (currentCategory && currentCategory !== 'all') {
        qs.push('cat=' + encodeURIComponent(currentCategory));
      }
      if (currentMomentId) {
        qs.push('moment=' + encodeURIComponent(currentMomentId));
      }
      var queryPart = qs.length ? '?' + qs.join('&') : '';
      var currentHash = window.location.hash && window.location.hash.length > 1 ? window.location.hash : '';
      link.setAttribute('href', rawHref + queryPart + currentHash);
    });
  });
})();
