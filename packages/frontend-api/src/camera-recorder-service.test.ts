import 'reflect-metadata';
import { Server, createServer } from 'node:http';
import {
  Server as SocketServer,
  Socket as ServerClientSocket,
} from 'socket.io';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';

import { VIDEO_WS_EVENTS, WS_NS } from '@webcam/common';
import { CameraRecorderService } from './camera-recorder-service';

const testMetaData = {
  cameraDeviceId: 'cameraDeviceId',
  organizationId: 'organizationId',
  sensorName: 'sensorName',
  sensorId: 'sensorId',
};

const successPingResult = {
  isSuccess: true,
};

// mock camera services
vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({} as unknown as MediaStream),
  } as unknown as MediaDevices,
} as unknown as Navigator);

// mock media recorder, simulate upcoming video chunks
const addDataAvailableEvent = vi.fn();
vi.stubGlobal(
  'MediaRecorder',
  class {
    start = vi.fn();
    ondataavailable = vi.fn();
    addEventListener = addDataAvailableEvent;
    removeEventListener = vi.fn();
    onerror = vi.fn();
    state = '';
    stop = vi.fn();

    static isTypeSupported() {
      return true;
    }
  },
);

// mock ping request
const fetchFn = vi.fn(() => ({
  json: () => Promise.resolve(successPingResult),
  status: 200,
}));
vi.stubGlobal('fetch', fetchFn);

// test mock socket server
const createMockSocketServer = async (): Promise<{
  httpServer: Server;
  socketServer: SocketServer;
  close: VoidFunction;
}> => {
  const httpServer = createServer();
  const socketServer = new SocketServer(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(5328, resolve);
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

describe('CameraRecorderService', () => {
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
    const service = new CameraRecorderService({
      makeTestApi: true,
      appUrl: 'http://localhost:5328',
      socketAppUrl: 'http://localhost:5328',
    });

    await service.initialize(testMetaData);

    const serverResponseCounter = vi.fn();

    // subscribe to all necessary server events before calling connect from frontend
    let serverClientSocket: ServerClientSocket | undefined;
    socketServer
      .of(WS_NS.VIDEO_CAPTURE)
      .on('connection', (_client: ServerClientSocket) => {
        serverClientSocket = _client;
      });

    await service.start();

    // get MediaRecorder available data mock
    const dataHandler = addDataAvailableEvent.mock.lastCall[1] as (data: {
      data: Blob;
    }) => void;

    const blob = new Blob(['blob']);

    const createMessageAwaiter = () =>
      new Promise<void>((resolve) => {
        const sub = (img: Buffer) => {
          serverResponseCounter({ img });
          serverClientSocket?.off(VIDEO_WS_EVENTS.UPLOAD_CHUNK, sub);
          resolve();
        };
        serverClientSocket?.on(VIDEO_WS_EVENTS.UPLOAD_CHUNK, sub);
      });

    dataHandler({
      data: blob,
    });
    await createMessageAwaiter();

    expect(serverResponseCounter).toHaveBeenCalledOnce();
    expect(serverResponseCounter).toHaveBeenCalledWith({
      img: expect.objectContaining({}),
    });

    dataHandler({
      data: blob,
    });
    await createMessageAwaiter();
    dataHandler({
      data: blob,
    });
    await createMessageAwaiter();

    expect(serverResponseCounter).toHaveBeenCalledTimes(3);
  });
});
