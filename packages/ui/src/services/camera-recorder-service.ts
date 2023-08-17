import { CAMERA_FRAME_RATE_MSEC, CAMERA_RESOLUTION } from '@webcam/common';

import { SERVER_UP_WAIT_TIME_MSEC } from 'src/constants/Config';
import { ping } from './api/ping-api';
import { recordVideoChunk } from './api/stream-api';

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
  #isSending = false;
  #stream: MediaStream | null = null;
  #isFirstChunk = true;

  constructor({
    sensorId,
    sensorName,
    makeTestApi,
  }: CameraRecorderServiceParams) {
    this.#makeTestApi = makeTestApi ?? false;
    this.#sensorId = sensorId;
    this.#sensorName = sensorName;

    // just to remember this context
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
  }

  public async initialize(): Promise<CameraRecorderService> {
    this.#isFirstChunk = true;
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
      },
    });

    this.#recorder = new MediaRecorder(this.#stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 150_000,
    });

    this.#recorder.addEventListener('dataavailable', this.handleDataAvailable);

    return this;
  }

  public start(): Promise<CameraRecorderService> {
    this.#recorder?.start(CAMERA_FRAME_RATE_MSEC);
    return Promise.resolve(this);
  }

  public close(): Promise<CameraRecorderService> {
    this.#recorder?.stop();
    this.#recorder?.removeEventListener(
      'dataavailable',
      this.handleDataAvailable,
    );
    this.#recorder = null;

    return Promise.resolve(this);
  }

  public getStream(): MediaStream | null {
    return this.#stream;
  }

  private async handleDataAvailable(event: BlobEvent): Promise<void> {
    if (this.#isSending) {
      console.log('dropped frame');
      return;
    }
    this.#isSending = true;

    await recordVideoChunk({
      chunk: event.data,
      sensorId: this.#sensorId,
      sensorName: this.#sensorName,
      isFirstChunk: this.#isFirstChunk ? 'true' : 'false',
    });

    this.#isFirstChunk = false;
    this.#isSending = false;
  }
}
