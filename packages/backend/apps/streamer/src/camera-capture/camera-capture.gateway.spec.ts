import { Test, TestingModule } from '@nestjs/testing';
import { CameraCaptureGateway } from './camera-capture.gateway';

describe('CameraCaptureGateway', () => {
  let gateway: CameraCaptureGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CameraCaptureGateway],
    }).compile();

    gateway = module.get<CameraCaptureGateway>(CameraCaptureGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
