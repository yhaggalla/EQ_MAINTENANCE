<#
  Starts a FRESH interactive Claude Code session for one phase, with the
  model and effort taken from documents\prompt-pack\reference\phase-model-settings.json.
  Examples:
    .\tools\run-phase.ps1 P00
    .\tools\run-phase.ps1 R01
    .\tools\run-phase.ps1 Repair -Affected R03 -Report docs\evidence\R03\review-20261105-1030.md
    .\tools\run-phase.ps1 Resume
#>
param(
    [Parameter(Mandatory = $true, Position = 0)][string]$Phase,
    [string]$Affected = '',
    [string]$Report = '',
    [string]$PortalDir = 'F:\CODEX\CICT-ENG_MAIN_PAGE'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "Claude Code is not installed or not on PATH." -ForegroundColor Yellow
    Write-Host "Install it:   irm https://claude.ai/install.ps1 | iex"
    Write-Host "Then open a NEW PowerShell window, run 'claude --version', then run this script again."
    exit 1
}

$settingsPath = Join-Path $root 'documents\prompt-pack\reference\phase-model-settings.json'
$settings = Get-Content -Raw -Encoding UTF8 $settingsPath | ConvertFrom-Json
$rank = @{ low = 1; medium = 2; high = 3; xhigh = 4; max = 5 }

function Get-Prof([string]$name) {
    $p = $settings.profiles | Where-Object { $_.phase -ieq $name } | Select-Object -First 1
    if (-not $p) { throw "No profile for '$name' in phase-model-settings.json" }
    return $p.claudeCode
}

$id = $Phase.Trim().ToUpper()
$prof = Get-Prof $id
if ($id -eq 'REPAIR' -and $Affected) {
    # Repair inherits the affected phase/review profile when it is stronger.
    $aff = Get-Prof $Affected
    if ($rank[$aff.effort] -gt $rank[$prof.effort]) { $prof = $aff }
}

$text = & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'extract-phase.ps1') -Phase $id
$text = $text -join "`n"
if ($id -eq 'REPAIR') {
    if (-not $Affected -or -not $Report) { throw 'Repair needs -Affected <phase/review> and -Report <path to failed review report>.' }
    $text += "`n`n=== REPAIR TARGET ===`nAffected phase/review: $Affected`nFailed review report: $Report`nFix the blocking findings in that report, then stop. The review is repeated separately."
}
if ($id -match '^R\d\d$') {
    $text += "`n`n=== RUNNER NOTE ===`nThis is a read-only review. Do not modify project files, except: save your full report to docs\evidence\$id\review-<yyyyMMdd-HHmm>.md and append one line with the verdict to docs\IMPLEMENTATION_STATUS.md. End the report with 'VERDICT: PASS' or 'VERDICT: NEEDS FIXES'."
}

$runDir = Join-Path $root 'docs\runs'
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$promptFile = Join-Path $runDir "$id-$stamp.md"
$header = "Runner: tools\run-phase.ps1 | Claude Code main session | model $($prof.model) | effort $($prof.effort)`n`n"
Set-Content -LiteralPath $promptFile -Value ($header + $text) -Encoding UTF8
$rel = "docs\runs\$id-$stamp.md"

Write-Host "Phase   : $id" -ForegroundColor Cyan
Write-Host "Model   : $($prof.model)"
Write-Host "Effort  : $($prof.effort)"
Write-Host "Prompt  : $rel"

$initial = "Read $rel and carry out the instructions in it exactly, as if I had pasted them into this chat. This session's model is $($prof.model) with effort $($prof.effort); record that in the handover. Execute only phase $id, then stop."
$cliArgs = @($initial, '--model', $prof.model, '--effort', $prof.effort)
if (Test-Path $PortalDir) { $cliArgs += @('--add-dir', $PortalDir) }
else { Write-Warning "Portal folder not found at $PortalDir - P00/P05 and R03 need it." }

& claude @cliArgs
