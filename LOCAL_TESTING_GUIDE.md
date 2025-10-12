# 🧪 Local Testing Guide - AI Wish Enhancement

## Date: October 12, 2025
## Status: Ready to Test!

---

## 🚀 Servers Running

### Backend (Azure Functions)
- **URL**: http://localhost:7071
- **Status**: ✅ Running (4 endpoints)
- **Endpoints**:
  - `/api/enhance-wish` - AI enhancement
  - `/api/wishes` - Wish CRUD
  - `/api/photos` - Photo management
  - `/api/rsvps` - RSVP management

### Frontend (Vite)
- **URL**: http://localhost:5173
- **Status**: ✅ Running
- **Framework**: React + TypeScript + Vite

---

## 📝 How to Test Wishes Section

### 1. Navigate to Wishes Section
- Open: http://localhost:5173
- Scroll down to "Guest Wishes" section
- Or click on "Wishes" in navigation

### 2. Test AI Enhancement Flow

#### Test Case 1: Sindhi (Roman Script)
1. **Name**: Enter your name (e.g., "Raj")
2. **Email**: Enter email (e.g., "raj@test.com")
3. **Message**: Type: `Acho aahyo Parv beta`
4. Click **"Enhance with AI ✨"** button
5. **Expected**: See enhanced message in Sindhi Roman script
6. **Verify**: No conversion to Hindi Devanagari!

**Expected Output**:
```
Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon saan bhariyo hove. 
Rab tuhinje ghar mein barkat aen pyaar liyae...
```

---

#### Test Case 2: English
1. **Name**: "Sarah"
2. **Email**: "sarah@test.com"
3. **Message**: `Congrats on baby Parv`
4. Click **"Enhance with AI ✨"**
5. **Expected**: Professional English enhancement

**Expected Output**:
```
Congratulations on baby Parv! Wishing you all the joy and happiness 
as you welcome this little blessing...
```

---

#### Test Case 3: Hindi
1. **Name**: "प्रिया"
2. **Email**: "priya@test.com"
3. **Message**: `बेबी पर्व को बधाई`
4. Click **"Enhance with AI ✨"**
5. **Expected**: Beautiful Hindi Devanagari

**Expected Output**:
```
बेबी पर्व को दिल से बहुत-बहुत बधाई! आपका जीवन खुशियों से भरा हो...
```

---

#### Test Case 4: Longer Sindhi
1. **Name**: "Kiran"
2. **Email**: "kiran@test.com"
3. **Message**: `Nanho Parv ne mubarak! Tuhinjo jiwan khushiyon saan bhariyo hove`
4. Click **"Enhance with AI ✨"**
5. **Expected**: Enhanced in Sindhi Roman with more context

---

#### Test Case 5: Rajasthani
1. **Name**: "रमेश"
2. **Email**: "ramesh@test.com"
3. **Message**: `नान्हे पर्व नै घणी घणी राम राम`
4. Click **"Enhance with AI ✨"**
5. **Expected**: Authentic Rajasthani enhancement

---

### 3. Test Email Validation (One Wish Per Person)
1. Submit a wish with email: "test@example.com"
2. Try to submit another wish with same email
3. **Expected**: Error message - "You have already submitted a wish!"

---

### 4. Test Message Validation
- **Too Short**: Try < 5 characters → Should show error
- **Too Long**: Try > 500 characters → Should show error
- **Empty**: Leave message blank → Should show error

---

### 5. Test Enhancement Preview
1. Enter a message and enhance it
2. **Verify**:
   - ✅ Original message shown
   - ✅ Enhanced message in purple gradient card
   - ✅ Token count displayed
   - ✅ "Use Enhanced" and "Use Original" buttons visible

---

### 6. Test Submission Flow
1. Enhance a message
2. Click **"Use Enhanced"** or **"Use Original"**
3. Click **"Send Wish"**
4. **Verify**:
   - ✅ Success toast notification
   - ✅ Form resets
   - ✅ Wish appears in the list below

