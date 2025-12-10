import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppMode, ParticleData, ParticleType } from '../types';

interface ParticleSystemProps {
  mode: AppMode;
  isIntro: boolean;
}

// Increased count for richer tree
const PARTICLE_COUNT = 3000;
const TREE_HEIGHT = 16;
const TREE_RADIUS_BASE = 6;

// Winter/Metallic Palette
const COLOR_DEEP_BLUE = '#00008B';  // Dark Blue
const COLOR_BLUE = '#1E90FF';       // Dodger Blue
const COLOR_SILVER = '#E8E8E8';     // Bright Silver
const COLOR_WHITE = '#FFFFFF';      // White
const COLOR_ICE = '#F0FFFF';        // Azure Mist

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ mode, isIntro }) => {
  // Generate Particles Data
  const particles = useMemo(() => {
    const tempParticles: ParticleData[] = [];
    
    // 1. The Top Star (Brighter, Larger, SILVER)
    // Scale adjusted: Reduced to 0.8 as requested
    tempParticles.push({
      id: 0,
      type: ParticleType.STAR,
      positionTree: new THREE.Vector3(0, TREE_HEIGHT / 2 + 1.2, 0), 
      positionScattered: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Vector3(0, 0, 0),
      scale: 0.8, // Target scale 0.8
      color: COLOR_SILVER, 
      speed: 0.5
    });

    // 2. The Dust/Particles
    for (let i = 1; i < PARTICLE_COUNT; i++) {
      // Tree Formation: Spiral
      const yPercent = i / PARTICLE_COUNT; 
      const yRandom = (Math.random() - 0.5) * 0.5;
      const y = (yPercent * TREE_HEIGHT) - (TREE_HEIGHT / 2) + yRandom;
      
      const radius = TREE_RADIUS_BASE * (1 - yPercent) + (Math.random() * 0.5); 
      const angle = i * 0.3 + (Math.random() * 0.5); 
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Scattered Formation: Random Cloud
      const r = 8 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      // Determine Properties
      let type = ParticleType.SPHERE;
      let color = COLOR_WHITE;
      
      const rand = Math.random();
      if (rand > 0.95) {
        type = ParticleType.SPARKLE; 
        color = COLOR_WHITE;
      } else if (rand > 0.70) {
        color = COLOR_SILVER;
      } else if (rand > 0.40) {
        color = COLOR_BLUE;
      } else if (rand > 0.20) {
         color = COLOR_DEEP_BLUE;
      } else {
        color = COLOR_ICE;
      }

      const scale = 0.05 + Math.random() * 0.12; 

      tempParticles.push({
        id: i,
        type,
        positionTree: new THREE.Vector3(x, y, z),
        positionScattered: new THREE.Vector3(sx, sy, sz),
        rotation: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale,
        color,
        speed: 0.2 + Math.random() * 0.8
      });
    }
    return tempParticles;
  }, []);

  return (
    <>
      {particles.map((p) => (
        <SingleParticle 
          key={p.id} 
          data={p} 
          mode={mode} 
          isIntro={isIntro}
        />
      ))}
    </>
  );
};

// Individual Particle Component
const SingleParticle: React.FC<{ data: ParticleData; mode: AppMode; isIntro: boolean }> = ({ data, mode, isIntro }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3());
  const initialPos = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 20, 
    (Math.random() - 0.5) * 20, 
    (Math.random() - 0.5) * 5
  )); 

  // Create 5-point Star Shape for Extrusion
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1;
    const innerRadius = 0.45; 
    
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const a = (i / points) * Math.PI;
      const x = Math.sin(a) * r;
      const y = Math.cos(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Determine target
    if (isIntro) {
      if (data.id === 0) {
        targetPos.current.set(0, 0, 0);
      } else {
        targetPos.current.copy(initialPos.current); 
      }
    } else if (mode === AppMode.TREE) {
      targetPos.current.copy(data.positionTree);
      const breathe = Math.sin(time * 2 + data.id) * 0.05;
      targetPos.current.x += targetPos.current.x * breathe;
      targetPos.current.z += targetPos.current.z * breathe;
    } else {
      targetPos.current.copy(data.positionScattered);
      targetPos.current.y += Math.sin(time * data.speed + data.id) * 1.5;
      targetPos.current.x += Math.cos(time * data.speed * 0.5 + data.id) * 0.5;
    }

    // Move particle
    const speed = isIntro ? 3 : (mode === AppMode.TREE ? 2.5 : 1.5);
    meshRef.current.position.lerp(targetPos.current, delta * speed);
    
    // Scale Logic
    let targetScale = data.scale;
    if (isIntro) {
      if (data.id === 0) {
        targetScale = 3.0; 
        targetScale += Math.sin(time * 3) * 0.2; 
      } else {
        targetScale = 0; 
      }
    } else {
      if (data.type !== ParticleType.STAR) {
        const twinkle = 1 + Math.sin(time * 3 + data.id) * 0.3;
        targetScale = data.scale * twinkle;
      } else {
        // Main Star Size in Tree Mode
        // Reduced to 0.8 as requested
        targetScale = 0.8; 
        targetScale += Math.sin(time * 2) * 0.2;
      }
    }
    
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    
    // Rotation
    if (data.type === ParticleType.STAR) {
       // Spin the star around Y axis
       meshRef.current.rotation.y += delta * 0.5;
       // Gently tilt X
       meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    } else {
       meshRef.current.rotation.x += delta * data.speed;
       meshRef.current.rotation.y += delta * data.speed;
    }
  });

  // Geometries
  const sphereGeo = <sphereGeometry args={[1, 32, 32]} />; 
  const sparkleGeo = <octahedronGeometry args={[1, 0]} />;

  // Advanced Metallic Material (MeshPhysicalMaterial)
  const material = (
    <meshPhysicalMaterial 
      color={data.color} 
      emissive={data.color} 
      // Emissive Intensity
      emissiveIntensity={data.type === ParticleType.STAR ? 3.5 : 0.2} 
      
      roughness={0.15}   
      metalness={1.0}    
      
      clearcoat={1.0}    
      clearcoatRoughness={0.1}
      
      reflectivity={1}
    />
  );

  return (
    <mesh 
      ref={meshRef} 
      position={data.positionTree} 
      scale={0} 
    >
      {data.type === ParticleType.SPHERE && sphereGeo}
      {data.type === ParticleType.STAR && (
        // Extruded Star Geometry
        <extrudeGeometry 
          args={[
            starShape, 
            { 
              depth: 0.3, 
              bevelEnabled: true, 
              bevelThickness: 0.1, 
              bevelSize: 0.05, 
              bevelSegments: 4 
            }
          ]} 
        />
      )}
      {data.type === ParticleType.SPARKLE && sparkleGeo}
      {material}
    </mesh>
  );
};