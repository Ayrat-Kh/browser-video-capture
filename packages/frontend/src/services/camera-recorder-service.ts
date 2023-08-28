import { Socket, io } from 'socket.io-client';

import {
  CAMERA_FRAME_RATE_MSEC,
  CAMERA_RESOLUTION,
  WS_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@webcam/common';

import {
  SERVER_UP_WAIT_TIME_MSEC,
  STREAMER_SOCKET_URL,
} from 'src/constants/Config';
import { streamerPing } from './api/ping-api';

interface CameraRecorderServiceParams {
  makeTestApi?: boolean;
  sensorName: string;
  sensorId: string;
  organizationId: string;
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
    organizationId,
  }: CameraRecorderServiceParams) {
    this.#makeTestApi = makeTestApi ?? false;

    this.#sensorId = sensorId;
    this.#sensorName = sensorName;

    this.#socket = io(`${STREAMER_SOCKET_URL}${WS_NS.VIDEO_CAPTURE}`, {
      autoConnect: false,
      transports: ['websocket'],
      query: {
        sensorId: this.#sensorId,
        sensorName: this.#sensorName,
        organizationId,
        isRecorder: 'yes',
      } as WebSocketConnectParams,
    });

    // just to remember this context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public async initialize(): Promise<CameraRecorderService> {
    await this.close();

    while (this.#makeTestApi) {
      const result = await streamerPing();
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

    this.#socket?.on('disconnect', () => {
      this.close();
    });

    this.#recorder?.start(CAMERA_FRAME_RATE_MSEC);
    return this;
  }

  public close(): Promise<CameraRecorderService> {
    this.#recorder?.stream?.getTracks()?.forEach((x) => {
      x.stop();
    });

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
    this.#socket.compress(true).emit(VIDEO_WS_EVENTS.UPLOAD_CHUNK, event.data);
  }
}
