#!/bin/bash

# Database Backup Script
# Run this script regularly to backup your production database

set -e

echo "💾 Bike Angel - Database Backup"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/bike_angel_backup_$TIMESTAMP.sql"

echo "📦 Creating backup: $BACKUP_FILE"
echo ""

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Show backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"
echo ""

# Clean up old backups (keep last 30 days)
echo "🧹 Cleaning up old backups (keeping last 30 days)..."
find backups/ -name "bike_angel_backup_*.sql.gz" -mtime +30 -delete
REMAINING_BACKUPS=$(ls -1 backups/bike_angel_backup_*.sql.gz 2>/dev/null | wc -l)
echo "✅ Remaining backups: $REMAINING_BACKUPS"
echo ""

echo "================================"
echo "✅ Backup complete!"
echo "================================"
