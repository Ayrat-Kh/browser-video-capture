import { Socket, io } from 'socket.io-client';

import {
  CAMERA_RESOLUTION,
  WS_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
  CAMERA_FRAME_RATE_MSEC,
  CAMERA_REDUCTION_RATE,
} from '@webcam/common';

import {
  SERVER_UP_WAIT_TIME_MSEC,
  STREAMER_SOCKET_URL,
} from 'src/constants/Config';

import { streamerPing } from './api/ping-api';
import { ChunkReducer } from './chunk-reducer';

interface CameraRecorderServiceParams {
  makeTestApi?: boolean;
  sensorName: string;
  sensorId: string;
  organizationId: string;
  cameraDeviceId: string;
}

export class CameraRecorderService {
  public onClose:
    | ((self: CameraRecorderService) => void | Promise<void>)
    | null = null;
  #recorder: MediaRecorder | null = null;
  #stream: MediaStream | null = null;
  #socket: Socket | null = null;

  #isSending: boolean = false;

  #cameraDeviceId: string | null = null;
  #sensorName: string | null = null;
  #sensorId: string | null = null;
  #chunkReducer = new ChunkReducer(
    CAMERA_FRAME_RATE_MSEC,
    CAMERA_REDUCTION_RATE,
  );

  constructor() {
    // just to remember class context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public static getCameraDevices(): Promise<
    { deviceId: string; deviceLabel: string }[]
  > {
    return (
      navigator?.mediaDevices?.enumerateDevices()?.then((devices) =>
        devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            deviceLabel: device.label,
          })),
      ) ?? []
    );
  }

  public async initialize({
    cameraDeviceId,
    sensorId,
    sensorName,
    makeTestApi = false,
    organizationId,
  }: CameraRecorderServiceParams): Promise<CameraRecorderService> {
    this.#sensorId = sensorId;
    this.#sensorName = sensorName;
    this.#cameraDeviceId = cameraDeviceId;

    await this.stop();

    this.#chunkReducer.reset();

    this.#socket = io(`${STREAMER_SOCKET_URL}${WS_NS.VIDEO_CAPTURE}`, {
      autoConnect: true,
      transports: ['websocket'],
      query: {
        sensorId: this.#sensorId,
        sensorName: this.#sensorName,
        organizationId,
        ...this.getScreenSize(),
      } as WebSocketConnectParams,
    });

    if (makeTestApi) {
      await this.waitForServerUp();
    }

    this.#stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: this.#cameraDeviceId,
        ...this.getScreenSize(),
        frameRate: {
          min: 10,
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
      this.stop();

      await this.onClose?.(this);
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

    this.#recorder?.start(10);
    return this;
  }

  public stop(): Promise<CameraRecorderService> {
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
    if (!this.#socket || this.#isSending || !this.#chunkReducer.tick()) {
      return;
    }

    try {
      this.#isSending = true;
      this.#socket.sendBuffer = [];
      this.#socket.volatile
        .compress(true)
        .timeout(2_500)
        .emitWithAck(
          VIDEO_WS_EVENTS.UPLOAD_CHUNK,
          event.data,
          this.getScreenSize(),
        );
    } catch (e) {
      console.error('drop the frame');
    } finally {
      this.#isSending = false;
    }
  }

  private async waitForServerUp(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await streamerPing();

      if (result.isSuccess) {
        break;
      }

      console.error('Server is unavailable, please check.');
      await new Promise((resolve) =>
        setTimeout(resolve, SERVER_UP_WAIT_TIME_MSEC),
      );
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

    throw new Error('Unsupported media type');
  }

  private getScreenSize(): { width: number; height: number } {
    if (screen.orientation.type === 'portrait-primary') {
      return {
        width: CAMERA_RESOLUTION.height,
        height: CAMERA_RESOLUTION.width,
      };
    }

    return CAMERA_RESOLUTION;
  }
}
