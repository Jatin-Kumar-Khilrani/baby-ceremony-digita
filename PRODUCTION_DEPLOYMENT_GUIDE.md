# Production Deployment Guide

This guide will help you deploy your Baby Ceremony Digital Invitation to Azure Static Web Apps with Azure Functions.

## 📋 Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az --version` to check)
- Node.js 18+ and npm installed
- Git installed and repository pushed to GitHub

## 🔐 Step 1: Configure Environment Variables

### 1.1 Create Local .env File

```bash
# Copy the template
cp .env.template .env
```

### 1.2 Update .env with Your Values

Edit `.env` and set secure values:

```env
# Admin Authentication - CHANGE THESE!
VITE_ADMIN_EMAIL=your-secure-email@yourdomain.com
VITE_ADMIN_PIN=your-secure-4-digit-pin

# Azure Storage - Will be set after Azure setup
VITE_AZURE_STORAGE_ACCOUNT=your-storage-account-name
VITE_AZURE_STORAGE_KEY=your-storage-account-key

# Containers (can keep these or customize)
VITE_AZURE_CONTAINER_RSVPS=ceremony-rsvps
VITE_AZURE_CONTAINER_WISHES=ceremony-wishes
VITE_AZURE_CONTAINER_PHOTOS=ceremony-photos
VITE_AZURE_CONTAINER_DATA=ceremony-data
```

⚠️ **IMPORTANT**: Never commit `.env` to Git! It's already in `.gitignore`.

## 🏗️ Step 2: Azure Resources Setup

### 2.1 Login to Azure

```bash
az login
```

### 2.2 Set Your Subscription

```bash
# List available subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "Your-Subscription-Name"
```

### 2.3 Create Resource Group

```bash
az group create \
  --name baby-ceremony-rg \
  --location eastus
```

### 2.4 Create Storage Account

```bash
# Create storage account
az storage account create \
  --name babyceremonystorage \
  --resource-group baby-ceremony-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name babyceremonystorage \
  --resource-group baby-ceremony-rg \
  --output tsv
```

Copy the connection string for later use.

### 2.5 Create Blob Containers

```bash
# Set the storage account name
STORAGE_ACCOUNT="babyceremonystorage"

# Create containers with public blob access for photos
az storage container create --name ceremony-rsvps --account-name $STORAGE_ACCOUNT
az storage container create --name ceremony-wishes --account-name $STORAGE_ACCOUNT
az storage container create --name ceremony-photos --account-name $STORAGE_ACCOUNT --public-access blob
az storage container create --name ceremony-data --account-name $STORAGE_ACCOUNT
```

### 2.6 Configure CORS for Storage Account

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT DELETE OPTIONS \
  --origins '*' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600 \
  --account-name $STORAGE_ACCOUNT
```

### 2.7 Create Azure Communication Service (for Email)

```bash
# Create communication service
az communication create \
  --name baby-ceremony-comm \
  --resource-group baby-ceremony-rg \
  --location global \
  --data-location UnitedStates

# Get connection string
az communication show-connection-string \
  --name baby-ceremony-comm \
  --resource-group baby-ceremony-rg \
  --output tsv
```

## 🚀 Step 3: Deploy to Azure Static Web Apps

### 3.1 Build the Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 3.2 Create Static Web App

```bash
az staticwebapp create \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --location eastus2 \
  --source https://github.com/YOUR-USERNAME/YOUR-REPO \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

### 3.3 Get Deployment Token

```bash
az staticwebapp secrets list \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --query "properties.apiKey" \
  --output tsv
```

Copy this token - you'll need it for GitHub Actions.

### 3.4 Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

1. `AZURE_STATIC_WEB_APPS_API_TOKEN` - from step 3.3
2. `VITE_ADMIN_EMAIL` - your admin email
3. `VITE_ADMIN_PIN` - your secure PIN
4. `VITE_AZURE_STORAGE_ACCOUNT` - your storage account name
5. `VITE_AZURE_STORAGE_KEY` - your storage account key

## ⚙️ Step 4: Configure Azure Function App Settings

Set environment variables for the Azure Functions API:

```bash
az staticwebapp appsettings set \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --setting-names \
    AZURE_STORAGE_CONNECTION_STRING="your-storage-connection-string" \
    AZURE_COMMUNICATION_CONNECTION_STRING="your-comm-connection-string" \
    SENDER_EMAIL="DoNotReply@your-verified-domain.com" \
    ALLOWED_ORIGINS="https://baby-ceremony-app.azurestaticapps.net"
```

## 📧 Step 5: Setup Email Domain (Azure Communication Services)

### 5.1 Add Email Domain

1. Go to Azure Portal → Your Communication Service
2. Click "Try Email" or "Provision Domains"
3. Choose option:
   - **Free Azure subdomain**: Quick setup, limited sending
   - **Custom domain**: Professional, requires DNS configuration

