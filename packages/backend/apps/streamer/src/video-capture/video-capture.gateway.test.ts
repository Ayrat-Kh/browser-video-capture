import { Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { VideoCaptureGateway } from './video-capture.gateway';
import { VideoCaptureService } from './video-capture.service';
import { VideoCaptureEvents } from './video-capture.listener.events';

describe('StreamerGateway', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [VideoCaptureGateway, VideoCaptureService, EventEmitter2],
    }).compile();
  });

  it('should parse video', async () => {
    const gateway = module.get<VideoCaptureGateway>(VideoCaptureGateway);
    const emitter = module.get<EventEmitter2>(EventEmitter2);

    const imageEventCallbackMock = jest.fn();
    let imageReceiveResolver: VoidFunction | undefined;
    const imageReceivePromise = new Promise<void>((resolve) => {
      imageReceiveResolver = resolve;
    });

    emitter.on(VideoCaptureEvents.ImageCapture, (...args) => {
      imageEventCallbackMock(args);
      imageReceiveResolver?.();
    });

    const id = { organizationId: 'organizationId', sensorId: 'sensorId' };
    const size = {
      height: 100,
      width: 100,
    };

    const clientSocket = {
      handshake: {
        query: {
          ...id,
          ...size,
        },
      },
      join: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(clientSocket);

    await gateway.uploadVideoChunk(
      clientSocket,
      await readFile(join(__dirname, 'vid.test.mp4')),
    );

    await imageReceivePromise;

    gateway.handleDisconnect(clientSocket);

    expect(imageEventCallbackMock).toHaveBeenCalledWith([
      {
        id,
        image: expect.objectContaining({}),
        size,
      },
    ]);
  });
});
