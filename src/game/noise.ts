import { createNoise2D, createNoise3D } from 'simplex-noise';

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NoiseSet {
  height: (x: number, z: number) => number;
  cave: (x: number, y: number, z: number) => number;
  coal: (x: number, y: number, z: number) => number;
  iron: (x: number, y: number, z: number) => number;
  tree: (x: number, z: number) => number;
}

export function createNoiseSet(seed = 1337): NoiseSet {
  const heightNoise = createNoise2D(mulberry32(seed));
  const detailNoise = createNoise2D(mulberry32(seed + 1));
  const caveNoise = createNoise3D(mulberry32(seed + 2));
  const coalNoise = createNoise3D(mulberry32(seed + 3));
  const ironNoise = createNoise3D(mulberry32(seed + 4));
  const treeNoise = createNoise2D(mulberry32(seed + 5));

  return {
    height: (x, z) => {
      const base = heightNoise(x * 0.01, z * 0.01);
      const detail = detailNoise(x * 0.04, z * 0.04) * 0.25;
      return base + detail;
    },
    cave: (x, y, z) => caveNoise(x * 0.06, y * 0.06, z * 0.06),
    coal: (x, y, z) => coalNoise(x * 0.12, y * 0.12, z * 0.12),
    iron: (x, y, z) => ironNoise(x * 0.14, y * 0.14, z * 0.14),
    tree: (x, z) => treeNoise(x * 0.2, z * 0.2),
  };
}

export function surfaceHeight(noise: NoiseSet, x: number, z: number): number {
  const n = noise.height(x, z);
  // Map [-1,1] → roughly [18, 42]
  return Math.floor(28 + n * 12);
}
