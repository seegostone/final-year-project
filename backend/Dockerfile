FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY wait-for-mongo.cjs ./
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["/bin/sh", "-c", "curl -f http://localhost:5000/api/health || exit 1"]
CMD ["node", "wait-for-mongo.cjs", "server.js"]
