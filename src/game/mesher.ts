import * as THREE from 'three';
import {
  BLOCK,
  blockColor,
  blockOpacity,
  hexToRgb,
  isEmissive,
  isOpaque,
  isRenderable,
  isTransparent,
} from './blocks';
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

function neighborId(
  world: World,
  chunk: Chunk,
  lx: number,
  ly: number,
  lz: number,
  dx: number,
  dy: number,
  dz: number,
): number {
  const nx = lx + dx;
  const ny = ly + dy;
  const nz = lz + dz;

  if (ny < 0 || ny >= CHUNK_SIZE_Y) return BLOCK.AIR;

  if (nx >= 0 && nx < CHUNK_SIZE_X && nz >= 0 && nz < CHUNK_SIZE_Z) {
    return chunk.get(nx, ny, nz);
  }

  const wx = chunk.cx * CHUNK_SIZE_X + nx;
  const wz = chunk.cz * CHUNK_SIZE_Z + nz;
  return world.getBlock(wx, ny, wz);
}

function shouldDrawOpaqueFace(neighbor: number): boolean {
  // Draw face if neighbor does not fully occlude (air, transparent, plants already opaque though)
  return !isOpaque(neighbor);
}

function shouldDrawTransparentFace(id: number, neighbor: number): boolean {
  if (neighbor === id) return false; // same water/glass cull
  if (isOpaque(neighbor)) return false;
  return true;
}

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

function emptyMesh(): MeshData {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    colors: new Float32Array(0),
    indices: new Uint32Array(0),
  };
}

function buildMesh(
  world: World,
  chunk: Chunk,
  mode: 'opaque' | 'transparent',
): MeshData {
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
        if (!isRenderable(id)) continue;

        const transparent = isTransparent(id);
        if (mode === 'opaque' && transparent) continue;
        if (mode === 'transparent' && !transparent) continue;

        for (const face of FACES) {
          const [dx, dy, dz] = face.dir;
          const neighbor = neighborId(world, chunk, lx, ly, lz, dx, dy, dz);
          const draw =
            mode === 'opaque'
              ? shouldDrawOpaqueFace(neighbor)
              : shouldDrawTransparentFace(id, neighbor);
          if (!draw) continue;

          const [r, g, b] = hexToRgb(blockColor(id, face.face));
          let shade =
            face.face === 'top' ? 1 : face.face === 'bottom' ? 0.55 : 0.75 + Math.abs(dx) * 0.1;
          if (isEmissive(id)) shade = Math.max(shade, 1.15);

          const alpha = mode === 'transparent' ? blockOpacity(id) : 1;
          const cr = Math.min(1, r * shade);
          const cg = Math.min(1, g * shade);
          const cb = Math.min(1, b * shade);

          const start = vertexCount;
          for (const [cx, cy, cz] of face.corners) {
            positions.push(ox + lx + cx, ly + cy, oz + lz + cz);
            normals.push(dx, dy, dz);
            // Store alpha in unused channel packing: use RGB only; opacity via material
            colors.push(cr, cg, cb);
            void alpha;
            vertexCount += 1;
          }
          indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
        }
      }
    }
  }

  if (vertexCount === 0) return emptyMesh();

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
}

export function meshChunkOpaque(world: World, chunk: Chunk): MeshData {
  return buildMesh(world, chunk, 'opaque');
}

export function meshChunkTransparent(world: World, chunk: Chunk): MeshData {
  return buildMesh(world, chunk, 'transparent');
}

/** @deprecated use meshChunkOpaque */
export function meshChunk(world: World, chunk: Chunk): MeshData {
  return meshChunkOpaque(world, chunk);
}

export function meshDataToGeometry(data: MeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  if (data.positions.length === 0) {
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0]), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(0), 1));
    return geo;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}
