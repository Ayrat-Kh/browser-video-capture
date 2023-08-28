import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import {
  ChunkIdentifier,
  VIDEO_WS_EVENTS,
  WS_NS,
  identifierToString,
} from '@common';
import { VisualizerGateway } from '../visualizer/visualizer.gateway';
import { Socket } from 'socket.io';

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
    try {
      await this.visualizerGateway.server
        .to(identifierToString(id))
        .compress(true)
        .timeout(20_000)
        .emitWithAck(VIDEO_WS_EVENTS.IMAGE, image);
    } catch (e) {
      console.error(
        `${VIDEO_WS_EVENTS.IMAGE_PROVIDER} ${identifierToString(id)}`,
        e,
      );
    } finally {
      return true;
    }
  }
}
