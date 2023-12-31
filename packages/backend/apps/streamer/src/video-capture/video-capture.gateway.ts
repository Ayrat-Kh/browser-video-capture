import { Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import {
  type ChunkIdentifier,
  type Size,
  VIDEO_WS_EVENTS,
  WS_NS,
  WebSocketConnectParams,
  identifierToString,
} from '@webcam/common';
import { VideoCaptureService } from './video-capture.service';

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

    const id: ChunkIdentifier = {
      organizationId: query.organizationId,
      sensorId: query.sensorId,
    };

    this.videoCaptureService.resetEncoder(id);
  }

  public async handleConnection(client: Socket) {
    const query = plainToInstance(
      WebSocketConnectParams,
      client.handshake.query,
    );

    client.join(identifierToString(query));

    const id: ChunkIdentifier = {
      organizationId: query.organizationId,
      sensorId: query.sensorId,
    };

    const size: Size = {
      height: query.height,
      width: query.width,
    };

    await this.videoCaptureService.initEncoder(id, size);
  }

  @SubscribeMessage(VIDEO_WS_EVENTS.UPLOAD_CHUNK)
  public async uploadVideoChunk(
    client: Socket,
    chunk: Buffer,
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
