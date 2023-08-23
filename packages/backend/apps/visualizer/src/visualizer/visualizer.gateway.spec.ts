import { Test, TestingModule } from '@nestjs/testing';
import { VisualizerGateway } from './visualizer.gateway';

describe('visualizerGateway', () => {
  let gateway: VisualizerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisualizerGateway],
    }).compile();

    gateway = module.get<VisualizerGateway>(VisualizerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
