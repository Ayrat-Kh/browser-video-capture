import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { VisualizerModule } from './visualizer/visualizer.module';
import { PingModule } from './ping/ping.module';
import { ConfigurationModule } from './config/configuration.module';

@Module({
  imports: [
    PingModule,
    VisualizerModule,
    EventEmitterModule.forRoot(),
    ConfigurationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
