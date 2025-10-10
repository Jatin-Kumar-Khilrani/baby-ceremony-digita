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
exports.rsvps = rsvps;
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
const emailService_1 = require("./src/emailService");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "ceremony-data";
function getStorageData(blobName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectionString) {
            throw new Error("Azure Storage connection string not configured");
        }
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        // Ensure container exists
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
function rsvps(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const data = yield getStorageData("rsvps.json");
                // Ensure data is always an array
                const rsvpsArray = Array.isArray(data) ? data : (data ? [data] : []);
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify(rsvpsArray)
                };
            }
            else if (request.method === "POST") {
                // Check if this is a "search" request (finding existing RSVP to send PIN)
                const isSearchRequest = request.query.get('action') === 'search';
                const isReplaceRequest = request.query.get('action') === 'replace';
                const searchEmail = request.query.get('email');
                // Parse body only if not a search request
                let body = null;
                if (!isSearchRequest) {
                    try {
                        body = yield request.json();
                    }
                    catch (e) {
                        return {
                            status: 400,
                            headers,
                            body: JSON.stringify({ error: "Invalid JSON in request body" })
                        };
                    }
                }
                if (isSearchRequest && searchEmail) {
                    // User is searching for their RSVP - send PIN if found
                    const existingData = yield getStorageData("rsvps.json");
                    const existingRsvp = existingData.find((r) => r.email && r.email.toLowerCase() === searchEmail.toLowerCase());
                    if (existingRsvp) {
                        // Generate new PIN each time they search (for security)
                        const pin = (0, emailService_1.generatePin)();
                        existingRsvp.pin = pin;
                        existingRsvp.pinSentAt = new Date().toISOString();
                        // Send PIN via email
                        try {
                            const emailSent = yield (0, emailService_1.sendPinEmail)(existingRsvp.email, existingRsvp.name, pin);
                            if (emailSent) {
                                context.log(`PIN email sent to ${existingRsvp.email} for RSVP search`);
                                existingRsvp.pinEmailSent = true;
                            }
                            else {
                                context.log(`Failed to send PIN email to ${existingRsvp.email}`);
                                existingRsvp.pinEmailSent = false;
                            }
                        }
                        catch (emailError) {
                            context.log(`Error sending PIN email to ${existingRsvp.email}: ${emailError}`);
                            existingRsvp.pinEmailSent = false;
                        }
                        // Save updated data with new PIN
                        yield saveStorageData("rsvps.json", existingData);
                        return {
                            status: 200,
                            headers,
                            body: JSON.stringify({
                                success: true,
                                found: true,
                                message: 'PIN sent to your email'
                            })
                        };
                    }
                    else {
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
                    yield saveStorageData("rsvps.json", body);
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
                const existingData = yield getStorageData("rsvps.json");
                const rsvpsArray = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
                rsvpsArray.push(body);
                yield saveStorageData("rsvps.json", rsvpsArray);
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ success: true })
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
functions_1.app.http('rsvps', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: rsvps
});
//# sourceMappingURL=rsvps.js.map