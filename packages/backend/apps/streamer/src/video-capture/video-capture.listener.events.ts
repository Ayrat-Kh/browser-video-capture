import { ChunkIdentifier } from '../../../../../common/src/types';

export const VideoCaptureEvents = {
  ImageCapture: 'video-capture.image',
} as const;

export class VideoCaptureImageEventData {
  constructor(
    public readonly image: Buffer,
    public readonly id: ChunkIdentifier,
  ) {}
}