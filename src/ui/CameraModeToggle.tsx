import { useGameStore } from '../store/gameStore';

export function CameraModeToggle() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode);

  return (
    <button
      type="button"
      className={`camera-toggle${cameraMode === 'tpp' ? ' active' : ''}`}
      onMouseDown={(e) => {
        // Prefer mousedown so it works even if click is eaten after pointer-lock unlock
        e.preventDefault();
        e.stopPropagation();
        toggleCameraMode();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      title="Toggle first / third person (V)"
    >
      <span className="camera-toggle-label">{cameraMode === 'fpp' ? 'First Person' : 'Third Person'}</span>
      <span className="camera-toggle-hint">V</span>
    </button>
  );
}
