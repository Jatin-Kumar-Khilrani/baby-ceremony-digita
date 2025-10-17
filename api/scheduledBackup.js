"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledBackup = scheduledBackup;
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
const backupContainerName = "ceremony-data-backups";
// Data types to backup
const DATA_TYPES = {
    rsvps: 'rsvps.json',
    wishes: 'wishes.json',
    photos: 'photos-metadata.json'
};
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}
async function scheduledBackup(myTimer, context) {
    context.log('⏰ Scheduled backup triggered at:', new Date().toISOString());
    if (!connectionString) {
        context.error("Azure Storage connection string not configured");
        return;
    }
    try {
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        // Get main container
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: "blob" });
        // Get backup container
        const backupContainerClient = blobServiceClient.getContainerClient(backupContainerName);
        await backupContainerClient.createIfNotExists({ access: "blob" });
        // Create backup timestamp (same for all data types)
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const backupResults = [];
        let totalItems = 0;
        // Backup each data type
        for (const [dataType, fileName] of Object.entries(DATA_TYPES)) {
            try {
                const blobClient = containerClient.getBlobClient(fileName);
                let data = [];
                let itemCount = 0;
                try {
                    const downloadResponse = await blobClient.download();
                    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                    data = JSON.parse(downloaded.toString());
                    itemCount = Array.isArray(data) ? data.length : 0;
                }
                catch (error) {
                    if (error.statusCode === 404) {
                        context.log(`No ${fileName} found - creating backup of empty data`);
                    }
                    else {
                        throw error;
                    }
                }
                // Create backup
                const backupName = `${dataType}-backup-${timestamp}.json`;
                const backupBlob = backupContainerClient.getBlockBlobClient(backupName);
                const content = JSON.stringify(data, null, 2);
                await backupBlob.upload(content, content.length, {
                    blobHTTPHeaders: {
                        blobContentType: "application/json"
                    },
                    metadata: {
                        timestamp: now.toISOString(),
                        dataType: dataType,
                        itemCount: itemCount.toString(),
                        createdBy: 'scheduled-backup',
                        date: dateStr,
                        backupGroup: timestamp
                    }
                });
                backupResults.push({ dataType, backupName, itemCount });
                totalItems += itemCount;
                context.log(`✅ Backed up ${dataType}: ${backupName} (${itemCount} items)`);
            }
            catch (error) {
                context.error(`❌ Failed to backup ${dataType}:`, error);
                backupResults.push({ dataType, error: error.message });
            }
        }
        context.log(`📊 Total items backed up: ${totalItems}`);
        context.log(`📦 Backup files created: ${backupResults.filter(r => !r.error).length}`);
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
    }
    catch (error) {
        context.error('❌ Scheduled backup failed:', error);
        throw error;
    }
}
// Run every day at 2:00 AM UTC (using NCRONTAB expression)
// Format: {second} {minute} {hour} {day} {month} {day-of-week}
functions_1.app.timer('scheduledBackup', {
    schedule: '0 0 2 * * *', // Every day at 2:00 AM
    handler: scheduledBackup
});
//# sourceMappingURL=scheduledBackup.js.map