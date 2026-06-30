# ============================================================
#  Jota Dev Center - Empaquetado portable (sin electron-builder)
#  Ensambla una carpeta ejecutable usando el Electron de node_modules.
#  Evita la descarga de winCodeSign (symlinks de macOS) que requiere
#  privilegios de administrador / Modo Desarrollador en Windows.
#
#  Requisito previo: npm run electron:build  (genera dist/ y app-build/main.cjs)
# ============================================================

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ElectronDist = Join-Path $ProjectRoot 'node_modules\electron\dist'
$Out = Join-Path $ProjectRoot 'release\JotaDevCenter'
$AppDir = Join-Path $Out 'resources\app'

if (-not (Test-Path (Join-Path $ProjectRoot 'app-build\main.cjs'))) {
    Write-Host "Falta app-build\main.cjs. Ejecuta primero: npm run electron:build" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $ElectronDist)) {
    Write-Host "No se encontro Electron en node_modules. Ejecuta: npm install" -ForegroundColor Red
    exit 1
}

Write-Host "Limpiando salida anterior..." -ForegroundColor DarkGray
if (Test-Path $Out) { Remove-Item -Recurse -Force $Out }
New-Item -ItemType Directory -Force -Path $Out | Out-Null

Write-Host "Copiando runtime de Electron..." -ForegroundColor DarkGray
Copy-Item -Path (Join-Path $ElectronDist '*') -Destination $Out -Recurse -Force

Write-Host "Ensamblando la app..." -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
Copy-Item (Join-Path $ProjectRoot 'app-build\main.cjs') (Join-Path $AppDir 'main.cjs') -Force
Copy-Item (Join-Path $ProjectRoot 'dist') (Join-Path $AppDir 'dist') -Recurse -Force
Copy-Item (Join-Path $ProjectRoot 'data') (Join-Path $AppDir 'data') -Recurse -Force
if (Test-Path (Join-Path $ProjectRoot 'build\icon.ico')) {
    Copy-Item (Join-Path $ProjectRoot 'build\icon.ico') (Join-Path $AppDir 'icon.ico') -Force
}

# package.json minimo de la app empaquetada (CJS; main.cjs es siempre CommonJS)
$pkg = @{
    name    = 'jota-dev-center'
    version = '1.0.0'
    main    = 'main.cjs'
} | ConvertTo-Json
Set-Content -Path (Join-Path $AppDir 'package.json') -Value $pkg -Encoding UTF8

# Renombrar el ejecutable
$ExeTarget = Join-Path $Out 'Jota Dev Center.exe'
if (Test-Path $ExeTarget) { Remove-Item $ExeTarget -Force }
Rename-Item -Path (Join-Path $Out 'electron.exe') -NewName 'Jota Dev Center.exe'

Write-Host ""
Write-Host "App portable lista en:" -ForegroundColor Green
Write-Host "  $ExeTarget" -ForegroundColor White

# Acceso directo en el escritorio apuntando a la app nativa
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Jota Dev Center.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ExeTarget
$Shortcut.WorkingDirectory = $Out
$Shortcut.Description = 'Jota Dev Center'
if (Test-Path (Join-Path $AppDir 'icon.ico')) {
    $Shortcut.IconLocation = (Join-Path $AppDir 'icon.ico')
}
$Shortcut.Save()

Write-Host "Acceso directo (app nativa) actualizado en el escritorio:" -ForegroundColor Green
Write-Host "  $ShortcutPath" -ForegroundColor White
