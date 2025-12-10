import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { HandGestureData, AppMode } from './types';
import { Scene } from './components/Scene';
import { HandController } from './components/HandController';
import { UIOverlay } from './components/UIOverlay';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [handData, setHandData] = useState<HandGestureData>({
    gesture: 'NONE',
    palmPosition: { x: 0, y: 0 }
  });

  // Simplified State Machine
  useEffect(() => {
    if (!started) return;

    const { gesture } = handData;
    
    if (gesture === 'GRAB') {
      setMode(AppMode.PHOTO_VIEW);
    } else if (gesture === 'FIST') {
      setMode(AppMode.TREE);
    } else if (gesture === 'OPEN') {
      setMode(AppMode.SCATTERED);
    }
  }, [handData.gesture, started]);

  return (
    <div className="relative w-full h-screen bg-[#020502] text-white overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows
          // Moved camera Z from 14 to 22 to zoom out. 
          // This allows the tree (height ~16) + text + gifts to fit on mobile portrait screens.
          camera={{ position: [0, 0, 22], fov: 45 }}
          gl={{ antialias: false, toneMappingExposure: 1.2 }}
          dpr={[1, 2]}
        >
          <Scene mode={mode} handData={handData} isIntro={!started} />
        </Canvas>
      </div>

      {/* Logic Layer - Now receives 'started' state to handle Phase 1 vs Phase 2 UI */}
      <HandController 
        onHandDataUpdate={setHandData} 
        started={started}
        onStart={() => setStarted(true)}
      />

      {/* UI Layer */}
      <UIOverlay 
        gesture={handData.gesture} 
        started={started} 
        onStart={() => setStarted(true)} 
      />
      
    </div>
  );
};

export default App;