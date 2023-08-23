import { Module } from '@nestjs/common';

import { PlayerController } from './player.controller';
import { StreamerModule } from '../streamer/streamer.module';

@Module({
  imports: [StreamerModule],
  controllers: [PlayerController],
})
export class PlayerModule {}
