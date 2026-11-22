import { useMemo, useState } from 'react';
import {
  Atom,
  Calculator,
  CheckCircle2,
  Droplets,
  Flame,
  FlaskConical,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ACADEMY_DATA } from '../data/academyData';
import {
  ELEMENT_CATEGORY_META,
  PERIODIC_ELEMENTS,
  type ElementCategory,
  type PeriodicElement,
} from '../data/periodicTableData';
import {
  calculateDaniellCellEMF,
  calculateMolarMass,
  calculateTitrationPH,
  checkEquationBalance,
} from '../utils/chemistryEngine';
import { BohrAtomVisual } from './BohrAtomVisual';

export type LabToolTab = 'experiments' | 'periodic' | 'molar' | 'balancer';
type ExperimentId = 'titration' | 'daniell' | 'lechatelier' | 'iron-test';

interface LabViewProps {
  active: boolean;
  activeTool: LabToolTab;
  selectedElementSymbol: string;
  onSelectTool: (tool: LabToolTab) => void;
  onSelectElementSymbol: (symbol: string) => void;
  onNotify: (msg: string) => void;
}

const LAB_TOOLS: ReadonlyArray<{ id: LabToolTab; label: string; icon: typeof FlaskConical }> = [
  { id: 'experiments', label: 'محاكاة التفاعلات والمعايرة', icon: FlaskConical },
  { id: 'periodic', label: 'الجدول الدوري الذري', icon: Atom },
  { id: 'molar', label: 'حاسبة الكتلة المولية', icon: Calculator },
  { id: 'balancer', label: 'موازن المعادلات', icon: Scale },
];

