import { useEffect, useRef, useState } from 'react';
import { type TypeOf, z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';

import { CameraStreamService } from 'src/services/camera-stream-service';
import { Button } from 'src/atoms/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'src/atoms/ui/form';
import { Input } from 'src/atoms/ui/input';
import { CAMERA_RESOLUTION } from 'src/constants/Config';

const schema = z.object({
  sensorId: z.string().min(3, { message: 'Required' }),
  organizationId: z.string().min(3, { message: 'Required' }),
});

type Schema = TypeOf<typeof schema>;

export const ImagePlayer: React.FC = () => {
  const [searchParams] = useSearchParams();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [player, setPlayer] = useState<CameraStreamService | null>(null);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });
  const { reset: resetForm } = form;

  const handleCapture = async (values: Schema) => {
    if (player) {
      player?.close();
      setPlayer(null);
      return;
    }

    if (!canvasRef.current) {
      return;
    }

    const streamer = new CameraStreamService();

    streamer.initialize({
      ...values,
      canvas: canvasRef.current,
    });

    setPlayer(streamer);
  };

  useEffect(() => {
    try {
      const item = localStorage.getItem('visualizer-session');

      if (!item) {
        return;
      }

      resetForm(JSON.parse(item) as Schema);
    } catch (e) {
      // do nothing
    }
  }, [resetForm]);

  useEffect(() => {
    const organizationId = searchParams.get('organizationId');
    const sensorId = searchParams.get('sensorId');

    if (sensorId && organizationId) {
      const values = {
        organizationId,
        sensorId,
        sensorName: '',
      } as Schema;

      resetForm(values);
      localStorage.setItem('visualizer-session', JSON.stringify(values));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold">Visualizer</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCapture)}
          className="flex flex-col space-y-2 max-w-2xl"
        >
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization id</FormLabel>
                <FormControl>
                  <Input placeholder="Organization id" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sensorId"
            render={({ field }) => (
              <FormItem className="col-span-3">
                <FormLabel>Sensor id</FormLabel>
                <FormControl>
                  <Input placeholder="Sensor id" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="self-end">
            {player ? 'Stop' : 'Start playing'}
          </Button>
        </form>
      </Form>
      <canvas
        className="border aspect-video w-full max-w-6xl mt-2"
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
        ref={canvasRef}
      />
    </div>
  );
};
