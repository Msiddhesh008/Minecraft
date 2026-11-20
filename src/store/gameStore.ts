import { create } from 'zustand';
import {
  BLOCK,
  HOTBAR_BLOCKS,
  isReplaceable,
  type BlockId,
} from '../game/blocks';
import { world } from '../game/world';
import type { RayHit } from '../game/Raycast';

export interface HotbarSlot {
  block: BlockId;
}

export type CameraMode = 'fpp' | 'tpp';

interface GameState {
  selectedSlot: number;
  hotbar: HotbarSlot[];
  locked: boolean;
  showHint: boolean;
  cameraMode: CameraMode;
  paletteOpen: boolean;
  flying: boolean;
  target: RayHit | null;
  playerPos: { x: number; y: number; z: number };
  setSelectedSlot: (slot: number) => void;
  cycleHotbar: (delta: number) => void;
  setHotbarBlock: (slot: number, block: BlockId) => void;
  setLocked: (locked: boolean) => void;
  dismissHint: () => void;
  toggleCameraMode: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  toggleFlying: () => void;
  setFlying: (flying: boolean) => void;
  setTarget: (hit: RayHit | null) => void;
  setPlayerPos: (x: number, y: number, z: number) => void;
  pickBlock: () => void;
  breakBlock: () => void;
  placeBlock: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedSlot: 0,
  hotbar: HOTBAR_BLOCKS.map((block) => ({ block })),
  locked: false,
  showHint: true,
  cameraMode: 'fpp',
  paletteOpen: false,
  flying: false,
  target: null,
  playerPos: { x: 0, y: 40, z: 0 },

  setSelectedSlot: (slot) => {
    if (slot < 0 || slot > 8) return;
    set({ selectedSlot: slot });
  },

  cycleHotbar: (delta) => {
    const { selectedSlot } = get();
    const next = ((selectedSlot + delta) % 9 + 9) % 9;
    set({ selectedSlot: next });
  },

  setHotbarBlock: (slot, block) => {
    if (slot < 0 || slot > 8) return;
    if (block === BLOCK.AIR || block === BLOCK.BEDROCK) return;
    const hotbar = get().hotbar.map((s, i) => (i === slot ? { block } : s));
    set({ hotbar, selectedSlot: slot });
  },

  setLocked: (locked) => set({ locked }),

  dismissHint: () => set({ showHint: false }),

  toggleCameraMode: () =>
    set((s) => ({ cameraMode: s.cameraMode === 'fpp' ? 'tpp' : 'fpp' })),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setPaletteOpen: (open) => set({ paletteOpen: open }),

  togglePalette: () => {
    const open = !get().paletteOpen;
    set({ paletteOpen: open, showHint: false });
    if (open && document.pointerLockElement) {
      document.exitPointerLock();
    }
  },

  toggleFlying: () => set((s) => ({ flying: !s.flying })),

  setFlying: (flying) => set({ flying }),

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

  pickBlock: () => {
    const { target, selectedSlot } = get();
    if (!target) return;
    const id = world.getBlock(target.x, target.y, target.z) as BlockId;
    if (id === BLOCK.AIR || id === BLOCK.BEDROCK) return;
    get().setHotbarBlock(selectedSlot, id);
  },

  breakBlock: () => {
    const { target, paletteOpen } = get();
    if (!target || paletteOpen) return;
    const id = world.getBlock(target.x, target.y, target.z);
    if (id === BLOCK.AIR || id === BLOCK.BEDROCK) return;
    world.setBlock(target.x, target.y, target.z, BLOCK.AIR);
  },

  placeBlock: () => {
    const { target, selectedSlot, hotbar, playerPos, paletteOpen } = get();
    if (!target || paletteOpen) return;
    const slot = hotbar[selectedSlot];
    if (!slot) return;

    const px = Math.floor(target.x + target.nx);
    const py = Math.floor(target.y + target.ny);
    const pz = Math.floor(target.z + target.nz);

    const existing = world.getBlock(px, py, pz);
    if (!isReplaceable(existing)) return;

    const feetY = playerPos.y;
    const headY = playerPos.y + 1.7;
    const overlapX = px === Math.floor(playerPos.x);
    const overlapZ = pz === Math.floor(playerPos.z);
    const overlapY = py >= Math.floor(feetY) && py <= Math.floor(headY);
    if (overlapX && overlapZ && overlapY) return;

    world.setBlock(px, py, pz, slot.block);
  },
}));
