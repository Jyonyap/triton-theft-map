# Parking Zones API Documentation

## Base URL
```
http://localhost:3000/api/zones
```

## Endpoints

### 1. Get All Zones
Get a list of all parking zones with their current status.

**Endpoint:** `GET /api/zones`

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "zones": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Geisel Library",
      "latitude": 32.881111,
      "longitude": -117.237222,
      "capacity": 50,
      "risk_rating": "green",
      "congestion_level": "available",
      "last_updated": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

### 2. Get Zone Details
Get detailed information about a specific parking zone.

**Endpoint:** `GET /api/zones/:id`

**Authentication:** Not required (Public)

**URL Parameters:**
- `id` (UUID) - Zone ID

**Response:**
```json
{
  "success": true,
  "zone": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Geisel Library",
    "latitude": 32.881111,
    "longitude": -117.237222,
    "capacity": 50,
    "risk_rating": "green",
    "congestion_level": "available",
    "last_updated": "2024-01-01T12:00:00.000Z",
    "statistics": {
      "activeReports": 5,
      "estimatedBikes": 5,
      "totalThefts90Days": 0,
      "verifiedThefts90Days": 0
    }
  },
  "recentActivity": {
    "parkingReports": [
      {
        "id": "uuid",
        "photo_url": "https://...",
        "thumbnail_url": "https://...",
        "timestamp": "2024-01-01T11:30:00.000Z",
        "expires_at": "2024-01-01T23:30:00.000Z"
      }
    ],
    "theftIncidents": [
      {
        "id": "uuid",
        "date_time": "2024-01-01T10:00:00.000Z",
        "description": "Bike stolen from rack",
        "police_report_number": "UCSD-2024-001",
        "verified": true,
        "created_at": "2024-01-01T10:30:00.000Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Zone not found
- `500 Internal Server Error` - Server error

---

### 3. Suggest New Zone
Submit a suggestion for a new parking zone.

**Endpoint:** `POST /api/zones/suggest`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "suggestedName": "New Engineering Building",
  "latitude": 32.882500,
  "longitude": -117.234500,
  "estimatedCapacity": 40,
  "description": "New bike racks installed near main entrance"
}
```

**Field Validation:**
- `suggestedName` (required): 3-255 characters
- `latitude` (required): -90 to 90
- `longitude` (required): -180 to 180
- `estimatedCapacity` (optional): 1-500
- `description` (optional): max 1000 characters

**Response:**
```json
{
  "success": true,
  "message": "Zone suggestion submitted successfully. An administrator will review your suggestion.",
  "suggestion": {
    "id": "uuid",
    "suggestedName": "New Engineering Building",
    "latitude": 32.882500,
    "longitude": -117.234500,
    "estimatedCapacity": 40,
    "description": "New bike racks installed near main entrance",
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

**Validation Errors:**
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "statusCode": 400,
  "errors": [
    {
      "msg": "Zone name is required",
      "param": "suggestedName",
      "location": "body"
    }
  ]
}
```

---

### 4. Get Zone Suggestions (Admin)
Get all zone suggestions for admin review.

**Endpoint:** `GET /api/zones/suggestions`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)

**Examples:**
```
GET /api/zones/suggestions
GET /api/zones/suggestions?status=pending
GET /api/zones/suggestions?status=approved
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "suggestions": [
    {
      "id": "uuid",
      "suggested_name": "New Engineering Building",
      "latitude": 32.882500,
      "longitude": -117.234500,
      "estimated_capacity": 40,
      "description": "New bike racks installed",
      "status": "pending",
      "admin_notes": null,
      "created_at": "2024-01-01T12:00:00.000Z",
      "reviewed_at": null,
      "suggested_by_name": "John Doe",
      "suggested_by_email": "jdoe@ucsd.edu"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

**Note:** This endpoint should be restricted to admin users in production.

---

## Data Models

### Zone
```typescript
{
  id: UUID
  name: string
  latitude: number (decimal)
  longitude: number (decimal)
  capacity: number (integer)
  risk_rating: 'green' | 'yellow' | 'red'
  congestion_level: 'available' | 'filling' | 'full'
  last_updated: timestamp
}
```

### Zone Statistics
```typescript
{
  activeReports: number        // Reports from past 12 hours
  estimatedBikes: number        // Current bike count estimate
  totalThefts90Days: number     // All thefts in past 90 days
  verifiedThefts90Days: number  // Verified thefts in past 90 days
}
```

### Zone Suggestion
```typescript
{
  id: UUID
  user_id: UUID
  suggested_name: string
  latitude: number (decimal)
  longitude: number (decimal)
  estimated_capacity: number (integer, optional)
  description: string (optional)
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string (optional)
  created_at: timestamp
  reviewed_at: timestamp (optional)
}
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### Common Error Types
- `Bad Request` (400) - Invalid input data
- `Unauthorized` (401) - Missing or invalid authentication
- `Not Found` (404) - Resource not found
- `Internal Server Error` (500) - Server error

---

## Testing Examples

### Using cURL

**Get all zones:**
```bash
curl http://localhost:3000/api/zones
```

**Get zone details:**
```bash
curl http://localhost:3000/api/zones/550e8400-e29b-41d4-a716-446655440000
```

**Suggest a zone (requires auth):**
```bash
curl -X POST http://localhost:3000/api/zones/suggest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestedName": "Test Zone",
    "latitude": 32.88,
    "longitude": -117.23,
    "estimatedCapacity": 30,
    "description": "Test description"
  }'
```

**Get suggestions (requires auth):**
```bash
curl http://localhost:3000/api/zones/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get pending suggestions:**
```bash
curl "http://localhost:3000/api/zones/suggestions?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript (fetch)

**Get all zones:**
```javascript
const response = await fetch('http://localhost:3000/api/zones');
const data = await response.json();
console.log(data.zones);
```

**Suggest a zone:**
```javascript
const response = await fetch('http://localhost:3000/api/zones/suggest', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    suggestedName: 'Test Zone',
    latitude: 32.88,
    longitude: -117.23,
    estimatedCapacity: 30
  })
});
const data = await response.json();
console.log(data.suggestion);
```

---

## Database Seeding

To populate the database with UCSD parking zones:

```bash
# Seed parking zones
npm run db:seed

# List all zones in database
npm run db:list-zones
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Coordinates are in decimal degrees
- Zone IDs are UUIDs
- Public endpoints don't require authentication
- Protected endpoints require JWT token in Authorization header
- Validation errors return detailed field-level error messages
