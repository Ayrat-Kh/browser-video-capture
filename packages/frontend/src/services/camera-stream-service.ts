import { Socket, io } from 'socket.io-client';

import {
  type Size,
  type WebSocketConnectParams,
  VIDEO_WS_EVENTS,
  WS_NS,
} from '@webcam/common';

import { PLAYER_SOCKET_URL } from 'src/constants/Config';

interface CameraStreamServiceParams {
  organizationId: string;
  sensorId: string;
  canvas: HTMLCanvasElement;
}

export class CameraStreamService {
  #sensorId: string;
  #organizationId: string;

  #canvas: HTMLCanvasElement;
  #socket: Socket;
  #isFetching = false;

  constructor({ canvas, sensorId, organizationId }: CameraStreamServiceParams) {
    this.#organizationId = organizationId;
    this.#sensorId = sensorId;

    this.#socket = io(`${PLAYER_SOCKET_URL}${WS_NS.STREAMER}`, {
      autoConnect: false,
      transports: ['websocket'],
      query: {
        sensorName: '',
        sensorId: this.#sensorId,
        organizationId: this.#organizationId,
      } as WebSocketConnectParams,
    });

    this.#canvas = canvas;
    this.handleRequest = this.handleRequest.bind(this);
    this.handleRequestData = this.handleRequestData.bind(this);
  }

  public async initialize(): Promise<CameraStreamService> {
    await this.close();

    this.#socket.connect();
    this.#socket.on(VIDEO_WS_EVENTS.IMAGE, this.handleRequest);

    return this;
  }

  public close(): Promise<CameraStreamService> {
    this.#socket?.off(VIDEO_WS_EVENTS.IMAGE, this.handleRequest);
    this.#socket?.close();

    return Promise.resolve(this);
  }

  private async handleRequest(chunk: ArrayBuffer, size: Size) {
    if (this.#isFetching) {
      return;
    }
    this.#isFetching = true;
    await this.handleRequestData(chunk, size);
    this.#isFetching = false;
  }

  private async handleRequestData(chunk: ArrayBuffer, size: Size) {
    if (!chunk) {
      return;
    }

    if (this.#canvas.width !== size.width) {
      this.#canvas.width = size.width;
    }

    if (this.#canvas.height !== size.height) {
      this.#canvas.height = size.height;
    }

    try {
      const bitmap = await createImageBitmap(
        new Blob([chunk], { type: 'image/jpeg' }),
      );

      this.#canvas
        .getContext('2d')
        ?.drawImage(bitmap, 0, 0, this.#canvas.width, this.#canvas.height);
    } catch (e) {
      console.error(e);
    } finally {
      this.#isFetching = false;
    }
  }
}
