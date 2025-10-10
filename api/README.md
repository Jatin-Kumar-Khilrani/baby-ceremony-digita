# Baby Ceremony API

Azure Functions-based API for the baby ceremony invitation website.

## Features

- **RSVPs API**: Store and retrieve guest RSVPs
- **Wishes API**: Manage guest wishes and messages
- **Photos API**: Upload and list ceremony photos
- **Azure Blob Storage**: All data stored in Azure cloud
- **CORS Enabled**: Works with frontend from any origin
- **Fallback Support**: LocalStorage fallback if API unavailable

## Local Development

### 1. Install Dependencies
```powershell
cd api
npm install
```

### 2. Configure Storage
Create `local.settings.json` from template:
```powershell
cp local.settings.json.template local.settings.json
```

Add your Azure Storage connection string to `local.settings.json`.

### 3. Start API Server
```powershell
npm start
```

The API will run on http://localhost:7071

## API Endpoints

### GET /api/rsvps
Get all RSVPs

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "attending": true,
    "guests": 2,
    "message": "Can't wait!"
  }
]
```

### POST /api/rsvps
Save RSVPs (full array)

**Request Body:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "attending": true,
    "guests": 2
  }
]
```

### GET /api/wishes
Get all wishes

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Jane Smith",
    "message": "Congratulations!",
    "timestamp": 1234567890
  }
]
```

### POST /api/wishes
Save wishes (full array)

**Request Body:**
```json
[
  {
    "id": "uuid",
    "name": "Jane Smith",
    "message": "Congratulations!"
  }
]
```

### GET /api/photos
Get all photos

**Response:**
```json
[
  {
    "id": "photo-123.jpg",
    "url": "https://storage.blob.core.windows.net/...",
    "name": "photo-123.jpg",
    "uploadedAt": "2025-11-15T10:00:00Z"
  }
]
```

### POST /api/photos
Upload a photo

**Request Body:**
```json
{
  "fileName": "photo.jpg",
  "fileData": "data:image/jpeg;base64,...",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://storage.blob.core.windows.net/..."
}
```

## Storage Structure

### Blob Containers

- **ceremony-data**: Stores JSON files for RSVPs and wishes
  - `rsvps.json`
  - `wishes.json`

- **ceremony-photos**: Stores uploaded photo files
  - `{timestamp}-{filename}.jpg`

## Environment Variables

### Local Development (`local.settings.json`)
```json
{
  "Values": {
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;..."
  }
}
```

### Production (Azure Static Web Apps)
Set in Azure Portal → Static Web Apps → Configuration:
- `AZURE_STORAGE_CONNECTION_STRING`

## Testing

### Test with curl
```powershell
# Get RSVPs
curl http://localhost:7071/api/rsvps

# Save RSVP
curl -X POST http://localhost:7071/api/rsvps `
  -H "Content-Type: application/json" `
  -d '[{"id":"1","name":"Test","attending":true}]'
```

### Test with Frontend
The frontend automatically uses:
- `http://localhost:7071/api` in development
- `/api` in production (Azure Static Web Apps)

## Deployment

### Azure Static Web Apps
The API deploys automatically with the Static Web App.

File structure:
```
/
├── src/          (Frontend)
├── api/          (Backend - Azure Functions)
│   ├── src/
│   │   └── functions/
│   │       ├── rsvps.ts
│   │       ├── wishes.ts
│   │       └── photos.ts
│   ├── package.json
│   └── host.json
└── dist/         (Build output)
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

## Cost

- **Azure Functions**: Free tier (1M executions/month)
- **Blob Storage**: ~$0.02/GB/month
- **Bandwidth**: Free tier (100GB/month)

**Estimated: $0.10 - $1.00/month** for typical usage.

## Error Handling

All endpoints include:
- ✅ CORS support
- ✅ Error logging
- ✅ Graceful fallbacks
- ✅ HTTP status codes
- ✅ JSON error responses

## Security

- Anonymous access (public invitation)
- CORS enabled for all origins
- No authentication required
- Data validation in functions
- Azure Storage access via connection string (server-side only)

For admin features (delete/edit), consider adding Azure AD authentication.
