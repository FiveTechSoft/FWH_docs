# FiveWin (FWH) Documentation - Internal Link Checker
# Scans all .html / .htm / .md files under the docs tree and reports internal
# relative links (href/src and markdown links) whose target does not exist.
# External links (http/https/mailto), pure anchors (#...) and javascript: are
# ignored.

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$bad = 0
$checked = 0

$files = Get-ChildItem -Path $root -Recurse -Include *.html, *.htm, *.md |
    Where-Object { $_.FullName -notmatch '\\archive\\' }
foreach ($f in $files) {
    $dir = Split-Path $f.FullName
    $text = [System.IO.File]::ReadAllText($f.FullName)

    $links = [regex]::Matches($text, '(?i)(?:href|src)\s*=\s*"([^"]+)"')
    $links += [regex]::Matches($text, '\]\(([^)]+)\)')

    foreach ($m in $links) {
        $t = $m.Groups[1].Value.Trim()
        if ($t -match '^(https?:|mailto:|javascript:|#)') { continue }
        $rel = $t -replace '#.*$', ''
        if ($rel -eq '' -or $rel -match '^\?') { continue }

        $checked++
        $target = Join-Path $dir $rel
        if (-not (Test-Path $target)) {
            Write-Host ("BROKEN: " + $f.FullName + "  ->  " + $t)
            $bad++
        }
    }
}

if ($bad -eq 0) {
    Write-Host ("OK: all " + $checked + " internal link(s) resolved.")
}
else {
    Write-Host ("FOUND " + $bad + " broken link(s) out of " + $checked + " checked.")
}
