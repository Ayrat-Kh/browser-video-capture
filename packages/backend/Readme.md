## How is streamer backend converting video stream to image.

In
`./packages/backend/apps/streamer/src/video-capture/video-capture.service.ts, ` `initEncoder` method we initialize ffmpeg.

In
`./packages/backend/apps/streamer/src/video-capture/video-capture.service.ts, ` `#sendImage` method ffmpeg returns images. Here is the trick: max buffer size is `65536`, if the image size is > the value we should concat bytes. Calling the event emitter with `VideoCaptureEvents.ImageCapture` event the system sends the image to visualizer backend. Also, here in `/home/red-tech/dev/webcam-analyzer/packages/backend/apps/streamer/src/video-capture/video-capture.listener.ts` the point where we can inject any other services for messaging.
