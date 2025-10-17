# Quick Restore Script - Upload local backup to Azure Storage
# Restores rsvps-latest.json to Azure Storage (Production)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restore RSVPs to Azure Storage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backup file exists
$backupFile = "rsvps-latest.json"
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Backup file not found: $backupFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Looking for alternative backups..." -ForegroundColor Yellow
    
    if (Test-Path "rsvps-check.json") {
        $backupFile = "rsvps-check.json"
        Write-Host "   ✅ Found: rsvps-check.json" -ForegroundColor Green
    } else {
        Write-Host "   No backup files found!" -ForegroundColor Red
        exit 1
    }
}

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
    Write-Host "✅ Loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$connectionString = $env:AZURE_STORAGE_CONNECTION_STRING
if (-not $connectionString) {
    Write-Host "❌ AZURE_STORAGE_CONNECTION_STRING not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Read backup data
Write-Host "📂 Reading backup: $backupFile" -ForegroundColor Yellow
$backupContent = Get-Content $backupFile -Raw
$rsvps = $backupContent | ConvertFrom-Json

Write-Host "✅ Found $($rsvps.Count) RSVP(s):" -ForegroundColor Green
foreach ($rsvp in $rsvps) {
    $status = if ($rsvp.attending) { "✓" } else { "✗" }
    Write-Host "   $status $($rsvp.name) - $($rsvp.email)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "⚠️  WARNING: This will OVERWRITE production data!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with restoration? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Uploading to Azure Storage..." -ForegroundColor Yellow

# Check if Azure CLI is available
try {
    $null = az --version 2>&1
    $hasAzureCLI = $LASTEXITCODE -eq 0
} catch {
    $hasAzureCLI = $false
}

if ($hasAzureCLI) {
    # Use Azure CLI
    Write-Host "   Using Azure CLI..." -ForegroundColor Cyan
    
    $containerName = "ceremony-data"
    $blobName = "rsvps.json"
    
    # Create container if needed
    az storage container create `
        --name $containerName `
        --connection-string $connectionString `
        --only-show-errors 2>&1 | Out-Null
    
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
        Write-Host "✅ Successfully restored to Azure Storage!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "   - Container: $containerName" -ForegroundColor White
        Write-Host "   - Blob: $blobName" -ForegroundColor White
        Write-Host "   - RSVPs restored: $($rsvps.Count)" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Your production data has been recovered!" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Azure CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Install Azure CLI:" -ForegroundColor Yellow
    Write-Host "   winget install Microsoft.AzureCLI" -ForegroundColor Cyan
    Write-Host "   OR" -ForegroundColor Yellow
    Write-Host "   Download from: https://aka.ms/installazurecliwindows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Manual Steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://portal.azure.com" -ForegroundColor Cyan
    Write-Host "   2. Open your Storage Account" -ForegroundColor Cyan
    Write-Host "   3. Go to Containers → ceremony-data" -ForegroundColor Cyan
    Write-Host "   4. Upload: $backupFile" -ForegroundColor Cyan
    Write-Host "   5. Rename to: rsvps.json" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
