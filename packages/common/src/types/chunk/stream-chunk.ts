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
  sensorId: string;
  sensorName: string;
}

// export interface WebSocketSubscribeToLatestImage {
//   sensorId: string;
// }
