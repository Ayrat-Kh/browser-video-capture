import { Test, TestingModule } from '@nestjs/testing';
import { CameraCaptureController } from './camera-capture.controller';

describe('CameraCaptureController', () => {
  let controller: CameraCaptureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CameraCaptureController],
    }).compile();

    controller = module.get<CameraCaptureController>(CameraCaptureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
