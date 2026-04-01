#!/bin/sh
# Ensure uploads directory exists and is writable
mkdir -p /app/server/uploads
chmod 777 /app/server/uploads 2>/dev/null || true

# Start the app
exec node server.js
