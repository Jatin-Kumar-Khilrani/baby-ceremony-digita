# Production Setup Script for Azure Deployment
# Run this script to set up all Azure resources for production

# Color codes for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "`n🎉 Baby Ceremony - Production Setup Script" -ForegroundColor $Cyan
Write-Host "==========================================`n" -ForegroundColor $Cyan

# Check for existing .env file
$existingEnvFile = Test-Path ".env"
$useExistingValues = $false

if ($existingEnvFile) {
    Write-Host "📋 Found existing .env file" -ForegroundColor $Yellow
    $useExisting = Read-Host "Use existing values from .env? (y/n)"
    if ($useExisting -eq 'y') {
        $useExistingValues = $true
        Write-Host "✅ Will use existing .env values where available`n" -ForegroundColor $Green
        
        # Parse existing .env
        $envVars = @{}
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $envVars[$matches[1].Trim()] = $matches[2].Trim()
            }
        }
    } else {
        Write-Host "⚠️ Will prompt for all values`n" -ForegroundColor $Yellow
    }
}

# Configuration
Write-Host "📝 Enter your configuration details:`n" -ForegroundColor $Yellow

# Get values from existing .env or prompt
if ($useExistingValues -and $envVars) {
    $resourceGroup = if ($envVars.ContainsKey('AZURE_RESOURCE_GROUP')) { $envVars['AZURE_RESOURCE_GROUP'] } else { Read-Host "Resource Group name (e.g., baby-ceremony-rg)" }
    
    # Try to detect storage account from .env or Azure
    $storageAccount = if ($envVars.ContainsKey('VITE_AZURE_STORAGE_ACCOUNT') -and $envVars['VITE_AZURE_STORAGE_ACCOUNT'] -ne 'your-storage-account-name') { 
        $acct = $envVars['VITE_AZURE_STORAGE_ACCOUNT']
        Write-Host "Using existing Storage Account from .env: $acct" -ForegroundColor $Green
        $acct
    } else {
        # Try to detect from Azure resource group
        if ($resourceGroup) {
            Write-Host "Checking for storage accounts in resource group: $resourceGroup..." -ForegroundColor $Yellow
            $detectedAccounts = az storage account list --resource-group $resourceGroup --query "[].name" --output tsv 2>$null
            if ($LASTEXITCODE -eq 0 -and $detectedAccounts) {
                # Ensure we get an array even with single result
                $accountList = @($detectedAccounts -split "`r?`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
                if ($accountList.Count -eq 1) {
                    $detectedAccount = $accountList[0]
                    Write-Host "✅ Found storage account: $detectedAccount" -ForegroundColor $Green
                    $detectedAccount
                } elseif ($accountList.Count -gt 1) {
                    Write-Host "Found multiple storage accounts:" -ForegroundColor $Yellow
                    for ($i = 0; $i -lt $accountList.Count; $i++) {
                        Write-Host "  [$($i + 1)] $($accountList[$i])"
                    }
                    $choice = Read-Host "Select storage account (1-$($accountList.Count)) or enter new name"
                    if ($choice -match '^\d+$' -and [int]$choice -le $accountList.Count -and [int]$choice -gt 0) {
                        $accountList[[int]$choice - 1]
                    } else {
                        $choice
                    }
                } else {
                    Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
                }
            } else {
                Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
            }
        } else {
            Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)" 
        }
    }
    
    $adminEmail = if ($envVars.ContainsKey('VITE_ADMIN_EMAIL')) { 
        $email = $envVars['VITE_ADMIN_EMAIL']
        Write-Host "Using existing Admin Email: $email" -ForegroundColor $Green
        $email
    } else { 
        Read-Host "Admin Email" 
    }
    $adminPinPlain = if ($envVars.ContainsKey('VITE_ADMIN_PIN')) { 
        $pin = $envVars['VITE_ADMIN_PIN']
        Write-Host "Using existing Admin PIN from .env" -ForegroundColor $Green
        $pin
    } else { 
        $adminPin = Read-Host "Admin PIN (4 digits)" -AsSecureString
        [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPin)
        )
    }
    
    $githubPat = if ($envVars.ContainsKey('GITHUB_PAT')) {
        $pat = $envVars['GITHUB_PAT']
        Write-Host "Using existing GitHub PAT from .env" -ForegroundColor $Green
        $pat
    } else {
        Read-Host "GitHub Personal Access Token (for Static Web App deployment)"
    }
    
    $githubRepo = if ($envVars.ContainsKey('GITHUB_REPO')) {
        $repo = $envVars['GITHUB_REPO']
        Write-Host "Using existing GitHub Repository from .env: $repo" -ForegroundColor $Green
        $repo
    } else {
        Read-Host "GitHub Repository URL (e.g., https://github.com/username/repo)"
    }
    
    # These might not be in .env, so use defaults
    if (-not $resourceGroup) {
        $resourceGroup = Read-Host "Resource Group name (e.g., baby-ceremony-rg)"
    } else {
        Write-Host "Using Resource Group: $resourceGroup" -ForegroundColor $Green
    }
    
    $location = Read-Host "Azure location (default: eastus)"
    if (-not $location) { $location = "eastus" }
    
    $staticWebApp = Read-Host "Static Web App name (default: baby-ceremony-app)"
    if (-not $staticWebApp) { $staticWebApp = "baby-ceremony-app" }
    
    $commService = Read-Host "Communication Service name (default: baby-ceremony-comm)"
    if (-not $commService) { $commService = "baby-ceremony-comm" }
} else {
    $resourceGroup = Read-Host "Resource Group name (e.g., baby-ceremony-rg)"
    $location = Read-Host "Azure location (e.g., eastus)"
    
    # Try to detect storage account from Azure
    if ($resourceGroup) {
        Write-Host "Checking for storage accounts in resource group: $resourceGroup..." -ForegroundColor $Yellow
        $detectedAccounts = az storage account list --resource-group $resourceGroup --query "[].name" --output tsv 2>$null
        if ($LASTEXITCODE -eq 0 -and $detectedAccounts) {
            # Ensure we get an array even with single result
            $accountList = @($detectedAccounts -split "`r?`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
            if ($accountList.Count -eq 1) {
                $detectedAccount = $accountList[0]
                Write-Host "✅ Found storage account: $detectedAccount" -ForegroundColor $Green
                $useDetected = Read-Host "Use this account? (y/n)"
                if ($useDetected -eq 'y') {
                    $storageAccount = $detectedAccount
                } else {
                    $storageAccount = Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
                }
            } elseif ($accountList.Count -gt 1) {
                Write-Host "Found multiple storage accounts:" -ForegroundColor $Yellow
                for ($i = 0; $i -lt $accountList.Count; $i++) {
                    Write-Host "  [$($i + 1)] $($accountList[$i])"
                }
                $choice = Read-Host "Select storage account (1-$($accountList.Count)) or enter new name"
                if ($choice -match '^\d+$' -and [int]$choice -le $accountList.Count -and [int]$choice -gt 0) {
                    $storageAccount = $accountList[[int]$choice - 1]
                } else {
                    $storageAccount = $choice
                }
            } else {
                $storageAccount = Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
            }
        } else {
            $storageAccount = Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
        }
    } else {
        $storageAccount = Read-Host "Storage Account name (lowercase, no spaces, e.g., babyceremonystorage)"
    }
    
    $staticWebApp = Read-Host "Static Web App name (e.g., baby-ceremony-app)"
    $commService = Read-Host "Communication Service name (e.g., baby-ceremony-comm)"

    Write-Host "`n🔐 Admin Credentials (keep these secure!):`n" -ForegroundColor $Yellow
    $adminEmail = Read-Host "Admin Email"
    $adminPin = Read-Host "Admin PIN (4 digits)" -AsSecureString
    $adminPinPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPin)
    )
}

