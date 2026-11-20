import { Canvas } from '@react-three/fiber';
import { ChunkManager } from './game/ChunkManager';
import { DayNight } from './game/DayNight';
import { Player } from './game/Player';
import { CameraModeToggle } from './ui/CameraModeToggle';
import { ControlsHint } from './ui/ControlsHint';
import { Crosshair } from './ui/Crosshair';
import { Hotbar } from './ui/Hotbar';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Canvas
        className="game-canvas"
        shadows={false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 75, near: 0.1, far: 200, position: [0, 40, 0] }}
        onCreated={({ gl }) => {
          gl.setClearColor('#87b8e8');
        }}
      >
        <DayNight />
        <ChunkManager />
        <Player />
      </Canvas>
      <Crosshair />
      <Hotbar />
      <CameraModeToggle />
      <ControlsHint />
    </div>
  );
}
