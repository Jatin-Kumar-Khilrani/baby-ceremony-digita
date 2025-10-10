# Production Readiness Validation Script
# Run this before deploying to production

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "`n🔍 Baby Ceremony - Production Readiness Check" -ForegroundColor $Cyan
Write-Host "=============================================`n" -ForegroundColor $Cyan

$issues = @()
$warnings = @()
$passed = @()

# 1. Check if .env file exists
Write-Host "1️⃣ Checking .env file..." -ForegroundColor $Cyan
if (Test-Path ".env") {
    $passed += "✅ .env file exists"
    
    # Check if it has required variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "VITE_ADMIN_EMAIL",
        "VITE_ADMIN_PIN",
        "VITE_AZURE_STORAGE_ACCOUNT",
        "VITE_AZURE_STORAGE_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            $passed += "  ✓ $var is set"
        } else {
            $issues += "  ✗ $var is missing"
        }
    }
    
    # Check if using default credentials
    if ($envContent -match "admin@baby-ceremony.com") {
        $warnings += "  ⚠️ Using default admin email - CHANGE THIS!"
    }
    if ($envContent -match "VITE_ADMIN_PIN=1234") {
        $warnings += "  ⚠️ Using default PIN (1234) - CHANGE THIS!"
    }
} else {
    $issues += "✗ .env file not found. Copy from .env.template"
}

# 2. Check if .env is in .gitignore
Write-Host "`n2️⃣ Checking .gitignore..." -ForegroundColor $Cyan
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        $passed += "✅ .env is in .gitignore"
    } else {
        $issues += "✗ .env is NOT in .gitignore - SECURITY RISK!"
    }
} else {
    $warnings += "⚠️ .gitignore file not found"
}

# 3. Check if node_modules are installed
Write-Host "`n3️⃣ Checking dependencies..." -ForegroundColor $Cyan
if (Test-Path "node_modules") {
    $passed += "✅ Frontend dependencies installed"
} else {
    $issues += "✗ Frontend dependencies not installed. Run: npm install"
}

if (Test-Path "api/node_modules") {
    $passed += "✅ API dependencies installed"
} else {
    $issues += "✗ API dependencies not installed. Run: cd api && npm install"
}

# 4. Test build
Write-Host "`n4️⃣ Testing build..." -ForegroundColor $Cyan
Write-Host "   Building frontend..." -ForegroundColor $Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    $passed += "✅ Frontend builds successfully"
} else {
    $issues += "✗ Frontend build failed. Run: npm run build"
}

Write-Host "   Building API..." -ForegroundColor $Yellow
Push-Location api
npm run build 2>&1 | Out-Null
$apiBuildResult = $LASTEXITCODE
Pop-Location

if ($apiBuildResult -eq 0) {
    $passed += "✅ API builds successfully"
} else {
    $issues += "✗ API build failed. Run: cd api && npm run build"
}

# 5. Check for TypeScript errors
Write-Host "`n5️⃣ Checking TypeScript..." -ForegroundColor $Cyan
npx tsc --noEmit 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    $passed += "✅ No TypeScript errors"
} else {
    $warnings += "⚠️ TypeScript errors found. Run: npx tsc --noEmit"
}

# 6. Check GitHub workflow
Write-Host "`n6️⃣ Checking GitHub Actions..." -ForegroundColor $Cyan
if (Test-Path ".github/workflows/azure-static-web-apps.yml") {
    $passed += "✅ GitHub Actions workflow configured"
} else {
    $issues += "✗ GitHub Actions workflow not found"
}

# 7. Check staticwebapp.config.json
Write-Host "`n7️⃣ Checking Static Web App config..." -ForegroundColor $Cyan
if (Test-Path "staticwebapp.config.json") {
    $passed += "✅ staticwebapp.config.json exists"
} else {
    $warnings += "⚠️ staticwebapp.config.json not found"
}

# 8. Check documentation
Write-Host "`n8️⃣ Checking documentation..." -ForegroundColor $Cyan
$docs = @(
    "README.md",
    "PRODUCTION_DEPLOYMENT_GUIDE.md",
    "PRODUCTION_CHECKLIST.md",
    "ADMIN_CREDENTIALS.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $passed += "  ✓ $doc"
    } else {
        $warnings += "  ⚠️ $doc not found"
    }
}

# 9. Check for sensitive files
Write-Host "`n9️⃣ Checking for sensitive files..." -ForegroundColor $Cyan
$sensitivePatterns = @("*.key", "*.pem", "*.pfx", "*credentials*.txt", "*secret*.txt")
$foundSensitive = @()

foreach ($pattern in $sensitivePatterns) {
    $files = Get-ChildItem -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        $foundSensitive += $files.Name
    }
}

if ($foundSensitive.Count -eq 0) {
    $passed += "✅ No sensitive files found in repository"
} else {
    $warnings += "⚠️ Found sensitive files: $($foundSensitive -join ', ')"
    $warnings += "  Ensure these are in .gitignore!"
}

# 10. Check Git status
Write-Host "`n🔟 Checking Git status..." -ForegroundColor $Cyan
if (Test-Path ".git") {
    $gitStatus = git status --porcelain .env
    if ($gitStatus) {
        $issues += "✗ .env file is staged/tracked in Git - REMOVE IT!"
    } else {
        $passed += "✅ .env not tracked in Git"
    }
} else {
    $warnings += "⚠️ Not a Git repository"
}

# Display Results
Write-Host "`n" + "="*60 -ForegroundColor $Cyan
Write-Host "📊 Validation Results" -ForegroundColor $Cyan
Write-Host "="*60 + "`n" -ForegroundColor $Cyan

if ($passed.Count -gt 0) {
    Write-Host "✅ PASSED ($($passed.Count)):" -ForegroundColor $Green
    foreach ($item in $passed) {
        Write-Host "   $item" -ForegroundColor $Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️ WARNINGS ($($warnings.Count)):" -ForegroundColor $Yellow
    foreach ($item in $warnings) {
        Write-Host "   $item" -ForegroundColor $Yellow
    }
    Write-Host ""
}

if ($issues.Count -gt 0) {
    Write-Host "❌ ISSUES ($($issues.Count)):" -ForegroundColor $Red
    foreach ($item in $issues) {
        Write-Host "   $item" -ForegroundColor $Red
    }
    Write-Host ""
}

# Final verdict
Write-Host "="*60 + "`n" -ForegroundColor $Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 ALL CHECKS PASSED! Ready for production!" -ForegroundColor $Green
    Write-Host "   Next: Review PRODUCTION_CHECKLIST.md and deploy`n" -ForegroundColor $Green
    exit 0
} elseif ($issues.Count -eq 0) {
    Write-Host "✅ Ready for production with warnings" -ForegroundColor $Yellow
    Write-Host "   Review warnings above before deploying`n" -ForegroundColor $Yellow
    exit 0
} else {
    Write-Host "❌ NOT READY for production!" -ForegroundColor $Red
    Write-Host "   Fix the issues above before deploying`n" -ForegroundColor $Red
    exit 1
}
