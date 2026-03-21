FROM node:22-alpine AS builder

WORKDIR /app

COPY lit/ ./lit/
COPY web_core/ ./web_core/
COPY genetics-app/ ./genetics-app/

WORKDIR /app/lit
RUN npm install

WORKDIR /app/web_core
RUN npm install

WORKDIR /app/genetics-app
RUN npm install
RUN npm install @lit/context
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/genetics-app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
