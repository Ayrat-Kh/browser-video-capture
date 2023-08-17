import { StreamVideoChunkParams, StreamVideoChunkResult } from '@webcam/common';

import { APP_URL } from 'src/constants/Config';

export const recordVideoChunk = async ({
  chunk,
  sensorId,
  sensorName,
  isFirstChunk,
}: StreamVideoChunkParams): Promise<StreamVideoChunkResult> => {
  const formData = new FormData();
  formData.set('chunk', chunk);
  formData.set('sensorName', sensorName);
  formData.set('sensorId', sensorId);
  formData.set('isFirstChunk', isFirstChunk);

  const result = await fetch(`${APP_URL}/camera-capture`, {
    method: 'POST',
    body: formData,
  });
  return {
    isSuccess: result.status < 400,
  };
};

export const getImageStream = async (
  sensorId: string,
): Promise<
  | { isSuccess: false }
  | {
      isSuccess: true;
      image: Blob;
    }
> => {
  const result = await fetch(`${APP_URL}/camera-capture/${sensorId}/image`, {
    method: 'GET',
  });

  if (result.status > 350 || !result.body) {
    return {
      isSuccess: false,
    };
  }

  return {
    isSuccess: true,
    image: await result.blob(),
  };
};
