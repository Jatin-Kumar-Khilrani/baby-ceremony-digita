import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface TTSRequest {
  text: string;
  language?: string; // 'en', 'hi', 'sd' (Sindhi)
  voice?: string; // Voice ID
}

export async function textToSpeech(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Text-to-Speech request processed for url "${request.url}"`);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  if (request.method !== "POST") {
    return {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = await request.json() as TTSRequest;

    if (!body.text) {
      return {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required field: text" }),
      };
    }

    // For now, return a client-side TTS response
    // The actual TTS will be done on the client using Web Speech API
    // This keeps it simple and free without needing Azure Cognitive Services

    return {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "Use client-side Web Speech API for TTS",
        text: body.text,
        language: body.language || "en-US",
        // Recommend voices based on language
        recommendedVoice: body.language === "hi" ? "hi-IN" : 
                         body.language === "sd" ? "en-IN" : 
                         "en-US",
      }),
    };
  } catch (error: any) {
    context.error("Error processing TTS request:", error);
    return {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

app.http("text-to-speech", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: textToSpeech,
});
