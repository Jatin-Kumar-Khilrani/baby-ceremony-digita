# 📦 Automated Backup & Restore System

## Overview

Your RSVP system now has a complete automated backup and restore solution built into the Admin Panel!

---

## ✨ Features

### 1. **Automated Daily Backups** ⏰
- Backups run automatically every day at 2:00 AM UTC
- Each backup includes complete RSVP data
- Backups are stored for 30 days, then auto-deleted
- No manual intervention needed!

### 2. **Manual Backups** 🎯
- Create backups anytime from the Admin Panel
- Useful before making major changes
- Stored alongside automated backups

### 3. **Easy Restore** 🔄
- Browse all available backups
- One-click restore to any previous date
- See RSVP count before restoring

### 4. **Backup Management** 🗂️
- View all backups with timestamps
- Download backups for offline storage
- Delete old backups manually

---

## 🚀 How to Use

### Access the Backup Panel

1. Log in to **Admin Panel**
2. Click the "**Backups**" tab (new 4th tab)
3. You'll see all available backups

### Create a Manual Backup

1. Go to **Backups** tab
2. Click "**Create Backup Now**" button
3. ✅ Done! Backup is created instantly

### Restore from a Backup

1. Browse the list of backups
2. Click "**Restore**" on the backup you want
3. Confirm the restoration (this replaces current data!)
4. ✅ Data is restored!

### Download a Backup

1. Click "**Download**" button next to any backup
2. Save the JSON file locally
3. Use it for manual recovery if needed

### Delete a Backup

1. Click "**Delete**" (trash icon) next to any backup
2. Confirm deletion
3. ✅ Backup is removed

---

## 📁 New Files Created

### Backend (API)

1. **`api/backup.ts`** - Backup & Restore API endpoint
   - `GET /api/backup` - List all backups
   - `POST /api/backup?action=create` - Create new backup
   - `POST /api/backup?action=restore` - Restore from backup
   - `POST /api/backup?action=delete` - Delete a backup

2. **`api/scheduledBackup.ts`** - Automated daily backup
   - Runs at 2:00 AM UTC every day
   - Creates timestamped backups
   - Cleans up backups older than 30 days

### Frontend

3. **Updated `src/pages/Admin.tsx`**
   - Added new "Backups" tab
   - Backup management UI
   - Restore functionality
   - Real-time backup list

4. **Updated `src/components/AdminAuth.tsx`**
   - Stores admin API key for backup requests

---

## 🔒 Security

### API Authentication
- All backup operations require admin authentication
- Uses `x-admin-key` header
- Key stored in session storage after login

### Access Control
- Only admins can create/restore/delete backups
- Backups are stored in private Azure Storage container
- Not accessible without authentication

---

## 💾 Storage Structure

### Azure Storage Containers

```
ceremony-data/              # Main data
  └── rsvps.json           # Current RSVP data

ceremony-data-backups/      # Backup storage
  ├── rsvps-backup-2025-10-17-020000.json  # Auto backup
  ├── rsvps-backup-2025-10-18-020000.json  # Auto backup
  └── rsvps-backup-2025-10-18-143022.json  # Manual backup
```

### Backup Metadata
Each backup includes:
- **timestamp**: When backup was created
- **rsvpCount**: Number of RSVPs in backup
- **createdBy**: `scheduled-backup` or `manual-backup`
- **date**: Date string (YYYY-MM-DD)

---

## 📅 Backup Schedule

| Time (UTC) | Action | Retention |
|------------|--------|-----------|
| 2:00 AM | Daily auto-backup | 30 days |
| Manual | On-demand backup | Forever (until manually deleted) |

**Note**: Automated backups older than 30 days are auto-deleted during the next backup run.

---

## 🛠️ Configuration

### Environment Variables (.env)

```env
# Admin API Key (for backup operations)
ADMIN_SECRET_KEY=baby-ceremony-admin-2025-secure-key-change-this

# Azure Storage Connection String
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

### Change Backup Schedule

Edit `api/scheduledBackup.ts`:

```typescript
// Current: Every day at 2:00 AM UTC
app.timer('scheduledBackup', {
  schedule: '0 0 2 * * *', // NCRONTAB format
  handler: scheduledBackup
});

