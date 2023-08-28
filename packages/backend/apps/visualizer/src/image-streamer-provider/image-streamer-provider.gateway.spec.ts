import { Test, TestingModule } from '@nestjs/testing';
import { ImageStreamerGateway } from './image-streamer-provider.gateway';

describe('visualizerGateway', () => {
  let gateway: ImageStreamerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageStreamerGateway],
    }).compile();

    gateway = module.get<ImageStreamerGateway>(ImageStreamerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
