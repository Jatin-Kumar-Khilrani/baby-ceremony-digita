# ⭐ START HERE - Baby Ceremony Invitation Setup

## 🎯 What You're Setting Up

A beautiful baby ceremony invitation website where:
- ✅ **All guests see the same RSVPs** (not isolated per browser)
- ✅ **Everyone can read all wishes** 
- ✅ **Photos are shared** across all visitors
- ✅ **Real-time updates** when new data is added
- ✅ **Cloud storage** using your Azure credits (~$0.10-$1/month)

## 🚀 Option 1: Automated Setup (RECOMMENDED)

### Prerequisites
✅ Azure CLI is already installed
❗ But you need to **restart your terminal** for it to work

### Steps

#### 1. Restart Your Terminal
**Close this terminal completely** and open a **NEW PowerShell window**

#### 2. Navigate to Project
```powershell
cd 'c:\Users\jkhilrani\OneDrive - Microsoft\Desktop\baby-ceremony-digita'
```

#### 3. Run Setup Script
```powershell
.\setup-azure-simple.ps1
```

The script will:
- Login to Azure (opens browser)
- Create storage account
- Configure API settings
- Install dependencies

#### 4. Start Development Servers

**Terminal 1 - API:**
```powershell
cd api
npm start
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

#### 5. Test It!
- Open http://localhost:5173 in Browser 1
- Submit an RSVP
- Open http://localhost:5173 in Browser 2 (different browser or incognito)
- **You'll see the same RSVP!** 🎉

---

## 📖 Option 2: Manual Setup

If the script doesn't work, follow the detailed steps in **QUICK_START.md**

---

## 🆘 Quick Troubleshooting

### "az is not recognized"
→ You need to restart your terminal after Azure CLI installation

### "Cannot find module '@azure/functions'"
→ Run `npm install` in the `api` folder

### API won't start
→ Make sure `api/local.settings.json` exists and has your connection string

### Data not sharing between browsers
→ Check that the API is running on http://localhost:7071
→ Check browser console for errors

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START_HERE.md** | ← You are here! Quick setup |
| **QUICK_START.md** | Manual step-by-step setup guide |
| **setup-azure-simple.ps1** | Automated setup script |
| **DEPLOYMENT.md** | Full production deployment guide |
| **SHARED_DATA_SOLUTION.md** | Technical architecture explanation |
| **api/README.md** | API endpoint documentation |

---

## ⚡ Super Quick Test (No Azure Needed)

Want to just see the UI without setting up Azure?

```powershell
npm run dev
```

This will use localStorage (data won't be shared between browsers, but you can see the invitation).

---

## 💰 Cost

- **Azure Static Web Apps**: FREE
- **Azure Functions**: FREE (1M requests/month)
- **Azure Blob Storage**: ~$0.10-$1.00/month

**Total: ~$0.10-$1.00/month** - Perfect for your Azure credits!

---

## 🎊 What Happens After Setup

Once setup is complete:

1. **Local Development**: Test with API running locally
2. **Production Deployment**: Deploy to Azure (see DEPLOYMENT.md)
3. **Share URL**: Send invitation link to guests
4. **Real-time Data**: All guests see same RSVPs, wishes, and photos!

---

## ✅ Next Action

**→ Close this terminal and open a NEW PowerShell window**

Then run:
```powershell
cd 'c:\Users\jkhilrani\OneDrive - Microsoft\Desktop\baby-ceremony-digita'
.\setup-azure-simple.ps1
```

🎉 **Let's celebrate baby Parv's arrival!** 👶
