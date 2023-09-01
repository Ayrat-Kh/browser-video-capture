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
  width: number;
  height: number;
}

export type ChunkIdentifier = Pick<
  StreamVideoChunkParams,
  "organizationId" | "sensorId"
>;
