"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.photos = photos;
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-photos";
const dataContainerName = "ceremony-data";
async function getPhotoMetadata() {
    if (!connectionString)
        return [];
    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(dataContainerName);
    const blobClient = containerClient.getBlobClient("photos-metadata.json");
    try {
        const downloadResponse = await blobClient.download();
        const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
        return JSON.parse(downloaded.toString());
    }
    catch (error) {
        if (error.statusCode === 404) {
            return [];
        }
        throw error;
    }
}
async function savePhotoMetadata(metadata) {
    if (!connectionString)
        throw new Error("Storage not configured");
    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(dataContainerName);
    await containerClient.createIfNotExists({ access: "blob" });
    const blobClient = containerClient.getBlockBlobClient("photos-metadata.json");
    const content = JSON.stringify(metadata, null, 2);
    await blobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: "application/json" }
    });
}
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
async function photos(request, context) {
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
    if (!connectionString) {
        return {
            status: 500,
            headers,
            body: JSON.stringify({ error: "Azure Storage not configured" })
        };
    }
    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    try {
        if (request.method === "GET") {
            // Try to get metadata first
            let metadata = await getPhotoMetadata();
            // If no metadata exists, fall back to listing blobs directly
            if (metadata.length === 0) {
                await containerClient.createIfNotExists({ access: "blob" });
                for await (const blob of containerClient.listBlobsFlat()) {
                    const blobClient = containerClient.getBlobClient(blob.name);
                    metadata.push({
                        id: blob.name,
                        url: blobClient.url,
                        name: blob.name.split('-').slice(1).join('-').replace('.jpg', ''),
                        caption: '',
                        timestamp: blob.properties.createdOn?.getTime() || Date.now()
                    });
                }
                // Save metadata for future use
                if (metadata.length > 0) {
                    await savePhotoMetadata(metadata);
                }
            }
            return {
                status: 200,
                headers,
                body: JSON.stringify(metadata)
            };
        }
        else if (request.method === "POST") {
            const body = await request.json();
            // Check if this is a replace operation (for admin delete)
            const url = new URL(request.url);
            const action = url.searchParams.get('action');
            if (action === 'replace') {
                // Admin operation: replace entire metadata array
                // First, get the current metadata to find deleted items
                const currentMetadata = await getPhotoMetadata();
                const newMetadata = body;
                // Find photos that were deleted (in current but not in new)
                const newIds = new Set(newMetadata.map((p) => p.id));
                const deletedPhotos = currentMetadata.filter((p) => !newIds.has(p.id));
                // Delete the actual blob files for deleted photos
                for (const photo of deletedPhotos) {
                    try {
                        const blobClient = containerClient.getBlobClient(photo.id);
                        await blobClient.deleteIfExists();
                        context.log(`Deleted blob: ${photo.id}`);
                    }
                    catch (error) {
                        context.warn(`Failed to delete blob ${photo.id}:`, error);
                    }
                }
                // Save the new metadata
                await savePhotoMetadata(newMetadata);
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Photos updated successfully', deleted: deletedPhotos.length })
                };
            }
            // Upload new photo
            const { name, url: imageUrl, caption } = body;
            if (!name || !imageUrl) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: "name and url (base64 image data) required" })
                };
            }
            await containerClient.createIfNotExists({
                access: "blob"
            });
            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `${timestamp}-${name.replace(/\s+/g, '-')}.jpg`;
            // Convert base64 to buffer
            const base64Data = imageUrl.includes(',') ? imageUrl.split(',')[1] : imageUrl;
            const buffer = Buffer.from(base64Data, 'base64');
            const blobClient = containerClient.getBlockBlobClient(fileName);
            await blobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: {
                    blobContentType: 'image/jpeg'
                }
            });
            // Create photo metadata
            const newPhoto = {
                id: fileName,
                name: name,
                url: blobClient.url,
                caption: caption || '',
                timestamp: timestamp
            };
            // Add to metadata
            const metadata = await getPhotoMetadata();
            metadata.push(newPhoto);
            await savePhotoMetadata(metadata);
            return {
                status: 200,
                headers,
                body: JSON.stringify(newPhoto)
            };
        }
        else {
            return {
                status: 405,
                headers,
                body: JSON.stringify({ error: "Method not allowed" })
            };
        }
    }
    catch (error) {
        context.error("Error processing request:", error);
        return {
            status: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}
functions_1.app.http('photos', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: photos
});
//# sourceMappingURL=photos.js.map