export interface StreamVideoChunkParams {
  sensorId: string;
  sensorName: string;
  isFirstChunk: string;
  chunk: Blob;
}

export interface StreamVideoChunkResult {
  isSuccess: boolean;
}

export interface WebSocketConnectParams {
  isRecorder: "yes" | "no"; // being send over http
  sensorId: string;
  sensorName: string;
}

// export interface WebSocketSubscribeToLatestImage {
//   sensorId: string;
// }
