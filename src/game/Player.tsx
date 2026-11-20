import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { castVoxelRay } from './Raycast';
import { moveWithCollision, PLAYER_EYE } from './collision';
import { PlayerCharacter } from './PlayerCharacter';
import { TargetHighlight } from './TargetHighlight';
import { world } from './world';

const MOVE_SPEED = 4.5;
const SPRINT_MULT = 1.55;
const JUMP_SPEED = 7.2;
const GRAVITY = 22;
const MOUSE_SENS = 0.0022;
const TPP_DISTANCE = 5.5;
const TPP_LOOK_HEIGHT = 1.5;

function cameraBlockedDistance(
  from: THREE.Vector3,
  to: THREE.Vector3,
  maxDist: number,
): number {
  const dir = to.clone().sub(from);
  const full = dir.length();
  if (full < 0.001) return maxDist;
  dir.multiplyScalar(1 / full);

  // Start slightly away from the player so we don't instantly hit nearby voxels
  const ox = from.x + dir.x * 0.4;
  const oy = from.y + dir.y * 0.4;
  const oz = from.z + dir.z * 0.4;
  const hit = castVoxelRay(world, ox, oy, oz, dir.x, dir.y, dir.z, full);
  if (!hit) return maxDist;
  return Math.max(1.2, Math.min(maxDist, hit.distance + 0.4 - 0.3));
}

export function Player() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const vel = useRef({ x: 0, y: 0, z: 0 });
  const pos = useRef({ x: 0.5, y: 40, z: 0.5 });
  const yawRef = useRef(0);
  const movingRef = useRef(false);
  const grounded = useRef(false);
  const spawned = useRef(false);
  const lookTarget = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const camDir = useRef(new THREE.Vector3());
  const aimDir = useRef(new THREE.Vector3());

  const locked = useGameStore((s) => s.locked);
  const cameraMode = useGameStore((s) => s.cameraMode);

  useEffect(() => {
    world.getOrCreateChunk(0, 0);
    pos.current.y = world.findSpawnY(0, 0);
    spawned.current = true;
    camera.position.set(pos.current.x, pos.current.y + PLAYER_EYE, pos.current.z);
    useGameStore.getState().setPlayerPos(pos.current.x, pos.current.y, pos.current.z);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const store = () => useGameStore.getState();

    const onClick = () => {
      if (document.pointerLockElement !== el) {
        el.requestPointerLock();
        store().dismissHint();
      }
    };

    const onLockChange = () => {
      store().setLocked(document.pointerLockElement === el);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      euler.current.y -= e.movementX * MOUSE_SENS;
      euler.current.x -= e.movementY * MOUSE_SENS;
      const mode = store().cameraMode;
      const maxPitch = mode === 'tpp' ? Math.PI / 2.4 : Math.PI / 2 - 0.01;
      euler.current.x = Math.max(-maxPitch, Math.min(maxPitch, euler.current.x));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      if (e.button === 0) store().breakBlock();
      if (e.button === 2) store().placeBlock();
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.repeat) return;

      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.replace('Digit', ''));
        if (n >= 1 && n <= 9) store().setSelectedSlot(n - 1);
      }

      if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        store().toggleCameraMode();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    el.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);

    return () => {
      el.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (!spawned.current) return;
    const store = useGameStore.getState();
    const mode = store.cameraMode;
    const clamped = Math.min(dt, 0.05);
    const k = keys.current;
    const yaw = euler.current.y;

    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    let mx = 0;
    let mz = 0;
    if (k.has('KeyW')) {
      mx += forwardX;
      mz += forwardZ;
    }
    if (k.has('KeyS')) {
      mx -= forwardX;
      mz -= forwardZ;
    }
    if (k.has('KeyD')) {
      mx += rightX;
      mz += rightZ;
    }
    if (k.has('KeyA')) {
      mx -= rightX;
      mz -= rightZ;
    }

    const len = Math.hypot(mx, mz);
    const speed = MOVE_SPEED * (k.has('ShiftLeft') || k.has('ShiftRight') ? SPRINT_MULT : 1);
    movingRef.current = len > 0;
    if (len > 0) {
      mx = (mx / len) * speed;
      mz = (mz / len) * speed;
    }

    vel.current.x = mx;
    vel.current.z = mz;
    vel.current.y -= GRAVITY * clamped;

    if (grounded.current && k.has('Space')) {
      vel.current.y = JUMP_SPEED;
      grounded.current = false;
    }

    grounded.current = moveWithCollision(pos.current, vel.current, clamped);
    yawRef.current = yaw;
    store.setPlayerPos(pos.current.x, pos.current.y, pos.current.z);

    if (mode === 'fpp') {
      camera.position.set(pos.current.x, pos.current.y + PLAYER_EYE, pos.current.z);
      camera.quaternion.setFromEuler(euler.current);
    } else {
      lookTarget.current.set(
        pos.current.x,
        pos.current.y + TPP_LOOK_HEIGHT,
        pos.current.z,
      );
      const pitch = euler.current.x;
      // Orbit behind the look direction
      desiredCam.current.set(
        pos.current.x + Math.sin(yaw) * Math.cos(pitch) * TPP_DISTANCE,
        pos.current.y + TPP_LOOK_HEIGHT + 0.35 - Math.sin(pitch) * TPP_DISTANCE,
        pos.current.z + Math.cos(yaw) * Math.cos(pitch) * TPP_DISTANCE,
      );

      const dist = cameraBlockedDistance(
        lookTarget.current,
        desiredCam.current,
        TPP_DISTANCE,
      );
      camDir.current.copy(desiredCam.current).sub(lookTarget.current).normalize();
      camera.position.copy(lookTarget.current).addScaledVector(camDir.current, dist);
      camera.up.set(0, 1, 0);
      camera.lookAt(lookTarget.current);
    }

    camera.getWorldDirection(aimDir.current);
    const hit = castVoxelRay(
      world,
      camera.position.x,
      camera.position.y,
      camera.position.z,
      aimDir.current.x,
      aimDir.current.y,
      aimDir.current.z,
      mode === 'tpp' ? 12 : 8,
    );
    store.setTarget(hit);

    if (pos.current.y < -10) {
      pos.current.x = 0.5;
      pos.current.z = 0.5;
      pos.current.y = world.findSpawnY(0, 0);
      vel.current = { x: 0, y: 0, z: 0 };
    }
  });

  return (
    <>
      <PlayerCharacter
        position={pos}
        yaw={yawRef}
        moving={movingRef}
        visible={cameraMode === 'tpp'}
      />
      {locked ? <TargetHighlight /> : null}
    </>
  );
}
