# Azure Deployment Guide for Baby Ceremony Digital

This guide will help you deploy your Baby Ceremony Digital application to Azure using your Azure credits.

## Azure Resources Required

### 1. Azure Storage Account
- **Purpose**: Store ceremony data (RSVPs, wishes, photos)
- **SKU**: Standard_LRS (cheapest option)
- **Access Tier**: Hot
- **Estimated Cost**: ~$1-5/month depending on usage

### 2. Azure Static Web Apps
- **Purpose**: Host the React application
- **SKU**: Free tier (perfect for personal projects)
- **Features**: Custom domains, SSL certificates, CI/CD
- **Estimated Cost**: Free

## Step-by-Step Deployment

### Step 1: Create Azure Storage Account

1. **Login to Azure Portal** (https://portal.azure.com)

2. **Create Storage Account**:
   ```bash
   # Using Azure CLI (optional)
   az storage account create \
     --name <your-storage-account-name> \
     --resource-group <your-resource-group> \
     --location <your-region> \
     --sku Standard_LRS \
     --kind StorageV2
   ```

3. **Create Container**:
   - Navigate to your storage account
   - Go to "Containers" under "Data storage"
   - Create a new container named `ceremony-data`
   - Set access level to "Private"

4. **Get Connection String**:
   - Go to "Access keys" under "Security + networking"
   - Copy the connection string from "key1"

### Step 2: Configure CORS for Storage Account

1. **Navigate to your Storage Account**
2. **Go to "Resource sharing (CORS)" under "Settings"**
3. **Add CORS rule for Blob service**:
   - **Allowed origins**: `https://<your-static-web-app-url>.azurestaticapps.net` (or `*` for development)
   - **Allowed methods**: GET, PUT, POST, DELETE, OPTIONS
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Max age**: 3600

### Step 3: Generate SAS Token (Optional, for enhanced security)

```bash
# Using Azure CLI
az storage container generate-sas \
  --account-name <your-storage-account-name> \
  --name ceremony-data \
  --permissions racwdl \
  --expiry <future-date> \
  --https-only
```

### Step 4: Deploy to Azure Static Web Apps

1. **Fork this repository** to your GitHub account

2. **Create Azure Static Web App**:
   - Go to Azure Portal
   - Search for "Static Web Apps"
   - Click "Create"
   - Choose your subscription and resource group
   - Name: `baby-ceremony-digital`
   - Source: GitHub
   - Connect to your forked repository
   - Build preset: "React"
   - App location: `/`
   - Output location: `dist`

3. **Configure Environment Variables**:
   - Go to your Static Web App in Azure Portal
   - Navigate to "Environment variables" under "Settings"
   - Add the following variables:
     ```
     VITE_AZURE_STORAGE_CONNECTION_STRING=<your-connection-string>
     VITE_AZURE_STORAGE_CONTAINER=ceremony-data
     VITE_AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
     VITE_AZURE_SAS_TOKEN=<your-sas-token> (optional)
     ```

### Step 5: Update GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings > Secrets and variables > Actions**
3. **Add the following secrets**:
   ```
   AZURE_STORAGE_CONNECTION_STRING=<your-connection-string>
   AZURE_STORAGE_CONTAINER=ceremony-data
   AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
   AZURE_SAS_TOKEN=<your-sas-token>
   ```

### Step 6: Deploy

1. **Push changes to main branch**
2. **GitHub Actions will automatically deploy**
3. **Monitor deployment** in GitHub Actions tab
4. **Access your site** at the Azure Static Web Apps URL

## Cost Estimation

### Monthly Costs (approximate):
- **Azure Storage Account**: $1-5/month
  - Storage: ~$0.02/GB/month
  - Transactions: ~$0.004/10K transactions
  - Bandwidth: First 5GB free, then ~$0.05/GB

- **Azure Static Web Apps**: FREE
  - Free tier includes:
    - 100GB bandwidth/month
    - Custom domains
    - SSL certificates
    - Authentication

### **Total Estimated Cost: $1-5/month**

## Domain Configuration (Optional)

1. **Purchase domain** (or use existing)
2. **Add custom domain** in Azure Static Web Apps
3. **Configure DNS** to point to Azure
4. **SSL certificate** is automatically provided

## Monitoring and Analytics

1. **Application Insights** (optional): ~$2-10/month
2. **Azure Monitor** for basic metrics (included)
3. **Storage Analytics** for usage insights (included)

## Security Best Practices

1. **Use SAS tokens** instead of connection strings in frontend
2. **Set appropriate CORS policies**
3. **Enable HTTPS only**
4. **Regularly rotate access keys**
5. **Monitor access logs**

## Backup Strategy

1. **Storage Account** has built-in redundancy
2. **Export data** periodically using Azure Storage Explorer
3. **Version control** for application code

## Troubleshooting

### Common Issues:

1. **CORS errors**: Check CORS configuration in storage account
2. **404 errors**: Verify staticwebapp.config.json configuration
3. **Environment variables**: Ensure all variables are set in Azure portal
4. **Build failures**: Check GitHub Actions logs

### Support Resources:
- Azure documentation: https://docs.microsoft.com/azure
- Azure community forums: https://docs.microsoft.com/answers
- GitHub Issues for this project

## Next Steps After Deployment

1. **Test all functionality** on the live site
2. **Share the URL** with family and friends
3. **Monitor usage** and costs in Azure portal
4. **Backup important data** regularly
5. **Consider adding analytics** for visitor insights

## Advanced Features (Optional)

1. **Azure Functions** for server-side processing
2. **Azure CDN** for global performance
3. **Azure Active Directory** for authentication
4. **Application Insights** for detailed analytics

---

**Note**: This setup uses your Azure credits efficiently while providing a professional, scalable solution for your baby ceremony digital invitation.