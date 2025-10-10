# Setup Script Improvements

## 🎯 Overview

The `setup-production.ps1` script has been enhanced to intelligently detect and reuse existing Azure resources, making it safe to run multiple times without creating duplicate resources or overwriting existing configurations.

## ✨ New Features

### 1. **Azure Login Check**
- ✅ Checks if already logged into Azure
- ✅ Shows current logged-in account
- ✅ Only prompts for login if not authenticated
- ✅ No more unnecessary login prompts!

### 2. **Resource Group Detection**
- ✅ Checks if resource group already exists
- ✅ Reuses existing resource group
- ✅ Only creates if it doesn't exist
- ✅ Prevents "already exists" errors

### 3. **Storage Account Detection**
- ✅ Checks if storage account already exists
- ✅ Reuses existing storage account
- ✅ Only creates if it doesn't exist
- ✅ Retrieves keys from existing account

### 4. **Container Detection**
- ✅ Checks each container individually
- ✅ Skips containers that already exist
- ✅ Only creates missing containers
- ✅ Shows clear status for each container

### 5. **CORS Configuration**
- ✅ Clears existing CORS rules first
- ✅ Applies fresh CORS configuration
- ✅ Uses account key for authentication
- ✅ Prevents duplicate CORS rules

### 6. **Communication Service Detection**
- ✅ Checks if communication service exists
- ✅ Reuses existing service
- ✅ Only creates if it doesn't exist
- ✅ Provides guidance if extension needed

### 7. **Static Web App Detection**
- ✅ Checks if static web app already exists
- ✅ Reuses existing app
- ✅ Only prompts for GitHub repo if creating new
- ✅ Skips creation if already exists

### 8. **.env File Management**
- ✅ Detects existing .env file
- ✅ Offers to use existing values
- ✅ Creates backup before updating (.env.backup.timestamp)
- ✅ Preserves your settings
- ✅ Parses and reuses stored configuration

### 9. **Enhanced .env Variables**
Now includes Azure resource names for easy reuse:
```env
AZURE_RESOURCE_GROUP=baby-ceremony-rg
AZURE_LOCATION=eastus
AZURE_STATIC_WEB_APP=baby-ceremony-app
AZURE_COMM_SERVICE=baby-ceremony-comm
```

## 🚀 How to Use

### First Time Setup
```powershell
.\setup-production.ps1
```
- Answer all prompts
- Script creates all resources
- Saves configuration to .env

### Subsequent Runs
```powershell
.\setup-production.ps1
```
- Script detects existing .env
- Asks: "Use existing values from .env? (y/n)"
- If **yes**: Loads saved values, only prompts for missing info
- If **no**: Prompts for everything again

## 📋 Example Flow

### When .env Exists:
```
📋 Found existing .env file
Use existing values from .env? (y/n): y
✅ Will use existing .env values where available

Using existing Storage Account: babyceremonystorage
Using existing Admin Email: jatin.khilrani@yahoo.com
Using existing Admin PIN from .env

Azure location (default: eastus): [ENTER]
```

### Resource Detection:
```
1️⃣ Checking Azure login status...
✅ Already logged in as: user@example.com

2️⃣ Checking Resource Group...
✅ Resource group already exists: baby-ceremony-rg

3️⃣ Checking Storage Account...
✅ Storage account already exists: babyceremonystorage

6️⃣ Creating Blob Containers...
  ✓ Already exists: ceremony-rsvps
  ✓ Already exists: ceremony-wishes
  ✓ Already exists: ceremony-photos
  ✓ Already exists: ceremony-data

🔟 Checking Static Web App...
✅ Static Web App already exists: baby-ceremony-app
```

## 🔧 What Gets Updated

### Always Updated:
1. **.env file** - Updated with latest keys and configuration
2. **CORS rules** - Cleared and reapplied
3. **Backup created** - .env.backup.timestamp before any changes

### Only Created If Missing:
1. Resource Group
2. Storage Account
3. Blob Containers
4. Communication Service
5. Static Web App

### Always Retrieved:
1. Storage Account Key
2. Storage Connection String
3. Communication Connection String
4. Static Web App Deployment Token

## 💡 Benefits

### ✅ Safe to Run Multiple Times
- No duplicate resources created
- No "already exists" errors
- Idempotent operations

### ✅ Time Saving
- Skips Azure login if already authenticated
- Reuses existing .env values
- Only creates what's missing

### ✅ No Data Loss
- Backs up .env before updating
- Preserves existing containers
- Maintains existing resources

### ✅ Clear Feedback
- Shows what exists vs. what's being created
- Displays current logged-in account
- Indicates reused values

## 📝 .env File Structure

```env
# Admin Authentication (used by app)
VITE_ADMIN_EMAIL=jatin.khilrani@yahoo.com
VITE_ADMIN_PIN=8585

# Azure Configuration (used by setup script)
AZURE_RESOURCE_GROUP=baby-ceremony-rg
AZURE_LOCATION=eastus
AZURE_STATIC_WEB_APP=baby-ceremony-app
AZURE_COMM_SERVICE=baby-ceremony-comm

# Azure Storage (used by app)
VITE_AZURE_STORAGE_ACCOUNT=babyceremonystorage
VITE_AZURE_STORAGE_KEY=abc123...
VITE_AZURE_CONTAINER_RSVPS=ceremony-rsvps
VITE_AZURE_CONTAINER_WISHES=ceremony-wishes
VITE_AZURE_CONTAINER_PHOTOS=ceremony-photos
VITE_AZURE_CONTAINER_DATA=ceremony-data
```

## 🎯 Use Cases

### 1. Initial Setup
Run script → Create all resources → Save to .env

### 2. Update Admin Credentials
Edit .env → Run script → Credentials updated

### 3. Add Missing Resources
Delete a resource in Azure → Run script → Resource recreated

### 4. Retrieve Latest Keys
Run script → Keys refreshed in .env

### 5. Multiple Environments
Use different .env files for dev/staging/production

## ⚠️ Important Notes

1. **Backups**: Each run creates a timestamped .env backup
2. **Git**: .env is in .gitignore (never committed)
3. **Security**: Credentials file still created for your records
4. **CORS**: Always updated (clear + add) for consistency
5. **Keys**: Always retrieved fresh from Azure

## 🔒 Security Features

- ✅ .env excluded from Git
- ✅ Credentials backup has timestamp
- ✅ PIN input hidden (SecureString) on first entry
- ✅ Reused from .env on subsequent runs
- ✅ Warning to delete credentials file after saving

## 🎉 Result

You can now run `setup-production.ps1` as many times as needed without worry! It will:
- Detect what you have
- Create what's missing
- Update what's necessary
- Preserve your data
- Save you time

**Perfect for iterative development and deployment!** 🚀
