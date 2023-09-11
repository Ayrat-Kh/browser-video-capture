# Necessary software

    - Node js - 18
    - Docker
    - Make

# Install dependencies

```
yarn
```

# Run all tests

Dependencies should be installed

```
yarn test
```

## Run docker-compose

Please keep in mind that `docker-compose` is designed for the localhost. For other environments build args and env variables should be configured.

Frontend - see [here](./packages/frontend//Readme.md).

Streamer backend - see [here](./packages/backend/Readme.md).

```
docker-compose up
```

## Frontend

#### Setup

Run the command below. Update env vars if needed. By default `.env` is configured to localhost.

```
cp ./packages/frontend/.env.example ./packages/frontend/.env
```

#### Running

```
yarn dev:frontend
```

#### Build docker

Run the command below if it wasn't.

```
cp ./.env.example ./.env
```

Update all vars in section # FRONTEND. By default .env is configured to localhost.

Build docker image by running the command below.

```
make build-frontend
```

Push docker image by running the command below.

```
make push-frontend
```

## Streamer backend

#### Running

```
yarn dev:streamer
```

#### Build docker

Run the command below if it wasn't.

```
cp ./.env.example ./.env
```

Update all vars in section # STREAMER. By default .env is configured to localhost.

Build docker image by running the command below.

```
make build-streamer
```

Push docker image by running the command below.

```
make push-streamer
```

## Visualizer backend

#### Running

```
yarn dev:visualizer
```

#### Build docker

Update all vars in section # VISUALIZER. By default .env is configured to localhost.

Build docker image by running the command below.

```
make build-visualizer
```

Push docker image by running the command below.

```
make push-visualizer
```

## Streamer architecture

This is a high level view of the components

streamer (frontend)

```
getUserMedia -> MediaREcorder (video stream) -> video-stream (output)
```

```
 |
 |      send video-stream over socket.io
\ /
```

streamer (backend) - for more info please check [here](./packages/backend/Readme.md)

```
video-stream (input) -> ffmpeg -> image (output),
```

```
 |
 |      send over image socket.io
\ /
```

visualizer (backend)

```
image (input) -> restream to visualizer -> image (output)
```

```
 |
 |      send over image socket.io
\ /
```

visualizer (frontend)

```
image (input) -> draw in canvas
```

## Streamer and visualizer info

See readme [here](./packages/frontend-api/Readme.md)

## Project entry points

## Core parts

#### Streamer backend

[entry point: main](./packages/backend/apps/streamer/src/main.ts) - streamer entry point.

[video-capture.gateway](./packages/backend/apps/streamer/src/video-capture/video-capture.gateway.ts) - this video stream capture web socket gateway.

[video-capture.gateway](./packages/backend/apps/streamer/src/video-capture/video-capture.service.ts) - this service for converting video stream to set of images using ffmpeg and emitting the images to [video-capture.listener](./packages/backend/apps/streamer/src/video-capture/video-capture.listener.ts).

[ImageServiceSocketProvider](./packages/backend/apps/streamer/src/providers/ImageServiceSocketProvider.ts) - web socket connector between streamer and visualizer. Can be dropped when won't be used as well as [ImageServiceSocketProviderStrategy](./packages/backend/apps/streamer/src/providers/ImageServiceSocketProviderStrategy.ts).

#### Visualizer backend

[entry point: main](./packages/backend/apps/visualizer/src/main.ts) - visualizer entry point.

[entry point: main](./packages/backend/apps/visualizer/src/image-streamer-provider/image-streamer-provider.gateway.ts) - this web socket gateway for receiving images from streamer backend and broadcasting to [visualizer.gateway](./packages/backend/apps/visualizer/src/visualizer/visualizer.gateway.ts) that will notify all connected frontend users.

#### Frontend API

[camera-recorder-service](./packages/frontend-api/src/camera-recorder-service.ts) - this API can be used for connecting FE with streamer backend

[camera-stream-service](./packages/frontend-api/src/camera-stream-service.ts) - this API can be used for connecting FE with visualizer backend

#### Frontend - demo app

The app only is used for demo purposes. No helpful code is placed in the package.

[main](./packages/frontend/src/main.tsx) - This file is an entry point for the react app.

[Example of usage: camera-recorder-service](./packages/frontend/src/components/Streamer/Streamer.tsx)

[Example of usage: camera-stream-service](./packages/frontend/src/components/ImagePlayer/ImagePlayer.tsx)
