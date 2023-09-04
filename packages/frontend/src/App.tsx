import 'reflect-metadata';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Streamer } from 'src/components/Streamer';
import { ImagePlayer } from 'src/components/ImagePlayer';
import { Toaster } from 'src/atoms/ui/toaster';

const router = createBrowserRouter([
  {
    path: '/streamer',
    element: <Streamer />,
  },
  {
    path: '/image/player',
    element: <ImagePlayer />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
