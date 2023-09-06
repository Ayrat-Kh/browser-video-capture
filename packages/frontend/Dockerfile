# Building layer
FROM node:16-alpine as development

ARG VITE_STREAMER_APP_URL
ARG VITE_STREAMER_SOCKET_URL
ARG VITE_PLAYER_SOCKET_URL

WORKDIR /app

# Copy configuration files

COPY ./packages/frontend-api/package.json ./packages/frontend-api/
COPY ./packages/frontend/package.json ./packages/frontend/
COPY ./packages/common/package.json ./packages/common/
COPY ./package.json ./
COPY ./yarn.lock ./

# Install dependencies
RUN yarn

COPY ./packages/frontend-api/tsconfig*.json ./packages/frontend-api/
COPY ./packages/frontend/tsconfig*.json ./packages/frontend/
COPY ./packages/frontend/src ./packages/frontend/src
COPY ./packages/frontend/index.html ./packages/frontend/index.html
COPY ./packages/frontend/vite.config.ts ./packages/frontend/vite.config.ts
COPY ./packages/frontend/postcss.config.js ./packages/frontend/postcss.config.js
COPY ./packages/frontend/tailwind.config.js ./packages/frontend/tailwind.config.js
COPY ./packages/frontend/components.json ./packages/frontend/components.json
COPY ./packages/frontend/.prettierrc ./packages/frontend/.prettierrc
COPY ./packages/frontend/.eslintrc.cjs ./packages/frontend/.eslintrc.cjs
COPY ./packages/common/src ./packages/common/src
COPY ./packages/frontend-api/src ./packages/frontend-api/src

RUN cat <<EOT >> ./packages/frontend/.env
VITE_STREAMER_APP_URL=${VITE_STREAMER_APP_URL}
VITE_STREAMER_SOCKET_URL=${VITE_STREAMER_SOCKET_URL}
VITE_PLAYER_SOCKET_URL=${VITE_PLAYER_SOCKET_URL}
EOT
RUN echo $(cat ./packages/frontend/.env)

RUN yarn build:frontend
# Runtime (production) layer
FROM nginx:stable-alpine as production

WORKDIR /app

COPY --from=development /app/packages/frontend/dist /usr/share/nginx/html
COPY ./packages/frontend/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose application port
EXPOSE 3000

# Start application
CMD ["nginx", "-g", "daemon off;"]
