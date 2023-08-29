import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import {
  VIDEO_WS_EVENTS,
  WS_NS,
  WebSocketConnectParams,
  identifierToString,
} from '@common';
import { VideoCaptureService } from './video-capture.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: WS_NS.VIDEO_CAPTURE,
  cors: true,
  transports: ['websocket'],
})
export class VideoCaptureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(VideoCaptureGateway.name);

  constructor(private readonly videoCaptureService: VideoCaptureService) {}

  public handleDisconnect(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    this.videoCaptureService.resetEncoder(query);
  }

  public async handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    await this.videoCaptureService.initEncoder(query);
  }

  @SubscribeMessage(VIDEO_WS_EVENTS.UPLOAD_CHUNK)
  public async uploadVideoChunk(
    client: Socket,
    chunk: Buffer,
  ): Promise<boolean> {
    const query = client.handshake.query as unknown as WebSocketConnectParams;
    try {
      await this.videoCaptureService.saveChunk({
        chunk,
        ...query,
      });
    } catch (e) {
      this.logger.error(
        `[${identifierToString(query)}]: Upload chunk error`,
        e,
      );
    }

    return true;
  }
}
