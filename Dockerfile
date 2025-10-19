FROM node:lts

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

ENV NODE_ENV=production

COPY prisma/schema.prisma prisma/schema.prisma

COPY . .

RUN npx prisma generate

RUN npm run build:full

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "prod"]