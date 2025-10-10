# 🧪 Live Testing Session - Google OAuth

## ✅ Status:
- **Frontend:** Running on http://localhost:5175
- **API:** Running on http://localhost:7071  
- **Google Client ID:** Configured ✅

---

## 📋 Testing Steps:

### **Test 1: Submit an RSVP** 

1. **Open the app** in your browser: http://localhost:5175
2. **Scroll down** to the "Please RSVP" section
3. **Fill out the form:**
   - Name: `Jatin Khilrani` (your name)
   - Email: **YOUR GMAIL ADDRESS** (e.g., jatin@gmail.com)
     - ⚠️ **IMPORTANT:** Use the SAME Gmail you used to create Google Cloud project!
   - Phone: Any number
   - Attending: `Yes`
   - Number of Guests: `2`
   - Message: `Testing Google OAuth authentication!`
4. **Click "Submit RSVP"**
5. ✅ **Expected:** See success message

---

### **Test 2: Search for Your RSVP**

1. **Scroll to** "Already RSVPed? Manage Your Response" section
2. **Enter your email** in the search box (same email you used above)
3. **Click "Search"**
4. ✅ **Expected:** 
   - See your RSVP details displayed
   - See message: "RSVP found! Please sign in with Google to verify your identity."

---

### **Test 3: Google Sign-In (THE BIG TEST!)** 🎯

1. **Look for the Google Sign-In section** - you should see:
   ```
   Sign in with Google to verify your identity
   Please sign in with: your-email@gmail.com
   
   [Sign in with Google Button]
   ```

2. **Click the "Sign in with Google" button**

3. ✅ **What should happen:**
   - Google popup/overlay appears
   - Shows your Google accounts
   - You select your account
   
4. **Possible scenarios:**

   **Scenario A: First-time sign-in (Testing mode)**
   ```
   ⚠️ Google hasn't verified this app
   
   This app hasn't been verified by Google yet. If you understand
   the risks, you may continue.
   
   [Advanced ▼]  [Go Back]
   ```
   
   **Click "Advanced"** → **Click "Go to Baby Ceremony Invitation (unsafe)"**
   
   **Scenario B: If you're already signed in to Chrome**
   - May auto-select your account
   - May use "One Tap" sign-in
   - Instant authentication!

5. ✅ **After successful sign-in, you should see:**
   ```
   ✓ Signed in as [Your Name]
     your-email@gmail.com
     [Your Google Profile Picture]
   
   [Edit Button]  [Delete Button]
   ```

6. ✅ **Check the toast notification:**
   - Should see green success: "Welcome [Your Name]! You can now edit or delete your RSVP."

---

### **Test 4: Edit Your RSVP**

1. **After successful Google Sign-In**, click the **"Edit"** button
2. ✅ **Expected:** Form should populate with your existing RSVP data
3. **Make a change:**
   - Change number of guests from `2` to `3`
   - Update message to `Updated after Google OAuth!`
4. **Click "Update RSVP"**
5. ✅ **Expected:** See "RSVP updated successfully!" message

---

### **Test 5: Verify Changes Persisted**

1. **Refresh the page** (F5)
2. **Search for your RSVP again**
3. **Sign in with Google again** (should be faster this time!)
4. ✅ **Expected:** See your updated information (3 guests, new message)

---

### **Test 6: Security Test (Wrong Email)**

1. **Create a new RSVP** with a **different email** (not your Gmail)
   - Use a fake email like: `test@example.com`
2. **Search for that RSVP**
3. **Try to sign in with Google** (with your real Gmail account)
4. ✅ **Expected:** 
   - Error message: "This Google account email does not match the RSVP email."
   - Edit/Delete buttons should NOT appear
   - This proves security is working! 🔒

---

### **Test 7: Guest Wishes (Now with Email)**

1. **Scroll to** "Send Your Wishes" section
2. **Fill out:**
   - Name: `Jatin`
   - **Email:** YOUR GMAIL ADDRESS
   - Message: `Best wishes for baby Parv!`
3. **Click "Send Wishes"**
4. ✅ **Expected:** Success message

---

### **Test 8: Edit Your Wish**

1. **Scroll to** "Already Posted a Wish? Manage It Here"
2. **Enter your email** and click "Search"
3. ✅ **Expected:** See your wish displayed
4. **Click "Sign in with Google"**
5. ✅ **Expected:** 
   - Google authentication (may be instant if still signed in)
   - Profile picture appears
   - Edit/Delete buttons appear
6. **Click "Edit"** and make changes
7. **Click "Update Wishes"**
8. ✅ **Expected:** See success message

---

## 🎯 **What to Look For:**

### ✅ **Success Indicators:**

1. **Google Sign-In button appears** after searching for RSVP/Wish
2. **Google popup opens** when clicking the button
3. **Profile picture displays** after successful authentication
4. **Toast notification** shows "Welcome [Your Name]!"
5. **Edit and Delete buttons** become visible
6. **Changes are saved** and persist after refresh
7. **Security works** - wrong email gets rejected

---

### ❌ **Troubleshooting:**

**Problem: "Google Sign-In button doesn't appear"**
- Check browser console (F12) for errors
- Verify Client ID is correct in `.env.local`
- Make sure you restarted dev server after adding Client ID

**Problem: "Popup blocked"**
- Allow popups for localhost:5175 in browser settings
- Or look for popup blocker icon in address bar

**Problem: "This site can't be reached" on Google popup**
- Check that `http://localhost:5175` is in Google Cloud Console authorized origins
- **UPDATE YOUR GOOGLE OAUTH CONFIG:**
  - Go to Google Cloud Console → Credentials
  - Edit your OAuth Client ID
  - Add `http://localhost:5175` to authorized origins (note: port 5175, not 5174!)
  - Save

**Problem: "Invalid Client ID"**
- Double-check the Client ID in `.env.local`
- Make sure there are no extra spaces or quotes

**Problem: "redirect_uri_mismatch"**
- Add `http://localhost:5175` to authorized redirect URIs in Google Cloud Console

---

## 📸 **Screenshot Checklist:**

Take screenshots of:
- [ ] Google Sign-In button appearing
- [ ] Google authentication popup
- [ ] Profile picture after sign-in
- [ ] Edit/Delete buttons appearing
- [ ] Security rejection for wrong email

---

## 🎉 **Success Criteria:**

You'll know everything works when:
1. ✅ You can submit an RSVP
2. ✅ Google Sign-In button appears when you search
3. ✅ You successfully sign in with Google
4. ✅ Your profile picture shows up
5. ✅ You can edit your RSVP
6. ✅ Changes are saved
7. ✅ Security blocks wrong email

---

## 📝 **After Testing:**

Once everything works locally, you're ready to:
1. Deploy to production (see `PRODUCTION_DEPLOYMENT.md`)
2. Update Google OAuth with production URL
3. Send invitations to your 1000 guests!

---

**Current Status:**
- App URL: http://localhost:5175
- API URL: http://localhost:7071
- Ready to test! 🚀

**Start with Test 1 and work your way through. Let me know if you encounter any issues!**
