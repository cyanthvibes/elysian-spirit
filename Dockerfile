FROM node:lts AS build-runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npx prisma generate

RUN npm run build:full

FROM node:lts AS prod-runner

RUN apt-get update && \
    apt-get install postgresql-client -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build-runner /app/package*.json ./

RUN npm install --omit=dev

COPY --from=build-runner /app/dist ./dist
COPY --from=build-runner /app/prisma ./prisma
COPY --from=build-runner /app/.env.production .env.production

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "prod"]
