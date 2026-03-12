FROM node:20-alpine

WORKDIR /app

# Copy server dependencies and install
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

# Copy all app files
COPY index.html styles.css app.js sw.js manifest.json ./
COPY swetha_logo.png swetha_symbol.png swetha_name.png swetha_tagline.png ./
COPY icons/ ./icons/
COPY server/ ./server/
COPY database/ ./database/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "server.js"]
