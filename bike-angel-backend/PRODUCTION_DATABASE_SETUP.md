# Production Database Setup Guide

This guide walks you through setting up the production PostgreSQL database for Bike Angel.

## Option 1: Supabase (Recommended - Free Tier Available)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: bike-angel-production
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., US West)
   - **Pricing Plan**: Free tier is sufficient for initial launch

### Step 2: Get Connection Details

1. In your Supabase project, go to **Settings** → **Database**
2. Copy the connection string under "Connection string" → "URI"
3. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 3: Enable PostGIS Extension

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Search for "postgis"
3. Click "Enable" on the postgis extension

### Step 4: Run Migrations

From your local machine, run the schema creation:

```bash
cd bike-angel-backend

# Set environment variable with your Supabase connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run the schema SQL file
psql $DATABASE_URL -f src/database/schema.sql
```

Or use a PostgreSQL client like pgAdmin or DBeaver to connect and run the `schema.sql` file.

### Step 5: Load Seed Data

```bash
# Update your .env file with production database credentials
# Then run the seed script
npm run db:seed
```

### Step 6: Configure Backups

Supabase automatically backs up your database daily. To configure:

1. Go to **Settings** → **Database** → **Backups**
2. Verify daily backups are enabled
3. Consider enabling Point-in-Time Recovery (PITR) for production

## Option 2: Railway (Alternative)

### Step 1: Create Railway Project

1. Go to [https://railway.app](https://railway.app)
2. Sign up or log in
3. Click "New Project"
4. Select "Provision PostgreSQL"

### Step 2: Get Connection Details

1. Click on your PostgreSQL service
2. Go to "Connect" tab
3. Copy the connection string (starts with `postgresql://`)

### Step 3: Enable PostGIS

Railway PostgreSQL includes PostGIS by default. Verify by connecting and running:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Step 4: Run Migrations

```bash
cd bike-angel-backend

# Set environment variable
export DATABASE_URL="your-railway-connection-string"

# Run schema
psql $DATABASE_URL -f src/database/schema.sql
```

### Step 5: Load Seed Data

```bash
npm run db:seed
```

### Step 6: Configure Backups

Railway provides automatic backups on paid plans. For free tier:
- Use `pg_dump` for manual backups
- Set up a cron job to backup regularly

## Option 3: Render (Alternative)

### Step 1: Create PostgreSQL Database

1. Go to [https://render.com](https://render.com)
2. Sign up or log in
3. Click "New" → "PostgreSQL"
4. Fill in details:
   - **Name**: bike-angel-db
   - **Database**: bike_angel
   - **User**: postgres
   - **Region**: Choose closest to your users
   - **Plan**: Free tier available

### Step 2: Get Connection Details

1. Click on your database
2. Copy the "External Database URL"

### Step 3: Enable PostGIS

Connect to your database and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 4: Run Migrations

```bash
cd bike-angel-backend
export DATABASE_URL="your-render-connection-string"
psql $DATABASE_URL -f src/database/schema.sql
```

### Step 5: Load Seed Data

```bash
npm run db:seed
```

### Step 6: Configure Backups

Render provides daily backups on paid plans. For free tier, use manual backups.

## Verification

After setup, verify your database:

```bash
# List all tables
psql $DATABASE_URL -c "\dt"

# Check parking zones were seeded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM parking_zones;"

# Verify PostGIS is enabled
psql $DATABASE_URL -c "SELECT PostGIS_version();"
```

Expected output:
- 8 tables created (users, parking_zones, parking_reports, theft_incidents, favorite_zones, zone_suggestions, notifications, email_verification_tokens)
- 15 parking zones seeded
- PostGIS version displayed

## Environment Variables for Production

Update your backend `.env` file with production database credentials:

```env
# Production Database
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_production_password
```

Or use a single DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:password@host:5432/database
```

## Security Checklist

- [ ] Strong database password (16+ characters, mixed case, numbers, symbols)
- [ ] SSL/TLS enabled for connections
- [ ] Database not publicly accessible (use connection pooling)
- [ ] Regular backups configured
- [ ] Database credentials stored in environment variables (never in code)
- [ ] Connection pooling configured (max 10-20 connections)

## Monitoring

Set up monitoring for:
- Database size (watch for growth)
- Connection count (watch for leaks)
- Query performance (slow query log)
- Backup success/failure

## Maintenance

### Regular Tasks

1. **Weekly**: Check database size and growth rate
2. **Monthly**: Review slow queries and optimize indexes
3. **Quarterly**: Test backup restoration process

### Cleanup Jobs

The application includes automatic cleanup:
- Expired parking reports (older than 12 hours) are deleted by cron job
- Expired email verification tokens should be cleaned periodically

Consider adding a cleanup script:

```sql
-- Clean up expired verification tokens (run weekly)
DELETE FROM email_verification_tokens WHERE expires_at < NOW();

-- Clean up old notifications (run monthly)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### PostGIS Not Found

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Seed Data Not Loading

```bash
# Check if zones already exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM parking_zones;"

# If needed, clear and reseed
npm run db:reset
npm run db:seed
```

## Migration Strategy

For future schema changes:

1. Create migration files in `src/database/migrations/`
2. Name them with timestamps: `YYYYMMDD_description.sql`
3. Test on staging database first
4. Apply to production during low-traffic periods
5. Keep rollback scripts ready

Example migration file structure:

```
src/database/migrations/
  20240101_initial_schema.sql
  20240115_add_zone_suggestions.sql
  20240201_add_notifications.sql
```

## Support

- Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Railway: [https://docs.railway.app](https://docs.railway.app)
- Render: [https://render.com/docs](https://render.com/docs)
- PostgreSQL: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- PostGIS: [https://postgis.net/documentation/](https://postgis.net/documentation/)
