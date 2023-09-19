import 'reflect-metadata';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Toaster } from 'src/atoms/ui/toaster';
import { Streamer } from 'src/components/Streamer';
import { ImagePlayer } from 'src/components/ImagePlayer';
import { Home } from 'src/components/Home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
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
