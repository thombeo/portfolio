import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const sourceHtml = await readFile(new URL("index.html", projectRoot), "utf8");
const workerUrl = new URL("dist/server/index.js", projectRoot);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

test("serves the portfolio as UTF-8 HTML", async () => {
  const response = await worker.fetch(new Request("https://portfolio.test/"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html; charset=utf-8$/i);

  const html = await response.text();
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /Environmental Engineer &amp; PMO Manager/);
  assert.match(html, /<span class="hero-line">Vận hành chuẩn\.<\/span>/);
  assert.match(html, /<span class="hero-line accent">Nghiệm thu rõ\.<\/span>/);
  assert.match(html, /Hạ Long, Quảng Ninh · Việt Nam/);
  assert.match(html, /mailto:thombeohau@gmail\.com/);
});

test("keeps document IDs unique and internal anchors valid", () => {
  const ids = [...sourceHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);

  const anchors = [...sourceHtml.matchAll(/\bhref="#([^"]+)"/g)].map((match) => match[1]);
  for (const anchor of anchors) {
    assert.ok(ids.includes(anchor), `Missing target for #${anchor}`);
  }
});

test("includes responsive and accessible interaction safeguards", () => {
  assert.match(sourceHtml, /aria-label="Điều hướng chính"/);
  assert.match(sourceHtml, /aria-expanded="false"/);
  assert.match(sourceHtml, /:focus-visible/);
  assert.match(sourceHtml, /prefers-reduced-motion:\s*reduce/);
  assert.match(sourceHtml, /prefers-contrast:\s*more/);
  assert.match(sourceHtml, /class="skip-link"/);
});

test("pins the requested animation libraries", () => {
  assert.match(sourceHtml, /gsap@3\.13\.0\/dist\/gsap\.min\.js/);
  assert.match(sourceHtml, /gsap@3\.13\.0\/dist\/ScrollTrigger\.min\.js/);
  assert.match(sourceHtml, /three@0\.180\.0\/build\/three\.module\.js/);
  assert.match(sourceHtml, /new THREE\.WebGLRenderer/);
  assert.match(sourceHtml, /gsap\.registerPlugin\(ScrollTrigger\)/);
});

test("uses a monochrome palette and reduced editorial title scale", () => {
  assert.match(sourceHtml, /--ink:\s*#111111/);
  assert.match(sourceHtml, /--paper:\s*#f4f4f1/);
  assert.match(sourceHtml, /font-size:\s*clamp\(2\.31rem, 4\.785vw, 4\.62rem\)/);
  assert.match(sourceHtml, /vec3 ice = mix\(vec3\(0\.96\), vec3\(0\.42\), lens\)/);
  assert.doesNotMatch(sourceHtml, /#5ca6d2|#24739f|#dff2fc/);
});

test("keeps the editorial hierarchy free of decorative micro-labels", () => {
  assert.doesNotMatch(
    sourceHtml,
    /hero-foot|scroll-cue|hero-index|section-code|card-number|project-number/,
  );
  assert.doesNotMatch(
    sourceHtml,
    /PROFILE \/ 2025|OVERVIEW \/ 01|CAPABILITIES \/ 03|Khám phá hồ sơ/,
  );
  assert.match(sourceHtml, /<div class="footer-glass liquid-glass">/);
});

test("keeps the footer contained and the hero free of background blobs", () => {
  assert.match(sourceHtml, /background:\s*var\(--paper-bright\)/);
  assert.doesNotMatch(sourceHtml, /<canvas class="liquid-canvas"/);
  assert.doesNotMatch(sourceHtml, /\.hero::before/);
});

test("keeps a fixed navigation geometry with the avatar leading the links", () => {
  assert.match(
    sourceHtml,
    /grid-template-columns:\s*auto 1fr auto/,
  );
  assert.match(
    sourceHtml,
    /width:\s*min\(920px, calc\(100vw - 32px\)\)/,
  );
  assert.match(
    sourceHtml,
    /<img class="nav-avatar" src="assets\/avatar-nguyen-manh-hung\.png" alt="">/,
  );
  assert.match(sourceHtml, /\.nav-avatar\s*\{[\s\S]*?width:\s*3rem;[\s\S]*?height:\s*3rem;/);
  assert.doesNotMatch(sourceHtml, /<span class="brand-mark"/);
});

test("runs the 12 FPS preload, three-second hold, and upward reveal", () => {
  assert.match(sourceHtml, /id="site-preloader"/);
  assert.match(sourceHtml, /assets\/preload-sequence-12fps\.webp/);
  assert.match(sourceHtml, /assets\/preload-final\.webp/);
  assert.match(sourceHtml, /Hợp tác vận hành từ hôm nay/);
  assert.match(sourceHtml, /const sequenceDuration = 7167/);
  assert.match(sourceHtml, /const holdDuration = reduceMotion \? 900 : 3000/);
  assert.match(sourceHtml, /\.site-preloader\.is-exiting[\s\S]*?translate3d\(0, -105%, 0\)/);
  assert.match(sourceHtml, /backdrop-filter:\s*blur\(28px\)/);
});

test("uses pointer-responsive 3D card physics without affecting reduced motion", () => {
  assert.match(sourceHtml, /const maxTilt = isContactPanel \? 8 : 16/);
  assert.match(sourceHtml, /const depth = isContactPanel \? 42 : 72/);
  assert.match(sourceHtml, /perspective\(820px\) translate3d/);
  assert.match(sourceHtml, /target\.rx = pointerY \* -maxTilt/);
  assert.match(sourceHtml, /target\.ry = pointerX \* maxTilt/);
  assert.match(
    sourceHtml,
    /const ease = reduceMotion \? 0\.16 : isEntering \? 0\.085 : 0\.095/,
  );
  assert.match(sourceHtml, /if \(unsettled\) \{/);
  assert.match(sourceHtml, /if \(event\.pointerType === "touch"\) return/);
  assert.match(sourceHtml, /card\.style\.zIndex = "12"/);
});

test("returns a clear 404 for routes outside the single page", async () => {
  const response = await worker.fetch(new Request("https://portfolio.test/about"));
  assert.equal(response.status, 404);
});

test("serves the navigation avatar", async () => {
  const response = await worker.fetch(
    new Request("https://portfolio.test/assets/avatar-nguyen-manh-hung.png"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.ok((await response.arrayBuffer()).byteLength > 10_000);
});

test("serves both WebP preload assets", async () => {
  const [sequenceResponse, finalResponse] = await Promise.all([
    worker.fetch(
      new Request("https://portfolio.test/assets/preload-sequence-12fps.webp"),
    ),
    worker.fetch(
      new Request("https://portfolio.test/assets/preload-final.webp"),
    ),
  ]);

  assert.equal(sequenceResponse.status, 200);
  assert.equal(finalResponse.status, 200);
  assert.equal(sequenceResponse.headers.get("content-type"), "image/webp");
  assert.equal(finalResponse.headers.get("content-type"), "image/webp");
  assert.ok((await sequenceResponse.arrayBuffer()).byteLength > 1_000_000);
  assert.ok((await finalResponse.arrayBuffer()).byteLength > 20_000);
});
