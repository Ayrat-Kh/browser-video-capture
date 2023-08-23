import { useEffect, useRef } from 'react';
import { type TypeOf, z } from 'zod';

import { CAMERA_RESOLUTION } from '@webcam/common';
import { CameraStreamService } from 'src/services/camera-stream-service-web-socket';

const schema = z.object({
  sensorId: z.string().min(3, { message: 'Required' }),
  sensorName: z.string().min(3, { message: 'Required' }),
  organizationId: z.string().min(3, { message: 'Required' }),
});

type Schema = TypeOf<typeof schema>;

export const ImagePlayer: React.FC = () => {
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
