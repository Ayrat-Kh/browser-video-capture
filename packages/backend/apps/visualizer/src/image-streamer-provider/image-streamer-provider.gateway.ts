import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import {
  ChunkIdentifier,
  VIDEO_WS_EVENTS,
  WS_NS,
  identifierToString,
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
    [id, image]: [id: ChunkIdentifier, data: Buffer],
  ): Promise<boolean> {
    const identifier = identifierToString(id);

    this.visualizerGateway.server
      .to(identifier)
      .volatile.compress(true)
      .emit(VIDEO_WS_EVENTS.IMAGE, image);

    return true;
  }
}
