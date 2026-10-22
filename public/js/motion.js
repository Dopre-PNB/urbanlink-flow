/**
 * Shared UrbanLink motion — no dependencies, native links stay native.
 * [data-reveal]                 reveals once when it enters the viewport.
 * [data-hero-line] > span       clips a whole headline line into view.
 * [data-hero-media]             receives --hero-travel / --hero-scale.
 * [data-menu-toggle]            opens #site-menu (Escape / focus support).
 * html.motion-enabled          motion is always enabled across the platform.
 * .brand-shared                shared logo for native page transitions.
 * Set --reveal-delay on a reveal or --line-delay on a hero line for a stagger.
 * Videos use autoplay muted loop playsinline, without playback controls.
 * They resume automatically when returning to a visible page. No device or
 * saved session preference switches motion off. New motion hooks are observed.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('motion-enabled');
  root.classList.remove('motion-reduced');
  root.classList.toggle('workspace-motion', document.body.classList.contains('app-page'));
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  const mediaElements = [...document.querySelectorAll('[data-hero-media]')];
  const videos = [
    ...new Set(
      document.querySelectorAll(
        '[data-hero-media] video, video[data-hero-media], video[data-motion-video]'
      )
    )
  ];
  const registeredVideos = new Set();
  let revealObserver;
  let scrollFrame = 0;

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
      if (isInViewport(element)) reveal(element);
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
      const travel = `${(progress * 40).toFixed(2)}px`;
      const scale = (1.035 + progress * 0.045).toFixed(4);
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

  const menu = document.getElementById('site-menu');
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
    const menuSymbol = menuToggle.querySelector('span[aria-hidden="true"]');
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

  function syncVideo(video) {
    if (document.hidden) {
      video.pause();
      return;
    }
    const playback = video.play();
    playback?.catch(() => {
      // Keep the poster visible if the browser cannot start playback.
    });
  }

  function registerVideo(video) {
    if (registeredVideos.has(video)) return;
    registeredVideos.add(video);
    if (!videos.includes(video)) videos.push(video);
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.removeAttribute('controls');
    video.addEventListener('error', () => {
      video.closest('[data-hero-media]')?.classList.add('video-unavailable');
    });
    syncVideo(video);
  }

  videos.forEach(registerVideo);

  document.addEventListener('visibilitychange', () => videos.forEach(syncVideo));

  // Observe only motion hooks; data updates and table rows are never altered.
  const insertionObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        const matches = (selector) => [
          ...(node.matches(selector) ? [node] : []),
          ...node.querySelectorAll(selector)
        ];
        matches('[data-reveal]').forEach((element) => {
          if (revealElements.includes(element)) return;
          revealElements.push(element);
          if (isInViewport(element) || !revealObserver) reveal(element);
          else revealObserver.observe(element);
        });
        matches('[data-hero-media]').forEach((element) => {
          if (!mediaElements.includes(element)) mediaElements.push(element);
        });
        matches('[data-motion-video], [data-hero-media] video, video[data-hero-media]').forEach(
          registerVideo
        );
      });
    });
  });
  insertionObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('pagehide', () => videos.forEach((video) => video.pause()));
  window.addEventListener('pageshow', () => {
    root.classList.add('motion-enabled');
    root.classList.remove('motion-reduced');
    if (menuOpen) setMenu(false, false);
    revealElements.forEach((element) => {
      if (isInViewport(element)) reveal(element);
    });
    videos.forEach(syncVideo);
    requestScrollUpdate();
  });

  updateScroll();
  root.classList.add('motion-ready');
})();
