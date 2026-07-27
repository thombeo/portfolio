$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceHtml = Join-Path $projectRoot "index.html"
$sourceAvatar = Join-Path $projectRoot "assets\avatar-nguyen-manh-hung.png"
$sourcePreloadFirst = Join-Path $projectRoot "assets\preload-first.webp"
$sourcePreloadSequence = Join-Path $projectRoot "assets\preload-sequence-12fps.webp"
$sourcePreloadFinal = Join-Path $projectRoot "assets\preload-final.webp"
$serverDirectory = Join-Path $projectRoot "dist\server"
$outputWorker = Join-Path $serverDirectory "index.js"

if (-not (Test-Path -LiteralPath $sourceHtml)) {
  throw "Missing index.html"
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
  throw "Missing preload final frame"
}

New-Item -ItemType Directory -Force -Path $serverDirectory | Out-Null

$html = [string](Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceHtml)
$htmlJson = ConvertTo-Json -InputObject $html -Compress
$avatarBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourceAvatar))
$preloadFirstBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadFirst))
$preloadSequenceBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadSequence))
$preloadFinalBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePreloadFinal))

$workerSource = @"
const html = $htmlJson;
const avatarImage = "$avatarBase64";
const preloadFirst = "$preloadFirstBase64";
const preloadSequence = "$preloadSequenceBase64";
const preloadFinal = "$preloadFinalBase64";

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
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": "image/webp",
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
