#Requires -Version 5.1
<#
.SYNOPSIS
Windows smoke test for the two dstack PowerShell scripts. Run it on Windows PowerShell 5.1.

.DESCRIPTION
Covers the user-side checks W01 to W03: both scripts parse, log.ps1 writes UTF-8
without a byte order mark and guards formula cells, and worktree-audit.ps1 prints
its table. Prints one PASS or FAIL line per check.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File tests\windows-smoke.ps1

.NOTES
Exit codes: 0 every check passed, 1 at least one check failed.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$logScript = Join-Path $root 'skills\show-me-your-work\scripts\log.ps1'
$auditScript = Join-Path $root 'skills\d-mode\scripts\worktree-audit.ps1'
$failed = 0

function Write-Check {
    param([string]$Id, [bool]$Ok, [string]$Detail)
    if ($Ok) { Write-Output ('PASS ' + $Id + ' ' + $Detail) }
    else {
        Write-Output ('FAIL ' + $Id + ' ' + $Detail)
        $script:failed++
    }
}

foreach ($path in @($logScript, $auditScript)) {
    $errors = $null
    $tokens = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors)
    Write-Check 'W01' ($errors.Count -eq 0) ('parse ' + (Split-Path -Leaf $path) + ', errors: ' + $errors.Count)
}

$log = Join-Path $env:TEMP ('dstack-smoke-' + [Guid]::NewGuid().ToString('N') + '.tsv')
$hangul = [string][char]0xD55C + [string][char]0xAE00
& powershell -NoProfile -ExecutionPolicy Bypass -File $logScript -LogFile $log -Phase smoke -Decision 'plain row' -Why 'w02' -Evidence 'none' -Result 'ok'
& powershell -NoProfile -ExecutionPolicy Bypass -File $logScript -LogFile $log -Phase smoke -Decision '=SUM(A1)' -Why 'w02' -Evidence 'none' -Result 'ok'
& powershell -NoProfile -ExecutionPolicy Bypass -File $logScript -LogFile $log -Phase smoke -Decision 'dash' -Why 'w02' -Evidence:'-12%' -Result 'ok'
& $logScript -LogFile $log -Phase smoke -Decision $hangul -Why 'w02' -Evidence 'none' -Result 'ok'
$bytes = [System.IO.File]::ReadAllBytes($log)
$text = (New-Object System.Text.UTF8Encoding($false)).GetString($bytes)
$rows = @($text.Split([char]10) | Where-Object { $_ -ne '' })
$tab = [string][char]9
Write-Check 'W02' (-not ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)) 'no byte order mark'
Write-Check 'W02' ($rows.Count -eq 5) ('rows: ' + $rows.Count + ', expected 5')
Write-Check 'W02' ($text.IndexOf([char]13) -lt 0) 'LF row endings'
Write-Check 'W02' ($rows.Count -eq 5 -and $rows[2].Split($tab)[2] -eq "'=SUM(A1)") 'formula cell is quoted'
Write-Check 'W02' ($rows.Count -eq 5 -and $rows[3].Split($tab)[4] -eq "'-12%") 'dash cell is quoted'
Write-Check 'W02' ($rows.Count -eq 5 -and $rows[4].Split($tab)[2] -eq $hangul) 'Hangul cell survives'
Remove-Item -LiteralPath $log -ErrorAction SilentlyContinue

$table = @(& powershell -NoProfile -ExecutionPolicy Bypass -File $auditScript -RepoPath $root -SkipTranscripts)
$auditCode = $LASTEXITCODE
$header = @($table | Where-Object { $_ -like 'SIZE_MB*' })
Write-Check 'W03' ($auditCode -eq 0) ('worktree-audit exit code: ' + $auditCode)
Write-Check 'W03' ($header.Count -eq 1 -and $header[0].Split($tab).Count -eq 8) 'header has 8 columns'

if ($failed -gt 0) {
    Write-Output ('FAIL windows-smoke: ' + $failed + ' check(s)')
    exit 1
}
Write-Output 'PASS windows-smoke'
exit 0
