import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";

export async function enhanceWish(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Enhance wish request for url "${request.url}"`);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  try {
    if (!endpoint || !apiKey) {
      return {
        status: 500,
        headers,
        body: JSON.stringify({ error: "Azure OpenAI not configured" })
      };
    }

    const body = await request.json() as any;
    const { message } = body;

    if (!message || message.trim().length < 5) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ error: "Message must be at least 5 characters" })
      };
    }

    if (message.length > 500) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ error: "Message too long (max 500 characters)" })
      };
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: "2024-08-01-preview",
    });

    const isSindhiRoman = message.toLowerCase().includes('acho') || 
                          message.toLowerCase().includes('aahyo') || 
                          message.toLowerCase().includes('tuhinjo') || 
                          message.toLowerCase().includes('tuhinje') ||
                          message.toLowerCase().includes('saan') || 
                          message.toLowerCase().includes('hove');

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that enhances baby blessing wishes for baby Parv's naming ceremony.

📅 EVENT CONTEXT:
- Baby Name: Parv (male)
- Event: Naming Ceremony (Naamkaran/Baby Parv)
- Current Date: October 12, 2025
- Event Date: October 13, 2025 (tomorrow!)
- Parents: Jatin & Jigna Khilrani
- Location: Ceremony celebration
- Tone: Warm, heartfelt, celebratory blessing for a newborn baby boy

Use this context to make wishes more relevant and timely. You can reference:
- "On this special day of Parv's naming ceremony..."
- "As you celebrate Parv tomorrow..."
- "Wishing Parv and your family..."
- "May baby Parv be blessed with..."

⚠️ CRITICAL SINDHI DETECTION RULES (CHECK FIRST):
If the input contains ANY of these Sindhi words/phrases in Roman script, it is SINDHI language:
- "Acho" or "acho" (good/welcome)
- "aahyo" or "Aahyo" (has come)
- "Tuhinjo" or "tuhinjo" (your)
- "Tuhinje" or "tuhinje" (your)
- "jiwan" (life - Sindhi specific)
- "khushiyon" with "saan" (with happiness)
- "hove" (be/may it be)
- "nanho" or "Nanho" + "ne" (to the little one)
- "Parv ne" or "parv ne" (to Parv - Sindhi style)

🚫 DO NOT CONFUSE WITH HINDI:
- Hindi never uses: "Tuhinjo", "saan", "hove", "aahyo", "Acho"
- Hindi uses: "तुम्हारा" (not "Tuhinjo"), "के साथ" (not "saan"), "हो" (not "hove")
- If you see ANY Sindhi marker above, OUTPUT MUST BE IN SINDHI ROMAN SCRIPT

SUPPORTED LANGUAGES:
- English (Roman script)
- Hindi (हिंदी in Devanagari script)
- Marwadi (मारवाड़ी in Devanagari script)
- Rajasthani (राजस्थानी in Devanagari OR Roman with "nai", "ghani", "ram ram")
- Sindhi (سنڌي in Arabic script OR Roman with markers above)

YOUR TASK:
1. CHECK FOR SINDHI MARKERS FIRST (see list above)
2. If Sindhi detected → MUST respond in Sindhi Roman (never convert to Hindi/Devanagari)
3. Enhance in THE EXACT SAME LANGUAGE and SCRIPT as input
4. Fix grammar and spelling in that language
5. Make warm and heartfelt (under 200 words)
6. Preserve original sentiment
7. Keep natural tone (not overly formal)
8. NO emojis
9. NO language translation
10. NO script conversion
11. Return ONLY the enhanced wish

SINDHI ROMAN VOCABULARY TO USE:
- "Tuhinjo jiwan" (your life)
- "khushiyon saan bhariyo hove" (may be filled with happiness)
- "acho aahyo" (welcome/good arrival)
- "sukh-shanti saan" (with peace and happiness)
- "mubarak" (congratulations)
- "nanho Parv" (little Parv)

EXAMPLES:
Input: "Acho aahyo Parv beta" (Sindhi Roman - has "Acho aahyo" marker)
Output: "Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove. Rab tuhinje ghar mein barkat aen pyaar liyae..."

Input: "Nanho Parv ne mubarak" (Sindhi Roman - has "Nanho...ne" marker)
Output: "Nanho Parv, tuhinje jiwan khushiyon saan bharyo hove! Tuhinjo har din sukh aen shanti saan..."

Input: "बेबी पर्व को बधाई" (Hindi Devanagari)
Output: "बेबी पर्व को दिल से बहुत-बहुत बधाई! आपका जीवन खुशियों से..."

Input: "Congrats baby" (English)
Output: "Congratulations on baby Parv! Wishing you all joy and happiness..."`
        },
        {
          role: "user",
          content: "Acho aahyo Parv beta"
        },
        {
          role: "assistant",
          content: "Acho aahyo, Parv beta! Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove. Rab tuhinje ghar mein barkat aen pyaar liyae. Nanho Parv hamesha sehat aen khushi saan rahje."
        },
        {
          role: "user",
          content: "बेबी पर्व को बधाई"
        },
        {
          role: "assistant",
          content: "बेबी पर्व को दिल से बहुत-बहुत बधाई! आपका जीवन खुशियों से भरा हो और नन्हे पर्व हमेशा स्वस्थ और खुश रहें।"
        },
        {
          role: "user",
          content: isSindhiRoman
            ? `CRITICAL: This message is in SINDHI language written in ROMAN/LATIN script.

Original message: "${message}"

You MUST enhance this in SINDHI language using ONLY ROMAN/LATIN letters (a-z, A-Z).

MANDATORY Sindhi vocabulary to use:
- Tuhinjo/Tuhinje (your) - NOT "Thari" or "Tumhara"
- jiwan (life) - NOT "zindagi" or "jivan"
- khushiyon saan (with happiness) - NOT "ke saath"
- bhariyo hove / bharyo hove (may be filled) - NOT "bharo"
- acho aahyo (good arrival/welcome)
- sukh (happiness)
- shanti / aman (peace)
- barkat (blessings)
- Rab / Allah (God)
- mubarak (congratulations)
- sehat (health)
- pyaar (love)
- dua (prayer/blessing)

FORBIDDEN words (these are Gujarati/Rajasthani, NOT Sindhi):
- "Thari" (use "Tuhinjo" instead)
- "Tho" (use "Tuhinjo" instead)
- "aavji" (use "jiwan" instead)

OUTPUT FORMAT: Write ONLY in Roman/Latin alphabet. NO Devanagari (हिंदी). NO Arabic script. NO translation to Hindi.

Enhanced wish:`
            : `Please enhance this wish for baby Parv. Keep it in the same language and script as the input: "${message}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
      top_p: 0.9,
    });

    const enhancedWish = response.choices[0].message.content?.trim();

    if (!enhancedWish) {
      throw new Error("No response from AI");
    }

    context.log(`Tokens used: ${response.usage?.total_tokens || 0}`);

    return {
      status: 200,
      headers,
      body: JSON.stringify({
        original: message,
        enhanced: enhancedWish,
        tokensUsed: response.usage?.total_tokens || 0
      })
    };
  } catch (error: any) {
    context.error("Error enhancing wish:", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to enhance wish. Please try again.",
        details: error.message 
      })
    };
  }
}

app.http('enhance-wish', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: enhanceWish
});
