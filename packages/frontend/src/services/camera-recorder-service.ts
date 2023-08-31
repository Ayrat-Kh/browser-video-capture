import { Socket, io } from 'socket.io-client';

import {
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
  #stream: MediaStream | null = null;
  #socket: Socket;

  #isSending: boolean = false;
  #makeTestApi: boolean;
  #sensorName: string;
  #sensorId: string;

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
      } as WebSocketConnectParams,
    });

    // just to remember this context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public async initialize(options?: {
    onStop?: (service: CameraRecorderService) => void | Promise<void>;
  }): Promise<CameraRecorderService> {
    await this.close();

    while (this.#makeTestApi) {
      const result = await streamerPing();

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
      mimeType: this.getSupportedMimeType(),
    });

    this.#socket.connect();

    this.#socket?.on('disconnect', async () => {
      this.close();
      await options?.onStop?.(this);
    });

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

    this.#recorder?.start(20);
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
    if (this.#isSending) {
      return;
    }

    try {
      this.#isSending = true;
      this.#socket.sendBuffer = [];
      this.#socket.volatile
        .compress(true)
        .timeout(2_500)
        .emitWithAck(VIDEO_WS_EVENTS.UPLOAD_CHUNK, event.data);
    } catch (e) {
      console.error('drop the frame');
    } finally {
      this.#isSending = false;
    }
  }

  private getSupportedMimeType(): string {
    if (MediaRecorder.isTypeSupported('video/webm;codecs="vp9"')) {
      return 'video/webm;codecs="vp9"';
    }

    if (MediaRecorder.isTypeSupported('video/webm;codecs="vp8"')) {
      return 'video/webm;codecs="vp8"';
    }

    if (MediaRecorder.isTypeSupported('video/mp4;codecs=mp4a')) {
      return 'video/mp4;codecs=mp4a';
    }

    console.error('Unsupported media type');

    return '';
  }
}
