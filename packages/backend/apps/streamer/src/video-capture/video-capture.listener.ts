import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { identifierToString, VIDEO_WS_EVENTS } from '@common';
import {
  VideoCaptureEvents,
  VideoCaptureImageEventData,
} from './video-capture.listener.events';
import { ImageServiceSocketProvider } from '../providers/ImageServiceSocketProvider';

@Injectable()
export class VideoCaptureListener {
  private latestImages = new Map<
    string,
    {
      image: Buffer;
      time: number;
    }
  >();
  private requestStatuses = new Map<string, boolean>();

  constructor(
    private readonly imageServiceSocketProvider: ImageServiceSocketProvider,
  ) {}

  @OnEvent(VideoCaptureEvents.ImageCapture)
  public async onImageReceived({ id, image }: VideoCaptureImageEventData) {
    const currentImgTime = new Date().getTime();
    const idString = identifierToString(id);
    this.latestImages.set(idString, {
      image: image,
      time: currentImgTime,
    });

    if (this.requestStatuses.get(idString)) {
      return;
    }

    this.requestStatuses.set(idString, true);
    try {
      await this.imageServiceSocketProvider.socket
        .timeout(20_000)
        .compress(true)
        .emitWithAck(VIDEO_WS_EVENTS.IMAGE_PROVIDER, id, image);
    } catch (e) {
      console.error(`Sending socket error: ${idString}`, e);
    } finally {
      this.requestStatuses.set(idString, false);

      if (currentImgTime !== this.latestImages.get(idString).time) {
        this.onImageReceived(
          new VideoCaptureImageEventData(
            this.latestImages.get(idString).image,
            id,
          ),
        );
      }
    }
  }
}
