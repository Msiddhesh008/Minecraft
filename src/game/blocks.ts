export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4, // oak log (legacy id for world gen)
  LEAVES: 5,
  SAND: 6,
  COAL_ORE: 7,
  IRON_ORE: 8,
  BEDROCK: 9,
  // Nature
  GRAVEL: 10,
  CLAY: 11,
  SNOW: 12,
  ICE: 13,
  BIRCH_LOG: 14,
  DARK_LEAVES: 15,
  CACTUS: 16,
  FLOWER_RED: 17,
  FLOWER_YELLOW: 18,
  FLOWER_WHITE: 19,
  TALL_GRASS: 20,
  MUSHROOM: 21,
  // Building
  OAK_PLANKS: 22,
  BIRCH_PLANKS: 23,
  COBBLE: 24,
  STONE_BRICK: 25,
  BRICKS: 26,
  CONCRETE_WHITE: 27,
  CONCRETE_GRAY: 28,
  CONCRETE_BLACK: 29,
  TERRACOTTA: 30,
  WOOL_RED: 31,
  WOOL_BLUE: 32,
  WOOL_GREEN: 33,
  WOOL_YELLOW: 34,
  WOOL_PINK: 35,
  WOOL_PURPLE: 36,
  GLASS: 37,
  GLASS_BLUE: 38,
  GLASS_GREEN: 39,
  // Water / light
  WATER: 40,
  GLOWSTONE: 41,
  LAMP: 42,
  TORCH_BLOCK: 43,
} as const;

export type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

export type BlockCategory = 'nature' | 'building' | 'color' | 'water' | 'light';

export interface BlockDef {
  id: BlockId;
  name: string;
  solid: boolean;
  transparent: boolean;
  emissive: boolean;
  replaceable: boolean;
  color: string;
  topColor?: string;
  opacity?: number;
  category: BlockCategory;
}

function def(
  id: BlockId,
  name: string,
  color: string,
  opts: Partial<Omit<BlockDef, 'id' | 'name' | 'color'>> & { category: BlockCategory },
): BlockDef {
  return {
    id,
    name,
    color,
    solid: opts.solid ?? true,
    transparent: opts.transparent ?? false,
    emissive: opts.emissive ?? false,
    replaceable: opts.replaceable ?? false,
    topColor: opts.topColor,
    opacity: opts.opacity,
    category: opts.category,
  };
}

