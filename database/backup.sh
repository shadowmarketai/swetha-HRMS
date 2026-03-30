#!/bin/bash
# Swetha Structures HRMS — MySQL Backup Script
# Usage: bash database/backup.sh
# Requires: mysqldump, MYSQL_PASSWORD env var or .env file

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-hrms}"
KEEP_DAYS=7

# Load .env if exists
ENV_FILE="$SCRIPT_DIR/../server/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_PASS="${DB_PASSWORD:-${MYSQL_ROOT_PASSWORD:-hrms2026}}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamped filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hrms_backup_${TIMESTAMP}.sql.gz"

echo "Starting HRMS database backup..."
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  Output: $BACKUP_FILE"

# Dump and compress
mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed: $BACKUP_FILE ($SIZE)"
else
  echo "ERROR: Backup failed!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Remove backups older than KEEP_DAYS
DELETED=$(find "$BACKUP_DIR" -name "hrms_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "Cleaned up $DELETED old backup(s) (older than $KEEP_DAYS days)"
fi

echo "Done."
