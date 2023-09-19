import { Link } from 'react-router-dom';
import { Button } from 'src/atoms/ui/button';

export const Home: React.FC = () => {
  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold">
        Welcome to Streamer and visualizer frontend
      </h1>
      <nav>
        <Link to="/streamer">
          <Button type="button">Go to Streamer</Button>
        </Link>

        <Link to="/image/player">
          <Button className="ml-2" type="button">
            Go to Visualizer
          </Button>
        </Link>
      </nav>
    </div>
  );
};
