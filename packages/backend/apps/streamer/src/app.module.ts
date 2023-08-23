import { Module } from '@nestjs/common';

import { CameraCaptureModule } from './streamer/streamer.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';

@Module({
  imports: [PingModule, CameraCaptureModule, ConfigurationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
