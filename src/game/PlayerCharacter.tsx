import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerCharacterProps {
  position: MutableRefObject<{ x: number; y: number; z: number }>;
  yaw: MutableRefObject<number>;
  moving: MutableRefObject<boolean>;
  visible: boolean;
}

/** Simple blocky Steve-style avatar */
export function PlayerCharacter({ position, yaw, moving, visible }: PlayerCharacterProps) {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(0);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.visible = visible;
    if (!visible) return;

    group.current.position.set(position.current.x, position.current.y, position.current.z);
    // Match look-forward (-sin(yaw), -cos(yaw)) to local -Z
    group.current.rotation.y = -yaw.current;

    if (moving.current) {
      walkPhase.current += dt * 10;
    } else {
      walkPhase.current *= 0.85;
    }
    const swing = Math.sin(walkPhase.current) * 0.55;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
  });

  return (
    <group ref={group} visible={visible}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial color="#c68642" />
      </mesh>
      <mesh position={[0, 1.68, 0]}>
        <boxGeometry args={[0.52, 0.12, 0.52]} />
        <meshLambertMaterial color="#3b2a1a" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.28]} />
        <meshLambertMaterial color="#3d6db5" />
      </mesh>
      <mesh ref={leftArm} position={[-0.38, 1.15, 0]}>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshLambertMaterial color="#c68642" />
      </mesh>
      <mesh ref={rightArm} position={[0.38, 1.15, 0]}>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshLambertMaterial color="#c68642" />
      </mesh>
      <mesh ref={leftLeg} position={[-0.14, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshLambertMaterial color="#2f3f75" />
      </mesh>
      <mesh ref={rightLeg} position={[0.14, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshLambertMaterial color="#2f3f75" />
      </mesh>
    </group>
  );
}
