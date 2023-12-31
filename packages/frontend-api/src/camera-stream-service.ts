import { Socket, io } from 'socket.io-client';

import {
  type Size,
  type WebSocketConnectParams,
  VIDEO_WS_EVENTS,
  WS_NS,
} from '@webcam/common';

interface CameraStreamServiceParams {
  socketAppUrl: string;
}

interface CameraStreamServiceInitParams {
  organizationId: string;
  sensorId: string;
  canvas: HTMLCanvasElement;
}

export class CameraStreamService {
  #socketAppUrl: string;
  #canvas: HTMLCanvasElement;
  #socket: Socket;

  constructor({ socketAppUrl }: CameraStreamServiceParams) {
    this.#socketAppUrl = socketAppUrl;

    this.handleRequest = this.handleRequest.bind(this);
    this.handleRequestData = this.handleRequestData.bind(this);
  }

  public async initialize({
    canvas,
    sensorId,
    organizationId,
  }: CameraStreamServiceInitParams): Promise<CameraStreamService> {
    await this.close();

    this.#socket = io(`${this.#socketAppUrl}${WS_NS.STREAMER}`, {
      autoConnect: false,
      transports: ['websocket'],
      query: {
        sensorId,
        organizationId,
      } as Pick<WebSocketConnectParams, 'organizationId' | 'sensorId'>,
    });

    this.#socket.on(VIDEO_WS_EVENTS.IMAGE, this.handleRequest);
    this.#socket.connect();
    this.#canvas = canvas;

    return this;
  }

  public close(): Promise<CameraStreamService> {
    this.#socket?.off(VIDEO_WS_EVENTS.IMAGE, this.handleRequest);
    this.#socket?.close();

    return Promise.resolve(this);
  }

  private async handleRequest(chunk: ArrayBuffer, size: Size) {
    await this.handleRequestData(chunk, size);
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
    }
  }
}
