import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';

import { StreamerService } from '../streamer/streamer.service';

@Controller('/org/:organizationId/player')
export class PlayerController {
  constructor(private readonly streamerService: StreamerService) {}

  @Get('/:sensorId')
  async get(
    @Param('organizationId') organizationId: string,
    @Param('sensorId') sensorId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const identifier = {
      organizationId,
      sensorId,
    };

    const firstChunk = this.streamerService.getFirstFlvChunk(identifier);
    if (!firstChunk) {
      response.status(400);
      return response.send({
        isSuccess: false,
        message: 'No stream initiated',
      });
    }
    response.setHeader('Content-Type', 'video/x-flv');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.write(firstChunk);
    function stream(chunk: Buffer) {
      response.write(chunk);
    }
    this.streamerService.subscribeToVideoStream(identifier, stream);
    request.on('close', () => {
      this.streamerService.unsubscribeFromVideoStream(identifier, stream);
      response.send();
    });
  }
}
