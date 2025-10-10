# 🧪 Testing Guide - Google OAuth Authentication

## Current Status
✅ Frontend: Running on http://localhost:5174  
✅ API: Running on http://localhost:7071  

## ⚠️ IMPORTANT: Before Testing

**You need a Google OAuth Client ID!** The app won't work without it.

### Quick Setup (5 minutes):

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create Project:**
   - Click "Select a project" → "New Project"
   - Name: `baby-ceremony-invitation`
   - Click "Create"

3. **Configure OAuth Consent Screen:**
   - Left menu → "APIs & Services" → "OAuth consent screen"
   - User Type: **External** → Click "Create"
   - App name: `Baby Ceremony Invitation`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" (3 times)

4. **Create OAuth Credentials:**
   - Left menu → "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Baby Ceremony Web Client`
   - **Authorized JavaScript origins:**
     - Click "Add URI"
     - Enter: `http://localhost:5174`
   - **Authorized redirect URIs:**
     - Click "Add URI"
     - Enter: `http://localhost:5174`
   - Click "Create"

5. **Copy Your Client ID:**
   - A popup will show your Client ID (looks like: `123456789-abc123xyz.apps.googleusercontent.com`)
   - Click the copy button

6. **Add to Your App:**
   - Open `.env.local` file
   - Replace `YOUR_ACTUAL_CLIENT_ID_HERE` with your Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
   ```
   - Save the file

7. **Restart Development Server:**
   - Stop the current server (Ctrl+C in the terminal running `npm run dev`)
   - Run: `npm run dev`
   - Wait for it to start on http://localhost:5174

## 🧪 Testing Steps

### Test 1: Submit RSVP with Google Email

1. Open http://localhost:5174
2. Scroll to "Please RSVP" section
3. Fill in the form:
   - Name: Your name
   - Email: **Your Gmail address** (e.g., yourname@gmail.com)
   - Phone: Any number
   - Attending: Yes
   - Guests: 2
   - Message: "Testing Google OAuth!"
4. Click "Submit RSVP"
5. ✅ Should see success message

### Test 2: Search for Your RSVP

1. Scroll to "Already RSVPed? Manage Your Response" section
2. Enter your email address (the one you used above)
3. Click "Search"
4. ✅ Should see your RSVP details displayed

### Test 3: Google Sign-In

1. After searching, you should see:
   - "Sign in with Google to verify your identity"
   - A Google Sign-In button
2. Click the **"Sign in with Google"** button
3. ✅ Google popup should appear
4. Select your Google account (the same email you used for RSVP)
5. ✅ Should see green success message: "Welcome [Your Name]! You can now edit or delete your RSVP."
6. ✅ Should see your profile picture
7. ✅ "Edit" and "Delete" buttons should now be visible

### Test 4: Edit Your RSVP

1. After successful Google Sign-In, click "Edit"
2. Form should populate with your existing data
3. Change something (e.g., number of guests from 2 to 3)
4. Click "Update RSVP"
5. ✅ Should see "RSVP updated successfully!"
6. Search again to verify changes were saved

### Test 5: Wrong Email Test (Security)

1. Submit another RSVP with a **different email** (not your Gmail)
2. Search for that RSVP
3. Try to sign in with Google (with your Gmail account)
4. ✅ Should see error: "This Google account email does not match the RSVP email."
5. ✅ Edit/Delete buttons should NOT appear

### Test 6: Guest Wishes (New Email Field)

1. Scroll to "Send Your Wishes" section
2. Fill in:
   - Name: Your name
   - **Email: Your Gmail address** (NEW FIELD!)
   - Message: "Best wishes for baby Parv!"
3. Click "Send Wishes"
4. ✅ Should see success message

### Test 7: Edit Your Wish

1. Scroll to "Already Posted a Wish?" section
2. Enter your email
3. Click "Search"
4. ✅ Should see your wish
5. Click "Sign in with Google"
6. ✅ Should authenticate successfully
7. Click "Edit" → Make changes → "Update Wishes"
8. ✅ Should see success message

### Test 8: Delete Functionality

1. Search for your RSVP or Wish
2. Sign in with Google
3. Click "Delete"
4. ✅ Should see confirmation dialog
5. Confirm deletion
6. ✅ Should see "deleted successfully" message
7. Search again
8. ✅ Should see "No RSVP/wish found" message

## 🎯 What to Look For

### ✅ Success Indicators:
- Google Sign-In button appears after searching
- Clicking button opens Google popup
- After signing in, see green success message with your name
- Profile picture appears
- Edit/Delete buttons become visible
- Changes are saved and persist

### ❌ Common Issues:

**"Google Sign-In failed"**
- Check that Client ID is correctly set in `.env.local`
- Verify `http://localhost:5174` is in authorized origins in Google Cloud Console
- Restart dev server after changing `.env.local`

**Button doesn't appear**
- Open browser console (F12) and check for errors
- Look for error about `VITE_GOOGLE_CLIENT_ID`
- Make sure you restarted dev server

**"This Google account email does not match"**
- This is correct behavior! It means security is working
- You must sign in with the exact Google account that matches your RSVP email

**Popup blocked**
- Allow popups for localhost:5174 in browser settings
- Google may also show "One Tap" prompt automatically

## 📱 Mobile Testing (Optional)

If you want to test the mobile experience:

1. Get your local IP: Run `ipconfig` in PowerShell, look for IPv4 Address
2. Add your IP to Google Cloud Console authorized origins: `http://YOUR-IP:5174`
3. Open on phone: `http://YOUR-IP:5174`
4. Test Google Sign-In (should be even faster on mobile!)

## 🎨 Expected UI Behavior

### Before Google Sign-In:
```
[Your RSVP Details]
─────────────────────────
Sign in with Google to verify your identity
Please sign in with: yourname@gmail.com

[Sign in with Google Button]
```

### After Google Sign-In:
```
[Your RSVP Details]
─────────────────────────
✓ Signed in as John Doe
  john@gmail.com
  [Profile Picture]

[Edit Button] [Delete Button]
```

## 🐛 Debugging

If something doesn't work:

1. **Check Browser Console:**
   - Press F12
   - Look for errors in red
   - Share any error messages

2. **Check Network Tab:**
   - F12 → Network tab
   - Try signing in
   - Look for failed requests to `accounts.google.com`

3. **Verify Environment Variable:**
   - Browser console → Type: `import.meta.env.VITE_GOOGLE_CLIENT_ID`
   - Should show your Client ID (not "YOUR_ACTUAL_CLIENT_ID_HERE")

4. **Check API:**
   - Open http://localhost:7071/api/rsvps
   - Should see JSON array of RSVPs

## ✨ Cool Features to Notice

1. **One-Tap Sign-In:** On Chrome, Google may automatically prompt you to sign in
2. **Auto-Select:** If you're logged into Chrome with your Google account, it pre-selects it
3. **Profile Picture:** Shows your Google profile photo after authentication
4. **Fast on Mobile:** Especially fast on Chrome/Android where you're already logged in
5. **No Codes:** No more manual verification codes to remember!

## 📊 Test Results Checklist

- [ ] RSVP submission works
- [ ] Search finds RSVP
- [ ] Google Sign-In button appears
- [ ] Sign-in popup opens
- [ ] Authentication succeeds with matching email
- [ ] Authentication fails with non-matching email
- [ ] Profile picture displays
- [ ] Edit button works
- [ ] Changes are saved
- [ ] Delete button works
- [ ] Wish submission works (with email field)
- [ ] Wish search and edit work

---

**Need help?** Check `GOOGLE_AUTH_README.md` for detailed troubleshooting!
