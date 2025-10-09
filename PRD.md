# Baby Welcome Ceremony Digital Invitation

A delightful digital invitation platform for celebrating baby Parv's welcome ceremony, featuring QR code generation, RSVP management, and seamless guest engagement tools.

**Experience Qualities**:
1. **Joyful** - Celebrates the precious arrival with warm, cheerful colors and playful baby-themed elements
2. **Elegant** - Maintains sophistication appropriate for a family celebration while being approachable
3. **Connected** - Seamlessly links physical and digital experiences through QR codes and social features

**Complexity Level**: Light Application (multiple features with basic state)
- Combines invitation display, RSVP functionality, and social sharing tools in an intuitive interface that families can easily navigate and share.

## Essential Features

### QR Code Generation & Sharing
- **Functionality**: Generate scannable QR codes that link to the digital invitation
- **Purpose**: Bridge physical invitation cards with digital engagement features
- **Trigger**: Auto-generated on page load, with manual refresh option
- **Progression**: Page loads → QR displays → User scans → Landing page opens → Features accessible
- **Success criteria**: QR codes scan successfully and direct to invitation with all features working

### RSVP Management
- **Functionality**: Collect guest responses with attendance confirmation and meal preferences
- **Purpose**: Help hosts plan seating, catering, and logistics effectively
- **Trigger**: Guest clicks "RSVP" button from invitation
- **Progression**: RSVP button → Form opens → Guest fills details → Confirmation message → Host dashboard updates
- **Success criteria**: Responses saved persistently, hosts can view all RSVPs in real-time

### WhatsApp Group Integration
- **Functionality**: Quick join link to dedicated ceremony WhatsApp group
- **Purpose**: Enable ongoing communication, photo sharing, and coordination among attendees
- **Trigger**: Guest taps WhatsApp group button
- **Progression**: WhatsApp button → App opens → Group join prompt → Member added → Welcome message
- **Success criteria**: Seamless redirect to WhatsApp with pre-filled group join message

### Photo & Wishes Collection
- **Functionality**: Allow guests to upload photos and leave digital wishes/blessings
- **Purpose**: Create lasting memories and blessing collection for the family
- **Trigger**: Guest selects "Share Wishes" or "Add Photo"
- **Progression**: Button tap → Upload interface → Media/text entry → Preview → Submit → Gallery updates
- **Success criteria**: Media uploads successfully, wishes display in chronological feed

### Event Reminder System
- **Functionality**: Allow guests to set calendar reminders for the ceremony
- **Purpose**: Reduce no-shows and help guests remember important timing details
- **Trigger**: Guest clicks "Add to Calendar" button
- **Progression**: Calendar button → Platform selection → Event details pre-filled → Calendar app opens → Event saved
- **Success criteria**: Calendar events created with correct date, time, and location details

## Edge Case Handling
- **Network Issues**: Offline-first design with local storage backup for critical RSVP data
- **QR Code Failures**: Manual URL sharing option and troubleshooting guide
- **WhatsApp Not Installed**: Fallback to web WhatsApp or contact information display
- **Large File Uploads**: Image compression and size limits with clear error messaging
- **Duplicate RSVPs**: Email/phone validation to prevent multiple submissions from same guest

## Design Direction
The design should evoke warmth, celebration, and family love - playful yet refined with soft pastels, baby-themed illustrations, and gentle animations that feel like a digital extension of the physical invitation card.

## Color Selection
Analogous (adjacent colors on color wheel) - Soft blues, gentle peaches, and warm yellows that mirror the invitation's baby-friendly palette while maintaining readability and warmth.

- **Primary Color**: Soft Sky Blue (oklch(0.75 0.08 220)) - Represents peace, new beginnings, and baby boy themes
- **Secondary Colors**: Warm Peach (oklch(0.82 0.06 45)) for gentle accents and Cream (oklch(0.95 0.02 85)) for backgrounds
- **Accent Color**: Golden Yellow (oklch(0.85 0.12 85)) for call-to-action buttons and important highlights
- **Foreground/Background Pairings**: 
  - Sky Blue (oklch(0.75 0.08 220)): White text (oklch(1 0 0)) - Ratio 8.2:1 ✓
  - Golden Yellow (oklch(0.85 0.12 85)): Dark Blue text (oklch(0.25 0.08 220)) - Ratio 12.1:1 ✓
  - Cream (oklch(0.95 0.02 85)): Dark text (oklch(0.15 0.02 220)) - Ratio 16.8:1 ✓

## Font Selection
Typography should feel warm and approachable while maintaining excellent readability - combining a playful script for headings with clean sans-serif for body text to balance celebration with functionality.

- **Typographic Hierarchy**: 
  - H1 (Baby Name): Dancing Script Bold/36px/relaxed letter spacing for joyful personality
  - H2 (Section Titles): Inter SemiBold/24px/normal spacing for clear structure
  - Body Text: Inter Regular/16px/1.5 line height for optimal readability
  - Button Text: Inter Medium/14px/uppercase tracking for action clarity

## Animations
Subtle, delightful micro-interactions that enhance the joyful experience without overwhelming the content - gentle fades, soft bounces on interactions, and smooth transitions that feel organic and celebratory.

- **Purposeful Meaning**: Gentle floating animations for baby-themed icons, soft pulsing for important CTAs, smooth page transitions that maintain context
- **Hierarchy of Movement**: QR code gets subtle attention animation, RSVP button pulses gently, photo uploads show satisfying completion states

## Component Selection
- **Components**: Card layouts for invitation content, Dialog for RSVP forms, Button variants for different actions, Input/Textarea for guest information, Avatar for user photos, Badge for status indicators, Tabs for organizing features, Toast notifications for feedback
- **Customizations**: Baby-themed icon set, custom QR code component with styling, photo gallery grid component, WhatsApp integration button with brand colors
- **States**: Hover effects on all interactive elements, loading states for uploads/submissions, success/error feedback for all actions, disabled states for completed RSVPs
- **Icon Selection**: Baby bottle, teddy bear, calendar, camera, heart, share icons from Phosphor set to maintain consistency
- **Spacing**: Generous padding (p-6/p-8) for comfortable reading, consistent gaps (gap-4/gap-6) for visual rhythm, responsive margins that adapt to screen size
- **Mobile**: Stack components vertically on mobile, enlarge touch targets, optimize QR code size for scanning, ensure all features accessible with thumb navigation