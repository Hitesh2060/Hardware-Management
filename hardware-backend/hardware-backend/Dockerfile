FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Prisma client must be generated against the schema baked into the image
RUN npx prisma generate

RUN mkdir -p uploads/products uploads/invoices uploads/profiles uploads/temp logs

ENV NODE_ENV=production
EXPOSE 5000

# Run migrations then start — see docker-compose.yml for the full flow
# (this image assumes DATABASE_URL/REDIS_URL are supplied at runtime).
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
