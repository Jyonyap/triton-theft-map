# Database Setup Guide

This directory contains the database schema and initialization scripts for the Bike Angel platform.

## Prerequisites

### Option 1: Local PostgreSQL

1. Install PostgreSQL (version 13 or higher)
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql@15`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. Install PostGIS extension
   - **Windows**: Select PostGIS during PostgreSQL installation
   - **Mac**: `brew install postgis`
   - **Linux**: `sudo apt-get install postgis postgresql-15-postgis-3`

3. Start PostgreSQL service
   - **Windows**: Starts automatically after installation
   - **Mac**: `brew services start postgresql@15`
   - **Linux**: `sudo systemctl start postgresql`

4. Create database
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE bike_angel;
   
   # Exit
   \q
   ```

### Option 2: Supabase (Recommended for Development)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string
5. Update your `.env` file with the connection details

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bike_angel
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   ```

   For Supabase, use:
   ```env
   DB_HOST=db.xxxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   ```

## Initialize Database

Run the initialization script to create all tables, indexes, and seed data:

```bash
npm run db:init
```

This will:
- ✅ Enable PostGIS extension for geospatial queries
- ✅ Create all database tables (users, parking_zones, parking_reports, theft_incidents, etc.)
- ✅ Add indexes for optimal query performance
- ✅ Set up triggers for automatic timestamp updates
- ✅ Seed 15 UCSD parking zones with GPS coordinates

## Database Commands

```bash
# Initialize database (create tables and seed data)
npm run db:init

# Drop all tables (⚠️ WARNING: This deletes all data!)
npm run db:drop

# Reset database (drop and recreate everything)
npm run db:reset
```

## Database Schema

### Tables

1. **users** - Registered UCSD students
   - Email must end with @ucsd.edu
   - Passwords are hashed with bcrypt
   - Email verification required

2. **parking_zones** - Pre-defined bike parking locations
   - 15 official UCSD locations seeded
   - GPS coordinates for map display
   - Risk rating (green/yellow/red)
   - Congestion level (available/filling/full)

3. **parking_reports** - User-submitted parking photos
   - Expires after 12 hours (automatic)
   - Used for congestion calculation

4. **theft_incidents** - Reported bicycle thefts
   - Optional police report number for verification
   - Used for risk rating calculation

5. **favorite_zones** - User's favorite parking zones
   - Used for theft alert notifications

6. **notifications** - Push notifications
   - Theft alerts for favorite zones

7. **email_verification_tokens** - Email verification
   - Temporary tokens for account activation

### Indexes

Performance indexes are created for:
- Email lookups (login)
- Zone location queries (geospatial)
- Report time-based queries (congestion)
- Incident time-based queries (risk rating)
- User favorites (notifications)

### PostGIS Extension

The PostGIS extension enables geospatial queries:
- Find zones near user location
- Calculate distances between points
- Efficient location-based searches

## Seeded Parking Zones

The following UCSD parking zones are pre-loaded:

1. Geisel Library (50 bikes)
2. Price Center (80 bikes)
3. Warren College (40 bikes)
4. Revelle College (35 bikes)
5. Muir College (45 bikes)
6. Marshall College (40 bikes)
7. ERC - Eleanor Roosevelt College (50 bikes)
8. Sixth College (45 bikes)
9. Seventh College (40 bikes)
10. CSE Building (60 bikes)
11. Jacobs Hall (55 bikes)
12. Center Hall (45 bikes)
13. York Hall (30 bikes)
14. Peterson Hall (35 bikes)
15. RIMAC (70 bikes)

## Verification

After initialization, verify the setup:

```bash
# Connect to database
psql -U postgres -d bike_angel

# List all tables
\dt

# Check PostGIS extension
SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';

# Count parking zones
SELECT COUNT(*) FROM parking_zones;

# View all zones
SELECT name, latitude, longitude, capacity FROM parking_zones;

# Exit
\q
```

## Troubleshooting

### "PostGIS extension not found"
- Make sure PostGIS is installed on your system
- For Supabase: PostGIS is pre-installed, no action needed

### "Connection refused"
- Check if PostgreSQL is running
- Verify connection details in `.env`
- Check firewall settings

### "Database does not exist"
- Create the database first: `CREATE DATABASE bike_angel;`
- Or use Supabase which creates it automatically

### "Permission denied"
- Check database user permissions
- For local setup, use `postgres` superuser
- For Supabase, use the provided credentials

## Production Deployment

For production:
1. Use a managed PostgreSQL service (Supabase, Railway, Render)
2. Enable SSL connections
3. Set up automated backups
4. Use connection pooling (already configured in `database.js`)
5. Monitor query performance
6. Set up database replication for high availability

## Maintenance

### Cleanup Expired Reports

Parking reports expire after 12 hours. Set up a cron job to clean them:

```sql
DELETE FROM parking_reports WHERE expires_at < NOW();
```

### Cleanup Old Verification Tokens

```sql
DELETE FROM email_verification_tokens WHERE expires_at < NOW();
```

### Monitor Database Size

```sql
SELECT 
  pg_size_pretty(pg_database_size('bike_angel')) as database_size;
```

## Schema Updates

When updating the schema:
1. Create a new migration file
2. Test on development database first
3. Backup production database
4. Apply migration to production
5. Verify data integrity
