import { useGameStore } from '../store/gameStore';

export function ControlsHint() {
  const showHint = useGameStore((s) => s.showHint);
  const locked = useGameStore((s) => s.locked);
  const paletteOpen = useGameStore((s) => s.paletteOpen);

  if (!showHint || locked || paletteOpen) return null;

  return (
    <div className="hint">
      <h1>Voxel Sandbox</h1>
      <p>Creative mode — unlimited blocks</p>
      <ul>
        <li>
          <kbd>WASD</kbd> move · <kbd>Space</kbd> jump · double-<kbd>Space</kbd> fly
        </li>
        <li>Left click break · Right click place · Middle click pick</li>
        <li>
          <kbd>E</kbd> palette · <kbd>1</kbd>–<kbd>9</kbd> hotbar · <kbd>V</kbd> camera ·{' '}
          <kbd>Esc</kbd> release
        </li>
      </ul>
    </div>
  );
}
