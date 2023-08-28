import { CustomTransportStrategy, Server } from '@nestjs/microservices';

import { ImageServiceSocketProvider } from './ImageServiceSocketProvider';

export class ImageServiceSocketProviderStrategy
  extends Server
  implements CustomTransportStrategy
{
  constructor(
    private readonly imageServiceSocketProvider: ImageServiceSocketProvider,
  ) {
    super();
  }

  listen(callback: VoidFunction): void {
    const socket = this.imageServiceSocketProvider.connect();

    socket.on('connect', () => {
      console.log('connected to image socket server');
    });

    socket.on('reconnect', () => {
      console.log('reconnected to image socket server');
    });
    socket.on('error', (error) => {
      console.error('FAILED: from image socket server', error);
    });

    callback();
  }

  close(): void {
    this.imageServiceSocketProvider.socket.disconnect();
  }
}
