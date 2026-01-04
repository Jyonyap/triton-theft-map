# Parking Zones Feature

## Overview
The parking zones feature provides the foundation for the Bike Angel platform by managing official UCSD bike parking locations. This includes listing zones, viewing detailed zone information, and allowing users to suggest new parking zones.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Express Router                        │
│                  (zoneRoutes.js)                        │
│  - Route matching                                       │
│  - Middleware chain                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Middleware Layer                       │
│  - authenticateToken (auth check)                       │
│  - validateZoneSuggestion (input validation)            │
│  - validate (error handling)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Zone Controller                         │
│               (zoneController.js)                       │
│  - Business logic                                       │
│  - Database queries                                     │
│  - Response formatting                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                    │
│  - parking_zones table                                  │
│  - zone_suggestions table                               │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
bike-angel-backend/
├── src/
│   ├── routes/
│   │   └── zoneRoutes.js          # Route definitions
│   ├── controllers/
│   │   └── zoneController.js      # Business logic
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication
│   │   ├── zoneValidation.js      # Input validation rules
│   │   └── validationMiddleware.js # Validation error handler
│   ├── database/
│   │   ├── schema.sql              # Database schema
│   │   ├── seedZones.js            # Seed script
│   │   └── seeds/
│   │       └── parkingZones.js     # Seed data
│   └── config/
│       └── database.js             # Database connection
├── API_ZONES.md                    # API documentation
└── TASK_3_SUMMARY.md              # Implementation summary
```

## Endpoints

### Public Endpoints (No Authentication)

#### 1. GET /api/zones
List all parking zones with current status.

**Use Case:** Display zones on campus map

**Response Time:** ~50ms

**Caching:** Consider caching for 5 minutes

#### 2. GET /api/zones/:id
Get detailed information about a specific zone.

**Use Case:** Show zone details when user taps marker on map

**Response Time:** ~100ms (includes related data)

**Includes:**
- Zone basic info
- Statistics (active reports, theft counts)
- Recent parking reports (past 12 hours)
- Recent theft incidents (past 90 days)

### Protected Endpoints (Requires Authentication)

#### 3. POST /api/zones/suggest
Submit a suggestion for a new parking zone.

**Use Case:** Allow users to suggest missing parking locations

**Rate Limiting:** Consider limiting to 5 suggestions per user per day

**Validation:**
- Name: 3-255 characters
- Coordinates: Valid lat/lng
- Capacity: 1-500 (optional)

#### 4. GET /api/zones/suggestions
View all zone suggestions (admin only).

**Use Case:** Admin dashboard for reviewing suggestions

**Future:** Add admin role check middleware

## Database Schema

### parking_zones
```sql
CREATE TABLE parking_zones (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  capacity INTEGER NOT NULL,
  risk_rating VARCHAR(10) DEFAULT 'green',
  congestion_level VARCHAR(20) DEFAULT 'available',
  last_updated TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Geospatial index on (longitude, latitude) for location queries
- Index on name for search

### zone_suggestions
```sql
CREATE TABLE zone_suggestions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  suggested_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  estimated_capacity INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
```

**Indexes:**
- Index on (status, created_at) for admin queries
- Index on user_id for user's suggestions

## Seed Data

### UCSD Parking Zones (25 locations)

**Categories:**
- Central Campus (3): Geisel Library, Price Center, Center Hall
- Colleges (7): Warren, Revelle, Muir, Marshall, ERC, Sixth, Seventh
- Engineering (5): CSE, Jacobs Hall, York Hall, Peterson Hall, Mayer Hall
- Recreation (2): RIMAC, Main Gym
- Medical (2): Medical Education Building, Student Health Center
- Arts (2): Mandeville Center, Literature Building
- Services (2): Student Services Center, International Center
- Transit (2): Gilman Transit Center, Hopkins Parking Structure

**Total Capacity:** 1,185 bikes across all zones

**Seeding:**
```bash
npm run db:seed        # Populate database
npm run db:list-zones  # Verify seeded data
```

## Validation Rules

### Zone Suggestion Validation
```javascript
{
  suggestedName: {
    required: true,
    minLength: 3,
    maxLength: 255
  },
  latitude: {
    required: true,
    type: 'float',
    min: -90,
    max: 90
  },
  longitude: {
    required: true,
    type: 'float',
    min: -180,
    max: 180
  },
  estimatedCapacity: {
    required: false,
    type: 'integer',
    min: 1,
    max: 500
  },
  description: {
    required: false,
    maxLength: 1000
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable message",
  "statusCode": 400
}
```

### Common Errors
- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Missing/invalid JWT token
- **404 Not Found:** Zone doesn't exist
- **500 Internal Server Error:** Database or server error

## Security Considerations

### Authentication
- Public endpoints: No auth required (read-only)
- Protected endpoints: JWT token required
- Future: Add admin role for suggestions endpoint

### Input Validation
- All user inputs validated with express-validator
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

### Rate Limiting (Future)
- Suggestion endpoint: 5 per user per day
- Public endpoints: 100 requests per minute per IP

## Performance Optimization

### Database
- Indexes on frequently queried columns
- Geospatial index for location-based queries
- Connection pooling (max 20 connections)

### Caching (Future)
- Cache zone list for 5 minutes
- Invalidate cache on zone updates
- Use Redis for distributed caching

### Query Optimization
- Limit recent reports to 10 items
- Use LIMIT and ORDER BY for pagination
- Avoid N+1 queries with JOINs

## Testing

### Unit Tests (Recommended)
```javascript
describe('Zone Controller', () => {
  test('getAllZones returns all zones', async () => {
    // Test implementation
  });
  
  test('getZoneById returns 404 for invalid ID', async () => {
    // Test implementation
  });
  
  test('suggestZone validates required fields', async () => {
    // Test implementation
  });
});
```

### Integration Tests (Recommended)
```javascript
describe('Zone API', () => {
  test('GET /api/zones returns 200', async () => {
    // Test implementation
  });
  
  test('POST /api/zones/suggest requires auth', async () => {
    // Test implementation
  });
});
```

### Manual Testing
See `API_ZONES.md` for cURL examples

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Admin role middleware
- [ ] Approve/reject suggestions endpoint
- [ ] Email notifications for new suggestions
- [ ] Rate limiting on suggestion endpoint

### Phase 2 (Short-term)
- [ ] Zone search by name
- [ ] Zone filtering by risk rating
- [ ] Zone filtering by congestion level
- [ ] Nearby zones endpoint (geospatial query)
- [ ] Zone analytics dashboard

### Phase 3 (Long-term)
- [ ] Zone editing for admins
- [ ] Zone deletion with cascade handling
- [ ] Bulk zone operations
- [ ] Zone history tracking
- [ ] Zone popularity metrics
- [ ] Integration with UCSD Transportation API

## Monitoring

### Metrics to Track
- API response times
- Error rates by endpoint
- Database query performance
- Suggestion submission rate
- Zone view counts

### Logging
- All errors logged with stack traces
- Suggestion submissions logged for admin notification
- Database connection issues logged

## Dependencies

### Required
- `express` - Web framework
- `pg` - PostgreSQL client
- `express-validator` - Input validation
- `jsonwebtoken` - JWT authentication

### Database
- PostgreSQL 12+
- PostGIS extension (for geospatial queries)

## Deployment Checklist

- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Authentication working
- [ ] Documentation updated

## Support

For issues or questions:
1. Check `API_ZONES.md` for API documentation
2. Check `TASK_3_SUMMARY.md` for implementation details
3. Review error logs in console
4. Check database connection status

## Related Files

- `API_ZONES.md` - Complete API documentation
- `TASK_3_SUMMARY.md` - Implementation summary
- `src/database/schema.sql` - Database schema
- `src/database/seeds/parkingZones.js` - Seed data
