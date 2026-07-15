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

  // The source frames are 1920x1080 with the character occupying only the
  // left-center ~40% of the canvas (lots of empty margin for the original
  // video composition). CHAR_CENTER_X/Y pinpoint the character's on-screen
  // center across the sequence so zooming enlarges it without cropping any
  // pose (standing, crouching, etc.) out of frame.
  const CHAR_CENTER_X = 0.46;
  const CHAR_CENTER_Y = 0.52;
  const CHAR_ZOOM = 1.6;

  function drawFrame(index) {
    const img = frames[Math.max(0, Math.min(TOTAL - 1, index))];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw contain-fit + centered on the character (not stretched, not
    // centered on the empty canvas) so the mascot reads large and centered.
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * CHAR_ZOOM;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = canvas.width / 2 - img.naturalWidth * CHAR_CENTER_X * scale;
    const dy = canvas.height / 2 - img.naturalHeight * CHAR_CENTER_Y * scale;
    ctx.drawImage(img, dx, dy, drawW, drawH);
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

  // The title/stats block stays hidden while the mascot is still falling
  // into place, then rises up and fades in underneath it once the
  // character has settled into its final pose (last 20% of the scrub).
  const HERO_BOTTOM_REVEAL_START = 0.8;

  function updateHeroBottomFade(progress) {
    if (!heroBottom) return;
    const t = Math.max(0, Math.min(1, (progress - HERO_BOTTOM_REVEAL_START) / (1 - HERO_BOTTOM_REVEAL_START)));
    heroBottom.style.opacity = String(t);
    heroBottom.style.transform = `translateY(${(1 - t) * 28}px)`;
  }

  function initNoScrollTriggerFallback() {
    // No GSAP/ScrollTrigger available (e.g. CDN blocked, offline, opened via
    // file://) — draw the final pose statically. Tiles/text are unaffected:
    // they default to fully visible since .hero-anim-ready never gets added.
    section.style.height = 'auto';
    resizeCanvas();
    const finalImg = new Image();
    finalImg.onload = () => {
      frames[TOTAL - 1] = finalImg;
      drawFrame(TOTAL - 1);
    };
    finalImg.src = FRAME_PATH(TOTAL);
    labBg.style.opacity = '1';
  }

  function initScrub() {
    if (!hasGSAP || !window.ScrollTrigger) {
      initNoScrollTriggerFallback();
      return;
    }

    // Only now gate tiles/hero-bottom behind scroll-reveal — from this point
    // on onUpdate is guaranteed to run and take over their visibility.
    document.documentElement.classList.add('hero-anim-ready');

    const onScrubUpdate = (self) => {
      const frameIndex = Math.round(self.progress * (TOTAL - 1));
      drawFrame(frameIndex);
      updateLabBgVisibility(frameIndex);
      updateShakeState(self.progress);
      updateTilesReveal(self.progress);
      updateHeroBottomFade(self.progress);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.hero',
      scrub: 0.4,
      onUpdate: onScrubUpdate
    });

    // Force one synchronous pass at the current scroll position — ScrollTrigger
    // doesn't always fire onUpdate on creation, and without this tiles/text
    // stay stuck in their initial hidden state until the user scrolls.
    onScrubUpdate(trigger);

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