export const BLOCK_DEFS: Record<number, BlockDef> = {
  [BLOCK.AIR]: def(BLOCK.AIR, 'Air', '#000000', {
    category: 'nature',
    solid: false,
  }),
  [BLOCK.GRASS]: def(BLOCK.GRASS, 'Grass', '#5d8c3e', {
    category: 'nature',
    topColor: '#6db33f',
  }),
  [BLOCK.DIRT]: def(BLOCK.DIRT, 'Dirt', '#8b5a2b', { category: 'nature' }),
  [BLOCK.STONE]: def(BLOCK.STONE, 'Stone', '#7a7a7a', { category: 'nature' }),
  [BLOCK.WOOD]: def(BLOCK.WOOD, 'Oak Log', '#6b4423', {
    category: 'nature',
    topColor: '#9a7b4f',
  }),
  [BLOCK.LEAVES]: def(BLOCK.LEAVES, 'Oak Leaves', '#3d8b40', { category: 'nature' }),
  [BLOCK.SAND]: def(BLOCK.SAND, 'Sand', '#e1c16e', { category: 'nature' }),
  [BLOCK.COAL_ORE]: def(BLOCK.COAL_ORE, 'Coal Ore', '#4a4a4a', { category: 'nature' }),
  [BLOCK.IRON_ORE]: def(BLOCK.IRON_ORE, 'Iron Ore', '#b08d6a', { category: 'nature' }),
  [BLOCK.BEDROCK]: def(BLOCK.BEDROCK, 'Bedrock', '#2a2a2a', { category: 'nature' }),
  [BLOCK.GRAVEL]: def(BLOCK.GRAVEL, 'Gravel', '#8a8580', { category: 'nature' }),
  [BLOCK.CLAY]: def(BLOCK.CLAY, 'Clay', '#9aa3b5', { category: 'nature' }),
  [BLOCK.SNOW]: def(BLOCK.SNOW, 'Snow', '#f2f6fa', { category: 'nature' }),
  [BLOCK.ICE]: def(BLOCK.ICE, 'Ice', '#a8d8f0', {
    category: 'nature',
    transparent: true,
    opacity: 0.55,
  }),
  [BLOCK.BIRCH_LOG]: def(BLOCK.BIRCH_LOG, 'Birch Log', '#d7d2c4', {
    category: 'nature',
    topColor: '#cbbf9a',
  }),
  [BLOCK.DARK_LEAVES]: def(BLOCK.DARK_LEAVES, 'Dark Leaves', '#1f5c2e', {
    category: 'nature',
  }),
  [BLOCK.CACTUS]: def(BLOCK.CACTUS, 'Cactus', '#3f9e4d', { category: 'nature' }),
  [BLOCK.FLOWER_RED]: def(BLOCK.FLOWER_RED, 'Red Flower', '#e04040', {
    category: 'nature',
    solid: false,
    replaceable: true,
  }),
  [BLOCK.FLOWER_YELLOW]: def(BLOCK.FLOWER_YELLOW, 'Yellow Flower', '#f0d030', {
    category: 'nature',
    solid: false,
    replaceable: true,
  }),
  [BLOCK.FLOWER_WHITE]: def(BLOCK.FLOWER_WHITE, 'White Flower', '#f5f5f0', {
    category: 'nature',
    solid: false,
    replaceable: true,
  }),
  [BLOCK.TALL_GRASS]: def(BLOCK.TALL_GRASS, 'Tall Grass', '#5faa45', {
    category: 'nature',
    solid: false,
    replaceable: true,
  }),
  [BLOCK.MUSHROOM]: def(BLOCK.MUSHROOM, 'Mushroom', '#c44c4c', {
    category: 'nature',
    solid: false,
    replaceable: true,
  }),
  [BLOCK.OAK_PLANKS]: def(BLOCK.OAK_PLANKS, 'Oak Planks', '#b8945f', {
    category: 'building',
  }),
  [BLOCK.BIRCH_PLANKS]: def(BLOCK.BIRCH_PLANKS, 'Birch Planks', '#d8c9a0', {
    category: 'building',
  }),
  [BLOCK.COBBLE]: def(BLOCK.COBBLE, 'Cobblestone', '#6e6e6e', { category: 'building' }),
  [BLOCK.STONE_BRICK]: def(BLOCK.STONE_BRICK, 'Stone Brick', '#7d7d7d', {
    category: 'building',
  }),
  [BLOCK.BRICKS]: def(BLOCK.BRICKS, 'Bricks', '#a0522d', { category: 'building' }),
  [BLOCK.CONCRETE_WHITE]: def(BLOCK.CONCRETE_WHITE, 'White Concrete', '#e8e8e8', {
    category: 'building',
  }),
  [BLOCK.CONCRETE_GRAY]: def(BLOCK.CONCRETE_GRAY, 'Gray Concrete', '#8b8b8b', {
    category: 'building',
  }),
  [BLOCK.CONCRETE_BLACK]: def(BLOCK.CONCRETE_BLACK, 'Black Concrete', '#2b2b2b', {
    category: 'building',
  }),
  [BLOCK.TERRACOTTA]: def(BLOCK.TERRACOTTA, 'Terracotta', '#c0724a', {
    category: 'building',
  }),
  [BLOCK.WOOL_RED]: def(BLOCK.WOOL_RED, 'Red Wool', '#c0392b', { category: 'color' }),
  [BLOCK.WOOL_BLUE]: def(BLOCK.WOOL_BLUE, 'Blue Wool', '#2980b9', { category: 'color' }),
  [BLOCK.WOOL_GREEN]: def(BLOCK.WOOL_GREEN, 'Green Wool', '#27ae60', {
    category: 'color',
  }),
  [BLOCK.WOOL_YELLOW]: def(BLOCK.WOOL_YELLOW, 'Yellow Wool', '#f1c40f', {
    category: 'color',
  }),
  [BLOCK.WOOL_PINK]: def(BLOCK.WOOL_PINK, 'Pink Wool', '#e091b8', { category: 'color' }),
  [BLOCK.WOOL_PURPLE]: def(BLOCK.WOOL_PURPLE, 'Purple Wool', '#8e44ad', {
    category: 'color',
  }),
  [BLOCK.GLASS]: def(BLOCK.GLASS, 'Glass', '#cfe8f5', {
    category: 'building',
    transparent: true,
    opacity: 0.28,
  }),
  [BLOCK.GLASS_BLUE]: def(BLOCK.GLASS_BLUE, 'Blue Glass', '#4aa3d8', {
    category: 'building',
    transparent: true,
    opacity: 0.35,
  }),
  [BLOCK.GLASS_GREEN]: def(BLOCK.GLASS_GREEN, 'Green Glass', '#4caf70', {
    category: 'building',
    transparent: true,
    opacity: 0.35,
  }),
  [BLOCK.WATER]: def(BLOCK.WATER, 'Water', '#2f6fbf', {
    category: 'water',
    solid: false,
    transparent: true,
    opacity: 0.45,
    replaceable: true,
  }),
  [BLOCK.GLOWSTONE]: def(BLOCK.GLOWSTONE, 'Glowstone', '#f0d878', {
    category: 'light',
    emissive: true,
  }),
  [BLOCK.LAMP]: def(BLOCK.LAMP, 'Lamp', '#fff1b0', {
    category: 'light',
    emissive: true,
  }),
  [BLOCK.TORCH_BLOCK]: def(BLOCK.TORCH_BLOCK, 'Torch Block', '#ffb347', {
    category: 'light',
    emissive: true,
  }),
};

