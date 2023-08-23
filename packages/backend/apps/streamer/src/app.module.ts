import { Module } from '@nestjs/common';

import { StreamerModule } from './streamer/streamer.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [PingModule, StreamerModule, ConfigurationModule, PlayerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
