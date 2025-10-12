# Azure OpenAI Configuration

## ✅ Found Your Azure OpenAI Resource

**Resource Name:** `todo-ai-openai`  
**Resource Group:** `todo-ai-functions-rg`  
**Location:** `eastus`  
**Deployment:** `gpt-4o-mini` (model: gpt-4o-mini, version: 2024-07-18)

---

## 🔑 Environment Variables (Already Updated in local.settings.json)

```bash
AZURE_OPENAI_ENDPOINT=https://eastus.api.cognitive.microsoft.com/
AZURE_OPENAI_API_KEY=c199b36cc1e74443ac508a5a4e6d3c7d
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

---

## 🔐 GitHub Secrets to Add

Add these secrets to your GitHub repository:

### Method 1: Using GitHub CLI (Recommended)

```powershell
# Make sure you're in the repository directory
cd "C:\Users\jkhilrani\OneDrive - Microsoft\Desktop\baby-ceremony-digita"

# Add secrets to GitHub
gh secret set AZURE_OPENAI_ENDPOINT --body "https://eastus.api.cognitive.microsoft.com/"
gh secret set AZURE_OPENAI_API_KEY --body "c199b36cc1e74443ac508a5a4e6d3c7d"
gh secret set AZURE_OPENAI_DEPLOYMENT --body "gpt-4o-mini"
```

### Method 2: Using Azure Static Web Apps CLI

```powershell
# Navigate to your repository
cd "C:\Users\jkhilrani\OneDrive - Microsoft\Desktop\baby-ceremony-digita"

# Add secrets via Azure Portal or CLI
az staticwebapp appsettings set `
  --name "nice-coast-0fb98da0f" `
  --setting-names `
    "AZURE_OPENAI_ENDPOINT=https://eastus.api.cognitive.microsoft.com/" `
    "AZURE_OPENAI_API_KEY=c199b36cc1e74443ac508a5a4e6d3c7d" `
    "AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini"
```

### Method 3: Manual (via GitHub Web UI)

1. Go to: https://github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:

   **Secret 1:**
   - Name: `AZURE_OPENAI_ENDPOINT`
   - Value: `https://eastus.api.cognitive.microsoft.com/`

   **Secret 2:**
   - Name: `AZURE_OPENAI_API_KEY`
   - Value: `c199b36cc1e74443ac508a5a4e6d3c7d`

   **Secret 3:**
   - Name: `AZURE_OPENAI_DEPLOYMENT`
   - Value: `gpt-4o-mini`

---

## 🚀 For Azure Static Web Apps (Production)

You also need to add these to your Static Web App configuration:

```powershell
# Get your Static Web App name
$staticWebAppName = "nice-coast-0fb98da0f"
$resourceGroup = "baby-ceremony-rg"

# Set application settings
az staticwebapp appsettings set `
  --name $staticWebAppName `
  --resource-group $resourceGroup `
  --setting-names `
    AZURE_OPENAI_ENDPOINT="https://eastus.api.cognitive.microsoft.com/" `
    AZURE_OPENAI_API_KEY="c199b36cc1e74443ac508a5a4e6d3c7d" `
    AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini"
```

---

## 📊 Cost Estimate

- **Model:** GPT-4o-mini
- **Pricing:** 
  - Input: $0.150 per 1M tokens
  - Output: $0.600 per 1M tokens
- **Estimated cost for 1,000 guests:** ~$0.12 - $0.50
- **Monthly estimate (if left running):** < $1.00

---

## ✅ Next Steps

1. ✅ Local settings updated
2. ⏳ Add secrets to GitHub (run one of the methods above)
3. ⏳ Add secrets to Azure Static Web Apps
4. ⏳ Test locally
5. ⏳ Deploy to production

---

## 🧪 Test Locally

```powershell
cd api
npm run build
func start
```

Then test the enhance endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:7071/api/enhance-wish" -Method POST -Body '{"message":"Congrats on baby! Wishing you all best"}' -ContentType "application/json"
```

---

**Note:** Keep this file secure and do NOT commit it to Git!
