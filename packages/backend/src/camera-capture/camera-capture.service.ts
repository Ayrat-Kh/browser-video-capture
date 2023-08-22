import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { EventEmitter } from 'node:stream';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import * as ffmpegPath from 'ffmpeg-static';

import type { StreamVideoChunkParams } from '@webcam/common';
import { ConfigurationService } from '../config/configuation.service';

@Injectable()
export class CameraCaptureService {
  readonly #realtimeVideoFirstChunks = new Map<string, Buffer>();
  readonly #realtimeVideoEmitters = new Map<string, EventEmitter>();

  readonly #encoders = new Map<string, ChildProcess>();
  readonly #latestImageFile = new Map<string, Buffer>();
  readonly #upcomingLatestImageFile = new Map<string, Buffer>();

  constructor(private readonly configurationService: ConfigurationService) {}

  public async saveChunk(
    data: Pick<StreamVideoChunkParams, 'sensorId' | 'sensorName'> & {
      chunk: Buffer;
    },
  ): Promise<void> {
    const encoder = this.#encoders.get(data.sensorId);
    encoder.stdin.write(data.chunk);

    return Promise.resolve();
  }

  public getFirstFlvChunk(sensorId: string): Buffer {
    return this.#realtimeVideoFirstChunks.get(sensorId);
  }

  public getImageChunk(sensorId: string): Buffer {
    return this.#latestImageFile.get(sensorId);
  }

  public subscribeToVideoStream(
    sensorId: string,
    listener: (chunk: Buffer) => void,
  ) {
    if (!this.#realtimeVideoEmitters.has(sensorId)) {
      const ee = new EventEmitter({ captureRejections: false });
      ee.setMaxListeners(0);

      this.#realtimeVideoEmitters.set(sensorId, ee);
    }

    this.#realtimeVideoEmitters.get(sensorId).addListener('chunk', listener);
  }

  public unsubscribeFromVideoStream(
    sensorId: string,
    listener: (chunk: Buffer) => void,
  ) {
    if (!this.#realtimeVideoEmitters.has(sensorId)) {
      return;
    }

    this.#realtimeVideoEmitters.get(sensorId).removeListener('chunk', listener);

    if (
      this.#realtimeVideoEmitters.get(sensorId).listenerCount('chunk') === 0
    ) {
      this.#realtimeVideoEmitters.delete(sensorId);
    }
  }

  public initEncoder(sensorId: string): Promise<ChildProcess> {
    this.#resetEncoder(sensorId);

    console.log(`SensorId: ${sensorId}: init encoder`);

    const ffmpegProcess = spawn(
      ffmpegPath as unknown as string,
      [
        ...['-i', '-'],
        '-an',

        // image
        ...['-c:v', 'mjpeg'],
        ...['-qscale:v', '4'],
        ...['-vf', 'fps=20'],
        ...['-pix_fmt', 'yuvj420p'],
        ...['-f', 'image2pipe'],
        'pipe:3',

        // flv settings
        ...['-c:v', 'libx264'],
        ...['-tune', 'zerolatency'],
        ...['-preset', 'veryfast'],
        ...['-f', 'flv'],
        'pipe:4',
      ],
      { stdio: ['pipe', 'pipe', null, 'pipe', 'pipe'] },
    );
    // ffmpegProcess.stderr.on('data', (data: Buffer) => {
    //   console.log('data', data.toString());
    // });
    ffmpegProcess.on('close', (error: Buffer) => {
      console.log('close:', error?.toString());
    });

    ffmpegProcess.on('message', (error: Buffer) => {
      console.log('message:', error.toString());
    });

    ffmpegProcess.on('error', (error: Buffer) => {
      console.log('error:', error.toString());
    });

    ffmpegProcess.stdio[4].on('data', (videoChunk: Buffer) => {
      this.#initFirstChunk(sensorId, videoChunk);
      this.#sendChunk(sensorId, videoChunk);
    });

    ffmpegProcess.stdio[3].on('data', (image: Buffer) => {
      this.#sendImage(sensorId, image);
    });

    this.#encoders.set(sensorId, ffmpegProcess);

    return Promise.resolve(ffmpegProcess);
  }

  #resetEncoder(sensorId: string) {
    console.log(`SensorId: ${sensorId}: reset encoder`);

    if (this.#encoders.has(sensorId)) {
      const ffmpegProcess = this.#encoders.get(sensorId);
      this.#encoders.delete(sensorId);
      ffmpegProcess.kill();
    }

    this.#realtimeVideoFirstChunks.delete(sensorId);
    this.#realtimeVideoEmitters?.get(sensorId)?.removeAllListeners('chunk');
    this.#realtimeVideoEmitters?.delete(sensorId);

    this.#latestImageFile.delete(sensorId);
  }

  async #initSensorImageFolder(sensorId: string) {
    const path = join(this.configurationService.get('contentFolder'), sensorId);

    try {
      if ((await stat(path)).isDirectory()) {
        return;
      }
    } catch (e) {
      await mkdir(path, {
        recursive: true,
      });
    }
  }

  #initFirstChunk(sensorId: string, chunk: Buffer) {
    if (!this.#realtimeVideoFirstChunks.has(sensorId)) {
      this.#realtimeVideoFirstChunks.set(sensorId, chunk);
    }
  }

  #sendChunk(sensorId: string, chunk: Buffer) {
    if (this.#realtimeVideoEmitters.has(sensorId)) {
      this.#realtimeVideoEmitters.get(sensorId).emit('chunk', chunk);
    }
  }

  #sendImage(sensorId: string, chunk: Buffer) {
    let latestBuffer = this.#upcomingLatestImageFile.get(sensorId);
    if (latestBuffer?.byteLength % 65_536 === 0) {
      latestBuffer = Buffer.concat([latestBuffer, chunk]);
    } else {
      latestBuffer = chunk;
    }

    this.#upcomingLatestImageFile.set(sensorId, chunk);

    if (chunk.byteLength === 65_536) {
      return;
    }

    this.#latestImageFile.set(sensorId, latestBuffer);
  }
}
