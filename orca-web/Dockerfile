# syntax=docker/dockerfile:1

# Stage 1: Build dependencies
FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Proxy args for build environments
ARG http_proxy
ARG https_proxy
ARG no_proxy
ENV http_proxy=$http_proxy
ENV https_proxy=$https_proxy
ENV no_proxy=$no_proxy

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build application
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Proxy args for build environments
ARG http_proxy
ARG https_proxy
ARG no_proxy
ENV http_proxy=$http_proxy
ENV https_proxy=$https_proxy
ENV no_proxy=$no_proxy

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_IDENTITY_API
ARG NEXT_PUBLIC_CATALOG_API
ARG NEXT_PUBLIC_FORMS_API
ARG NEXT_PUBLIC_REQUESTS_API
ARG NEXT_PUBLIC_ORCHESTRATOR_API
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_SUBTITLE

ENV NEXT_PUBLIC_IDENTITY_API=$NEXT_PUBLIC_IDENTITY_API
ENV NEXT_PUBLIC_CATALOG_API=$NEXT_PUBLIC_CATALOG_API
ENV NEXT_PUBLIC_FORMS_API=$NEXT_PUBLIC_FORMS_API
ENV NEXT_PUBLIC_REQUESTS_API=$NEXT_PUBLIC_REQUESTS_API
ENV NEXT_PUBLIC_ORCHESTRATOR_API=$NEXT_PUBLIC_ORCHESTRATOR_API
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_SUBTITLE=$NEXT_PUBLIC_APP_SUBTITLE

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
