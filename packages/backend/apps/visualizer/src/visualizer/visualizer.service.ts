import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { type WatchEventType, watch } from 'node:fs';
import { Injectable } from '@nestjs/common';

import { ChunkIdentifier, identifierToString } from '@common';
import { ConfigurationService } from '../config/configuation.service';

@Injectable()
export class VisualizerService {
  #latestImageFile = new Map<string, Buffer>();

  constructor(private readonly configurationService: ConfigurationService) {
    watch(
      configurationService.get('contentFolder'),
      undefined,
      this.#handleImageChange,
    );
  }

  public async getImageChunk(identifier: ChunkIdentifier): Promise<Buffer> {
    const id = identifierToString(identifier);

    if (!this.#latestImageFile.has(id)) {
      await this.#loadLatestImageFileName(identifier);
    }

    return this.#latestImageFile.get(id);
  }

  async #loadLatestImageFileName(identifier: ChunkIdentifier): Promise<void> {
    try {
      const folderPath = join(
        this.configurationService.get('contentFolder'),
        identifier.organizationId,
        identifier.sensorId,
      );

      const [latestFile] = (await readdir(folderPath))
        .map((x) => ({ time: Number.parseInt(x), name: x }))
        .filter((x) => Number.isFinite(x))
        .sort((a, b) => b.time - a.time);

      const file = await readFile(join(folderPath, latestFile.name));

      const id = identifierToString(identifier);

      if (!this.#latestImageFile.has(id)) {
        this.#latestImageFile.set(id, file);
      }
    } catch (e) {
      return;
    }
  }

  #handleImageChange(event: WatchEventType, filename: string) {
    console.log('filename', filename);
  }
}
