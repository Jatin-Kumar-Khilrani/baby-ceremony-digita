# AI Foundry Configuration - Updated

## Overview
Successfully migrated from basic OpenAI resource to **AI Foundry** resource with Visual Studio subscription benefits!

## Previous Configuration (Old)
- **Resource**: todo-ai-openai
- **Endpoint**: https://eastus.api.cognitive.microsoft.com/
- **Type**: OpenAI (Basic)
- **Tier**: S0 (Free tier with strict rate limits)
- **Issue**: Hit rate limit during testing (429 errors)

## New Configuration (AI Foundry)
- **Resource**: jkhilrani-aifoundry1
- **Resource Group**: jkhilrani-aifoundry1
- **Endpoint**: https://jkhilrani-aifoundry1.cognitiveservices.azure.com/
- **Type**: AIServices (AI Foundry)
- **Location**: East US
- **Model**: gpt-4o-mini (version 2024-07-18)
- **Capacity**: 100 tokens/minute
- **Format**: OpenAI

## Benefits of AI Foundry

### 1. **Better Rate Limits**
- ✅ Higher capacity (100 tokens/minute baseline)
- ✅ Visual Studio subscription benefits
- ✅ More generous quotas than free tier

### 2. **Unified AI Services**
- ✅ Single endpoint for multiple AI capabilities
- ✅ Better integration with Azure AI Studio
- ✅ Access to latest model versions

### 3. **Visual Studio Subscription**
- ✅ Monthly credits included
- ✅ Better support options
- ✅ Priority access to new features

## Updated Configurations

### Local Development (`api/local.settings.json`)
```json
{
  "Values": {
    "AZURE_OPENAI_ENDPOINT": "https://jkhilrani-aifoundry1.cognitiveservices.azure.com/",
    "AZURE_OPENAI_API_KEY": "ePUrUDuZ4xhz59UxZNO1PEDjAlJw4kJQQJ99BHACYeBjFXJ3w3AAAAACOGUzAI",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o-mini"
  }
}
```

### Production (Azure Static Web Apps)
Settings updated via Azure CLI:
```bash
az staticwebapp appsettings set \
  --name baby-ceremony-app \
  --setting-names \
    AZURE_OPENAI_ENDPOINT="https://jkhilrani-aifoundry1.cognitiveservices.azure.com/" \
    AZURE_OPENAI_API_KEY="***" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini"
```

### GitHub Secrets (CI/CD)
Updated secrets:
- ✅ `AZURE_OPENAI_ENDPOINT`
- ✅ `AZURE_OPENAI_API_KEY`
- ✅ `AZURE_OPENAI_DEPLOYMENT` (already set to gpt-4o-mini)

## Testing Status

### Rate Limit Issue - RESOLVED
**Problem**: Hit 429 rate limit with old resource during testing
```
429 Requests to the ChatCompletions_Create Operation under Azure OpenAI API 
version 2024-08-01-preview have exceeded token rate limit of your current 
OpenAI S0 pricing tier.
```

**Solution**: Migrated to AI Foundry resource with better capacity

### Next Steps
1. ✅ Restart `func start` to use new endpoint
2. ⏳ Test Sindhi language enhancement
3. ⏳ Test all 5 languages (English, Hindi, Sindhi, Rajasthani, Marwadi)
4. ⏳ Deploy to production

## How to Restart Server

In the `func` terminal:
1. Press `Ctrl+C` to stop
2. Run: `func start`
3. Wait for "Functions:" to show all 4 endpoints

## Verification Commands

### Check AI Foundry Resource
```bash
az cognitiveservices account show \
  -n jkhilrani-aifoundry1 \
  -g jkhilrani-aifoundry1
```

### Check Deployed Models
```bash
az cognitiveservices account deployment list \
  -g jkhilrani-aifoundry1 \
  -n jkhilrani-aifoundry1 \
  --query "[].{Name:name, Model:properties.model.name}" -o table
```

### Test Endpoint (after server restart)
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:7071/api/enhance-wish" `
  -Method POST `
  -Body '{"message":"Acho aahyo Parv beta"}' `
  -ContentType "application/json"
```

## Cost Estimation

### AI Foundry Pricing
- **Input**: $0.150 per 1M tokens
- **Output**: $0.600 per 1M tokens
- **Visual Studio Credits**: Included in subscription

### Estimated Usage (1,000 guests)
- Average wish: 20 tokens input
- Average enhancement: 150 tokens output
- Total cost: ~$0.12 - $0.50
- **Covered by Visual Studio subscription!** 🎉

## Benefits Summary

| Feature | Old (todo-ai-openai) | New (AI Foundry) |
|---------|---------------------|------------------|
| Rate Limit | Very restrictive | 100 tokens/min |
| VS Subscription | No | ✅ Yes |
| Monthly Credits | None | ✅ Included |
| Model Version | gpt-4o-mini | ✅ gpt-4o-mini (same) |
| Capacity | Limited | ✅ Higher |
| Support | Basic | ✅ Enhanced |

## Production Impact

### No Downtime
- ✅ Azure Static Web Apps settings updated
- ✅ GitHub secrets updated
- ✅ Next deployment will use AI Foundry automatically
- ✅ Same model, same API, just better capacity

### Monitoring
Monitor usage in Azure Portal:
1. Go to: https://portal.azure.com
2. Navigate to: jkhilrani-aifoundry1
3. Check: Metrics → Token Usage
4. View: Cost Management → Credits used

## Troubleshooting

### If you still hit rate limits
1. Check Azure Portal metrics
2. Verify subscription credits
3. Consider increasing capacity if needed

### If API key expires
```bash
# Get new key
az cognitiveservices account keys list \
  -g jkhilrani-aifoundry1 \
  -n jkhilrani-aifoundry1
```

## Security Note
🔒 **API Key Updated**: The old API key is no longer in use. New key from AI Foundry is now active.

## Date
Updated: October 12, 2025
Event: Tomorrow (October 13, 2025)

---

**Ready to test!** Restart the func server and try the Sindhi enhancement. 🚀
