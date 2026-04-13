# Cuentas Claras - Development Setup Script
# Run this script once to set up the development environment

Write-Host "🍫 Setting up Cuentas Claras Chocolate Espeso..." -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 20+." -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$rootDir\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
Set-Location $rootDir
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file from .env.example" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option 1: Docker (recommended)" -ForegroundColor Cyan
Write-Host "    .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  Option 2: Manual (requires local PostgreSQL and Redis)" -ForegroundColor Cyan
Write-Host "    Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "    Terminal 2: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
