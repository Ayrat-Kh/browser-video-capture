import { CAMERA_FRAME_RATE_MSEC } from '@webcam/common';

import { getImageStream } from './api/stream-api';

interface CameraStreamServiceParams {
  canvas: HTMLCanvasElement;
  sensorId: string;
}

export class CameraStreamService {
  canvas: HTMLCanvasElement;
  sensorId: string;
  timer: NodeJS.Timeout | undefined = undefined;
  isFetching = false;

  constructor({ canvas, sensorId }: CameraStreamServiceParams) {
    this.canvas = canvas;
    this.sensorId = sensorId;
    this.handleRequest = this.handleRequest.bind(this);
  }

  public async start(): Promise<CameraStreamService> {
    this.timer = setInterval(this.handleRequest, CAMERA_FRAME_RATE_MSEC);

    return Promise.resolve(this);
  }

  public close() {
    clearInterval(this.timer);
  }

  async handleRequest() {
    if (this.isFetching) {
      return;
    }
    this.isFetching = true;

    try {
      const result = await getImageStream(this.sensorId);

      if (!result.isSuccess) {
        console.error('bad request');
        return;
      }

      const bitmap = await createImageBitmap(result.image);

      this.canvas
        .getContext('2d')
        ?.drawImage(bitmap, 0, 0, this.canvas.width, this.canvas.height);
    } catch (e) {
      console.error(e);
    } finally {
      this.isFetching = false;
    }
  }
}
