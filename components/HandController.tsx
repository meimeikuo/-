import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandGestureData } from '../types';

interface HandControllerProps {
  onHandDataUpdate: (data: HandGestureData) => void;
  started: boolean;
  onStart: () => void;
}

export const HandController: React.FC<HandControllerProps> = ({ onHandDataUpdate, started, onStart }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentGestureName, setCurrentGestureName] = useState('偵測中...');
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setIsLoaded(true);
    };
    init();

    return () => {
       if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  // Start Camera
  useEffect(() => {
    if (!isLoaded || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          if (videoRef.current.readyState >= 2) {
             predictWebcam();
          } else {
             videoRef.current.onloadeddata = predictWebcam;
          }
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startCamera();

    return () => {
       if (requestRef.current) {
         cancelAnimationFrame(requestRef.current);
       }
       if (videoRef.current && videoRef.current.srcObject) {
           const stream = videoRef.current.srcObject as MediaStream;
           stream.getTracks().forEach(track => track.stop());
       }
    };
  }, [isLoaded]);

  // Keep the detection logic but we don't need to draw to a visible canvas anymore
  // However, for debugging or potential future use, we can keep the draw logic or just skip it.
  // Here we skip complex drawing since the user only wants text.
  
  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;
    
    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const startTimeMs = performance.now();
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        
        const landmarks = results.landmarks[0];
        
        // Analyze Gesture
        const gesture = analyzeGesture(landmarks);
        
        // Update Chinese Text
        let gestureText = "移動中";
        if (gesture === 'FIST') gestureText = "握拳";
        if (gesture === 'OPEN') gestureText = "張開 (旋轉中)";
        if (gesture === 'GRAB') gestureText = "抓取";
        setCurrentGestureName(gestureText);

        const palmX = -((landmarks[0].x * 2) - 1); 
        const palmY = -((landmarks[0].y * 2) - 1);

        onHandDataUpdate({
          gesture,
          palmPosition: { x: palmX, y: palmY },
        });
      } else {
        setCurrentGestureName("請將手放入鏡頭");
        
        onHandDataUpdate({
          gesture: 'NONE',
          palmPosition: { x: 0, y: 0 },
        });
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const analyzeGesture = (landmarks: any[]): 'FIST' | 'OPEN' | 'GRAB' | 'NONE' => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2) + 
      Math.pow(thumbTip.z - indexTip.z, 2)
    );

    if (distance < 0.08) return 'GRAB';

    const isFingerOpen = (tipIdx: number, pipIdx: number) => {
      return landmarks[tipIdx].y < landmarks[pipIdx].y;
    };

    const indexOpen = isFingerOpen(8, 6);
    const middleOpen = isFingerOpen(12, 10);
    const ringOpen = isFingerOpen(16, 14);
    const pinkyOpen = isFingerOpen(20, 18);

    const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

    if (openCount >= 3) return 'OPEN';
    if (openCount <= 1) return 'FIST';
    
    return 'NONE';
  };

  return (
    <>
      {/* 
        Hidden Processing Layer
        We keep the video/canvas in the DOM for MediaPipe to function correctly,
        but we hide them visually using opacity and z-index.
      */}
      <div className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
        />
        <canvas 
          ref={canvasRef}
          width={640}
          height={480}
        />
      </div>
      
      {/* 
        Visible Status Text - Bottom Left 
        Only showing text as requested.
      */}
      <div className={`fixed transition-all duration-700 z-50 
        ${started 
          ? 'bottom-8 left-8 opacity-100' 
          : 'bottom-0 left-0 opacity-0 translate-y-10'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md border border-yellow-500/50 rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)] px-6 py-3 flex items-center justify-center min-w-[120px]">
          <span className={`text-xl font-bold tracking-widest text-yellow-100 ${
            currentGestureName.includes('請將') ? 'text-sm' : ''
          }`}>
            {currentGestureName}
          </span>
        </div>
      </div>
    </>
  );
};