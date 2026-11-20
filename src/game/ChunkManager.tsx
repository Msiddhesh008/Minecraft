import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ChunkMesh } from './ChunkMesh';
import { CHUNK_SIZE_X, CHUNK_SIZE_Z, chunkKey, world } from './world';

const LOAD_RADIUS = 3;

export function ChunkManager() {
  const pcx = useGameStore((s) => Math.floor(s.playerPos.x / CHUNK_SIZE_X));
  const pcz = useGameStore((s) => Math.floor(s.playerPos.z / CHUNK_SIZE_Z));
  const [worldRev, setWorldRev] = useState(0);

  useEffect(() => {
    return world.onChange(() => {
      setWorldRev((r) => r + 1);
    });
  }, []);

  const chunks = useMemo(() => {
    void worldRev;
    const needed = new Set<string>();
    const list = [];

    for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz++) {
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        if (dx * dx + dz * dz > LOAD_RADIUS * LOAD_RADIUS + 1) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        needed.add(chunkKey(cx, cz));
        list.push(world.getOrCreateChunk(cx, cz));
      }
    }

    for (const key of [...world.chunks.keys()]) {
      if (!needed.has(key)) {
        const [cx, cz] = key.split(',').map(Number);
        world.unloadChunk(cx, cz);
      }
    }

    return list;
  }, [pcx, pcz, worldRev]);

  return (
    <>
      {chunks.map((chunk) => (
        <ChunkMesh
          key={`${chunkKey(chunk.cx, chunk.cz)}:${chunk.version}`}
          chunk={chunk}
        />
      ))}
    </>
  );
}
