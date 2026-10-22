/**
 * UrbanLink concept motion — no dependencies, native links stay native.
 * [data-reveal]                 reveals once when it enters the viewport.
 * [data-hero-line] > span       clips a whole headline line into view.
 * [data-hero-media]             receives --hero-travel / --hero-scale.
 * [data-menu-toggle]            opens #concept-menu (Escape / focus support).
 * [data-video-toggle]           toggles the first concept video; optionally use
 *                              data-video-target="#video-id" for another.
 * [data-video-label]            optional visible text inside the video button.
 * [data-motion-toggle]          explicit, session-only animation preview control.
 * [data-motion-label]           optional text inside the motion control.
 * html.motion-reduced          effective preference (device / session / user).
 * html.motion-enabled          animations allowed, including explicit opt-in.
 * ul-motion-change             window event; detail: { enabled, reduced, source }.
 * .brand-shared                shared logo for native page transitions.
 * Set --reveal-delay on a reveal or --line-delay on a hero line for a stagger.
 * Add muted loop playsinline and a poster to videos, but omit autoplay:
 * automatic playback begins here only when motion is allowed and visible.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
  let savedMotion = null;
  try {
    savedMotion = window.sessionStorage.getItem('ul_concept_motion');
  } catch {
    // Session storage can be unavailable; the current page still responds.
  }
  let explicitConsent = savedMotion === 'enabled';
  let explicitPause = savedMotion === 'paused';
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  const mediaElements = [...document.querySelectorAll('[data-hero-media]')];
  const videos = [
    ...new Set(
      document.querySelectorAll(
        '[data-hero-media] video, video[data-hero-media], video[data-motion-video]'
      )
    )
  ];
  const videoButtons = [...document.querySelectorAll('[data-video-toggle]')];
  const videoStates = new Map();
  let revealObserver;
  let scrollFrame = 0;

  const isReduced = () => explicitPause || (motionPreference.matches && !explicitConsent);

  function updateMotionUI(source = 'device') {
    const reduced = isReduced();
    root.classList.toggle('motion-reduced', reduced);
    root.classList.toggle('motion-enabled', !reduced);
    motionButtons.forEach((button) => {
      button.hidden = false;
      const label = reduced ? 'Ativar animações' : 'Pausar animações';
      const visibleLabel = button.querySelector('[data-motion-label]');
      if (visibleLabel) visibleLabel.textContent = label;
      else button.textContent = label;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(!reduced));
    });
    window.dispatchEvent(
      new CustomEvent('ul-motion-change', {
        detail: { enabled: !reduced, reduced, source }
      })
    );
  }

  updateMotionUI(savedMotion ? 'session' : 'device');
  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.height > 0;
  };

  function reveal(element) {
    element.classList.add('is-revealed');
    revealObserver?.unobserve(element);
  }

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.06 }
    );
    revealElements.forEach((element) => {
      if (isReduced() || isInViewport(element)) reveal(element);
      else revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(reveal);
  }

  function updateScroll() {
    scrollFrame = 0;
    const y = Math.max(0, window.scrollY);
    const range = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', range > 0 ? String(y / range) : '0');
    root.classList.toggle('has-scrolled', y > 28);

    mediaElements.forEach((element) => {
      const hero = element.closest('.hero') || element.parentElement || element;
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      const travel = isReduced() ? '0px' : `${(progress * 40).toFixed(2)}px`;
      const scale = isReduced() ? '1' : (1.035 + progress * 0.045).toFixed(4);
      element.style.setProperty('--hero-travel', travel);
      element.style.setProperty('--hero-scale', scale);
      hero.style.setProperty('--hero-progress', String(progress));
    });
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });

  const menu = document.getElementById('concept-menu');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  let previousFocus;
  let menuOpen = false;

  const menuFocusable = () =>
    menu
      ? [...menu.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter(
          (element) => !element.hidden && element.getClientRects().length > 0
        )
      : [];

  function setMenu(open, restoreFocus = true) {
    if (!menu || !menuToggle) return;
    if (open) previousFocus = document.activeElement;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    const menuLabel = menuToggle.querySelector('[data-menu-label]');
    if (menuLabel) menuLabel.textContent = open ? 'Fechar' : 'Menu';
    const menuSymbol = menuToggle.querySelector('[aria-hidden="true"]');
    if (menuSymbol) menuSymbol.textContent = open ? '−' : '＋';

    if (open) {
      window.requestAnimationFrame(() => menuFocusable()[0]?.focus({ preventScroll: true }));
    } else if (restoreFocus && previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }
  }

  if (menu && menuToggle) {
    menu.hidden = false;
    menuToggle.setAttribute('aria-controls', menu.id);
    setMenu(false, false);
    menuToggle.addEventListener('click', () => setMenu(!menuOpen));
    window.addEventListener('resize', () => {
      if (menuOpen && !menuToggle.getClientRects().length) setMenu(false, false);
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a[href], [data-menu-close]')) setMenu(false, false);
    });
    document.addEventListener('keydown', (event) => {
      if (!menuOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false);
      }
      if (event.key !== 'Tab') return;
      const focusable = [menuToggle, ...menuFocusable()];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
  }

  function resolveVideo(button) {
    const selector = button.getAttribute('data-video-target');
    if (selector) {
      try {
        return document.querySelector(selector);
      } catch {
        return null;
      }
    }
    return button.closest('[data-hero-media]')?.querySelector('video') || videos[0];
  }

  function updateVideoButtons(video) {
    const playing = !video.paused && !video.ended;
    videoButtons.forEach((button) => {
      if (resolveVideo(button) !== video) return;
      button.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
      button.setAttribute('aria-pressed', String(playing));
      button.dataset.videoState = playing ? 'playing' : 'paused';
      const label = button.querySelector('[data-video-label]');
      if (label) label.textContent = playing ? 'Pausar filme' : 'Reproduzir filme';
      const symbol = button.querySelector('[aria-hidden="true"]');
      if (symbol) symbol.textContent = playing ? 'Ⅱ' : '▷';
    });
  }

  function syncVideo(video) {
    const state = videoStates.get(video);
    if (!state) return;
    const mayPlay =
      !document.hidden &&
      state.visible &&
      !state.userPaused &&
      (!isReduced() || state.explicitPlayback);

    if (!mayPlay) {
      video.pause();
      updateVideoButtons(video);
      return;
    }
    const playback = video.play();
    playback?.catch(() => updateVideoButtons(video));
  }

  const videoObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const state = videoStates.get(entry.target);
              if (!state) return;
              state.visible = entry.isIntersecting && entry.intersectionRatio > 0.02;
              syncVideo(entry.target);
            });
          },
          { threshold: [0, 0.025, 0.1] }
        )
      : null;

  videos.forEach((video) => {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.muted = true;
    video.playsInline = true;
    videoStates.set(video, {
      visible: isInViewport(video),
      userPaused: false,
      explicitPlayback: false
    });
    if (isReduced()) video.pause();
    video.addEventListener('play', () => updateVideoButtons(video));
    video.addEventListener('pause', () => updateVideoButtons(video));
    video.addEventListener('ended', () => updateVideoButtons(video));
    video.addEventListener('error', () => {
      video.closest('[data-hero-media]')?.classList.add('video-unavailable');
      updateVideoButtons(video);
    });
    videoObserver?.observe(video);
    updateVideoButtons(video);
    syncVideo(video);
  });

  videoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const video = resolveVideo(button);
      const state = videoStates.get(video);
      if (!video || !state) return;
      const wantsPlayback = video.paused || video.ended;
      state.userPaused = !wantsPlayback;
      state.explicitPlayback = wantsPlayback;
      if (wantsPlayback) state.visible = isInViewport(video);
      syncVideo(video);
    });
  });

  document.addEventListener('visibilitychange', () => videos.forEach(syncVideo));

  function applyMotionPreference(source = 'device') {
    updateMotionUI(typeof source === 'string' ? source : 'device');
    if (isReduced()) {
      revealElements.forEach(reveal);
      videos.forEach((video) => {
        const state = videoStates.get(video);
        if (state) state.explicitPlayback = false;
      });
    }
    videos.forEach(syncVideo);
    requestScrollUpdate();
  }

  motionPreference.addEventListener('change', applyMotionPreference);

  motionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const enable = isReduced();
      explicitConsent = enable;
      explicitPause = !enable;
      try {
        window.sessionStorage.setItem('ul_concept_motion', enable ? 'enabled' : 'paused');
      } catch {
        // Keep the explicit choice for the current page if storage is blocked.
      }
      applyMotionPreference('user');

      if (enable) {
        revealElements.forEach((element) => {
          if (!isInViewport(element) && element.getBoundingClientRect().top > 0) {
            element.classList.remove('is-revealed');
            revealObserver?.observe(element);
          }
        });
        // Replay complete headline lines so enabling the concept is observable.
        root.classList.remove('motion-ready');
        void root.offsetWidth;
        root.classList.add('motion-ready');
      }
    });
  });

  window.addEventListener('pagehide', () => videos.forEach((video) => video.pause()));
  window.addEventListener('pageshow', () => {
    try {
      const restoredMotion = window.sessionStorage.getItem('ul_concept_motion');
      explicitConsent = restoredMotion === 'enabled';
      explicitPause = restoredMotion === 'paused';
    } catch {
      // Retain the current page choice if browser storage becomes unavailable.
    }
    updateMotionUI('session');
    if (menuOpen) setMenu(false, false);
    revealElements.forEach((element) => {
      if (isReduced() || isInViewport(element)) reveal(element);
    });
    videos.forEach((video) => {
      const state = videoStates.get(video);
      if (state) state.visible = isInViewport(video);
      syncVideo(video);
    });
    requestScrollUpdate();
  });

  updateScroll();
  root.classList.add('motion-ready');
})();
