import { Module } from '@nestjs/common';

import { ConfigurationService } from './configuration.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
