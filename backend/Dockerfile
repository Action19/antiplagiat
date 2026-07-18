FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads reports

EXPOSE 5000

CMD ["sh", "-c", "node src/config/migrate.js && node server.js"]
