import React from 'react';

interface UIOverlayProps {
  gesture: string;
  started: boolean;
  onStart: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ gesture, started, onStart }) => {
  return (
    <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
      
      {/* PHASE 1: INTRO (Clickable to start) */}
      <div 
        className={`absolute inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-1000 z-50 pointer-events-auto cursor-pointer ${started ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={onStart} 
      >
        {/* Main Title STAR */}
        <div className="relative mb-16 animate-pulse">
           <h1 className="text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C3] to-[#D4AF37] drop-shadow-[0_0_25px_rgba(255,215,0,0.6)] tracking-[0.2em]" style={{ fontFamily: '"Cinzel", serif' }}>
             STAR
           </h1>
        </div>

        {/* Click Instruction */}
        <div className="flex flex-col items-center gap-4 animate-[pulse_2s_infinite]">
             <span className="text-2xl text-yellow-100/80">👆</span>
             <p className="text-yellow-100/70 text-sm tracking-widest font-light">
               點擊螢幕進入
             </p>
        </div>
      </div>

      {/* PHASE 2: MAIN UI - Only visible after started */}
      {/* Changed justify-center to justify-start and added top padding (pt-12 md:pt-16) to ensure text stays at top */}
      <div className={`absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-20 p-8 transition-opacity duration-1000 ${started ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Title - Bold and Styled */}
        <div className="text-center z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C3] to-[#D4AF37] drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] tracking-widest font-serif leading-tight" style={{ fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
            JASON HUANG<br className="md:hidden" /> MERRY CHRISTMAS
          </h1>
        </div>

      </div>

    </div>
  );
};