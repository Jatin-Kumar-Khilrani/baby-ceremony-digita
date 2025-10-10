# Google OAuth Setup Instructions

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `baby-ceremony-invitation`
4. Click "Create"

## 2. Enable Google+ API (for OAuth)

1. In the left menu, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click "Enable"

## 3. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: `Baby Ceremony Invitation`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Skip scopes (click "Save and Continue")
   - Add test users if needed (your email)
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Baby Ceremony Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5174` (for development)
     - Add your production URL later (e.g., `https://your-app.azurestaticapps.net`)
   - Authorized redirect URIs:
     - `http://localhost:5174` (for development)
     - Add your production URL later
   - Click "Create"

5. **Copy the Client ID** - you'll need this!

## 4. Add Client ID to Your App

Create a `.env.local` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Important:** Never commit this file to Git! It should already be in `.gitignore`.

## 5. For Production Deployment

When deploying to Azure Static Web Apps:

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add your production URL to:
   - Authorized JavaScript origins: `https://your-app.azurestaticapps.net`
   - Authorized redirect URIs: `https://your-app.azurestaticapps.net`

4. Add the Client ID as an environment variable in Azure:
   - Azure Portal → Your Static Web App → Configuration
   - Add: `VITE_GOOGLE_CLIENT_ID` = your client ID

## Security Notes

✅ Client ID is safe to expose in frontend code (it's meant to be public)
✅ No client secret needed for frontend-only OAuth
✅ Google handles all the security
✅ Users authenticate directly with Google, not your app

## Testing

Once set up, users will see "Sign in with Google" button when they try to edit/delete their RSVP or wish. They'll authenticate with their Gmail account, and we'll verify it matches the email they used for their RSVP/wish.
