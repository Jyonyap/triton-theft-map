# Bike Angel Backend API

Backend API for the Bike Angel campus bicycle safety platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
- Create a database named `bike_angel`
- Run migrations (to be added in task 1.3)

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
bike-angel-backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main application entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email address

### Parking Zones
- `GET /api/zones` - Get all parking zones
- `GET /api/zones/:id` - Get zone details
- `POST /api/zones/suggest` - Suggest new zone

### Parking Reports
- `POST /api/reports/parking` - Submit parking report
- `GET /api/reports/parking/:zoneId` - Get reports for zone

### Theft Incidents
- `POST /api/incidents/theft` - Report theft incident
- `GET /api/incidents/theft/:zoneId` - Get incidents for zone

## Environment Variables

See `.env.example` for required environment variables.

## Development

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests

## Dependencies

- **express** - Web framework
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **pg** - PostgreSQL client
- **dotenv** - Environment variable management
- **cors** - CORS middleware
- **express-validator** - Input validation
