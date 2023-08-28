import { Module } from '@nestjs/common';

import { ImageStreamerProviderGateway } from './image-streamer-provider.gateway';
import { ConfigurationModule } from '../config/configuration.module';
import { VisualizerModule } from '../visualizer/visualizer.module';

@Module({
  imports: [ConfigurationModule, VisualizerModule],
  providers: [ImageStreamerProviderGateway],
})
export class ImageStreamerProviderModule {}
