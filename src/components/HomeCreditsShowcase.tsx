import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  FlaskConical,
  Palette,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ACADEMY_DATA, type CreatorProfile } from '../data/academyData';
import { InteractiveTiltCard } from './InteractiveTiltCard';

interface HomeCreditsShowcaseProps {
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

function CreatorEmblem({ kind }: { kind: CreatorProfile['id'] }) {
  if (kind === 'author') {
    return (
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.06] overflow-hidden float-gentle">
        <svg
          viewBox="0 0 80 80"
          className="w-14 h-14"
          aria-hidden="true"
        >
          <g className="orbit-spin-slow">
            <ellipse
              cx="40"
              cy="40"
              rx="31"
              ry="13"
              fill="none"
              stroke="var(--p-primary)"
              strokeWidth="1.5"
              strokeOpacity="0.65"
              transform="rotate(-28 40 40)"
            />
            <circle cx="67" cy="28" r="3" fill="var(--p-secondary)" />
          </g>
          <g className="orbit-spin-med">
            <ellipse
              cx="40"
              cy="40"
              rx="31"
              ry="13"
              fill="none"
              stroke="var(--p-secondary)"
              strokeWidth="1.4"
              strokeOpacity="0.5"
              transform="rotate(34 40 40)"
            />
            <circle cx="14" cy="24" r="2.6" fill="var(--p-primary)" />
          </g>
          <circle
            cx="40"
            cy="40"
            r="14"
            fill="color-mix(in srgb, var(--p-primary) 16%, transparent)"
            stroke="var(--p-primary)"
            strokeWidth="1.5"
          />
        </svg>
        <FlaskConical className="w-5 h-5 theme-text absolute" />
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.06] overflow-hidden float-gentle-delayed">
      <svg
        viewBox="0 0 80 80"
        className="w-14 h-14"
        aria-hidden="true"
      >
        <g className="orbit-spin-slow">
          <polygon
            points="40,8 68,24 68,56 40,72 12,56 12,24"
            fill="none"
            stroke="var(--p-secondary)"
            strokeWidth="1.5"
            strokeOpacity="0.65"
            strokeDasharray="6 4"
          />
          <circle cx="40" cy="8" r="2.8" fill="var(--p-primary)" />
          <circle cx="40" cy="72" r="2.8" fill="var(--p-secondary)" />
        </g>
        <polygon
          points="40,21 56,30.5 56,49.5 40,59 24,49.5 24,30.5"
          fill="color-mix(in srgb, var(--p-secondary) 16%, transparent)"
          stroke="var(--p-primary)"
          strokeWidth="1.5"
        />
      </svg>
      <Palette className="w-5 h-5 theme-text absolute" />
    </div>
  );
}

export function HomeCreditsShowcase({ onNotify }: HomeCreditsShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const creators = ACADEMY_DATA.brand.creators;

  const handleCopyPhone = async (creator: CreatorProfile) => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(creator.phone);
      copied = true;
    } catch {
      try {
        const helper = document.createElement('textarea');
        helper.value = creator.phone;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        copied = document.execCommand('copy');
        document.body.removeChild(helper);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopiedId(creator.id);
      onNotify(`تم نسخ رقم ${creator.name}: ${creator.phone}`);
      window.setTimeout(() => {
        setCopiedId((current) => (current === creator.id ? null : current));
      }, 2200);
    } else {
      onNotify(`رقم التواصل مع ${creator.name}: ${creator.phone}`, 'info');
    }
  };

  return (
    <section
      id="home-credits-showcase"
      aria-labelledby="credits-showcase-heading"
      className="relative rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/[0.03] p-6 sm:p-8 lg:p-10 shadow-sm dark:shadow-none overflow-hidden"
    >
      {/* Subtle Architectural Molecular Grid Backdrop */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.07] dark:opacity-[0.1]"
        viewBox="0 0 900 320"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="chemHexGrid" width="72" height="62" patternUnits="userSpaceOnUse">
            <polygon
              points="36,2 70,18 70,46 36,60 2,46 2,18"
              fill="none"
              stroke="var(--p-primary)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="900" height="320" fill="url(#chemHexGrid)" />
      </svg>

      {/* Top Specular Edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--p-primary)] to-transparent opacity-60"
      />

      <div className="relative z-10 space-y-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold theme-text tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>فريق الإعداد العلمي والتصميم التفاعلي</span>
            </div>
            <h2
              id="credits-showcase-heading"
              className="text-2xl sm:text-3xl font-black aurora-text"
            >
              الإعداد والتصميم والتواصل المباشر
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              تعاون بين الخبرة التعليمية المتخصصة في الكيمياء والهندسة الإبداعية للواجهات التفاعلية لتقديم منصة علمية متكاملة.
            </p>
          </div>
          <div className="formula-ltr text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            Chemistry Academy · Authored &amp; Engineered
          </div>
        </div>

        {/* Dual Interactive Creator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {creators.map((creator, idx) => {
            const isCopied = copiedId === creator.id;
            return (
              <InteractiveTiltCard
                key={creator.id}
                delay={idx * 0.1}
                maxTilt={4}
                glowStrength={0.22}
                className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50/75 dark:bg-[#080d1e]/85 p-6 sm:p-7 flex flex-col justify-between gap-6 group transition-colors hover:border-[var(--p-primary)]/50"
              >
                {/* Top Decorative Specular Hairline */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 top-0 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      creator.id === 'author'
                        ? 'linear-gradient(90deg, transparent, var(--p-primary), transparent)'
                        : 'linear-gradient(90deg, transparent, var(--p-secondary), transparent)',
                  }}
                />

                <div className="relative z-20 space-y-5">
                  {/* Role & Emblem Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <CreatorEmblem kind={creator.id} />
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-extrabold theme-text">
                          {creator.roleBadge}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {creator.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {creator.title}
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block formula-ltr text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 shrink-0">
                      {creator.emblemFormula}
                    </span>
                  </div>

                  {/* Concise Bio */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {creator.bio}
                  </p>

                  {/* Contributions List */}
                  <ul className="space-y-2">
                    {creator.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 theme-text shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* High-Contrast Interactive Contact Plate */}
                <div className="relative z-20 rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-white/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {creator.id === 'author' ? 'رقم هاتف المُعدّ' : 'رقم هاتف المُصمّم'}
                    </div>
                    <div
                      className="formula-ltr text-lg sm:text-xl font-black tracking-wider text-slate-900 dark:text-white select-all text-right"
                      data-testid={`creator-phone-${creator.id}`}
                    >
                      {creator.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <motion.a
                      href={creator.telHref}
                      whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.02 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                      className="theme-grad-btn flex-1 sm:flex-initial justify-center whitespace-nowrap px-4 py-2.5 rounded-xl text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span>اتصال مباشر</span>
                    </motion.a>
                    <motion.button
                      type="button"
                      onClick={() => handleCopyPhone(creator)}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                      aria-label={`نسخ رقم ${creator.name}`}
                      className="flex-1 sm:flex-initial justify-center whitespace-nowrap px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100/80 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 text-xs font-bold hover:border-[var(--p-primary)] transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 theme-text shrink-0" />
                          <span>نسخ الرقم</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </InteractiveTiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
