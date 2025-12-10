import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppMode } from '../types';

interface GiftsProps {
  mode: AppMode;
  isIntro: boolean;
}

// Winter Palette for Gifts
const GIFT_COLORS = ['#191970', '#4169E1', '#C0C0C0', '#FFFFFF', '#87CEFA'];

export const Gifts: React.FC<GiftsProps> = ({ mode, isIntro }) => {
  // Create random gift data
  const gifts = useMemo(() => {
    const items = [];
    const count = 12; // Number of gifts around the tree
    const radiusBase = 5.5; // Radius at the bottom of the tree

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5);
      const r = radiusBase + Math.random() * 3;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      // Random size
      const scale = 0.8 + Math.random() * 0.8;
      
      // Random rotation on floor
      const rotY = Math.random() * Math.PI;

      // Color
      const color = GIFT_COLORS[Math.floor(Math.random() * GIFT_COLORS.length)];
      const ribbonColor = color === '#C0C0C0' ? '#191970' : '#C0C0C0';

      items.push({
        id: i,
        pos: new THREE.Vector3(x, -7.5, z), 
        scale,
        rotY,
        color,
        ribbonColor
      });
    }
    return items;
  }, []);

  return (
    <group>
      {gifts.map((gift) => (
        <SingleGift key={gift.id} data={gift} mode={mode} isIntro={isIntro} />
      ))}
    </group>
  );
};

const SingleGift: React.FC<{ data: any; mode: AppMode; isIntro: boolean }> = ({ data, mode, isIntro }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Logic for visibility
    let desiredScale = 0;

    if (isIntro) {
      desiredScale = 0; // Hide in intro
    } else if (mode === AppMode.TREE) {
      desiredScale = data.scale; // Show in Tree mode
    } else {
      desiredScale = 0; 
    }

    // Animate scale smoothly
    targetScale.current = THREE.MathUtils.lerp(targetScale.current, desiredScale, delta * 3);
    groupRef.current.scale.setScalar(targetScale.current);

    // Subtle bobbing if visible
    if (desiredScale > 0.1) {
      groupRef.current.rotation.y = data.rotY + Math.sin(state.clock.elapsedTime * 0.5 + data.id) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={data.pos}>
      {/* Box */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={data.color} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Ribbon Vertical */}
      <mesh position={[0, 0.5, 0]} scale={[1.05, 1, 0.2]}>
        <boxGeometry args={[1, 1.02, 1]} />
        <meshStandardMaterial color={data.ribbonColor} roughness={0.1} metalness={0.8} emissive={data.ribbonColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Ribbon Horizontal */}
      <mesh position={[0, 0.5, 0]} scale={[0.2, 1, 1.05]}>
        <boxGeometry args={[1, 1.02, 1]} />
        <meshStandardMaterial color={data.ribbonColor} roughness={0.1} metalness={0.8} emissive={data.ribbonColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};