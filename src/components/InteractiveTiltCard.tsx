import type { MouseEvent, ReactNode } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';

interface InteractiveTiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  spotlightSize?: number;
  glowStrength?: number;
  delay?: number;
  enableEntrance?: boolean;
}

export function InteractiveTiltCard({
  children,
  className = '',
  maxTilt = 4.5,
  spotlightSize = 280,
  glowStrength = 0.24,
  delay = 0,
  enableEntrance = true,
}: InteractiveTiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const spotlightOpacity = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24, mass: 0.5 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24, mass: 0.5 });
  const smoothOpacity = useSpring(spotlightOpacity, { stiffness: 220, damping: 26 });

  const spotlightBg = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${pointerX}% ${pointerY}%, color-mix(in srgb, var(--p-primary) ${Math.round(glowStrength * 100)}%, transparent), transparent 72%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    pointerX.set(xPct * 100);
    pointerY.set(yPct * 100);
    spotlightOpacity.set(1);

    rawRotateY.set((xPct - 0.5) * maxTilt * 2);
    rawRotateX.set((0.5 - yPct) * maxTilt * 2);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    spotlightOpacity.set(0);
  };

  return (
    <motion.div
      initial={enableEntrance && !prefersReducedMotion ? { opacity: 0, y: 18 } : false}
      whileInView={enableEntrance && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.48, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        prefersReducedMotion
          ? undefined
          : {
              transformPerspective: 1000,
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
      }
      className={`relative overflow-hidden ${className}`}
    >
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{
            background: spotlightBg,
            opacity: smoothOpacity,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
