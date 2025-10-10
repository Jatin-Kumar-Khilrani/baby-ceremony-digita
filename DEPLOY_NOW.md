# 🚀 Production Deployment - Quick Start

This is a quick reference guide to get your Baby Ceremony Digital Invitation live in production.

## 🎯 Three Ways to Deploy

### Option 1: Automated Setup (Recommended)
Use the automated PowerShell script:

```powershell
# Run the setup script
.\setup-production.ps1
```

This will:
- Create all Azure resources
- Configure storage containers
- Set up communication service
- Generate .env file with your credentials
- Save all credentials to a secure file

### Option 2: Manual Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Create resources manually following [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
3. Configure environment variables
4. Deploy via GitHub Actions

### Option 3: Azure CLI
Follow the step-by-step commands in [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)

## ✅ Pre-Deployment Checklist

Before deploying, run the validation script:

```powershell
.\validate-production.ps1
```

This checks:
- ✅ Environment variables configured
- ✅ Dependencies installed
- ✅ Builds succeed
- ✅ No TypeScript errors
- ✅ Security (credentials not in Git)
- ✅ GitHub Actions configured

## 🔐 Required GitHub Secrets

Add these to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure | `abc123...` |
| `VITE_ADMIN_EMAIL` | Your admin email | `admin@yourdomain.com` |
| `VITE_ADMIN_PIN` | Secure 4-digit PIN | `5678` |
| `VITE_AZURE_STORAGE_ACCOUNT` | Storage account name | `babyceremonystorage` |
| `VITE_AZURE_STORAGE_KEY` | Storage account key | `xyz789...` |

## ⚙️ Azure Function App Settings

Set these in Azure Portal → Static Web App → Configuration:

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...
SENDER_EMAIL=DoNotReply@yourdomain.com
ALLOWED_ORIGINS=https://your-app.azurestaticapps.net
```

## 🚀 Deploy

### First Time Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build frontend with environment variables
   - Build API functions
   - Deploy to Azure Static Web Apps

3. **Monitor deployment**
   - Go to GitHub → Actions tab
   - Watch the deployment progress

### Subsequent Deployments

Just push to main branch:
```bash
git push origin main
```

## 🧪 Testing Production

After deployment:

1. **Visit your app**: `https://your-app-name.azurestaticapps.net`

2. **Test features:**
   - [ ] RSVP submission works
   - [ ] Photo upload works
   - [ ] Wishes submission works
   - [ ] Admin login with your credentials
   - [ ] Admin CRUD operations
   - [ ] Bulk delete functionality
   - [ ] CSV export

3. **Check logs:**
   ```bash
   # View Function logs
   az staticwebapp functions log \
     --name your-app-name \
     --resource-group your-rg-name \
     --follow
   ```

## 🔧 Post-Deployment

### Update CORS for Security

Once deployed, restrict CORS to your production domain only:

```bash
az storage cors clear --services b --account-name your-storage-account

az storage cors add \
  --services b \
  --methods GET POST PUT DELETE OPTIONS \
  --origins 'https://your-app-name.azurestaticapps.net' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600 \
  --account-name your-storage-account
```

### Setup Custom Domain (Optional)

```bash
az staticwebapp hostname set \
  --name your-app-name \
  --resource-group your-rg-name \
  --hostname www.yourdomain.com
```

### Enable Monitoring

```bash
# Create Application Insights
az monitor app-insights component create \
  --app baby-ceremony-insights \
  --location eastus \
  --resource-group your-rg-name

# Link to Static Web App
az staticwebapp appsettings set \
  --name your-app-name \
  --resource-group your-rg-name \
  --setting-names APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
```

## 📊 Monitoring

### View Metrics
- Azure Portal → Static Web App → Metrics
- Application Insights → Live Metrics

### Check Logs
```bash
az staticwebapp logs show \
  --name your-app-name \
  --resource-group your-rg-name
```

### Set up Alerts
Create alerts for:
- Error rate > 5%
- Response time > 3s
- Storage > 80% capacity

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Functions Not Working
- Check Azure Function App Settings
- Verify connection strings
- Check CORS configuration
- Review function logs

### CORS Errors
Update allowed origins in Azure Storage:
```bash
az storage cors add \
  --services b \
  --origins 'https://your-production-url.com' \
  --account-name your-storage-account
```

### Admin Can't Login
- Verify `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PIN` in GitHub Secrets
- Check browser console for errors
- Verify build included environment variables

## 💰 Cost Management

### Monitor Costs
```bash
az consumption usage list \
  --start-date $(date -d "30 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d)
```

### Optimize Costs
- Delete old photos after ceremony
- Use lifecycle management for blob storage
- Monitor bandwidth usage
- Review Azure Cost Management dashboard

## 🔄 Rollback

If something goes wrong:

```bash
# Via Azure CLI
az staticwebapp environment delete \
  --name your-app-name \
  --resource-group your-rg-name \
  --environment-name preview

# Or revert Git commit
git revert HEAD
git push origin main
```

## 📚 Full Documentation

- **[Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)** - Comprehensive setup guide
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Complete pre-deployment checklist
- **[Admin Credentials](ADMIN_CREDENTIALS.md)** - Admin access documentation
- **[README](README.md)** - Project overview and local development

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ App loads at production URL
- ✅ All features work (RSVP, photos, wishes)
- ✅ Admin panel accessible with your credentials
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Email delivery works (if configured)
- ✅ Performance < 3 second load time
- ✅ Monitoring shows healthy metrics

## 📞 Support

### Common Issues
- Check [GitHub Issues](https://github.com/YOUR-USERNAME/baby-ceremony-digita/issues)
- Review Application Insights logs
- Check Azure Function logs

### Resources
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)
- [React Docs](https://react.dev/)

---

## 🚀 Quick Command Reference

```bash
# Validate before deploy
.\validate-production.ps1

# Build locally
npm run build
cd api && npm run build

# Deploy
git push origin main

# Monitor deployment
# Go to GitHub → Actions → Watch workflow

# View production logs
az staticwebapp functions log --name APP_NAME --resource-group RG_NAME --follow

# Test production
curl https://your-app.azurestaticapps.net
curl https://your-app.azurestaticapps.net/api/rsvps

# Backup data
az storage blob download-batch \
  --account-name STORAGE_NAME \
  --source ceremony-data \
  --destination ./backups/$(date +%Y%m%d)
```

---

Made with ❤️ for celebrating life's precious moments
