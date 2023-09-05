import { Socket } from 'socket.io';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import {
  type ChunkIdentifier,
  VIDEO_WS_EVENTS,
  WS_NS,
  identifierToString,
  Size,
} from '@common';
import { VisualizerGateway } from '../visualizer/visualizer.gateway';

@WebSocketGateway({
  namespace: WS_NS.STREAMER_PROVIDER,
  cors: true,
  transports: ['websocket'],
})
export class ImageStreamerProviderGateway {
  constructor(private readonly visualizerGateway: VisualizerGateway) {}

  @SubscribeMessage(VIDEO_WS_EVENTS.IMAGE_PROVIDER)
  public async subscribeLatestImage(
    _socket: Socket,
    [id, image, size]: [id: ChunkIdentifier, data: Buffer, size: Size],
  ): Promise<boolean> {
    const identifier = identifierToString(id);

    this.visualizerGateway.server
      .to(identifier)
      .compress(true)
      .emit(VIDEO_WS_EVENTS.IMAGE, image, size);

    return true;
  }
}
