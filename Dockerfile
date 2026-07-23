# Multi-stage: build Next.js standalone, then run with Nginx + supervisord on Koyeb
# ----------------------------------------------------------------------------
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package.json bun.lock* package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

# ----------------------------------------------------------------------------
# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install nginx + supervisord
RUN apk add --no-cache nginx supervisor curl openssl

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma needs the schema + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Deployment scripts
COPY deploy/supervisord.conf /etc/supervisord.conf
COPY deploy/nginx.conf.tmpl /etc/nginx/nginx.conf.tmpl
COPY deploy/start.sh /start.sh
RUN chmod +x /start.sh

# Koyeb exposes one port — we use 8080 for nginx (which proxies to Next.js on 3000)
EXPOSE 8080

# Persistent volume for SQLite
VOLUME ["/app/db"]

CMD ["/start.sh"]
