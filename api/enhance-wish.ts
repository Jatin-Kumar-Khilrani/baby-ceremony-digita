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

    // Get current date in IST
    const currentDateIST = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
- Baby Name: Parv Khilrani (male)
- Birth Date: September 22, 2025 (baby is about 2 months old)
- Event: Naming Ceremony (Naamkaran/Baby Parv) - Bairana Sahib
- Current Date: ${currentDateIST}
- Event Date: November 15, 2025
- Event Time: Evening ceremony (Bairana Sahib 5:30PM then followed by Lunch at 7:30 PM onwards)
- Venue: Chandra Inn, Jodhpur, Rajasthan
- Parents: Jatin Kumar Khilrani & Ginni Kalyani
- Grandparents: Rajendra Kumar Khilrani & Seema Khilrani
- Tone: Warm, heartfelt, celebratory blessing for a newborn baby boy

Use this context to make wishes more relevant and culturally appropriate. You can reference:
- "On this special day of Parv's Bairana Sahib ceremony..."
- "As you celebrate this sacred naming ceremony..."
- "May baby Parv's life be filled with blessings..."
- "Wishing Parv and the entire Khilrani family..."
- "On this auspicious occasion in Jodhpur..."
- "Welcoming this precious 2-month-old into the world..."

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
5. ⭐ PRESERVE THE ORIGINAL SENTIMENT - This is CRITICAL:
   - Identify the core emotion: joy, blessing, prayer, love, congratulations
   - Keep the same emotional intensity
   - Don't change the message meaning
   - If they say "simple congrats" → don't make it overly poetic
   - If they express deep emotion → honor and amplify it
   - Respect any specific wishes (health, happiness, success)
6. MATCH THE USER'S ORIGINAL TONE:
   - If casual/short → Keep it brief and warm
   - If formal/elaborate → Make it more eloquent
   - If emotional/heartfelt → Amplify the emotion
   - If simple/direct → Enhance but keep simplicity
   - If playful/fun → Keep the lighthearted spirit
7. Preserve their personality and voice in the message
8. Keep natural tone - match their style (formal/casual/emotional)
9. Make warm and heartfelt (under 200 words)
10. Add 2-4 contextually appropriate emojis (sparingly, naturally placed)
   - Use baby/child emojis: 👶 
   - Celebration: 🎉 🎊 ✨
   - Blessings: 🙏 💝 ❤️ 
   - Joy: 🌟 🌈 😊
   - Cultural: 🪔 💐 (when appropriate)
   - Place emojis naturally within text, not just at end
11. NO language translation
12. NO script conversion
13. Return ONLY the enhanced wish
14. Use rich, expressive vocabulary - be creative and heartfelt but MATCH their toneSINDHI ROMAN VOCABULARY (Use naturally, mix and match):
COMMON WORDS:
- "Tuhinjo/Tuhinje" (your)
- "jiwan" (life)
- "khushiyon saan" (with happiness)
- "bhariyo/bharyo hove" (may be filled)
- "acho aahyo" (welcome/good arrival)
- "sukh" (happiness/comfort)
- "shanti/aman" (peace)
- "barkat" (blessings/prosperity)
- "mubarak" (congratulations)
- "nanho/nanhi" (little one)
- "sehat" (health)
- "pyaar" (love)
- "dua" (prayer/blessing)

EXPRESSIVE PHRASES (Feel free to use):
- "Rab ji mehr" (God's grace)
- "sadaen khush rahe" (always remain happy)
- "chand sitar jeho" (like moon and stars - very beautiful)
- "roshan jiwan" (bright/prosperous life)
- "sada salamat rahe" (always stay safe)
- "kamyabi milye" (may you get success)
- "lakh lakh wadhayo" (countless congratulations)
- "ghar mein khushiyan aayo" (happiness has come to home)
- "Allah khair kare" (May God do good)
- "tuhinje laal" (your child/beloved)

Be creative and natural - don't force all words, use what fits the sentiment!

EXAMPLES (Notice how we match the user's tone):

Input: "Acho aahyo Parv beta" (Sindhi Roman - simple, warm)
Output: "Acho aahyo, Parv beta! 👶 Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove. Rab tuhinje ghar mein barkat aen pyaar liyae 🙏✨"

Input: "Nanho Parv ne mubarak" (Sindhi Roman - brief, direct)
Output: "Nanho Parv 👶, tuhinje jiwan khushiyon saan bharyo hove! Tuhinjo har din sukh aen shanti saan guzre 🌟💝"

Input: "बेबी पर्व को बधाई" (Hindi - short, casual)
Output: "बेबी पर्व को दिल से बहुत-बहुत बधाई! 👶🎉 आपका जीवन खुशियों से भरा हो और नन्हे पर्व हमेशा स्वस्थ और खुश रहें 🙏✨"

Input: "Congrats baby" (English - very casual/brief)
Output: "Congratulations on baby Parv! 🎉👶 Wishing you all joy and happiness as you celebrate this beautiful naming ceremony ✨💝"

TONE MATCHING PRINCIPLE: Short input → concise enhancement. Long input → elaborate enhancement. Emotional input → amplify emotion. Casual input → keep it warm and friendly.`
        },
        {
          role: "user",
          content: "Acho aahyo Parv beta"
        },
        {
          role: "assistant",
          content: "Acho aahyo, Parv beta! 👶 Tuhinjo jiwan khushiyon aen sukh saan bhariyo hove. Rab tuhinje ghar mein barkat aen pyaar liyae 🙏✨ Nanho Parv hamesha sehat aen khushi saan rahje."
        },
        {
          role: "user",
          content: "बेबी पर्व को बधाई"
        },
        {
          role: "assistant",
          content: "बेबी पर्व को दिल से बहुत-बहुत बधाई! 👶🎉 आपका जीवन खुशियों से भरा हो और नन्हे पर्व हमेशा स्वस्थ और खुश रहें 🙏✨"
        },
        {
          role: "user",
          content: isSindhiRoman
            ? `CRITICAL: This message is in SINDHI language written in ROMAN/LATIN script.

Original message: "${message}"

You MUST enhance this in SINDHI language using ONLY ROMAN/LATIN letters (a-z, A-Z).

PREFERRED Sindhi vocabulary (use naturally):
- Tuhinjo/Tuhinje (your) - preferred over "Thari"
- jiwan (life) - authentic Sindhi word
- khushiyon saan (with happiness) - Sindhi style
- bhariyo hove / bharyo hove (may be filled)
- acho aahyo (good arrival/welcome)
- sukh, shanti, aman (happiness, peace)
- barkat (blessings)
- Rab / Allah (God)
- mubarak (congratulations)
- sehat (health)
- pyaar (love)
- dua (prayer)

ADDITIONAL EXPRESSIVE WORDS:
- "chand sitar jeho" (beautiful like moon and stars)
- "roshan jiwan" (bright life)
- "lakh lakh wadhayo" (countless congratulations)
- "sadaen khush" (always happy)
- "kamyabi" (success)

Use rich, expressive language naturally. Mix formal and warm tones.

OUTPUT FORMAT: Write ONLY in Roman/Latin alphabet. NO Devanagari. NO Arabic script. NO translation to Hindi.

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
