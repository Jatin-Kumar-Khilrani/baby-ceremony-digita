# Email PIN Delivery Setup Guide

This guide will help you set up automated email delivery for verification PINs sent to non-Gmail users.

## Overview

- **Gmail users**: Use Google OAuth for seamless authentication
- **Non-Gmail users** (Yahoo, Outlook, Hotmail, etc.): Receive a 4-digit PIN via email

## Email Service Setup

### Option 1: Gmail SMTP (Recommended for Testing)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

#### Step 2: Generate App Password
1. Visit [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: `Baby Ceremony RSVP`
5. Click **Generate**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

#### Step 3: Configure Local Settings
1. Open `api/local.settings.json`
2. Update the following values:
```json
{
  "Values": {
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-gmail@gmail.com",
    "SMTP_PASS": "xxxx xxxx xxxx xxxx"
  }
}
```

### Option 2: Azure Communication Services Email (Recommended for Production)

#### Step 1: Create Email Communication Service
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new **Email Communication Service**
3. Add a custom domain or use Azure subdomain
4. Note the connection string

#### Step 2: Update Email Service Code
Edit `api/src/emailService.ts` to use Azure Communication Services:
```typescript
import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const client = new EmailClient(connectionString);

// Update sendPinEmail function to use Azure
```

### Option 3: SendGrid (Alternative for Production)

#### Step 1: Create SendGrid Account
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Free tier: 100 emails/day
3. Create API key

#### Step 2: Install SendGrid Package
```bash
cd api
npm install @sendgrid/mail
```

#### Step 3: Configure SendGrid
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## Local Testing

### 1. Update Local Settings
Edit `api/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASS": "your-app-password"
  }
}
```

### 2. Restart Azure Functions
```bash
cd api
func start
```

### 3. Test Email Delivery
1. Open the app: http://localhost:5174
2. Submit RSVP with a non-Gmail email (e.g., test@yahoo.com)
3. Check email inbox for PIN
4. Try to edit/delete RSVP using the PIN

## Production Deployment

### Azure Static Web Apps Configuration

1. **Add Environment Variables** in Azure Portal:
   - Go to your Static Web App
   - Settings → Configuration
   - Add Application Settings:
     - `SMTP_HOST`: smtp.gmail.com
     - `SMTP_PORT`: 587
     - `SMTP_USER`: your-email@gmail.com
     - `SMTP_PASS`: your-app-password

2. **Security Best Practices**:
   - Use Azure Key Vault for sensitive credentials
   - Rotate app passwords regularly
   - Monitor email sending logs

### Email Template Customization

Edit `api/src/emailService.ts` to customize:
- Email subject line
- HTML template design
- Sender name
- Reply-to address

## Troubleshooting

### Email Not Sending

**Check 1: SMTP Credentials**
```bash
# Verify settings in local.settings.json
cat api/local.settings.json
```

**Check 2: Gmail Security**
- Ensure 2FA is enabled
- Verify App Password is correct (no spaces)
- Check [Less Secure Apps](https://myaccount.google.com/lesssecureapps) is disabled

**Check 3: Firewall/Network**
- Port 587 must be open for SMTP
- Check corporate firewall settings

**Check 4: Logs**
```bash
# Check Azure Functions logs
func start --verbose
```

### Email Goes to Spam

**Solutions:**
1. Set up SPF records for your domain
2. Use a verified domain email address
3. Include unsubscribe link
4. Add email authentication (DKIM, DMARC)

### PIN Not Received

**Verify:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Azure Functions logs for errors
4. Test with a different email provider

## Email Delivery Flow

```
User submits RSVP (non-Gmail)
        ↓
Frontend sends to /api/rsvps
        ↓
Backend detects non-Gmail email
        ↓
Generate 4-digit PIN
        ↓
Store PIN in Azure Blob Storage
        ↓
Send PIN via email (SMTP/SendGrid/Azure)
        ↓
User receives email with PIN
        ↓
User uses PIN to verify and edit/delete RSVP
```

## Cost Estimates

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Gmail SMTP | Unlimited (personal use) | N/A |
| SendGrid | 100 emails/day | $14.95/month (40K emails) |
| Azure Communication Services | $0 | $0.0005/email |

## Security Considerations

1. **App Passwords**: Never commit to Git
2. **Rate Limiting**: Implement to prevent abuse
3. **Email Validation**: Verify email format before sending
4. **PIN Expiry**: Consider adding PIN expiration (optional)
5. **Audit Logs**: Track email sending for monitoring

## Support

For issues with:
- **Gmail SMTP**: Check [Google Support](https://support.google.com/accounts)
- **Azure Email**: Check [Azure Docs](https://docs.microsoft.com/azure/communication-services)
- **SendGrid**: Check [SendGrid Docs](https://docs.sendgrid.com)

---

**Next Steps:**
1. Choose email service (Gmail SMTP recommended for testing)
2. Configure `local.settings.json` with SMTP credentials
3. Restart Azure Functions
4. Test email delivery with non-Gmail address
5. Deploy to production with secure credentials
