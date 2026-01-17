FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=5050
ENV HOST=0.0.0.0

EXPOSE 5050

CMD ["npm", "start"]
