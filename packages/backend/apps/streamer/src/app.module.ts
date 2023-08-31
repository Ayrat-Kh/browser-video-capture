import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { VideoCaptureModule } from './video-capture/video-capture.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';
import { ProvidersModule } from './providers/ProvidersModule';

@Module({
  imports: [
    ProvidersModule,
    PingModule,
    VideoCaptureModule,
    ConfigurationModule,
    EventEmitterModule.forRoot(),
  ],
})
export class AppModule {}
