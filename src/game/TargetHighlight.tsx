import { useGameStore } from '../store/gameStore';

export function TargetHighlight() {
  const target = useGameStore((s) => s.target);
  if (!target) return null;

  return (
    <mesh position={[target.x + 0.5, target.y + 0.5, target.z + 0.5]}>
      <boxGeometry args={[1.01, 1.01, 1.01]} />
      <meshBasicMaterial color="#000000" wireframe transparent opacity={0.85} />
    </mesh>
  );
}
