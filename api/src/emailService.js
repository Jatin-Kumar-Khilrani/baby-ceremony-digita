"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePin = generatePin;
exports.sendPinEmail = sendPinEmail;
exports.sendPinUpdateEmail = sendPinUpdateEmail;
const nodemailer = __importStar(require("nodemailer"));
const communication_email_1 = require("@azure/communication-email");
// Determine which email service to use
function getEmailServiceType() {
    return process.env.AZURE_COMMUNICATION_CONNECTION_STRING ? 'azure' : 'smtp';
}
// Generate a random 4-digit PIN
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
// Create email transporter
function createTransporter() {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    };
    return nodemailer.createTransport(config);
}
// Send PIN via email using Azure Communication Services
function sendPinEmailAzure(recipientEmail, recipientName, pin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
            if (!connectionString) {
                throw new Error('Azure Communication Services connection string not configured');
            }
            const client = new communication_email_1.EmailClient(connectionString);
            const senderAddress = process.env.AZURE_COMMUNICATION_SENDER_ADDRESS || 'DoNotReply@YOUR_DOMAIN.com';
            const emailMessage = {
                senderAddress: senderAddress,
                content: {
                    subject: "Your RSVP Verification PIN - Baby Parv's Ceremony",
                    html: getEmailHtmlTemplate(recipientName, pin),
                    plainText: getEmailPlainTextTemplate(recipientName, pin),
                },
                recipients: {
                    to: [{ address: recipientEmail }],
                },
            };
            const poller = yield client.beginSend(emailMessage);
            yield poller.pollUntilDone();
            console.log(`Azure Email sent successfully to ${recipientEmail}`);
            return true;
        }
        catch (error) {
            console.error('Error sending email via Azure:', error);
            return false;
        }
    });
}
// Send PIN via email using SMTP (Gmail, etc.)
function sendPinEmailSMTP(recipientEmail, recipientName, pin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transporter = createTransporter();
            const mailOptions = {
                from: `"Baby Parv's Ceremony" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject: "Your RSVP Verification PIN - Baby Parv's Ceremony",
                html: getEmailHtmlTemplate(recipientName, pin),
                text: getEmailPlainTextTemplate(recipientName, pin),
            };
            yield transporter.sendMail(mailOptions);
            console.log(`SMTP Email sent successfully to ${recipientEmail}`);
            return true;
        }
        catch (error) {
            console.error('Error sending email via SMTP:', error);
            return false;
        }
    });
}
// HTML email template
function getEmailHtmlTemplate(recipientName, pin) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pin-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .pin { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Baby Parv's Naming Ceremony</h1>
        </div>
        <div class="content">
          <h2>Hello ${recipientName}!</h2>
          <p>Thank you for submitting your RSVP for Baby Parv's naming ceremony.</p>
          
          <p>Your verification PIN has been generated. You'll need this PIN to edit or delete your RSVP later.</p>
          
          <div class="pin-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your 4-Digit PIN</p>
            <div class="pin">${pin}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Please keep this PIN safe</p>
          </div>
          
          <p><strong>How to use your PIN:</strong></p>
          <ul>
            <li>Visit the RSVP page and search for your RSVP using your email address</li>
            <li>Enter this 4-digit PIN when prompted</li>
            <li>You'll then be able to edit or delete your RSVP</li>
          </ul>
          
          <p><strong>Security Note:</strong> This PIN is unique to your RSVP and should not be shared with others.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you did not submit an RSVP, please disregard this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
// Plain text email template
function getEmailPlainTextTemplate(recipientName, pin) {
    return `
Hello ${recipientName}!

Thank you for submitting your RSVP for Baby Parv's naming ceremony.

Your verification PIN: ${pin}

You'll need this PIN to edit or delete your RSVP later.

How to use your PIN:
1. Visit the RSVP page and search for your RSVP using your email address
2. Enter this 4-digit PIN when prompted
3. You'll then be able to edit or delete your RSVP

Security Note: This PIN is unique to your RSVP and should not be shared with others.

---
This is an automated email. Please do not reply to this message.
If you did not submit an RSVP, please disregard this email.
  `;
}
// Send PIN via email (auto-detects service type)
function sendPinEmail(recipientEmail, recipientName, pin) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceType = getEmailServiceType();
        console.log(`Sending PIN email via ${serviceType} to ${recipientEmail}`);
        if (serviceType === 'azure') {
            return yield sendPinEmailAzure(recipientEmail, recipientName, pin);
        }
        else {
            return yield sendPinEmailSMTP(recipientEmail, recipientName, pin);
        }
    });
}
// Send PIN update notification
function sendPinUpdateEmail(recipientEmail, recipientName, oldPin, newPin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transporter = createTransporter();
            const mailOptions = {
                from: `"Baby Parv's Ceremony" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject: 'Your RSVP PIN Has Been Updated - Baby Parv\'s Ceremony',
                html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .pin-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .pin { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 PIN Updated</h1>
            </div>
            <div class="content">
              <h2>Hello ${recipientName}!</h2>
              <p>Your RSVP has been updated, and a new PIN has been generated.</p>
              
              <div class="pin-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your New PIN</p>
                <div class="pin">${newPin}</div>
              </div>
              
              <p>Use this new PIN the next time you need to edit or delete your RSVP.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            };
            yield transporter.sendMail(mailOptions);
            return true;
        }
        catch (error) {
            console.error('Error sending update email:', error);
            return false;
        }
    });
}
//# sourceMappingURL=emailService.js.map