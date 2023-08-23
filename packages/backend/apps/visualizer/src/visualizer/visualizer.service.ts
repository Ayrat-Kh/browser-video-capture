import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import { ConfigurationService } from '../config/configuation.service';

@Injectable()
export class VisualizerService {
  constructor(private readonly configurationService: ConfigurationService) {}

  // public getImageChunk(sensorId: string): Buffer {
  //   return this.#latestImageFile.get(sensorId);
  // }

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

  // #initFirstChunk(sensorId: string, chunk: Buffer) {
  //   if (!this.#realtimeVideoFirstChunks.has(sensorId)) {
  //     this.#realtimeVideoFirstChunks.set(sensorId, chunk);
  //   }
  // }

  // #sendChunk(sensorId: string, chunk: Buffer) {
  //   if (this.#realtimeVideoEmitters.has(sensorId)) {
  //     this.#realtimeVideoEmitters.get(sensorId).emit('chunk', chunk);
  //   }
  // }

  // #sendImage(sensorId: string, chunk: Buffer) {
  //   let latestBuffer = this.#upcomingLatestImageFile.get(sensorId);
  //   if (latestBuffer?.byteLength % 65_536 === 0) {
  //     latestBuffer = Buffer.concat([latestBuffer, chunk]);
  //   } else {
  //     latestBuffer = chunk;
  //   }

  //   this.#upcomingLatestImageFile.set(sensorId, chunk);

  //   if (chunk.byteLength === 65_536) {
  //     return;
  //   }

  //   this.#latestImageFile.set(sensorId, latestBuffer);
  // }
}
