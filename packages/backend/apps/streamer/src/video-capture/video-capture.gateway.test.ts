import { Test, TestingModule } from '@nestjs/testing';
import { VideoCaptureGateway } from './video-capture.gateway';
import { VideoCaptureService } from './video-capture.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('StreamerGateway', () => {
  let gateway: VideoCaptureGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoCaptureGateway, VideoCaptureService, EventEmitter2],
    }).compile();

    gateway = module.get<VideoCaptureGateway>(VideoCaptureGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
