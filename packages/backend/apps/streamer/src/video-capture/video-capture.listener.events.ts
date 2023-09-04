import { type ChunkIdentifier, type Size } from '@common';

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
