# build environment
FROM node:alpine AS build

ARG BACKEND_URL="https://rest-api-84689730896.europe-west3.run.app/api/v1.0"
ENV VITE_BACKEND_URL=$BACKEND_URL

WORKDIR /app

COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]