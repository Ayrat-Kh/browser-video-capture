import { spawn, type ChildProcess } from 'node:child_process';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ffmpegPath from 'ffmpeg-static';

import {
  type StreamVideoChunkParams,
  type ChunkIdentifier,
  type Size,
  identifierToString,
} from '@webcam/common';
import {
  VideoCaptureEvents,
  VideoCaptureImageEventData,
} from './video-capture.listener.events';

@Injectable()
export class VideoCaptureService {
  private readonly logger = new Logger(VideoCaptureService.name);

  readonly #encoders = new Map<string, ChildProcess>();
  readonly #upcomingLatestImages = new Map<string, Buffer>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

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

  public initEncoder(
    identifier: ChunkIdentifier,
    size: Size,
  ): Promise<ChildProcess> {
    this.resetEncoder(identifier);

    this.logger.log(
      `Org id: ${identifier.organizationId} SensorId: ${identifier.sensorId}: init encoder`,
    );

    const SIZE = 5;

    const ffmpegProcess = spawn(
      ffmpegPath as unknown as string,
      [
        ...['-ignore_unknown'],
        ...['-probesize', '1M'],
        ...['-i', '-'],
        '-an',
        ...['-b:v', `${SIZE}M`],
        ...['-maxrate', `${SIZE}M`],
        ...['-bufsize', `${2 * SIZE}M`],
        ...['-preset', 'veryfast'],
        ...['-vf', 'fps=20'],
        ...['-c:v', 'mjpeg'],
        ...['-f', 'image2pipe'],
        'pipe:3',
      ],
      { stdio: ['pipe', 'pipe', null, 'pipe', 'pipe'] },
    );

    ffmpegProcess.stderr.on('data', (error: Buffer) => {
      this.logger.debug(
        `[${identifierToString(identifier)}] [std(deb|err)-info]:`,
        error?.toString(),
      );
    });

    ffmpegProcess.on('close', (error: Buffer) => {
      this.logger.debug(
        `[${identifierToString(identifier)}] closed encoder:`,
        error?.toString(),
      );
    });

    ffmpegProcess.stdio[3].on('data', (image: Buffer) => {
      this.#sendImage(identifier, image, size);
    });

    this.#encoders.set(identifierToString(identifier), ffmpegProcess);

    return Promise.resolve(ffmpegProcess);
  }

  resetEncoder(identifier: ChunkIdentifier) {
    this.logger.log(
      `Org id: ${identifier.organizationId} SensorId: ${identifier.sensorId}: reset encoder`,
    );

    const id = identifierToString(identifier);

    if (this.#encoders.has(id)) {
      const ffmpegProcess = this.#encoders.get(id);
      this.#encoders.delete(id);
      ffmpegProcess?.kill();
    }
  }

  async #sendImage(
    identifier: ChunkIdentifier,
    imageChunk: Buffer,
    size: Size,
  ) {
    const BUFFER_SIZE = 65_536; // ffmpeg max buf size id 65_536 if we go above we should concat several sections

    const id = identifierToString(identifier);
    let latestBuffer = this.#upcomingLatestImages.get(id);
    if (latestBuffer?.byteLength % BUFFER_SIZE === 0) {
      latestBuffer = Buffer.concat([latestBuffer, imageChunk]);
    } else {
      latestBuffer = imageChunk;
    }

    this.#upcomingLatestImages.set(id, latestBuffer);

    if (imageChunk.byteLength === BUFFER_SIZE) {
      return;
    }

    // this.logger.debug(`[${id}]: buffer size: ${latestBuffer.byteLength}`);

    this.#upcomingLatestImages.delete(id);

    this.eventEmitter.emit(
      VideoCaptureEvents.ImageCapture,
      new VideoCaptureImageEventData(latestBuffer, identifier, size),
    );
  }
}
