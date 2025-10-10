# Production Readiness Checklist

Use this checklist to ensure your application is ready for production deployment.

## ✅ Security

- [ ] **Admin credentials changed** from defaults in `.env`
  - [ ] `VITE_ADMIN_EMAIL` set to secure email
  - [ ] `VITE_ADMIN_PIN` set to secure 4-digit PIN
- [ ] **`.env` file** is in `.gitignore` (already done ✓)
- [ ] **GitHub Secrets** configured:
  - [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN`
  - [ ] `VITE_ADMIN_EMAIL`
  - [ ] `VITE_ADMIN_PIN`
  - [ ] `VITE_AZURE_STORAGE_ACCOUNT`
  - [ ] `VITE_AZURE_STORAGE_KEY`
- [ ] **CORS configured** in Azure Storage (only production domain)
- [ ] **HTTPS enforced** (automatic with Azure Static Web Apps ✓)

## ✅ Azure Resources

- [ ] **Resource Group** created
- [ ] **Storage Account** created with:
  - [ ] `ceremony-rsvps` container (private)
  - [ ] `ceremony-wishes` container (private)
  - [ ] `ceremony-photos` container (public blob access)
  - [ ] `ceremony-data` container (private)
- [ ] **Static Web App** created
- [ ] **Communication Service** created (for emails)
- [ ] **Email domain** verified
- [ ] **Application Insights** configured (optional but recommended)

## ✅ Configuration

- [ ] **staticwebapp.config.json** security headers configured ✓
- [ ] **Azure Function App Settings** configured:
  - [ ] `AZURE_STORAGE_CONNECTION_STRING`
  - [ ] `AZURE_COMMUNICATION_CONNECTION_STRING`
  - [ ] `SENDER_EMAIL`
  - [ ] `ALLOWED_ORIGINS`
- [ ] **Environment variables** match between:
  - [ ] Local `.env` file
  - [ ] GitHub Secrets
  - [ ] Azure Static Web App settings

## ✅ Code Quality

- [ ] **No console.logs** with sensitive data
- [ ] **Error handling** implemented
- [ ] **Input validation** on all forms ✓
- [ ] **API endpoints** secured
- [ ] **File upload limits** configured ✓
- [ ] **TypeScript** compiles without errors
- [ ] **ESLint** passes (if configured)

## ✅ Testing

- [ ] **Local build** succeeds: `npm run build`
- [ ] **API build** succeeds: `cd api && npm run build`
- [ ] **RSVP form** submission works
- [ ] **Photo upload** works
- [ ] **Wishes** submission works
- [ ] **Admin authentication** works with new credentials
- [ ] **Admin CRUD** operations work:
  - [ ] View all RSVPs/wishes/photos
  - [ ] Edit RSVP
  - [ ] Delete single item
  - [ ] Bulk select and delete
  - [ ] Export CSV
- [ ] **Mobile responsiveness** checked
- [ ] **Cross-browser** testing (Chrome, Firefox, Safari, Edge)
- [ ] **Email delivery** tested (if configured)

## ✅ Performance

- [ ] **Images optimized** (compressed, appropriate sizes)
- [ ] **Lazy loading** implemented where needed ✓
- [ ] **Bundle size** acceptable
- [ ] **Load time** < 3 seconds
- [ ] **Lighthouse score** > 90 (optional)

## ✅ Monitoring & Backup

- [ ] **Application Insights** monitoring enabled
- [ ] **Alerts** configured for:
  - [ ] Error rates
  - [ ] Storage quota
  - [ ] Function failures
- [ ] **Backup strategy** documented
- [ ] **Initial backup** of blob storage taken

## ✅ Documentation

- [ ] **README.md** updated with production URL
- [ ] **PRODUCTION_DEPLOYMENT_GUIDE.md** reviewed
- [ ] **ADMIN_CREDENTIALS.md** secured (not in public repo)
- [ ] **Admin credentials** stored in password manager
- [ ] **Recovery procedures** documented

## ✅ Deployment

- [ ] **GitHub Actions workflow** configured ✓
- [ ] **Deployment tested** on staging/preview branch
- [ ] **Production deployment** successful
- [ ] **DNS configured** (if using custom domain)
- [ ] **SSL certificate** valid (automatic with Azure ✓)
- [ ] **Smoke tests** passed on production URL

## ✅ Post-Deployment

- [ ] **Production URL** tested end-to-end
- [ ] **Analytics** tracking added (optional)
- [ ] **SEO meta tags** configured (optional)
- [ ] **Social share images** configured (optional)
- [ ] **Contact information** updated
- [ ] **Invitation links** sent to guests
- [ ] **Admin panel** accessible and working

## 🎯 Quick Pre-Deploy Command Checklist

Run these commands before deploying:

```bash
# 1. Ensure dependencies are up to date
npm install
cd api && npm install && cd ..

# 2. Build frontend
npm run build

# 3. Build API
cd api && npm run build && cd ..

# 4. Check for TypeScript errors
npx tsc --noEmit

# 5. Run any tests (if you have them)
# npm test

# 6. Verify .env is not committed
git status | grep .env
# Should return nothing (means .env is properly ignored)

# 7. Commit and push
git add .
git commit -m "Production ready deployment"
git push origin main
```

## 🚨 Critical Security Reminders

1. **NEVER commit `.env` file**
2. **CHANGE default admin credentials** before going live
3. **Rotate credentials** every 90 days
4. **Use strong PINs** (avoid 1234, 0000, etc.)
5. **Limit CORS** to your production domain only
6. **Enable logging** to detect suspicious activity
7. **Regular backups** of blob storage
8. **Monitor costs** to avoid unexpected charges

## 📋 Go-Live Day Checklist

Day of ceremony:

- [ ] Verify admin panel is accessible
- [ ] Test RSVP submission from guest perspective
- [ ] Monitor Application Insights dashboard
- [ ] Have backup plan ready (local data export)
- [ ] Admin credentials accessible to ceremony organizer
- [ ] Support contact available for technical issues

---

## ✨ You're Ready!

Once all items are checked, you're ready to go live! 🎉

**Production URL**: `https://your-app-name.azurestaticapps.net`

**Admin Panel**: `https://your-app-name.azurestaticapps.net/admin`

**Support**: Check Application Insights logs for any issues
