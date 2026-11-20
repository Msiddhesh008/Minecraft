import * as THREE from 'three';
import { BLOCK, blockColor, hexToRgb, isSolid } from './blocks';
import {
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  type Chunk,
  type World,
} from './world';

const FACES: {
  dir: [number, number, number];
  corners: [number, number, number][];
  face: 'top' | 'side' | 'bottom';
}[] = [
  {
    dir: [0, 1, 0],
    face: 'top',
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    dir: [0, -1, 0],
    face: 'bottom',
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    dir: [0, 0, 1],
    face: 'side',
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  {
    dir: [0, 0, -1],
    face: 'side',
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
  {
    dir: [1, 0, 0],
    face: 'side',
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    dir: [-1, 0, 0],
    face: 'side',
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
];

function neighborSolid(
  world: World,
  chunk: Chunk,
  lx: number,
  ly: number,
  lz: number,
  dx: number,
  dy: number,
  dz: number,
): boolean {
  const nx = lx + dx;
  const ny = ly + dy;
  const nz = lz + dz;

  if (ny < 0 || ny >= CHUNK_SIZE_Y) return false;

  if (nx >= 0 && nx < CHUNK_SIZE_X && nz >= 0 && nz < CHUNK_SIZE_Z) {
    return isSolid(chunk.get(nx, ny, nz));
  }

  const wx = chunk.cx * CHUNK_SIZE_X + nx;
  const wz = chunk.cz * CHUNK_SIZE_Z + nz;
  return world.isSolidAt(wx, ny, wz);
}

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

export function meshChunk(world: World, chunk: Chunk): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE_X;
  const oz = chunk.cz * CHUNK_SIZE_Z;

  for (let ly = 0; ly < CHUNK_SIZE_Y; ly++) {
    for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
        const id = chunk.get(lx, ly, lz);
        if (id === BLOCK.AIR || !isSolid(id)) continue;

        for (const face of FACES) {
          const [dx, dy, dz] = face.dir;
          if (neighborSolid(world, chunk, lx, ly, lz, dx, dy, dz)) continue;

          const [r, g, b] = hexToRgb(blockColor(id, face.face));
          // Slight ambient shading by face
          const shade =
            face.face === 'top' ? 1 : face.face === 'bottom' ? 0.55 : 0.75 + Math.abs(dx) * 0.1;
          const cr = r * shade;
          const cg = g * shade;
          const cb = b * shade;

          const start = vertexCount;
          for (const [cx, cy, cz] of face.corners) {
            positions.push(ox + lx + cx, ly + cy, oz + lz + cz);
            normals.push(dx, dy, dz);
            colors.push(cr, cg, cb);
            vertexCount += 1;
          }
          indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
}

export function meshDataToGeometry(data: MeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}