# Confirm before proceeding
Write-Host "`n📋 Configuration Summary:" -ForegroundColor $Cyan
Write-Host "  Resource Group: $resourceGroup"
Write-Host "  Location: $location"
Write-Host "  Storage Account: $storageAccount"
Write-Host "  Static Web App: $staticWebApp"
Write-Host "  Communication Service: $commService"
Write-Host "  Admin Email: $adminEmail"
Write-Host ""

$confirm = Read-Host "Proceed with setup? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Setup cancelled." -ForegroundColor $Yellow
    exit
}

Write-Host "`n🚀 Starting Azure resource setup...`n" -ForegroundColor $Green

# 1. Check Azure Login
Write-Host "1️⃣ Checking Azure login status..." -ForegroundColor $Cyan
$azAccount = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Not logged in, logging in now..." -ForegroundColor $Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed!" -ForegroundColor $Red
        exit 1
    }
    Write-Host "✅ Logged in successfully`n" -ForegroundColor $Green
} else {
    $accountInfo = $azAccount | ConvertFrom-Json
    Write-Host "✅ Already logged in as: $($accountInfo.user.name)`n" -ForegroundColor $Green
}

# 2. Check/Create Resource Group
Write-Host "2️⃣ Checking Resource Group..." -ForegroundColor $Cyan
$rgExists = az group exists --name $resourceGroup
if ($rgExists -eq "true") {
    Write-Host "✅ Resource group already exists: $resourceGroup`n" -ForegroundColor $Green
} else {
    Write-Host "   Creating new resource group..." -ForegroundColor $Yellow
    az group create --name $resourceGroup --location $location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resource group created`n" -ForegroundColor $Green
    } else {
        Write-Host "❌ Resource group creation failed`n" -ForegroundColor $Red
        exit 1
    }
}

