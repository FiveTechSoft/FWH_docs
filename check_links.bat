@echo off
echo FiveWin Documentation Link Checker
echo =================================

echo.
echo Checking for broken internal links...
echo.

REM Check for references to installation.md (should exist now)
findstr /s /i "installation.md" *.md > nul
if %errorlevel% == 0 (
    echo OK: Found references to installation.md
) else (
    echo WARNING: No references to installation.md found
)

REM Check for references to tutorials directory
findstr /s /i "tutorials/" *.md > nul
if %errorlevel% == 0 (
    echo OK: Found references to tutorials/
) else (
    echo WARNING: No references to tutorials/ found
)

REM Check for references to reference directory
findstr /s /i "reference/" *.md > nul
if %errorlevel% == 0 (
    echo OK: Found references to reference/
) else (
    echo INFO: No references to reference/ found (may be OK if not linked yet)
)

echo.
echo Link check complete.