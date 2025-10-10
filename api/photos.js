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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.photos = photos;
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-photos";
const dataContainerName = "ceremony-data";
function getPhotoMetadata() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectionString)
            return [];
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(dataContainerName);
        const blobClient = containerClient.getBlobClient("photos-metadata.json");
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
function savePhotoMetadata(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectionString)
            throw new Error("Storage not configured");
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(dataContainerName);
        yield containerClient.createIfNotExists({ access: "blob" });
        const blobClient = containerClient.getBlockBlobClient("photos-metadata.json");
        const content = JSON.stringify(metadata, null, 2);
        yield blobClient.upload(content, content.length, {
            blobHTTPHeaders: { blobContentType: "application/json" }
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
function photos(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d;
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
                let metadata = yield getPhotoMetadata();
                // If no metadata exists, fall back to listing blobs directly
                if (metadata.length === 0) {
                    yield containerClient.createIfNotExists({ access: "blob" });
                    try {
                        for (var _e = true, _f = __asyncValues(containerClient.listBlobsFlat()), _g; _g = yield _f.next(), _a = _g.done, !_a; _e = true) {
                            _c = _g.value;
                            _e = false;
                            const blob = _c;
                            const blobClient = containerClient.getBlobClient(blob.name);
                            metadata.push({
                                id: blob.name,
                                url: blobClient.url,
                                name: blob.name.split('-').slice(1).join('-').replace('.jpg', ''),
                                caption: '',
                                timestamp: ((_d = blob.properties.createdOn) === null || _d === void 0 ? void 0 : _d.getTime()) || Date.now()
                            });
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_e && !_a && (_b = _f.return)) yield _b.call(_f);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    // Save metadata for future use
                    if (metadata.length > 0) {
                        yield savePhotoMetadata(metadata);
                    }
                }
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify(metadata)
                };
            }
            else if (request.method === "POST") {
                const body = yield request.json();
                // Check if this is a replace operation (for admin delete)
                const url = new URL(request.url);
                const action = url.searchParams.get('action');
                if (action === 'replace') {
                    // Admin operation: replace entire metadata array
                    yield savePhotoMetadata(body);
                    return {
                        status: 200,
                        headers,
                        body: JSON.stringify({ success: true, message: 'Photos updated successfully' })
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
                yield containerClient.createIfNotExists({
                    access: "blob"
                });
                // Generate unique filename
                const timestamp = Date.now();
                const fileName = `${timestamp}-${name.replace(/\s+/g, '-')}.jpg`;
                // Convert base64 to buffer
                const base64Data = imageUrl.includes(',') ? imageUrl.split(',')[1] : imageUrl;
                const buffer = Buffer.from(base64Data, 'base64');
                const blobClient = containerClient.getBlockBlobClient(fileName);
                yield blobClient.upload(buffer, buffer.length, {
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
                const metadata = yield getPhotoMetadata();
                metadata.push(newPhoto);
                yield savePhotoMetadata(metadata);
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
    });
}
functions_1.app.http('photos', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: photos
});
//# sourceMappingURL=photos.js.map