import { CAMERA_RESOLUTION } from '@webcam/common';
import { useEffect, useRef } from 'react';
import { CameraStreamService } from 'src/services/camera-stream-service-web-socket';

export const PlayerWs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const streamer = new CameraStreamService({
      sensorId: 'sensorId',
      canvas: canvasRef.current,
    });

    streamer.initialize();

    return () => {
      streamer.close();
    };
  }, []);

  return (
    <canvas
      style={CAMERA_RESOLUTION}
      width={CAMERA_RESOLUTION.width}
      height={CAMERA_RESOLUTION.height}
      ref={canvasRef}
    />
  );
};
