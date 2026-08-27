FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Runs the same Vite dev server used in local development
# (npm run dev), bound to 0.0.0.0 so it's reachable from the host.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
