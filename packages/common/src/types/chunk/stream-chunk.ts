export interface StreamVideoChunkParams {
  organizationId: string;
  sensorId: string;
  sensorName: string;
}

export interface StreamVideoChunkResult {
  isSuccess: boolean;
}

export interface WebSocketConnectParams {
  sensorId: string;
  sensorName: string;
  organizationId: string;
}

export type ChunkIdentifier = Pick<
  StreamVideoChunkParams,
  "organizationId" | "sensorId"
>;
