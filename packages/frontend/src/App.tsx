import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Streamer } from 'src/components/Streamer';

import { FlvPlayer } from 'src/components/FlvPlayer';
import { ImagePlayer } from './components/ImagePlayer';

const router = createBrowserRouter([
  {
    path: '/streamer',
    element: <Streamer />,
  },
  {
    path: '/flv/player',
    element: <FlvPlayer />,
  },
  {
    path: '/image/player',
    element: <ImagePlayer />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
