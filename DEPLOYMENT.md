# Azure Deployment Guide

This guide will help you deploy your baby ceremony invitation website to Azure using your Azure credits.

## Prerequisites

- Azure account with active credits
- Azure CLI installed: `winget install Microsoft.AzureCLI`
- Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4`

## Step 1: Create Azure Resources

### 1.1 Login to Azure
```powershell
az login
```

### 1.2 Create Resource Group
```powershell
az group create --name baby-ceremony-rg --location eastus
```

### 1.3 Create Storage Account
```powershell
az storage account create `
  --name babyceremonystorage `
  --resource-group baby-ceremony-rg `
  --location eastus `
  --sku Standard_LRS
```

### 1.4 Get Storage Connection String
```powershell
az storage account show-connection-string `
  --name babyceremonystorage `
  --resource-group baby-ceremony-rg `
  --query connectionString `
  --output tsv
```

**Save this connection string - you'll need it!**

### 1.5 Create Static Web App
```powershell
az staticwebapp create `
  --name baby-ceremony-app `
  --resource-group baby-ceremony-rg `
  --source https://github.com/YOUR_USERNAME/baby-ceremony-digita `
  --location eastus2 `
  --branch main `
  --app-location "/" `
  --api-location "api" `
  --output-location "dist"
```

## Step 2: Configure Local Development

### 2.1 Install API Dependencies
```powershell
cd api
npm install
```

### 2.2 Configure Local Settings
Copy `local.settings.json.template` to `local.settings.json`:
```powershell
cp local.settings.json.template local.settings.json
```

Edit `local.settings.json` and replace `YOUR_AZURE_STORAGE_CONNECTION_STRING_HERE` with your actual connection string from Step 1.4.

### 2.3 Start Local API
```powershell
cd api
npm start
```

### 2.4 Start Frontend (in new terminal)
```powershell
npm run dev
```

## Step 3: Deploy to Azure

### 3.1 Get Deployment Token
```powershell
az staticwebapp secrets list `
  --name baby-ceremony-app `
  --resource-group baby-ceremony-rg `
  --query "properties.apiKey" `
  --output tsv
```

### 3.2 Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: (token from step 3.1)
- `AZURE_STORAGE_CONNECTION_STRING`: (connection string from step 1.4)

### 3.3 Push to GitHub
```powershell
git add .
git commit -m "Add Azure Functions API"
git push origin main
```

GitHub Actions will automatically deploy your app!

## Step 4: Configure Production Environment

### 4.1 Set Environment Variables in Azure
```powershell
az staticwebapp appsettings set `
  --name baby-ceremony-app `
  --resource-group baby-ceremony-rg `
  --setting-names AZURE_STORAGE_CONNECTION_STRING="YOUR_CONNECTION_STRING"
```

## Step 5: Access Your App

Your app will be available at:
```
https://baby-ceremony-app.azurestaticapps.net
```

You can also set up a custom domain in the Azure Portal.

## Cost Estimate

With Azure Free Tier:
- **Static Web Apps**: Free tier (100GB bandwidth/month)
- **Azure Functions**: Free (1 million executions/month)
- **Blob Storage**: ~$0.02/GB/month (~$0.10-0.50/month)

**Total Monthly Cost: ~$0.10 - $1.00** 🎉

## Testing

### Test API Locally
```powershell
# Get RSVPs
curl http://localhost:7071/api/rsvps

# Get Wishes
curl http://localhost:7071/api/wishes

# Get Photos
curl http://localhost:7071/api/photos
```

### Test in Production
Replace `localhost:7071` with your Azure Static Web App URL.

## Troubleshooting

### API not working locally
- Make sure `local.settings.json` has correct connection string
- Check if Azure Functions Core Tools is running on port 7071
- Verify CORS settings in `local.settings.json`

### Data not saving
- Check browser console for API errors
- Verify storage account connection string
- Check Azure Function logs in Azure Portal

### Photos not uploading
- Verify storage container permissions (set to "blob" access)
- Check file size limits (max 50MB for Azure Functions)
- Ensure content type is set correctly

## Next Steps

1. **Custom Domain**: Set up your own domain in Azure Portal
2. **Monitoring**: Enable Application Insights for analytics
3. **Backups**: Set up automated backups of storage data
4. **Security**: Add authentication for admin features (optional)

Enjoy your production-ready baby ceremony invitation! 🎊👶
