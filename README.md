# 🎉 Baby Ceremony Digital Invitation

A beautiful, modern digital invitation system for baby naming ceremonies with RSVP management, photo gallery, and guest wishes.

## ✨ Features

### Guest Features
- 📧 **RSVP Management** - Easy online RSVP with email/PIN verification
- 📸 **Photo Gallery** - Share ceremony photos with guests
- 💝 **Guest Wishes** - Collect heartfelt wishes and blessings
- 📱 **Mobile Responsive** - Works beautifully on all devices
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations

### Admin Features
- 🔐 **Secure Authentication** - PIN-based admin access
- 📊 **Dashboard** - View stats and manage all submissions
- ✏️ **CRUD Operations** - Edit, delete RSVPs, wishes, and photos
- ☑️ **Bulk Operations** - Multi-select and bulk delete
- 📥 **CSV Export** - Download RSVPs and wishes data
- 🎯 **Real-time Updates** - Live data from Azure Storage

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/baby-ceremony-digita.git
   cd baby-ceremony-digita
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd api && npm install && cd ..
   ```

3. **Configure environment**
   ```bash
   cp .env.template .env
   # Edit .env with your Azure credentials
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: API
   cd api
   func start
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - Admin: http://localhost:5173/admin
   - API: http://localhost:7071/api

### Default Admin Credentials

- **Email**: `admin@baby-ceremony.com`
- **PIN**: `1234`

⚠️ **Change these before production!**

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **Phosphor Icons** for beautiful icons

### Backend
- **Azure Functions** (Node.js 18)
- **Azure Blob Storage** for data persistence
- **Azure Communication Services** for emails
- **TypeScript** for type safety

### Deployment
- **Azure Static Web Apps** for hosting
- **GitHub Actions** for CI/CD

## 🏗️ Project Structure

```
baby-ceremony-digita/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AdminAuth.tsx # Admin authentication
│   │   ├── RSVPForm.tsx  # RSVP form with verification
│   │   ├── PhotoGallery.tsx
│   │   └── GuestWishes.tsx
│   ├── pages/
│   │   └── Admin.tsx     # Admin dashboard
│   ├── services/
│   │   └── azureStorage.ts
│   └── main.tsx
├── api/
│   ├── rsvps/            # RSVP API endpoints
│   ├── wishes/           # Wishes API endpoints
│   ├── photos/           # Photos API endpoints
│   └── src/
│       └── emailService.ts
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml
├── .env.template         # Environment variables template
├── PRODUCTION_DEPLOYMENT_GUIDE.md
├── PRODUCTION_CHECKLIST.md
└── ADMIN_CREDENTIALS.md
```

## 🔐 Security Features

- ✅ PIN-based admin authentication
- ✅ Session-based access control (24-hour expiry)
- ✅ Email verification for RSVP edits
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Secure HTTP headers
- ✅ Environment variable protection

## 🚢 Production Deployment

### Prerequisites
- Azure account with active subscription
- GitHub account
- Azure CLI installed

### Step-by-Step Guide

1. **Follow the complete guide**
   ```bash
   # See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed steps
   ```

2. **Configure GitHub Secrets**
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - `VITE_ADMIN_EMAIL`
   - `VITE_ADMIN_PIN`
   - `VITE_AZURE_STORAGE_ACCOUNT`
   - `VITE_AZURE_STORAGE_KEY`

3. **Deploy**
   ```bash
   git push origin main
   # GitHub Actions will automatically deploy
   ```

4. **Verify deployment**
   - Visit your Azure Static Web App URL
   - Test all features
   - Check Application Insights logs

### Production URLs
- **Live Site**: `https://your-app-name.azurestaticapps.net`
- **Admin Panel**: `https://your-app-name.azurestaticapps.net/admin`

## 📊 Monitoring & Maintenance

### Application Insights
Monitor application health:
- Request rates and response times
- Error rates and exceptions
- Custom events and metrics

### Backup Strategy
```bash
# Backup blob storage
az storage blob download-batch \
  --account-name your-storage-account \
  --source ceremony-data \
  --destination ./backups/$(date +%Y%m%d)
```

### Cost Optimization
- Free tier: 100GB bandwidth/month
- Estimated cost: $0-5 USD/month for small events
- Delete old photos after ceremony

## 🧪 Testing

```bash
# Build frontend
npm run build

# Build API
cd api && npm run build

# Type checking
npx tsc --noEmit

# Test locally
npm run dev
```

## 📝 Documentation

- **[Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete Azure setup
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Pre-deployment checklist
- **[Admin Credentials](ADMIN_CREDENTIALS.md)** - Admin access information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Port 7071 already in use?**
```bash
# Windows
netstat -ano | findstr :7071
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:7071 | xargs kill -9
```

**Build failures?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**CORS errors in production?**
- Update Azure Storage CORS settings
- Verify allowed origins match your domain

### Get Help
- Check [Issues](https://github.com/YOUR-USERNAME/baby-ceremony-digita/issues)
- Review Application Insights logs
- Check Azure Function logs

## 🎯 Roadmap

- [ ] Guest photo upload with moderation
- [ ] QR code for easy RSVP
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] SMS notifications
- [ ] Video messages from guests

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Phosphor Icons](https://phosphoricons.com/)
- Hosted on [Azure Static Web Apps](https://azure.microsoft.com/en-us/services/app-service/static/)

---

Made with ❤️ for celebrating life's precious moments


