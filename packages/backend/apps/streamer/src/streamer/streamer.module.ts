import { Module } from '@nestjs/common';

import { StreamerService } from './streamer.service';
import { CameraCaptureGateway } from './streamer.gateway';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule],
  providers: [StreamerService, CameraCaptureGateway],
})
export class CameraCaptureModule {}