// Examples:
// Every 6 hours:  '0 0 */6 * * *'
// Every week:     '0 0 2 * * 0'  // Sunday 2 AM
// Twice daily:    '0 0 2,14 * * *'  // 2 AM and 2 PM
```

---

## 🔧 Deployment Steps

### 1. Update Local Settings

The API needs the connection string in `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=babyceremonystorage4848;AccountKey=...",
    "ADMIN_SECRET_KEY": "baby-ceremony-admin-2025-secure-key-change-this"
  }
}
```

### 2. Deploy to Azure

```powershell
# Build the project
npm run build

# Deploy (your existing process)
# The new API endpoints will be deployed automatically
```

### 3. Add Environment Variables to Azure

In Azure Portal → Function App → Configuration → Application Settings:

```
AZURE_STORAGE_CONNECTION_STRING = [Your connection string]
ADMIN_SECRET_KEY = baby-ceremony-admin-2025-secure-key-change-this
```

### 4. Test the System

1. Go to Admin Panel → Backups tab
2. Click "Create Backup Now"
3. Verify backup appears in the list
4. Try restoring from a backup

---

## 🎯 Use Cases

### Before Making Major Changes
```
1. Go to Backups tab
2. Click "Create Backup Now"
3. Make your changes
4. If something goes wrong, restore from backup
```

### Recovering Lost Data
```
1. Go to Backups tab
2. Find the backup from before data was lost
3. Click "Restore"
4. Confirm restoration
5. ✅ Data recovered!
```

### Downloading for Offline Storage
```
1. Go to Backups tab
2. Click "Download" on important backups
3. Save to your computer
4. Use as additional backup layer
```

---

## 📊 Monitoring

### Check Backup Status

**In Azure Portal:**
1. Go to Storage Account → ceremony-data-backups
2. See all backup files with timestamps
3. Download manually if needed

**In Admin Panel:**
1. Go to Backups tab
2. See all backups with metadata
3. Shows auto vs manual backups

### Verify Scheduled Backups

Check Function App logs:
1. Azure Portal → Function App → Functions → scheduledBackup
2. View execution history
3. See logs for each backup run

---

## ⚠️ Important Notes

### Data Safety
- ✅ Backups are created BEFORE any data changes
- ✅ Restoration creates a full copy, no partial updates
- ✅ Original data is backed up before restore
- ⚠️ Always create a manual backup before major changes!

### Performance
- Backups are async and don't block the app
- Restoration may take a few seconds
- Large datasets (hundreds of RSVPs) work fine

### Limitations
- Maximum 30 days of auto-backups
- Manual backups must be deleted manually
- Backups don't include photos (only RSVP data)

---

## 🔮 Future Enhancements

Possible improvements:
- [ ] Email notifications when backups fail
- [ ] Backup of Wishes and Photos data
- [ ] Point-in-time recovery
- [ ] Backup comparison tool
- [ ] Automatic backup before bulk delete

---

## 🆘 Troubleshooting

### "Failed to load backups"
- Check admin key is set correctly
- Verify Azure Storage connection string
- Check Function App is running

### "Failed to create backup"
- Check ADMIN_SECRET_KEY matches in .env and Azure
- Verify storage account has enough space
- Check Function App logs for errors

### "Restore not working"
- Ensure backup exists in Azure Storage
- Check admin authentication
- Verify network connectivity

### Manual Recovery
If API fails, use Azure Portal:
1. Go to Storage Account → ceremony-data-backups
2. Download the backup file you want
3. Upload to ceremony-data container as `rsvps.json`

---

## ✅ Summary

You now have:
- ✅ **Automated daily backups** (no action needed!)
- ✅ **Manual backup creation** (anytime you want)
- ✅ **Easy one-click restore** (from any backup)
- ✅ **30-day retention** (automatic cleanup)
- ✅ **Admin panel integration** (user-friendly UI)
- ✅ **Secure authentication** (admin-only access)

**Your RSVP data is now protected! 🎉**

---

## 📞 Need Help?

If you encounter issues:
1. Check Azure Function App logs
2. Verify environment variables
3. Test API endpoints manually
4. Review this guide for troubleshooting steps

**Happy backing up! 💾**
