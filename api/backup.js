"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backup = backup;
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
async function getContainerClient(container) {
    if (!connectionString) {
        throw new Error("Azure Storage connection string not configured");
    }
    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);
    // Ensure container exists
    await containerClient.createIfNotExists({
        access: "blob"
    });
    return containerClient;
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
async function backup(request, context) {
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
                // Create backups for all data types
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const results = {
                    timestamp,
                    backups: []
                };
                const containerClient = await getContainerClient(containerName);
                // Backup each data type
                for (const [dataType, fileName] of Object.entries(DATA_TYPES)) {
                    try {
                        const blobClient = containerClient.getBlobClient(fileName);
                        let data = [];
                        try {
                            const downloadResponse = await blobClient.download();
                            const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                            data = JSON.parse(downloaded.toString());
                        }
                        catch (error) {
                            if (error.statusCode !== 404) {
                                throw error;
                            }
                            // File doesn't exist yet, use empty array
                            data = [];
                        }
                        // Create backup with timestamp
                        const backupName = `${dataType}-backup-${timestamp}.json`;
                        const backupContainer = await getContainerClient(backupContainerName);
                        const backupBlob = backupContainer.getBlockBlobClient(backupName);
                        const content = JSON.stringify(data, null, 2);
                        await backupBlob.upload(content, content.length, {
                            blobHTTPHeaders: {
                                blobContentType: "application/json"
                            },
                            metadata: {
                                timestamp: new Date().toISOString(),
                                dataType: dataType,
                                itemCount: Array.isArray(data) ? data.length.toString() : '0',
                                createdBy: 'manual-backup',
                                backupGroup: timestamp
                            }
                        });
                        results.backups.push({
                            dataType,
                            backupName,
                            itemCount: Array.isArray(data) ? data.length : 0
                        });
                        context.log(`✅ Backup created: ${backupName} (${Array.isArray(data) ? data.length : 0} items)`);
                    }
                    catch (error) {
                        context.error(`Failed to backup ${dataType}:`, error);
                        results.backups.push({
                            dataType,
                            error: error.message
                        });
                    }
                }
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        ...results
                    })
                };
            }
            else if (action === 'restore') {
                // Restore from specific backup(s)
                const body = await request.json();
                if (!body.backupName && !body.backupGroup) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({ error: "backupName or backupGroup is required" })
                    };
                }
                const results = {
                    restored: []
                };
                const backupContainer = await getContainerClient(backupContainerName);
                const containerClient = await getContainerClient(containerName);
                // If restoring a complete backup group
                if (body.backupGroup) {
                    const dataTypesToRestore = body.dataTypes || Object.keys(DATA_TYPES);
                    for (const dataType of dataTypesToRestore) {
                        const backupName = `${dataType}-backup-${body.backupGroup}.json`;
                        try {
                            // Read backup
                            const backupBlob = backupContainer.getBlobClient(backupName);
                            const downloadResponse = await backupBlob.download();
                            const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                            const backupData = downloaded.toString();
                            // Restore to main file
                            const fileName = DATA_TYPES[dataType];
                            const mainBlob = containerClient.getBlockBlobClient(fileName);
                            await mainBlob.upload(backupData, backupData.length, {
                                blobHTTPHeaders: {
                                    blobContentType: "application/json"
                                }
                            });
                            const data = JSON.parse(backupData);
                            results.restored.push({
                                dataType,
                                backupName,
                                itemCount: Array.isArray(data) ? data.length : 0
                            });
                            context.log(`✅ Restored ${dataType} from: ${backupName}`);
                        }
                        catch (error) {
                            context.error(`Failed to restore ${dataType}:`, error);
                            results.restored.push({
                                dataType,
                                error: error.message
                            });
                        }
                    }
                }
                // If restoring a single backup file
                else if (body.backupName) {
                    try {
                        // Determine data type from filename
                        const dataType = body.backupName.split('-backup-')[0];
                        if (!DATA_TYPES[dataType]) {
                            return {
                                status: 400,
                                headers,
                                body: JSON.stringify({ error: "Invalid backup file name" })
                            };
                        }
                        // Read backup
                        const backupBlob = backupContainer.getBlobClient(body.backupName);
                        const downloadResponse = await backupBlob.download();
                        const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                        const backupData = downloaded.toString();
                        // Restore to main file
                        const fileName = DATA_TYPES[dataType];
                        const mainBlob = containerClient.getBlockBlobClient(fileName);
                        await mainBlob.upload(backupData, backupData.length, {
                            blobHTTPHeaders: {
                                blobContentType: "application/json"
                            }
                        });
                        const data = JSON.parse(backupData);
                        results.restored.push({
                            dataType,
                            backupName: body.backupName,
                            itemCount: Array.isArray(data) ? data.length : 0
                        });
                        context.log(`✅ Restored ${dataType} from: ${body.backupName}`);
                    }
                    catch (error) {
                        return {
                            status: 500,
                            headers,
                            body: JSON.stringify({ error: error.message })
                        };
                    }
                }
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        ...results
                    })
                };
            }
            else if (action === 'delete') {
                // Delete backup(s)
                const body = await request.json();
                if (!body.backupName && !body.backupGroup) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({ error: "backupName or backupGroup is required" })
                    };
                }
                const backupContainer = await getContainerClient(backupContainerName);
                const deleted = [];
                // Delete entire backup group
                if (body.backupGroup) {
                    for (const dataType of Object.keys(DATA_TYPES)) {
                        const backupName = `${dataType}-backup-${body.backupGroup}.json`;
                        try {
                            const backupBlob = backupContainer.getBlobClient(backupName);
                            await backupBlob.delete();
                            deleted.push(backupName);
                            context.log(`🗑️ Deleted backup: ${backupName}`);
                        }
                        catch (error) {
                            if (error.statusCode !== 404) {
                                context.error(`Failed to delete ${backupName}:`, error);
                            }
                        }
                    }
                }
                // Delete single backup
                else if (body.backupName) {
                    const backupBlob = backupContainer.getBlobClient(body.backupName);
                    await backupBlob.delete();
                    deleted.push(body.backupName);
                    context.log(`🗑️ Deleted backup: ${body.backupName}`);
                }
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ success: true, deleted })
                };
            }
            else if (action === 'download') {
                // Download a specific backup file or group
                const backupName = request.query.get('backupName');
                const backupGroup = request.query.get('backupGroup');
                const dataType = request.query.get('dataType');
                if (!backupName && !backupGroup) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({ error: "backupName or backupGroup is required" })
                    };
                }
                const backupContainer = await getContainerClient(backupContainerName);
                // Download a single backup file
                if (backupName) {
                    const backupBlob = backupContainer.getBlobClient(backupName);
                    const downloadResponse = await backupBlob.download();
                    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="${backupName}"`
                        },
                        body: downloaded.toString()
                    };
                }
                // Download specific data type from a backup group
                else if (backupGroup && dataType) {
                    const fileName = `${dataType}-backup-${backupGroup}.json`;
                    const backupBlob = backupContainer.getBlobClient(fileName);
                    const downloadResponse = await backupBlob.download();
                    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="${fileName}"`
                        },
                        body: downloaded.toString()
                    };
                }
                // Download all files from a backup group as combined JSON
                else if (backupGroup) {
                    const combinedData = {
                        backupGroup,
                        timestamp: new Date().toISOString(),
                        data: {}
                    };
                    for (const [dataTypeName, fileName] of Object.entries(DATA_TYPES)) {
                        const backupFileName = `${dataTypeName}-backup-${backupGroup}.json`;
                        try {
                            const backupBlob = backupContainer.getBlobClient(backupFileName);
                            const downloadResponse = await backupBlob.download();
                            const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                            combinedData.data[dataTypeName] = JSON.parse(downloaded.toString());
                        }
                        catch (error) {
                            if (error.statusCode !== 404) {
                                context.error(`Failed to download ${backupFileName}:`, error);
                            }
                            combinedData.data[dataTypeName] = [];
                        }
                    }
                    const content = JSON.stringify(combinedData, null, 2);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="backup-${backupGroup}.json"`
                        },
                        body: content
                    };
                }
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: "Invalid download parameters" })
                };
            }
            else {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: "Invalid action. Use: create, restore, delete, or download" })
                };
            }
        }
        else if (request.method === "GET") {
            const action = request.query.get('action');
            // Handle download action
            if (action === 'download') {
                const backupName = request.query.get('backupName');
                const backupGroup = request.query.get('backupGroup');
                const dataType = request.query.get('dataType');
                if (!backupName && !backupGroup) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({ error: "backupName or backupGroup is required" })
                    };
                }
                const backupContainer = await getContainerClient(backupContainerName);
                // Download a single backup file
                if (backupName) {
                    const backupBlob = backupContainer.getBlobClient(backupName);
                    const downloadResponse = await backupBlob.download();
                    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="${backupName}"`
                        },
                        body: downloaded.toString()
                    };
                }
                // Download specific data type from a backup group
                else if (backupGroup && dataType) {
                    const fileName = `${dataType}-backup-${backupGroup}.json`;
                    const backupBlob = backupContainer.getBlobClient(fileName);
                    const downloadResponse = await backupBlob.download();
                    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="${fileName}"`
                        },
                        body: downloaded.toString()
                    };
                }
                // Download all files from a backup group as combined JSON
                else if (backupGroup) {
                    const combinedData = {
                        backupGroup,
                        timestamp: new Date().toISOString(),
                        data: {}
                    };
                    for (const [dataTypeName, fileName] of Object.entries(DATA_TYPES)) {
                        const backupFileName = `${dataTypeName}-backup-${backupGroup}.json`;
                        try {
                            const backupBlob = backupContainer.getBlobClient(backupFileName);
                            const downloadResponse = await backupBlob.download();
                            const downloaded = await streamToBuffer(downloadResponse.readableStreamBody);
                            combinedData.data[dataTypeName] = JSON.parse(downloaded.toString());
                        }
                        catch (error) {
                            if (error.statusCode !== 404) {
                                context.error(`Failed to download ${backupFileName}:`, error);
                            }
                            combinedData.data[dataTypeName] = [];
                        }
                    }
                    const content = JSON.stringify(combinedData, null, 2);
                    return {
                        status: 200,
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="backup-${backupGroup}.json"`
                        },
                        body: content
                    };
                }
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: "Invalid download parameters" })
                };
            }
            // List all backups, grouped by timestamp
            const backupContainer = await getContainerClient(backupContainerName);
            const backupGroups = new Map();
            for await (const blob of backupContainer.listBlobsFlat({ includeMetadata: true })) {
                const backupGroup = blob.metadata?.backupGroup || blob.name.split('-backup-')[1]?.replace('.json', '');
                const dataType = blob.metadata?.dataType || blob.name.split('-backup-')[0];
                if (!backupGroup)
                    continue;
                if (!backupGroups.has(backupGroup)) {
                    backupGroups.set(backupGroup, {
                        backupGroup,
                        timestamp: blob.properties.createdOn?.toISOString() || blob.metadata?.timestamp,
                        createdBy: blob.metadata?.createdBy || 'unknown',
                        files: []
                    });
                }
                const group = backupGroups.get(backupGroup);
                group.files.push({
                    dataType,
                    name: blob.name,
                    size: blob.properties.contentLength,
                    itemCount: blob.metadata?.itemCount || 'unknown'
                });
            }
            // Convert to array and sort by timestamp descending (newest first)
            const backups = Array.from(backupGroups.values()).sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
            });
            // Calculate totals for each backup group
            backups.forEach(backup => {
                backup.totalItems = backup.files.reduce((sum, file) => {
                    const count = parseInt(file.itemCount);
                    return sum + (isNaN(count) ? 0 : count);
                }, 0);
                backup.rsvps = backup.files.find((f) => f.dataType === 'rsvps')?.itemCount || 0;
                backup.wishes = backup.files.find((f) => f.dataType === 'wishes')?.itemCount || 0;
                backup.photos = backup.files.find((f) => f.dataType === 'photos')?.itemCount || 0;
            });
            return {
                status: 200,
                headers,
                body: JSON.stringify(backups)
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
        context.error("Error processing backup request:", error);
        return {
            status: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}
functions_1.app.http('backup', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: backup
});
//# sourceMappingURL=backup.js.map