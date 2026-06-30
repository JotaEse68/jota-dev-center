@echo off
REM Lanzador de Jota Dev Center desde el escritorio de Windows.
REM Usa PowerShell 7 (pwsh) si esta disponible; si no, PowerShell clasico.

where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-jota-dev-center.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-jota-dev-center.ps1"
)