# 3. Check/Create Storage Account
Write-Host "3️⃣ Checking Storage Account..." -ForegroundColor $Cyan
$storageExists = az storage account show --name $storageAccount --resource-group $resourceGroup 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage account already exists: $storageAccount`n" -ForegroundColor $Green
} else {
    Write-Host "   Creating new storage account..." -ForegroundColor $Yellow
    az storage account create `
        --name $storageAccount `
        --resource-group $resourceGroup `
        --location $location `
        --sku Standard_LRS `
        --kind StorageV2

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Storage account created`n" -ForegroundColor $Green
    } else {
        Write-Host "❌ Storage account creation failed`n" -ForegroundColor $Red
        exit 1
    }
}

# 4. Get Storage Connection String
Write-Host "4️⃣ Getting Storage Connection String..." -ForegroundColor $Cyan
$storageConnectionString = az storage account show-connection-string `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --output tsv

Write-Host "✅ Storage connection string retrieved`n" -ForegroundColor $Green

# 5. Get Storage Account Key
Write-Host "5️⃣ Getting Storage Account Key..." -ForegroundColor $Cyan
$storageKey = az storage account keys list `
    --account-name $storageAccount `
    --resource-group $resourceGroup `
    --query "[0].value" `
    --output tsv

Write-Host "✅ Storage key retrieved`n" -ForegroundColor $Green

# 6. Create Blob Containers
Write-Host "6️⃣ Creating Blob Containers..." -ForegroundColor $Cyan
$containers = @("ceremony-rsvps", "ceremony-wishes", "ceremony-photos", "ceremony-data")

foreach ($container in $containers) {
    # Check if container already exists
    $containerExists = az storage container exists --name $container --account-name $storageAccount --account-key $storageKey --output tsv 2>$null
    
    if ($containerExists -eq "True") {
        Write-Host "  ✓ Already exists: $container" -ForegroundColor $Green
    } else {
        if ($container -eq "ceremony-photos") {
            # Public access for photos
            az storage container create --name $container --account-name $storageAccount --account-key $storageKey --public-access blob
        } else {
            # Private access for data
            az storage container create --name $container --account-name $storageAccount --account-key $storageKey
        }
        Write-Host "  ✓ Created: $container" -ForegroundColor $Green
    }
}
Write-Host ""

# 7. Configure CORS
Write-Host "7️⃣ Configuring CORS for Storage..." -ForegroundColor $Cyan
# Clear existing CORS first, then add new rules
az storage cors clear --services b --account-name $storageAccount --account-key $storageKey 2>$null
az storage cors add `
    --services b `
    --methods GET POST PUT DELETE OPTIONS `
    --origins '*' `
    --allowed-headers '*' `
    --exposed-headers '*' `
    --max-age 3600 `
    --account-name $storageAccount `
    --account-key $storageKey

