FROM node:20

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend ./

EXPOSE 3000

CMD ["node", "index.js"]
