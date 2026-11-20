export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  COAL_ORE: 7,
  IRON_ORE: 8,
  BEDROCK: 9,
} as const;

export type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

export interface BlockDef {
  id: BlockId;
  name: string;
  solid: boolean;
  color: string;
  /** Optional top-face color (e.g. grass) */
  topColor?: string;
}

export const BLOCK_DEFS: Record<number, BlockDef> = {
  [BLOCK.AIR]: { id: BLOCK.AIR, name: 'Air', solid: false, color: '#000000' },
  [BLOCK.GRASS]: {
    id: BLOCK.GRASS,
    name: 'Grass',
    solid: true,
    color: '#5d8c3e',
    topColor: '#6db33f',
  },
  [BLOCK.DIRT]: { id: BLOCK.DIRT, name: 'Dirt', solid: true, color: '#8b5a2b' },
  [BLOCK.STONE]: { id: BLOCK.STONE, name: 'Stone', solid: true, color: '#7a7a7a' },
  [BLOCK.WOOD]: { id: BLOCK.WOOD, name: 'Wood', solid: true, color: '#6b4423' },
  [BLOCK.LEAVES]: { id: BLOCK.LEAVES, name: 'Leaves', solid: true, color: '#3d8b40' },
  [BLOCK.SAND]: { id: BLOCK.SAND, name: 'Sand', solid: true, color: '#e1c16e' },
  [BLOCK.COAL_ORE]: {
    id: BLOCK.COAL_ORE,
    name: 'Coal Ore',
    solid: true,
    color: '#4a4a4a',
  },
  [BLOCK.IRON_ORE]: {
    id: BLOCK.IRON_ORE,
    name: 'Iron Ore',
    solid: true,
    color: '#b08d6a',
  },
  [BLOCK.BEDROCK]: {
    id: BLOCK.BEDROCK,
    name: 'Bedrock',
    solid: true,
    color: '#2a2a2a',
  },
};

export const HOTBAR_BLOCKS: BlockId[] = [
  BLOCK.DIRT,
  BLOCK.GRASS,
  BLOCK.STONE,
  BLOCK.WOOD,
  BLOCK.LEAVES,
  BLOCK.SAND,
  BLOCK.COAL_ORE,
  BLOCK.IRON_ORE,
];

export function isSolid(id: number): boolean {
  return BLOCK_DEFS[id]?.solid ?? false;
}

export function blockColor(id: number, face: 'top' | 'side' | 'bottom' = 'side'): string {
  const def = BLOCK_DEFS[id];
  if (!def) return '#ff00ff';
  if (face === 'top' && def.topColor) return def.topColor;
  return def.color;
}

/** Parse #rrggbb into [r,g,b] 0–1 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
