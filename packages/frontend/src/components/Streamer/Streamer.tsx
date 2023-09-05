import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, type TypeOf } from 'zod';
import { v4 } from 'uuid';

import { Input } from 'src/atoms/ui/input';
import { CameraRecorderService } from 'src/services/camera-recorder-service';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'src/atoms/ui/form';
import { Button } from 'src/atoms/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/atoms/ui/select';
import { useToast } from 'src/atoms/ui/use-toast';
import { CAMERA_RESOLUTION } from 'src/constants/Config';

const schema = z.object({
  sensorId: z.string().min(3, { message: 'Required' }),
  sensorName: z.string().min(3, { message: 'Required' }),
  organizationId: z.string().min(3, { message: 'Required' }),
  cameraDeviceId: z.string().min(1, { message: 'Required' }),
});

type Schema = TypeOf<typeof schema>;

export const Streamer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [steamerService, setSteamerService] =
    useState<CameraRecorderService | null>(null);

  const { toast } = useToast();
  const [cameraDevices, setCameraDevices] = useState<
    { deviceId: string; deviceLabel: string }[]
  >([]);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });
  const { reset: resetForm } = form;

  const handleCapture = async (values: Schema) => {
    const size = CameraRecorderService.getScreenSize();

    if (videoRef.current && videoRef.current?.width !== size.width) {
      videoRef.current.width = size.width;
    }

    if (videoRef.current && videoRef.current?.height !== size.height) {
      videoRef.current.height = size.height;
    }

    if (steamerService) {
      await steamerService?.stop();
      setSteamerService(null);
      return;
    }

    localStorage.setItem('session', JSON.stringify(values));

    const ss = new CameraRecorderService({
      makeTestApi: true,
    });

    try {
      await ss.initialize(values);

      await ss.start();

      ss.onClose = () => {
        setSteamerService(null);
      };
    } catch (e) {
      console.error('Can not start stream', e);
      return;
    }

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

  const handleCopyVisualizerAddress = () => {
    const { organizationId, sensorId } = form.getValues();
    const url = `${location.origin}/image/player?${new URLSearchParams({
      organizationId,
      sensorId,
    })}`;
    navigator.clipboard.writeText(url);

    toast({
      title: 'Copied to clipboard',
      description: `Url: ${url}`,
    });
  };

  // load form data from the local storage
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

  // get all cameras
  useEffect(() => {
    CameraRecorderService.getCameraDevices().then((x) => {
      setCameraDevices(x);
    });
  }, []);

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold">Streamer</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCapture)}
          className="flex flex-col space-y-2 max-w-2xl"
        >
          <FormField
            control={form.control}
            name="cameraDeviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Camera device</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(deviceId) =>
                      deviceId && field.onChange(deviceId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Camera device" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameraDevices.map((device) => {
                        return (
                          <SelectItem
                            key={device.deviceId}
                            value={device.deviceId}
                          >
                            {device.deviceLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="grid grid-cols-4 gap-x-2">
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
            <FormItem>
              <FormLabel>&nbsp;</FormLabel>
              <FormControl>
                <Button
                  type="button"
                  className="block w-full"
                  onClick={handleGenerateId}
                >
                  Generate id
                </Button>
              </FormControl>
            </FormItem>
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

          <div className="flex self-end">
            {navigator.clipboard && (
              <Button
                type="button"
                variant="secondary"
                className="mr-2"
                onClick={handleCopyVisualizerAddress}
              >
                Copy visualizer address
              </Button>
            )}

            <Button type="submit" className="self-end">
              {steamerService ? 'Stop' : 'Start capture'}
            </Button>
          </div>
        </form>
      </Form>
      <video
        className="border aspect-video w-full max-w-2xl mt-2"
        ref={videoRef}
        width={CAMERA_RESOLUTION.width}
        height={CAMERA_RESOLUTION.height}
        muted
        autoPlay
      />
    </div>
  );
};
