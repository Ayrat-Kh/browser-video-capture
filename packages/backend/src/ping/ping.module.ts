import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { PingController } from './ping.controller';

const localFileDir = '/home/red-tech/dev/public';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: localFileDir,
      serveRoot: '/public',
    }),
  ],
  controllers: [PingController],
})
export class PingModule {}
