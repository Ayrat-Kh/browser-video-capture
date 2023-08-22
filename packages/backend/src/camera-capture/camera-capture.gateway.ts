import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  CAMERA_CAPTURE_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
} from '@common';
import { Socket } from 'socket.io';
import { CameraCaptureService } from './camera-capture.service';

@WebSocketGateway({
  namespace: CAMERA_CAPTURE_NS,
  cors: true,
})
export class CameraCaptureGateway implements OnGatewayConnection {
  constructor(private readonly cameraCaptureService: CameraCaptureService) {}

  async handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    if (query.isRecorder === 'yes') {
      await this.cameraCaptureService.initEncoder(query.sensorId);
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

  @SubscribeMessage(VIDEO_WS_EVENTS.LATEST_IMAGE_REQUEST)
  async subscribeLatestImage(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    client.emit(
      VIDEO_WS_EVENTS.LATEST_IMAGE,
      this.cameraCaptureService.getImageChunk(query.sensorId),
    );
  }
}
