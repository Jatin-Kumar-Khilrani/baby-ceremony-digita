# RSVP Data Restoration Script
# This script restores RSVP data from local backup to Azure Storage

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RSVP Data Recovery Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backup file exists
$backupFile = "rsvps-latest.json"
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Error: Backup file '$backupFile' not found!" -ForegroundColor Red
    exit 1
}

# Read backup data
Write-Host "📂 Reading backup file: $backupFile" -ForegroundColor Yellow
$backupContent = Get-Content $backupFile -Raw
$rsvps = $backupContent | ConvertFrom-Json

Write-Host "✅ Found $($rsvps.Count) RSVP(s) in backup:" -ForegroundColor Green
foreach ($rsvp in $rsvps) {
    Write-Host "   - $($rsvp.name) ($($rsvp.email))" -ForegroundColor Cyan
}
Write-Host ""

# Load environment variables
Write-Host "🔑 Loading Azure credentials..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$connectionString = $env:AZURE_STORAGE_CONNECTION_STRING
if (-not $connectionString) {
    Write-Host "❌ AZURE_STORAGE_CONNECTION_STRING not found in .env!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Checking Azure Storage connection..." -ForegroundColor Yellow

# Get storage account name from connection string
if ($connectionString -match 'AccountName=([^;]+)') {
    $accountName = $matches[1]
    Write-Host "   Storage Account: $accountName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "⚠️  WARNING: This will REPLACE the current RSVP data in Azure Storage!" -ForegroundColor Yellow
Write-Host "   Current backup contains $($rsvps.Count) RSVP(s)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to proceed with restoration? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Restoration cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Restoring data to Azure Storage..." -ForegroundColor Yellow

# Option 1: Use Azure CLI (recommended)
try {
    # Check if Azure CLI is available
    $azVersion = az --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Using Azure CLI..." -ForegroundColor Cyan
        
        # Upload the file
        $containerName = "ceremony-data"
        $blobName = "rsvps.json"
        
        # Create container if it doesn't exist
        az storage container create --name $containerName --connection-string $connectionString --only-show-errors 2>&1 | Out-Null
        
        # Upload blob
        az storage blob upload `
            --container-name $containerName `
            --name $blobName `
            --file $backupFile `
            --connection-string $connectionString `
            --overwrite `
            --content-type "application/json" `
            --only-show-errors
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Data restored successfully using Azure CLI!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Restoration Summary:" -ForegroundColor Cyan
            Write-Host "   - RSVPs restored: $($rsvps.Count)" -ForegroundColor Green
            Write-Host "   - Container: $containerName" -ForegroundColor Cyan
            Write-Host "   - Blob: $blobName" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "✅ Your RSVP data has been recovered!" -ForegroundColor Green
            exit 0
        }
    }
} catch {
    Write-Host "   Azure CLI not available, trying alternative method..." -ForegroundColor Yellow
}

# Option 2: Use the API endpoint directly
Write-Host "   Using API endpoint method..." -ForegroundColor Cyan

$apiUrl = "http://localhost:7071/api/rsvps?action=replace"
if ($env:VITE_API_URL) {
    $apiUrl = "$($env:VITE_API_URL)/rsvps?action=replace"
}

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $backupContent -ContentType "application/json"
    Write-Host "✅ Data restored successfully using API!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Restoration Summary:" -ForegroundColor Cyan
    Write-Host "   - RSVPs restored: $($rsvps.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Your RSVP data has been recovered!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restore using API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Manual Restoration Instructions:" -ForegroundColor Yellow
    Write-Host "1. Open Azure Portal: https://portal.azure.com" -ForegroundColor Cyan
    Write-Host "2. Go to your Storage Account" -ForegroundColor Cyan
    Write-Host "3. Navigate to 'Containers' → 'ceremony-data'" -ForegroundColor Cyan
    Write-Host "4. Upload the file: $backupFile" -ForegroundColor Cyan
    Write-Host "5. Rename it to: rsvps.json" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
