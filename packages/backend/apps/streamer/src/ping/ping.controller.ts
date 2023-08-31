import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  get(): { message: string } {
    return { message: 'pong streamer' };
  }
}
