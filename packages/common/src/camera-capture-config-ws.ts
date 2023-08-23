export const CAMERA_CAPTURE_NS = "/recorder";

export const VIDEO_WS_EVENTS = {
  UPLOAD_CHUNK: "stream-chunk.upload",
  LATEST_IMAGE_REQUEST: "stream-chunk.download-latest-image-request",
  LATEST_IMAGE: "stream-chunk.download-latest-image",
} as const;
