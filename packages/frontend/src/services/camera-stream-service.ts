import {
  CAMERA_CAPTURE_NS,
  CAMERA_FRAME_RATE_MSEC,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@webcam/common';

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

    this.#socket = io(`${PLAYER_SOCKET_URL}${CAMERA_CAPTURE_NS}`, {
      autoConnect: false,
      protocols: ['websocket'],
      query: {
        isRecorder: 'no',
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

    this.#socket.on(VIDEO_WS_EVENTS.LATEST_IMAGE, this.handleRequestData);
    this.#timer = setInterval(this.handleRequest, CAMERA_FRAME_RATE_MSEC);

    return this;
  }

  public close(): Promise<CameraStreamService> {
    this.#socket?.close();
    clearInterval(this.#timer);

    return Promise.resolve(this);
  }

  private async handleRequest() {
    if (this.#isFetching) {
      return;
    }
    this.#isFetching = true;
    this.#socket.emit(VIDEO_WS_EVENTS.LATEST_IMAGE_REQUEST);
  }

  private async handleRequestData(chunk: ArrayBuffer) {
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
