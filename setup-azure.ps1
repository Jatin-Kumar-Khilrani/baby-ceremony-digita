# Quick Setup Script for Baby Ceremony Invitation

Write-Host "🎉 Baby Ceremony Invitation - Azure Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Run: winget install Microsoft.AzureCLI" -ForegroundColor Yellow
    exit 1
}

# Check if Functions Core Tools is installed
try {
    func --version | Out-Null
    Write-Host "✅ Azure Functions Core Tools installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Azure Functions Core Tools not found" -ForegroundColor Yellow
    Write-Host "Installing globally..." -ForegroundColor Yellow
    npm install -g azure-functions-core-tools@4 --unsafe-perm true
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 1: Azure Login" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Using device code authentication..." -ForegroundColor Yellow
Write-Host "You'll get a code to enter at https://microsoft.com/devicelogin" -ForegroundColor Yellow
Write-Host ""
az login --use-device-code

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 2: Create Resources" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$resourceGroup = "baby-ceremony-rg"
$location = "eastus"
$storageAccount = "babyceremonystorage$(Get-Random -Maximum 9999)"
$staticWebApp = "baby-ceremony-app"

Write-Host "Creating resource group: $resourceGroup" -ForegroundColor Yellow
az group create --name $resourceGroup --location $location

Write-Host ""
Write-Host "Creating storage account: $storageAccount" -ForegroundColor Yellow
az storage account create `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --location $location `
    --sku Standard_LRS `
    --kind StorageV2

Write-Host ""
Write-Host "Getting storage connection string..." -ForegroundColor Yellow
$connectionString = az storage account show-connection-string `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --query connectionString `
    --output tsv

Write-Host "✅ Storage account created!" -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 3: Configure Local Dev" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Create local.settings.json
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

$localSettingsPath = "api\local.settings.json"
$localSettings | Out-File -FilePath $localSettingsPath -Encoding utf8

Write-Host "✅ Created $localSettingsPath" -ForegroundColor Green

Write-Host ""
Write-Host "Installing API dependencies..." -ForegroundColor Yellow
cd api
npm install
cd ..

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Important Information:" -ForegroundColor Yellow
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "  Storage Account: $storageAccount" -ForegroundColor White
Write-Host "  Location: $location" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the API (in one terminal):" -ForegroundColor Yellow
Write-Host "   cd api" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Deploy to production:" -ForegroundColor Yellow
Write-Host "   See DEPLOYMENT.md for full instructions" -ForegroundColor White
Write-Host ""
Write-Host "💰 Estimated monthly cost: `$0.10 - `$1.00" -ForegroundColor Green
Write-Host ""
Write-Host "🎊 Ready to celebrate! Open http://localhost:5173" -ForegroundColor Cyan
