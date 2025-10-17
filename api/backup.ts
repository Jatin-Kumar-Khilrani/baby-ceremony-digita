import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
const backupContainerName = "ceremony-data-backups";

async function getContainerClient(container: string): Promise<ContainerClient> {
  if (!connectionString) {
    throw new Error("Azure Storage connection string not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(container);
  
  // Ensure container exists
  await containerClient.createIfNotExists({
    access: "blob"
  });

  return containerClient;
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

export async function backup(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Backup API - Method: ${request.method}, URL: ${request.url}`);

  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return { status: 200, headers };
  }

  // Simple authentication check
  const adminKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_SECRET_KEY || 'your-secret-admin-key-change-this';
  
  if (adminKey !== expectedKey) {
    return {
      status: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized - Invalid admin key" })
    };
  }

  try {
    if (request.method === "POST") {
      // Create a new backup
      const action = request.query.get('action');

      if (action === 'create') {
        // Read current RSVP data
        const containerClient = await getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient("rsvps.json");
        
        let data: any = [];
        try {
          const downloadResponse = await blobClient.download();
          const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
          data = JSON.parse(downloaded.toString());
        } catch (error: any) {
          if (error.statusCode !== 404) {
            throw error;
          }
        }

        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `rsvps-backup-${timestamp}.json`;
        
        const backupContainer = await getContainerClient(backupContainerName);
        const backupBlob = backupContainer.getBlockBlobClient(backupName);
        const content = JSON.stringify(data, null, 2);
        
        await backupBlob.upload(content, content.length, {
          blobHTTPHeaders: {
            blobContentType: "application/json"
          },
          metadata: {
            timestamp: new Date().toISOString(),
            rsvpCount: Array.isArray(data) ? data.length.toString() : '0',
            createdBy: 'manual-backup'
          }
        });

        context.log(`✅ Backup created: ${backupName}`);

        return {
          status: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            backupName,
            timestamp,
            rsvpCount: Array.isArray(data) ? data.length : 0
          })
        };
      } else if (action === 'restore') {
        // Restore from a specific backup
        const body = await request.json() as { backupName: string };
        
        if (!body.backupName) {
          return {
            status: 400,
            headers,
            body: JSON.stringify({ error: "backupName is required" })
          };
        }

        // Read backup
        const backupContainer = await getContainerClient(backupContainerName);
        const backupBlob = backupContainer.getBlobClient(body.backupName);
        
        const downloadResponse = await backupBlob.download();
        const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
        const backupData = downloaded.toString();

        // Restore to main rsvps.json
        const containerClient = await getContainerClient(containerName);
        const mainBlob = containerClient.getBlockBlobClient("rsvps.json");
        
        await mainBlob.upload(backupData, backupData.length, {
          blobHTTPHeaders: {
            blobContentType: "application/json"
          }
        });

        const data = JSON.parse(backupData);
        context.log(`✅ Restored from backup: ${body.backupName}`);

        return {
          status: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            restored: true,
            backupName: body.backupName,
            rsvpCount: Array.isArray(data) ? data.length : 0
          })
        };
      } else if (action === 'delete') {
        // Delete a specific backup
        const body = await request.json() as { backupName: string };
        
        if (!body.backupName) {
          return {
            status: 400,
            headers,
            body: JSON.stringify({ error: "backupName is required" })
          };
        }

        const backupContainer = await getContainerClient(backupContainerName);
        const backupBlob = backupContainer.getBlobClient(body.backupName);
        
        await backupBlob.delete();
        context.log(`🗑️ Deleted backup: ${body.backupName}`);

        return {
          status: 200,
          headers,
          body: JSON.stringify({ success: true, deleted: body.backupName })
        };
      } else {
        return {
          status: 400,
          headers,
          body: JSON.stringify({ error: "Invalid action. Use: create, restore, or delete" })
        };
      }
    } else if (request.method === "GET") {
      // List all backups
      const backupContainer = await getContainerClient(backupContainerName);
      const backups: any[] = [];

      for await (const blob of backupContainer.listBlobsFlat({ includeMetadata: true })) {
        const blobClient = backupContainer.getBlobClient(blob.name);
        const properties = await blobClient.getProperties();
        
        backups.push({
          name: blob.name,
          timestamp: blob.properties.createdOn?.toISOString() || blob.metadata?.timestamp,
          size: blob.properties.contentLength,
          rsvpCount: blob.metadata?.rsvpCount || 'unknown',
          createdBy: blob.metadata?.createdBy || 'unknown'
        });
      }

      // Sort by timestamp descending (newest first)
      backups.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      return {
        status: 200,
        headers,
        body: JSON.stringify(backups)
      };
    } else {
      return {
        status: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }
  } catch (error: any) {
    context.error("Error processing backup request:", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

app.http('backup', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: backup
});
