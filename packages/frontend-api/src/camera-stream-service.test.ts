// @vitest-environment happy-dom
import 'reflect-metadata';
import { Server, createServer } from 'node:http';

import {
  Server as SocketServer,
  Socket as ServerClientSocket,
} from 'socket.io';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';

import { VIDEO_WS_EVENTS, WS_NS } from '@webcam/common';
import { CameraStreamService } from './camera-stream-service';

const testMetaData = {
  organizationId: 'organizationId',
  sensorId: 'sensorId',
};

vi.stubGlobal(
  'createImageBitmap',
  vi.fn(() => new ArrayBuffer(1)),
);

// configure urls to mock socket server
vi.mock('src/constants/Config', async () => {
  const actual = await vi.importActual<object>('src/constants/Config');
  return {
    ...actual,
    PLAYER_SOCKET_URL: 'http://localhost:5329',
  };
});

// test mock socket server
const createMockSocketServer = async (): Promise<{
  httpServer: Server;
  socketServer: SocketServer;
  close: VoidFunction;
}> => {
  const httpServer = createServer();
  const socketServer = new SocketServer(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(5329, resolve);
  });

  const close = () => {
    httpServer.close();
  };

  return {
    socketServer,
    httpServer,
    close,
  };
};

describe('CameraStreamService', () => {
  let close: VoidFunction;
  let socketServer: SocketServer;

  beforeEach(async () => {
    const res = await createMockSocketServer();
    close = res.close;
    socketServer = res.socketServer;
  });

  afterEach(() => {
    close?.();
  });

  test('should send frame with reduced rate and should always send the first chunk', async () => {
    let connectResolver: VoidFunction | undefined;
    const connectPromise = new Promise<void>(
      (resolve) => (connectResolver = resolve),
    );
    let serverClientSocket: ServerClientSocket | undefined;
    socketServer
      .of(WS_NS.STREAMER)
      .on('connection', (socket: ServerClientSocket) => {
        serverClientSocket = socket;
        connectResolver?.();
      });

    const service = new CameraStreamService({
      socketAppUrl: 'http://localhost:5329',
    });
    const canvas = document.createElement('canvas');

    let drawImageResolver: VoidFunction | undefined;
    const drawImagePromise = new Promise<void>((resolve) => {
      drawImageResolver = resolve;
    });
    const drawImageMock = vi.fn(() => drawImageResolver?.());

    canvas.getContext = vi.fn(() => ({
      drawImage: drawImageMock,
    })) as unknown as typeof canvas.getContext;

    await service.initialize({
      canvas,
      ...testMetaData,
    });

    await connectPromise;

    serverClientSocket?.emit(VIDEO_WS_EVENTS.IMAGE, new ArrayBuffer(1), {
      width: 100,
      height: 100,
    });

    await drawImagePromise;

    expect(drawImageMock).toHaveBeenCalledWith(
      new ArrayBuffer(1),
      0,
      0,
      100,
      100,
    );
  });
});
