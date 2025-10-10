# Simple Azure Setup - After Restarting Terminal

Write-Host "🎉 Baby Ceremony Invitation - Azure Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test if Azure CLI is available
$azPath = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if (Test-Path $azPath) {
    Write-Host "✅ Azure CLI found at: $azPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please restart your terminal for Azure CLI to work" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1: Logging into Azure..." -ForegroundColor Yellow
Write-Host "   (Using device code authentication)" -ForegroundColor Gray
Write-Host "   You'll get a code to enter at https://microsoft.com/devicelogin" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Important: If you have multiple Azure accounts/tenants:" -ForegroundColor Yellow
Write-Host "   - Use your PERSONAL Microsoft account (not work/school)" -ForegroundColor Yellow
Write-Host "   - Complete MFA if prompted" -ForegroundColor Yellow
Write-Host ""
& $azPath login --use-device-code

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Login failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Multiple tenants detected - use your personal account" -ForegroundColor White
    Write-Host "  • MFA required - complete authentication on the device login page" -ForegroundColor White
    Write-Host "  • No Azure subscription - create one at https://azure.microsoft.com/free" -ForegroundColor White
    Write-Host ""
    Write-Host "To login with a specific tenant:" -ForegroundColor Cyan
    Write-Host "  az login --use-device-code --tenant YOUR_TENANT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "Or create a free Azure account at:" -ForegroundColor Cyan
    Write-Host "  https://azure.microsoft.com/free" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Logged in successfully!" -ForegroundColor Green
Write-Host ""

# Set variables
$resourceGroup = "baby-ceremony-rg"
$location = "eastus"
$storageAccount = "babyceremonystorage$(Get-Random -Maximum 9999)"

Write-Host "Step 2: Creating Azure resources..." -ForegroundColor Yellow
Write-Host "   Resource Group: $resourceGroup" -ForegroundColor Gray
Write-Host "   Storage Account: $storageAccount" -ForegroundColor Gray
Write-Host "   Location: $location" -ForegroundColor Gray
Write-Host ""

Write-Host "Creating resource group..." -ForegroundColor Yellow
& $azPath group create --name $resourceGroup --location $location

Write-Host "Creating storage account (this may take a minute)..." -ForegroundColor Yellow
& $azPath storage account create `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --location $location `
    --sku Standard_LRS `
    --kind StorageV2

Write-Host ""
Write-Host "Getting connection string..." -ForegroundColor Yellow
$connectionString = & $azPath storage account show-connection-string `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --query connectionString `
    --output tsv

Write-Host ""
Write-Host "✅ Azure resources created!" -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 3: Setting up local API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Create local.settings.json
$localSettingsPath = "api\local.settings.json"
$localSettings = @{
    IsEncrypted = $false
    Values = @{
        AzureWebJobsStorage = ""
        FUNCTIONS_WORKER_RUNTIME = "node"
        AZURE_STORAGE_CONNECTION_STRING = $connectionString
    }
    Host = @{
        LocalHttpPort = 7071
        CORS = "*"
    }
} | ConvertTo-Json -Depth 10

$localSettings | Out-File -FilePath $localSettingsPath -Encoding utf8
Write-Host "✅ Created $localSettingsPath" -ForegroundColor Green

Write-Host ""
Write-Host "Installing API dependencies..." -ForegroundColor Yellow
Push-Location api
npm install
Pop-Location

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Resource Information:" -ForegroundColor Cyan
Write-Host "   Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   Storage Account: $storageAccount" -ForegroundColor White
Write-Host "   Location: $location" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Start the API (in this terminal):" -ForegroundColor Yellow
Write-Host "   cd api" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Start the frontend (in a NEW terminal):" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Test in multiple browsers to see shared data!" -ForegroundColor Yellow
Write-Host ""
Write-Host "💰 Estimated monthly cost: `$0.10 - `$1.00" -ForegroundColor Green
Write-Host ""
Write-Host "🎊 Ready to celebrate! Your baby ceremony invitation is ready!" -ForegroundColor Cyan
Write-Host ""
