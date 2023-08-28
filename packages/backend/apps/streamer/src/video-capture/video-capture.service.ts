import { spawn, type ChildProcess } from 'node:child_process';
import { Injectable } from '@nestjs/common';
import * as ffmpegPath from 'ffmpeg-static';

import {
  type StreamVideoChunkParams,
  type ChunkIdentifier,
  identifierToString,
} from '@common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VideoCaptureEvents,
  VideoCaptureImageEventData,
} from './video-capture.listener.events';

@Injectable()
export class VideoCaptureService {
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
        ...['-qscale:v', '8'],
        ...['-vf', 'fps=20'],
        ...['-preset', 'ultrafast'],
        ...['-crf', '28'],
        ...['-f', 'image2pipe'],
        'pipe:3',
      ],
      { stdio: ['pipe', 'pipe', null, 'pipe', 'pipe'] },
    );

    ffmpegProcess.on('close', (error: Buffer) => {
      console.log('close:', error?.toString());
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

    if (!latestBuffer.includes('JFIF')) {
      return;
    }

    this.eventEmitter.emit(
      VideoCaptureEvents.ImageCapture,
      new VideoCaptureImageEventData(latestBuffer, identifier),
    );
  }
}
