# 🎯 Storage Account Auto-Detection

## Overview

The `setup-production.ps1` script now **automatically detects** existing storage accounts in your Azure resource group, eliminating the need to remember or look up storage account names.

## How It Works

### Scenario 1: Storage Account in .env (Valid)
```
✅ Using existing Storage Account from .env: babyceremonystorage
```
**Action:** Uses the storage account name from `.env` file

### Scenario 2: Storage Account in .env = "your-storage-account-name"
```
Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage
```
**Action:** Automatically detects from Azure and uses it

### Scenario 3: One Storage Account Found
```
Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage

Use this account? (y/n): y
```
**Action:** Asks if you want to use the detected account

### Scenario 4: Multiple Storage Accounts Found
```
Checking for storage accounts in resource group: baby-ceremony-rg...
Found multiple storage accounts:
  [1] babyceremonystorage
  [2] babyceremonystorage2
  [3] testceremonystorage

Select storage account (1-3) or enter new name: 1
```
**Action:** Lets you choose from the list or enter a new name

### Scenario 5: No Storage Accounts Found
```
Checking for storage accounts in resource group: baby-ceremony-rg...
Storage Account name (lowercase, no spaces, e.g., babyceremonystorage): 
```
**Action:** Prompts for a new storage account name

## Benefits

### ✅ No Need to Remember Names
- Script looks up existing storage accounts for you
- No more "What was my storage account name?" moments

### ✅ Smart Detection
- Checks `.env` file first
- Falls back to Azure resource group lookup
- Handles multiple accounts gracefully

### ✅ Multiple Account Support
- If you have multiple storage accounts, choose which one
- Or enter a new name to create a new one

### ✅ Prevents Placeholder Values
- Ignores `your-storage-account-name` placeholder
- Forces lookup from Azure instead

## Examples

### Example 1: First Run (No Resources)
```powershell
.\setup-production.ps1

Resource Group name (e.g., baby-ceremony-rg): baby-ceremony-rg
Azure location (e.g., eastus): eastus

Checking for storage accounts in resource group: baby-ceremony-rg...
Storage Account name (lowercase, no spaces, e.g., babyceremonystorage): babyceremonystorage

# Script creates the storage account
```

### Example 2: Subsequent Run (Resource Exists)
```powershell
.\setup-production.ps1

Use existing values from .env? (y/n): y

Using Resource Group: baby-ceremony-rg
Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage

# Automatically uses detected account
```

### Example 3: Placeholder in .env
```
# .env file has:
VITE_AZURE_STORAGE_ACCOUNT=your-storage-account-name
```

```powershell
.\setup-production.ps1

Use existing values from .env? (y/n): y

Checking for storage accounts in resource group: baby-ceremony-rg...
✅ Found storage account: babyceremonystorage

# Ignores placeholder, uses detected account
```

### Example 4: Multiple Accounts
```powershell
.\setup-production.ps1

Checking for storage accounts in resource group: baby-ceremony-rg...
Found multiple storage accounts:
  [1] babyceremonyprod
  [2] babyceremonystaging
  [3] babyceremondev

Select storage account (1-3) or enter new name: 1

# Uses babyceremonyprod
```

## When Does Detection Happen?

### ✅ Detection is Triggered When:
1. `.env` file has placeholder value (`your-storage-account-name`)
2. `.env` file has no `VITE_AZURE_STORAGE_ACCOUNT` value
3. User chooses not to use existing `.env` values
4. Running script for the first time

### ⏭️ Detection is Skipped When:
1. `.env` has a valid storage account name (not placeholder)
2. Storage account is explicitly provided by user

## Technical Details

### Detection Logic
```powershell
# Query Azure for storage accounts in resource group
az storage account list --resource-group $resourceGroup --query "[].name" --output tsv

# Parse results
# - 0 accounts: Prompt for name
# - 1 account: Ask if user wants to use it
# - 2+ accounts: Show selection menu
```

### Placeholder Check
```powershell
if ($envVars['VITE_AZURE_STORAGE_ACCOUNT'] -ne 'your-storage-account-name') {
    # Use the value from .env
} else {
    # Trigger auto-detection
}
```

## Best Practices

### 💡 Recommended Workflow

1. **First Setup:**
   - Let script detect or enter new name
   - Script saves to `.env`

2. **Subsequent Runs:**
   - Use existing `.env` values
   - Script reuses saved storage account

3. **Multiple Environments:**
   - Use different storage accounts per environment
   - Script will list all and let you choose

### 💡 Tips

- **Naming Convention:** Use descriptive names like `babyceremonyprod`, `babyceremonystaging`
- **One per Environment:** Keep separate storage accounts for dev/staging/production
- **Let Script Decide:** When in doubt, let the script auto-detect

## Error Handling

### If Azure CLI Not Logged In
```
Checking for storage accounts in resource group: baby-ceremony-rg...
Storage Account name (lowercase, no spaces, e.g., babyceremonystorage):
```
**Result:** Falls back to manual entry

### If Resource Group Doesn't Exist
```
Checking for storage accounts in resource group: baby-ceremony-rg...
Storage Account name (lowercase, no spaces, e.g., babyceremonystorage):
```
**Result:** Falls back to manual entry, will create resource group later

### If Invalid Selection
```
Select storage account (1-3) or enter new name: 5
```
**Result:** Treats `5` as a new storage account name

## Summary

The script is now **intelligent enough to:**
- ✅ Find existing storage accounts automatically
- ✅ Ignore placeholder values in `.env`
- ✅ Handle single or multiple accounts
- ✅ Fall back to manual entry when needed
- ✅ Save detected account to `.env` for future use

**You no longer need to remember or look up your storage account name!** 🎉
