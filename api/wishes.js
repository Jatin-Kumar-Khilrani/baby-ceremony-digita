"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishes = wishes;
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
function getStorageData(blobName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectionString) {
            throw new Error("Azure Storage connection string not configured");
        }
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        yield containerClient.createIfNotExists({
            access: "blob"
        });
        const blobClient = containerClient.getBlobClient(blobName);
        try {
            const downloadResponse = yield blobClient.download();
            const downloaded = yield streamToBuffer(downloadResponse.readableStreamBody);
            return JSON.parse(downloaded.toString());
        }
        catch (error) {
            if (error.statusCode === 404) {
                return [];
            }
            throw error;
        }
    });
}
function saveStorageData(blobName, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectionString) {
            throw new Error("Azure Storage connection string not configured");
        }
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        yield containerClient.createIfNotExists({
            access: "blob"
        });
        const blobClient = containerClient.getBlockBlobClient(blobName);
        const content = JSON.stringify(data, null, 2);
        yield blobClient.upload(content, content.length, {
            blobHTTPHeaders: {
                blobContentType: "application/json"
            }
        });
    });
}
function streamToBuffer(readableStream) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function wishes(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const data = yield getStorageData("wishes.json");
                // Ensure we always return an array
                const wishesArray = Array.isArray(data) ? data : (data ? [data] : []);
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify(wishesArray)
                };
            }
            else if (request.method === "POST") {
                const body = yield request.json();
                // Check if this is a replace operation (for admin delete/update)
                const url = new URL(request.url);
                const action = url.searchParams.get('action');
                if (action === 'replace') {
                    // Admin operation: replace entire array
                    yield saveStorageData("wishes.json", body);
                    return {
                        status: 200,
                        headers,
                        body: JSON.stringify({ success: true, message: 'Wishes updated successfully' })
                    };
                }
                // Get existing wishes
                const existingWishes = yield getStorageData("wishes.json");
                const wishesArray = Array.isArray(existingWishes) ? existingWishes : [];
                // Create new wish with ID and timestamp
                const newWish = {
                    id: Date.now().toString(),
                    name: body.name,
                    message: body.message,
                    timestamp: Date.now()
                };
                // Append to array
                wishesArray.push(newWish);
                // Save back
                yield saveStorageData("wishes.json", wishesArray);
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify(newWish)
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
    });
}
functions_1.app.http('wishes', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: wishes
});
//# sourceMappingURL=wishes.js.map