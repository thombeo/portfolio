import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const sourceHtml = await readFile(new URL("index.html", projectRoot), "utf8");
const secondaryPages = await Promise.all(
  ["about.html", "work.html", "contact.html"].map(async (file) => ({
    file,
    source: await readFile(new URL(file, projectRoot), "utf8"),
  })),
);
const pagesCss = await readFile(
  new URL("assets/css/portfolio-pages.css", projectRoot),
  "utf8",
);
const pagesJs = await readFile(
  new URL("assets/js/portfolio-pages.js", projectRoot),
  "utf8",
);
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

test("links the four-page navigation to the requested destinations", () => {
  const allPages = [{ file: "index.html", source: sourceHtml }, ...secondaryPages];
  for (const { file, source } of allPages) {
    assert.match(
      source,
      /<a class="brand" href="index\.html"[^>]*>[\s\S]*?<img class="nav-avatar"/,
      `${file} avatar should open index.html`,
    );
    assert.match(source, /<a href="index\.html"[^>]*>Trang chủ<\/a>/);
    assert.match(source, /<a href="about\.html"[^>]*>Giới thiệu<\/a>/);
    assert.match(source, /<a href="work\.html"[^>]*>Dự án<\/a>/);
    assert.match(source, /<a class="nav-cta[^"]*" href="contact\.html"/);
  }
});

