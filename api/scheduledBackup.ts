import { app, InvocationContext, Timer } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
const backupContainerName = "ceremony-data-backups";

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

export async function scheduledBackup(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('⏰ Scheduled backup triggered at:', new Date().toISOString());

  if (!connectionString) {
    context.error("Azure Storage connection string not configured");
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // Get main container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "blob" });
    
    // Get backup container
    const backupContainerClient = blobServiceClient.getContainerClient(backupContainerName);
    await backupContainerClient.createIfNotExists({ access: "blob" });

    // Read current RSVP data
    const blobClient = containerClient.getBlobClient("rsvps.json");
    
    let data: any = [];
    let rsvpCount = 0;
    
    try {
      const downloadResponse = await blobClient.download();
      const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
      data = JSON.parse(downloaded.toString());
      rsvpCount = Array.isArray(data) ? data.length : 0;
    } catch (error: any) {
      if (error.statusCode === 404) {
        context.log('No rsvps.json found - creating backup of empty data');
      } else {
        throw error;
      }
    }

    // Create backup with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const backupName = `rsvps-backup-${dateStr}-${timestamp}.json`;
    
    const backupBlob = backupContainerClient.getBlockBlobClient(backupName);
    const content = JSON.stringify(data, null, 2);
    
    await backupBlob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      },
      metadata: {
        timestamp: now.toISOString(),
        rsvpCount: rsvpCount.toString(),
        createdBy: 'scheduled-backup',
        date: dateStr
      }
    });

    context.log(`✅ Scheduled backup created: ${backupName}`);
    context.log(`📊 Backed up ${rsvpCount} RSVP(s)`);

    // Clean up old backups (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let deletedCount = 0;
    for await (const blob of backupContainerClient.listBlobsFlat({ includeMetadata: true })) {
      // Only delete scheduled backups, not manual ones
      if (blob.metadata?.createdBy === 'scheduled-backup' && blob.properties.createdOn) {
        if (blob.properties.createdOn < thirtyDaysAgo) {
          await backupContainerClient.getBlobClient(blob.name).delete();
          deletedCount++;
          context.log(`🗑️ Deleted old backup: ${blob.name}`);
        }
      }
    }

    if (deletedCount > 0) {
      context.log(`🧹 Cleaned up ${deletedCount} old backup(s)`);
    }

  } catch (error: any) {
    context.error('❌ Scheduled backup failed:', error);
    throw error;
  }
}

// Run every day at 2:00 AM UTC (using NCRONTAB expression)
// Format: {second} {minute} {hour} {day} {month} {day-of-week}
app.timer('scheduledBackup', {
  schedule: '0 0 2 * * *', // Every day at 2:00 AM
  handler: scheduledBackup
});
