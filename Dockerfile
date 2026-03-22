# Backend - NestJS API
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy package files and install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]

# Development stage - hot reload, source mounted as volume
FROM node:22-alpine AS dev

WORKDIR /app

# Copy package files for npm install
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
