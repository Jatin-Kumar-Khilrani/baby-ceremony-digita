# Quick Production Deployment Script
# Run this after setting up Google OAuth

Write-Host "`n🚀 Baby Ceremony Invitation - Production Deployment`n" -ForegroundColor Cyan

# Load .env file
Write-Host "Loading configuration from .env..." -ForegroundColor Yellow
$envVars = @{}
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
    Write-Host "✅ Configuration loaded`n" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Please run setup-production.ps1 first`n" -ForegroundColor Red
    exit 1
}

# Check if logged into Azure
Write-Host "Checking Azure login..." -ForegroundColor Yellow
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "Not logged in. Logging into Azure..." -ForegroundColor Yellow
    az login
}

Write-Host "✅ Azure login confirmed`n" -ForegroundColor Green

# Set variables from .env
$resourceGroup = $envVars['AZURE_RESOURCE_GROUP']
$staticWebAppName = $envVars['AZURE_STATIC_WEB_APP']
$location = $envVars['AZURE_LOCATION']
$githubPat = $envVars['GITHUB_PAT']

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $resourceGroup"
Write-Host "  App Name: $staticWebAppName"
Write-Host "  Location: $location"
Write-Host "  GitHub PAT: $(if ($githubPat) { '✓ Found' } else { '✗ Missing' })`n"

# Validate GitHub PAT
if (-not $githubPat) {
    Write-Host "❌ GitHub PAT not found in .env file" -ForegroundColor Red
    Write-Host "Please add GITHUB_PAT to your .env file`n" -ForegroundColor Yellow
    exit 1
}

# Check if resource group exists
Write-Host "Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $resourceGroup
if ($rgExists -eq "false") {
    Write-Host "Creating resource group..." -ForegroundColor Yellow
    az group create --name $resourceGroup --location $location
    Write-Host "✅ Resource group created`n" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group exists`n" -ForegroundColor Green
}

# Create Static Web App
Write-Host "Creating Azure Static Web App..." -ForegroundColor Yellow
Write-Host "Using GitHub PAT for authorization...`n" -ForegroundColor Cyan

az staticwebapp create `
    --name $staticWebAppName `
    --resource-group $resourceGroup `
    --source "https://github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita" `
    --location $location `
    --branch main `
    --app-location "/" `
    --output-location "dist" `
    --token $githubPat

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Static Web App created successfully!`n" -ForegroundColor Green
    
    # Get the URL
    Write-Host "Getting your production URL..." -ForegroundColor Yellow
    $appUrl = az staticwebapp show `
        --name $staticWebAppName `
        --resource-group $resourceGroup `
        --query "defaultHostname" `
        --output tsv
    
    $fullUrl = "https://$appUrl"
    Write-Host "`n🎉 Your production URL is: $fullUrl`n" -ForegroundColor Green
    
    Write-Host "📋 NEXT STEPS:`n" -ForegroundColor Cyan
    Write-Host "1. Add environment variable to Azure Static Web App:" -ForegroundColor Yellow
    Write-Host "   az staticwebapp appsettings set \"
    Write-Host "     --name $staticWebAppName \"
    Write-Host "     --resource-group $resourceGroup \"
    Write-Host "     --setting-names VITE_GOOGLE_CLIENT_ID=YOUR-CLIENT-ID`n"
    
    Write-Host "2. Update Google OAuth authorized origins:" -ForegroundColor Yellow
    Write-Host "   Go to: https://console.cloud.google.com/apis/credentials"
    Write-Host "   Add to authorized origins: $fullUrl`n"
    
    Write-Host "3. Visit your app:" -ForegroundColor Yellow
    Write-Host "   $fullUrl`n"
    
    # Copy URL to clipboard
    Write-Host "📋 URL copied to clipboard!" -ForegroundColor Green
    Set-Clipboard -Value $fullUrl
    
} else {
    Write-Host "`n❌ Deployment failed. Please check the errors above.`n" -ForegroundColor Red
}
