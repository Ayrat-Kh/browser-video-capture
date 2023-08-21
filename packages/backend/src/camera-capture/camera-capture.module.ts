import { Module } from '@nestjs/common';

import { CameraCaptureController } from './camera-capture.controller';
import { CameraCaptureService } from './camera-capture.service';
import { CameraCaptureGateway } from './camera-capture.gateway';
import { ConfigurationModule } from '../config/configuation.module';

@Module({
  imports: [ConfigurationModule],
  providers: [CameraCaptureService, CameraCaptureGateway],
  controllers: [CameraCaptureController],
})
export class CameraCaptureModule {}