test("uses the shared main-page visual system on all secondary pages", () => {
  for (const { file, source } of secondaryPages) {
    assert.match(source, /assets\/css\/portfolio-pages\.css/, `${file} shared CSS`);
    assert.match(source, /class="nav-glass liquid-glass"/, `${file} glass navigation`);
    assert.match(source, /class="footer-glass footer-shell liquid-glass"/, `${file} glass footer`);
    assert.match(source, /assets\/js\/portfolio-pages\.js/, `${file} shared interactions`);

    const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${file} has duplicate IDs`);
  }

  assert.match(pagesCss, /--paper:\s*#f4f4f1/);
  assert.match(pagesCss, /--ink:\s*#111111/);
  assert.match(pagesCss, /font-family:\s*var\(--font\)/);
  assert.match(pagesCss, /backdrop-filter:\s*blur\(24px\)/);
  assert.match(pagesCss, /\.tilt-card/);
  assert.match(pagesJs, /perspective\(900px\) translate3d/);
  assert.match(pagesJs, /prefers-reduced-motion:\s*reduce/);
});

test("preserves project data and accessible contact behavior", () => {
  const workPage = secondaryPages.find(({ file }) => file === "work.html").source;
  const contactPage = secondaryPages.find(({ file }) => file === "contact.html").source;

  assert.match(workPage, /17 dự án đã tham gia/);
  assert.match(workPage, /assets\/js\/data\.js/);
  assert.match(pagesJs, /window\.PORTFOLIO_DATA\?\.projects/);
  assert.match(pagesJs, /aria-expanded/);

  assert.match(contactPage, /tel:0326560268/);
  assert.match(contactPage, /tel:0867893441/);
  assert.match(contactPage, /mailto:thombeohau@gmail\.com/);
  assert.match(contactPage, /id="contact-form"/);
  assert.match(contactPage, /aria-live="polite"/);
  assert.match(pagesJs, /mailto:thombeohau@gmail\.com/);
});

test("auto-expands project cards on hover with a smooth S-curve", () => {
  assert.match(pagesJs, /card\.addEventListener\("pointerenter", \(\) => setCardOpen\(card, true\)\)/);
  assert.match(pagesJs, /card\.addEventListener\("pointerleave", \(\) => setCardOpen\(card, false\)\)/);
  assert.match(pagesJs, /setCardOpen\(card, !card\.classList\.contains\("is-open"\)\)/);
  assert.match(pagesCss, /--s-curve:\s*cubic-bezier\(0\.65, 0, 0\.35, 1\)/);
  assert.match(
    pagesCss,
    /\.project-details\s*\{[\s\S]*?transition:\s*grid-template-rows 760ms var\(--s-curve\)/,
  );
  assert.match(
    pagesCss,
    /\.project-card\.is-open \.project-details-content\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?translateY\(0\)/,
  );
});

test("runs the 12 FPS preload, one-second hold, and upward reveal once per session", () => {
  assert.match(sourceHtml, /id="site-preloader"/);
  assert.match(sourceHtml, /assets\/preload-hold\.webp\?v=1/);
  assert.match(sourceHtml, /Hợp tác vận hành từ hôm nay/);
  assert.match(sourceHtml, /const framesPerSecond = 12/);
  assert.match(sourceHtml, /const sequenceDuration = 7166/);
  assert.match(sourceHtml, /const holdDuration = 1000/);
  assert.match(sourceHtml, /const animationSource = "assets\/preload-final\.webp"/);
  assert.match(sourceHtml, /const storageKey = "portfolio-preloader-played"/);
  assert.match(sourceHtml, /sessionStorage\.getItem\("portfolio-preloader-played"\) === "1"/);
  assert.match(sourceHtml, /sessionStorage\.setItem\(storageKey, "1"\)/);
  assert.match(sourceHtml, /\.preloader-seen \.site-preloader\s*\{[\s\S]*?display:\s*none/);
  assert.match(sourceHtml, /\.site-preloader\.is-exiting[\s\S]*?translate3d\(0, -105%, 0\)/);
  assert.match(
    sourceHtml,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.site-preloader\s*\{[\s\S]*?transition-duration:\s*1\.45s !important/,
  );
  assert.match(sourceHtml, /window\.setTimeout\(removePreloader, 1800\)/);
  assert.match(sourceHtml, /backdrop-filter:\s*blur\(28px\)/);
  assert.match(
    sourceHtml,
    /poster\.src = `\$\{animationSource\}\?play=\$\{Date\.now\(\)\}`/,
  );
  assert.match(sourceHtml, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame/);
  assert.match(sourceHtml, /window\.setTimeout\(holdFinalFrame, sequenceDuration\)/);
});

test("applies interactive 3D hover cards throughout the about page", () => {
  const aboutPage = secondaryPages.find(({ file }) => file === "about.html").source;
  assert.match(aboutPage, /class="hero-note liquid-glass tilt-card"/);
  assert.equal(
    [...aboutPage.matchAll(/class="profile-panel liquid-glass tilt-card"/g)].length,
    2,
  );
  assert.equal(
    [...aboutPage.matchAll(/class="metric-card liquid-glass tilt-card"/g)].length,
    3,
  );
  assert.equal(
    [...aboutPage.matchAll(/class="feature-card liquid-glass tilt-card"/g)].length,
    4,
  );
  assert.match(aboutPage, /class="cta-panel liquid-glass tilt-card"/);
});

test("uses the requested preload-final WebP as the 86-frame animation", async () => {
  const animation = await readFile(
    new URL("assets/preload-final.webp", projectRoot),
  );
  let offset = 12;
  let frameCount = 0;

  while (offset + 8 <= animation.length) {
    const chunkType = animation.toString("ascii", offset, offset + 4);
    const chunkSize = animation.readUInt32LE(offset + 4);
    if (chunkType === "ANMF") frameCount += 1;
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  assert.equal(frameCount, 86);
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

test("serves every portfolio page and shared page asset", async () => {
  const routes = [
    ["/about.html", "text/html; charset=utf-8"],
    ["/work.html", "text/html; charset=utf-8"],
    ["/contact.html", "text/html; charset=utf-8"],
    ["/assets/css/portfolio-pages.css", "text/css; charset=utf-8"],
    ["/assets/js/portfolio-pages.js", "text/javascript; charset=utf-8"],
    ["/assets/js/data.js", "text/javascript; charset=utf-8"],
  ];

  for (const [route, type] of routes) {
    const response = await worker.fetch(new Request(`https://portfolio.test${route}`));
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get("content-type"), type, route);
  }
});

test("returns a clear 404 for unknown routes", async () => {
  const response = await worker.fetch(new Request("https://portfolio.test/missing"));
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

test("serves all WebP preload assets", async () => {
  const [finalResponse, holdResponse] = await Promise.all([
    worker.fetch(
      new Request("https://portfolio.test/assets/preload-final.webp"),
    ),
    worker.fetch(
      new Request("https://portfolio.test/assets/preload-hold.webp"),
    ),
  ]);

  assert.equal(finalResponse.status, 200);
  assert.equal(holdResponse.status, 200);
  assert.equal(finalResponse.headers.get("content-type"), "image/webp");
  assert.equal(holdResponse.headers.get("content-type"), "image/webp");
  assert.ok((await finalResponse.arrayBuffer()).byteLength > 1_000_000);
  assert.ok((await holdResponse.arrayBuffer()).byteLength > 20_000);
});
