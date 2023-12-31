import { Socket, io } from 'socket.io-client';

import {
  WS_NS,
  VIDEO_WS_EVENTS,
  type WebSocketConnectParams,
  type Size,
} from '@webcam/common';

import {
  CAMERA_RESOLUTION,
  CAMERA_FRAME_RATE_MSEC,
  SERVER_UP_WAIT_TIME_MSEC,
} from './constants';

import { streamerPing } from './api/ping-api';

interface CameraRecorderServiceParams {
  makeTestApi?: boolean;
  frameRate?: number;
  socketAppUrl: string;
  appUrl: string;
}

interface CameraRecorderServiceInitParams {
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
  #makeTestApi: boolean;
  #isSending = false;
  #frameRate: number;
  #appUrl: string;
  #socketAppUrl: string;

  constructor({
    socketAppUrl,
    appUrl,
    frameRate = CAMERA_FRAME_RATE_MSEC,
    makeTestApi = false,
  }: CameraRecorderServiceParams) {
    this.#appUrl = appUrl;
    this.#socketAppUrl = socketAppUrl;

    this.#frameRate = frameRate;
    this.#makeTestApi = makeTestApi;

    // just to remember class context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public static async getCameraDevices(): Promise<
    { deviceId: string; deviceLabel: string }[]
  > {
    await navigator.mediaDevices.getUserMedia({ audio: false, video: true });

    return (
      navigator?.mediaDevices?.enumerateDevices()?.then((devices) => {
        return devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            deviceLabel: device.label,
          }));
      }) ?? []
    );
  }

  public static getScreenSize(): Size {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      navigator?.userAgent ?? '',
    );

    if (isMobile) {
      return {
        width: CAMERA_RESOLUTION.height,
        height: CAMERA_RESOLUTION.width,
      };
    }

    return CAMERA_RESOLUTION;
  }

  public async initialize({
    cameraDeviceId,
    sensorId,
    sensorName,
    organizationId,
  }: CameraRecorderServiceInitParams): Promise<CameraRecorderService> {
    this.#isSending = false;
    await this.stop();

    this.#socket = io(`${this.#socketAppUrl}${WS_NS.VIDEO_CAPTURE}`, {
      autoConnect: false,
      transports: ['websocket'],
      query: {
        sensorId,
        sensorName,
        organizationId,
        ...CameraRecorderService.getScreenSize(),
      } as WebSocketConnectParams,
    });

    if (this.#makeTestApi) {
      await this.waitForServerUp();
    }

    this.#stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: cameraDeviceId,
        ...CameraRecorderService.getScreenSize(),
        frameRate: {
          min: 10,
          ideal: 20,
          max: 20,
        },
      },
    });

    this.#recorder = new MediaRecorder(this.#stream, {
      mimeType: CameraRecorderService.getSupportedMimeType(),
    });

    this.#socket?.on('disconnect', async () => {
      this.stop();

      await this.onClose?.(this);
    });

    this.#recorder.addEventListener('dataavailable', this.handleDataAvailable);

    return this;
  }

  public async start(): Promise<CameraRecorderService> {
    this.#socket?.connect();

    await new Promise<void>((resolve) => {
      const resolveWrapper = () => {
        resolve();
        this.#socket?.off('connect', resolveWrapper);
      };

      this.#socket?.on('connect', resolveWrapper);
    });

    this.#recorder?.start(this.#frameRate);

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

  private async waitForServerUp(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await streamerPing(this.#appUrl);

      if (result.isSuccess) {
        break;
      }

      console.error('Server is unavailable, please check.');
      await new Promise((resolve) =>
        setTimeout(resolve, SERVER_UP_WAIT_TIME_MSEC),
      );
    }
  }

  private static getSupportedMimeType(): string {
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

  private async handleDataAvailable(event: BlobEvent): Promise<void> {
    if (!this.#socket || this.#isSending) {
      return;
    }

    this.#isSending = true;

    const data = await event.data.arrayBuffer();

    this.#socket.sendBuffer = [];
    this.#socket?.volatile.emit(VIDEO_WS_EVENTS.UPLOAD_CHUNK, data);

    this.#isSending = false;
  }
}
