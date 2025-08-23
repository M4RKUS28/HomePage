# Multi-stage build for Next.js with PM2
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs && chmod 755 /app/logs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install PM2 globally
RUN npm install pm2 -g

# Copy PM2 ecosystem file
COPY ecosystem.config.js ./

# Switch to nextjs user
USER nextjs

# Expose port
EXPOSE 3000

# Start application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
