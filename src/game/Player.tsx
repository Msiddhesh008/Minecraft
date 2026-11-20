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
const FLY_SPEED = 8;
const SPRINT_MULT = 1.55;
const JUMP_SPEED = 7.2;
const GRAVITY = 22;
const MOUSE_SENS = 0.0022;
const TPP_DISTANCE = 5.5;
const TPP_LOOK_HEIGHT = 1.5;
const DOUBLE_TAP_MS = 280;

function cameraBlockedDistance(
  from: THREE.Vector3,
  to: THREE.Vector3,
  maxDist: number,
): number {
  const dir = to.clone().sub(from);
  const full = dir.length();
  if (full < 0.001) return maxDist;
  dir.multiplyScalar(1 / full);

  const ox = from.x + dir.x * 0.4;
  const oy = from.y + dir.y * 0.4;
  const oz = from.z + dir.z * 0.4;
  const hit = castVoxelRay(world, ox, oy, oz, dir.x, dir.y, dir.z, full);
  if (!hit) return maxDist;
  return Math.max(1.2, Math.min(maxDist, hit.distance + 0.1));
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
  const lastSpaceTap = useRef(0);
  const lookTarget = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const camDir = useRef(new THREE.Vector3());
  const aimDir = useRef(new THREE.Vector3());

  const locked = useGameStore((s) => s.locked);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const paletteOpen = useGameStore((s) => s.paletteOpen);

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
      if (store().paletteOpen) return;
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
      if (store().paletteOpen) return;
      euler.current.y -= e.movementX * MOUSE_SENS;
      euler.current.x -= e.movementY * MOUSE_SENS;
      const mode = store().cameraMode;
      const maxPitch = mode === 'tpp' ? Math.PI / 2.4 : Math.PI / 2 - 0.01;
      euler.current.x = Math.max(-maxPitch, Math.min(maxPitch, euler.current.x));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (store().paletteOpen) return;
      if (document.pointerLockElement !== el) return;
      if (e.button === 0) store().breakBlock();
      if (e.button === 2) store().placeBlock();
      if (e.button === 1) {
        e.preventDefault();
        store().pickBlock();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (store().paletteOpen) return;
      e.preventDefault();
      store().cycleHotbar(e.deltaY > 0 ? 1 : -1);
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.repeat) return;
      const s = store();

      if (e.code === 'KeyE') {
        e.preventDefault();
        s.togglePalette();
        return;
      }

      if (s.paletteOpen) {
        if (e.code === 'Escape') s.setPaletteOpen(false);
        return;
      }

      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.replace('Digit', ''));
        if (n >= 1 && n <= 9) s.setSelectedSlot(n - 1);
      }

      if (e.code === 'KeyV') {
        e.preventDefault();
        s.toggleCameraMode();
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        s.pickBlock();
      }

      if (e.code === 'Space') {
        const now = performance.now();
        if (now - lastSpaceTap.current < DOUBLE_TAP_MS) {
          e.preventDefault();
          s.toggleFlying();
          vel.current.y = 0;
          lastSpaceTap.current = 0;
        } else {
          lastSpaceTap.current = now;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    el.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);

    return () => {
      el.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (!spawned.current) return;
    const store = useGameStore.getState();
    if (store.paletteOpen) return;

    const mode = store.cameraMode;
    const flying = store.flying;
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

    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const len = Math.hypot(mx, mz);
    const speed = (flying ? FLY_SPEED : MOVE_SPEED) * (sprint && !flying ? SPRINT_MULT : 1);
    movingRef.current = len > 0 || (flying && (k.has('Space') || sprint));
    if (len > 0) {
      mx = (mx / len) * speed;
      mz = (mz / len) * speed;
    }

    vel.current.x = mx;
    vel.current.z = mz;

    if (flying) {
      let my = 0;
      if (k.has('Space')) my += FLY_SPEED;
      if (sprint) my -= FLY_SPEED;
      vel.current.y = my;
    } else {
      vel.current.y -= GRAVITY * clamped;
      if (grounded.current && k.has('Space')) {
        vel.current.y = JUMP_SPEED;
        grounded.current = false;
      }
    }

    grounded.current = moveWithCollision(pos.current, vel.current, clamped);
    if (flying) grounded.current = false;

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
      store.setFlying(false);
    }
  });

  return (
    <>
      <PlayerCharacter
        position={pos}
        yaw={yawRef}
        moving={movingRef}
        visible={cameraMode === 'tpp' && !paletteOpen}
      />
      {locked && !paletteOpen ? <TargetHighlight /> : null}
    </>
  );
}
