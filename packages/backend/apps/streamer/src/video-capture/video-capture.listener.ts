import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { VIDEO_WS_EVENTS } from '@webcam/common';
import {
  VideoCaptureEvents,
  type VideoCaptureImageEventData,
} from './video-capture.listener.events';
import { ImageServiceSocketProvider } from '../providers/ImageServiceSocketProvider';

@Injectable()
export class VideoCaptureListener {
  constructor(
    private readonly imageServiceSocketProvider: ImageServiceSocketProvider,
  ) {}

  @OnEvent(VideoCaptureEvents.ImageCapture)
  public async onImageReceived({
    id,
    image,
    size,
  }: VideoCaptureImageEventData) {
    this.imageServiceSocketProvider.socket.sendBuffer = [];
    this.imageServiceSocketProvider.socket.volatile.emit(
      VIDEO_WS_EVENTS.IMAGE_PROVIDER,
      id,
      image,
      size,
    );
  }
}