---

## 🎨 UI Features to Check

### Enhance Button
- ✅ Shows "Enhance with AI ✨" when idle
- ✅ Shows "Enhancing..." with loading state
- ✅ Disabled when message is empty or invalid

### Enhanced Message Preview
- ✅ Purple gradient background
- ✅ Sparkle icon (✨)
- ✅ Shows original and enhanced text
- ✅ Token count displayed
- ✅ Action buttons clearly visible

### Language Indicators
- ✅ Subtle language detection hint (optional)
- ✅ No explicit language selector (auto-detect)

### Email Field
- ✅ Marked as optional but recommended
- ✅ Validates email format
- ✅ Prevents duplicate submissions

---

## 🐛 What to Watch For

### Potential Issues
1. **Rate Limiting**: If you test too many times quickly
   - **Error**: 429 rate limit exceeded
   - **Solution**: Wait 60 seconds

2. **API Connection**: If backend is not running
   - **Error**: Failed to fetch
   - **Solution**: Check `func start` is running on port 7071

3. **CORS Issues**: If API calls fail
   - **Check**: `local.settings.json` has `"CORS": "*"`
   - **Verify**: Console for CORS errors

4. **Language Detection**: If wrong language detected
   - **Check**: Message has clear language markers
   - **Example**: Simple "hi" might be ambiguous

---

## 📊 Success Criteria

### ✅ Test Passed If:
1. **Sindhi stays in Roman script** (not converted to Hindi)
2. **All 5 languages work correctly**
3. **Email validation prevents duplicates**
4. **Enhancement completes in < 5 seconds**
5. **Preview card displays correctly**
6. **Wish saves to storage successfully**
7. **Toast notifications appear**
8. **Form resets after submission**

---

## 🔍 Debugging Tips

### Check Browser Console
- Press `F12` to open DevTools
- Watch for errors in Console tab
- Check Network tab for API calls

### Verify API Response
In Network tab, check `/api/enhance-wish` response:
```json
{
  "original": "Acho aahyo Parv beta",
  "enhanced": "Acho aahyo, Parv beta! Tuhinjo jiwan...",
  "tokensUsed": 1438
}
```

### Check Backend Logs
In the `func start` terminal, watch for:
- Request logs
- Token usage logs
- Error messages (if any)

---

## 📱 Responsive Testing (Optional)

### Desktop
- ✅ Test on Chrome, Edge, Firefox
- ✅ Verify layout looks good

### Mobile (DevTools)
- Press `F12` → Toggle device toolbar
- Test on iPhone/Android sizes
- Verify touch interactions

---

## 🎯 Quick Test Checklist

```
[ ] Frontend server running (http://localhost:5173)
[ ] Backend server running (http://localhost:7071)
[ ] Can navigate to Wishes section
[ ] Can type in message field
[ ] Enhance button appears
[ ] Clicking enhance shows loading state
[ ] Enhanced message appears in preview
[ ] Can switch between original/enhanced
[ ] Can submit wish successfully
[ ] Toast notification appears
[ ] Form resets after submission
[ ] Wish appears in list
[ ] Sindhi stays in Roman (CRITICAL!)
```

---

## 🚀 If Everything Works

1. **Celebrate!** 🎉
2. Commit changes to GitHub
3. Deploy to production
4. Test on live site
5. **Ready for tomorrow's event!**

---

## 📞 Need Help?

### Common Commands
- **Restart Frontend**: `Ctrl+C` in npm dev terminal, then `npm run dev`
- **Restart Backend**: `Ctrl+C` in func terminal, then `cd api; func start`
- **Check API**: `curl http://localhost:7071/api/wishes`
- **Clear Browser Cache**: `Ctrl+Shift+Delete`

---

**Happy Testing!** 🧪✨

The local environment is ready. Open http://localhost:5173 and test away!
