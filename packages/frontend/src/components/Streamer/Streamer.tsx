import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TypeOf } from 'zod';
import { v4 } from 'uuid';

import { CAMERA_RESOLUTION } from '@webcam/common';
import { Input } from 'src/atoms/ui/input';
import { CameraRecorderService } from 'src/services/camera-recorder-web-socket-service';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'src/atoms/ui/form';
import { Button } from 'src/atoms/ui/button';

const schema = z.object({
  sensorId: z.string().min(3, { message: 'Required' }),
  sensorName: z.string().min(3, { message: 'Required' }),
  organizationId: z.string().min(3, { message: 'Required' }),
});

type Schema = TypeOf<typeof schema>;

export const Streamer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [steamerService, setSteamerService] =
    useState<CameraRecorderService | null>(null);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });
  const { reset: resetForm } = form;

  const handleCapture = async (values: Schema) => {
    if (steamerService) {
      await steamerService?.close();
      setSteamerService(null);
      return;
    }

    localStorage.setItem('session', JSON.stringify(values));

    const ss = new CameraRecorderService({
      ...values,
      makeTestApi: true,
    });

    await ss.initialize();
    await ss.start();

    const stream = ss.getStream();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    setSteamerService(ss);
  };

  const handleGenerateId = () => {
    form.setValue('sensorId', v4(), {
      shouldTouch: true,
      shouldValidate: true,
    });
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

          <div className="grid grid-cols-4 items-end gap-x-2">
            <FormField
              control={form.control}
              name="sensorId"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Sensor id</FormLabel>
                  <FormControl>
                    <Input disabled placeholder="Sensor id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleGenerateId}>
              Generate id
            </Button>
          </div>

          <FormField
            control={form.control}
            name="sensorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sensor name</FormLabel>
                <FormControl>
                  <Input placeholder="Sensor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="self-end">
            {steamerService ? 'Stop' : 'Start capture'}
          </Button>
        </form>
      </Form>
      <video
        className="border aspect-video w-100 max-w-2xl mt-2"
        ref={videoRef}
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
        muted
        autoPlay
      />
    </div>
  );
};
