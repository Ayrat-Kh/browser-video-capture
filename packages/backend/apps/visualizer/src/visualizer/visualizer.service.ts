import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { watch } from 'chokidar';

import { type ChunkIdentifier, identifierToString } from '@common';
import { ConfigurationService } from '../config/configuration.service';

@Injectable()
export class VisualizerService {
  #latestImageFile = new Map<string, Buffer>();

  constructor(private readonly configurationService: ConfigurationService) {
    this.handleImageChange = this.handleImageChange.bind(this);

    const watcher = watch(configurationService.get('contentFolder'), {
      ignoreInitial: true,
    }).on('add', this.handleImageChange);

    process.on('SIGHUP', () => {
      watcher.close();
    });
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
        .filter((x) => Number.isFinite(x.time))
        .sort((a, b) => b.time - a.time);

      const file = await readFile(join(folderPath, latestFile.name));

      const id = identifierToString(identifier);

      if (!this.#latestImageFile.has(id)) {
        this.#latestImageFile.set(id, file);
      }
    } catch (e) {
      console.error('loadLatestImageFileName error', e);
    }
  }

  private async handleImageChange(fullFilename: string) {
    try {
      const [, sensorId, organizationId] =
        fullFilename?.split('/')?.reverse() ?? [];

      const file = await readFile(fullFilename);

      this.#latestImageFile.set(
        identifierToString({
          organizationId,
          sensorId,
        }),
        file,
      );
    } catch (e) {
      console.error('handleImageChange error', e);
    }
  }
}
