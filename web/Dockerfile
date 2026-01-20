# Build stage
FROM node:20-alpine AS builder

# Build-time API base URLs (used by Vite)
ARG VITE_CATALOG_API_BASE_URL
ARG VITE_FORMS_API_BASE_URL

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Ensure Vite sees the variables at build time
ENV VITE_CATALOG_API_BASE_URL=${VITE_CATALOG_API_BASE_URL}
ENV VITE_FORMS_API_BASE_URL=${VITE_FORMS_API_BASE_URL}

RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
