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
  // readonly #firstChunks = new Map<string, Buffer>();
  // readonly #realtimeVideoEmitters = new Map<string, EventEmitter>();

  readonly #encoders = new Map<string, ChildProcess>();
  readonly #latestImageFile = new Map<string, Buffer>();
  readonly #latestImageSubs = new Map<string, EventEmitter>();

  constructor(private readonly configurationService: ConfigurationService) {}

  public async saveChunk(
    data: Pick<StreamVideoChunkParams, 'sensorId' | 'sensorName'> & {
      chunk: Buffer;
    },
  ): Promise<void> {
    // if (data.isFirstChunk) {
    //   this.#resetEncoder(data.sensorId);
    // }

    const encoder = await this.#encoders.get(data.sensorId);
    encoder.stdin.write(data.chunk);

    return Promise.resolve();
  }

  // public getFirstFlvChunk(sensorId: string): Buffer {
  //   return this.#firstChunks.get(sensorId);
  // }

  public subscribeToLatestImageEmitter(
    sensorId: string,
    listener: (chunk: Buffer) => void,
  ) {
    if (!this.#latestImageSubs.has(sensorId)) {
      const ee = new EventEmitter({ captureRejections: false });
      ee.setMaxListeners(0);

      this.#latestImageSubs.set(sensorId, ee);
    }

    this.#latestImageSubs.get(sensorId).addListener('image', listener);
  }

  public unsubscribeToLatestImageEmitter(
    sensorId: string,
    listener: (chunk: Buffer) => void,
  ) {
    if (!this.#latestImageSubs.has(sensorId)) {
      return;
    }

    this.#latestImageSubs.get(sensorId).removeListener('image', listener);

    if (this.#latestImageSubs.get(sensorId).listenerCount('image') === 0) {
      this.#latestImageSubs.delete(sensorId);
    }
  }

  public async getLatestImage(sensorId: string): Promise<Buffer | null> {
    if (!this.#latestImageFile.has(sensorId)) {
      return null; // temp
      // const fileName = await this.#getLatestImageFileName(sensorId);
      // this.#latestImageFile.set(sensorId, fileName);
    }

    return this.#latestImageFile.get(sensorId);

    // const imageFileName = this.#latestImageFile.get(sensorId);

    // if (!imageFileName) {
    //   return null;
    // }

    // return createReadStream(join(imageFileName.folder, imageFileName.fileName));
  }

  public initEncoder(sensorId: string): Promise<ChildProcess> {
    if (!this.#encoders.has(sensorId)) {
      this.#resetEncoder(sensorId);
    }

    const ffmpegProcess = spawn(
      ffmpegPath as unknown as string,
      [
        ...['-i', '-'],
        '-an',
        // ...['-c:v', 'libx264'],
        // flv settings
        // // flv realtime
        // ...['-tune', 'zerolatency'],
        // ...['-f', 'flv'],
        // // ...['-preset', 'veryfast'],

        // image
        ...['-qscale:v', '10'],
        ...['-vf', 'fps=20'],
        ...['-pix_fmt', 'yuvj420p'],
        ...['-f', 'image2pipe'],
        'pipe:3',
      ],
      { stdio: ['pipe', 'pipe', null, 'pipe'] },
    );
    ffmpegProcess.stderr.on('data', (data: Buffer) => {
      console.log('data', data.toString());
    });
    ffmpegProcess.on('close', (error: Buffer) => {
      console.log('close:', error?.toString());
    });

    ffmpegProcess.on('message', (error: Buffer) => {
      console.log('message:', error.toString());
    });

    ffmpegProcess.on('error', (error: Buffer) => {
      console.log('error:', error.toString());
    });

    ffmpegProcess.stdio[3].on('data', (img: Buffer) => {
      this.#sendImage(sensorId, img);
    });

    this.#encoders.set(sensorId, ffmpegProcess);

    return Promise.resolve(ffmpegProcess);
  }

  // async #getEncoder(sensorId: string): Promise<Encoder> {
  //   if (!this.#encoders.has(sensorId)) {
  //     const subPath = join(sensorId, new Date().getTime().toString());
  //     const path = join(
  //       this.configurationService.get('contentFolder'),
  //       subPath,
  //     );

  //     await this.#initSensorImageFolder(subPath);

  //     const fwatcher = watch(path, undefined, (_, fileName: string) => {
  //       this.#latestImageFile.set(sensorId, {
  //         fileName,
  //         folder: join(this.configurationService.get('contentFolder'), subPath),
  //       });
  //     });

  //     const ffmpegProcess = spawn(
  //       ffmpegPath as unknown as string,
  //       [
  //         '-re',
  //         ...['-i', '-'],
  //         // ...['-c:v', 'libx264'],
  //         '-an',
  //         // // flv realtime
  //         // ...['-tune', 'zerolatency'],
  //         // ...['-f', 'flv'],
  //         // // ...['-preset', 'veryfast'],

  //         // image
  //         ...['-qscale:v', '10'],
  //         ...['-vf', 'fps=20'],
  //         ...['-pix_fmt', 'yuvj420p'],
  //         `${path}/%04d.jpg`,
  //       ],
  //       { stdio: ['pipe'] },
  //     );

  //     ffmpegProcess.on('close', (error: Buffer) => {
  //       console.log('close:', error?.toString());
  //     });

  //     ffmpegProcess.on('message', (error: Buffer) => {
  //       console.log('message:', error.toString());
  //     });

  //     ffmpegProcess.on('error', (error: Buffer) => {
  //       console.log('error:', error.toString());
  //     });

  //     console.log(`sensor: ${sensorId} path`, path);
  //     this.#encoders.set(sensorId, {
  //       ffmpegProc: ffmpegProcess,
  //       fwatcher,
  //     });
  //   }

  //   //    return this.#encoders.get(sensorId);
  // }

  #resetEncoder(sensorId: string) {
    if (this.#encoders.has(sensorId)) {
      const ffmpegProcess = this.#encoders.get(sensorId);
      this.#encoders.delete(sensorId);
      ffmpegProcess.kill();
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

  #sendImage(sensorId: string, chunk: Buffer) {
    let latestBuffer = this.#latestImageFile.get(sensorId);
    if (latestBuffer?.byteLength === 65_536) {
      latestBuffer = Buffer.concat([latestBuffer, chunk]);
    } else {
      latestBuffer = chunk;
    }

    this.#latestImageFile.set(sensorId, chunk);

    if (chunk.byteLength === 65_536) {
      return;
    }

    if (this.#latestImageSubs.has(sensorId)) {
      this.#latestImageSubs.get(sensorId).emit('image', latestBuffer);
    }
  }

  // async #getLatestImageFileName(sensorId: string): Promise<LatestImage | null> {
  //   try {
  //     const path = join(
  //       this.configurationService.get('contentFolder'),
  //       sensorId,
  //     );

  //     console.log('path', path);

  //     const folders = (await readdir(path))
  //       .map((x) => Number.parseFloat(x))
  //       .filter((x) => Number.isFinite(x))
  //       .sort((a, b) => b - a);

  //     console.log('folders count', folders.length);
  //     const [latestFolder] = folders;

  //     const lastUploadedFolder = join(path, `${latestFolder}`);

  //     console.log('folders count', folders.length);

  //     const [latestFile] = (await readdir(lastUploadedFolder))
  //       .map((x) => ({ time: Number.parseFloat(x), name: x }))
  //       .filter((x) => Number.isFinite(x.time))
  //       .sort((a, b) => b.time - a.time);

  //     return {
  //       fileName: latestFile.name,
  //       folder: lastUploadedFolder,
  //     };
  //   } catch (e) {
  //     console.log('error opening file', e);
  //     return null;
  //   }
  // }
}
