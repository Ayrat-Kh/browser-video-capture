import { Module } from '@nestjs/common';

import { VisualizerModule } from './visualizer/visualizer.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';
import { ImageStreamerProviderModule } from './image-streamer-provider/image-streamer-provider.module';

@Module({
  imports: [
    PingModule,
    VisualizerModule,
    ConfigurationModule,
    ImageStreamerProviderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
