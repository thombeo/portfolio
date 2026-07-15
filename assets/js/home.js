/* =========================================================
   home.js — homepage-only enhancements
   · Lenis smooth scroll (synced with GSAP ScrollTrigger)
   · Word-by-word text illumination on scroll
   · 3D "scroll stand" cards that rise upright as you scroll
   Requires: gsap, ScrollTrigger, Lenis (loaded before this script)
   Runs AFTER main.js so ScrollTrigger is already registered.
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';

  /* ------------------------------------------------------------
     1. LENIS SMOOTH SCROLL — synced to the GSAP ticker
     ------------------------------------------------------------ */
  function initLenis() {
    // Skip on touch devices (native momentum is better) or reduced-motion.
    if (!hasLenis || prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });
    window.__lenis = lenis;

    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ------------------------------------------------------------
     2. WORD-BY-WORD TEXT ILLUMINATION
     Each [data-illuminate] paragraph is split into <span> words that
     start dimmed and brighten to full ink as the block scrolls through.
     ------------------------------------------------------------ */
  function initIlluminate() {
    const blocks = $$('[data-illuminate]');
    if (!blocks.length) return;

    blocks.forEach((block) => {
      const words = block.textContent.trim().split(/\s+/);
      block.innerHTML = words
        .map((w) => `<span class="il-word">${w}</span>`)
        .join(' ');

      if (!hasST || prefersReduced) {
        // No scroll engine → just show the text at full strength.
        block.classList.add('is-lit');
        return;
      }

      const wordEls = $$('.il-word', block);
      gsap.set(wordEls, { opacity: 0.18 });

      // Blocks already in the hero (above the fold) illuminate once on load —
      // there's no scroll distance there to scrub through. Blocks further down
      // the page sweep word-by-word tied to the scroll position.
      if (block.closest('[data-hero]')) {
        gsap.to(wordEls, { opacity: 1, ease: 'none', duration: 0.5, stagger: 0.04, delay: 1.1 });
      } else {
        gsap.to(wordEls, {
          opacity: 1,
          ease: 'none',
          stagger: 0.5,
          scrollTrigger: {
            trigger: block,
            start: 'top 82%',
            end: 'bottom 55%',
            scrub: true
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------
     3. 3D "SCROLL STAND" CARDS
     Cards begin tilted back into the floor and rise upright + fade in
     as their grid scrolls up, scrubbed to the scroll position.
     ------------------------------------------------------------ */
  function initScrollStand() {
    const grid = $('[data-stand-grid]');
    if (!grid) return;
    const cards = $$('.stand-card', grid);
    if (!cards.length) return;

    // No scroll engine / reduced-motion → leave cards in their natural,
    // fully-visible CSS state (they aren't hidden by default).
    if (!hasST || prefersReduced) return;

    cards.forEach((card) => {
      gsap.fromTo(card,
        { rotateX: 42, z: -160, y: 90, opacity: 0.15, transformOrigin: 'bottom center' },
        {
          rotateX: 0, z: 0, y: 0, opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom-=80',
            end: 'top center+=60',
            scrub: true
          }
        }
      );
    });
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  function boot() {
    if (hasST) gsap.registerPlugin(ScrollTrigger);
    initLenis();
    initIlluminate();
    initScrollStand();
    // Recompute all trigger positions now that Lenis + new triggers exist.
    if (hasST) ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
