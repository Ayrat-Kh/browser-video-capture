import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Streamer } from 'src/components/Streamer';

import { Player } from 'src/components/Player';
import { PlayerRealtime } from 'src/components/Player-realtime';
import { PlayerWs } from './components/Player-ws';

const router = createBrowserRouter([
  {
    path: '/streamer',
    element: <Streamer />,
  },
  {
    path: '/player',
    element: <Player />,
  },
  {
    path: '/player-realtime',
    element: <PlayerRealtime />,
  },
  {
    path: '/player-ws',
    element: <PlayerWs />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
