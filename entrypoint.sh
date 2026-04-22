#!/bin/sh
# Ensure uploads directory exists and is writable
mkdir -p /app/server/uploads
chmod 777 /app/server/uploads 2>/dev/null || true

# Run one-time migrations (safe to re-run — uses UPDATE WHERE)
node database/fix-accounts-role.js || echo "Migration note: fix-accounts-role skipped or failed (non-fatal)"

# Start the app
exec node server.js
