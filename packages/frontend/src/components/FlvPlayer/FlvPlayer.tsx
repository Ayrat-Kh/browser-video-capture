import { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import { useForm } from 'react-hook-form';
import { type TypeOf, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { STREAMER_APP_URL } from 'src/constants/Config';
import { CAMERA_RESOLUTION } from '@webcam/common';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'src/atoms/ui/form';
import { Input } from 'src/atoms/ui/input';
import { Button } from 'src/atoms/ui/button';

const schema = z.object({
  sensorId: z.string().min(3, { message: 'Required' }),
  sensorName: z.string().min(3, { message: 'Required' }),
  organizationId: z.string().min(3, { message: 'Required' }),
});

type Schema = TypeOf<typeof schema>;

export const FlvPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [player, setPlayer] = useState<mpegts.Player | null>(null);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });
  const { reset: resetForm } = form;

  const handleCapture = async (values: Schema) => {
    if (player) {
      player?.destroy();
      setPlayer(null);
      return;
    }

    if (mpegts.isSupported() && videoRef.current) {
      const player = mpegts.createPlayer(
        {
          type: 'flv',
          isLive: true,
          hasVideo: true,
          hasAudio: false,
          url: `${STREAMER_APP_URL}/org/${values.organizationId}/player/${values.sensorId}`,
        },
        {
          isLive: true,
          liveBufferLatencyChasing: true,
        },
      );
      player.attachMediaElement(videoRef.current);
      player.load();
      player.play();

      setPlayer(player);
    }
  };

  useEffect(() => {
    try {
      const item = localStorage.getItem('session');

      if (!item) {
        return;
      }

      resetForm(JSON.parse(item) as Schema);
    } catch (e) {
      // do nothing
    }
  }, [resetForm]);

  return (
    <div className="p-2">
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
      <video
        className="border aspect-video w-100 max-w-2xl mt-2"
        ref={videoRef}
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
      />
    </div>
  );
};
