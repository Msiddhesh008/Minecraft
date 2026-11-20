import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/** Full day cycle length in seconds */
const DAY_LENGTH = 180;

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return a.clone().lerp(b, t);
}

export function DayNight() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const timeRef = useRef(0.28); // start mid-morning

  useFrame((state, dt) => {
    timeRef.current = (timeRef.current + dt / DAY_LENGTH) % 1;
    const t = timeRef.current;

    // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);

    if (sunRef.current) {
      sunRef.current.position.set(sunX * 80, sunY * 80, 40);
      sunRef.current.intensity = Math.max(0.05, sunY * 1.15);
      sunRef.current.color.set(sunY > 0.1 ? '#fff4e0' : '#8899cc');
    }

    const daySky = new THREE.Color('#87b8e8');
    const duskSky = new THREE.Color('#e08858');
    const nightSky = new THREE.Color('#0b1020');

    let sky: THREE.Color;
    if (t > 0.22 && t < 0.28) {
      sky = lerpColor(nightSky, duskSky, (t - 0.22) / 0.06);
    } else if (t >= 0.28 && t < 0.35) {
      sky = lerpColor(duskSky, daySky, (t - 0.28) / 0.07);
    } else if (t >= 0.35 && t < 0.65) {
      sky = daySky;
    } else if (t >= 0.65 && t < 0.72) {
      sky = lerpColor(daySky, duskSky, (t - 0.65) / 0.07);
    } else if (t >= 0.72 && t < 0.8) {
      sky = lerpColor(duskSky, nightSky, (t - 0.72) / 0.08);
    } else {
      sky = nightSky;
    }

    state.scene.background = sky;
    if (!state.scene.fog || !(state.scene.fog instanceof THREE.Fog)) {
      state.scene.fog = new THREE.Fog(sky.getHex(), 40, 90);
    } else {
      state.scene.fog.color.copy(sky);
      state.scene.fog.near = 40;
      state.scene.fog.far = 90;
    }

    if (ambRef.current) {
      ambRef.current.intensity = 0.25 + Math.max(0, sunY) * 0.45;
      ambRef.current.color.copy(sky).lerp(new THREE.Color('#ffffff'), 0.4);
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.5} />
      <directionalLight
        ref={sunRef}
        intensity={1}
        castShadow={false}
        position={[50, 80, 30]}
      />
      <hemisphereLight args={['#b1e1ff', '#3d5c3a', 0.35]} />
    </>
  );
}
