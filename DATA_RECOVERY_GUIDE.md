# 🆘 RSVP Data Recovery Guide

## Current Situation
Your RSVP data appears to be lost from production Azure Storage. **Don't panic!** We have local backups.

---

## 📦 Available Backups

### ✅ rsvps-latest.json (2 RSVPs)
- **Jatin Kumar Khilrani** (jatin.khilrani@upesalumni.upes.ac.in)
- **Rajendra** (rkkhilrani@gmail.com)

### ✅ rsvps-check.json (1 RSVP)
- **Jatin Kumar Khilrani** (jatin.khilrani@upesalumni.upes.ac.in)

**Recommended:** Use `rsvps-latest.json` as it has the most complete data.

---

## 🚀 Quick Recovery Steps

### Option 1: Automatic Recovery (Recommended) ⚡

Run these PowerShell scripts in order:

#### Step 1: Check what's in Azure Storage
```powershell
.\check-azure-storage.ps1
```

This will:
- ✅ Download current data from Azure
- ✅ Show you what's there (if anything)
- ✅ Compare with local backups
- ✅ Offer to restore automatically

#### Step 2: Restore from backup (if needed)
```powershell
.\restore-to-azure.ps1
```

This will:
- ✅ Upload `rsvps-latest.json` to Azure Storage
- ✅ Restore all 2 RSVPs to production
- ✅ Verify the upload

---

### Option 2: Manual Recovery via Azure Portal 🌐

If the scripts don't work:

1. **Open Azure Portal**
   - Go to: https://portal.azure.com
   - Sign in with your Azure account

2. **Navigate to Storage Account**
   - Search for your storage account
   - Click on it

3. **Go to Containers**
   - In left menu: Data Storage → Containers
   - Click on: `ceremony-data`

4. **Upload Backup**
   - Click "Upload" button
   - Select file: `rsvps-latest.json`
   - Click "Upload"

5. **Rename File**
   - Click the 3 dots (...) next to uploaded file
   - Choose "Rename"
   - Change name to: `rsvps.json`
   - Click "Save"

6. **Verify**
   - Refresh your website
   - Check admin page to see RSVPs

---

### Option 3: Using Azure CLI 💻

If you have Azure CLI installed:

```powershell
# Set your connection string
$connectionString = "YOUR_AZURE_STORAGE_CONNECTION_STRING"

# Upload the backup
az storage blob upload `
  --container-name ceremony-data `
  --name rsvps.json `
  --file rsvps-latest.json `
  --connection-string $connectionString `
  --overwrite `
  --content-type "application/json"
```

---

## 🛡️ Prevention: Enable Versioning & Backup

### Enable Blob Versioning (Recommended)

1. Go to Azure Portal → Your Storage Account
2. Left menu: Data management → Data protection
3. Enable: **Blob versioning**
4. Enable: **Blob soft delete** (7-30 days retention)
5. Click "Save"

This will keep previous versions of your files!

### Set Up Automated Backups

Create a scheduled task to backup data daily:

```powershell
# Add to your deploy script or create a scheduled task
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "rsvps-latest.json" -Destination "backups/rsvps-backup-$timestamp.json"
```

---

## 📊 Data Summary

### Current Backups Contain:

**rsvps-latest.json:**
```json
{
  "total_rsvps": 2,
  "attending": 2,
  "not_attending": 0,
  "total_guests": 2,
  "names": [
    "Jatin Kumar Khilrani",
    "Rajendra"
  ]
}
```

---

## ✅ Verification Checklist

After restoration:

- [ ] Run: `.\check-azure-storage.ps1` to verify upload
- [ ] Open your website
- [ ] Go to Admin page
- [ ] Verify you see 2 RSVPs
- [ ] Test searching for an RSVP
- [ ] Test editing an RSVP (with new bug fixes!)
- [ ] Check that all data is intact

---

## 🔍 What Caused the Data Loss?

The data loss was likely caused by **Bug #1** that we just fixed:

- When editing an RSVP, if the `rsvps` array was incomplete
- The code would send an empty array `[]` to Azure
- This would delete all RSVPs

**Good news:** This bug is now fixed! The new code:
- ✅ Validates data before updates
- ✅ Prevents accidental deletions
- ✅ Shows error messages instead of losing data
- ✅ Logs suspicious operations

---

## 📞 Need Help?

If the recovery doesn't work:

1. **Check your .env file** has `AZURE_STORAGE_CONNECTION_STRING`
2. **Install Azure CLI** if needed:
   ```powershell
   winget install Microsoft.AzureCLI
   ```
3. **Login to Azure**:
   ```powershell
   az login
   ```
4. **Check your permissions** - you need write access to the storage account

---

## 🎯 Next Steps After Recovery

1. ✅ Restore the data (use scripts above)
2. ✅ Build and deploy the bug fixes:
   ```powershell
   npm run build
   # Then deploy to Azure Static Web App
   ```
3. ✅ Enable blob versioning in Azure Portal
4. ✅ Create regular backups
5. ✅ Test the new validation features

---

## 🔐 Important Files

- `rsvps-latest.json` - **Most recent backup** (2 RSVPs) ⭐
- `rsvps-check.json` - Older backup (1 RSVP)
- `check-azure-storage.ps1` - Check what's in Azure
- `restore-to-azure.ps1` - Quick restore script
- `CRITICAL_BUGS_FIXED.md` - Documentation of fixes

---

**Status: 🟢 Recoverable**

You have good backups! Follow the steps above to restore your data.
