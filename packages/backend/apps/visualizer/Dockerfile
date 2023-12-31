# Building layer
FROM node:16-alpine as development

WORKDIR /app

# Copy configuration files
COPY ./packages/backend/package.json ./packages/backend/
COPY ./packages/common/package.json ./packages/common/
COPY ./package.json ./
COPY ./yarn.lock ./

# Install dependencies
RUN yarn

COPY ./packages/backend/tsconfig*.json ./packages/backend/
COPY ./packages/backend/apps/visualizer/tsconfig*.json ./packages/backend/apps/visualizer/
COPY ./packages/backend/apps/visualizer/src ./packages/backend/apps/visualizer/src
COPY ./packages/common/src ./packages/common/src

# Build application (produces dist/ folder)

RUN yarn build:backend

# Runtime (production) layer
FROM node:16-alpine as production

ENV APP_PORT=3001

WORKDIR /app

# Copy dependencies files
COPY ./packages/backend/package*.json ./packages/backend/
COPY ./packages/common/package*.json ./packages/common/
COPY ./package.json ./
COPY ./yarn.lock ./

# Install runtime dependecies (without dev/test dependecies)
RUN yarn --production=true

# Copy production build
COPY --from=development /app/packages/backend/dist/ ./dist/

# Expose application port
EXPOSE 3001

# Start application
CMD [ "node", "dist/backend/apps/visualizer/src/main.js" ]
