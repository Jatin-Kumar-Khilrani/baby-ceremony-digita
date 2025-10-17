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
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  try {
    if (request.method === "GET") {
      const searchEmail = request.query.get('email');
      const data = await getStorageData("rsvps.json");
      // Ensure data is always an array
      const rsvpsArray = Array.isArray(data) ? data : (data ? [data] : []);
      
      // DEBUG LOGGING
      context.log('=== GET REQUEST DEBUG ===');
      context.log('Search email:', searchEmail);
      context.log('Data from storage:', JSON.stringify(data));
      context.log('RSVPs array:', JSON.stringify(rsvpsArray));
      context.log('Array length:', rsvpsArray.length);
      if (rsvpsArray.length > 0) {
        context.log('Emails in storage:', rsvpsArray.map((r: any) => r.email));
      }
      
      // If email query parameter is provided, return only that specific RSVP
      if (searchEmail) {
        context.log('Searching for email:', searchEmail.toLowerCase());
        
        const found = rsvpsArray.find((rsvp: any) => {
          const match = rsvp.email && rsvp.email.toLowerCase() === searchEmail.toLowerCase();
          context.log(`Comparing "${rsvp.email?.toLowerCase()}" === "${searchEmail.toLowerCase()}" = ${match}`);
          return match;
        });
        
        context.log('Found result:', found ? 'YES' : 'NO');
        
        if (found) {
          context.log('Returning 200 with RSVP:', JSON.stringify(found));
          return {
            status: 200,
            headers,
            body: JSON.stringify(found)
          };
        } else {
          context.log('Returning 404 - not found');
          return {
            status: 404,
            headers,
            body: JSON.stringify({ error: "RSVP not found for this email" })
          };
        }
      }
      
      // Otherwise return all RSVPs (for admin)
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
        const rsvpsArray = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
        const existingRsvp = rsvpsArray.find((r: any) => 
          r.email && r.email.toLowerCase() === searchEmail.toLowerCase()
        );
        
        if (existingRsvp) {
          // Generate new PIN each time they search (for security)
          const pin = generatePin();
          existingRsvp.pin = pin;
          existingRsvp.pinSentAt = new Date().toISOString();
          
          context.log(`Found RSVP for ${searchEmail}, sending PIN...`);
          
          // Send PIN via email
          try {
            context.log(`Calling sendPinEmail for ${existingRsvp.email}`);
            const emailSent = await sendPinEmail(
              existingRsvp.email,
              existingRsvp.name,
              pin
            );
            
            if (emailSent) {
              context.log(`✅ PIN email sent successfully to ${existingRsvp.email}`);
              existingRsvp.pinEmailSent = true;
            } else {
              context.log(`❌ Failed to send PIN email to ${existingRsvp.email}`);
              existingRsvp.pinEmailSent = false;
            }
          } catch (emailError: any) {
            context.log(`❌ Error sending PIN email to ${existingRsvp.email}:`, emailError);
            context.log('Email error details:', {
              message: emailError.message,
              code: emailError.code,
              stack: emailError.stack
            });
            existingRsvp.pinEmailSent = false;
          }
          
          // CRITICAL FIX: Save the entire array, not just the single RSVP
          await saveStorageData("rsvps.json", rsvpsArray);
          
          return {
            status: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              found: true,
              message: existingRsvp.pinEmailSent ? 'PIN sent to your email' : 'RSVP found but email failed to send',
              emailSent: existingRsvp.pinEmailSent
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
        
        // CRITICAL FIX: Validate that the array is not empty (unless intentionally deleting all)
        // Get existing data to compare
        const existingData = await getStorageData("rsvps.json");
        const existingRsvpsArray = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
        
        // If we have existing RSVPs and the new array is empty or significantly smaller, log a warning
        if (existingRsvpsArray.length > 0) {
          if (body.length === 0) {
            context.log('⚠️ WARNING: Attempting to replace all RSVPs with empty array');
            context.log('Existing RSVPs count:', existingRsvpsArray.length);
            context.log('This will DELETE all RSVPs!');
          } else if (body.length < existingRsvpsArray.length * 0.5) {
            // If new array is less than 50% of old array, log warning but allow (could be legitimate deletions)
            context.log('⚠️ WARNING: Significant reduction in RSVP count');
            context.log('Previous count:', existingRsvpsArray.length);
            context.log('New count:', body.length);
            context.log('Reduction:', existingRsvpsArray.length - body.length);
          }
        }
        
        // Replace entire array
        await saveStorageData("rsvps.json", body);
        
        context.log('✅ RSVPs replaced successfully');
        context.log('Final count:', body.length);
        
        return {
          status: 200,
          headers,
          body: JSON.stringify({ success: true, count: body.length })
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
