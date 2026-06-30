# ============================================================
#  Jota Dev Center - Crear acceso directo en el escritorio
#  Genera "Jota Dev Center.lnk" que arranca la app y abre el navegador.
# ============================================================

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BatPath = Join-Path $ProjectRoot 'scripts\start-jota-dev-center.bat'

if (-not (Test-Path $BatPath)) {
    Write-Host "No se encontro el lanzador: $BatPath" -ForegroundColor Red
    exit 1
}

$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Jota Dev Center.lnk'

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $BatPath
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Jota Dev Center - Panel local de proyectos'

# Icono: usa el de pwsh si existe
$pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwsh) {
    $Shortcut.IconLocation = "$($pwsh.Source),0"
}

$Shortcut.Save()

Write-Host "Acceso directo creado:" -ForegroundColor Green
Write-Host "  $ShortcutPath" -ForegroundColor White
Write-Host "Haz doble clic en 'Jota Dev Center' en el escritorio para arrancar la app." -ForegroundColor DarkGray
