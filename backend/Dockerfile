# Build Stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Build Prisma Seed script
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target es2022 --esModuleInterop --skipLibCheck

# Production Stage
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["sh", "-c", "npx prisma db push && node dist/prisma/seed.js && node dist/index.js"]
