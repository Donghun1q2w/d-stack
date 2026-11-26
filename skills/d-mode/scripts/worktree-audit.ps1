#Requires -Version 5.1
<#
.SYNOPSIS
Read-only worktree prune audit for Windows PowerShell 5.1.

.DESCRIPTION
Classifies every git worktree by size, age, merge state, uncommitted work,
push state, and the newest Claude Code session transcript that names it.
Prints a tab-separated table sorted by size with a suggested bucket.
Never deletes anything. Deletion stays a human-gated step in the playbook.

.PARAMETER Base
Ref the MERGED column checks against, for example origin/integration.
Default: origin/HEAD, then origin/main, then origin/master.

.PARAMETER RepoPath
Repository to audit. Default: the repository of the current directory.

.PARAMETER RecentDays
A transcript newer than this many days puts the worktree in verify-recent-chat.

.PARAMETER TranscriptsRoot
Folder that holds one transcript folder per workspace.
Default: %USERPROFILE%\.claude\projects.

.PARAMETER SkipTranscripts
Skip the transcript scan. LAST_CHAT prints "-" for every row.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File worktree-audit.ps1 -Base origin/main

.NOTES
Exit codes: 0 table printed, 1 not a repository or no base ref.
#>
[CmdletBinding()]
param(
    [Alias('b')]
    [string]$Base = '',
    [Parameter(Position = 0)]
    [string]$RepoPath = '',
    [ValidateRange(0, 3650)]
    [int]$RecentDays = 4,
    [string]$TranscriptsRoot = '',
    [switch]$SkipTranscripts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([string[]]$GitArgs)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git @GitArgs 2>$null
        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }
    $lines = @()
    if ($null -ne $output) { $lines = @($output | ForEach-Object { [string]$_ }) }
    return New-Object psobject -Property @{ Code = $code; Lines = $lines }
}

function Get-FirstLine {
    param($Result)
    if ($Result.Code -ne 0 -or $Result.Lines.Count -eq 0) { return '' }
    return $Result.Lines[0].Trim()
}

function Write-Warn {
    param([string]$Message)
    [Console]::Error.WriteLine($Message)
}

function Stop-Audit {
    param([string]$Message)
    [Console]::Error.WriteLine($Message)
    exit 1
}

if ($RepoPath -eq '') {
    $RepoPath = Get-FirstLine (Invoke-Git @('rev-parse', '--show-toplevel'))
    if ($RepoPath -eq '') { Stop-Audit 'not in a git repo; pass -RepoPath' }
}
if (-not (Test-Path -LiteralPath $RepoPath -PathType Container)) { Stop-Audit "error: not a folder: $RepoPath" }
Set-Location -LiteralPath $RepoPath
if ((Invoke-Git @('rev-parse', '--git-dir')).Code -ne 0) { Stop-Audit "error: not a git repo: $RepoPath" }

$worktrees = @()
foreach ($line in (Invoke-Git @('worktree', 'list', '--porcelain')).Lines) {
    if ($line.StartsWith('worktree ')) { $worktrees += $line.Substring(9) }
}
if ($worktrees.Count -eq 0) { Stop-Audit 'error: git worktree list printed no worktrees' }
$mainWorktree = $worktrees[0]

if ($Base -eq '') {
    $candidates = @((Get-FirstLine (Invoke-Git @('symbolic-ref', '--short', 'refs/remotes/origin/HEAD'))), 'origin/main', 'origin/master')
    foreach ($candidate in $candidates) {
        if ($candidate -eq '') { continue }
        if ((Invoke-Git @('rev-parse', '--verify', '--quiet', ($candidate + '^{commit}'))).Code -eq 0) {
            $Base = $candidate
            break
        }
    }
    if ($Base -eq '') { Stop-Audit 'error: no base ref (origin/HEAD, origin/main, origin/master all missing); pass -Base <ref>' }
    Write-Warn "warn: no -Base given; MERGED checks against $Base"
}

if ($Base.StartsWith('origin/')) {
    $branchName = $Base.Substring(7)
    $refspec = '+refs/heads/' + $branchName + ':refs/remotes/origin/' + $branchName
    if ((Invoke-Git @('fetch', 'origin', $refspec, '--quiet')).Code -ne 0) {
        Write-Warn "warn: could not fetch $Base; MERGED column may be stale"
    }
}
if ((Invoke-Git @('rev-parse', '--verify', '--quiet', ($Base + '^{commit}'))).Code -ne 0) { Stop-Audit "error: base ref not found: $Base" }

$transcripts = ''
if (-not $SkipTranscripts) {
    if ($TranscriptsRoot -eq '') {
        $userHome = $env:USERPROFILE
        if ([string]::IsNullOrEmpty($userHome)) { $userHome = $HOME }
        $TranscriptsRoot = Join-Path (Join-Path $userHome '.claude') 'projects'
    }
    $slug = [regex]::Replace($mainWorktree, '[^A-Za-z0-9]', '-')
    $candidateDir = Join-Path $TranscriptsRoot $slug
    if (Test-Path -LiteralPath $candidateDir -PathType Container) {
        $transcripts = $candidateDir
    }
    else {
        Write-Warn "warn: no transcript folder at $candidateDir; LAST_CHAT prints -"
    }
}

