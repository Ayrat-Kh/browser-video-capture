export interface StreamVideoChunkParams {
  sensorId: string;
  sensorName: string;
  isFirstChunk: string;
  chunk: Blob;
}

export interface StreamVideoChunkResult {
  isSuccess: boolean;
}
