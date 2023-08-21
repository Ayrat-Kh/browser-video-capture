import { useRef } from 'react';
import mpegts from 'mpegts.js';

import { APP_URL } from 'src/constants/Config';
import { CAMERA_RESOLUTION } from '@webcam/common';

export const PlayerRealtime: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<mpegts.Player | null>(null);

  const handlePlay = () => {
    playerRef.current?.pause();

    if (mpegts.isSupported() && videoRef.current) {
      const player = mpegts.createPlayer(
        {
          type: 'flv',
          isLive: true,
          hasVideo: true,
          hasAudio: false,
          url: `${APP_URL}/camera-capture/sensorId/real-time`,
        },
        {
          isLive: true,
          liveBufferLatencyChasing: true,
        },
      );
      player.attachMediaElement(videoRef.current);
      player.load();
      player.play();

      playerRef.current = player;
    }
  };

  return (
    <div>
      <button onClick={handlePlay}>Play</button>
      <video
        ref={videoRef}
        style={CAMERA_RESOLUTION}
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
      />
    </div>
  );
};
