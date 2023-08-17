import { APP_URL } from 'src/constants/Config';
import type { PingResult } from '@webcam/common';

export const ping = async (): Promise<PingResult> => {
  try {
    const result = await fetch(`${APP_URL}/ping`);
    return {
      isSuccess: result.status < 400,
    };
  } catch (e) {
    return {
      isSuccess: false,
    };
  }
};
