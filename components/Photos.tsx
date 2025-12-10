import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AppMode } from '../types';

const IMAGE_URLS = [
  "https://i.ibb.co/27KpSbD5/LINE-ALBUM-2025-251210-8.jpg",
  "https://i.ibb.co/d0Lt0Nmt/LINE-ALBUM-2025-251210-1.jpg",
  "https://i.ibb.co/4nvv349R/LINE-ALBUM-2025-251210-2.jpg",
  "https://i.ibb.co/mFC2jwRj/LINE-ALBUM-2025-251210-3.jpg",
  "https://i.ibb.co/VWjDkwrX/LINE-ALBUM-2025-251210-4.jpg",
  "https://i.ibb.co/354QWp6g/LINE-ALBUM-2025-251210-5.jpg",
  "https://i.ibb.co/8gZwnFN6/LINE-ALBUM-2025-251210-6.jpg",
  "https://i.ibb.co/wtqfqq8/LINE-ALBUM-2025-251210-7.jpg",
  "https://i.ibb.co/YBbQRDdJ/LINE-ALBUM-2025-251210-9.jpg"
];

interface PhotosProps {
  mode: AppMode;
}

export const Photos: React.FC<PhotosProps> = ({ mode }) => {
  // Load textures using Suspense-enabled hook
  const textures = useTexture(IMAGE_URLS);
  
  // To avoid rapid switching, we pick one "active" photo when entering photo view
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (mode === AppMode.PHOTO_VIEW) {
      // Select a random photo or cycle when entering grab mode
      setActivePhotoIndex(prev => (prev + 1) % IMAGE_URLS.length);
    }
  }, [mode]);

  return (
    <>
      {textures.map((texture, i) => (
        <SinglePhoto 
          key={i} 
          texture={texture}
          index={i} 
          total={IMAGE_URLS.length} 
          mode={mode}
          isActive={i === activePhotoIndex}
        />
      ))}
    </>
  );
};

interface SinglePhotoProps {
  texture: THREE.Texture;
  index: number;
  total: number;
  mode: AppMode;
  isActive: boolean;
}

const SinglePhoto: React.FC<SinglePhotoProps> = ({ texture, index, total, mode, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3());
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  
  // Maintain aspect ratio: images seem to be portrait ~3:4
  const ASPECT_WIDTH = 3;
  const ASPECT_HEIGHT = 4;
  
  // Calculate positions for different modes
  const positions = useMemo(() => {
    // Tree Mode: Spiral around the tree
    const yPercent = index / total;
    const h = 14; // Tree height
    const y = (yPercent * h) - (h / 2);
    const r = 4.5 * (1 - yPercent) + 1.5; // Cone shape
    const angle = index * (Math.PI * 2 / 1.6); // Spiral
    
    // Position on tree surface
    const treePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
    
    // Scattered Mode: Random cloud
    const cloudR = 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const scatteredPos = new THREE.Vector3(
      cloudR * Math.sin(phi) * Math.cos(theta),
      cloudR * Math.sin(phi) * Math.sin(theta),
      cloudR * Math.cos(phi)
    );

    return { treePos, scatteredPos };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    if (mode === AppMode.PHOTO_VIEW) {
      if (isActive) {
        // Active photo moves to center front
        // Camera is at z=22. Photo at z=10 is closer, making it larger and centered.
        // Y is 0 because scene centers itself in PHOTO_VIEW
        targetPos.current.set(0, 0, 10); 
        // Large scale for viewing
        targetScale.current.set(ASPECT_WIDTH * 1.5, ASPECT_HEIGHT * 1.5, 1);
      } else {
        // Others fade back/scatter
        targetPos.current.copy(positions.scatteredPos).multiplyScalar(1.5); 
        targetScale.current.set(0, 0, 0); // Hide others
      }
    } else if (mode === AppMode.TREE) {
      targetPos.current.copy(positions.treePos);
      // Small scale for tree decoration, slight pulse
      targetScale.current.set(ASPECT_WIDTH * 0.45, ASPECT_HEIGHT * 0.45, 1);
    } else {
      // Scattered
      targetPos.current.copy(positions.scatteredPos);
      // Float animation
      targetPos.current.y += Math.sin(time + index) * 0.5;
      targetScale.current.set(ASPECT_WIDTH * 0.4, ASPECT_HEIGHT * 0.4, 1);
    }

    // Interpolate
    meshRef.current.position.lerp(targetPos.current, delta * 3);
    meshRef.current.scale.lerp(targetScale.current, delta * 3);

    // Rotation Logic
    if (mode === AppMode.PHOTO_VIEW && isActive) {
      // Face camera directly
      meshRef.current.lookAt(0, 0, 30); // Look at camera roughly
      meshRef.current.rotation.z = 0;
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
    } else if (mode === AppMode.TREE) {
      // Face outwards from center (0, y, 0)
      meshRef.current.lookAt(positions.treePos.x * 2, positions.treePos.y, positions.treePos.z * 2);
    } else {
      // Spin slowly in space
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        transparent 
        opacity={1}
        depthWrite={false}
        toneMapped={false} // Critical for visibility in dark scene with bloom
      />
    </mesh>
  );
};