import { ChunkIdentifier } from "../types";

export const identifierToString = ({
  organizationId,
  sensorId,
}: ChunkIdentifier): string => {
  return `${organizationId}_${sensorId}`;
};
