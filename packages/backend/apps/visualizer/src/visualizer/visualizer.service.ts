import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { watch } from 'chokidar';

import { type ChunkIdentifier, identifierToString } from '@common';
import { ConfigurationService } from '../config/configuration.service';

@Injectable()
export class VisualizerService {
  #logger = new Logger(VisualizerService.name);

  #latestImageFile = new Map<string, Buffer>();
  #loaders = new Map<string, boolean>();

  constructor(private readonly configurationService: ConfigurationService) {
    this.handleImageChange = this.handleImageChange.bind(this);

    const watcher = watch('', {
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

  async #loadLatestImageFileName(
    identifier: ChunkIdentifier,
    force = false,
  ): Promise<void> {
    if (this.#loaders.get(identifierToString(identifier))) {
      return;
    }

    this.#loaders.set(identifierToString(identifier), true);

    try {
      const folderPath = join(
        '',
        identifier.organizationId,
        identifier.sensorId,
      );

      const [latestFile] = (await readdir(folderPath))
        .map((x) => ({ time: Number.parseInt(x), name: x }))
        .filter((x) => Number.isFinite(x.time))
        .sort((a, b) => b.time - a.time);

      const file = await readFile(join(folderPath, latestFile.name));

      const id = identifierToString(identifier);

      if (force || !this.#latestImageFile.has(id)) {
        this.#latestImageFile.set(id, file);
      }
    } catch (e) {
      this.#logger.error('[#loadLatestImageFileName] error', e);
    } finally {
      this.#loaders.set(identifierToString(identifier), false);
    }
  }

  private async handleImageChange(fullFilename: string) {
    const [, sensorId, organizationId] =
      fullFilename?.split('/')?.reverse() ?? [];

    const id = {
      organizationId,
      sensorId,
    };

    await this.#loadLatestImageFileName(id, true);
  }
}
