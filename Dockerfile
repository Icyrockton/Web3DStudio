FROM node:alpine as build-stage
WORKDIR /app
COPY package*.json .
RUN npm --registry https://registry.npm.taobao.org install
COPY . .
RUN npm run build

FROM nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

