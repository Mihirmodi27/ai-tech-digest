# --- Stage 1: Build the Vite frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Production server ---
FROM node:20-slim AS production
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Copy server code
COPY server ./server

# Serve static files from Vite build + API
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
