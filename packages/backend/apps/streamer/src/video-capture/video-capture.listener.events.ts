import { type ChunkIdentifier, type Size } from '@webcam/common';

export const VideoCaptureEvents = {
  ImageCapture: 'video-capture.image',
} as const;

export class VideoCaptureImageEventData {
  constructor(
    public readonly image: Buffer,
    public readonly id: ChunkIdentifier,
    public readonly size: Size,
  ) {}
}

export class VideoCaptureImageMetaEventData {
  constructor(
    public readonly image: Buffer,
    public readonly id: ChunkIdentifier,
  ) {}
}
