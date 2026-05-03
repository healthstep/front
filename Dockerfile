FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration=production

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist/front/ ./dist/front/
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev --legacy-peer-deps 2>/dev/null || true
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/front/server/server.mjs"]
