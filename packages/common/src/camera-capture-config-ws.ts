export const CAMERA_CAPTURE_NS = "/camera-capture";

export const VIDEO_WS_EVENTS = {
  UPLOAD_CHUNK: "stream-chunk.upload",
  // SUBSCRIBE_TO_LATEST_IMAGE: "stream-chunk.subscribe-to-latest-image",
  LATEST_IMAGE_REQUEST: "stream-chunk.download-latest-image-request",
  LATEST_IMAGE: "stream-chunk.download-latest-image",
} as const;
