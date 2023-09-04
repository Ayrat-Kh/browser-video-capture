import { Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

import {
  type Size,
  VIDEO_WS_EVENTS,
  WS_NS,
  WebSocketConnectParams,
  identifierToString,
} from '@common';
import { VideoCaptureService } from './video-capture.service';
import { plainToClass, plainToInstance } from 'class-transformer';

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
    const query = plainToInstance(
      WebSocketConnectParams,
      client.handshake.query,
    );

    this.videoCaptureService.resetEncoder(query);
  }

  public async handleConnection(client: Socket) {
    const query = plainToInstance(
      WebSocketConnectParams,
      client.handshake.query,
    );

    await this.videoCaptureService.initEncoder(query);
  }

  @SubscribeMessage(VIDEO_WS_EVENTS.UPLOAD_CHUNK)
  public async uploadVideoChunk(
    client: Socket,
    [chunk]: [chunk: Buffer, size: Size],
  ): Promise<boolean> {
    const query = plainToInstance(
      WebSocketConnectParams,
      client.handshake.query,
    );

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
