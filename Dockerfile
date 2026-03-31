FROM node:20-alpine

WORKDIR /app

# Copy server dependencies and install
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

# Copy frontend static files to /app/public
RUN mkdir -p /app/public
COPY index.html styles.css app.js sw.js manifest.json /app/public/
COPY swetha_symbol.png swetha_name.png swetha_tagline.png swetha_new_logo.png /app/public/
COPY icons/ /app/public/icons/
COPY assets/ /app/public/assets/

# Copy server and database
COPY server/ ./server/
COPY database/ ./database/

# Ensure uploads directory exists
RUN mkdir -p /app/server/uploads

# Create non-root user for security
RUN addgroup -S hrmsgroup && adduser -S hrmsuser -G hrmsgroup
RUN chown -R hrmsuser:hrmsgroup /app
USER hrmsuser

# Set static dir explicitly
ENV STATIC_DIR=/app/public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "server.js"]
