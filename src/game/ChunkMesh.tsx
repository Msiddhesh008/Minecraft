import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { meshChunk, meshDataToGeometry } from './mesher';
import { chunkKey, world, type Chunk } from './world';

interface ChunkMeshProps {
  chunk: Chunk;
}

const sharedMaterial = new THREE.MeshLambertMaterial({
  vertexColors: true,
  side: THREE.FrontSide,
});

export function ChunkMesh({ chunk }: ChunkMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const versionRef = useRef(-1);

  const geometry = useMemo(() => {
    const data = meshChunk(world, chunk);
    return meshDataToGeometry(data);
  }, [chunk, chunk.version]);

  useEffect(() => {
    versionRef.current = chunk.version;
    chunk.dirty = false;
    return () => {
      geometry.dispose();
    };
  }, [geometry, chunk]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={sharedMaterial}
      frustumCulled
      name={chunkKey(chunk.cx, chunk.cz)}
    />
  );
}
