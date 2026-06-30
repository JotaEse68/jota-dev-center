# ============================================================
#  Jota Dev Center - Arranque local
#  Instala dependencias si faltan, lanza la app y abre el navegador.
# ============================================================

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Jota Dev Center" -ForegroundColor Cyan
Write-Host "Ruta del proyecto: $ProjectRoot" -ForegroundColor DarkGray

# Instalar dependencias la primera vez
if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Host "Instalando dependencias (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Fallo en npm install. Revisa Node.js." -ForegroundColor Red
        exit 1
    }
}

# Abrir el navegador en segundo plano cuando el servidor ya esté arrancando
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 5
    Start-Process 'http://localhost:3333'
} | Out-Null

Write-Host "Arrancando en http://localhost:3333 ... (cierra esta ventana para detener)" -ForegroundColor Green

# npm run dev mantiene el proceso vivo (servidor + frontend)
npm run dev
