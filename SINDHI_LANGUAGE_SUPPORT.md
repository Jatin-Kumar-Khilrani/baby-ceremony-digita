# Sindhi Language Support in AI Wish Enhancement

## Overview
The AI wish enhancement feature now supports **Sindhi language in Roman script** (English transliteration), allowing users who can speak Sindhi but prefer to write it in English letters to receive enhanced wishes in the same format.

## Event Context
- **Baby Name**: Parv (male)
- **Event**: Naming Ceremony (Naamkaran)
- **Date**: October 13, 2025
- **Parents**: Jatin & Jigna Khilrani

## Supported Languages

### 1. **English** (Roman script)
- Example: "Congrats on baby Parv!"
- Enhanced: "Congratulations on the arrival of baby Parv!..."

### 2. **Hindi** (Devanagari script)
- Example: "बेबी पर्व को बधाई"
- Enhanced: "बेबी पर्व को दिल से बहुत-बहुत बधाई!..."

### 3. **Sindhi** (Roman/English script)
- Example: "Acho aahyo Parv beta"
- Enhanced: "Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon saan bhariyo hove..."
- **Note**: Sindhi speakers who write in English/Roman script are fully supported

### 4. **Rajasthani** (Devanagari or Roman script)
- Example: "नान्हे पर्व नै घणी घणी राम राम"
- Enhanced in Rajasthani

### 5. **Marwadi** (Devanagari script)
- Similar to Rajasthani

## Sindhi Language Detection

The AI automatically detects Sindhi when the message contains these marker words:

### Primary Sindhi Markers (Roman Script)
- **"Acho"** / "acho" = good/welcome
- **"aahyo"** / "Aahyo" = has come/arrived
- **"Tuhinjo"** / "tuhinjo" = your
- **"Tuhinje"** / "tuhinje" = your
- **"jiwan"** = life (Sindhi-specific)
- **"khushiyon saan"** = with happiness
- **"hove"** = be/may it be
- **"nanho ne"** / "Nanho ne" = to the little one
- **"Parv ne"** = to Parv (Sindhi style)

### Sindhi Vocabulary Used in Enhancements

When Sindhi is detected, the AI uses authentic Sindhi words:

| Sindhi Word | Meaning | NOT Confused With |
|-------------|---------|-------------------|
| Tuhinjo/Tuhinje | Your | Hindi: "Tumhara", Gujarati: "Thari" |
| jiwan | Life | Hindi: "zindagi" |
| khushiyon saan | With happiness | Hindi: "ke saath" |
| bhariyo hove | May be filled | Gujarati: "bharo" |
| acho aahyo | Good arrival | - |
| sukh | Happiness | - |
| shanti/aman | Peace | - |
| barkat | Blessings | - |
| Rab/Allah | God | - |
| mubarak | Congratulations | - |
| sehat | Health | - |
| pyaar | Love | - |
| dua | Prayer/blessing | - |

## How It Works

### Detection Logic
```typescript
const isSindhiRoman = 
  message.toLowerCase().includes('acho') || 
  message.toLowerCase().includes('aahyo') || 
  message.toLowerCase().includes('tuhinjo') || 
  message.toLowerCase().includes('tuhinje') ||
  message.toLowerCase().includes('saan') || 
  message.toLowerCase().includes('hove');
```

### Enhanced Prompt
When Sindhi is detected:
1. ✅ **MUST** respond in Sindhi Roman script
2. ❌ **FORBIDDEN**: Convert to Hindi Devanagari (हिंदी)
3. ✅ Use only Roman/Latin alphabet (a-z, A-Z)
4. ✅ Incorporate event context (baby Parv's naming ceremony tomorrow)
5. ✅ Use authentic Sindhi vocabulary
6. ✅ Keep warm, heartfelt tone

## Examples

### Example 1: Simple Greeting
**Input**: `"Acho aahyo Parv beta"`

**Enhanced Output**:
```
Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove. 
Rab tuhinje ghar mein barkat aen pyaar liyae. Nanho Parv hamesha sehat aen 
khushi saan rahje.
```

### Example 2: Blessing
**Input**: `"Nanho Parv ne mubarak! Tuhinjo jiwan khushiyon saan bhariyo hove"`

**Enhanced Output**:
```
Nanho Parv ne dil se mubarak! Tuhinjo jiwan khushiyon, sukh, aur samriddhi 
saan bhariyo hove. Tuhinjo har din pyaar aen barkat saan bharyo rahe!
```

### Example 3: Short Message
**Input**: `"Tuhinjo nanho mubarak"`

**Enhanced Output**:
```
Tuhinjo nanho Parv mubarak! Rab tuhinje ghar mein khushiyon ki barkat liyae. 
Nanho Parv hamesha sehat, sukh, aen pyaar saan rahje. Tuhinjo jiwan shanti 
aen samriddhi saan bharyo hove!
```

## Technical Implementation

### AI Configuration
- **Model**: GPT-4o-mini (Azure OpenAI)
- **Temperature**: 0.3 (for more consistent language detection)
- **Max Tokens**: 300
- **API Version**: 2024-08-01-preview

### Few-Shot Learning
The system includes example conversations to teach the AI:
```typescript
{
  role: "user",
  content: "Acho aahyo Parv beta"
},
{
  role: "assistant",
  content: "Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove..."
}
```

### Rate Limiting
- Free tier: Limited tokens per minute
- If rate limit hit: Wait 60 seconds before retrying
- Estimated cost: ~$0.12-$0.50 for 1,000 wishes

## User Experience

### Frontend Integration
1. User enters wish in Sindhi (Roman script)
2. Optional: Enters email (prevents duplicate wishes)
3. Clicks "Enhance with AI ✨" button
4. AI detects language and enhances
5. Preview shown with purple gradient card
6. User can accept or edit before submitting

### Language Indicator
The UI shows a subtle indicator when Sindhi is detected:
```
🌟 Detected: Sindhi (Roman script)
```

## Development Notes

### Local Testing
```bash
cd api
npm run build  # Compiles TypeScript
func start     # Starts local Azure Functions
```

### Testing Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:7071/api/enhance-wish" `
  -Method POST `
  -Body '{"message":"Acho aahyo Parv beta"}' `
  -ContentType "application/json"
```

### Production Deployment
The TypeScript compiles to `dist/` folder for Azure Static Web Apps deployment:
```bash
npm run build  # Creates dist/ with compiled JS
```

## Troubleshooting

### Issue: AI converts Sindhi to Hindi
**Solution**: The prompt now includes:
- Explicit Sindhi markers list
- Forbidden vocabulary (Gujarati/Hindi words)
- Few-shot examples
- Conditional user message based on language detection

### Issue: Wrong vocabulary (Gujarati/Rajasthani)
**Solution**: Added forbidden words list:
- ❌ "Thari" (use "Tuhinjo")
- ❌ "Tho" (use "Tuhinjo")  
- ❌ "aavji" (use "jiwan")

### Issue: Rate limit exceeded
**Solution**: Wait 60 seconds between tests. Consider upgrading to Pay-as-you-go if needed.

## Future Enhancements

1. **Sindhi Arabic Script Support**: Currently only Roman script is supported
2. **Dialect Variations**: Support for different Sindhi dialects
3. **More Marker Words**: Expand detection vocabulary
4. **Language Selection**: Allow manual language override
5. **Cost Optimization**: Cache common enhancements

## Credits
- Event: Baby Parv's Naming Ceremony
- Developed by: Jatin Khilrani
- AI Model: Azure OpenAI GPT-4o-mini
- Languages: English, Hindi, Sindhi (Roman), Rajasthani, Marwadi
