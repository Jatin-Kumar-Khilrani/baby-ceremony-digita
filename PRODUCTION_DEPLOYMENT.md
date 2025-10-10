# 🚀 Production Deployment Guide - Baby Ceremony Invitation

## For 1000 Guests - Deployment Strategy

### ✅ **Recommended Approach: Unverified External App**

Your app will work perfectly for all 1000 guests. They'll just see one extra click.

---

## 📝 **Pre-Deployment Steps**

### 1. Google OAuth Setup (External - Unverified)

**Complete these steps in Google Cloud Console:**

1. **Create Project:**
   - Name: `baby-ceremony-invitation`
   
2. **OAuth Consent Screen:**
   - User Type: **External**
   - App name: `Baby Ceremony Invitation`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Leave default (email, profile, openid)
   - Test users: **Skip this** (leave empty)
   - Status: Keep in "Testing" mode
   
3. **Create OAuth Credentials:**
   - Type: Web application
   - Name: `Baby Ceremony Web Client`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5174
     https://YOUR-AZURE-STATIC-WEB-APP-URL.azurestaticapps.net
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5174
     https://YOUR-AZURE-STATIC-WEB-APP-URL.azurestaticapps.net
     ```
   - **Copy the Client ID**

---

## 🔧 **Azure Setup**

### 1. Azure Storage Account (Already Done ✅)
- Account: `babyceremonystorage4848`
- Containers: `ceremony-data`, `ceremony-photos`
- Public access: Enabled for `ceremony-photos`

### 2. Azure Functions (Already Done ✅)
- Runtime: Node.js JavaScript
- Functions: `rsvps`, `wishes`, `photos`
- CORS: Will be configured for production URL

### 3. Azure Static Web Apps (Deploy Frontend)

**Create Static Web App:**

```powershell
# Login to Azure (if not already)
az login

# Create Static Web App
az staticwebapp create \
  --name baby-ceremony-invitation \
  --resource-group baby-ceremony-rg \
  --source https://github.com/Jatin-Kumar-Khilrani/baby-ceremony-digita \
  --location "centralus" \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

**Or use Azure Portal:**
1. Go to Azure Portal → Create Resource
2. Search "Static Web App"
3. Fill in:
   - Name: `baby-ceremony-invitation`
   - Resource Group: `baby-ceremony-rg`
   - Region: Central US
   - Source: GitHub
   - Repository: `Jatin-Kumar-Khilrani/baby-ceremony-digita`
   - Branch: `main`
   - Build Presets: Custom
   - App location: `/`
   - Output location: `dist`

---

## 🔐 **Environment Variables Setup**

### 1. Add to Azure Static Web App Configuration

**Azure Portal → Your Static Web App → Configuration → Application Settings:**

Add this variable:
```
Name: VITE_GOOGLE_CLIENT_ID
Value: YOUR-GOOGLE-CLIENT-ID.apps.googleusercontent.com
```

### 2. Update Azure Functions CORS

**Azure Portal → Your Function App → CORS:**

Add your Static Web App URL:
```
https://YOUR-APP-NAME.azurestaticapps.net
```

Or via CLI:
```powershell
az functionapp cors add \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group baby-ceremony-rg \
  --allowed-origins https://YOUR-APP-NAME.azurestaticapps.net
```

---

## 📱 **Update Google OAuth for Production**

Once you have your Azure Static Web App URL (e.g., `https://polite-flower-abc123.azurestaticapps.net`):

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth Client ID
3. Add to **Authorized JavaScript origins:**
   ```
   https://YOUR-AZURE-STATIC-WEB-APP-URL.azurestaticapps.net
   ```
4. Add to **Authorized redirect URIs:**
   ```
   https://YOUR-AZURE-STATIC-WEB-APP-URL.azurestaticapps.net
   ```
5. Save

---

## 🧪 **Testing Production Deployment**

### Test Checklist:

- [ ] App loads on production URL
- [ ] Google Sign-In button appears
- [ ] Can sign in with Google (guests will see "unverified app" warning)
- [ ] Can submit RSVP
- [ ] Can search and edit RSVP
- [ ] Can post wishes
- [ ] Can upload photos
- [ ] Admin dashboard works at `/admin`

### What Guests Will See:

**On first Google Sign-In:**
```
┌─────────────────────────────────────┐
│  Google hasn't verified this app    │
│                                      │
│  [Advanced ▼]  [Go Back]            │
└─────────────────────────────────────┘
```

**Guests click "Advanced":**
```
┌─────────────────────────────────────┐
│  Go to Baby Ceremony Invitation      │
│  (unsafe)                            │
└─────────────────────────────────────┘
```

**Guests click "Go to Baby Ceremony Invitation":**
- They sign in normally
- Everything works perfectly
- Only need to do this ONCE per browser

---

## 📧 **Guest Communication**

**Add this to your invitation:**

```
📱 RSVP Instructions:

1. Click the invitation link
2. Fill out your RSVP
3. To edit later, use "Sign in with Google"
4. If you see a "Google hasn't verified" warning:
   - Click "Advanced"
   - Click "Go to Baby Ceremony Invitation"
   - This is normal for private event websites!
```