Write-Host "✅ CORS configured (update with production domain later)`n" -ForegroundColor $Green

# 8. Check/Create Communication Service
Write-Host "8️⃣ Checking Communication Service..." -ForegroundColor $Cyan
$commExists = az communication show --name $commService --resource-group $resourceGroup 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Communication service already exists: $commService`n" -ForegroundColor $Green
} else {
    Write-Host "   Creating new communication service..." -ForegroundColor $Yellow
    az communication create `
        --name $commService `
        --resource-group $resourceGroup `
        --location global `
        --data-location UnitedStates

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Communication service created`n" -ForegroundColor $Green
    } else {
        Write-Host "⚠️ Communication service creation failed`n" -ForegroundColor $Yellow
        Write-Host "   You may need to install the extension: az extension add --name communication`n" -ForegroundColor $Yellow
    }
}

# 9. Get Communication Connection String
Write-Host "9️⃣ Getting Communication Connection String..." -ForegroundColor $Cyan
$commConnectionString = az communication list-key `
    --name $commService `
    --resource-group $resourceGroup `
    --query "primaryConnectionString" `
    --output tsv

Write-Host "✅ Communication connection string retrieved`n" -ForegroundColor $Green

# 10. Check/Create Static Web App
Write-Host "🔟 Checking Static Web App..." -ForegroundColor $Cyan
$swaExists = az staticwebapp show --name $staticWebApp --resource-group $resourceGroup 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Static Web App already exists: $staticWebApp`n" -ForegroundColor $Green
} else {
    Write-Host "   Static Web App not found, creating new one..." -ForegroundColor $Yellow
    Write-Host "   Using GitHub PAT for authentication..." -ForegroundColor $Yellow

    az staticwebapp create `
        --name $staticWebApp `
        --resource-group $resourceGroup `
        --location eastus2 `
        --source $githubRepo `
        --branch main `
        --app-location "/" `
        --api-location "api" `
        --output-location "dist" `
        --token $githubPat

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Static Web App created`n" -ForegroundColor $Green
    } else {
        Write-Host "⚠️ Static Web App creation failed`n" -ForegroundColor $Yellow
        Write-Host "   Please check your GitHub PAT and repository URL`n" -ForegroundColor $Yellow
    }
}

# 11. Get Static Web App Token
Write-Host "1️⃣1️⃣ Getting Static Web App Deployment Token..." -ForegroundColor $Cyan
$staticWebAppToken = az staticwebapp secrets list `
    --name $staticWebApp `
    --resource-group $resourceGroup `
    --query "properties.apiKey" `
    --output tsv 2>$null

if ($staticWebAppToken) {
    Write-Host "✅ Deployment token retrieved`n" -ForegroundColor $Green
} else {
    Write-Host "⚠️ Could not retrieve token (create app manually first)`n" -ForegroundColor $Yellow
}

# 12. Update/Create .env file
Write-Host "1️⃣2️⃣ Updating .env file..." -ForegroundColor $Cyan

# Check if .env already exists
$envExists = Test-Path ".env"
if ($envExists) {
    Write-Host "   .env file exists, updating values..." -ForegroundColor $Yellow
    
    # Read existing .env
    $existingEnv = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
    
    # Backup existing .env
    $backupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item ".env" $backupFile -ErrorAction SilentlyContinue
    Write-Host "   Created backup: $backupFile" -ForegroundColor $Cyan
}

$envContent = @"
# Admin Authentication
VITE_ADMIN_EMAIL=$adminEmail
VITE_ADMIN_PIN=$adminPinPlain

# Azure Configuration
AZURE_RESOURCE_GROUP=$resourceGroup
AZURE_LOCATION=$location
AZURE_STATIC_WEB_APP=$staticWebApp
AZURE_COMM_SERVICE=$commService

# Azure Storage Configuration
VITE_AZURE_STORAGE_ACCOUNT=$storageAccount
VITE_AZURE_STORAGE_KEY=$storageKey

