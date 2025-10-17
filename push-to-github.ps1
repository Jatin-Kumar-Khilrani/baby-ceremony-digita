# Push to GitHub using Personal Access Token
# This script reads the PAT from .env and pushes to GitHub

Write-Host "🔐 Pushing to GitHub with authentication..." -ForegroundColor Cyan

# Read PAT from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please ensure .env exists with GITHUB_PAT set." -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envFile -Raw
if ($envContent -match 'GITHUB_PAT=(.+)') {
    $githubPat = $matches[1].Trim()
    Write-Host "✅ Found GitHub PAT in .env" -ForegroundColor Green
} else {
    Write-Host "❌ Error: GITHUB_PAT not found in .env!" -ForegroundColor Red
    exit 1
}

# Get the repository URL
$repoUrl = "https://github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita.git"

# Push using PAT
Write-Host "📤 Pushing to origin/main..." -ForegroundColor Cyan
$authUrl = "https://$($githubPat)@github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita.git"

try {
    git push $authUrl main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🚀 GitHub Actions workflow should start now" -ForegroundColor Cyan
        Write-Host "📊 Check status at: https://github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita/actions" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Push failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Error pushing to GitHub: $_" -ForegroundColor Red
    exit 1
}