---

## 🎯 **For 1000 Guests - Capacity Planning**

### Azure Storage:
- ✅ Can handle millions of requests
- ✅ 1000 RSVPs + 1000 wishes = ~2MB of data
- ✅ Photos: 1000 photos × 2MB = 2GB storage
- ✅ Well within free tier limits

### Azure Functions:
- ✅ 1 million free executions/month
- ✅ 1000 guests × 10 actions = 10,000 executions
- ✅ Well within free tier

### Google OAuth:
- ✅ Unlimited sign-ins (free)
- ✅ No quota limits for OAuth

### Cost Estimate:
- **Development:** $0 (free tier)
- **1000 guests:** $0 - $2/month (likely FREE)
- **Storage:** <$1/month for data + photos

---

## 🔄 **Deployment Process**

### Automatic Deployment via GitHub:

1. **Push to main branch:**
   ```powershell
   git add .
   git commit -m "Production ready with Google OAuth"
   git push origin main
   ```

2. **Azure will automatically:**
   - Build your app
   - Deploy to Static Web Apps
   - Generate production URL
   
3. **Get your URL:**
   - Azure Portal → Static Web App → Overview
   - Copy the URL (e.g., `https://polite-flower-abc123.azurestaticapps.net`)

4. **Update Google OAuth:**
   - Add production URL to authorized origins
   
5. **Test production:**
   - Visit your production URL
   - Test Google Sign-In
   - Verify all features work

---

## 📊 **Monitoring**

### Azure Portal Monitoring:

- **Static Web App:** View traffic, errors
- **Functions:** View execution count, errors
- **Storage:** View blob usage, requests

### Set up Alerts:

```powershell
# Alert for function errors
az monitor metrics alert create \
  --name function-errors \
  --resource-group baby-ceremony-rg \
  --scopes YOUR-FUNCTION-APP-ID \
  --condition "total failed requests > 10" \
  --description "Alert when function errors exceed threshold"
```

---

## 🛡️ **Security for Production**

### Already Implemented:
- ✅ Google OAuth authentication
- ✅ Email verification (must match RSVP email)
- ✅ HTTPS (automatic with Azure Static Web Apps)
- ✅ CORS configured

### Additional Recommendations:
- ✅ Rate limiting (Azure Functions built-in)
- ✅ Input validation (already in forms)
- ✅ Secure storage (Azure handles encryption)

---

## 🎨 **Optional: Remove "Unverified App" Warning**

If you want to remove the Google warning for guests:

### Create Required Documents:

1. **Privacy Policy** (use template):
```markdown
# Privacy Policy

We collect:
- Name, email, phone (for event planning)
- Photos you upload
- Messages you submit

We do NOT:
- Sell your data
- Share with third parties
- Use for marketing

Data is stored securely on Microsoft Azure.
Contact: your-email@example.com
```

2. **Terms of Service:**
```markdown
# Terms of Service

This is a private event invitation.
By RSVPing, you agree to:
- Provide accurate information
- Only edit/delete your own entries
- Respect other guests' privacy

Contact: your-email@example.com
```

### Submit for Verification:

1. Host privacy.html and terms.html on your site
2. Google Cloud Console → OAuth consent screen → Edit
3. Add Privacy Policy URL and Terms of Service URL
4. Submit for verification
5. Wait 1-2 weeks for approval

**Note:** For a baby ceremony, this is optional. Guests understand it's a private event.

---

## 📞 **Support for Guests**

Create a simple FAQ:

**Q: Why does Google show a warning?**  
A: This is a private event website. Google shows this for all apps not publicly verified. It's safe to continue!

**Q: Do I need a Gmail account?**  
A: Yes, to edit/delete your RSVP. Or just submit without editing capability.

**Q: I can't sign in!**  
A: Make sure you're using the same email you used for your RSVP.

---

## ✅ **Production Deployment Checklist**

- [ ] Google OAuth Client ID created
- [ ] Production URLs added to Google authorized origins
- [ ] Azure Static Web App created
- [ ] Environment variable `VITE_GOOGLE_CLIENT_ID` set in Azure
- [ ] Code pushed to GitHub
- [ ] Azure deployment successful
- [ ] Production URL obtained
- [ ] Google OAuth updated with production URL
- [ ] Test RSVP submission
- [ ] Test Google Sign-In
- [ ] Test edit/delete functionality
- [ ] Test photo upload
- [ ] Test admin dashboard
- [ ] Send test invitation to yourself
- [ ] Verify guest experience
- [ ] Share invitation with all 1000 guests! 🎉

---

## 🎉 **You're Ready!**

Your app will handle 1000 guests perfectly. The "unverified app" warning is normal for private events and won't affect functionality.

**Estimated Timeline:**
- Google OAuth setup: 10 minutes
- Azure deployment: 15 minutes
- Testing: 15 minutes
- **Total: ~40 minutes to production!**

**Questions?** Check `GOOGLE_AUTH_README.md` or `TESTING_GUIDE.md`
