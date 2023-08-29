import { VIDEO_WS_EVENTS, WS_NS, WebSocketConnectParams } from '@webcam/common';

import { PLAYER_SOCKET_URL } from 'src/constants/Config';
import { Socket, io } from 'socket.io-client';

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
  #timer: NodeJS.Timeout | undefined;
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
    clearInterval(this.#timer);

    return Promise.resolve(this);
  }

  private async handleRequest(chunk: ArrayBuffer, callback: VoidFunction) {
    if (this.#isFetching) {
      callback?.();
      return;
    }

    this.#isFetching = true;
    await this.handleRequestData(chunk);
    this.#isFetching = false;

    callback?.();
  }

  private async handleRequestData(chunk: ArrayBuffer) {
    if (!chunk) {
      return;
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
