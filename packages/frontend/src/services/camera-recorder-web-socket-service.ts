import {
  CAMERA_FRAME_RATE_MSEC,
  CAMERA_RESOLUTION,
  CAMERA_CAPTURE_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@webcam/common';

import { SERVER_UP_WAIT_TIME_MSEC, SOCKET_URL } from 'src/constants/Config';
import { ping } from './api/ping-api';
import { Socket, io } from 'socket.io-client';

interface CameraRecorderServiceParams {
  makeTestApi?: boolean;
  sensorName: string;
  sensorId: string;
}

export class CameraRecorderService {
  #recorder: MediaRecorder | null = null;
  #makeTestApi: boolean;
  #sensorName: string;
  #sensorId: string;
  #stream: MediaStream | null = null;
  #socket: Socket;

  constructor({
    sensorId,
    sensorName,
    makeTestApi,
  }: CameraRecorderServiceParams) {
    this.#makeTestApi = makeTestApi ?? false;

    this.#sensorId = sensorId;
    this.#sensorName = sensorName;

    this.#socket = io(`${SOCKET_URL}${CAMERA_CAPTURE_NS}`, {
      autoConnect: false,
      protocols: ['websocket'],
      query: {
        sensorId: this.#sensorId,
        sensorName: this.#sensorName,
        isRecorder: 'yes',
      } as WebSocketConnectParams,
    });

    // just to remember this context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public async initialize(): Promise<CameraRecorderService> {
    await this.close();

    while (this.#makeTestApi) {
      const result = await ping();
      console.log('result', result);

      if (result.isSuccess) {
        break;
      }

      console.error('Server is unavailable, please check.');
      await new Promise((resolve) =>
        setTimeout(resolve, SERVER_UP_WAIT_TIME_MSEC),
      );
    }

    this.#stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...CAMERA_RESOLUTION,
        frameRate: {
          min: 15,
          ideal: 20,
          max: 20,
        },
      },
    });

    this.#recorder = new MediaRecorder(this.#stream, {
      mimeType: 'video/webm',
    });

    this.#socket.connect();

    this.#recorder.addEventListener('dataavailable', this.handleDataAvailable);

    return this;
  }

  public async start(): Promise<CameraRecorderService> {
    await new Promise<void>((resolve) => {
      const resolveWrapper = () => {
        resolve();
        this.#socket?.off('connect', resolveWrapper);
      };
      this.#socket?.on('connect', resolveWrapper);
    });

    this.#recorder?.start(CAMERA_FRAME_RATE_MSEC);
    return this;
  }

  public close(): Promise<CameraRecorderService> {
    this.#recorder?.stop();
    this.#recorder?.removeEventListener(
      'dataavailable',
      this.handleDataAvailable,
    );
    this.#recorder = null;
    this.#socket?.close();

    return Promise.resolve(this);
  }

  public getStream(): MediaStream | null {
    return this.#stream;
  }

  private async handleDataAvailable(event: BlobEvent): Promise<void> {
    this.#socket.emit(VIDEO_WS_EVENTS.UPLOAD_CHUNK, event.data);
  }
}