/** Default creative hotbar (9 slots) */
export const HOTBAR_BLOCKS: BlockId[] = [
  BLOCK.GRASS,
  BLOCK.OAK_PLANKS,
  BLOCK.STONE_BRICK,
  BLOCK.BRICKS,
  BLOCK.GLASS,
  BLOCK.WATER,
  BLOCK.WOOL_RED,
  BLOCK.FLOWER_YELLOW,
  BLOCK.GLOWSTONE,
];

export const PALETTE_CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: 'nature', label: 'Nature' },
  { id: 'building', label: 'Building' },
  { id: 'color', label: 'Colors' },
  { id: 'water', label: 'Water' },
  { id: 'light', label: 'Lights' },
];

export function getPaletteBlocks(): BlockDef[] {
  return Object.values(BLOCK_DEFS).filter(
    (b) => b.id !== BLOCK.AIR && b.id !== BLOCK.BEDROCK,
  );
}

export function isSolid(id: number): boolean {
  return BLOCK_DEFS[id]?.solid ?? false;
}

export function isTransparent(id: number): boolean {
  return BLOCK_DEFS[id]?.transparent ?? false;
}

export function isOpaque(id: number): boolean {
  if (id === BLOCK.AIR) return false;
  return !isTransparent(id);
}

export function isRenderable(id: number): boolean {
  return id !== BLOCK.AIR && !!BLOCK_DEFS[id];
}

export function isReplaceable(id: number): boolean {
  return id === BLOCK.AIR || (BLOCK_DEFS[id]?.replaceable ?? false);
}

export function isEmissive(id: number): boolean {
  return BLOCK_DEFS[id]?.emissive ?? false;
}

export function blockOpacity(id: number): number {
  return BLOCK_DEFS[id]?.opacity ?? 1;
}

export function blockColor(id: number, face: 'top' | 'side' | 'bottom' = 'side'): string {
  const blockDef = BLOCK_DEFS[id];
  if (!blockDef) return '#ff00ff';
  if (face === 'top' && blockDef.topColor) return blockDef.topColor;
  return blockDef.color;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
