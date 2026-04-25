$serverRoot = Join-Path (Split-Path -Parent $PSScriptRoot) "server"
$serverEntry = Join-Path $serverRoot "index.mjs"
$configDir = Join-Path $HOME ".asd-friendly-extension"
$configPath = Join-Path $configDir "server.env.local"
$fallbackConfigPath = Join-Path $serverRoot ".env.local"
$exampleConfigPath = Join-Path $serverRoot ".env.local.example"

if (-not (Test-Path -LiteralPath $serverEntry)) {
  throw "Server entry was not found: $serverEntry"
}

function Get-EnvValueFromFile {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path -LiteralPath $FilePath)) {
    return ""
  }

  foreach ($line in Get-Content -LiteralPath $FilePath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf("=")
    if ($separatorIndex -lt 0) {
      continue
    }

    $currentKey = $trimmed.Substring(0, $separatorIndex).Trim()
    if ($currentKey -ne $Key) {
      continue
    }

    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    return $value.Trim("'`"")
  }

  return ""
}

function Convert-SecureStringToPlainText {
  param(
    [Security.SecureString]$SecureValue
  )

  if ($null -eq $SecureValue) {
    return ""
  }

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

$configuredApiKey = if ($env:OPENAI_API_KEY) {
  $env:OPENAI_API_KEY
} else {
  $externalApiKey = Get-EnvValueFromFile -FilePath $configPath -Key "OPENAI_API_KEY"
  if ($externalApiKey) {
    $externalApiKey
  } else {
    Get-EnvValueFromFile -FilePath $fallbackConfigPath -Key "OPENAI_API_KEY"
  }
}

if (-not $configuredApiKey) {
  Write-Host "OPENAI_API_KEY is not configured yet."
  Write-Host "Enter it in this console to use it for this launch only."
  Write-Host "Press Enter without typing anything to start without a key."

  $secureApiKey = Read-Host "OpenAI API key" -AsSecureString
  $enteredApiKey = Convert-SecureStringToPlainText -SecureValue $secureApiKey

  if ($enteredApiKey) {
    $env:OPENAI_API_KEY = $enteredApiKey
    Write-Host "Using the entered API key for this backend launch."
  } else {
    Write-Host "Starting the backend without an API key."
  }
}

Start-Process -FilePath "node" -ArgumentList $serverEntry -WorkingDirectory $serverRoot

Write-Host "Started the local OpenAI backend."
Write-Host "Server root:" $serverRoot
Write-Host "Preferred config:" $configPath
if (Test-Path -LiteralPath $fallbackConfigPath) {
  Write-Host "Fallback config still exists:" $fallbackConfigPath
} elseif (-not (Test-Path -LiteralPath $configPath)) {
  Write-Host "Config template:" $exampleConfigPath
}
Write-Host "Health check:" "http://127.0.0.1:8787/health"
