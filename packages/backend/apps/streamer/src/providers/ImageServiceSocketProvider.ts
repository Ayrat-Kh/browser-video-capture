import { Socket, io } from 'socket.io-client';
import { Inject, Injectable } from '@nestjs/common';

import { WS_NS } from '@webcam/common';
import { ConfigurationService } from '../config/configuration.service';

@Injectable()
export class ImageServiceSocketProvider {
  @Inject(ConfigurationService)
  private readonly config: ConfigurationService;
  #socket: Socket = undefined;

  public connect(): Socket {
    const url = `${this.config.get('imageSocketServerUrl')}${
      WS_NS.STREAMER_PROVIDER
    }`;

    this.#socket = io(url, {
      transports: ['websocket'],
    });

    return this.#socket;
  }

  public get socket(): Socket {
    if (!this.#socket) {
      return this.connect();
    }
    return this.#socket;
  }
}
