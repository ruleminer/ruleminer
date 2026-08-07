# ---- Stage 1: Build the Angular App ----
FROM node:18 AS builder

WORKDIR /app
ENV PATH="./node_modules/.bin:$PATH"

ARG HOST="localhost"
ARG REST_API_HOST_PORT="8000"
ARG KEYCLOAK_HTTP_HOST_PORT="8080"

COPY . .

RUN sh ./build_env.sh $HOST $REST_API_HOST_PORT $KEYCLOAK_HTTP_HOST_PORT


RUN npm install
RUN npm ci

RUN npm run build --configuration rolap --sourceMap=true --output-hashing=all

# ---- Stage 2: Serve the App with nginx ----
FROM nginx:1.21.0-alpine
COPY --from=builder /app/dist/rolap/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
