import { motion } from 'motion/react';

interface ScreenGateProps {
  gateState: 'open' | 'closing' | 'closed' | 'opening';
}

export default function ScreenGate({ gateState }: ScreenGateProps) {
  const isPointerEventsEnabled = gateState !== 'open';

  // Cinematic, mechanical easing for a heavy 3D door feel
  const easeClose = [0.15, 0.95, 0.25, 1]; // Fast slide in, smooth heavy stop
  const easeOpen = [0.85, 0, 0.15, 1]; // Fast retract

  const leftVariants = {
    open: { x: '-100%', transition: { type: 'tween', ease: easeOpen, duration: 0.65 } },
    closing: { x: '0%', transition: { type: 'tween', ease: easeClose, duration: 0.75 } },
    closed: { x: '0%' },
    opening: { x: '-100%', transition: { type: 'tween', ease: easeOpen, duration: 0.65 } },
  };

  const rightVariants = {
    open: { x: '100%', transition: { type: 'tween', ease: easeOpen, duration: 0.65 } },
    closing: { x: '0%', transition: { type: 'tween', ease: easeClose, duration: 0.75 } },
    closed: { x: '0%' },
    opening: { x: '100%', transition: { type: 'tween', ease: easeOpen, duration: 0.65 } },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: isPointerEventsEnabled ? 'auto' : 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .gate-container {
          position: absolute;
          top: 0;
          height: 100vh;
          width: 50vw;
          will-change: transform;
        }
        .gate-layer {
          position: absolute;
          inset: 0;
        }
      `}</style>

      {/* ================= LEFT GATE ================= */}
      <motion.div
        className="gate-container"
        style={{ left: 0, filter: 'drop-shadow(20px 0 30px rgba(0,0,0,1))' }}
        initial="open"
        animate={gateState}
        variants={leftVariants}
      >
        <img 
          src="/leftgate.png?v=2" 
          alt="Left Gate" 
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill' // Force stretch to ensure perfect match on all screens
          }} 
        />
        {/* Inner 3D Bevel & Lighting */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.1) 95%, rgba(0,0,0,0.9) 100%)',
          borderRight: '2px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none'
        }} />
      </motion.div>

      {/* ================= RIGHT GATE ================= */}
      <motion.div
        className="gate-container"
        style={{ right: 0, filter: 'drop-shadow(-20px 0 30px rgba(0,0,0,1))' }}
        initial="open"
        animate={gateState}
        variants={rightVariants}
      >
        <img 
          src="/rightgate.png?v=2" 
          alt="Right Gate" 
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill' // Force stretch to ensure perfect match on all screens
          }} 
        />
        {/* Inner 3D Bevel & Lighting */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(-90deg, transparent 60%, rgba(255,255,255,0.1) 95%, rgba(0,0,0,0.9) 100%)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none'
        }} />
      </motion.div>
    </div>
  );
}

