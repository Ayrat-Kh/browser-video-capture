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
import { VisualizerService } from './visualizer.service';

@WebSocketGateway({
  namespace: CAMERA_CAPTURE_NS,
  cors: true,
})
export class VisualizerGateway implements OnGatewayConnection {
  constructor(private readonly cameraCaptureService: VisualizerService) {}

  async handleConnection(_client: Socket) {}

  @SubscribeMessage(VIDEO_WS_EVENTS.LATEST_IMAGE_REQUEST)
  async subscribeLatestImage(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    // client
    //   .compress(true)
    //   .emit(
    //     VIDEO_WS_EVENTS.LATEST_IMAGE,
    //     this.cameraCaptureService.getImageChunk(query.sensorId),
    //   );
  }
}
