import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { EventEmitter } from 'node:stream';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import * as ffmpegPath from 'ffmpeg-static';

import {
  type StreamVideoChunkParams,
  type ChunkIdentifier,
  identifierToString,
} from '@common';
import { ConfigurationService } from '../config/configuration.service';

@Injectable()
export class StreamerService {
  readonly #realtimeVideoFirstChunks = new Map<string, Buffer>();
  readonly #realtimeVideoEmitters = new Map<string, EventEmitter>();

  readonly #encoders = new Map<string, ChildProcess>();
  readonly #upcomingLatestImageFile = new Map<string, Buffer>();

  constructor(private readonly configurationService: ConfigurationService) {}

  public async saveChunk(
    data: Pick<
      StreamVideoChunkParams,
      'sensorId' | 'sensorName' | 'organizationId'
    > & {
      chunk: Buffer;
    },
  ): Promise<void> {
    const encoder = this.#encoders.get(identifierToString(data));
    encoder.stdin?.write(data.chunk);

    return Promise.resolve();
  }

  public getFirstFlvChunk(identifier: ChunkIdentifier): Buffer {
    return this.#realtimeVideoFirstChunks.get(identifierToString(identifier));
  }

  public subscribeToVideoStream(
    identifier: ChunkIdentifier,
    listener: (chunk: Buffer) => void,
  ) {
    const id = identifierToString(identifier);

    if (!this.#realtimeVideoEmitters.has(id)) {
      const ee = new EventEmitter({ captureRejections: false });
      ee.setMaxListeners(0);

      this.#realtimeVideoEmitters.set(id, ee);
    }

    this.#realtimeVideoEmitters.get(id).addListener('chunk', listener);
  }

  public unsubscribeFromVideoStream(
    identifier: ChunkIdentifier,
    listener: (chunk: Buffer) => void,
  ) {
    const id = identifierToString(identifier);

    if (!this.#realtimeVideoEmitters.has(id)) {
      return;
    }

    this.#realtimeVideoEmitters.get(id).removeListener('chunk', listener);

    if (this.#realtimeVideoEmitters.get(id).listenerCount('chunk') === 0) {
      this.#realtimeVideoEmitters.delete(id);
    }
  }

  public initEncoder(identifier: ChunkIdentifier): Promise<ChildProcess> {
    this.resetEncoder(identifier);

    console.log(
      `Org id: ${identifier.organizationId} SensorId: ${identifier.sensorId}: init encoder`,
    );

    const ffmpegProcess = spawn(
      ffmpegPath as unknown as string,
      [
        ...['-i', '-'],
        '-an',

        // image
        ...['-c:v', 'mjpeg'],
        ...['-qscale:v', '5'],
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

    ffmpegProcess.on('close', (error: Buffer) => {
      console.log('close:', error?.toString());
    });

    ffmpegProcess.stdio[4].on('data', (videoChunk: Buffer) => {
      this.#initFirstChunk(identifier, videoChunk);
      this.#sendChunk(identifier, videoChunk);
    });

    ffmpegProcess.stdio[3].on('data', (image: Buffer) => {
      this.#sendImage(identifier, image);
    });

    this.#encoders.set(identifierToString(identifier), ffmpegProcess);

    return Promise.resolve(ffmpegProcess);
  }

  resetEncoder(identifier: ChunkIdentifier) {
    console.log(
      `Org id: ${identifier.organizationId} SensorId: ${identifier.sensorId}: reset encoder`,
    );

    const id = identifierToString(identifier);

    if (this.#encoders.has(id)) {
      const ffmpegProcess = this.#encoders.get(id);
      this.#encoders.delete(id);
      ffmpegProcess.kill();
    }

    this.#realtimeVideoFirstChunks.delete(id);
    this.#realtimeVideoEmitters?.get(id)?.removeAllListeners('chunk');
    this.#realtimeVideoEmitters?.delete(id);
  }

  async initSensorImageFolder(identifier: ChunkIdentifier) {
    const path = this.#identifierToPath(identifier);

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

  #initFirstChunk(identifier: ChunkIdentifier, chunk: Buffer) {
    const id = identifierToString(identifier);
    if (!this.#realtimeVideoFirstChunks.has(id)) {
      this.#realtimeVideoFirstChunks.set(id, chunk);
    }
  }

  #sendChunk(identifier: ChunkIdentifier, chunk: Buffer) {
    const id = identifierToString(identifier);
    if (this.#realtimeVideoEmitters.has(id)) {
      this.#realtimeVideoEmitters.get(id).emit('chunk', chunk);
    }
  }

  async #sendImage(identifier: ChunkIdentifier, chunk: Buffer) {
    const BUFFER_SIZE = 65_536; // ffmpeg max buf size id 65_536 if we go above we should concat several sections

    const id = identifierToString(identifier);
    let latestBuffer = this.#upcomingLatestImageFile.get(id);
    if (latestBuffer?.byteLength % BUFFER_SIZE === 0) {
      latestBuffer = Buffer.concat([latestBuffer, chunk]);
    } else {
      latestBuffer = chunk;
    }

    this.#upcomingLatestImageFile.set(id, chunk);

    if (chunk.byteLength === BUFFER_SIZE) {
      return;
    }

    if (!latestBuffer.includes('JFIF')) {
      return;
    }

    // save image to folder
    const filePath = join(
      this.#identifierToPath(identifier),
      `${new Date().getTime()}.jpg`,
    );

    await writeFile(filePath, latestBuffer);
  }

  #identifierToPath(identifier: ChunkIdentifier): string {
    return join(
      this.configurationService.get('contentFolder'),
      identifier.organizationId,
      identifier.sensorId,
    );
  }
}
