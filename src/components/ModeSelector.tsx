import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface ModeSelectorProps {
  onClose: () => void;
  onSelect: (mode: '1v1' | '2v2' | 'ranked' | 'practice') => void;
  currentMode: '1v1' | '2v2' | 'ranked' | 'practice';
}

interface ModeInfo {
  id: '1v1' | '2v2' | 'ranked' | 'practice';
  bgImage: string;
  themeColor: string;
  glowColor: string;
}

const MODES: ModeInfo[] = [
  {
    id: 'ranked',
    bgImage: '/Rankedbutton.png',
    themeColor: '#ff5500',
    glowColor: 'rgba(255, 85, 0, 0.7)',
  },
  {
    id: '2v2',
    bgImage: '/Casualbutton.png',
    themeColor: '#00d2ff',
    glowColor: 'rgba(0, 210, 255, 0.7)',
  },
  {
    id: '1v1',
    bgImage: '/DuelButton.png',
    themeColor: '#9d4edd',
    glowColor: 'rgba(157, 78, 221, 0.7)',
  },
  {
    id: 'practice',
    bgImage: '/Practicebutton.png',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
  }
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onClose, onSelect, currentMode }) => {
  return (
    <AnimatePresence>
      <motion.div
        id="mode-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-2 no-scrollbar overflow-hidden"
        style={{
          backgroundImage: 'url("/selectmode.png")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          fontFamily: '"Space Grotesk", sans-serif'
        }}
      >
        {/* Style tag to hide scrollbars on all browsers */}
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}</style>

        {/* Close Button */}
        <button
          id="mode-selector-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all duration-300 hover:rotate-90 cursor-pointer z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.85)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.65), inset 0 0 6px rgba(239, 68, 68, 0.45)',
            color: '#ef4444',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.95), inset 0 0 10px rgba(239, 68, 68, 0.6)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.65), inset 0 0 6px rgba(239, 68, 68, 0.45)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(10, 10, 10, 0.85)';
          }}
        >
          <X className="w-5 h-5 stroke-[2.5]" style={{ filter: 'drop-shadow(0 0 2px currentColor)' }} />
        </button>

        {/* Cards Row Container (Horizontal, No Wrap, Center, Hide Scrollbar) */}
        <div className="flex flex-row flex-nowrap justify-center items-center gap-2 sm:gap-4 w-full max-w-5xl px-2 py-4 no-scrollbar overflow-x-auto overflow-y-hidden">
          {MODES.map((mode, index) => {
            const isSelected = currentMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                id={`mode-card-${mode.id}`}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => onSelect(mode.id)}
                className="relative rounded-xl border-2 cursor-pointer transition-all duration-300 select-none overflow-hidden shrink-0 group"
                style={{
                  width: 'clamp(82px, 22vw, 150px)',
                  height: 'clamp(160px, 45vh, 230px)',
                  backgroundImage: `url("${mode.bgImage}")`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderColor: isSelected ? mode.themeColor : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: isSelected ? `0 0 25px 0px ${mode.glowColor}` : 'none',
                }}
                whileHover={{
                  y: -5,
                  borderColor: isSelected ? mode.themeColor : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: isSelected 
                    ? `0 0 30px 2px ${mode.glowColor}` 
                    : `0 10px 20px -8px rgba(0,0,0,0.8), 0 0 15px -3px ${mode.glowColor}`
                }}
              >
                {/* Highlight/Glow Overlay on selection/hover */}
                <div 
                  className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                    isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-10'
                  }`}
                  style={{
                    backgroundImage: `radial-gradient(circle at center, ${mode.themeColor} 0%, transparent 80%)`
                  }}
                />

                {/* Top Corner Checkmark overlay to show selection clearly */}
                {isSelected && (
                  <div 
                    className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full text-black shadow-md z-10"
                    style={{ backgroundColor: mode.themeColor }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
