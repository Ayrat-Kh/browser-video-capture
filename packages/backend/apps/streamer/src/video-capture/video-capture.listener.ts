import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { VIDEO_WS_EVENTS } from '@common';
import {
  VideoCaptureEvents,
  VideoCaptureImageEventData,
} from './video-capture.listener.events';
import { ImageServiceSocketProvider } from '../providers/ImageServiceSocketProvider';

@Injectable()
export class VideoCaptureListener {
  constructor(
    private readonly imageServiceSocketProvider: ImageServiceSocketProvider,
  ) {}

  @OnEvent(VideoCaptureEvents.ImageCapture)
  public async onImageReceived({ id, image }: VideoCaptureImageEventData) {
    this.imageServiceSocketProvider.socket.sendBuffer = [];
    this.imageServiceSocketProvider.socket.volatile
      .compress(true)
      .emit(VIDEO_WS_EVENTS.IMAGE_PROVIDER, id, image);
  }
}
