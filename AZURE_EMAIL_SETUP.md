# Azure Communication Services Email Setup Guide

## Overview

Azure Communication Services Email is the **recommended production solution** for sending PIN emails. It's:
- ✅ Fully integrated with Azure
- ✅ Scalable and reliable
- ✅ Secure (credentials in Azure, not in Git)
- ✅ Cost-effective ($0.50 per 1000 emails)
- ✅ No daily limits

## Prerequisites

- Azure subscription
- Azure CLI installed (or use Azure Cloud Shell)
- Your baby ceremony project deployed to Azure

## Setup Steps

### Step 1: Create Email Communication Service

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_NAME"

# Create a resource group (if you don't have one)
az group create \
  --name baby-ceremony-rg \
  --location eastus

# Create Email Communication Service
az communication email create \
  --name baby-ceremony-email \
  --resource-group baby-ceremony-rg \
  --location global \
  --data-location unitedstates
```

### Step 2: Configure Email Domain

#### Option A: Use Azure Managed Domain (Quick Start - 5 minutes)

```bash
# Create an Azure Managed Domain
az communication email domain create \
  --name AzureManagedDomain \
  --resource-group baby-ceremony-rg \
  --email-service-name baby-ceremony-email \
  --location global \
  --domain-management AzureManaged
```

The sender address will be like: `DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`

#### Option B: Use Custom Domain (Recommended for Production - 30 minutes)

1. **Add your custom domain:**
```bash
az communication email domain create \
  --name your-domain.com \
  --resource-group baby-ceremony-rg \
  --email-service-name baby-ceremony-email \
  --location global \
  --domain-management CustomerManaged
```

2. **Verify domain ownership:**
   - Go to Azure Portal → Email Communication Services
   - Click on your domain
   - Copy the TXT record values
   - Add them to your domain DNS settings
   - Wait for verification (5-15 minutes)

3. **Configure SPF and DKIM:**
   - Copy the SPF and DKIM records from Azure Portal
   - Add them to your domain DNS
   - Improves email deliverability

### Step 3: Get Connection String

```bash
# Get the connection string
az communication show \
  --name baby-ceremony-email \
  --resource-group baby-ceremony-rg \
  --query "connectionString" \
  --output tsv
```

**Copy the connection string** - you'll need it for Step 4.

### Step 4: Configure Azure Static Web App

#### For Local Development:

1. Edit `api/local.settings.json`:
```json
{
  "Values": {
    "AZURE_COMMUNICATION_CONNECTION_STRING": "endpoint=https://baby-ceremony-email.communication.azure.com/;accesskey=YOUR_KEY_HERE",
    "AZURE_COMMUNICATION_SENDER_ADDRESS": "DoNotReply@your-domain.com"
  }
}
```

#### For Production Deployment:

```bash
# Add configuration to your Static Web App
az staticwebapp appsettings set \
  --name baby-ceremony-app \
  --setting-names \
    AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://baby-ceremony-email.communication.azure.com/;accesskey=YOUR_KEY_HERE" \
    AZURE_COMMUNICATION_SENDER_ADDRESS="DoNotReply@your-domain.com"
```

**OR** via Azure Portal:
1. Go to your Static Web App
2. Settings → Configuration
3. Add Application Settings:
   - Name: `AZURE_COMMUNICATION_CONNECTION_STRING`
   - Value: Your connection string
   - Name: `AZURE_COMMUNICATION_SENDER_ADDRESS`
   - Value: `DoNotReply@your-domain.com`

### Step 5: Test Email Delivery

```bash
# Restart your Azure Functions
cd api
func start
```

Test by submitting an RSVP and checking email delivery.

## Cost Calculation

For 1000 guests:

| Scenario | Emails Sent | Cost |
|----------|-------------|------|
| All guests submit | 1,000 | $0.50 |
| 50% edit/update | 500 | $0.25 |
| **Total** | 1,500 | **$0.75** |

**Extremely affordable!** ✨

## Email Limits

| Limit Type | Azure Communication Services |
|------------|------------------------------|
| Emails per hour | 1,000 |
| Emails per day | 10,000 |
| Total recipients per email | 50 |

More than enough for 1000 guests! 🎉

## Troubleshooting

### Issue: Connection String Not Working

**Check:**
```bash
# Verify the service exists
az communication show \
  --name baby-ceremony-email \
  --resource-group baby-ceremony-rg
