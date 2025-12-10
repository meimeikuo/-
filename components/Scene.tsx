import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppMode, HandGestureData } from '../types';
import { ParticleSystem } from './ParticleSystem';
import { Photos } from './Photos';
import { Gifts } from './Gifts';

interface SceneProps {
  mode: AppMode;
  handData: HandGestureData;
  isIntro: boolean;
}

export const Scene: React.FC<SceneProps> = ({ mode, handData, isIntro }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- SCALE LOGIC ---
    // User requested Tree mode to be reduced to 80% (0.8)
    // Photo/Scattered mode can be normal (1.0) or slightly larger for immersion
    const targetScale = (mode === AppMode.TREE) ? 0.8 : 1.1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);

    // --- POSITION LOGIC ---
    // If TREE mode: Slightly lower (-1) to balance with text, but mostly centered.
    // If PHOTO/SCATTERED: Centered (0) for best viewing.
    const targetY = (mode === AppMode.TREE) ? -1.0 : 0;
    
    // Smoothly interpolate position
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 2);


    // --- ROTATION LOGIC ---
    if (isIntro) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta);
    } else if (mode === AppMode.TREE) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
    } else if (mode === AppMode.PHOTO_VIEW) {
      // Stop rotation for viewing
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
    } else {
      // Interactive rotation in scattered mode
      const targetRotX = handData.palmPosition.y * 0.8;
      const targetRotY = handData.palmPosition.x * 0.8;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2);
    }
  });

  return (
    <>
      <color attach="background" args={['#020502']} />
      
      {/* Environment is crucial for Metallic materials to reflect something! */}
      {/* "city" preset provides high contrast reflections good for metal */}
      <Environment preset="city" />

      {/* Lighting - Cool colors for Metallic look */}
      <ambientLight intensity={isIntro ? 0.2 : 0.5} color="#E0F7FA" />
      
      {/* Silver/White Point Light */}
      <pointLight position={[0, 0, 0]} intensity={isIntro ? 2 : 1.5} color="#F0F8FF" distance={10} />
      
      {!isIntro && (
        <>
          {/* Cool Blue Spotlights */}
          <spotLight position={[10, 20, 10]} angle={0.5} intensity={3} color="#E6E6FA" penumbra={1} />
          <spotLight position={[-10, 20, -10]} angle={0.5} intensity={3} color="#E0FFFF" penumbra={1} />
        </>
      )}

      {/* Main Group */}
      <group ref={groupRef} position={[0, -1, 0]}>
        <ParticleSystem mode={mode} isIntro={isIntro} />
        
        <Gifts mode={mode} isIntro={isIntro} />

        {!isIntro && (
          <Suspense fallback={null}>
            <Photos mode={mode} />
          </Suspense>
        )}
      </group>

      {/* Environment Stars */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      
      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.1} 
          mipmapBlur 
          intensity={1.0} 
          radius={0.4} 
        />
      </EffectComposer>
    </>
  );
};