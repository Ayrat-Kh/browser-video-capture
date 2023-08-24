import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import {
  CAMERA_CAPTURE_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@common';
import { StreamerService } from './streamer.service';

@WebSocketGateway({
  namespace: CAMERA_CAPTURE_NS,
  cors: true,
})
export class StreamerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly cameraCaptureService: StreamerService) {}
  handleDisconnect(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;
    if (query.isRecorder === 'yes') {
      this.cameraCaptureService.resetEncoder(query);
    }
  }

  async handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    if (query.isRecorder === 'yes') {
      await this.cameraCaptureService.initEncoder(query);
      await this.cameraCaptureService.initSensorImageFolder(query);
    }
  }

  @SubscribeMessage(VIDEO_WS_EVENTS.UPLOAD_CHUNK)
  async uploadVideoChunk(client: Socket, chunk: Buffer): Promise<boolean> {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    await this.cameraCaptureService.saveChunk({
      chunk,
      ...query,
    });

    return true;
  }
}