```

### Issue: Emails Not Sending

**Common causes:**
1. Domain not verified (for custom domains)
2. Connection string incorrect
3. Sender address doesn't match domain
4. Azure Functions not deployed

**Solution:**
```bash
# Check domain status
az communication email domain show \
  --name your-domain.com \
  --resource-group baby-ceremony-rg \
  --email-service-name baby-ceremony-email
```

### Issue: Emails in Spam

**Solutions:**
1. Add SPF record: `v=spf1 include:spf.protection.outlook.com -all`
2. Add DKIM records (from Azure Portal)
3. Add DMARC record: `v=DMARC1; p=none; rua=mailto:admin@your-domain.com`
4. Warm up the domain (send gradually increasing volumes)

## Security Best Practices

### ✅ DO:
- Store connection string in Azure App Settings (not in Git)
- Use Azure Managed Identity when possible
- Enable audit logging
- Monitor email sending metrics
- Use custom domain for production

### ❌ DON'T:
- Commit connection strings to Git
- Share connection strings publicly
- Use Azure Managed Domain for production
- Skip domain verification
- Ignore deliverability metrics

## Monitoring

### View Email Logs in Azure Portal:
1. Go to Email Communication Service
2. Click "Insights" → "Email Logs"
3. View sent, delivered, failed emails

### CLI Monitoring:
```bash
# View email metrics
az monitor metrics list \
  --resource /subscriptions/YOUR_SUB/resourceGroups/baby-ceremony-rg/providers/Microsoft.Communication/communicationServices/baby-ceremony-email \
  --metric EmailDelivered
```

## Migration from SMTP to Azure

If you've been using SMTP (Gmail), switching is easy:

1. **Setup Azure Communication Services** (Steps 1-3 above)
2. **Add connection string** to Azure configuration (Step 4)
3. **Remove SMTP settings** from configuration
4. **Deploy and test**

The code automatically detects which service to use:
- If `AZURE_COMMUNICATION_CONNECTION_STRING` exists → Use Azure
- Otherwise → Use SMTP

No code changes needed! 🎉

## Complete Setup Example

```bash
# Complete setup in one script
#!/bin/bash

# Variables
RESOURCE_GROUP="baby-ceremony-rg"
EMAIL_SERVICE="baby-ceremony-email"
STATIC_WEBAPP="baby-ceremony-app"
LOCATION="eastus"
DOMAIN="your-domain.com"

# Create resources
az group create --name $RESOURCE_GROUP --location $LOCATION
az communication email create --name $EMAIL_SERVICE --resource-group $RESOURCE_GROUP --location global --data-location unitedstates

# Get connection string
CONNECTION_STRING=$(az communication show --name $EMAIL_SERVICE --resource-group $RESOURCE_GROUP --query "connectionString" -o tsv)

# Configure Static Web App
az staticwebapp appsettings set \
  --name $STATIC_WEBAPP \
  --setting-names \
    AZURE_COMMUNICATION_CONNECTION_STRING="$CONNECTION_STRING" \
    AZURE_COMMUNICATION_SENDER_ADDRESS="DoNotReply@$DOMAIN"

echo "✅ Setup complete!"
echo "Connection string: $CONNECTION_STRING"
```

## Next Steps

1. ✅ Create Email Communication Service
2. ✅ Configure domain (Azure Managed or Custom)
3. ✅ Get connection string
4. ✅ Add to Azure Static Web App configuration
5. ✅ Test email delivery
6. ✅ Monitor and optimize

## Support Resources

- [Azure Communication Services Docs](https://docs.microsoft.com/azure/communication-services/)
- [Email Quickstart](https://docs.microsoft.com/azure/communication-services/quickstarts/email/)
- [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Domain Verification Guide](https://docs.microsoft.com/azure/communication-services/quickstarts/email/add-custom-verified-domains)

---

**Questions?** Contact Azure Support or check the docs above.

**Ready to go?** Run the setup script and you're done! 🚀
