# 🚀 Quick Start: Using setup-production.ps1

## For First-Time Setup

```powershell
# Run the setup script
.\setup-production.ps1

# You'll be prompted for:
# - Resource Group name: baby-ceremony-rg
# - Azure location: eastus
# - Storage Account name: babyceremonystorage (lowercase, no spaces)
# - Static Web App name: baby-ceremony-app
# - Communication Service name: baby-ceremony-comm
# - Admin Email: your-email@example.com
# - Admin PIN: your-4-digit-pin
```

## For Updating Existing Setup

```powershell
# Run the setup script
.\setup-production.ps1

# When prompted:
📋 Found existing .env file
Use existing values from .env? (y/n): y

# Script will:
✅ Load your saved configuration
✅ Check what resources already exist
✅ Only create missing resources
✅ Update .env with fresh keys
✅ Create backup of .env
```

## What the Script Does

### ✅ Smart Detection
- **Azure Login**: Checks if already logged in
- **Resource Group**: Checks if exists, creates only if needed
- **Storage Account**: 
  - ✨ **NEW:** Automatically detects from resource group
  - Ignores placeholder values like "your-storage-account-name"
  - Shows menu if multiple accounts exist
  - Asks for new name if none found
- **Containers**: Checks each one, creates only missing ones
- **Communication Service**: Checks if exists, creates if needed
- **Static Web App**: Checks if exists, creates if needed

### ✅ Safe Updates
- Backs up .env before changes (`.env.backup.timestamp`)
- Updates .env with latest keys and configuration
- Never deletes existing resources
- Preserves your data

### ✅ Output
Script creates:
1. **`.env`** - Updated with all configuration
2. **`.env.backup.*`** - Backup of previous .env
3. **`azure-credentials-*.txt`** - Credentials report (delete after saving to password manager)

## Expected Output

```
🎉 Baby Ceremony - Production Setup Script
==========================================

📋 Found existing .env file
Use existing values from .env? (y/n): y
✅ Will use existing .env values where available

📝 Enter your configuration details:

Using existing Storage Account: babyceremonystorage
Using existing Admin Email: jatin.khilrani@yahoo.com
Using existing Admin PIN from .env
Azure location (default: eastus): [press ENTER]
Static Web App name (default: baby-ceremony-app): [press ENTER]
Communication Service name (default: baby-ceremony-comm): [press ENTER]

📋 Configuration Summary:
  Resource Group: baby-ceremony-rg
  Location: eastus
  Storage Account: babyceremonystorage
  Static Web App: baby-ceremony-app
  Communication Service: baby-ceremony-comm
  Admin Email: jatin.khilrani@yahoo.com

Proceed with setup? (y/n): y

🚀 Starting Azure resource setup...

1️⃣ Checking Azure login status...
✅ Already logged in as: user@example.com

2️⃣ Checking Resource Group...
✅ Resource group already exists: baby-ceremony-rg

3️⃣ Checking Storage Account...
✅ Storage account already exists: babyceremonystorage

4️⃣ Getting Storage Connection String...
✅ Storage connection string retrieved

5️⃣ Getting Storage Account Key...
✅ Storage key retrieved

6️⃣ Creating Blob Containers...
  ✓ Already exists: ceremony-rsvps
  ✓ Already exists: ceremony-wishes
  ✓ Already exists: ceremony-photos
  ✓ Already exists: ceremony-data

7️⃣ Configuring CORS for Storage...
✅ CORS configured (update with production domain later)

8️⃣ Checking Communication Service...
✅ Communication service already exists: baby-ceremony-comm

9️⃣ Getting Communication Connection String...
✅ Communication connection string retrieved

🔟 Checking Static Web App...
✅ Static Web App already exists: baby-ceremony-app

1️⃣1️⃣ Getting Static Web App Deployment Token...
✅ Deployment token retrieved

1️⃣2️⃣ Updating .env file...
   .env file exists, updating values...
   Created backup: .env.backup.20251010-143022
✅ .env file updated

============================================================
🎉 Setup Complete! Here are your credentials:
============================================================
```

## Tips

### 💡 First Run
- Answer all prompts carefully
- Use lowercase for storage account name
- Choose memorable names for resources

### 💡 Subsequent Runs
- Say **yes** to "Use existing values from .env?"
- Just press ENTER for defaults
- Script completes in seconds

### 💡 Updating Admin Credentials
1. Edit `.env` file manually
2. Update `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PIN`
3. Run script to apply changes

### 💡 If You Delete a Resource
- Just run the script again
- It will detect the missing resource
- And recreate it automatically

## Common Scenarios

### Scenario 1: Fresh Start
```powershell
# Delete .env if you want to start fresh
Remove-Item .env

# Run script - will prompt for everything
.\setup-production.ps1
```

### Scenario 2: Update Keys Only
```powershell
# Run script with existing values
.\setup-production.ps1
# Answer 'y' to use existing values
# Script retrieves fresh keys from Azure
```

### Scenario 3: Add Missing Container
```powershell
# Container was deleted in Azure Portal
# Run script
.\setup-production.ps1
# Script detects missing container and recreates it
```

### Scenario 4: Change Admin Credentials
```powershell
# Edit .env
notepad .env

# Change VITE_ADMIN_EMAIL and VITE_ADMIN_PIN
# Save file

# Run script to update Azure
.\setup-production.ps1
```

## Troubleshooting

### "Not logged in to Azure"
```powershell
# Script will automatically prompt you to login
# Or login manually first:
az login
```

### "Storage account name already taken"
```powershell
# Choose a different name (must be globally unique)
# Try: babyceremonystorage<yourname>
# Or: babyceremonystorage<random>
```

### "Communication extension not found"
```powershell
# Install the extension:
az extension add --name communication
# Then run script again
```

## Next Steps After Script Completes

1. ✅ Verify .env file has all values filled
2. ✅ Add GitHub Secrets (see script output)
3. ✅ Configure Azure Function App Settings
4. ✅ Set up email domain in Communication Service
5. ✅ Update CORS with production domain
6. ✅ Push code to GitHub
7. ✅ Test deployment

## 🎉 You're Ready!

The script is now **intelligent** and **safe to run multiple times**. It will:
- ✅ Remember your settings
- ✅ Detect existing resources
- ✅ Only create what's missing
- ✅ Back up your .env
- ✅ Keep everything in sync

**Happy deploying!** 🚀
