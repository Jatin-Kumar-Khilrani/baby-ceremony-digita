# Switch to Personal Azure Account
# This script helps you logout from work account and login with personal account

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔄 Switch to Personal Azure Account                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Logout from current account" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
az logout
Write-Host "✅ Logged out successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Login with Personal Account" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: When choosing account, select:" -ForegroundColor Yellow
Write-Host "   ✅ Your PERSONAL Microsoft account" -ForegroundColor Green
Write-Host "      (e.g., yourname@outlook.com, @hotmail.com, @live.com)" -ForegroundColor Gray
Write-Host ""
Write-Host "   ❌ NOT your work account:" -ForegroundColor Red
Write-Host "      (jatin.k.khilrani@qcom.com)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to continue with login..." -ForegroundColor Cyan
Read-Host

az login --use-device-code

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ Login Successful!                                    ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Checking your subscriptions..." -ForegroundColor Cyan
    az account list --output table
    
    Write-Host ""
    Write-Host "🎉 Great! You have active subscriptions!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next Step: Run the setup script" -ForegroundColor Cyan
    Write-Host "   .\setup-azure-simple.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ Login Failed                                         ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. No Personal Account with Azure?" -ForegroundColor White
    Write-Host "   → Create FREE account: https://azure.microsoft.com/free" -ForegroundColor Cyan
    Write-Host "   → Get `$200 free credits for 30 days!" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Still logged into work account?" -ForegroundColor White
    Write-Host "   → Make sure you select the PERSONAL account during login" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Want to test without Azure?" -ForegroundColor White
    Write-Host "   → Run: npm run dev" -ForegroundColor Cyan
    Write-Host "   → (UI works, but data not shared between browsers)" -ForegroundColor Gray
    Write-Host ""
}
