#Requires -Version 5.1
<#
.SYNOPSIS
Append one well-formed row to a show-me-your-work decision log (TSV).

.DESCRIPTION
Stamps the UTC time, writes the header on first use, replaces tabs and line
breaks inside a cell with spaces, and prefixes a cell whose first character a
spreadsheet would read as a formula (= + - @) with a single quote. The log is
read in spreadsheets, so text taken from commit subjects, file names, or
generated output must not become a formula when a reviewer opens the file.
Writes UTF-8 without a byte order mark and LF row endings.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File log.ps1 -LogFile decisions.tsv -Phase harness -Decision 'froze the benchmark' -Why 'need one repeatable number' -Evidence 'commit 3a9f1c2' -Result 'baseline 412 ms'

.NOTES
Pass every cell as a named parameter. For a value that starts with "-", bind it
with a colon: -Evidence:'-12% vs baseline'.
Exit codes: 0 row appended, 1 the log could not be written.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$LogFile,
    [Parameter(Mandatory = $true, Position = 1)]
    [AllowEmptyString()]
    [string]$Phase,
    [Parameter(Mandatory = $true, Position = 2)]
    [AllowEmptyString()]
    [string]$Decision,
    [Parameter(Mandatory = $true, Position = 3)]
    [AllowEmptyString()]
    [string]$Why,
    [Parameter(Mandatory = $true, Position = 4)]
    [AllowEmptyString()]
    [string]$Evidence,
    [Parameter(Mandatory = $true, Position = 5)]
    [AllowEmptyString()]
    [string]$Result
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function ConvertTo-Cell {
    param([AllowEmptyString()][string]$Value)
    $clean = [regex]::Replace($Value, '[\t\r\n]', ' ')
    if ($clean.Length -gt 0 -and '=+-@'.IndexOf($clean[0]) -ge 0) { $clean = "'" + $clean }
    return $clean
}

try {
    $path = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($LogFile)
    $folder = [System.IO.Path]::GetDirectoryName($path)
    if (-not [string]::IsNullOrEmpty($folder)) { [void][System.IO.Directory]::CreateDirectory($folder) }

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $tab = [string][char]9
    $lf = [string][char]10
    $needsHeader = $true
    if ([System.IO.File]::Exists($path)) {
        $needsHeader = ((New-Object System.IO.FileInfo($path)).Length -eq 0)
    }
    if ($needsHeader) {
        [System.IO.File]::AppendAllText($path, ((@('ts', 'phase', 'decision', 'why', 'evidence', 'result') -join $tab) + $lf), $utf8)
    }

    $stamp = [DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
    $cells = @($stamp, (ConvertTo-Cell $Phase), (ConvertTo-Cell $Decision), (ConvertTo-Cell $Why), (ConvertTo-Cell $Evidence), (ConvertTo-Cell $Result))
    [System.IO.File]::AppendAllText($path, (($cells -join $tab) + $lf), $utf8)
}
catch {
    [Console]::Error.WriteLine('log.ps1: ' + $_.Exception.Message)
    exit 1
}
exit 0
