import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  Atom,
  BookMarked,
  BookOpen,
  Calculator,
  Check,
  ClipboardCheck,
  Copy,
  FlaskConical,
  Layers,
  Phone,
  Scale,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ACADEMY_DATA,
  HERO_LAB_IMAGE,
  UNIT1_IMAGE,
  UNIT2_IMAGE,
  UNIT3_IMAGE,
} from '../data/academyData';
import { PERIODIC_ELEMENTS } from '../data/periodicTableData';
import type { AcademyViewId, PaletteId } from '../utils/academyState';
import { BohrAtomVisual } from './BohrAtomVisual';
import { HeroParticles } from './HeroParticles';
import { HomeCreditsShowcase } from './HomeCreditsShowcase';
import { InteractiveTiltCard } from './InteractiveTiltCard';

interface HomeViewProps {
  active: boolean;
  palette: PaletteId;
  completedLessonsCount: number;
  masteredCardsCount: number;
  bestQuizScore: number | null;
  onSwitchView: (view: AcademyViewId) => void;
  onJumpToLesson: (lessonId: string) => void;
  onOpenLabTool: (
    tool: 'experiments' | 'periodic' | 'molar' | 'balancer',
    elementSymbol?: string
  ) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

interface HeroAtomPreset {
  symbol: string;
  nameAr: string;
  atomicNumber: number;
  config: string;
  shells: number[];
  note: string;
}

const HERO_ATOM_PRESETS: HeroAtomPreset[] = [
  {
    symbol: 'Fe',
    nameAr: 'الحديد',
    atomicNumber: 26,
    config: '[Ar] 3d⁶ 4s²',
    shells: [2, 8, 14, 2],
    note: 'عنصر انتقالي رئيسي',
  },
  {
    symbol: 'Cr',
    nameAr: 'الكروم',
    atomicNumber: 24,
    config: '[Ar] 3d⁵ 4s¹',
    shells: [2, 8, 13, 1],
    note: 'شذوذ التوزيع نصف الممتلئ',
  },
  {
    symbol: 'Cu',
    nameAr: 'النحاس',
    atomicNumber: 29,
    config: '[Ar] 3d¹⁰ 4s¹',
    shells: [2, 8, 18, 1],
    note: 'امتلاء تام لمستوى 3d',
  },
  {
    symbol: 'C',
    nameAr: 'الكربون',
    atomicNumber: 6,
    config: '1s² 2s² 2p²',
    shells: [2, 4],
    note: 'أساس المركبات العضوية',
  },
];

export function HomeView({
  active,
  palette,
  completedLessonsCount,
  masteredCardsCount,
  bestQuizScore,
  onSwitchView,
  onJumpToLesson,
  onOpenLabTool,
  onNotify,
}: HomeViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [heroAtomIndex, setHeroAtomIndex] = useState(0);
  const [heroCopiedId, setHeroCopiedId] = useState<string | null>(null);

  const { home, brand, lessons, studio, quiz } = ACADEMY_DATA;
  const totalLessons = lessons.items.length;
  const progressPct = Math.round((completedLessonsCount / Math.max(1, totalLessons)) * 100);
  const currentAtom = HERO_ATOM_PRESETS[heroAtomIndex];

  const handleQuickCopyHeroPhone = async (id: string, name: string, phone: string) => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(phone);
      copied = true;
    } catch {
      try {
        const helper = document.createElement('textarea');
        helper.value = phone;
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
      setHeroCopiedId(id);
      onNotify(`تم نسخ رقم ${name}: ${phone}`);
      window.setTimeout(() => {
        setHeroCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } else {
      onNotify(`رقم التواصل مع ${name}: ${phone}`, 'info');
    }
  };

  const handleScrollToCredits = () => {
    const el = document.getElementById('home-credits-showcase');
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const unitSpotlights = [
    {
      id: 'unit-1',
      lessonId: 'lesson-1',
      kicker: 'الباب الأول · السلسلة الانتقالية الأولى',
      title: 'العناصر الانتقالية والتركيب الإلكتروني',
      summary: 'استكشف أوربيتالات 3d، شذوذ الكروم والنحاس، العزم المغناطيسي، واستخلاص الحديد في الأفران.',
      image: UNIT1_IMAGE,
      alt: 'رسم علمي لأوربيتالات الذرة والشبكة البلورية للعناصر الانتقالية',
    },
    {
      id: 'unit-2',
      lessonId: 'lesson-4',
      kicker: 'الباب الثاني · التفاعلات المتزنة والطاقة',
      title: 'الاتزان الكيميائي والكيمياء الكهربية',
      summary: 'قاعدة لوشاتلييه، المعايرة والأس الهيدروجيني، خلية دانيال الجلفانية، وقوانين فاراداي.',
      image: UNIT2_IMAGE,
      alt: 'رسم علمي لخلية دانيال الجلفانية بأقطاب الخارصين والنحاس والقنطرة الملحية',
    },
    {
      id: 'unit-3',
      lessonId: 'lesson-5',
      kicker: 'الباب الثالث · الهيدروكربونات ومشتقاتها',
      title: 'الكيمياء العضوية والمركبات الأروماتية',
      summary: 'الألكانات والألكينات، قاعدة ماركونيكوف، حلقة البنزين العطري، الكحولات والأحماض والإسترات.',
      image: UNIT3_IMAGE,
      alt: 'نموذج جزيئي لحلقة البنزين العطري والروابط التساهمية',
    },
  ];

  const quickTools = [
    {
      title: 'محاكاة التفاعلات والمعايرة',
      desc: 'منحنى pH حي وخلية دانيال وأثر لوشاتلييه بالرسوم المتحركة',
      icon: FlaskConical,
      onClick: () => onOpenLabTool('experiments'),
    },
    {
      title: 'الجدول الدوري ونموذج بور',
      desc: `${PERIODIC_ELEMENTS.length} عنصراً منهجياً بالتوزيع الإلكتروني وحركة الإلكترونات`,
      icon: Atom,
      onClick: () => onOpenLabTool('periodic'),
    },
    {
      title: 'حاسبة الكتلة المولية',
      desc: 'تحليل أي صيغة كيميائية مثل Fe2(SO4)3 وحساب النسب المئوية والمولات',
      icon: Calculator,
      onClick: () => onOpenLabTool('molar'),
    },
    {
      title: 'موازن المعادلات الكيميائية',
      desc: 'تدريب تفاعلي بميزان ذري فوري للمتفاعلات والنواتج',
      icon: Scale,
      onClick: () => onOpenLabTool('balancer'),
    },
    {
      title: 'أوراق الكتاب المفتوح',
      desc: 'قوانين ومعادلات قابلة للنسخ والتثبيت مع محوّل ثوابت ووحدات',
      icon: BookMarked,
      onClick: () => onSwitchView('openbook'),
    },
    {
      title: 'الاستوديو والاختبارات',
      desc: 'بطاقات ثلاثية الأبعاد ومؤقت تركيز واختبار تكيّفي قابل للطباعة',
      icon: ClipboardCheck,
      onClick: () => onSwitchView('quiz'),
    },
  ];

  return (
    <section id="view-home" className={`app-view ${active ? 'view-reveal' : 'hidden'}`}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-[#040714] text-slate-100">
        <img
          src={HERO_LAB_IMAGE}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <HeroParticles palette={palette} active={active} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-[#040714]/82 to-[#040714]/55" />

        <div className="relative max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Primary Hero Copy & Interactive CTAs */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-5"
          >
            <p className="text-xs sm:text-sm font-bold theme-text tracking-wide">
              {home.badge}
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-[3.35rem] font-black leading-[1.18] aurora-text max-w-2xl">
              {home.title}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              {home.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <motion.button
                type="button"
                onClick={() => onSwitchView('lessons')}
                whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className="theme-grad-btn px-6 py-3 rounded-2xl text-white font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{home.primaryCta}</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => onSwitchView('lab')}
                whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className="px-6 py-3 rounded-2xl border border-white/20 bg-white/5 text-slate-100 font-bold hover:bg-white/12 hover:border-white/35 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 theme-text" />
                <span>{home.secondaryCta}</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => onSwitchView('quiz')}
                whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className="px-5 py-3 rounded-2xl border border-white/15 bg-transparent text-slate-300 font-bold hover:bg-white/8 hover:text-white transition inline-flex items-center gap-2 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>مركز الاختبارات</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Interactive Bento Dashboard, Live Bohr Switcher & Above-the-Fold Credits */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            {/* Interactive Bohr Atom Switcher Card */}
            <InteractiveTiltCard
              enableEntrance={false}
              maxTilt={3.5}
              glowStrength={0.28}
              className="glass-panel p-5 rounded-2xl border border-white/12 bg-white/[0.06] col-span-2"
            >
              <div className="relative z-20 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {HERO_ATOM_PRESETS.map((preset, idx) => {
                      const isSelected = idx === heroAtomIndex;
                      return (
                        <button
                          key={preset.symbol}
                          type="button"
                          onClick={() => setHeroAtomIndex(idx)}
                          aria-pressed={isSelected}
                          className={`formula-ltr px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                            isSelected
                              ? 'theme-grad-btn text-white'
                              : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/12 hover:text-white'
                          }`}
                        >
                          {preset.symbol}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentAtom.symbol}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-400">
                        ذرة {currentAtom.nameAr} التفاعلية · {currentAtom.atomicNumber}
                        {currentAtom.symbol}
                      </div>
                      <div className="font-extrabold text-base text-white">
                        {currentAtom.note}
                      </div>
                      <div className="formula-ltr text-xs font-bold theme-text text-right">
                        {currentAtom.config} · {currentAtom.shells.join(', ')}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => onOpenLabTool('periodic', currentAtom.symbol)}
                    className="pt-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:theme-text transition cursor-pointer group"
                  >
                    <span>استكشف في الجدول الدوري</span>
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  </button>
                </div>

                <div className="shrink-0 text-slate-200">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentAtom.symbol}
                      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.88, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.88, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    >
                      <BohrAtomVisual
                        symbol={currentAtom.symbol}
                        atomicNumber={currentAtom.atomicNumber}
                        shells={currentAtom.shells}
                        size={126}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </InteractiveTiltCard>

            {/* Progress KPI Card */}
            <InteractiveTiltCard
              enableEntrance={false}
              maxTilt={5}
              glowStrength={0.25}
              className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/12 bg-white/[0.06]"
            >
              <div className="relative z-20">
                <div className="text-xs font-bold text-slate-400">{home.lessonsCountLabel}</div>
                <div className="text-2xl font-black theme-text mt-1 tabular-nums">
                  {completedLessonsCount} / {totalLessons}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={prefersReducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.04, progressPct / 100) }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'right center' }}
                    className="h-full w-full rounded-full theme-grad-btn"
                  />
                </div>
              </div>
            </InteractiveTiltCard>

            {/* Quiz Bank KPI Card */}
            <InteractiveTiltCard
              enableEntrance={false}
              maxTilt={5}
              glowStrength={0.25}
              className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/12 bg-white/[0.06]"
            >
              <div className="relative z-20">
                <div className="text-xs font-bold text-slate-400">{home.questionsCountLabel}</div>
                <div className="text-2xl font-black theme-text mt-1 tabular-nums">
                  {quiz.questions.length} سؤال
                </div>
                <div className="text-xs text-slate-400 mt-1 tabular-nums">
                  {bestQuizScore !== null
                    ? `أعلى نتيجة: ${bestQuizScore}%`
                    : `البطاقات: ${masteredCardsCount}/${studio.flashcards.length}`}
                </div>
              </div>
            </InteractiveTiltCard>

            {/* Above-the-Fold Interactive Preparation & Design Signature Panel */}
            <InteractiveTiltCard
              enableEntrance={false}
              maxTilt={3}
              glowStrength={0.24}
              className="glass-panel p-4 rounded-2xl border border-white/14 bg-white/[0.05] col-span-2"
            >
              <div className="relative z-20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-200">
                    {home.creditsCardTitle} والتواصل
                  </span>
                  <button
                    type="button"
                    onClick={handleScrollToCredits}
                    className="inline-flex items-center gap-1 text-[11px] font-bold theme-text hover:underline cursor-pointer"
                  >
                    <span>بطاقة الفريق</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {brand.creators.map((creator) => {
                    const isCopied = heroCopiedId === creator.id;
                    return (
                      <div
                        key={creator.id}
                        className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5 flex items-center justify-between gap-2 hover:border-white/25 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold theme-text">
                            {creator.id === 'author' ? 'إعداد علمي' : 'تصميم وتطوير'}
                          </div>
                          <div className="text-xs font-extrabold text-white truncate">
                            {creator.name}
                          </div>
                          <a
                            href={creator.telHref}
                            className="formula-ltr inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition mt-0.5"
                          >
                            <Phone className="w-3 h-3 theme-text shrink-0" />
                            <span>{creator.phone}</span>
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickCopyHeroPhone(creator.id, creator.name, creator.phone)
                          }
                          aria-label={`نسخ رقم ${creator.name}`}
                          className="w-8 h-8 rounded-lg border border-white/12 bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-200 transition shrink-0 cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </InteractiveTiltCard>
          </div>
        </div>
      </div>

      {/* Animated Kinetic Prestige Marquee Ribbon */}
      <div className="border-y border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.02] py-3 overflow-hidden">
        <div className="ticker-track gap-8 text-sm font-bold text-slate-700 dark:text-slate-300">
          {home.marqueeItems.map((item, idx) => (
            <span key={`m1-${idx}`} className="whitespace-nowrap">
              {item}
            </span>
          ))}
          {home.marqueeItems.map((item, idx) => (
            <span key={`m2-${idx}`} aria-hidden="true" className="whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Interactive Home Content */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Creative Preparation & Design Showcase */}
        <HomeCreditsShowcase onNotify={onNotify} />

        {/* Interactive Scientific Tools Grid */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black aurora-text">
                أدوات الأكاديمية التفاعلية
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                أدوات علمية حقيقية جاهزة للاستخدام المباشر أثناء المذاكرة والمراجعة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quickTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <InteractiveTiltCard
                  key={tool.title}
                  delay={idx * 0.05}
                  maxTilt={4.5}
                  glowStrength={0.22}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-[var(--p-primary)]/45 shadow-sm dark:shadow-none transition-colors group"
                >
                  <button
                    type="button"
                    onClick={tool.onClick}
                    className="relative z-20 w-full h-full text-right p-6 flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="w-11 h-11 rounded-xl theme-bg-soft flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <Icon className="w-5 h-5 theme-text" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold theme-text">
                      <span>افتح الأداة</span>
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1.5" />
                    </div>
                  </button>
                </InteractiveTiltCard>
              );
            })}
          </div>
        </div>

        {/* Visual Curriculum Units Showcase */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black aurora-text">
                الأبواب الدراسية المصوّرة
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                اختر أي باب للانتقال مباشرة إلى الشرح التفصيلي والمعادلات والتدريب السريع
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => onSwitchView('lessons')}
              whileHover={prefersReducedMotion ? undefined : { x: -3 }}
              className="inline-flex items-center gap-1.5 text-sm font-bold theme-text hover:underline cursor-pointer"
            >
              <span>عرض جميع الدروس ({totalLessons})</span>
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {unitSpotlights.map((unit, idx) => (
              <InteractiveTiltCard
                key={unit.id}
                delay={idx * 0.08}
                maxTilt={4}
                glowStrength={0.2}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-[var(--p-primary)]/45 shadow-sm dark:shadow-none transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => onJumpToLesson(unit.lessonId)}
                  className="relative z-20 w-full h-full text-right flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={unit.image}
                      alt={unit.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-xs font-bold theme-text">{unit.kicker}</div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-snug">
                        {unit.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {unit.summary}
                      </p>
                    </div>
                    <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:theme-text">
                      <Layers className="w-3.5 h-3.5" />
                      <span>دخول الباب الدراسي</span>
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1.5" />
                    </div>
                  </div>
                </button>
              </InteractiveTiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
