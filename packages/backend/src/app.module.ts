import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CameraCaptureModule } from './camera-capture/camera-capture.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';

@Module({
  imports: [
    PingModule,
    CameraCaptureModule,
    EventEmitterModule.forRoot(),
    ConfigurationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
