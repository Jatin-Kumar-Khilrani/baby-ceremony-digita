import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";

async function getStorageData(blobName: string): Promise<any> {
  if (!connectionString) {
    throw new Error("Azure Storage connection string not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  await containerClient.createIfNotExists({
    access: "blob"
  });

  const blobClient = containerClient.getBlobClient(blobName);
  
  try {
    const downloadResponse = await blobClient.download();
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    return JSON.parse(downloaded.toString());
  } catch (error: any) {
    if (error.statusCode === 404) {
      return [];
    }
    throw error;
  }
}

async function saveStorageData(blobName: string, data: any): Promise<void> {
  if (!connectionString) {
    throw new Error("Azure Storage connection string not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  await containerClient.createIfNotExists({
    access: "blob"
  });

  const blobClient = containerClient.getBlockBlobClient(blobName);
  const content = JSON.stringify(data, null, 2);
  
  await blobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobContentType: "application/json"
    }
  });
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

export async function wishes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  try {
    if (request.method === "GET") {
      const data = await getStorageData("wishes.json");
      // Ensure we always return an array
      const wishesArray = Array.isArray(data) ? data : (data ? [data] : []);
      return {
        status: 200,
        headers,
        body: JSON.stringify(wishesArray)
      };
    } else if (request.method === "POST") {
      const body = await request.json() as any;
      
      // Check if this is a replace operation (for admin delete/update)
      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      
      if (action === 'replace') {
        // Admin operation: replace entire array
        await saveStorageData("wishes.json", body);
        return {
          status: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Wishes updated successfully' })
        };
      }
      
      // Get existing wishes
      const existingWishes = await getStorageData("wishes.json");
      const wishesArray = Array.isArray(existingWishes) ? existingWishes : [];
      
      // Validate required fields
      if (!body.name || !body.message) {
        return {
          status: 400,
          headers,
          body: JSON.stringify({ error: "Name and message are required" })
        };
      }

      // Check if email is provided and if they already submitted a wish
      if (body.email) {
        const normalizedEmail = body.email.toLowerCase().trim();
        const existingWish = wishesArray.find(
          (wish: any) => wish.email && wish.email.toLowerCase().trim() === normalizedEmail
        );
        
        if (existingWish) {
          return {
            status: 409,
            headers,
            body: JSON.stringify({ 
              error: "You have already submitted a wish. Only one wish per person is allowed.",
              existing: existingWish
            })
          };
        }
      }
      
      // Create new wish with ID and timestamp
      const newWish = {
        id: Date.now().toString(),
        name: body.name,
        message: body.message || null,
        email: body.email || null,
        gender: body.gender || undefined, // Gender for voice selection
        defaultGender: body.defaultGender || undefined, // Admin override for auto-detection
        audioUrl: body.audioUrl || null, // Audio recording URL
        audioDuration: body.audioDuration || null, // Duration in seconds
        hasAudio: !!body.audioUrl, // Boolean flag
        approved: false, // Requires admin approval
        moderatedBy: null,
        moderatedAt: null,
        rejectionReason: null,
        timestamp: Date.now()
      };
      
      // Append to array
      wishesArray.push(newWish);
      
      // Save back
      await saveStorageData("wishes.json", wishesArray);
      
      return {
        status: 200,
        headers,
        body: JSON.stringify(newWish)
      };
    } else {
      return {
        status: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }
  } catch (error: any) {
    context.error("Error processing request:", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

app.http('wishes', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wishes
});
