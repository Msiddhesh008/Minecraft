import { world } from './world';

export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE = 1.62;

export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export function playerAABB(x: number, y: number, z: number): AABB {
  const hw = PLAYER_WIDTH / 2;
  return {
    minX: x - hw,
    minY: y,
    minZ: z - hw,
    maxX: x + hw,
    maxY: y + PLAYER_HEIGHT,
    maxZ: z + hw,
  };
}

function overlapsBlock(box: AABB, bx: number, by: number, bz: number): boolean {
  return (
    box.maxX > bx &&
    box.minX < bx + 1 &&
    box.maxY > by &&
    box.minY < by + 1 &&
    box.maxZ > bz &&
    box.minZ < bz + 1
  );
}

function collides(box: AABB): boolean {
  const x0 = Math.floor(box.minX);
  const y0 = Math.floor(box.minY);
  const z0 = Math.floor(box.minZ);
  const x1 = Math.floor(box.maxX);
  const y1 = Math.floor(box.maxY);
  const z1 = Math.floor(box.maxZ);

  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        if (world.isSolidAt(x, y, z) && overlapsBlock(box, x, y, z)) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Move position by delta with axis-separated AABB collision. Returns grounded. */
export function moveWithCollision(
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  dt: number,
): boolean {
  // X
  pos.x += vel.x * dt;
  let box = playerAABB(pos.x, pos.y, pos.z);
  if (collides(box)) {
    pos.x -= vel.x * dt;
    vel.x = 0;
  }

  // Z
  pos.z += vel.z * dt;
  box = playerAABB(pos.x, pos.y, pos.z);
  if (collides(box)) {
    pos.z -= vel.z * dt;
    vel.z = 0;
  }

  // Y
  pos.y += vel.y * dt;
  box = playerAABB(pos.x, pos.y, pos.z);
  let grounded = false;
  if (collides(box)) {
    pos.y -= vel.y * dt;
    if (vel.y < 0) grounded = true;
    vel.y = 0;
  }

  return grounded;
}
