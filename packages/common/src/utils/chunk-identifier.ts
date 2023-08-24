import { ChunkIdentifier } from "src/types/chunk";

export const identifierToString = ({
  organizationId,
  sensorId,
}: ChunkIdentifier): string => {
  return `${organizationId}_${sensorId}`;
};
