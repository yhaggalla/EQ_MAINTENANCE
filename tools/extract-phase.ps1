<#
  Prints the exact prompt text for one prompt-pack phase:
  Bootstrap + Master control + the phase block (verbatim from the pack).
  Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\extract-phase.ps1 -Phase P03
  Phases: P00-P13, P01B, P02B, P07B, P08B, R01-R05, R02B, Repair, Resume
#>
param([Parameter(Mandatory = $true)][string]$Phase)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pack = Join-Path $root 'documents\prompt-pack\EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md'
$lines = Get-Content -LiteralPath $pack -Encoding UTF8

function Find-Line([string]$pattern, [int]$from) {
    for ($i = $from; $i -lt $lines.Count; $i++) { if ($lines[$i] -match $pattern) { return $i } }
    return -1
}

function Get-TextBlock([string]$headingPattern) {
    $h = Find-Line $headingPattern 0
    if ($h -lt 0) { throw "Heading not found in pack: $headingPattern" }
    $s = -1
    for ($i = $h + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^```text\s*$') { $s = $i; break }
        if ($lines[$i] -match '^## ') { break }
    }
    if ($s -lt 0) { throw "No text block under heading: $headingPattern" }
    $e = Find-Line '^```\s*$' ($s + 1)
    if ($e -lt 0) { throw "Unclosed text block under heading: $headingPattern" }
    return ($lines[($s + 1)..($e - 1)] -join "`n")
}

function Get-Section([string]$startPattern, [string]$stopPattern) {
    $s = Find-Line $startPattern 0
    $e = Find-Line $stopPattern ($s + 1)
    if ($s -lt 0 -or $e -lt 0) { throw "Section not found: $startPattern" }
    return ($lines[$s..($e - 1)] -join "`n").TrimEnd()
}

$id = $Phase.Trim().ToUpper()
switch -Regex ($id) {
    '^REPAIR$'  { $heading = '^## Repair prompt'; break }
    '^RESUME$'  { $heading = '^## Resume prompt'; break }
    '^[PR]\d\dB?$' { $heading = "^## $id "; break }
    default { throw "Unknown phase '$Phase'. Use P00-P13, P01B, P02B, P07B, P08B, R01-R05, R02B, Repair or Resume." }
}

$phaseText = Get-TextBlock $heading
if ($id -eq 'RESUME') {
    $out = "=== RESUME PROMPT ===`n$phaseText"
} else {
    $boot = Get-TextBlock '^## Bootstrap prompt'
    $master = Get-Section '^## Master control' '^## P00 '
    $out = "=== BOOTSTRAP PROMPT ===`n$boot`n`n=== MASTER CONTROL ===`n$master`n`n=== SELECTED PHASE: $id ===`n$phaseText"
}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output $out
