import 'reflect-metadata';
import { Server, createServer } from 'node:http';
import {
  Server as SocketServer,
  Socket as ServerClientSocket,
} from 'socket.io';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';

import { CameraRecorderService } from './camera-recorder-service';
import { Size, VIDEO_WS_EVENTS, WS_NS } from '@webcam/common';
import { CAMERA_RESOLUTION } from 'src/constants/Config';

const testMetaData = {
  cameraDeviceId: 'cameraDeviceId',
  organizationId: 'organizationId',
  sensorName: 'sensorName',
  sensorId: 'sensorId',
};

const successPingResult = {
  isSuccess: true,
};

vi.stubGlobal('screen', {
  orientation: {
    type: 'landscape-primary',
  },
});

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

// configure urls to mock socket server
vi.mock('src/constants/Config', async () => {
  const actual = await vi.importActual<object>('src/constants/Config');
  return {
    ...actual,
    STREAMER_SOCKET_URL: `http://localhost:5328`,
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
    });

    await service.initialize(testMetaData);

    const serverResponseCounter = vi.fn();

    // subscribe to all necessary server events before calling connect from frontend
    socketServer
      .of(WS_NS.VIDEO_CAPTURE)
      .on('connection', (client: ServerClientSocket) => {
        client.on(
          VIDEO_WS_EVENTS.UPLOAD_CHUNK,
          (img: string, size: Size, callback: VoidFunction) => {
            serverResponseCounter({ img, size });
            callback();
          },
        );
      });

    await service.start();

    // get MediaRecorder available data mock
    const dataHandler = addDataAvailableEvent.mock.lastCall[1] as (data: {
      data: string;
    }) => void;

    await dataHandler({
      data: 'blob',
    });

    expect(serverResponseCounter).toHaveBeenCalledOnce();
    expect(serverResponseCounter).toHaveBeenCalledWith({
      img: 'blob',
      size: CAMERA_RESOLUTION,
    });

    await dataHandler({
      data: 'blob',
    });
    await dataHandler({
      data: 'blob',
    });

    expect(serverResponseCounter).toHaveBeenCalledTimes(3);
  });
});
