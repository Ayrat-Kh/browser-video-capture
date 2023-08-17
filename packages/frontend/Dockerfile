# Building layer
FROM node:16-alpine as development

WORKDIR /app

# Copy configuration files

COPY ./packages/frontend/package.json ./packages/frontend/
COPY ./packages/common/package.json ./packages/common/
COPY ./package.json ./
COPY ./yarn.lock ./

# Install dependencies
RUN yarn

COPY ./packages/frontend/tsconfig*.json ./packages/frontend/
COPY ./packages/frontend/src ./packages/frontend/src
COPY ./packages/frontend/index.html ./packages/frontend/index.html
COPY ./packages/frontend/vite.config.ts ./packages/frontend/vite.config.ts
COPY ./packages/common/src ./packages/common/src

ARG ENV_MODE
RUN echo "Mode: $ENV_MODE"

RUN yarn build:frontend --mode $ENV_MODE

# Runtime (production) layer
FROM nginx:stable-alpine as production

WORKDIR /app

COPY --from=development /app/packages/frontend/dist/ /usr/share/nginx/html/
COPY ./packages/frontend/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose application port
EXPOSE 3000

# Start application
CMD ["nginx", "-g", "daemon off;"]
