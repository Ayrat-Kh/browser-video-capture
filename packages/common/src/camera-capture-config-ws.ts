export const WS_NS = {
  VIDEO_CAPTURE: "/VIDEO_CAPTURE",
  STREAMER: "/STREAMER",
  STREAMER_PROVIDER: "/STREAMER_PROVIDER",
} as const;

export const VIDEO_WS_EVENTS = {
  UPLOAD_CHUNK: "video-capture.upload",
  IMAGE_PROVIDER: "streamer-provider.image",
  IMAGE: "streamer.image",
} as const;
