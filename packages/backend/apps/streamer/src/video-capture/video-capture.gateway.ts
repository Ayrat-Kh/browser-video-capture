import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Socket } from 'socket.io';

import { VIDEO_WS_EVENTS, WS_NS, WebSocketConnectParams } from '@common';
import { VideoCaptureService } from './video-capture.service';

@WebSocketGateway({
  namespace: WS_NS.VIDEO_CAPTURE,
  cors: true,
  transports: ['websocket'],
})
export class VideoCaptureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @Inject(VideoCaptureService)
  private readonly videoCaptureService: VideoCaptureService;

  handleDisconnect(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;
    if (query.isRecorder === 'yes') {
      this.videoCaptureService.resetEncoder(query);
    }
  }

  async handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    if (query.isRecorder === 'yes') {
      await this.videoCaptureService.initEncoder(query);
    }
  }

  @SubscribeMessage(VIDEO_WS_EVENTS.UPLOAD_CHUNK)
  async uploadVideoChunk(client: Socket, chunk: Buffer): Promise<boolean> {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    await this.videoCaptureService.saveChunk({
      chunk,
      ...query,
    });

    return true;
  }
}
