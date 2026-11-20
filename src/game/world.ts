import { BLOCK, isSolid, type BlockId } from './blocks';
import { createNoiseSet, surfaceHeight, type NoiseSet } from './noise';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 64;
export const CHUNK_SIZE_Z = 16;
export const SEA_LEVEL = 22;

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function worldToChunk(wx: number, wz: number): [number, number] {
  return [Math.floor(wx / CHUNK_SIZE_X), Math.floor(wz / CHUNK_SIZE_Z)];
}

export function localIndex(lx: number, ly: number, lz: number): number {
  return ly * CHUNK_SIZE_X * CHUNK_SIZE_Z + lz * CHUNK_SIZE_X + lx;
}

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  readonly blocks: Uint8Array;
  dirty = true;
  version = 0;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
  }

  get(lx: number, ly: number, lz: number): number {
    if (
      lx < 0 ||
      lx >= CHUNK_SIZE_X ||
      ly < 0 ||
      ly >= CHUNK_SIZE_Y ||
      lz < 0 ||
      lz >= CHUNK_SIZE_Z
    ) {
      return BLOCK.AIR;
    }
    return this.blocks[localIndex(lx, ly, lz)];
  }

  set(lx: number, ly: number, lz: number, id: number): void {
    if (
      lx < 0 ||
      lx >= CHUNK_SIZE_X ||
      ly < 0 ||
      ly >= CHUNK_SIZE_Y ||
      lz < 0 ||
      lz >= CHUNK_SIZE_Z
    ) {
      return;
    }
    this.blocks[localIndex(lx, ly, lz)] = id;
    this.dirty = true;
    this.version += 1;
  }
}

function hash2(x: number, z: number): number {
  let h = (x * 374761393 + z * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function generateChunk(chunk: Chunk, noise: NoiseSet): void {
  const { cx, cz } = chunk;
  const ox = cx * CHUNK_SIZE_X;
  const oz = cz * CHUNK_SIZE_Z;

  for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
      const wx = ox + lx;
      const wz = oz + lz;
      const height = surfaceHeight(noise, wx, wz);
      const nearSea = height <= SEA_LEVEL + 2;

      for (let ly = 0; ly < CHUNK_SIZE_Y; ly++) {
        let id: number = BLOCK.AIR;

        if (ly === 0) {
          id = BLOCK.BEDROCK;
        } else if (ly > height) {
          id = BLOCK.AIR;
        } else if (ly === height) {
          id = nearSea ? BLOCK.SAND : BLOCK.GRASS;
        } else if (ly >= height - 3) {
          id = nearSea ? BLOCK.SAND : BLOCK.DIRT;
        } else {
          id = BLOCK.STONE;
          if (ly < height - 4 && ly > 2) {
            const coal = noise.coal(wx, ly, wz);
            const iron = noise.iron(wx, ly, wz);
            if (coal > 0.72 && ly < 40) id = BLOCK.COAL_ORE;
            else if (iron > 0.78 && ly < 28) id = BLOCK.IRON_ORE;
          }
        }

        // Caves carve stone/dirt (not bedrock / surface crust lightly)
        if (id !== BLOCK.AIR && id !== BLOCK.BEDROCK && ly > 1 && ly < height - 1) {
          const cave = noise.cave(wx, ly, wz);
          if (cave > 0.62) id = BLOCK.AIR;
        }

        chunk.blocks[localIndex(lx, ly, lz)] = id;
      }
    }
  }

  // Trees — place after terrain so leaves can overhang
  for (let lx = 2; lx < CHUNK_SIZE_X - 2; lx++) {
    for (let lz = 2; lz < CHUNK_SIZE_Z - 2; lz++) {
      const wx = ox + lx;
      const wz = oz + lz;
      const height = surfaceHeight(noise, wx, wz);
      if (height <= SEA_LEVEL + 2 || height + 6 >= CHUNK_SIZE_Y) continue;
      if (chunk.get(lx, height, lz) !== BLOCK.GRASS) continue;

      const t = noise.tree(wx, wz);
      const roll = hash2(wx, wz);
      if (t < 0.55 || roll > 0.04) continue;

      const trunkH = 4 + Math.floor(roll * 3);
      for (let i = 1; i <= trunkH; i++) {
        chunk.set(lx, height + i, lz, BLOCK.WOOD);
      }

      const top = height + trunkH;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          for (let dy = -1; dy <= 2; dy++) {
            if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy !== 0) continue;
            if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === 2) continue;
            const tx = lx + dx;
            const ty = top + dy;
            const tz = lz + dz;
            if (
              tx < 0 ||
              tx >= CHUNK_SIZE_X ||
              tz < 0 ||
              tz >= CHUNK_SIZE_Z ||
              ty < 0 ||
              ty >= CHUNK_SIZE_Y
            ) {
              continue;
            }
            if (chunk.get(tx, ty, tz) === BLOCK.AIR) {
              chunk.set(tx, ty, tz, BLOCK.LEAVES);
            }
          }
        }
      }
    }
  }

  chunk.dirty = true;
}

export type BlockChangeListener = (wx: number, wy: number, wz: number) => void;

export class World {
  readonly noise: NoiseSet;
  readonly chunks = new Map<string, Chunk>();
  private listeners = new Set<BlockChangeListener>();

  constructor(seed = 1337) {
    this.noise = createNoiseSet(seed);
  }

  onChange(fn: BlockChangeListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(wx: number, wy: number, wz: number): void {
    for (const fn of this.listeners) fn(wx, wy, wz);
  }

  getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      generateChunk(chunk, this.noise);
      this.chunks.set(key, chunk);
      // Remesh neighbors so shared faces cull correctly
      for (const [nx, nz] of [
        [cx - 1, cz],
        [cx + 1, cz],
        [cx, cz - 1],
        [cx, cz + 1],
      ] as const) {
        const n = this.chunks.get(chunkKey(nx, nz));
        if (n) {
          n.dirty = true;
          n.version += 1;
        }
      }
    }
    return chunk;
  }

  unloadChunk(cx: number, cz: number): void {
    this.chunks.delete(chunkKey(cx, cz));
  }

  getBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return BLOCK.AIR;
    const [cx, cz] = worldToChunk(wx, wz);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) return BLOCK.AIR;
    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return chunk.get(lx, wy, lz);
  }

  setBlock(wx: number, wy: number, wz: number, id: BlockId): boolean {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return false;
    const current = this.getBlock(wx, wy, wz);
    if (current === BLOCK.BEDROCK) return false;

    const [cx, cz] = worldToChunk(wx, wz);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    chunk.set(lx, wy, lz, id);

    const bump = (ncx: number, ncz: number) => {
      const n = this.chunks.get(chunkKey(ncx, ncz));
      if (n) {
        n.dirty = true;
        n.version += 1;
      }
    };
    if (lx === 0) bump(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) bump(cx + 1, cz);
    if (lz === 0) bump(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) bump(cx, cz + 1);

    this.notify(wx, wy, wz);
    return true;
  }

  isSolidAt(wx: number, wy: number, wz: number): boolean {
    return isSolid(this.getBlock(Math.floor(wx), Math.floor(wy), Math.floor(wz)));
  }

  findSpawnY(x = 0, z = 0): number {
    for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
      if (isSolid(this.getBlock(x, y, z))) return y + 2;
    }
    return 40;
  }
}

export const world = new World(42);
