import {
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  GraduationCap,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HERO_LAB_IMAGE, type ACADEMY_DATA } from '../data/academyData';

interface SplashGateProps {
  brand: (typeof ACADEMY_DATA)['brand'];
  visible: boolean;
  exiting: boolean;
  onEnter: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  phase: number;
}

interface EnergyRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const FLOATING_FORMULAS = [
  { text: 'Fe³⁺ [Ar] 3d⁵', position: 'top-[12%] right-[6%]', anim: 'splash-float' },
  { text: 'C₆H₆ + HNO₃', position: 'top-[20%] left-[6%]', anim: 'splash-float-slow' },
  { text: 'E°cell = E°cath − E°an', position: 'bottom-[24%] right-[5%]', anim: 'splash-float-slow' },
  { text: 'pH = −log[H⁺]', position: 'bottom-[18%] left-[7%]', anim: 'splash-float' },
  { text: 'Kc = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ', position: 'top-[52%] left-[4%]', anim: 'splash-float' },
  { text: 'ΔH° · Ksp', position: 'top-[50%] right-[4%]', anim: 'splash-float-slow' },
] as const;

export function SplashGate({ brand, visible, exiting, onEnter }: SplashGateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const emblemRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const ripplesRef = useRef<EnergyRipple[]>([]);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Allow pressing Enter to immediately launch the platform from the splash gate
  useEffect(() => {
    if (!visible || exiting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'A' || target.tagName === 'BUTTON')) return;
      onEnter();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, exiting, onEnter]);

  // Interactive molecular & neural-circuit particle constellation canvas
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;

    const colors = ['#38bdf8', '#10b981', '#60a5fa', '#22d3ee'];
    const particles: Particle[] = [];

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 26 : 46;
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        const angle = (i * 2.399963) % (Math.PI * 2);
        const speed = 0.22 + (i % 5) * 0.08;
        particles.push({
          x: ((i * 197.3) % 1000) / 1000 * width,
          y: ((i * 353.7) % 1000) / 1000 * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + (i % 4) * 0.55,
          color: colors[i % colors.length],
          phase: i * 0.65,
        });
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    const drawFrame = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);
      const pointer = pointerRef.current;
      const maxDist = width < 640 ? 105 : 138;
      const pointerDist = 175;

      // Update positions and draw glowing bond links
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;
          if (p.y < -12) p.y = height + 12;
          if (p.y > height + 12) p.y = -12;

          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 900 && distSq < pointerDist * pointerDist) {
              const factor = 0.00018;
              p.x += dx * factor * 14;
              p.y += dy * factor * 14;
            }
          }
        }

        // Particle-to-particle chemical bonds
        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.24;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        // Cursor-to-particle interactive filaments
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerDist) {
            const alpha = (1 - dist / pointerDist) * 0.42;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }

        // Glowing molecular node
        const pulse = reducedMotion
          ? 1
          : 0.78 + 0.22 * Math.sin(timestamp * 0.0022 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.78;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw interactive click energy ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i];
        r.radius += 3.6;
        r.alpha *= 0.945;
        if (r.alpha < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${r.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(0);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [visible]);

  if (!visible) return null;

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerRef.current = { x, y, active: true };

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(540px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.16), rgba(16, 185, 129, 0.06) 42%, transparent 72%)`;
    }

    if (emblemRef.current) {
      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;
      const rotY = normX * 11;
      const rotX = -normY * 11;
      emblemRef.current.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    }
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
    if (emblemRef.current) {
      emblemRef.current.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  const spawnRipple = (x: number, y: number) => {
    ripplesRef.current.push({
      x,
      y,
      radius: 12,
      maxRadius: 210,
      alpha: 0.65,
    });
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    spawnRipple(event.clientX - rect.left, event.clientY - rect.top);
  };

  const handleCopyPhone = (phone: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(phone).catch(() => {
        // Fallback ignored if clipboard permissions are restricted
      });
    }
    setCopiedPhone(phone);
    window.setTimeout(() => {
      setCopiedPhone((prev) => (prev === phone ? null : prev));
    }, 2000);
  };

  const creditCards = [
    {
      key: 'author',
      role: brand.authorRole,
      name: brand.authorName,
      phone: brand.authorPhone,
      accentRing: 'hover:border-emerald-400/55',
      iconBg: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300',
      badgeText: 'text-emerald-300',
      Icon: GraduationCap,
    },
    {
      key: 'designer',
      role: brand.designerRole,
      name: brand.designerName,
      phone: brand.designerPhone,
      accentRing: 'hover:border-sky-400/55',
      iconBg: 'bg-sky-500/15 border-sky-400/35 text-sky-300',
      badgeText: 'text-sky-300',
      Icon: Cpu,
    },
  ];

  return (
    <div
      id="splashGate"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 w-screen h-screen bg-[#020510] overflow-y-auto overflow-x-hidden${
        exiting ? ' splash-exit' : ''
      }`}
    >
      {/* Atmospheric laboratory photography backdrop with deep cinematic scrim */}
      <img
        src={HERO_LAB_IMAGE}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="fixed inset-0 w-full h-full object-cover opacity-20 scale-105 pointer-events-none select-none"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.16),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.12),transparent_55%),linear-gradient(180deg,rgba(2,5,16,0.88)_0%,rgba(2,5,16,0.82)_48%,rgba(2,5,16,0.97)_100%)] pointer-events-none"
      />

      {/* Interactive molecular & circuit constellation canvas */}
      <canvas
        ref={canvasRef}
        data-testid="splash-particles-canvas"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none"
      />

      {/* Pointer-following ambient spotlight */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
      />

      {/* Subtle architectural orbital SVG rings */}
      <div
        aria-hidden="true"
        className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <svg viewBox="0 0 700 700" className="w-[680px] h-[680px] max-w-[125vw] opacity-25">
          <circle
            cx="350"
            cy="350"
            r="230"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="6 12"
            className="orbit-spin-slow"
          />
          <circle
            cx="350"
            cy="350"
            r="305"
            fill="none"
            stroke="var(--p-primary)"
            strokeWidth="1"
            strokeDasharray="3 16"
            className="orbit-spin-med"
          />
        </svg>
      </div>

      {/* Floating ambient chemistry formula badges on wide screens */}
      <div aria-hidden="true" className="hidden lg:block fixed inset-0 pointer-events-none select-none">
        {FLOATING_FORMULAS.map((item) => (
          <div
            key={item.text}
            className={`absolute ${item.position} ${item.anim} px-3 py-1.5 rounded-xl bg-slate-950/55 border border-cyan-400/20 text-cyan-200/65 text-xs font-bold formula-ltr backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)]`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Foreground interactive content */}
      <div className="relative z-10 min-h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          {/* Interactive 3D Logo Crest featuring the uploaded MS / M.S.AI logo */}
          <div className="splash-fade-1 relative mb-6 sm:mb-7">
            {/* Pulsing outer luminous halo */}
            <div
              aria-hidden="true"
              className="logo-pulse-halo absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.42)_0%,rgba(16,185,129,0.2)_48%,transparent_72%)] blur-xl pointer-events-none"
            />

            {/* Orbiting precision electron rings around the logo */}
            <svg
              aria-hidden="true"
              viewBox="0 0 220 220"
              className="absolute -inset-6 sm:-inset-7 w-[calc(100%+48px)] sm:w-[calc(100%+56px)] h-[calc(100%+48px)] sm:h-[calc(100%+56px)] pointer-events-none"
            >
              <g className="orbit-spin-slow">
                <circle
                  cx="110"
                  cy="110"
                  r="96"
                  fill="none"
                  stroke="rgba(56,189,248,0.42)"
                  strokeWidth="1.2"
                  strokeDasharray="10 10"
                />
                <circle cx="110" cy="14" r="4" fill="#38bdf8" />
              </g>
              <g className="orbit-spin-med">
                <circle
                  cx="110"
                  cy="110"
                  r="105"
                  fill="none"
                  stroke="rgba(16,185,129,0.34)"
                  strokeWidth="1"
                  strokeDasharray="4 14"
                />
                <circle cx="215" cy="110" r="3.5" fill="#10b981" />
              </g>
            </svg>

            {/* Tilting obsidian microchip emblem */}
            <div
              ref={emblemRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                spawnRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
              }}
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[28px] bg-black p-1.5 border border-sky-400/50 shadow-[0_0_45px_rgba(56,189,248,0.38),0_20px_50px_rgba(0,0,0,0.75)] transition-transform duration-200 ease-out overflow-hidden cursor-pointer"
            >
              <img
                src={brand.logoUrl}
                alt={`شعار منصة ${brand.name} M.S.AI`}
                className="w-full h-full object-contain rounded-[22px] select-none"
              />
              {/* Holographic gliding scanline */}
              <div
                aria-hidden="true"
                className="logo-scanline absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-sky-300/25 to-transparent pointer-events-none"
              />
            </div>
          </div>

          {/* Eyebrow & Platform Heading */}
          <div className="splash-fade-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-bold mb-3.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{brand.splashBadge}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black aurora-text mb-3 leading-tight tracking-tight">
              {brand.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/85 mb-6 flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1">
              <span>مختبر افتراضي تفاعلي</span>
              <span aria-hidden="true" className="text-cyan-400">•</span>
              <span>جدول دوري ذري</span>
              <span aria-hidden="true" className="text-cyan-400">•</span>
              <span>الكتاب المفتوح</span>
              <span aria-hidden="true" className="text-cyan-400">•</span>
              <span>اختبارات تكيّفية وشهادات تقدير</span>
            </p>
          </div>

          {/* Author & Designer Credits + Direct Phone Contact Cards */}
          <div className="splash-fade-3 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-7 sm:mb-8">
            {creditCards.map(({ key, role, name, phone, accentRing, iconBg, badgeText, Icon }) => {
              const isCopied = copiedPhone === phone;
              return (
                <div
                  key={key}
                  className={`group relative rounded-2xl bg-slate-950/75 border border-white/12 ${accentRing} p-4 text-right backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-bold ${badgeText}`}>{role}</div>
                      <div className="text-base sm:text-lg font-black text-white truncate">
                        {name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
                    <a
                      href={`tel:${phone}`}
                      aria-label={`الاتصال بـ ${name} على الرقم ${phone}`}
                      className="inline-flex items-center gap-2 text-slate-100 hover:text-cyan-300 transition-colors font-bold text-sm"
                    >
                      <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="formula-ltr tracking-wider">{phone}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyPhone(phone)}
                      aria-label={`نسخ رقم ${name}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Enter Platform CTA */}
          <div className="splash-fade-4 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={onEnter}
              className="group relative overflow-hidden theme-grad-btn enter-btn-glow px-10 py-4 rounded-2xl text-white font-black text-lg sm:text-xl inline-flex items-center gap-3.5 transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98] cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="splash-sheen absolute inset-y-0 w-1/3 bg-white/30 blur-sm pointer-events-none"
              />
              <span className="relative">{brand.splashEnterLabel}</span>
              <ArrowLeft className="relative w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1.5" />
            </button>
            <p className="text-[11px] text-slate-400/90">
              حرّك المؤشر للتفاعل مع الشبكة الذرية أو اضغط <kbd className="font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-200">Enter</kbd> للدخول
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
