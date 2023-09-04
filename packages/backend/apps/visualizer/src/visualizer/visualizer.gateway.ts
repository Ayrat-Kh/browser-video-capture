import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import {
  type WebSocketConnectParams,
  WS_NS,
  identifierToString,
} from '@common';

@WebSocketGateway({
  namespace: WS_NS.STREAMER,
  cors: true,
})
export class VisualizerGateway implements OnGatewayConnection {
  @WebSocketServer()
  public server: Server;

  public handleConnection(client: Socket) {
    const query = client.handshake.query as unknown as WebSocketConnectParams;

    client.join(identifierToString(query));
  }
}