$epoch = New-Object DateTime 1970, 1, 1, 0, 0, 0, ([DateTimeKind]::Utc)
$now = [DateTime]::UtcNow
$tab = [string][char]9
$rows = @()

foreach ($wt in $worktrees) {
    if ($wt -eq $mainWorktree) { continue }

    if (-not (Test-Path -LiteralPath $wt -PathType Container)) {
        $missing = @('?', '?', 'no', 'missing', '-', '-', 'review', $wt) -join $tab
        $rows += New-Object psobject -Property @{ Bytes = [long]0; Line = $missing }
        continue
    }

    $measure = Get-ChildItem -LiteralPath $wt -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
    $bytes = [long]0
    if ($null -ne $measure -and $null -ne $measure.Sum) { $bytes = [long]$measure.Sum }
    $sizeText = ($bytes / 1MB).ToString('0.0', [Globalization.CultureInfo]::InvariantCulture)

    $head = Get-FirstLine (Invoke-Git @('-C', $wt, 'rev-parse', 'HEAD'))
    $headStamp = Get-FirstLine (Invoke-Git @('-C', $wt, 'log', '-1', '--format=%ct', 'HEAD'))
    $age = '?'
    $seconds = [long]0
    if ([long]::TryParse($headStamp, [ref]$seconds) -and $seconds -gt 0) {
        $age = ([int][Math]::Floor(($now - $epoch.AddSeconds($seconds)).TotalDays)).ToString() + 'd'
    }

    $merged = 'no'
    if ($head -ne '' -and (Invoke-Git @('merge-base', '--is-ancestor', $head, $Base)).Code -eq 0) { $merged = 'YES' }

    $status = @((Invoke-Git @('-C', $wt, 'status', '--porcelain')).Lines | Where-Object { $_ -ne '' })
    $tracked = @($status | Where-Object { -not $_.StartsWith('??') })
    $dirty = 'clean'
    if ($tracked.Count -gt 0) { $dirty = 'wip:' + $tracked.Count }
    elseif ($status.Count -gt 0) { $dirty = 'scratch:' + $status.Count }

    $branch = Get-FirstLine (Invoke-Git @('-C', $wt, 'symbolic-ref', '--quiet', '--short', 'HEAD'))
    $remote = 'detached'
    if ($branch -ne '') {
        $remote = 'no-remote'
        if ((Invoke-Git @('-C', $wt, 'show-ref', '--verify', '--quiet', ('refs/remotes/origin/' + $branch))).Code -eq 0) {
            $remoteHead = Get-FirstLine (Invoke-Git @('-C', $wt, 'rev-parse', ('origin/' + $branch)))
            if ($remoteHead -eq $head) { $remote = 'pushed' }
            else { $remote = 'ahead' + (Get-FirstLine (Invoke-Git @('-C', $wt, 'rev-list', '--count', ('origin/' + $branch + '..HEAD')))) }
        }
    }

    $lastChat = '-'
    $recent = $false
    if ($transcripts -ne '') {
        $forward = $wt.Replace('\', '/')
        $escaped = $forward.Replace('/', '\\')
        $needles = @(($forward + '/'), ($forward + '"'), ($escaped + '\\'), ($escaped + '"'))
        $files = @(Get-ChildItem -LiteralPath $transcripts -Recurse -File -Filter '*.jsonl' -ErrorAction SilentlyContinue)
        $newest = $null
        foreach ($file in $files) {
            if ($null -ne $newest -and $file.LastWriteTimeUtc -le $newest) { continue }
            $hit = Select-String -LiteralPath $file.FullName -SimpleMatch -Pattern $needles -List -ErrorAction SilentlyContinue
            if ($null -ne $hit) { $newest = $file.LastWriteTimeUtc }
        }
        if ($null -ne $newest) {
            $lastChat = $newest.ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
            if (($now - $newest).TotalDays -le $RecentDays) { $recent = $true }
        }
    }

    $bucket = 'review'
    if ($dirty.StartsWith('wip:')) { $bucket = 'hold-wip' }
    elseif ($recent) { $bucket = 'verify-recent-chat' }
    elseif ($merged -eq 'YES') { $bucket = 'safe' }

    $line = @($sizeText, $age, $merged, $dirty, $remote, $lastChat, $bucket, $wt) -join $tab
    $rows += New-Object psobject -Property @{ Bytes = $bytes; Line = $line }
}

Write-Output "# base: $Base"
Write-Output (@('SIZE_MB', 'AGE', 'MERGED', 'DIRTY', 'REMOTE', 'LAST_CHAT', 'BUCKET', 'WORKTREE') -join $tab)
foreach ($row in ($rows | Sort-Object -Property Bytes -Descending)) { Write-Output $row.Line }
exit 0
