# 🧪 Testing Azure Communication Services Email

## ✅ Setup Status

- ✅ Azure Functions running on http://localhost:7071
- ✅ Frontend running on http://localhost:5174
- ✅ Azure Communication Services configured
- ✅ Email sender: `DoNotReply@5d570674-01ad-47be-91f3-08f1d97ad521.azurecomm.net`

## 🎯 Test Scenarios

### Test 1: Gmail User (Dual Auth)

**Steps:**
1. Open http://localhost:5174
2. Go to RSVP section
3. Fill in form:
   - Name: `John Doe`
   - Email: `your-test-gmail@gmail.com` (use your actual email)
   - Phone: `1234567890`
   - Attending: `Yes`
   - Guests: `2`
4. Submit RSVP
5. **Expected Results:**
   - ✅ Success message: "Thank you for your RSVP!"
   - ✅ Info message: "📧 Check your email! We've sent you a 4-digit PIN. You can also use Google Sign-In."
   - ✅ Email arrives in inbox with PIN

**Check Email:**
- Subject: "Your RSVP Verification PIN - Baby Parv's Ceremony"
- From: DoNotReply@5d570674-01ad-47be-91f3-08f1d97ad521.azurecomm.net
- Content: Beautiful HTML with 4-digit PIN

**Test Editing:**
6. Scroll to "Search for Your RSVP"
7. Enter email: `your-test-gmail@gmail.com`
8. Click Search
9. **Expected:** See two options:
   - 🚀 Option 1: Sign in with Google
   - 📧 Option 2: Enter 4-digit PIN

**Option A: Test Google OAuth**
10. Click "Sign in with Google"
11. Sign in with Google account
12. ✅ Should show: "✓ Signed in as Your Name"
13. Click Edit or Delete buttons

**Option B: Test PIN**
10. Enter the PIN from email
11. Click "Verify PIN"
12. ✅ Should show: "✓ PIN verified successfully"
13. Click Edit or Delete buttons

---

### Test 2: Yahoo/Outlook User (PIN Only)

**Steps:**
1. Fill in form:
   - Name: `Jane Smith`
   - Email: `test@yahoo.com` (or your Yahoo/Outlook email)
   - Phone: `9876543210`
   - Attending: `Yes`
   - Guests: `1`
2. Submit RSVP
3. **Expected Results:**
   - ✅ Success message
   - ✅ Info: "Check your email for PIN"
   - ✅ Email arrives with PIN

**Test Editing:**
4. Search for RSVP by email
5. See both options (OAuth + PIN)
6. Google OAuth won't match (expected)
7. Enter PIN from email → Works! ✅

---

### Test 3: Custom Domain Email

**Steps:**
1. Fill in form with custom domain email (e.g., `user@company.com`)
2. Submit RSVP
3. Check email for PIN
4. Test editing with PIN verification

---

## 📊 What to Monitor

### In Azure Functions Terminal:

Watch for these logs:
```
Sending PIN email via azure to user@example.com
Azure Email sent successfully to user@example.com
PIN email sent to user@example.com
```

**If you see errors:**
```
Error sending email via Azure: [error details]
Failed to send PIN email to user@example.com
```

### In Browser Console (F12):

- Check for any errors when submitting RSVP
- Verify API calls to `/api/rsvps`
- Check responses show `pinEmailSent: true`

---

## ✅ Success Criteria

### Email Delivery:
- [ ] Email arrives in inbox (not spam)
- [ ] Email has correct subject line
- [ ] Email displays HTML formatting correctly
- [ ] 4-digit PIN is clearly visible
- [ ] Instructions are clear

### Dual Authentication:
- [ ] Both options shown (OAuth + PIN)
- [ ] Google OAuth works for Gmail users
- [ ] PIN works for all email types
- [ ] Edit/Delete buttons appear after verification

### User Experience:
- [ ] Info message shows dual auth options on submit
- [ ] Success messages are clear
- [ ] No errors in console
- [ ] Smooth workflow from submit to verify to edit

---

## 🐛 Troubleshooting

### Email Not Arriving

**Check Azure Functions logs:**
```
Look for: "Azure Email sent successfully"
```

**If you see "Error sending email":**
1. Verify connection string in `local.settings.json`
2. Check Azure Communication Services is active:
   ```bash
   az communication show --name baby-ceremony-comm --resource-group baby-ceremony-rg
   ```
3. Restart Functions server

### Email in Spam Folder

This is **normal** for first test emails from new domains.
- Check spam/junk folder
- Mark as "Not Spam"
- For production, consider custom domain

### Google OAuth Not Working

**Expected behavior:**
- Gmail users: Should work
- Yahoo/Outlook: Won't work (use PIN instead)
- Custom domain with Google: Should work

### PIN Not Matching

**Verify:**
1. Correct email address entered
2. Using latest PIN from email
3. PIN is exactly 4 digits
4. No extra spaces

---

## 📸 Expected Screenshots

### 1. After Submitting RSVP:
```
✅ Thank you for your RSVP! We look forward to seeing you!
ℹ️ 📧 Check your email! We've sent you a 4-digit PIN. 
   You can also use Google Sign-In to edit your RSVP.
```

### 2. Email Content:
```
🎉 Baby Parv's Naming Ceremony

Hello John Doe!

Thank you for submitting your RSVP...

┌─────────────────────┐
│ Your 4-Digit PIN    │
│      1234           │
│ Please keep safe    │
└─────────────────────┘

How to use your PIN:
• Visit RSVP page
• Search by email
• Enter PIN
• Edit/Delete
```

### 3. Verification Screen:
```
┌──────────────────────────────────────┐
│ 🚀 Option 1: Sign in with Google    │
│    [Google Sign-In Button]           │
│                                      │
│          ────── OR ──────            │
│                                      │
│ 📧 Option 2: Enter your 4-digit PIN │
│    [____] [Verify PIN]               │
└──────────────────────────────────────┘
```

---

## 📝 Test Results Checklist

| Test | Email Type | Status | Notes |
|------|-----------|--------|-------|
| Gmail OAuth | Gmail | ⬜ | Try Google Sign-In |
| Gmail PIN | Gmail | ⬜ | Try PIN from email |
| Yahoo PIN | Yahoo | ⬜ | PIN should work |
| Outlook PIN | Outlook | ⬜ | PIN should work |
| Custom Domain | Custom | ⬜ | Test if available |

---

## 🎯 Next Steps After Testing

### If All Tests Pass:
1. ✅ Mark tests as complete
2. ✅ Document any issues
3. ✅ Ready for production deployment!

### For Production:
1. Add Azure settings to Static Web App
2. Test with production domain
3. Monitor email deliverability
4. Optimize for 1000 guests

---

## 💡 Testing Tips

1. **Use real email addresses** (check actual inbox)
2. **Test different providers** (Gmail, Yahoo, Outlook)
3. **Check spam folders** first time
4. **Monitor Functions logs** for errors
5. **Test both auth methods** (OAuth + PIN)
6. **Try editing/deleting** after verification

---

**Ready?** Open http://localhost:5174 and start testing! 🚀

**Watch the Functions terminal** for email sending logs!
