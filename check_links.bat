@echo off
REM ===========================================================================
REM FiveWin (FWH) Documentation - Internal Link Checker
REM ---------------------------------------------------------------------------
REM Runs check_links.ps1, which scans all .html / .htm / .md files under the
REM docs tree and reports internal relative links (href/src and markdown links)
REM whose target does not exist. External links (http/https/mailto), pure
REM anchors (#...) and javascript: are ignored.
REM ===========================================================================

echo FiveWin Documentation Link Checker
echo ==================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check_links.ps1"
echo.
echo Link check complete.
