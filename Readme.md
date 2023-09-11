# Necessary software

    - Node js - 18
    - Docker
    - Make

# Install dependencies

```
yarn
```

# Run all tests

```
yarn test
```

## Frontend

#### Setup

Run the command below. Update env vars if needed. By default .env is configured to localhost.

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
