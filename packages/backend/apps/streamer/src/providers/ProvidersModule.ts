import { Module } from '@nestjs/common';

import { ConfigurationModule } from '../config/configuration.module';
import { ImageServiceSocketProvider } from './ImageServiceSocketProvider';

@Module({
  imports: [ConfigurationModule],
  providers: [ImageServiceSocketProvider],
  exports: [ImageServiceSocketProvider],
})
export class ProvidersModule {}
