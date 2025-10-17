# Azure Storage RSVP Data Recovery Script
# This script downloads RSVP data from Azure Storage (Production)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Azure Storage Data Recovery" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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
    Write-Host "   Please check your .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get storage account name from connection string
if ($connectionString -match 'AccountName=([^;]+)') {
    $accountName = $matches[1]
    Write-Host "📦 Storage Account: $accountName" -ForegroundColor Cyan
} else {
    Write-Host "❌ Could not parse storage account name" -ForegroundColor Red
    exit 1
}

$containerName = "ceremony-data"
$blobName = "rsvps.json"
$downloadPath = "rsvps-from-azure-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

Write-Host "📂 Container: $containerName" -ForegroundColor Cyan
Write-Host "📄 Blob: $blobName" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    $null = az --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI not available"
    }
} catch {
    Write-Host "❌ Azure CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Please install Azure CLI:" -ForegroundColor Yellow
    Write-Host "   Download from: https://aka.ms/installazurecliwindows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Or use PowerShell:" -ForegroundColor Yellow
    Write-Host "   winget install Microsoft.AzureCLI" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "🔍 Checking if blob exists..." -ForegroundColor Yellow

try {
    # Check if blob exists
    $blobExists = az storage blob exists `
        --container-name $containerName `
        --name $blobName `
        --connection-string $connectionString `
        --only-show-errors `
        2>&1 | ConvertFrom-Json

    if (-not $blobExists.exists) {
        Write-Host "❌ Blob '$blobName' not found in container '$containerName'" -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 Listing all blobs in container..." -ForegroundColor Yellow
        
        $blobs = az storage blob list `
            --container-name $containerName `
            --connection-string $connectionString `
            --only-show-errors `
            2>&1 | ConvertFrom-Json

        if ($blobs.Count -eq 0) {
            Write-Host "   ⚠️  Container is empty" -ForegroundColor Yellow
        } else {
            Write-Host "   Found $($blobs.Count) blob(s):" -ForegroundColor Cyan
            foreach ($blob in $blobs) {
                Write-Host "   - $($blob.name)" -ForegroundColor White
            }
        }
        
        Write-Host ""
        Write-Host "💡 The data might have been lost. Use local backup instead:" -ForegroundColor Yellow
        Write-Host "   .\restore-rsvps.ps1" -ForegroundColor Cyan
        exit 1
    }

    Write-Host "✅ Blob found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⬇️  Downloading RSVP data from Azure..." -ForegroundColor Yellow

    # Download the blob
    az storage blob download `
        --container-name $containerName `
        --name $blobName `
        --file $downloadPath `
        --connection-string $connectionString `
        --only-show-errors

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Downloaded to: $downloadPath" -ForegroundColor Green
        Write-Host ""

        # Read and display the data
        $content = Get-Content $downloadPath -Raw
        $rsvps = $content | ConvertFrom-Json

        Write-Host "📊 RSVP Data Summary:" -ForegroundColor Cyan
        Write-Host "   Total RSVPs: $($rsvps.Count)" -ForegroundColor Green
        Write-Host ""

        if ($rsvps.Count -eq 0) {
            Write-Host "   ⚠️  WARNING: The file is empty (no RSVPs)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   This means the data was deleted/lost in production." -ForegroundColor Yellow
            Write-Host "   You can restore from local backup using:" -ForegroundColor Yellow
            Write-Host "   .\restore-to-azure.ps1" -ForegroundColor Cyan
        } else {
            Write-Host "   RSVPs found:" -ForegroundColor Cyan
            foreach ($rsvp in $rsvps) {
                $status = if ($rsvp.attending) { "✓ Attending" } else { "✗ Not Attending" }
                Write-Host "   - $($rsvp.name) ($($rsvp.email)) - $status" -ForegroundColor White
            }
            
            Write-Host ""
            Write-Host "✅ Data successfully retrieved from Azure Storage!" -ForegroundColor Green
            Write-Host ""
            Write-Host "💾 Backup saved to: $downloadPath" -ForegroundColor Cyan
        }

    } else {
        Write-Host "❌ Failed to download blob" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check your connection string in .env file" -ForegroundColor Cyan
    Write-Host "   2. Verify you have access to the storage account" -ForegroundColor Cyan
    Write-Host "   3. Try logging in: az login" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to restore local backup
if ($rsvps.Count -eq 0 -and (Test-Path "rsvps-latest.json")) {
    Write-Host "💡 Found local backup: rsvps-latest.json" -ForegroundColor Yellow
    $localBackup = Get-Content "rsvps-latest.json" -Raw | ConvertFrom-Json
    Write-Host "   Contains $($localBackup.Count) RSVP(s)" -ForegroundColor Cyan
    Write-Host ""
    
    $restore = Read-Host "Do you want to restore the local backup to Azure? (yes/no)"
    if ($restore -eq "yes") {
        Write-Host ""
        Write-Host "🔄 Uploading local backup to Azure..." -ForegroundColor Yellow
        
        az storage blob upload `
            --container-name $containerName `
            --name $blobName `
            --file "rsvps-latest.json" `
            --connection-string $connectionString `
            --overwrite `
            --content-type "application/json" `
            --only-show-errors
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully restored $($localBackup.Count) RSVP(s) to Azure!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Restored RSVPs:" -ForegroundColor Cyan
            foreach ($rsvp in $localBackup) {
                Write-Host "   - $($rsvp.name) ($($rsvp.email))" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Failed to upload backup" -ForegroundColor Red
        }
    }
}
