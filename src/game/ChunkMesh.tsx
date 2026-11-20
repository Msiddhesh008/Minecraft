import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  meshChunkOpaque,
  meshChunkTransparent,
  meshDataToGeometry,
} from './mesher';
import { chunkKey, world, type Chunk } from './world';

interface ChunkMeshProps {
  chunk: Chunk;
}

const opaqueMaterial = new THREE.MeshLambertMaterial({
  vertexColors: true,
  side: THREE.FrontSide,
});

const transparentMaterial = new THREE.MeshLambertMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export function ChunkMesh({ chunk }: ChunkMeshProps) {
  const opaqueGeo = useMemo(() => {
    return meshDataToGeometry(meshChunkOpaque(world, chunk));
  }, [chunk, chunk.version]);

  const transparentGeo = useMemo(() => {
    return meshDataToGeometry(meshChunkTransparent(world, chunk));
  }, [chunk, chunk.version]);

  useEffect(() => {
    chunk.dirty = false;
    return () => {
      opaqueGeo.dispose();
      transparentGeo.dispose();
    };
  }, [opaqueGeo, transparentGeo, chunk]);

  const hasTransparent = (transparentGeo.getIndex()?.count ?? 0) > 0;

  return (
    <group name={chunkKey(chunk.cx, chunk.cz)}>
      <mesh
        geometry={opaqueGeo}
        material={opaqueMaterial}
        frustumCulled
      />
      {hasTransparent ? (
        <mesh
          geometry={transparentGeo}
          material={transparentMaterial}
          frustumCulled
          renderOrder={1}
        />
      ) : null}
    </group>
  );
}
