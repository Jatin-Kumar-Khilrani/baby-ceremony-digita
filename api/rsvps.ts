import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { generatePin, sendPinEmail } from "./src/emailService";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";

async function getStorageData(blobName: string): Promise<any> {
  if (!connectionString) {
    throw new Error("Azure Storage connection string not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists
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

export async function rsvps(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  try {
    if (request.method === "GET") {
      const data = await getStorageData("rsvps.json");
      // Ensure data is always an array
      const rsvpsArray = Array.isArray(data) ? data : (data ? [data] : []);
      return {
        status: 200,
        headers,
        body: JSON.stringify(rsvpsArray)
      };
    } else if (request.method === "POST") {
      // Check if this is a "search" request (finding existing RSVP to send PIN)
      const isSearchRequest = request.query.get('action') === 'search';
      const isReplaceRequest = request.query.get('action') === 'replace';
      const searchEmail = request.query.get('email');
      
      // Parse body only if not a search request
      let body: any = null;
      if (!isSearchRequest) {
        try {
          body = await request.json();
        } catch (e) {
          return {
            status: 400,
            headers,
            body: JSON.stringify({ error: "Invalid JSON in request body" })
          };
        }
      }
      
      if (isSearchRequest && searchEmail) {
        // User is searching for their RSVP - send PIN if found
        const existingData = await getStorageData("rsvps.json");
        const existingRsvp = existingData.find((r: any) => 
          r.email && r.email.toLowerCase() === searchEmail.toLowerCase()
        );
        
        if (existingRsvp) {
          // Generate new PIN each time they search (for security)
          const pin = generatePin();
          existingRsvp.pin = pin;
          existingRsvp.pinSentAt = new Date().toISOString();
          
          // Send PIN via email
          try {
            const emailSent = await sendPinEmail(
              existingRsvp.email,
              existingRsvp.name,
              pin
            );
            
            if (emailSent) {
              context.log(`PIN email sent to ${existingRsvp.email} for RSVP search`);
              existingRsvp.pinEmailSent = true;
            } else {
              context.log(`Failed to send PIN email to ${existingRsvp.email}`);
              existingRsvp.pinEmailSent = false;
            }
          } catch (emailError) {
            context.log(`Error sending PIN email to ${existingRsvp.email}: ${emailError}`);
            existingRsvp.pinEmailSent = false;
          }
          
          // Save updated data with new PIN
          await saveStorageData("rsvps.json", existingData);
          
          return {
            status: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              found: true,
              message: 'PIN sent to your email'
            })
          };
        } else {
          return {
            status: 404,
            headers,
            body: JSON.stringify({ 
              success: false, 
              found: false,
              message: 'No RSVP found with that email'
            })
          };
        }
      }
      
      // Check if this is a replace request (delete/edit - replace entire array)
      if (isReplaceRequest) {
        if (!body || !Array.isArray(body)) {
          return {
            status: 400,
            headers,
            body: JSON.stringify({ error: "Replace action requires an array of RSVPs" })
          };
        }
        
        // Replace entire array
        await saveStorageData("rsvps.json", body);
        return {
          status: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }
      
      // Normal RSVP submission - DO NOT send PIN
      // Users will request PIN when they want to edit/delete
      if (!body) {
        return {
          status: 400,
          headers,
          body: JSON.stringify({ error: "Request body is required for RSVP submission" })
        };
      }
      
      // Get existing RSVPs and add the new one
      const existingData = await getStorageData("rsvps.json");
      const rsvpsArray = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
      rsvpsArray.push(body);
      
      await saveStorageData("rsvps.json", rsvpsArray);
      return {
        status: 200,
        headers,
        body: JSON.stringify({ success: true })
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

app.http('rsvps', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: rsvps
});
