import { BLOCK, isRenderable } from './blocks';
import { CHUNK_SIZE_Y, type World } from './world';

export interface RayHit {
  x: number;
  y: number;
  z: number;
  /** Outward normal of the hit face */
  nx: number;
  ny: number;
  nz: number;
  distance: number;
}

/**
 * Amanatides & Woo voxel DDA raycast.
 */
export function castVoxelRay(
  world: World,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist = 8,
): RayHit | null {
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;

  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);

  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;

  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);

  const frac = (v: number, step: number) => {
    const f = v - Math.floor(v);
    return step > 0 ? 1 - f : f === 0 ? 1 : f;
  };

  let tMaxX = dx === 0 ? Infinity : frac(ox, stepX) * tDeltaX;
  let tMaxY = dy === 0 ? Infinity : frac(oy, stepY) * tDeltaY;
  let tMaxZ = dz === 0 ? Infinity : frac(oz, stepZ) * tDeltaZ;

  let faceNx = 0;
  let faceNy = 0;
  let faceNz = 0;
  let t = 0;

  while (t <= maxDist) {
    if (y >= 0 && y < CHUNK_SIZE_Y) {
      const id = world.getBlock(x, y, z);
      // Hit any non-air block (water, glass, plants, solids)
      if (id !== BLOCK.AIR && isRenderable(id)) {
        return { x, y, z, nx: faceNx, ny: faceNy, nz: faceNz, distance: t };
      }
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        t = tMaxX;
        x += stepX;
        tMaxX += tDeltaX;
        faceNx = -stepX;
        faceNy = 0;
        faceNz = 0;
      } else {
        t = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        faceNx = 0;
        faceNy = 0;
        faceNz = -stepZ;
      }
    } else if (tMaxY < tMaxZ) {
      t = tMaxY;
      y += stepY;
      tMaxY += tDeltaY;
      faceNx = 0;
      faceNy = -stepY;
      faceNz = 0;
    } else {
      t = tMaxZ;
      z += stepZ;
      tMaxZ += tDeltaZ;
      faceNx = 0;
      faceNy = 0;
      faceNz = -stepZ;
    }
  }

  return null;
}
