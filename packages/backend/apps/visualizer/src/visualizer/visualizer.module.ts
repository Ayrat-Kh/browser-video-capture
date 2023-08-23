import { Module } from '@nestjs/common';

import { VisualizerService } from './visualizer.service';
import { VisualizerGateway } from './visualizer.gateway';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule],
  providers: [VisualizerService, VisualizerGateway],
})
export class VisualizerModule {}