# Container names
VITE_AZURE_CONTAINER_RSVPS=ceremony-rsvps
VITE_AZURE_CONTAINER_WISHES=ceremony-wishes
VITE_AZURE_CONTAINER_PHOTOS=ceremony-photos
VITE_AZURE_CONTAINER_DATA=ceremony-data

# GitHub Deployment
GITHUB_PAT=$githubPat
GITHUB_REPO=$githubRepo
"@

Set-Content -Path ".env" -Value $envContent
if ($envExists) {
    Write-Host "✅ .env file updated`n" -ForegroundColor $Green
} else {
    Write-Host "✅ .env file created`n" -ForegroundColor $Green
}

# Summary Report
Write-Host "`n" + "="*60 -ForegroundColor $Cyan
Write-Host "🎉 Setup Complete! Here are your credentials:" -ForegroundColor $Green
Write-Host "="*60 + "`n" -ForegroundColor $Cyan

Write-Host "📝 Resource Group:" -ForegroundColor $Yellow
Write-Host "   $resourceGroup`n"

Write-Host "💾 Storage Account:" -ForegroundColor $Yellow
Write-Host "   Name: $storageAccount"
Write-Host "   Connection String: $storageConnectionString`n"

Write-Host "📧 Communication Service:" -ForegroundColor $Yellow
Write-Host "   Name: $commService"
Write-Host "   Connection String: $commConnectionString`n"

if ($staticWebApp) {
    Write-Host "🌐 Static Web App:" -ForegroundColor $Yellow
    Write-Host "   Name: $staticWebApp"
    Write-Host "   URL: https://$staticWebApp.azurestaticapps.net"
    if ($staticWebAppToken) {
        Write-Host "   Deployment Token: $staticWebAppToken`n"
    }
}

Write-Host "🔐 Admin Credentials:" -ForegroundColor $Yellow
Write-Host "   Email: $adminEmail"
Write-Host "   PIN: $adminPinPlain`n"

Write-Host "`n📋 Next Steps:" -ForegroundColor $Cyan
Write-Host "   1. Add these GitHub Secrets to your repository:"
Write-Host "      - AZURE_STATIC_WEB_APPS_API_TOKEN"
Write-Host "      - VITE_ADMIN_EMAIL"
Write-Host "      - VITE_ADMIN_PIN"
Write-Host "      - VITE_AZURE_STORAGE_ACCOUNT"
Write-Host "      - VITE_AZURE_STORAGE_KEY"
Write-Host ""
Write-Host "   2. Configure Azure Function App Settings:"
Write-Host "      - AZURE_STORAGE_CONNECTION_STRING"
Write-Host "      - AZURE_COMMUNICATION_CONNECTION_STRING"
Write-Host "      - SENDER_EMAIL"
Write-Host "      - ALLOWED_ORIGINS"
Write-Host ""
Write-Host "   3. Set up email domain in Communication Service"
Write-Host "   4. Update CORS in Storage to production domain only"
Write-Host "   5. Push code to GitHub to trigger deployment"
Write-Host "   6. Test thoroughly before sharing with guests"
Write-Host ""
Write-Host "📖 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed steps" -ForegroundColor $Yellow
Write-Host ""

# Save credentials to secure file
$credFile = "azure-credentials-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$credContent = @"
Baby Ceremony - Azure Credentials
Generated: $(Get-Date)

Resource Group: $resourceGroup
Location: $location
Storage Account: $storageAccount
Storage Connection String: $storageConnectionString
Storage Key: $storageKey
Communication Service: $commService
Communication Connection String: $commConnectionString
Static Web App: $staticWebApp
Static Web App Token: $staticWebAppToken

Admin Email: $adminEmail
Admin PIN: $adminPinPlain

IMPORTANT: Store these credentials securely and delete this file after copying to a password manager!
"@

Set-Content -Path $credFile -Value $credContent
Write-Host "💾 Credentials saved to: $credFile" -ForegroundColor $Green
Write-Host "⚠️  IMPORTANT: Store in password manager and DELETE this file!" -ForegroundColor $Red
Write-Host ""
