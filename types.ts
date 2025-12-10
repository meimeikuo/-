import { Vector3 } from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTERED = 'SCATTERED',
  PHOTO_VIEW = 'PHOTO_VIEW'
}

export enum ParticleType {
  SPHERE = 'SPHERE',
  STAR = 'STAR',
  SPARKLE = 'SPARKLE'
}

export interface ParticleData {
  id: number;
  type: ParticleType;
  positionTree: Vector3;
  positionScattered: Vector3;
  rotation: Vector3;
  scale: number;
  color: string;
  speed: number;
}

export interface HandGestureData {
  gesture: 'FIST' | 'OPEN' | 'GRAB' | 'NONE';
  palmPosition: { x: number; y: number }; // Normalized -1 to 1
}