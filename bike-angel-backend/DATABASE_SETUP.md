# Database Setup Instructions

This guide will help you set up the PostgreSQL database for the Bike Angel platform.

## Quick Start

### Option 1: Using Supabase (Recommended - Easiest)

1. **Create a Supabase account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get your database credentials**
   - Go to Project Settings > Database
   - Find the "Connection string" section
   - Copy the connection details

3. **Update your .env file**
   ```env
   DB_HOST=db.xxxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Verify the setup**
   ```bash
   npm run db:test
   ```

✅ Done! Your database is ready.

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
   
   **Windows:**
   - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Run the installer
   - Select PostGIS during installation
   - Remember the password you set for the postgres user
   
   **Mac:**
   ```bash
   brew install postgresql@15
   brew install postgis
   brew services start postgresql@15
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   sudo apt-get install postgis postgresql-15-postgis-3
   sudo systemctl start postgresql
   ```

2. **Create the database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE bike_angel;
   
   # Exit
   \q
   ```

3. **Update your .env file**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bike_angel
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Verify the setup**
   ```bash
   npm run db:test
   ```

✅ Done! Your database is ready.

## What Gets Created

When you run `npm run db:init`, the following happens:

### 1. Extensions
- ✅ **PostGIS** - Enables geospatial queries for location-based features
- ✅ **uuid-ossp** - Generates unique IDs for all records

### 2. Tables
- ✅ **users** - UCSD students with verified @ucsd.edu emails
- ✅ **parking_zones** - 15 pre-defined UCSD bike parking locations
- ✅ **parking_reports** - User-submitted parking photos (expire after 12 hours)
- ✅ **theft_incidents** - Reported bicycle thefts with optional police verification
- ✅ **favorite_zones** - User's favorite zones for notifications
- ✅ **notifications** - Theft alerts for favorite zones
- ✅ **email_verification_tokens** - Temporary tokens for email verification

### 3. Indexes
Performance indexes for:
- Fast email lookups (login)
- Geospatial zone queries (map display)
- Time-based report queries (congestion calculation)
- Time-based incident queries (risk rating calculation)

### 4. Triggers
Automatic triggers for:
- Setting parking report expiry (12 hours from timestamp)
- Updating zone timestamps when reports/incidents are added

### 5. Seed Data
15 UCSD parking zones with GPS coordinates:
- Geisel Library, Price Center, Warren College, Revelle College
- Muir College, Marshall College, ERC, Sixth College, Seventh College
- CSE Building, Jacobs Hall, Center Hall, York Hall, Peterson Hall, RIMAC

## Available Commands

```bash
# Test database connection
npm run db:test

# Initialize database (create tables and seed data)
npm run db:init

# Drop all tables (⚠️ WARNING: Deletes all data!)
npm run db:drop

# Reset database (drop and recreate)
npm run db:reset
```

## Verification Steps

After running `npm run db:init`, you should see:

```
✅ Database schema created successfully!
📊 Tables created:
   - users
   - parking_zones (with 15 UCSD locations)
   - parking_reports
   - theft_incidents
   - favorite_zones
   - notifications
   - email_verification_tokens

🗺️  PostGIS extension enabled for geospatial queries
🔍 Indexes created for optimal query performance
⚡ Triggers configured for automatic timestamp updates

📍 15 parking zones seeded
```

Run `npm run db:test` to verify everything is working:

```
✅ Database connection successful!
✅ PostGIS Extension: Version 3.x installed
📋 Database Tables: 7 tables
📍 Parking Zones: 15 zones loaded
🔍 Database Indexes: 20+ indexes created
✅ Database is ready for use!
```

## Troubleshooting

### "Connection refused" or "ECONNREFUSED"

**Problem:** Can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   - Windows: Check Services app
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Verify .env credentials are correct

3. For Supabase: Check if your IP is allowed (Supabase > Settings > Database > Connection pooling)

### "database does not exist"

**Problem:** The bike_angel database hasn't been created

**Solution:**
```bash
psql -U postgres
CREATE DATABASE bike_angel;
\q
```

### "PostGIS extension not found"

**Problem:** PostGIS is not installed

**Solutions:**
- Windows: Reinstall PostgreSQL and select PostGIS
- Mac: `brew install postgis`
- Linux: `sudo apt-get install postgis`
- Supabase: PostGIS is pre-installed ✅

### "permission denied"

**Problem:** Database user doesn't have permissions

**Solution:**
```bash
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE bike_angel TO postgres;
\q
```

### "password authentication failed"

**Problem:** Wrong password in .env file

**Solution:**
- Check your .env file
- Verify the password is correct
- For Supabase: Copy password from project settings

## Database Schema Overview

```
users
├── id (UUID, primary key)
├── email (VARCHAR, unique, must end with @ucsd.edu)
├── password_hash (VARCHAR)
├── name (VARCHAR)
├── email_verified (BOOLEAN)
├── notifications_enabled (BOOLEAN)
└── created_at (TIMESTAMP)

parking_zones
├── id (UUID, primary key)
├── name (VARCHAR)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── capacity (INTEGER)
├── risk_rating (VARCHAR: green/yellow/red)
├── congestion_level (VARCHAR: available/filling/full)
└── last_updated (TIMESTAMP)

parking_reports
├── id (UUID, primary key)
├── user_id (UUID, foreign key → users)
├── zone_id (UUID, foreign key → parking_zones)
├── photo_url (TEXT)
├── thumbnail_url (TEXT)
├── timestamp (TIMESTAMP)
└── expires_at (TIMESTAMP, auto-set to timestamp + 12 hours)

theft_incidents
├── id (UUID, primary key)
├── user_id (UUID, foreign key → users)
├── zone_id (UUID, foreign key → parking_zones)
├── date_time (TIMESTAMP)
├── description (TEXT)
├── police_report_number (VARCHAR, optional)
├── verified (BOOLEAN, auto-computed from police_report_number)
└── created_at (TIMESTAMP)

favorite_zones
├── user_id (UUID, foreign key → users)
├── zone_id (UUID, foreign key → parking_zones)
└── created_at (TIMESTAMP)
└── PRIMARY KEY (user_id, zone_id)

notifications
├── id (UUID, primary key)
├── user_id (UUID, foreign key → users)
├── zone_id (UUID, foreign key → parking_zones)
├── type (VARCHAR)
├── message (TEXT)
├── read (BOOLEAN)
└── created_at (TIMESTAMP)

email_verification_tokens
├── id (UUID, primary key)
├── user_id (UUID, foreign key → users)
├── token (VARCHAR, unique)
├── expires_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

## Next Steps

After setting up the database:

1. ✅ Task 1.3 complete - Database is ready
2. ➡️ Task 1.4 - Configure cloud storage for photos
3. ➡️ Task 2.1 - Implement user registration API

## Need Help?

- Check the detailed README: `src/database/README.md`
- Test connection: `npm run db:test`
- View schema: `src/database/schema.sql`
- PostgreSQL docs: [postgresql.org/docs](https://www.postgresql.org/docs/)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
