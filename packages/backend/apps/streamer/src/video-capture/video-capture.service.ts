import { spawn, type ChildProcess } from 'node:child_process';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ffmpegPath from 'ffmpeg-static';

import {
  type StreamVideoChunkParams,
  type ChunkIdentifier,
  type Size,
  identifierToString,
} from '@common';
import {
  VideoCaptureEvents,
  VideoCaptureImageEventData,
} from './video-capture.listener.events';

interface Encoder {
  ffmpegProc: ChildProcess;
  size: Size;
}

@Injectable()
export class VideoCaptureService {
  private readonly logger = new Logger(VideoCaptureService.name);

  readonly #encoders = new Map<string, Encoder>();
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
    encoder.ffmpegProc?.stdin?.write(data.chunk);
    return Promise.resolve();
  }

  public initEncoder(
    identifier: ChunkIdentifier & Size,
  ): Promise<ChildProcess> {
    this.resetEncoder(identifier);

    this.logger.log(
      `Org id: ${identifier.organizationId} SensorId: ${identifier.sensorId}: init encoder`,
    );

    const ffmpegProcess = spawn(
      ffmpegPath as unknown as string,
      [
        ...['-seek_timestamp', '1'],
        ...['-ignore_unknown'],
        ...['-probesize', '1M'],
        ...['-i', '-'],
        ...['-framerate', '20'],
        '-an',
        ...['-b:v', '14M'],
        ...['-maxrate', '14M'],
        ...['-bufsize', '7M'],

        // image
        ...['-vf', 'fps=20'],
        ...['-c:v', 'mjpeg'],
        ...['-preset', 'veryfast'],
        ...['-tune', 'zerolatency'],
        ...['-f', 'image2pipe'],
        'pipe:3',
      ],
      { stdio: ['pipe', 'pipe', null, 'pipe', 'pipe'] },
    );

    ffmpegProcess.stderr.on('data', (error: Buffer) => {
      this.logger.debug(
        `[${identifierToString(identifier)}] [stderr-info]:`,
        error?.toString(),
      );
    });

    ffmpegProcess.on('close', (error: Buffer) => {
      this.logger.error(
        `[${identifierToString(identifier)}] closed encoder:`,
        error?.toString(),
      );
    });

    ffmpegProcess.stdio[3].on('data', (image: Buffer) => {
      this.#sendImage(identifier, image);
    });

    this.#encoders.set(identifierToString(identifier), {
      ffmpegProc: ffmpegProcess,
      size: identifier,
    });

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
      ffmpegProcess?.ffmpegProc?.kill();
    }
  }

  async #sendImage(identifier: ChunkIdentifier, chunk: Buffer) {
    const BUFFER_SIZE = 65_536; // ffmpeg max buf size id 65_536 if we go above we should concat several sections

    const id = identifierToString(identifier);
    let latestBuffer = this.#upcomingLatestImages.get(id);
    if (latestBuffer?.byteLength % BUFFER_SIZE === 0) {
      latestBuffer = Buffer.concat([latestBuffer, chunk]);
    } else {
      latestBuffer = chunk;
    }

    this.#upcomingLatestImages.set(id, latestBuffer);

    if (chunk.byteLength === BUFFER_SIZE) {
      return;
    }

    this.#upcomingLatestImages.delete(id);

    this.eventEmitter.emit(
      VideoCaptureEvents.ImageCapture,
      new VideoCaptureImageEventData(
        latestBuffer,
        identifier,
        this.#encoders.get(id).size,
      ),
    );
  }
}
