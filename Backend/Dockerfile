# ── Stage: runtime ────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
# npm ci is faster and stricter than npm install — uses package-lock.json exactly
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
