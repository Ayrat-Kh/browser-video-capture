import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, stat, readdir } from 'node:fs/promises';
import { FSWatcher, ReadStream, createReadStream, watch } from 'node:fs';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import * as ffmpegPath from 'ffmpeg-static';

import type { StreamVideoChunkParams } from '@webcam/common';
import { ConfigurationService } from 'src/config/configuation.service';

interface Encoder {
  ffmpegProc: ChildProcess;
  fwatcher: FSWatcher;
}

interface LatestImage {
  folder: string;
  fileName: string;
}

@Injectable()
export class CameraCaptureService {
  // readonly #firstChunks = new Map<string, Buffer>();
  // readonly #realtimeVideoEmitters = new Map<string, EventEmitter>();

  readonly #encoders = new Map<string, Encoder>();
  readonly #latestImageFile = new Map<string, LatestImage>();

  constructor(private readonly configurationService: ConfigurationService) {}

  public async saveChunk(
    data: Pick<StreamVideoChunkParams, 'sensorId' | 'sensorName'> & {
      chunk: Buffer;
      isFirstChunk: boolean;
    },
  ): Promise<void> {
    if (data.isFirstChunk) {
      // this.#resetFirstChunk(data.sensorId);

      this.#resetEncoder(data.sensorId);
    }

    const encoder = await this.#getEncoder(data.sensorId);
    // console.log(
    //   `Write chunk for ${data.sensorId}, length: ${data.chunk.byteLength}`,
    // );
    encoder.ffmpegProc.stdin.write(data.chunk);

    return Promise.resolve();
  }

  // public getFirstFlvChunk(sensorId: string): Buffer {
  //   return this.#firstChunks.get(sensorId);
  // }

  // public subscribeVideoStreamToEmitter(
  //   sensorId: string,
  //   listener: (chunk: Buffer) => void,
  // ) {
  //   if (!this.#realtimeVideoEmitters.has(sensorId)) {
  //     const ee = new EventEmitter({ captureRejections: false });
  //     ee.setMaxListeners(0);

  //     this.#realtimeVideoEmitters.set(sensorId, ee);
  //   }

  //   this.#realtimeVideoEmitters.get(sensorId).addListener('chunk', listener);
  // }

  // public unsubscribeVideoStreamToEmitter(
  //   sensorId: string,
  //   listener: (chunk: Buffer) => void,
  // ) {
  //   if (!this.#realtimeVideoEmitters.has(sensorId)) {
  //     return;
  //   }

  //   this.#realtimeVideoEmitters.get(sensorId).removeListener('chunk', listener);

  //   if (
  //     this.#realtimeVideoEmitters.get(sensorId).listenerCount('chunk') === 0
  //   ) {
  //     this.#realtimeVideoEmitters.delete(sensorId);
  //   }
  // }

  public async getLatestImage(sensorId: string): Promise<ReadStream | null> {
    if (!this.#latestImageFile.has(sensorId)) {
      const fileName = await this.#getLatestImageFileName(sensorId);

      this.#latestImageFile.set(sensorId, fileName);
    }

    const imageFileName = this.#latestImageFile.get(sensorId);

    if (!imageFileName) {
      return null;
    }

    return createReadStream(join(imageFileName.folder, imageFileName.fileName));
  }

  async #getEncoder(sensorId: string): Promise<Encoder> {
    if (!this.#encoders.has(sensorId)) {
      // await this.#initSensorImageFolder(sensorId);

      const subPath = join(sensorId, new Date().getTime().toString());
      const path = join(
        this.configurationService.get('contentFolder'),
        subPath,
      );

      await this.#initSensorImageFolder(subPath);

      const fwatcher = watch(path, undefined, (_, fileName: string) => {
        this.#latestImageFile.set(sensorId, {
          fileName,
          folder: join(this.configurationService.get('contentFolder'), subPath),
        });
      });

      const ffmpegProcess = spawn(
        ffmpegPath as unknown as string,
        [
          '-re',
          ...['-i', '-'],
          // ...['-c:v', 'libx264'],
          '-an',
          // // flv realtime
          // ...['-tune', 'zerolatency'],
          // ...['-f', 'flv'],
          // // ...['-preset', 'veryfast'],

          // image
          ...['-qscale:v', '10'],
          ...['-vf', 'fps=20'],
          ...['-pix_fmt', 'yuvj420p'],
          `${path}/%04d.jpg`,
        ],
        { stdio: ['pipe'] },
      );

      // flv stream
      // ffmpegProcess.stdio[1].on('data', (chunk: Buffer) => {
      //   this.#initFirstChunk(sensorId, chunk);
      //   this.#pushFlvVideoChunk(sensorId, chunk);
      // });

      ffmpegProcess.stderr.on('data', (error: Buffer) => {
        console.log('verb:', error.toString());
      });

      this.#encoders.set(sensorId, {
        ffmpegProc: ffmpegProcess,
        fwatcher,
      });
    }

    return this.#encoders.get(sensorId);
  }

  #resetEncoder(sensorId: string) {
    if (this.#encoders.has(sensorId)) {
      const ffmpegProcess = this.#encoders.get(sensorId);
      this.#encoders.delete(sensorId);
      ffmpegProcess.ffmpegProc?.kill();
      ffmpegProcess.fwatcher?.close();
    }
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

  async #getLatestImageFileName(sensorId: string): Promise<LatestImage | null> {
    try {
      const path = join(
        this.configurationService.get('contentFolder'),
        sensorId,
      );
      const [latestFolder] = (await readdir(path))
        .map((x) => Number.parseFloat(x))
        .filter((x) => Number.isFinite(x))
        .sort((a, b) => b - a);

      const lastUploadedFolder = join(path, `${latestFolder}`);

      const [latestFile] = (await readdir(lastUploadedFolder))
        .map((x) => ({ time: Number.parseFloat(x), name: x }))
        .filter((x) => Number.isFinite(x.time))
        .sort((a, b) => b.time - a.time);

      return {
        fileName: latestFile.name,
        folder: lastUploadedFolder,
      };
    } catch (e) {
      return null;
    }
  }
}