### 5.2 For Custom Domain

1. Add your domain in Communication Service
2. Add these DNS records to your domain:
   ```
   TXT record: _azuremail.yourdomain.com
   ```
3. Wait for verification (can take up to 48 hours)
4. Update `SENDER_EMAIL` in function app settings

## 🔒 Step 6: Security Hardening

### 6.1 Update staticwebapp.config.json

Verify security headers are set:

```json
{
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  }
}
```

### 6.2 Configure Custom Domain (Optional)

```bash
az staticwebapp hostname set \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --hostname www.yourdomain.com
```

### 6.3 Enable HTTPS Only

HTTPS is enabled by default on Azure Static Web Apps. Verify in Azure Portal.

## 🧪 Step 7: Testing Production Deployment

### 7.1 Test Checklist

- [ ] Visit your app URL: `https://your-app.azurestaticapps.net`
- [ ] Test RSVP submission
- [ ] Test photo upload
- [ ] Test wishes submission
- [ ] Test admin login with new credentials
- [ ] Test admin CRUD operations
- [ ] Test bulk delete functionality
- [ ] Verify email delivery (if configured)

### 7.2 Monitor Logs

```bash
# Stream Function logs
az staticwebapp functions log \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --follow
```

## 📊 Step 8: Monitoring & Maintenance

### 8.1 Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app baby-ceremony-insights \
  --location eastus \
  --resource-group baby-ceremony-rg

# Link to Static Web App
az staticwebapp appsettings set \
  --name baby-ceremony-app \
  --resource-group baby-ceremony-rg \
  --setting-names APPLICATIONINSIGHTS_CONNECTION_STRING="your-insights-connection-string"
```

### 8.2 Set Up Alerts

Configure alerts for:
- High error rates
- Storage quota exceeding 80%
- Function execution failures

### 8.3 Backup Strategy

```bash
# Backup blob containers regularly
az storage blob download-batch \
  --account-name babyceremonystorage \
  --source ceremony-data \
  --destination ./backups/data-$(date +%Y%m%d)
```

## 🔄 Step 9: CI/CD Pipeline

GitHub Actions workflow is automatically created. Verify `.github/workflows/azure-static-web-apps-*.yml`:

### 9.1 Workflow Features

- ✅ Automatic deployment on push to main
- ✅ Build and deploy frontend
- ✅ Deploy Azure Functions API
- ✅ Environment variable injection

### 9.2 Manual Deployment

If needed, trigger manual deployment:

```bash
# Push to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

## 🎯 Step 10: Post-Deployment Checklist

- [ ] **Update DNS** (if using custom domain)
- [ ] **Test all features** on production URL
- [ ] **Update CORS settings** in Azure Storage to only allow your domain
- [ ] **Review and rotate credentials** regularly
- [ ] **Set up backup automation**
- [ ] **Configure monitoring alerts**
- [ ] **Document admin credentials** securely (use password manager)
- [ ] **Test email delivery** from your domain
- [ ] **Performance test** with realistic data
- [ ] **Mobile responsiveness** check

## 🆘 Troubleshooting

### Issue: Functions not working

```bash
# Check function logs
az staticwebapp functions log --name baby-ceremony-app --resource-group baby-ceremony-rg
```

### Issue: CORS errors

Update CORS in Azure Storage account:
```bash
az storage cors clear --services b --account-name babyceremonystorage
az storage cors add --services b --methods GET POST PUT DELETE OPTIONS --origins 'https://your-app.azurestaticapps.net' --allowed-headers '*' --exposed-headers '*' --max-age 3600 --account-name babyceremonystorage
```

### Issue: Environment variables not loading

1. Check GitHub Secrets are set
2. Verify they're referenced in workflow file
3. Check Azure Function App Settings

### Issue: Build failures

```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Additional Resources

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Communication Services](https://docs.microsoft.com/azure/communication-services/)
- [Azure Blob Storage](https://docs.microsoft.com/azure/storage/blobs/)

## 💰 Cost Estimation

### Free Tier Limits
- **Static Web Apps**: 100GB bandwidth/month (Free tier)
- **Azure Functions**: 1M requests/month (Consumption plan)
- **Blob Storage**: First 5GB free, then ~$0.02/GB
- **Communication Services**: Pay per email sent

### Estimated Monthly Cost
For a small ceremony (< 200 guests):
- **Total**: ~$0-5 USD/month (mostly email costs)

### Cost Optimization
- Delete old photos/data after ceremony
- Use lifecycle management to archive old blobs
- Monitor usage in Azure Cost Management

---

## 🎉 Success!

Your baby ceremony digital invitation is now live in production!

**Next Steps:**
1. Share the URL with family and friends
2. Monitor the admin panel for RSVPs
3. Backup data regularly
4. Enjoy your celebration! 🎊
