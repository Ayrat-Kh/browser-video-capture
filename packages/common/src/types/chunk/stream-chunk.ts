import { Type as CtType } from "class-transformer";

export interface StreamVideoChunkParams {
  organizationId: string;
  sensorId: string;
  sensorName: string;
}

export interface StreamVideoChunkResult {
  isSuccess: boolean;
}

export class WebSocketConnectParams {
  sensorId: string;
  sensorName: string;
  organizationId: string;

  @CtType(function () {
    return Number;
  })
  width: number;

  @CtType(() => Number)
  height: number;

  constructor(partial: Partial<WebSocketConnectParams>) {
    Object.assign(this, partial);
  }
}

export type ChunkIdentifier = Pick<
  StreamVideoChunkParams,
  "organizationId" | "sensorId"
>;
