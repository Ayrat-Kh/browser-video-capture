import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { StreamVideoChunkParams } from '@webcam/common';
import { CameraCaptureService } from './camera-capture.service';

@Controller('camera-capture')
export class CameraCaptureController {
  constructor(private readonly cameraCaptureService: CameraCaptureService) {}

  @Post()
  @UseInterceptors(FileInterceptor('chunk'))
  async postChunk(
    @UploadedFile() chunk: Express.Multer.File,
    @Body()
    {
      sensorId,
      sensorName,
      isFirstChunk,
    }: Pick<StreamVideoChunkParams, 'sensorId' | 'sensorName' | 'isFirstChunk'>,
  ) {
    await this.cameraCaptureService.saveChunk({
      sensorId,
      sensorName,
      chunk: chunk.buffer,
      isFirstChunk: isFirstChunk === 'true',
    });
  }

  @Get('/:sensorId/real-time')
  async get(
    @Param('sensorId') sensorId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // const firstChunk = this.cameraCaptureService.getFirstFlvChunk(sensorId);
    // if (!firstChunk) {
    //   response.status(400);
    //   return response.send({
    //     isSuccess: false,
    //     message: 'No stream initiated',
    //   });
    // }
    // response.setHeader('Content-Type', 'video/x-flv');
    // response.setHeader('Access-Control-Allow-Origin', '*');
    // response.write(firstChunk);
    // function stream(chunk: Buffer) {
    //   response.write(chunk);
    // }
    // this.cameraCaptureService.subscribeVideoStreamToEmitter(sensorId, stream);
    // request.on('close', () => {
    //   this.cameraCaptureService.unsubscribeVideoStreamToEmitter(
    //     sensorId,
    //     stream,
    //   );
    //   response.send();
    // });
  }

  @Get('/:sensorId/image')
  async getLatestImage(
    @Param('sensorId') sensorId: string,
    @Res() response: Response,
  ) {
    const latestImage = await this.cameraCaptureService.getLatestImage(
      sensorId,
    );

    if (!latestImage) {
      response.status(400);
      response.send({
        isSuccess: false,
      });
      return;
    }
    response.setHeader('Content-Type', 'image/jpeg');

    latestImage.pipe(response, { end: true });
  }
}
