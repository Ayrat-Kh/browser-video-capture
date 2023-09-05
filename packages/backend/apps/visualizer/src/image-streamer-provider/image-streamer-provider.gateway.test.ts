import { Test, TestingModule } from '@nestjs/testing';
import { ImageStreamerProviderGateway } from './image-streamer-provider.gateway';
import { VisualizerGateway } from '../visualizer/visualizer.gateway';

describe('visualizerGateway', () => {
  let gateway: ImageStreamerProviderGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageStreamerProviderGateway, VisualizerGateway],
    }).compile();

    gateway = module.get<ImageStreamerProviderGateway>(
      ImageStreamerProviderGateway,
    );
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
