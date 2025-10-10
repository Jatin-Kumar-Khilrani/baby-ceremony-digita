# Add Azure CLI to PATH permanently
# This script adds Azure CLI to your system PATH variable

Write-Host "🔧 Adding Azure CLI to System PATH..." -ForegroundColor Cyan
Write-Host ""

$azurePath = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Check if Azure CLI is already in PATH
if ($currentPath -like "*$azurePath*") {
    Write-Host "✅ Azure CLI is already in your PATH!" -ForegroundColor Green
} else {
    Write-Host "Adding to User PATH variable..." -ForegroundColor Yellow
    
    # Add to User PATH (permanent)
    $newPath = $currentPath + ";" + $azurePath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    
    Write-Host "✅ Azure CLI added to PATH permanently!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Note: You'll need to restart your terminal for it to take effect." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Adding to current session PATH..." -ForegroundColor Yellow
$env:Path += ";$azurePath"
Write-Host "✅ Azure CLI is now available in this session!" -ForegroundColor Green

Write-Host ""
Write-Host "Testing Azure CLI..." -ForegroundColor Cyan
az --version | Select-Object -First 1

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Azure CLI is Ready!               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Azure:" -ForegroundColor Yellow
Write-Host "   az login --use-device-code" -ForegroundColor White
Write-Host ""
Write-Host "2. After successful login, run setup:" -ForegroundColor Yellow
Write-Host "   .\setup-azure-simple.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. Or test without Azure:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
