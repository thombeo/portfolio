$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceHtml = Join-Path $projectRoot "index.html"
$sourceAbout = Join-Path $projectRoot "about.html"
$sourceWork = Join-Path $projectRoot "work.html"
$sourceContact = Join-Path $projectRoot "contact.html"
$sourcePagesCss = Join-Path $projectRoot "assets\css\portfolio-pages.css"
$sourcePagesJs = Join-Path $projectRoot "assets\js\portfolio-pages.js"
$sourceDataJs = Join-Path $projectRoot "assets\js\data.js"
$sourceAvatar = Join-Path $projectRoot "assets\avatar-nguyen-manh-hung.png"
$sourcePreloadFirst = Join-Path $projectRoot "assets\preload-first.webp"
$sourcePreloadSequence = Join-Path $projectRoot "assets\preload-sequence-12fps.webp"
$sourcePreloadFinal = Join-Path $projectRoot "assets\preload-final.webp"
$sourcePreloadHold = Join-Path $projectRoot "assets\preload-hold.webp"
$serverDirectory = Join-Path $projectRoot "dist\server"
$outputWorker = Join-Path $serverDirectory "index.js"

if (-not (Test-Path -LiteralPath $sourceHtml)) {
  throw "Missing index.html"
}

foreach ($requiredPage in @($sourceAbout, $sourceWork, $sourceContact)) {
  if (-not (Test-Path -LiteralPath $requiredPage)) {
    throw "Missing secondary page: $requiredPage"
  }
}

foreach ($requiredAsset in @($sourcePagesCss, $sourcePagesJs, $sourceDataJs)) {
  if (-not (Test-Path -LiteralPath $requiredAsset)) {
    throw "Missing secondary page asset: $requiredAsset"
  }
}

if (-not (Test-Path -LiteralPath $sourceAvatar)) {
  throw "Missing navigation avatar"
}

if (-not (Test-Path -LiteralPath $sourcePreloadSequence)) {
  throw "Missing preload animation"
}

if (-not (Test-Path -LiteralPath $sourcePreloadFirst)) {
  throw "Missing preload first frame"
}

if (-not (Test-Path -LiteralPath $sourcePreloadFinal)) {
  throw "Missing preload animation"
}

if (-not (Test-Path -LiteralPath $sourcePreloadHold)) {
  throw "Missing preload hold frame"
}

New-Item -ItemType Directory -Force -Path $serverDirectory | Out-Null

$html = [string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceHtml)
$htmlJson = ConvertTo-Json -InputObject $html -Compress
$aboutHtmlJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceAbout)) -Compress
$workHtmlJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceWork)) -Compress
$contactHtmlJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceContact)) -Compress
$pagesCssJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourcePagesCss)) -Compress
$pagesJsJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourcePagesJs)) -Compress
$dataJsJson = ConvertTo-Json -InputObject ([string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceDataJs)) -Compress
$avatarBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourceAvatar))
$preloadFirstBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadFirst))
$preloadSequenceBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadSequence))
$preloadFinalBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadFinal))
$preloadHoldBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadHold))

$workerSource = @"
const html = $htmlJson;
const aboutHtml = $aboutHtmlJson;
const workHtml = $workHtmlJson;
const contactHtml = $contactHtmlJson;
const pagesCss = $pagesCssJson;
const pagesJs = $pagesJsJson;
const dataJs = $dataJsJson;
const avatarImage = "$avatarBase64";
const preloadFirst = "$preloadFirstBase64";
const preloadSequence = "$preloadSequenceBase64";
const preloadFinal = "$preloadFinalBase64";
const preloadHold = "$preloadHoldBase64";

const securityHeaders = {
  "content-security-policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN"
};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const worker = {
  async fetch(request) {
    const url = new URL(request.url);
    const isHead = request.method === "HEAD";

    if (request.method !== "GET" && !isHead) {
      return new Response("Method not allowed", {
        status: 405,
        headers: { allow: "GET, HEAD", ...securityHeaders }
      });
    }

    if (url.pathname === "/assets/avatar-nguyen-manh-hung.png") {
      return new Response(isHead ? null : decodeBase64(avatarImage), {
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": "image/png",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/preload-sequence-12fps.webp") {
      return new Response(isHead ? null : decodeBase64(preloadSequence), {
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": "image/webp",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/preload-first.webp") {
      return new Response(isHead ? null : decodeBase64(preloadFirst), {
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": "image/webp",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/preload-final.webp") {
      return new Response(isHead ? null : decodeBase64(preloadFinal), {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "image/webp",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/preload-hold.webp") {
      return new Response(isHead ? null : decodeBase64(preloadHold), {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "image/webp",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/css/portfolio-pages.css") {
      return new Response(isHead ? null : pagesCss, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/css; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/js/portfolio-pages.js") {
      return new Response(isHead ? null : pagesJs, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/javascript; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/assets/js/data.js") {
      return new Response(isHead ? null : dataJs, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/javascript; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(isHead ? null : html, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/html; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/about" || url.pathname === "/about.html") {
      return new Response(isHead ? null : aboutHtml, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/html; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/work" || url.pathname === "/work.html") {
      return new Response(isHead ? null : workHtml, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/html; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    if (url.pathname === "/contact" || url.pathname === "/contact.html") {
      return new Response(isHead ? null : contactHtml, {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "text/html; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...securityHeaders
      }
    });
  }
};

export default worker;
"@

Set-Content -LiteralPath $outputWorker -Value $workerSource -Encoding UTF8
Write-Output $outputWorker
