FROM node:20-bookworm-slim AS deps

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./

RUN npm ci --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends docker.io \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend ./

EXPOSE 3000

CMD ["node", "index.js"]
