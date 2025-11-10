@echo off
REM ============================================================
REM Version Bump Utility
REM Updates version in manifest.json
REM ============================================================
echo.
echo ========================================
echo Version Bump Utility
echo ========================================
echo.

REM Get current version using PowerShell for more reliable JSON parsing
for /f "delims=" %%a in ('powershell -Command "(Get-Content manifest.json | ConvertFrom-Json).version"') do (
    set CURRENT_VERSION=%%a
)

echo Current version: %CURRENT_VERSION%
echo.

REM Parse version numbers
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
    set PATCH=%%c
)

REM Calculate new versions
set /a NEW_MAJOR=%MAJOR%+1
set /a NEW_MINOR=%MINOR%+1
set /a NEW_PATCH=%PATCH%+1

echo Select version bump type:
echo.
echo   1. Patch  (%MAJOR%.%MINOR%.%NEW_PATCH%) - Bug fixes
echo   2. Minor  (%MAJOR%.%NEW_MINOR%.0)        - New features
echo   3. Major  (%NEW_MAJOR%.0.0)              - Breaking changes
echo   4. Custom
echo   5. Cancel
echo.

choice /C 12345 /N /M "Choice: "
set CHOICE=%ERRORLEVEL%

if %CHOICE%==1 (
    set NEW_VERSION=%MAJOR%.%MINOR%.%NEW_PATCH%
    set BUMP_TYPE=PATCH
)
if %CHOICE%==2 (
    set NEW_VERSION=%MAJOR%.%NEW_MINOR%.0
    set BUMP_TYPE=MINOR
)
if %CHOICE%==3 (
    set NEW_VERSION=%NEW_MAJOR%.0.0
    set BUMP_TYPE=MAJOR
)
if %CHOICE%==4 (
    echo.
    set /p NEW_VERSION="Enter new version (e.g., 2.2.0): "
    set BUMP_TYPE=CUSTOM
)
if %CHOICE%==5 (
    echo Cancelled
    pause
    exit /b 0
)

echo.
echo ========================================
echo Version Bump: %BUMP_TYPE%
echo ========================================
echo.
echo   Current: %CURRENT_VERSION%
echo   New:     %NEW_VERSION%
echo.

choice /C YN /M "Confirm version bump"
if errorlevel 2 (
    echo Cancelled
    pause
    exit /b 0
)

REM Update manifest.json
echo.
echo Updating manifest.json...
powershell -Command "(Get-Content manifest.json) -replace '\"version\":\s*\"%CURRENT_VERSION%\"', '\"version\":\"%NEW_VERSION%\"' | Set-Content manifest.json"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Version Updated Successfully!
    echo ========================================
    echo.
    echo New version: %NEW_VERSION%
    echo.
    echo Next steps:
    echo   1. Run 'build-release.cmd' to build
    echo   2. Test the plugin
    echo   3. Run 'release-git.cmd' to publish
    echo.
) else (
    echo.
    echo ERROR: Failed to update version
    echo.
)

pause
