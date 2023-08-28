import { Module } from '@nestjs/common';

import { VideoCaptureService } from './video-capture.service';
import { VideoCaptureGateway } from './video-capture.gateway';
import { ConfigurationModule } from '../config/configuration.module';
import { VideoCaptureListener } from './video-capture.listener';
import { ProvidersModule } from '../providers/ProvidersModule';

@Module({
  imports: [ConfigurationModule, ProvidersModule],
  providers: [VideoCaptureListener, VideoCaptureGateway, VideoCaptureService],
  exports: [VideoCaptureService],
})
export class VideoCaptureModule {}
