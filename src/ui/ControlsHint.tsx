import { useGameStore } from '../store/gameStore';

export function ControlsHint() {
  const showHint = useGameStore((s) => s.showHint);
  const locked = useGameStore((s) => s.locked);

  if (!showHint || locked) return null;

  return (
    <div className="hint">
      <h1>Voxel Sandbox</h1>
      <p>Click to play</p>
      <ul>
        <li>
          <kbd>WASD</kbd> move · <kbd>Space</kbd> jump · <kbd>Shift</kbd> sprint
        </li>
        <li>Left click break · Right click place</li>
        <li>
          <kbd>1</kbd>–<kbd>9</kbd> hotbar · <kbd>V</kbd> FPP/TPP · <kbd>Esc</kbd> release mouse
        </li>
      </ul>
    </div>
  );
}
