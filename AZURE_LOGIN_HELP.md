# 🔧 Azure Login Troubleshooting

## Issue: "No subscriptions found" or Multiple Tenants

### What Happened
The Azure CLI detected your account but found:
- Multiple tenants (work account: Qcom)
- No active Azure subscriptions
- MFA requirement

### Solutions

---

## ✅ Option A: Login with Personal Account

If you have a **personal Microsoft account** with Azure credits:

```powershell
az login --use-device-code
```

**Steps:**
1. Copy the device code shown
2. Go to https://microsoft.com/devicelogin
3. Enter the code
4. **Select your PERSONAL Microsoft account** (not @qcom or work account)
5. Complete MFA if prompted
6. Return to terminal and continue

Then run setup again:
```powershell
.\setup-azure-simple.ps1
```

---

## ✅ Option B: Create Free Azure Account

Get **$200 free credits** for 30 days!

### Steps:

1. **Go to Azure Free Account:**
   - Visit: https://azure.microsoft.com/free
   - Click "Start free"

2. **Sign up with Personal Email:**
   - Use a personal Microsoft account (Outlook, Hotmail, Live)
   - NOT your work account (jatin.k.khilrani@qcom.com)
   - Complete verification

3. **Activate Free Credits:**
   - Get $200 credit for 30 days
   - Free services for 12 months
   - Always-free services

4. **Login to Azure CLI:**
   ```powershell
   az login --use-device-code
   ```

5. **Run Setup:**
   ```powershell
   .\setup-azure-simple.ps1
   ```

---

## ✅ Option C: Use Different Account Email

If you want to use a specific account:

```powershell
# Login with specific email
az login --use-device-code --username your.personal.email@outlook.com
```

Or specify tenant:
```powershell
# If you know your tenant ID
az login --use-device-code --tenant YOUR_TENANT_ID
```

---

## ✅ Option D: Test Without Azure (Quick Demo)

Want to just see the app working without cloud setup?

```powershell
# Just run the frontend
npm run dev
```

**What this does:**
- ✅ Shows the beautiful invitation
- ✅ RSVP, wishes, and photos work
- ❌ Data stored in browser only (not shared)
- ❌ Each browser sees different data

**Good for:** Testing the UI and seeing the design

---

## 🔍 Verify Your Login

After successful login, verify your subscription:

```powershell
# List your subscriptions
az account list --output table

# Show current subscription
az account show

# Set default subscription (if you have multiple)
az account set --subscription "SUBSCRIPTION_NAME_OR_ID"
```

---

## 💡 Understanding Azure Costs

### Free Tier Includes:
- **Static Web Apps**: FREE (100GB bandwidth/month)
- **Azure Functions**: FREE (1 million executions/month)
- **Blob Storage**: 
  - First 5GB free
  - Then ~$0.02/GB/month
  - Estimated: **$0.10-$1.00/month** total

### With $200 Free Credits:
- More than enough for development and testing
- Credits last 30 days
- After that, only pay for what you use (~$1/month)

---

## 📞 Still Having Issues?

### Check Azure Account Status
1. Go to https://portal.azure.com
2. Sign in with your personal account
3. Check if you have an active subscription
4. Look for "Free Trial" or "Pay-As-You-Go"

### Common Issues:

**"Authentication failed... MFA required"**
- Solution: Complete MFA on the device login page

**"No subscriptions found"**
- Solution: Create free account at https://azure.microsoft.com/free

**"Multiple tenants"**
- Solution: Select your personal account during login

**"AADSTS50076 error"**
- Solution: This is MFA requirement - complete authentication

---

## 🚀 After Successful Login

Once you successfully login and have an active subscription:

```powershell
# Run the setup script
.\setup-azure-simple.ps1

# Or follow manual steps in QUICK_START.md
```

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `az login --use-device-code` | Login with device code |
| `az account list` | List subscriptions |
| `az account show` | Show current subscription |
| `az account set --subscription "NAME"` | Set default subscription |
| `az logout` | Logout from Azure CLI |

---

## 📖 Next Steps

After successful Azure setup:
1. ✅ Login complete
2. ✅ Run `.\setup-azure-simple.ps1`
3. ✅ Setup creates storage account
4. ✅ Start API: `cd api && npm start`
5. ✅ Start frontend: `npm run dev`
6. ✅ Test shared data in multiple browsers!

---

**Need help?** See START_HERE.md or QUICK_START.md for more options.
