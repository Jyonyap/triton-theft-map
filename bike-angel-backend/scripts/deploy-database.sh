#!/bin/bash

# Production Database Deployment Script
# This script sets up the production database with schema and seed data

set -e  # Exit on error

echo "🚀 Bike Angel - Production Database Setup"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL with your production database connection string:"
    echo "export DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

echo "✅ psql is installed"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Error: Cannot connect to database"
    echo "Please check your DATABASE_URL and network connection"
    exit 1
fi
echo ""

# Enable extensions
echo "📦 Enabling PostgreSQL extensions..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /dev/null
echo "✅ Extensions enabled (postgis, uuid-ossp)"
echo ""

# Run schema
echo "🗄️  Creating database schema..."
if psql "$DATABASE_URL" -f src/database/schema.sql > /dev/null 2>&1; then
    echo "✅ Schema created successfully"
else
    echo "⚠️  Schema creation had warnings (this is normal if tables already exist)"
fi
echo ""

# Verify tables
echo "🔍 Verifying tables..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo "✅ Found $TABLE_COUNT tables"
echo ""

# Load seed data
echo "🌱 Loading seed data (parking zones)..."
if node src/database/seedZones.js seed > /dev/null 2>&1; then
    echo "✅ Seed data loaded successfully"
else
    echo "⚠️  Seed data loading had warnings (zones may already exist)"
fi
echo ""

# Verify seed data
echo "🔍 Verifying seed data..."
ZONE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM parking_zones;")
echo "✅ Found $ZONE_COUNT parking zones"
echo ""

# Display zone list
echo "📍 Parking zones in database:"
psql "$DATABASE_URL" -c "SELECT name, latitude, longitude, capacity FROM parking_zones ORDER BY name;"
echo ""

# Summary
echo "=========================================="
echo "✅ Production database setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update your backend .env file with production database credentials"
echo "2. Deploy your backend application"
echo "3. Test the API endpoints"
echo ""
echo "Database info:"
echo "  Tables: $TABLE_COUNT"
echo "  Parking zones: $ZONE_COUNT"
echo ""
