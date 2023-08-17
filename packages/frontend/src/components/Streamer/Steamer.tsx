import { CAMERA_RESOLUTION } from '@webcam/common';
import { useRef } from 'react';
import { CameraRecorderService } from 'src/services/camera-recorder-service';

export const Streamer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const steamerService = useRef<CameraRecorderService | null>(null);

  const handleCapture = async () => {
    await steamerService.current?.close();

    steamerService.current = new CameraRecorderService({
      sensorId: 'sensorId',
      sensorName: 'sensorName',
      makeTestApi: true,
    });

    await steamerService.current.initialize();
    await steamerService.current.start();

    const stream = steamerService.current.getStream();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      steamerService.current?.close();
    };
  };

  return (
    <div>
      <button onClick={handleCapture}>Start capture</button>
      <video
        ref={videoRef}
        style={CAMERA_RESOLUTION}
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
        muted
        autoPlay
      />
    </div>
  );
};
