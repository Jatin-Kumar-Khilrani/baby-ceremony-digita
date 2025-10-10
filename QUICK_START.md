# 🚀 Quick Setup Guide - Azure Baby Ceremony Invitation

## Step 1: Install Azure CLI (Already Done! ✅)

Azure CLI is already installed. Just need to restart your terminal.

**Action**: Close this terminal and open a new PowerShell window.

## Step 2: Verify Installation

In the new terminal, run:
```powershell
az --version
```

You should see the Azure CLI version.

## Step 3: Login to Azure

```powershell
az login --use-device-code
```

This will display a code. Go to https://microsoft.com/devicelogin and enter the code to authenticate.

**Alternative (browser-based login):**
```powershell
az login
```

## Step 4: Create Azure Resources

### 4.1 Set Variables (customize if needed)
```powershell
$resourceGroup = "baby-ceremony-rg"
$location = "eastus"
$storageAccount = "babyceremonystorage$(Get-Random -Maximum 9999)"
$staticWebApp = "baby-ceremony-app"
```

### 4.2 Create Resource Group
```powershell
az group create --name $resourceGroup --location $location
```

### 4.3 Create Storage Account
```powershell
az storage account create `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --location $location `
    --sku Standard_LRS `
    --kind StorageV2
```

### 4.4 Get Connection String (SAVE THIS!)
```powershell
$connectionString = az storage account show-connection-string `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --query connectionString `
    --output tsv

Write-Host "Connection String: $connectionString" -ForegroundColor Green
```

**📋 COPY THE CONNECTION STRING - You'll need it in the next step!**

## Step 5: Configure Local Development

### 5.1 Create API Settings File
```powershell
cd api
```

Create a file named `local.settings.json` with this content (replace YOUR_CONNECTION_STRING):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "YOUR_CONNECTION_STRING_HERE"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
```

### 5.2 Install API Dependencies
```powershell
npm install
```

### 5.3 Go back to root directory
```powershell
cd ..
```

## Step 6: Test Locally

### Terminal 1 - Start API
```powershell
cd api
npm start
```

You should see:
```
Functions:
  rsvps: [GET,POST] http://localhost:7071/api/rsvps
  wishes: [GET,POST] http://localhost:7071/api/wishes
  photos: [GET,POST] http://localhost:7071/api/photos
```

### Terminal 2 - Start Frontend
```powershell
npm run dev
```

Open http://localhost:5173 or http://localhost:5174

## Step 7: Test Shared Data

1. Open the app in one browser
2. Submit an RSVP
3. Open in another browser (or incognito)
4. Refresh - you should see the same RSVP! 🎉

## Troubleshooting

### "az: The term 'az' is not recognized"
- Close and reopen your terminal
- Or restart VS Code

### "Cannot find module '@azure/functions'"
- Run `npm install` in the `api` folder

### API not starting
- Make sure `local.settings.json` exists in `api` folder
- Check that connection string is correctly pasted

### Data not saving
- Check terminal running API for errors
- Verify connection string is correct
- Check browser console for fetch errors

## Alternative: Test Without Azure (LocalStorage Fallback)

If you want to test the frontend without setting up Azure yet:

```powershell
npm run dev
```

The app will use localStorage as a fallback. Data won't be shared between browsers, but you can see the UI and functionality.

## Next Steps After Local Testing

Once local testing works, see `DEPLOYMENT.md` for deploying to production!

---

## Quick Command Summary

```powershell
# 1. Login
az login

# 2. Create resources
$resourceGroup = "baby-ceremony-rg"
$storageAccount = "babyceremonystorage$(Get-Random -Maximum 9999)"
az group create --name $resourceGroup --location eastus
az storage account create --name $storageAccount --resource-group $resourceGroup --location eastus --sku Standard_LRS

# 3. Get connection string
az storage account show-connection-string --name $storageAccount --resource-group $resourceGroup --query connectionString --output tsv

# 4. Setup API
cd api
npm install
# Create local.settings.json with connection string
npm start

# 5. In new terminal - Start frontend
npm run dev
```

🎊 **Ready to celebrate!**
