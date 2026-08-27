FROM node:20-alpine

WORKDIR /app

# Install backend dependencies only. --ignore-scripts skips the
# postinstall hook (setup-env.js + frontend npm install), since the
# frontend runs in its own container and env vars are provided by
# docker-compose directly.
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY src ./src
COPY public ./public

EXPOSE 5007

CMD ["node", "src/server.js"]
