<#
  Starts the local EQ & FAC Maintenance demo (synthetic prototype, 127.0.0.1 only).
  At startup choose what to open:
    1  Full demo app  - http://127.0.0.1:5312/  (temporary Portal login -> launcher -> EQ/FAC; after the
                        U1 wrapper cleanup the same URL opens EQ/FAC directly)
    2  3D model only  - the shared crane viewer on the QC equipment page, opened in 3D (read-only Management view)
  Examples:
    .\tools\start-demo.ps1                 # asks which mode
    .\tools\start-demo.ps1 -Mode Full
    .\tools\start-demo.ps1 -Mode 3D -Equipment eq-qc-demo-02
    .\tools\start-demo.ps1 -Mode 3D -NoBrowser
  Press Ctrl+C in this window to stop the server.
#>
param(
    [ValidateSet('', 'Full', '3D')][string]$Mode = '',
    [ValidateSet('eq-qc-demo-01', 'eq-qc-demo-02')][string]$Equipment = 'eq-qc-demo-01',
    [int]$Port = 5312,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'artifacts\prototypes\p02-ui\serve.mjs'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed or not on PATH. Install Node.js 20 or later, then run this script again." -ForegroundColor Yellow
    exit 1
}

if (-not $Mode) {
    Write-Host ''
    Write-Host 'CICT EQ & FAC Maintenance - local demo' -ForegroundColor Cyan
    Write-Host '  1  Full demo app (Portal login, launcher, EQ and FAC)'
    Write-Host '  2  3D model only (QC crane viewer)'
    Write-Host ''
    do { $choice = (Read-Host 'Select 1 or 2 [1]').Trim() } until ($choice -in '', '1', '2')
    $Mode = if ($choice -eq '2') { '3D' } else { 'Full' }
}

$base = "http://127.0.0.1:$Port"
$url = if ($Mode -eq '3D') { "$base/index.html?role=management#/eq/equipment/$Equipment`?view=3d" } else { "$base/" }

function Test-Demo {
    try { (Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 2 "$base/index.html").StatusCode -eq 200 } catch { $false }
}

$listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    if (Test-Demo) {
        Write-Host "The demo server is already running on $base (process $($listening[0].OwningProcess))." -ForegroundColor Green
        if (-not $NoBrowser) { Start-Process $url }
        Write-Host "Open: $url" -ForegroundColor Green
        exit 0
    }
    Write-Host "Port $Port is used by another program (process $($listening[0].OwningProcess)). Close it or use -Port <n>." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting the demo server on $base ($Mode mode). Press Ctrl+C to stop." -ForegroundColor Cyan
$proc = Start-Process node -ArgumentList "`"$server`"", $Port -WorkingDirectory $root -NoNewWindow -PassThru
try {
    $ready = $false
    for ($i = 0; $i -lt 40 -and -not $proc.HasExited; $i++) {
        if (Test-Demo) { $ready = $true; break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { Write-Host 'The demo server did not start.' -ForegroundColor Yellow; exit 1 }
    if (-not $NoBrowser) { Start-Process $url }
    Write-Host "Open: $url" -ForegroundColor Green
    $proc.WaitForExit()
}
finally {
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force; Write-Host 'Demo server stopped.' }
}
