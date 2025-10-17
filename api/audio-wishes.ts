import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
const audioContainerName = "audio-wishes";

interface AudioUploadRequest {
  wishId: string;
  audioData: string; // Base64 encoded audio
  mimeType: string; // audio/webm, audio/mp3, etc.
  duration: number; // seconds
}

export async function audioWishes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`HTTP function processed request for url "${request.url}"`);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  if (!connectionString) {
    return {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Storage connection string not configured" }),
    };
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const audioContainerClient = blobServiceClient.getContainerClient(audioContainerName);

    // Create audio container if it doesn't exist
    await audioContainerClient.createIfNotExists({
      access: "blob", // Public read access
    });

    if (request.method === "POST") {
      // Upload audio file
      const body = await request.json() as AudioUploadRequest;
      
      if (!body.wishId || !body.audioData || !body.mimeType) {
        return {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing required fields: wishId, audioData, mimeType" }),
        };
      }

      // Determine file extension from MIME type
      const extension = body.mimeType.includes("webm") ? "webm" : 
                       body.mimeType.includes("mp3") ? "mp3" : 
                       body.mimeType.includes("wav") ? "wav" : "webm";

      const blobName = `wish-${body.wishId}-${Date.now()}.${extension}`;
      const blockBlobClient = audioContainerClient.getBlockBlobClient(blobName);

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(body.audioData.split(',')[1] || body.audioData, 'base64');

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (audioBuffer.length > maxSize) {
        return {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Audio file too large. Maximum size is 5MB." }),
        };
      }

      // Upload audio file
      await blockBlobClient.upload(audioBuffer, audioBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: body.mimeType,
        },
      });

      const audioUrl = blockBlobClient.url;

      context.log(`Audio uploaded successfully: ${blobName}`);

      return {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          audioUrl,
          blobName,
          duration: body.duration,
        }),
      };
    }

    if (request.method === "DELETE") {
      // Delete audio file
      const url = new URL(request.url);
      const blobName = url.searchParams.get("blobName");

      if (!blobName) {
        return {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing blobName parameter" }),
        };
      }

      const blockBlobClient = audioContainerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();

      context.log(`Audio deleted: ${blobName}`);

      return {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "Audio deleted successfully" }),
      };
    }

    if (request.method === "GET") {
      // List all audio files (for admin)
      const audioFiles: any[] = [];
      
      for await (const blob of audioContainerClient.listBlobsFlat()) {
        audioFiles.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          url: `${audioContainerClient.url}/${blob.name}`,
        });
      }

      return {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(audioFiles),
      };
    }

    return {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error: any) {
    context.error("Error processing audio request:", error);
    return {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

app.http("audio-wishes", {
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: audioWishes,
});