export function LabView({
  active,
  activeTool,
  selectedElementSymbol,
  onSelectTool,
  onSelectElementSymbol,
  onNotify,
}: LabViewProps) {
  const { heading, subheading, equations } = ACADEMY_DATA.lab;

  // --- Experiment 1: Acid-Base Titration ---
  const [experiment, setExperiment] = useState<ExperimentId>('titration');
  const [baseVolumeMl, setBaseVolumeMl] = useState(12);
  const [indicator, setIndicator] = useState<'phenolphthalein' | 'methyl-orange'>('phenolphthalein');

  // --- Experiment 2: Daniell Cell ---
  const [znConc, setZnConc] = useState(1.0);
  const [cuConc, setCuConc] = useState(1.0);
  const [cellTempC, setCellTempC] = useState(25);

  // --- Experiment 3: Le Chatelier ---
  const [eqTemp, setEqTemp] = useState(450);
  const [eqPressure, setEqPressure] = useState(200);

  // --- Experiment 4: Iron Cation Precipitation ---
  const [ironSample, setIronSample] = useState<'fe2' | 'fe3'>('fe2');
  const [naohAdded, setNaohAdded] = useState(false);

  // --- Periodic Table State ---
  const [elSearch, setElSearch] = useState('');
  const [elCategory, setElCategory] = useState<ElementCategory | 'all'>('all');

  // --- Molar Mass Calculator State ---
  const [formulaInput, setFormulaInput] = useState('H2SO4');
  const [sampleGrams, setSampleGrams] = useState('98.08');

  // --- Equation Balancer State ---
  const [eqId, setEqId] = useState(equations[0].id);
  const activeEquation = useMemo(
    () => equations.find((e) => e.id === eqId) ?? equations[0],
    [eqId, equations]
  );
  const [coeffs, setCoeffs] = useState<number[]>(() => activeEquation.species.map(() => 1));

  const switchEquation = (nextId: string) => {
    const found = equations.find((e) => e.id === nextId) ?? equations[0];
    setEqId(found.id);
    setCoeffs(found.species.map(() => 1));
  };

  // Calculations
  const currentPH = calculateTitrationPH(baseVolumeMl);
  const titrationLiquidColor = useMemo(() => {
    if (indicator === 'phenolphthalein') {
      if (currentPH < 8.2) return 'rgba(186, 230, 253, 0.35)';
      if (currentPH < 9.5) return 'rgba(244, 114, 182, 0.55)';
      return 'rgba(219, 39, 119, 0.78)';
    }
    if (currentPH < 3.1) return 'rgba(239, 68, 68, 0.72)';
    if (currentPH < 4.4) return 'rgba(249, 115, 22, 0.72)';
    return 'rgba(250, 204, 21, 0.75)';
  }, [currentPH, indicator]);

  const titrationCurvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let v = 0; v <= 50; v += 1) {
      const ph = calculateTitrationPH(v);
      const x = 36 + (v / 50) * 244;
      const y = 162 - (ph / 14) * 140;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  const currentEmf = calculateDaniellCellEMF(znConc, cuConc, cellTempC);

  // Le Chatelier NH3 yield estimate (exothermic, 4 mol gas -> 2 mol gas)
  const nh3YieldPct = useMemo(() => {
    const tempFactor = Math.max(8, 72 - ((eqTemp - 300) / 350) * 52);
    const pressFactor = Math.min(24, (eqPressure / 400) * 24);
    return Math.round(Math.min(92, Math.max(10, tempFactor + pressFactor)));
  }, [eqTemp, eqPressure]);

  const selectedElement: PeriodicElement =
    PERIODIC_ELEMENTS.find((el) => el.symbol === selectedElementSymbol) ??
    PERIODIC_ELEMENTS.find((el) => el.symbol === 'Fe') ??
    PERIODIC_ELEMENTS[0];

  const filteredElements = useMemo(() => {
    const q = elSearch.trim().toLowerCase();
    return PERIODIC_ELEMENTS.filter((el) => {
      const matchesCat = elCategory === 'all' || el.category === elCategory;
      const matchesQ =
        !q ||
        el.nameAr.includes(q) ||
        el.symbol.toLowerCase().includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        String(el.number) === q;
      return matchesCat && matchesQ;
    });
  }, [elCategory, elSearch]);

  const molarResult = useMemo(() => calculateMolarMass(formulaInput), [formulaInput]);
  const parsedGrams = Number.parseFloat(sampleGrams);
  const computedMoles =
    molarResult.valid && Number.isFinite(parsedGrams) && parsedGrams >= 0
      ? parsedGrams / molarResult.molarMass
      : null;

  const balanceCheck = useMemo(
    () => checkEquationBalance(activeEquation.species, coeffs),
    [activeEquation.species, coeffs]
  );

  const updateCoeff = (idx: number, delta: number) => {
    setCoeffs((prev) =>
      prev.map((c, i) => (i === idx ? Math.max(1, Math.min(12, c + delta)) : c))
    );
  };

  return (
    <section
      id="view-lab"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-black aurora-text">{heading}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subheading}</p>
      </div>

      {/* Segmented Lab Tool Selector */}
      <div
        role="tablist"
        aria-label="أدوات المختبر التفاعلي"
        className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10"
      >
        {LAB_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectTool(tool.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'theme-grad-btn text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TOOL 1: VIRTUAL EXPERIMENTS & TITRATION SIMULATOR                  */}
      {/* ================================================================= */}
      {activeTool === 'experiments' && (
        <div className="space-y-5">
          {/* Experiment Switcher */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'titration', title: 'معايرة حمض وقاعدة', sub: 'HCl + NaOH · منحنى pH' },
              { id: 'daniell', title: 'خلية دانيال الجلفانية', sub: 'Zn | Zn²⁺ || Cu²⁺ | Cu' },
              { id: 'lechatelier', title: 'قاعدة لوشاتلييه', sub: 'N₂ + 3H₂ ⇌ 2NH₃' },
              { id: 'iron-test', title: 'الكشف عن الحديد', sub: 'Fe²⁺ / Fe³⁺ + NaOH' },
            ].map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  setExperiment(exp.id as ExperimentId);
                  setNaohAdded(false);
                }}
                className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                  experiment === exp.id
                    ? 'theme-border theme-bg-soft'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/25'
                }`}
              >
                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {exp.title}
                </div>
                <div className="formula-ltr text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                  {exp.sub}
                </div>
              </button>
            ))}
          </div>

          {/* Two-Zone Sandbox Stage */}
          {experiment === 'titration' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Visual Stage (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Animated Glassware SVG */}
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 220 260" className="w-52 h-60 overflow-visible">
                    {/* Burette */}
                    <rect
                      x="98"
                      y="10"
                      width="24"
                      height="96"
                      rx="4"
                      fill="rgba(148,163,184,0.12)"
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeWidth="2"
                    />
                    {/* Burette Liquid */}
                    <rect
                      x="101"
                      y={16 + (baseVolumeMl / 50) * 78}
                      width="18"
                      height={Math.max(4, 84 - (baseVolumeMl / 50) * 78)}
                      fill="var(--p-secondary)"
                      fillOpacity="0.55"
                    />
                    {/* Stopcock & Tip */}
                    <path d="M106 106 L114 106 L111 124 L109 124 Z" fill="currentColor" fillOpacity="0.45" />
                    <rect x="92" y="109" width="36" height="5" rx="2.5" fill="var(--p-primary)" />

                    {/* Animated Droplet when adding NaOH */}
                    {baseVolumeMl > 0 && baseVolumeMl < 50 && (
                      <circle cx="110" cy="128" r="3.5" fill="var(--p-secondary)" className="drop-fall" />
                    )}

                    {/* Erlenmeyer Flask */}
                    <path
                      d="M95 148 L125 148 L125 170 L166 234 Q172 246 158 246 L62 246 Q48 246 54 234 L95 170 Z"
                      fill="rgba(148,163,184,0.08)"
                      stroke="currentColor"
                      strokeOpacity="0.45"
                      strokeWidth="2.4"
                    />
                    {/* Solution Inside Flask */}
                    <path
                      d="M78 198 L142 198 L163 234 Q168 243 156 243 L64 243 Q52 243 57 234 Z"
                      fill={titrationLiquidColor}
                      style={{ transition: 'fill 300ms ease' }}
                    />
                    {/* Subtle Bubbles */}
                    <circle cx="96" cy="232" r="2.5" fill="#ffffff" fillOpacity="0.6" className="bubble-rise" />
                    <circle
                      cx="124"
                      cy="236"
                      r="2"
                      fill="#ffffff"
                      fillOpacity="0.5"
                      className="bubble-rise"
                      style={{ animationDelay: '0.8s' }}
                    />
                  </svg>
                  <div className="formula-ltr text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    25 mL HCl (0.1 M) + <span className="theme-text">{baseVolumeMl} mL</span> NaOH
                  </div>
                </div>

                {/* Live pH Curve SVG */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    منحنى المعايرة الحي (pH مقابل حجم NaOH)
                  </div>
                  <svg viewBox="0 0 300 190" className="w-full h-48 bg-slate-100/80 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/10">
                    {/* Grid lines */}
                    <line x1="36" y1="92" x2="280" y2="92" stroke="currentColor" strokeOpacity="0.16" strokeDasharray="4 4" />
                    <line x1="158" y1="22" x2="158" y2="162" stroke="var(--p-primary)" strokeOpacity="0.3" strokeDasharray="3 3" />
                    {/* Axes */}
                    <line x1="36" y1="22" x2="36" y2="162" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
                    <line x1="36" y1="162" x2="280" y2="162" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
                    <text x="12" y="28" fontSize="9" fill="currentColor" opacity="0.65">14</text>
                    <text x="18" y="95" fontSize="9" fill="currentColor" opacity="0.65">7</text>
                    <text x="18" y="164" fontSize="9" fill="currentColor" opacity="0.65">0</text>
                    <text x="148" y="178" fontSize="9" fill="currentColor" opacity="0.7">25 mL</text>

                    {/* Titration Polyline */}
                    <polyline
                      fill="none"
                      stroke="var(--p-secondary)"
                      strokeWidth="2.5"
                      points={titrationCurvePoints}
                    />
                    {/* Current Point Marker */}
                    <circle
                      cx={36 + (baseVolumeMl / 50) * 244}
                      cy={162 - (currentPH / 14) * 140}
                      r="5.5"
                      fill="var(--p-primary)"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">نقطة التكافؤ: 25.0 mL</span>
                    <span className="formula-ltr theme-text">pH = {currentPH.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Control Deck (5 cols) */}
              <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                      لوحة التحكم في المعايرة
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      اسحب المؤشر لإضافة القاعدة من السحاحة وراقب القفزة المفاجئة عند التعادل
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <label htmlFor="titration-vol-slider">حجم NaOH المضاف (0.1 M)</label>
                      <span className="formula-ltr theme-text tabular-nums">{baseVolumeMl} mL</span>
                    </div>
                    <input
                      id="titration-vol-slider"
                      type="range"
                      min={0}
                      max={50}
                      step={0.5}
                      value={baseVolumeMl}
                      onChange={(e) => setBaseVolumeMl(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 formula-ltr">
                      <span>0 mL</span>
                      <span>25 mL (التعادل)</span>
                      <span>50 mL</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      اختر الدليل الكيميائي (Indicator)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIndicator('phenolphthalein')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          indicator === 'phenolphthalein'
                            ? 'theme-border theme-bg-soft theme-text'
                            : 'border-slate-200 dark:border-white/15'
                        }`}
                      >
                        فينولفثالين
                      </button>
                      <button
                        type="button"
                        onClick={() => setIndicator('methyl-orange')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          indicator === 'methyl-orange'
                            ? 'theme-border theme-bg-soft theme-text'
                            : 'border-slate-200 dark:border-white/15'
                        }`}
                      >
                        ميثيل برتقالي
                      </button>
                    </div>
                  </div>

                  {/* Live State Annotation */}
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-slate-500 dark:text-slate-400">حالة الوسط الآن:</span>
                      <span className="theme-text">
                        {currentPH < 6.8
                          ? 'وسط حامضي (Acidic)'
                          : currentPH > 7.2
                            ? 'وسط قلوي (Alkaline)'
                            : 'نقطة التعادل التام (Neutral)'}
                      </span>
                    </div>
                    <div className="formula-ltr text-xs text-slate-700 dark:text-slate-300">
                      HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBaseVolumeMl(25)}
                    className="flex-1 theme-grad-btn py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                  >
                    القفز لنقطة التكافؤ (25 mL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseVolumeMl(0)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {experiment === 'daniell' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] flex flex-col items-center justify-center">
                <svg viewBox="0 0 420 230" className="w-full max-w-lg overflow-visible">
                  {/* External Wire with Animated Electron Flow */}
                  <path
                    d="M95 70 L95 24 L325 24 L325 70"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.35"
                    strokeWidth="3"
                  />
                  <path
                    d="M95 70 L95 24 L325 24 L325 70"
                    fill="none"
                    stroke="var(--p-secondary)"
                    strokeWidth="3"
                    strokeDasharray="6 12"
                    className="electron-flow"
                  />
                  {/* Voltmeter Box */}
                  <rect
                    x="170"
                    y="6"
                    width="80"
                    height="36"
                    rx="10"
                    fill="var(--p-bg-dark)"
                    stroke="var(--p-primary)"
                    strokeWidth="2"
                  />
                  <text
                    x="210"
                    y="28"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {currentEmf.toFixed(3)} V
                  </text>

                  {/* Left Beaker (Zn Anode) */}
                  <rect x="42" y="102" width="110" height="106" rx="10" fill="rgba(148,163,184,0.12)" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
                  <rect x="46" y="138" width="102" height="66" rx="6" fill="rgba(148,163,184,0.28)" />
                  <rect x="82" y="70" width="26" height="118" rx="4" fill="#94a3b8" />
                  <text x="95" y="128" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="900">Zn (-)</text>

                  {/* Right Beaker (Cu Cathode) */}
                  <rect x="268" y="102" width="110" height="106" rx="10" fill="rgba(148,163,184,0.12)" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
                  <rect x="272" y="138" width="102" height="66" rx="6" fill="rgba(14,165,233,0.45)" />
                  <rect x="312" y="70" width="26" height="118" rx="4" fill="#d97706" />
                  <text x="325" y="128" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">Cu (+)</text>

                  {/* Salt Bridge */}
                  <path
                    d="M132 162 L132 82 Q132 64 150 64 L270 64 Q288 64 288 82 L288 162"
                    fill="none"
                    stroke="rgba(226,232,240,0.65)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <text x="210" y="68" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="800">
                    قنطرة ملحية Na₂SO₄
                  </text>
                </svg>
                <div className="formula-ltr text-xs font-bold theme-text mt-2">
                  Zn(s) | Zn²⁺ ({znConc} M) || Cu²⁺ ({cuConc} M) | Cu(s)
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5">
                <div className="flex items-center gap-2 font-extrabold text-lg">
                  <Zap className="w-5 h-5 theme-text" />
                  <span>معادلة نرنست الحية لخلية دانيال</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <label htmlFor="zn-slider">تركيز أيونات الخارصين [Zn²⁺]</label>
                      <span className="formula-ltr theme-text">{znConc.toFixed(2)} M</span>
                    </div>
                    <input
                      id="zn-slider"
                      type="range"
                      min={0.05}
                      max={2.0}
                      step={0.05}
                      value={znConc}
                      onChange={(e) => setZnConc(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <label htmlFor="cu-slider">تركيز أيونات النحاس [Cu²⁺]</label>
                      <span className="formula-ltr theme-text">{cuConc.toFixed(2)} M</span>
                    </div>
                    <input
                      id="cu-slider"
                      type="range"
                      min={0.05}
                      max={2.0}
                      step={0.05}
                      value={cuConc}
                      onChange={(e) => setCuConc(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <label htmlFor="cell-temp-slider">درجة الحرارة (°C)</label>
                      <span className="formula-ltr theme-text">{cellTempC} °C</span>
                    </div>
                    <input
                      id="cell-temp-slider"
                      type="range"
                      min={5}
                      max={80}
                      step={1}
                      value={cellTempC}
                      onChange={(e) => setCellTempC(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 space-y-1 text-xs">
                  <div className="font-bold text-slate-600 dark:text-slate-400">القوة الدافعة الكهربية (EMF):</div>
                  <div className="formula-ltr text-2xl font-black theme-text">{currentEmf.toFixed(3)} V</div>
                  <div className="text-slate-500 dark:text-slate-400">
                    زيادة تركيز [Cu²⁺] أو خفض [Zn²⁺] يرفع جهد الخلية عن القيمة القياسية (+1.10 V).
                  </div>
                </div>
              </div>
            </div>
          )}

          {experiment === 'lechatelier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-base">مفاعل هابر - بوش (إنتاج النشادر)</div>
                  <code className="formula-ltr text-xs font-bold theme-text">
                    N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + Heat
                  </code>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>نسبة تكوين غاز النشادر (NH₃ Yield)</span>
                    <span className="formula-ltr text-xl font-black theme-text">{nh3YieldPct}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full theme-grad-btn transition-all duration-300"
                      style={{ width: `${nh3YieldPct}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-sm">
                  <span className="font-extrabold theme-text ml-2">اتجاه إزاحة الاتزان:</span>
                  {nh3YieldPct >= 55
                    ? 'ينشط التفاعل في الاتجاه الطردي (← تكوين مزيد من NH₃) بسبب انخفاض الحرارة أو ارتفاع الضغط.'
                    : 'ينشط التفاعل في الاتجاه العكسي (→ تفكك NH₃) بسبب ارتفاع درجة الحرارة في تفاعل طارد.'}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5">
                <div className="flex items-center gap-2 font-extrabold text-base">
                  <Flame className="w-5 h-5 theme-text" />
                  <span>التحكم في شروط الاتزان</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <label htmlFor="eq-temp-slider">درجة الحرارة (°C)</label>
                    <span className="formula-ltr theme-text">{eqTemp} °C</span>
                  </div>
                  <input
                    id="eq-temp-slider"
                    type="range"
                    min={300}
                    max={650}
                    step={10}
                    value={eqTemp}
                    onChange={(e) => setEqTemp(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <label htmlFor="eq-press-slider">الضغط (atm)</label>
                    <span className="formula-ltr theme-text">{eqPressure} atm</span>
                  </div>
                  <input
                    id="eq-press-slider"
                    type="range"
                    min={20}
                    max={400}
                    step={10}
                    value={eqPressure}
                    onChange={(e) => setEqPressure(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {experiment === 'iron-test' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] flex flex-col items-center gap-3">
                <svg viewBox="0 0 180 220" className="w-44 h-52">
                  {/* Test Tube */}
                  <path
                    d="M65 20 L115 20 L115 168 A25 25 0 0 1 65 168 Z"
                    fill="rgba(148,163,184,0.1)"
                    stroke="currentColor"
                    strokeOpacity="0.45"
                    strokeWidth="2.5"
                  />
                  {/* Initial Salt Solution */}
                  <path
                    d="M68 95 L112 95 L112 168 A22 22 0 0 1 68 168 Z"
                    fill={ironSample === 'fe2' ? 'rgba(134, 239, 172, 0.35)' : 'rgba(251, 191, 36, 0.42)'}
                  />
                  {/* Precipitate Layer when NaOH is added */}
                  {naohAdded && (
                    <path
                      d="M68 152 Q90 144 112 152 L112 168 A22 22 0 0 1 68 168 Z"
                      fill={ironSample === 'fe2' ? '#86efac' : '#9a3412'}
                    />
                  )}
                </svg>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {naohAdded
                    ? ironSample === 'fe2'
                      ? 'تكوّن راسب أبيض مخضر من Fe(OH)₂'
                      : 'تكوّن راسب بني محمر جيلاتيني من Fe(OH)₃'
                    : 'اختر العينة ثم أضف قطرات هيدروكسيد الصوديوم NaOH'}
                </div>
              </div>

              <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4">
                <h3 className="font-extrabold text-lg">تجربة التمييز بين أملاح الحديد II و III</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIronSample('fe2');
                      setNaohAdded(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer ${
                      ironSample === 'fe2'
                        ? 'theme-border theme-bg-soft theme-text'
                        : 'border-slate-200 dark:border-white/15'
                    }`}
                  >
                    محلول كبريتات الحديد II (FeSO₄)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIronSample('fe3');
                      setNaohAdded(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer ${
                      ironSample === 'fe3'
                        ? 'theme-border theme-bg-soft theme-text'
                        : 'border-slate-200 dark:border-white/15'
                    }`}
                  >
                    محلول كلوريد الحديد III (FeCl₃)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNaohAdded(true)}
                  className="theme-grad-btn w-full py-3 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Droplets className="w-4 h-4" />
                  <span>إضافة محلول هيدروكسيد الصوديوم (NaOH)</span>
                </button>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 formula-ltr text-xs font-bold text-slate-800 dark:text-cyan-300">
                  {ironSample === 'fe2'
                    ? 'FeSO₄(aq) + 2NaOH(aq) → Na₂SO₄(aq) + Fe(OH)₂↓'
                    : 'FeCl₃(aq) + 3NaOH(aq) → 3NaCl(aq) + Fe(OH)₃↓'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 2: INTERACTIVE PERIODIC TABLE & LIVE BOHR ATOM INSPECTOR      */}
      {/* ================================================================= */}
      {activeTool === 'periodic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={elSearch}
                  onChange={(e) => setElSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الرمز أو العدد الذري (مثل Fe أو 26)..."
                  aria-label="بحث في الجدول الدوري"
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm"
                />
              </div>
              <select
                aria-label="تصفية حسب عائلة العنصر"
                value={elCategory}
                onChange={(e) => setElCategory(e.target.value as ElementCategory | 'all')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
              >
                <option value="all">جميع العائلات</option>
                {Object.entries(ELEMENT_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {filteredElements.map((el) => {
                const meta = ELEMENT_CATEGORY_META[el.category];
                const isSelected = el.symbol === selectedElement.symbol;
                return (
                  <button
                    key={el.symbol}
                    type="button"
                    onClick={() => onSelectElementSymbol(el.symbol)}
                    className={`p-3 rounded-xl border text-center transition-transform hover:-translate-y-0.5 cursor-pointer ${
                      isSelected
                        ? 'theme-border ring-2 ring-cyan-400/40 bg-white dark:bg-white/10 text-slate-900 dark:text-white'
                        : meta.colorClass
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                      <span>{el.number}</span>
                      <span>{el.mass.toFixed(1)}</span>
                    </div>
                    <div className="font-mono text-xl font-black my-0.5">{el.symbol}</div>
                    <div className="text-[11px] font-bold truncate">{el.nameAr}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Bohr Atomic Model Inspector */}
          <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold theme-text">
                  {ELEMENT_CATEGORY_META[selectedElement.category].labelAr}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedElement.nameAr}{' '}
                  <span className="formula-ltr text-lg text-slate-500">({selectedElement.symbol})</span>
                </h3>
                <div className="text-xs text-slate-500">{selectedElement.nameEn}</div>
              </div>
              <div className="formula-ltr text-2xl font-black theme-text tabular-nums">
                {selectedElement.number}
              </div>
            </div>

            <div className="py-2 text-slate-700 dark:text-slate-200">
              <BohrAtomVisual
                symbol={selectedElement.symbol}
                atomicNumber={selectedElement.number}
                shells={selectedElement.shells}
                size={210}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                <div className="text-slate-500 dark:text-slate-400">التوزيع الإلكتروني</div>
                <div className="formula-ltr font-bold theme-text mt-0.5">{selectedElement.config}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                <div className="text-slate-500 dark:text-slate-400">الكتلة الذرية</div>
                <div className="formula-ltr font-bold mt-0.5">{selectedElement.mass} u</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                <div className="text-slate-500 dark:text-slate-400">السالبية الكهربية</div>
                <div className="formula-ltr font-bold mt-0.5">
                  {selectedElement.electronegativity ?? 'خامل'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                <div className="text-slate-500 dark:text-slate-400">الحالة الفيزيائية</div>
                <div className="font-bold mt-0.5">{selectedElement.stateAr}</div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-white/10 pt-3">
              {selectedElement.highlightAr}
            </p>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 3: REAL CHEMICAL FORMULA PARSER & MOLAR MASS CALCULATOR       */}
      {/* ================================================================= */}
      {activeTool === 'molar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5">
            <div>
              <h3 className="font-extrabold text-lg">حاسبة الكتلة المولية وعدد المولات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                أدخل أي صيغة كيميائية مع دعم كامل للأقواس المتداخلة مثل Fe2(SO4)3
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="molar-formula-input" className="text-xs font-bold block">
                الصيغة الكيميائية
              </label>
              <input
                id="molar-formula-input"
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="مثال: H2SO4 أو Ca(OH)2"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/70 formula-ltr text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['H2SO4', 'Ca(OH)2', 'KMnO4', 'C6H12O6', 'Fe2(SO4)3', 'Na2CO3'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormulaInput(preset)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 hover:theme-border formula-ltr text-xs font-bold cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-white/10 pt-4">
              <label htmlFor="sample-grams-input" className="text-xs font-bold block">
                كتلة العينة بالجرام (g) لحساب عدد المولات والجزيئات
              </label>
              <input
                id="sample-grams-input"
                type="number"
                min={0}
                step="0.1"
                value={sampleGrams}
                onChange={(e) => setSampleGrams(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/70 formula-ltr text-sm font-bold"
              />
            </div>
          </div>

          <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-5">
            {!molarResult.valid ? (
              <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm font-bold text-rose-700 dark:text-rose-300">
                {molarResult.error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <div className="text-xs text-slate-500 dark:text-slate-400">الكتلة المولية (M)</div>
                    <div className="formula-ltr text-2xl font-black theme-text mt-1 tabular-nums">
                      {molarResult.molarMass.toFixed(2)} <span className="text-xs">g/mol</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <div className="text-xs text-slate-500 dark:text-slate-400">عدد المولات (n)</div>
                    <div className="formula-ltr text-2xl font-black mt-1 tabular-nums">
                      {computedMoles !== null ? computedMoles.toFixed(3) : '—'}{' '}
                      <span className="text-xs">mol</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <div className="text-xs text-slate-500 dark:text-slate-400">عدد الجزيئات (N)</div>
                    <div className="formula-ltr text-lg font-black mt-1.5 tabular-nums">
                      {computedMoles !== null
                        ? `${(computedMoles * 6.022).toFixed(2)}×10²³`
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm">التحليل النسبي الكتلي للعناصر</h4>
                  {molarResult.breakdown.map((row) => (
                    <div key={row.symbol} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>
                          {row.nameAr} (<span className="formula-ltr">{row.symbol}</span> × {row.count})
                        </span>
                        <span className="formula-ltr tabular-nums">
                          {row.subtotalMass.toFixed(2)} g ({row.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full theme-grad-btn"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 4: INTERACTIVE CHEMICAL EQUATION BALANCER                     */}
      {/* ================================================================= */}
      {activeTool === 'balancer' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {equations.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => switchEquation(eq.id)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  eq.id === activeEquation.id
                    ? 'theme-border theme-bg-soft theme-text'
                    : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/5'
                }`}
              >
                {eq.title}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold theme-text">{activeEquation.category}</div>
                <h3 className="text-xl font-black mt-0.5">{activeEquation.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCoeffs([...activeEquation.solution]);
                    onNotify('تمت موازنة المعادلة الكيميائية بنجاح!');
                  }}
                  className="theme-grad-btn px-4 py-2 rounded-xl text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>موازنة تلقائية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoeffs(activeEquation.species.map(() => 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold cursor-pointer"
                >
                  تصفير
                </button>
              </div>
            </div>

            {/* Interactive Stoichiometric Equation Row */}
            <div className="formula-ltr flex flex-wrap items-center justify-center gap-3 p-6 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
              {activeEquation.species.map((sp, idx) => {
                const prevSide = idx > 0 ? activeEquation.species[idx - 1].side : sp.side;
                const showArrow = idx > 0 && prevSide === 'reactant' && sp.side === 'product';
                const showPlus = idx > 0 && prevSide === sp.side;

                return (
                  <div key={`${sp.formula}-${idx}`} className="flex items-center gap-3">
                    {showPlus && <span className="text-xl font-black text-slate-400">+</span>}
                    {showArrow && <span className="text-2xl font-black theme-text px-2">→</span>}

                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15">
                      <button
                        type="button"
                        onClick={() => updateCoeff(idx, -1)}
                        aria-label={`إنقاص معامل ${sp.formula}`}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-lg font-black theme-text tabular-nums">
                        {coeffs[idx]}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCoeff(idx, 1)}
                        aria-label={`زيادة معامل ${sp.formula}`}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 pl-1">
                        {sp.formula}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Atom Balance Verification Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {balanceCheck.elements.map((el) => (
                <div
                  key={el.symbol}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    el.matched
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-amber-500/40 bg-amber-500/10'
                  }`}
                >
                  <span className="formula-ltr font-black text-lg">{el.symbol}</span>
                  <span className="text-xs font-bold tabular-nums">
                    المتفاعلات: {el.left} · النواتج: {el.right}
                  </span>
                  <span className="text-xs font-extrabold">
                    {el.matched ? 'متزن ✓' : 'غير متزن'}
                  </span>
                </div>
              ))}
            </div>

            {balanceCheck.balanced && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>المعادلة متزنة تماماً! {activeEquation.note}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
