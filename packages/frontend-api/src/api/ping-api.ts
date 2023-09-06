import type { PingResult } from '@webcam/common';

export const streamerPing = async (appUrl: string): Promise<PingResult> => {
  try {
    const result = await fetch(`${appUrl}/ping`);
    return {
      isSuccess: result.status < 400,
    };
  } catch (e) {
    return {
      isSuccess: false,
    };
  }
};
