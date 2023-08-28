import { Module } from '@nestjs/common';

import { VisualizerGateway } from './visualizer.gateway';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule],
  providers: [VisualizerGateway],
  exports: [VisualizerGateway],
})
export class VisualizerModule {}
