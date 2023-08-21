import {
  CAMERA_CAPTURE_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@webcam/common';

import { SOCKET_URL } from 'src/constants/Config';
import { Socket, io } from 'socket.io-client';

interface CameraStreamServiceParams {
  sensorId: string;
  canvas: HTMLCanvasElement;
}

export class CameraStreamService {
  #canvas: HTMLCanvasElement;
  #sensorId: string;
  #socket: Socket;
  #isFetching = false;

  constructor({ canvas, sensorId }: CameraStreamServiceParams) {
    this.#sensorId = sensorId;

    this.#socket = io(`${SOCKET_URL}${CAMERA_CAPTURE_NS}`, {
      autoConnect: false,
      protocols: ['websocket'],
      query: {
        sensorId: this.#sensorId,
      } as WebSocketConnectParams,
    });

    this.#canvas = canvas;
    this.handleRequest = this.handleRequest.bind(this);
  }

  public async initialize(): Promise<CameraStreamService> {
    await this.close();

    this.#socket.on(VIDEO_WS_EVENTS.LATEST_IMAGE, this.handleRequest);
    this.#socket.connect();
    this.#socket.emit(VIDEO_WS_EVENTS.SUBSCRIBE_TO_LATEST_IMAGE);

    return this;
  }

  public close(): Promise<CameraStreamService> {
    this.#socket?.close();

    return Promise.resolve(this);
  }

  private async handleRequest(chunk: ArrayBuffer) {
    if (this.#isFetching) {
      return;
    }
    this.#isFetching = true;

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
