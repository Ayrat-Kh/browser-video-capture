import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  CAMERA_CAPTURE_NS,
  VIDEO_WS_EVENTS,
  WebSocketConnectParams,
  // WebSocketSubscribeToLatestImage,
} from '@common';
import { Socket } from 'socket.io';
import { CameraCaptureService } from './camera-capture.service';

@WebSocketGateway({
  namespace: CAMERA_CAPTURE_NS,
  cors: true,
})
export class CameraCaptureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  #imageSubs = new Map<string, (chunk: Buffer) => void>();

  constructor(private readonly cameraCaptureService: CameraCaptureService) {}
  handleDisconnect(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;
    if (this.#imageSubs.has(query.sensorId)) {
      this.cameraCaptureService.unsubscribeToLatestImageEmitter(
        query.sensorId,
        this.#imageSubs.get(query.sensorId),
      );
      this.#imageSubs.delete(query.sensorId);
    }
  }

  async handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    await this.cameraCaptureService.initEncoder(query.sensorId);
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

  @SubscribeMessage(VIDEO_WS_EVENTS.SUBSCRIBE_TO_LATEST_IMAGE)
  async subscribeLatestImage(client: Socket): Promise<boolean> {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    const subFn = (chunk: Buffer) => {
      client.emit(VIDEO_WS_EVENTS.LATEST_IMAGE, chunk);
    };

    this.#imageSubs.set(query.sensorId, subFn);
    this.cameraCaptureService.subscribeToLatestImageEmitter(
      query.sensorId,
      subFn,
    );

    return true;
  }
}
