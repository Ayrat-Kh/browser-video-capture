import { Module } from '@nestjs/common';

import { VisualizerModule } from './visualizer/visualizer.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';

@Module({
  imports: [PingModule, VisualizerModule, ConfigurationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
