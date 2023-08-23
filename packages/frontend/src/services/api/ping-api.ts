import { STREAMER_APP_URL, PLAYER_APP_URL } from 'src/constants/Config';
import type { PingResult } from '@webcam/common';

export const streamerPing = async (): Promise<PingResult> => {
  try {
    const result = await fetch(`${STREAMER_APP_URL}/ping`);
    return {
      isSuccess: result.status < 400,
    };
  } catch (e) {
    return {
      isSuccess: false,
    };
  }
};

export const visualizerPing = async (): Promise<PingResult> => {
  try {
    const result = await fetch(`${PLAYER_APP_URL}/ping`);
    return {
      isSuccess: result.status < 400,
    };
  } catch (e) {
    return {
      isSuccess: false,
    };
  }
};
