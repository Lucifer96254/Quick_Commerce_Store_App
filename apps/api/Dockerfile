# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages/db ./packages/db
COPY packages/shared-types ./packages/shared-types

# Copy API
COPY apps/api ./apps/api

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npm run db:generate --workspace=@quickmart/db

# Build packages
RUN npm run build --workspace=@quickmart/db
RUN npm run build --workspace=@quickmart/shared-types
RUN npm run build --workspace=@quickmart/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 4000

WORKDIR /app/apps/api

CMD ["npm", "run", "start:prod"]
