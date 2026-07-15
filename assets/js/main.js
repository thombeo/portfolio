/* =========================================================
   main.js — shared behavior for all pages
   Requires: gsap, ScrollTrigger, icons.js, data.js
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const DATA = window.PORTFOLIO_DATA || {};
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------
     Utility
     ------------------------------------------------------------ */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (str = '') => String(str).replace(/[&<>"']/g, (m) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
  ));

  /* ============================================================
     NAV — scrolled state + mobile menu
     ============================================================ */
  function initNav() {
    const nav = $('.nav');
    const toggle = $('.nav-toggle');
    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (toggle) {
      toggle.addEventListener('click', () => document.body.classList.toggle('menu-open'));
      $$('.nav-links a').forEach((a) =>
        a.addEventListener('click', () => document.body.classList.remove('menu-open'))
      );
    }
  }

  /* ============================================================
     SCROLL PROGRESS BAR
     ============================================================ */
  function initProgress() {
    const bar = $('.scroll-progress');
    if (!bar) return;
    if (hasGSAP && window.ScrollTrigger) {
      gsap.to(bar, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
      });
    } else {
      const upd = () => {
        const h = document.documentElement;
        bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight) || 0})`;
      };
      window.addEventListener('scroll', upd, { passive: true });
    }
  }

  /* ============================================================
     PAGE TRANSITIONS (intercept internal links)
     ============================================================ */
  function initTransitions() {
    const overlay = $('.page-transition');
    // reveal-in
    if (overlay && hasGSAP && !prefersReduced) {
      const label = $('.pt-label', overlay);
      gsap.set(overlay, { yPercent: 0 });
      const tl = gsap.timeline();
      if (label) tl.set(label, { opacity: 1, y: 0 });
      tl.to(overlay, { yPercent: -100, duration: 0.75, ease: 'power4.inOut', delay: 0.05 })
        .set(overlay, { yPercent: 100 });
      if (label) tl.set(label, { opacity: 0 }, 0.5);
    }
    if (!overlay || prefersReduced || !hasGSAP) return;

    $$('a[data-transition]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.target === '_blank') return;
        e.preventDefault();
        const label = $('.pt-label', overlay);
        const tl = gsap.timeline({ onComplete: () => (window.location.href = href) });
        tl.set(overlay, { yPercent: 100 })
          .to(overlay, { yPercent: 0, duration: 0.55, ease: 'power4.inOut' });
        if (label) tl.fromTo(label, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.2);
      });
    });
  }

  /* ============================================================
     S-CURVE animated draw + shapes parallax
     ============================================================ */
  function initSCurves() {
    if (!hasGSAP) return;
    $$('.scurve path').forEach((path) => {
      const len = path.getTotalLength ? path.getTotalLength() : 1000;
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      if (prefersReduced || !window.ScrollTrigger) {
        gsap.set(path, { strokeDashoffset: 0 });
        return;
      }
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: path.closest('section') || path,
          start: 'top 85%',
          end: 'bottom 20%',
          scrub: 1
        }
      });
    });

    if (!prefersReduced && window.ScrollTrigger) {
      $$('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        gsap.to(el, {
          y: () => speed * 240,
          ease: 'none',
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
      });
    }
  }

  /* ============================================================
     ENTRANCE / REVEAL animations
     ============================================================ */
  const fmtNum = (n) => Math.round(n).toLocaleString('vi-VN');

  function fillCounters() {
    // Always write the final value first — guarantees a number even with
    // reduced-motion or if GSAP/ScrollTrigger is unavailable.
    $$('[data-count]').forEach((el) => { el.textContent = fmtNum(parseFloat(el.dataset.count) || 0); });
  }

  function initReveals() {
    fillCounters();
    if (!hasGSAP) { $$('.reveal').forEach((el) => (el.style.opacity = 1)); return; }
    if (prefersReduced) {
      gsap.set('.reveal, [data-reveal], .line-mask > span', { opacity: 1, y: 0, clearProps: 'all' });
      return;
    }

    // Split-line headings (masked lines already in markup).
    // Skip any inside [data-hero] — those are owned by initHeroIntro to avoid double-animation.
    $$('[data-reveal="lines"]').forEach((el) => {
      if (el.closest('[data-hero]')) return;
      const spans = $$('.line-mask > span', el);
      gsap.set(spans, { yPercent: 115 });
      gsap.set(el, { opacity: 1 });
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.12 })
      });
    });

    // Fade-up single elements
    $$('[data-reveal="up"], .reveal:not([data-reveal])').forEach((el) => {
      gsap.set(el, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
      });
    });

    // Staggered groups
    $$('[data-reveal="stagger"]').forEach((group) => {
      const items = group.children;
      gsap.set(items, { opacity: 0, y: 46 });
      ScrollTrigger.create({
        trigger: group, start: 'top 82%', once: true,
        onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09 })
      });
    });

    // Image entrance — clip + scale
    $$('[data-reveal="image"]').forEach((el) => {
      const img = el.querySelector('img') || el;
      gsap.set(el, { clipPath: 'inset(12% 12% 12% 12% round 24px)', opacity: 0 });
      gsap.set(img, { scale: 1.25 });
      ScrollTrigger.create({
        trigger: el, start: 'top 84%', once: true,
        onEnter: () => {
          gsap.to(el, { clipPath: 'inset(0% 0% 0% 0% round 24px)', opacity: 1, duration: 1.1, ease: 'power4.out' });
          gsap.to(img, { scale: 1.06, duration: 1.4, ease: 'power3.out' });
        }
      });
    });

    // Counter numbers — animate 0 → target (value already filled by fillCounters)
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.fromTo(obj, { v: 0 }, {
          v: target, duration: 1.6, ease: 'power2.out',
          onUpdate: () => { el.textContent = fmtNum(obj.v); }
        })
      });
    });
  }

  /* ============================================================
     HERO intro timeline (home)
     ============================================================ */
  function initHeroIntro() {
    const hero = $('[data-hero]');
    if (!hero || !hasGSAP || prefersReduced) return;
    const tl = gsap.timeline({ delay: 0.7, defaults: { ease: 'power4.out' } });
    const lines = $$('.hero-title .line-mask > span');
    gsap.set('.hero-title', { opacity: 1 });
    gsap.set(lines, { yPercent: 115 });
    tl.from('[data-hero-badge]', { y: 20, opacity: 0, duration: 0.6 })
      .to(lines, { yPercent: 0, duration: 1, stagger: 0.1 }, '-=0.2')
      .from('[data-hero-cta] > *', { y: 22, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
      .from('[data-hero-stats] .hero-stat, [data-hero-stats] .hero-stat-div', { y: 18, opacity: 0, duration: 0.55, stagger: 0.07 }, '-=0.4')
      .from('.hero-scroll', { opacity: 0, duration: 0.6 }, '-=0.2');
    // Note: [data-illuminate] lead + [data-reveal] tiles are handled by
    // home.js / initReveals so they aren't double-driven here.
  }

  /* ============================================================
     MARQUEE loop
     ============================================================ */
  function initMarquee() {
    $$('.marquee-track').forEach((track) => {
      // duplicate content for seamless loop
      track.innerHTML += track.innerHTML;
      if (!hasGSAP || prefersReduced) return;
      const dir = track.dataset.dir === 'right' ? 1 : -1;
      const total = track.scrollWidth / 2;
      gsap.to(track, {
        x: dir * -total, duration: total / 45, ease: 'none', repeat: -1,
        modifiers: { x: (x) => `${(parseFloat(x) % total)}px` }
      });
    });
  }

  /* ============================================================
     MAGNETIC buttons + custom cursor dot
     ============================================================ */
  function initMagnetic() {
    if (prefersReduced || !hasGSAP || window.matchMedia('(pointer: coarse)').matches) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }));
    });
  }

  function initCursor() {
    if (prefersReduced || window.matchMedia('(pointer: coarse)').matches || !hasGSAP) return;
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
    Object.assign(dot.style, {
      position: 'fixed', top: 0, left: 0, width: '34px', height: '34px', borderRadius: '50%',
      border: '1.5px solid var(--accent)', pointerEvents: 'none', zIndex: 9998,
      transform: 'translate(-50%, -50%)', opacity: 0, transition: 'opacity .3s, width .3s, height .3s, background .3s'
    });
    const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { dot.style.opacity = 1; xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('mouseleave', () => (dot.style.opacity = 0));
    $$('a, button, [data-hover]').forEach((el) => {
      el.addEventListener('mouseenter', () => { dot.style.width = '52px'; dot.style.height = '52px'; dot.style.background = 'var(--accent-glow)'; });
      el.addEventListener('mouseleave', () => { dot.style.width = '34px'; dot.style.height = '34px'; dot.style.background = 'transparent'; });
    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    initNav();
    initProgress();
    initTransitions();
    // let page-specific render run first (it may inject reveal targets)
    if (typeof window.__renderPage === 'function') window.__renderPage(DATA, { icon, esc, $, $$ });
    initSCurves();
    initReveals();
    initHeroIntro();
    initMarquee();
    initMagnetic();
    initCursor();
    if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // expose for page scripts
  window.__portfolio = { $, $$, icon, esc, DATA, hasGSAP, prefersReduced };
})();
