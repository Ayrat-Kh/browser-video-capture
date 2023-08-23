import { Module } from '@nestjs/common';

import { StreamerService } from './streamer.service';
import { StreamerGateway } from './streamer.gateway';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule],
  providers: [StreamerService, StreamerGateway],
})
export class StreamerModule {}
