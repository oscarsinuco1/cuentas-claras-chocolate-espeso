# Cuentas Claras - Start Script
# This script starts all services for local development

Write-Host "[*] Starting Cuentas Claras Chocolate Espeso..." -ForegroundColor Cyan

# Check if Docker is running
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green

# Start services
Write-Host ""
Write-Host "Starting services with Docker Compose..." -ForegroundColor Yellow

Set-Location $PSScriptRoot
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] All services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "API Docs: http://localhost:3000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To view logs: docker compose logs -f" -ForegroundColor Gray
    Write-Host "To stop: docker compose down" -ForegroundColor Gray
} else {
    Write-Host "[X] Failed to start services" -ForegroundColor Red
    exit 1
}
