FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json

RUN npm ci --workspace server

COPY server ./server

WORKDIR /app/server

RUN npx prisma generate && npm run build

EXPOSE 4000

CMD ["npm", "run", "start:docker"]
