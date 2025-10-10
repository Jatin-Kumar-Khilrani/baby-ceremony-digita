# Quick Start: Email PIN Setup

## 🚀 5-Minute Setup

### Step 1: Get Gmail App Password (2 min)
1. Visit: https://myaccount.google.com/apppasswords
2. If prompted, enable 2-Step Verification first
3. Select **Mail** → **Other (Custom name)** → Type "Baby Ceremony"
4. Click **Generate**
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Email (1 min)
Edit `api/local.settings.json`:
```json
"SMTP_USER": "your-actual-email@gmail.com",
"SMTP_PASS": "abcd efgh ijkl mnop"
```

### Step 3: Restart Functions (1 min)
```bash
# In the terminal running Azure Functions:
# Press Ctrl+C to stop
# Then:
cd api
func start
```

### Step 4: Test (1 min)
1. Go to http://localhost:5174
2. Submit RSVP with **non-Gmail email** (e.g., test@yahoo.com)
3. Check your email inbox for the PIN
4. Search for your RSVP and enter the PIN to verify

## ✅ What You Should See

### On Submission:
- ✅ Success toast: "Thank you for your RSVP!"
- ✅ Info toast: "📧 Check your email! We've sent you a 4-digit PIN"

### In Email Inbox:
- ✅ Email from your Gmail address
- ✅ Subject: "Your RSVP Verification PIN - Baby Parv's Ceremony"
- ✅ Large 4-digit PIN displayed prominently
- ✅ Instructions on how to use the PIN

### When Editing:
- ✅ Search finds your RSVP
- ✅ PIN input field appears
- ✅ After entering correct PIN: Edit/Delete buttons appear

## ❌ Common Issues

| Problem | Solution |
|---------|----------|
| Email not sending | Check SMTP credentials are correct |
| "Authentication failed" | Verify app password (no spaces) |
| Email in spam | Mark as "Not Spam" - normal for first test |
| Port blocked | Check firewall allows port 587 |
| Functions error | Restart Functions server |

## 📧 Email Service Options

For 1000 guests, consider:

| Service | Cost | Setup Time | Best For |
|---------|------|------------|----------|
| **Gmail SMTP** | Free | 5 min | Testing/Small events |
| **SendGrid** | Free (100/day) or $15/mo | 15 min | Production recommended |
| **Azure Email** | $0.50 per 1000 | 30 min | Enterprise |

## 🔗 Helpful Links

- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [Full Setup Guide](./EMAIL_SETUP_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

## 💡 Pro Tips

1. **Use a dedicated Gmail** for sending (not your personal email)
2. **Test with multiple providers** (Yahoo, Outlook, Hotmail)
3. **Check spam folder** on first test
4. **Save app password** in password manager
5. **Monitor logs** during testing: `func start --verbose`

---

**Questions?** See `EMAIL_SETUP_GUIDE.md` for detailed instructions.
