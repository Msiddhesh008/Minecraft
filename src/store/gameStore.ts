import { create } from 'zustand';
import { BLOCK, HOTBAR_BLOCKS, type BlockId } from '../game/blocks';
import { world } from '../game/world';
import type { RayHit } from '../game/Raycast';

export interface HotbarSlot {
  block: BlockId;
  count: number;
}

export type CameraMode = 'fpp' | 'tpp';

interface GameState {
  selectedSlot: number;
  hotbar: HotbarSlot[];
  locked: boolean;
  showHint: boolean;
  cameraMode: CameraMode;
  target: RayHit | null;
  playerPos: { x: number; y: number; z: number };
  setSelectedSlot: (slot: number) => void;
  setLocked: (locked: boolean) => void;
  dismissHint: () => void;
  toggleCameraMode: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setTarget: (hit: RayHit | null) => void;
  setPlayerPos: (x: number, y: number, z: number) => void;
  breakBlock: () => void;
  placeBlock: () => void;
}

const starterCounts = [64, 64, 64, 32, 32, 32, 16, 16];

export const useGameStore = create<GameState>((set, get) => ({
  selectedSlot: 0,
  hotbar: HOTBAR_BLOCKS.map((block, i) => ({
    block,
    count: starterCounts[i] ?? 16,
  })),
  locked: false,
  showHint: true,
  cameraMode: 'fpp',
  target: null,
  playerPos: { x: 0, y: 40, z: 0 },

  setSelectedSlot: (slot) => {
    if (slot < 0 || slot > 8) return;
    set({ selectedSlot: slot });
  },

  setLocked: (locked) => set({ locked }),

  dismissHint: () => set({ showHint: false }),

  toggleCameraMode: () =>
    set((s) => ({ cameraMode: s.cameraMode === 'fpp' ? 'tpp' : 'fpp' })),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setTarget: (target) => set({ target }),

  setPlayerPos: (x, y, z) => {
    const prev = get().playerPos;
    if (
      Math.abs(prev.x - x) < 0.001 &&
      Math.abs(prev.y - y) < 0.001 &&
      Math.abs(prev.z - z) < 0.001
    ) {
      return;
    }
    set({ playerPos: { x, y, z } });
  },

  breakBlock: () => {
    const { target, hotbar } = get();
    if (!target) return;
    const id = world.getBlock(target.x, target.y, target.z);
    if (id === BLOCK.AIR || id === BLOCK.BEDROCK) return;

    world.setBlock(target.x, target.y, target.z, BLOCK.AIR);

    const slotIndex = hotbar.findIndex((s) => s.block === id);
    if (slotIndex >= 0) {
      const next = hotbar.map((s, i) =>
        i === slotIndex ? { ...s, count: Math.min(64, s.count + 1) } : s,
      );
      set({ hotbar: next });
    }
  },

  placeBlock: () => {
    const { target, selectedSlot, hotbar, playerPos } = get();
    if (!target) return;
    const slot = hotbar[selectedSlot];
    if (!slot || slot.count <= 0) return;

    const px = Math.floor(target.x + target.nx);
    const py = Math.floor(target.y + target.ny);
    const pz = Math.floor(target.z + target.nz);

    if (world.getBlock(px, py, pz) !== BLOCK.AIR) return;

    // Don't place inside player AABB (~0.6 x 1.8)
    const feetY = playerPos.y;
    const headY = playerPos.y + 1.7;
    const overlapX = px === Math.floor(playerPos.x);
    const overlapZ = pz === Math.floor(playerPos.z);
    const overlapY = py >= Math.floor(feetY) && py <= Math.floor(headY);
    if (overlapX && overlapZ && overlapY) return;

    if (!world.setBlock(px, py, pz, slot.block)) return;

    const next = hotbar.map((s, i) =>
      i === selectedSlot ? { ...s, count: s.count - 1 } : s,
    );
    set({ hotbar: next });
  },
}));
