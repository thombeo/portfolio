/* =========================================================
   lab-hero.js — scroll-scrubbed mascot sequence (home hero only)
   Requires: gsap, ScrollTrigger (loaded before this script)
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  const stage = $('[data-mascot-stage]');
  const canvas = $('[data-lab-canvas]');
  const labBg = $('[data-lab-bg]');
  const section = $('[data-lab-section]');
  const heroBottom = $('[data-hero-bottom]');
  const tiles = Array.from(document.querySelectorAll('[data-hero-tiles] .hero-tile'));

  if (!stage || !canvas || !labBg || !section) return;

  const TOTAL = 90;
  const FRAME_PATH = (i) => `assets/lab/char/frame-${String(i).padStart(3, '0')}.webp`;
  // Determined by inspecting the extracted frame sequence: frame 41 is the
  // first frame composited into the lab set (impact/landing), frame 80 is
  // where the character has fully settled into the final standing pose.
  const LAB_BG_ENTER_FRAME = 41;
  const SHAKE_START = 41;
  const SHAKE_END = 80;

  const ctx = canvas.getContext('2d');
  const frames = [];
  let loadedCount = 0;
  let ready = false;

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  function drawFrame(index) {
    const img = frames[Math.max(0, Math.min(TOTAL - 1, index))];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function preloadFrames(onDone) {
    for (let i = 1; i <= TOTAL; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (i === 1) { resizeCanvas(); drawFrame(0); }
        if (loadedCount === TOTAL) onDone();
      };
      img.src = FRAME_PATH(i);
      frames[i - 1] = img;
    }
  }

  function updateLabBgVisibility(frameIndex) {
    labBg.style.opacity = frameIndex >= LAB_BG_ENTER_FRAME ? '1' : '0';
  }

  // Deterministic (not random) so the shake reverses cleanly on scroll-up.
  function updateShakeState(progress) {
    const frameIndex = progress * (TOTAL - 1);
    if (frameIndex < SHAKE_START || frameIndex >= SHAKE_END) {
      labBg.style.transform = '';
      return;
    }
    const t = frameIndex - SHAKE_START;
    const decay = 1 - t / (SHAKE_END - SHAKE_START);
    const amp = 5 * decay * decay;
    const dx = Math.sin(t * 2.3) * amp;
    const dy = Math.cos(t * 3.1) * amp * 0.5;
    labBg.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
  }

  let tilesVisible = false;
  function updateTilesReveal(progress) {
    const shouldShow = progress >= 0.95;
    if (shouldShow === tilesVisible) return;
    tilesVisible = shouldShow;
    tiles.forEach((tile) => tile.classList.toggle('is-visible', shouldShow));
    if (hasGSAP && !prefersReduced) {
      gsap.fromTo(tiles,
        { y: shouldShow ? 20 : 0 },
        { y: 0, duration: 0.5, stagger: shouldShow ? 0.08 : 0, ease: 'power3.out', overwrite: true }
      );
    }
  }

  function updateHeroBottomFade(progress) {
    if (!heroBottom) return;
    const t = Math.max(0, Math.min(1, progress / 0.15));
    heroBottom.style.opacity = String(1 - t);
  }

  function initNoScrollTriggerFallback() {
    // No GSAP/ScrollTrigger available at all — draw the final pose statically.
    section.style.height = 'auto';
    resizeCanvas();
    const finalImg = new Image();
    finalImg.onload = () => {
      frames[TOTAL - 1] = finalImg;
      drawFrame(TOTAL - 1);
    };
    finalImg.src = FRAME_PATH(TOTAL);
    labBg.style.opacity = '1';
    tiles.forEach((tile) => tile.classList.add('is-visible'));
    if (heroBottom) heroBottom.style.opacity = '1';
  }

  function initScrub() {
    if (!hasGSAP || !window.ScrollTrigger) {
      initNoScrollTriggerFallback();
      return;
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.hero',
      scrub: 0.4,
      onUpdate: (self) => {
        const frameIndex = Math.round(self.progress * (TOTAL - 1));
        drawFrame(frameIndex);
        updateLabBgVisibility(frameIndex);
        updateShakeState(self.progress);
        updateTilesReveal(self.progress);
        updateHeroBottomFade(self.progress);
      }
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        ScrollTrigger.refresh();
      }, 150);
    });
  }

  function initSiteBgZoom() {
    const bgImg = $('.site-bg img');
    if (!bgImg || !hasGSAP || !window.ScrollTrigger) return;
    gsap.set(bgImg, { scale: 1 });
    gsap.to(bgImg, {
      scale: 1.22,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.5 }
    });
  }

  function boot() {
    // The mascot scroll sequence is the page's primary content, not a
    // decorative flourish — it always runs, regardless of the reduced-motion
    // preference. Secondary polish (tile stagger tween, site-bg zoom) still
    // checks prefersReduced individually below.
    preloadFrames(() => { ready = true; });
    resizeCanvas();
    initScrub();
    initSiteBgZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
