# 🔐 Google OAuth Authentication Setup

## Why Google OAuth?

We've implemented "Sign in with Google" for the **most user-friendly** authentication experience:

✅ **Zero Memorization** - No codes to remember  
✅ **One-Click Sign-In** - Especially on Chrome/Android where users are already signed into Google  
✅ **100% FREE** - Google OAuth has no API costs  
✅ **Secure** - Google handles all the security  
✅ **Universal** - Works on any device, any browser  

## How It Works

### For Users:

1. **Submit RSVP/Wish**: Provide name, email, and other details
2. **Want to Edit/Delete?**: Search for your entry by email
3. **Verify Ownership**: Click "Sign in with Google" button
4. **One-Click Authentication**: Google verifies you own that email
5. **Edit or Delete**: Make changes to your entry

### Security:

- Users must sign in with the **exact Google account** that matches their RSVP/wish email
- If emails don't match → access denied
- No manual codes to remember or type
- All authentication handled by Google's secure OAuth 2.0

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `baby-ceremony-invitation`
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. In the left menu: "APIs & Services" → "OAuth consent screen"
2. User Type: Select **External**
3. Fill in required fields:
   - App name: `Baby Ceremony Invitation`
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Scopes: Click "Save and Continue" (no extra scopes needed)
6. Test users: Add your email (optional during development)
7. Click "Save and Continue" → "Back to Dashboard"

### Step 3: Create OAuth Credentials

1. In the left menu: "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Baby Ceremony Web Client`
5. **Authorized JavaScript origins:**
   - For local development: `http://localhost:5174`
   - For production: Add your Azure Static Web Apps URL (e.g., `https://your-app.azurestaticapps.net`)
6. **Authorized redirect URIs:**
   - Same as above (just add both URLs)
7. Click "Create"
8. **IMPORTANT**: Copy the Client ID that appears!

### Step 4: Add Client ID to Your App

1. Open `.env.local` file in your project root
2. Replace the placeholder with your actual Client ID:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
```

3. Save the file
4. Restart your development server:

```powershell
npm run dev
```

## Production Deployment

When deploying to Azure Static Web Apps:

### Update Google Cloud Console:

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add your production URL to **both**:
   - Authorized JavaScript origins
   - Authorized redirect URIs
4. Example: `https://polite-flower-0a1b2c3d4.azurestaticapps.net`

### Add Environment Variable in Azure:

1. Azure Portal → Your Static Web App → Configuration
2. Add application setting:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: Your Client ID
3. Save and redeploy

## Testing

1. Start your development server
2. Try submitting an RSVP with your Gmail address
3. Search for your RSVP by email
4. Click "Sign in with Google"
5. Sign in with the same Gmail account
6. You should see a green success message
7. Try editing or deleting your RSVP

## Troubleshooting

### "Google Sign-In failed"
- Check that your Client ID is correct in `.env.local`
- Make sure `http://localhost:5174` is added to authorized origins in Google Cloud Console
- Try clearing browser cache and cookies

### "This Google account email does not match"
- You must sign in with the exact Google account that matches your RSVP/wish email
- Example: If you registered with `john@gmail.com`, you must sign in with that account

### "Popup blocked"
- Allow popups for localhost:5174 in your browser settings
- Or use the inline Google Sign-In button (already configured with `useOneTap`)

### Button not showing
- Check browser console for errors
- Verify `.env.local` file exists and has correct Client ID
- Restart dev server after changing `.env.local`

## Security Notes

✅ **Client ID is safe to expose** - It's meant to be public (that's why it's in frontend code)  
✅ **No client secret needed** - Frontend-only OAuth doesn't require secrets  
✅ **Email verification** - We verify the Google email matches the RSVP/wish email  
✅ **HTTPS in production** - Google requires HTTPS for production (Azure Static Web Apps provides this automatically)  

## Features

- ✨ **One-Tap Sign-In**: Google automatically shows sign-in prompt if user is logged into Chrome
- ✨ **Auto-Select**: Google pre-selects the user's account for faster sign-in
- ✨ **Profile Picture**: Shows user's Google profile picture after sign-in
- ✨ **Works Everywhere**: Desktop, mobile, any browser

## Need Help?

See the full setup guide at: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
