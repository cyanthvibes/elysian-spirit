FROM node:alpine

WORKDIR /app

RUN apk update && apk add --no-cache postgresql17-client

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