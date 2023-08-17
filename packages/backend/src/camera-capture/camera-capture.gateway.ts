import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WriteStream } from 'node:fs';
import { join } from 'node:path';
import { Server } from 'socket.io';

import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from 'ffmpeg-static';
import { ChildProcess, spawn } from 'node:child_process';
// import { initChunk, pushToEmitter } from 'src/stream-emitter';

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

const images = '/home/red-tech/dev/public/imgs';

const localFileName = join('/home/red-tech/dev/public', 'video.mpd');

@WebSocketGateway({
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
  namespace: 'camera',
  maxHttpBufferSize: 100_000_000,
})
export class CameraCaptureGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private ffmpeg: ChildProcess;

  handleConnection(client: any, ...args: any[]) {
    this.ffmpeg = spawn(
      ffmpegPath as unknown as string,
      [
        '-re',
        ...['-i', '-'],
        ...['-c:v', 'libx264'],
        '-an',
        ...['-tune', 'zerolatency'],
        ...['-f', 'flv'],
        'pipe:1',
      ],
      { stdio: ['pipe'] },
    );
    this.ffmpeg.stdio[1].on('data', (chunk: Buffer) => {
      // initChunk('1', chunk);
      // pushToEmitter('1', chunk);
    });
    this.ffmpeg.stderr.on('data', (chunk: Buffer) => {
      console.log('error', chunk.toString());
    });
    // for creating images
    // this.ffmpeg = spawn(ffmpegPath as unknown as string, [
    //   // '-y',
    //   '-i',
    //   '-',
    //   '-qscale:v',
    //   '4',
    //   // '-vf',
    //   // 'fps=20',
    //   // 'scale=1080:-1',
    //   `${images}/out%d.jpg`,
    // ]);
    // this.ffmpeg.stderr.on('data', (chunk: Buffer) => {
    //   console.error('error', chunk.toString());
    // });
    // this.ffmpeg = spawn(ffmpegPath as unknown as string, [
    //   // '-y',
    //   '-i',
    //   '-',
    //   '-qscale:v',
    //   '4',
    //   '-pix_fmt',
    //   'yuvj420p',
    //   '-f',
    //   'image2pipe',
    //   '-',
    //   // '-vf',
    //   // 'fps=20',
    //   // 'scale=1080:-1',
    //   // `${images}/out%d.jpg`,
    // ]);
    // this.ffmpeg.on('error', (error) => {
    //   console.log('error', error);
    // });
    // this.ffmpeg.on('close', (error, signal) => {
    //   console.log('close', error, signal);
    // });
    // this.ffmpeg.on('exit', (error, signal) => {
    //   console.log('exit', error, signal);
    // });
    // this.ffmpeg.on('disconnect', (...args) => {
    //   console.log('disconnect', ...args);
    // });
    // this.ffmpeg.stderr.on('data', (chunk: Buffer) => {
    //   console.error('data', chunk.toString());
    // });
    // this.ffmpeg.stdout.on('data', (chunk: Buffer) => {
    //   console.error('data', chunk.byteLength);
    // });
    // ------------------------------------------------------------------------
    // for generating streams
    // this.ffmpeg = spawn(ffmpegPath as unknown as string, [
    //   '-re',
    //   '-i',
    //   '-',
    //   // ...['-flags', '+global_header', '-r', '20'],
    //   // ...['-filter_complex', 'scale=1920x1080'],
    //   ...[
    //     // '-pix_fmt', 'yuv420p', '-c:v', 'libx264'
    //     '-c:v',
    //     'libx264',
    //     '-b:v:0',
    //     '500K',
    //     // '-b:v:1',
    //     // '200K',
    //     '-s:v:0',
    //     '960x400',
    //     // '-s:v:1',
    //     // '720x300',
    //   ],
    //   // ...['-preset', 'veryfast', '-tune', 'zerolatency'],
    //   ...['-adaptation_sets', 'id=0,streams=v id=1,streams=a'],
    //   ...[
    //     // '-window_size',
    //     // '5',
    //     // '-ldash',
    //     // '1',
    //     '-streaming',
    //     '1',
    //     // '-frag_type',
    //     // 'every_frame',
    //     '-use_timeline',
    //     '1',
    //     '-utc_timing_url',
    //     'http://time.akamai.com?iso&amp;ms',
    //     '-format_options',
    //     'movflags=cmaf',
    //     // '-timeout',
    //     // '0.5',
    //     // '-write_prft',
    //     // '1',
    //     // '-target_latency',
    //     // '3.0',
    //     // '-http_user_agent',
    //     // 'Akamai_Broadcaster_v1.0',
    //     // '-http_persistent',
    //     // '1',
    //     '-media_seg_name',
    //     'chunk-stream_$RepresentationID$-$Number%05d$.$ext$',
    //     '-init_seg_name',
    //     'init-stream_$RepresentationID$.$ext$',
    //   ],
    //   // ...[
    //   //   '-format_options',
    //   //   "'movflags=cmaf' -timeout 0.5 -write_prft 1 -target_latency '3.0'",
    //   // ],
    //   // ...['-http_persistent', '1', '-method', 'PUT'],
    //   // '-f',
    //   // 'dash',
    //   // 'http://localhost:3002/dash/test.mpd',
    //   // '-hls_segment_type',
    //   // 'event',
    //   localFileName,
    // ]);
    // this.ffmpeg.on('error', (error) => {
    //   console.log('error', error);
    // });
    // this.ffmpeg.on('close', (error, signal) => {
    //   console.log('close', error, signal);
    // });
    // this.ffmpeg.on('exit', (error, signal) => {
    //   console.log('exit', error, signal);
    // });
    // this.ffmpeg.on('disconnect', (...args) => {
    //   console.log('disconnect', ...args);
    // });
    // // this.ffmpeg.on('message', (chunk: Buffer) => {
    // //   console.error('error', chunk.toString());
    // // });
    // this.ffmpeg.stderr.on('data', (chunk: Buffer) => {
    //   console.error('error', chunk.toString());
    // });
  }
  handleDisconnect(client: any) {
    // this.ffmpeg.kill();
  }
  afterInit(server: any) {}
  @WebSocketServer()
  server: Server;

  stream: WriteStream;

  @SubscribeMessage('upload')
  handleMessage(@MessageBody() data: Buffer): void {
    // initChunk('1', data);
    // pushToEmitter('1', data);

    this.ffmpeg.stdin.write(data);

    // ffmpeg()
    //   .input(Readable.from(data))
    //   // .videoCodec('libx264')
    //   // .format('mp4')
    //   // .noAudio()
    //   .fps(20)
    //   .inputOptions(['-re'])
    //   // .inputOption("-re")
    //   // .outputOptions([
    //   //   // "-frag_duration 100",
    //   //   // "-movflags frag_keyframe+empty_moov",
    //   //   // "-pix_fmt yuv420p",
    //   // ])
    //   .on('error', function (err, stdout, stderr) {
    //     console.log('Cannot process video: ' + err.message);
    //   })
    //   // .pipe(response, { end: true })
    //   // .outputOptions([
    //   //   '-frag_duration 1',
    //   //   '-movflags frag_keyframe+faststart',
    //   //   '-pix_fmt yuv420p',
    //   // ])
    //   // .outputOptions(['-vf'])
    //   .com.output('images/out%d.jpg', { end: true })
    //   .run();
  }
}
