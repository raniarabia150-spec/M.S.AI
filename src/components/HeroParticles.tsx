import { useEffect, useRef } from 'react';
import type { PaletteId } from '../utils/academyState';

interface HeroParticlesProps {
  palette: PaletteId;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  useSecondary: boolean;
}

export function HeroParticles({ palette, active }: HeroParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<PaletteId>(palette);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    const particles: Particle[] = [];
    const COUNT = 34;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : 520;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0) {
        for (let i = 0; i < COUNT; i += 1) {
          particles.push({
            x: ((i * 97) % Math.max(width, 1)) * 1,
            y: ((i * 53) % Math.max(height, 1)) * 1,
            vx: ((i % 2 === 0 ? 1 : -1) * (0.18 + (i % 5) * 0.06)),
            vy: ((i % 3 === 0 ? 1 : -1) * (0.14 + (i % 4) * 0.05)),
            r: 1.5 + (i % 3) * 0.85,
            useSecondary: i % 2 === 1,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue('--p-primary').trim() || '#10b981';
      const secondary = styles.getPropertyValue('--p-secondary').trim() || '#06b6d4';

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.useSecondary ? secondary : primary;
        ctx.globalAlpha = 0.55;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.useSecondary ? secondary : primary;
            ctx.globalAlpha = 0.14 * (1 - distSq / 15000);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      id="heroParticlesCanvas"
      ref={canvasRef}
      data-testid="hero-particles-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
    />
  );
}
