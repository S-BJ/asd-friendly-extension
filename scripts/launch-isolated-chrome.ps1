param(
  [string]$StartUrl = "https://example.com/",
  [switch]$ResetProfile,
  [ValidateSet("auto", "chrome-for-testing", "edge", "chrome", "brave")]
  [string]$Browser = "auto",
  [int]$RemoteDebuggingPort = 0,
  [ValidatePattern('^\.chrome-test-profile')]
  [string]$ProfileName = ".chrome-test-profile"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$extensionRoot = Join-Path $projectRoot "dist\extension"
$profileDir = Join-Path $projectRoot $ProfileName
$chromeForTestingCandidates = @(
  "C:\Program Files\Google\Chrome for Testing\Application\chrome.exe"
)
$edgeCandidates = @(
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)
$chromeCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
$braveCandidates = @(
  "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
  "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
  (Join-Path $env:LOCALAPPDATA "BraveSoftware\Brave-Browser\Application\brave.exe")
)

switch ($Browser) {
  "chrome-for-testing" { $browserCandidates = $chromeForTestingCandidates }
  "edge" { $browserCandidates = $edgeCandidates }
  "chrome" { $browserCandidates = $chromeCandidates }
  "brave" { $browserCandidates = $braveCandidates }
  default { $browserCandidates = @($chromeForTestingCandidates + $edgeCandidates + $chromeCandidates + $braveCandidates) }
}

$browserPath = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $browserPath) {
  throw "Could not find a Chrome or Edge executable."
}

if (-not (Test-Path -LiteralPath (Join-Path $extensionRoot "manifest.json"))) {
  Write-Host "Built extension output was not found. Running build first."
  Push-Location -LiteralPath $projectRoot
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $extensionRoot "manifest.json"))) {
  throw "manifest.json was not found in the extension output: $extensionRoot"
}

if ($ResetProfile -and (Test-Path -LiteralPath $profileDir)) {
  $resolvedProjectRoot = [System.IO.Path]::GetFullPath($projectRoot)
  $resolvedProfileDir = [System.IO.Path]::GetFullPath($profileDir)
  $leaf = Split-Path -Leaf $resolvedProfileDir

  if (-not $resolvedProfileDir.StartsWith($resolvedProjectRoot + [System.IO.Path]::DirectorySeparatorChar) -or $leaf -notlike ".chrome-test-profile*") {
    throw "Profile deletion path validation failed: $resolvedProfileDir"
  }

  Remove-Item -LiteralPath $profileDir -Recurse -Force
}

if (-not (Test-Path -LiteralPath $profileDir)) {
  New-Item -ItemType Directory -Path $profileDir | Out-Null
}

$arguments = @(
  "--user-data-dir=$profileDir",
  "--disable-extensions-except=$extensionRoot",
  "--load-extension=$extensionRoot",
  "--no-first-run",
  "--no-default-browser-check",
  "--new-window",
  "chrome://extensions/",
  $StartUrl
)

if ($RemoteDebuggingPort -gt 0) {
  $arguments += "--remote-debugging-port=$RemoteDebuggingPort"
}

Start-Process -FilePath $browserPath -ArgumentList $arguments | Out-Null

Write-Host "Launched browser with isolated profile."
Write-Host "Browser mode:" $Browser
Write-Host "Browser:" $browserPath
Write-Host "Extension path:" $extensionRoot
Write-Host "Profile path:" $profileDir
if ($browserPath -match "Google\\Chrome\\Application\\chrome\.exe$") {
  Write-Host "Note: if the extension does not appear in recent stable Chrome, rerun with -Browser edge or install Chrome for Testing."
}
