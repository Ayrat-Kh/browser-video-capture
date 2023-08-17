import { Module } from '@nestjs/common';

import { CameraCaptureController } from './camera-capture.controller';
import { CameraCaptureService } from './camera-capture.service';
import { ConfigurationModule } from 'src/config/configuation.module';

@Module({
  imports: [ConfigurationModule],
  providers: [CameraCaptureService],
  controllers: [CameraCaptureController],
})
export class CameraCaptureModule {}
