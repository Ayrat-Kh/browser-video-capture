import { CustomTransportStrategy, Server } from '@nestjs/microservices';

import { ImageServiceSocketProvider } from './ImageServiceSocketProvider';
import { Logger } from '@nestjs/common';

export class ImageServiceSocketProviderStrategy
  extends Server
  implements CustomTransportStrategy
{
  loggerService = new Logger(ImageServiceSocketProviderStrategy.name);

  constructor(
    private readonly imageServiceSocketProvider: ImageServiceSocketProvider,
  ) {
    super();
  }

  listen(callback: VoidFunction): void {
    const socket = this.imageServiceSocketProvider.connect();

    socket.on('connect', () => {
      this.loggerService.log('connected to image socket server');
    });

    socket.on('reconnect', () => {
      this.loggerService.log('reconnected to image socket server');
    });
    socket.on('error', (error) => {
      this.loggerService.error('FAILED: from image socket server', error);
    });

    callback();
  }

  close(): void {
    this.imageServiceSocketProvider.socket.disconnect();
  }
}
