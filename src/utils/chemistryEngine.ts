export interface AtomicWeightMap {
  [symbol: string]: { nameAr: string; weight: number };
}

export const ATOMIC_WEIGHTS: AtomicWeightMap = {
  H: { nameAr: 'هيدروجين', weight: 1.008 },
  He: { nameAr: 'هيليوم', weight: 4.0026 },
  Li: { nameAr: 'ليثيوم', weight: 6.94 },
  Be: { nameAr: 'بيريليوم', weight: 9.0122 },
  B: { nameAr: 'بورون', weight: 10.81 },
  C: { nameAr: 'كربون', weight: 12.011 },
  N: { nameAr: 'نيتروجين', weight: 14.007 },
  O: { nameAr: 'أكسجين', weight: 15.999 },
  F: { nameAr: 'فلور', weight: 18.998 },
  Ne: { nameAr: 'نيون', weight: 20.18 },
  Na: { nameAr: 'صوديوم', weight: 22.99 },
  Mg: { nameAr: 'ماغنيسيوم', weight: 24.305 },
  Al: { nameAr: 'ألومنيوم', weight: 26.982 },
  Si: { nameAr: 'سيليكون', weight: 28.085 },
  P: { nameAr: 'فوسفور', weight: 30.974 },
  S: { nameAr: 'كبريت', weight: 32.06 },
  Cl: { nameAr: 'كلور', weight: 35.45 },
  Ar: { nameAr: 'أرجون', weight: 39.948 },
  K: { nameAr: 'بوتاسيوم', weight: 39.098 },
  Ca: { nameAr: 'كالسيوم', weight: 40.078 },
  Sc: { nameAr: 'سكانديوم', weight: 44.956 },
  Ti: { nameAr: 'تيتانيوم', weight: 47.867 },
  V: { nameAr: 'فاناديوم', weight: 50.942 },
  Cr: { nameAr: 'كروم', weight: 51.996 },
  Mn: { nameAr: 'منجنيز', weight: 54.938 },
  Fe: { nameAr: 'حديد', weight: 55.845 },
  Co: { nameAr: 'كوبالت', weight: 58.933 },
  Ni: { nameAr: 'نيكل', weight: 58.693 },
  Cu: { nameAr: 'نحاس', weight: 63.546 },
  Zn: { nameAr: 'خارصين', weight: 65.38 },
  Br: { nameAr: 'بروم', weight: 79.904 },
  Ag: { nameAr: 'فضة', weight: 107.868 },
  I: { nameAr: 'يود', weight: 126.904 },
  Ba: { nameAr: 'باريوم', weight: 137.327 },
  Pt: { nameAr: 'بلاتين', weight: 195.084 },
  Au: { nameAr: 'ذهب', weight: 196.967 },
  Hg: { nameAr: 'زئبق', weight: 200.592 },
  Pb: { nameAr: 'رصاص', weight: 207.2 },
};

export interface ElementBreakdown {
  symbol: string;
  nameAr: string;
  count: number;
  atomicWeight: number;
  subtotalMass: number;
  percentage: number;
}

export interface MolarMassResult {
  valid: boolean;
  error?: string;
  formula: string;
  molarMass: number;
  breakdown: ElementBreakdown[];
}

export function parseFormulaCounts(rawFormula: string): {
  counts: Record<string, number>;
  error?: string;
} {
  const formula = rawFormula.trim().replace(/\s+/g, '');
  if (!formula) {
    return { counts: {}, error: 'الرجاء إدخال صيغة كيميائية مثل H2SO4 أو Ca(OH)2' };
  }

  let index = 0;

  const parseGroup = (): Record<string, number> | null => {
    const groupCounts: Record<string, number> = {};
    while (index < formula.length) {
      const ch = formula[index];
      if (ch === ')') {
        return groupCounts;
      }
      if (ch === '(') {
        index += 1;
        const inner = parseGroup();
        if (!inner || formula[index] !== ')') {
          return null;
        }
        index += 1;
        const mult = parseNumber();
        for (const [sym, cnt] of Object.entries(inner)) {
          groupCounts[sym] = (groupCounts[sym] || 0) + cnt * mult;
        }
      } else if (/[A-Z]/.test(ch)) {
        let symbol = ch;
        index += 1;
        while (index < formula.length && /[a-z]/.test(formula[index])) {
          symbol += formula[index];
          index += 1;
        }
        if (!ATOMIC_WEIGHTS[symbol]) {
          throw new Error(`العنصر "${symbol}" غير موجود في قاعدة الأوزان الذرية.`);
        }
        const count = parseNumber();
        groupCounts[symbol] = (groupCounts[symbol] || 0) + count;
      } else {
        throw new Error(`رمز غير صالح "${ch}" داخل الصيغة الكيميائية.`);
      }
    }
    return groupCounts;
  };

  const parseNumber = (): number => {
    let digits = '';
    while (index < formula.length && /[0-9]/.test(formula[index])) {
      digits += formula[index];
      index += 1;
    }
    if (!digits) return 1;
    const num = Number.parseInt(digits, 10);
    return Number.isFinite(num) && num > 0 ? num : 1;
  };

  try {
    const counts = parseGroup();
    if (!counts || index !== formula.length || Object.keys(counts).length === 0) {
      return { counts: {}, error: 'تحقق من توازن الأقواس وصحة الصيغة الكيميائية.' };
    }
    return { counts };
  } catch (err) {
    return {
      counts: {},
      error: err instanceof Error ? err.message : 'صيغة كيميائية غير صالحة.',
    };
  }
}

export function calculateMolarMass(formula: string): MolarMassResult {
  const { counts, error } = parseFormulaCounts(formula);
  if (error) {
    return { valid: false, error, formula, molarMass: 0, breakdown: [] };
  }

  let total = 0;
  const rawList = Object.entries(counts).map(([symbol, count]) => {
    const entry = ATOMIC_WEIGHTS[symbol];
    const subtotalMass = entry.weight * count;
    total += subtotalMass;
    return {
      symbol,
      nameAr: entry.nameAr,
      count,
      atomicWeight: entry.weight,
      subtotalMass,
      percentage: 0,
    };
  });

  const breakdown = rawList.map((item) => ({
    ...item,
    subtotalMass: Number(item.subtotalMass.toFixed(3)),
    percentage: total > 0 ? Number(((item.subtotalMass / total) * 100).toFixed(2)) : 0,
  }));

  return {
    valid: true,
    formula: formula.trim(),
    molarMass: Number(total.toFixed(3)),
    breakdown,
  };
}

/**
 * Exact pH calculation for strong acid (HCl) titrated with strong base (NaOH)
 * Default: 25.0 mL of 0.1 M HCl titrated with 0.1 M NaOH (equivalence at 25.0 mL).
 */
export function calculateTitrationPH(
  volumeBaseMl: number,
  acidConc = 0.1,
  acidVolMl = 25,
  baseConc = 0.1
): number {
  const vBase = Math.max(0, volumeBaseMl);
  const totalVolL = (acidVolMl + vBase) / 1000;
  const molesAcid = (acidConc * acidVolMl) / 1000;
  const molesBase = (baseConc * vBase) / 1000;
  const diff = molesAcid - molesBase;

  if (Math.abs(diff) < 1e-9) {
    return 7.0;
  }
  if (diff > 0) {
    const hConc = diff / totalVolL;
    return Number(Math.max(0, -Math.log10(hConc)).toFixed(2));
  }
  const ohConc = Math.abs(diff) / totalVolL;
  const pOH = Math.max(0, -Math.log10(ohConc));
  return Number(Math.min(14, 14 - pOH).toFixed(2));
}

/**
 * Exact Nernst Equation for Daniell Cell: Zn(s) + Cu2+(aq) -> Zn2+(aq) + Cu(s)
 * E = E0 - (R*T / (n*F)) * ln([Zn2+] / [Cu2+])
 * E0 = +1.10 V, n = 2
 */
export function calculateDaniellCellEMF(
  znConc: number,
  cuConc: number,
  tempC = 25
): number {
  const R = 8.31446;
  const F = 96485.33;
  const n = 2;
  const T = Math.max(200, tempC + 273.15);
  const safeZn = Math.max(0.01, znConc);
  const safeCu = Math.max(0.01, cuConc);
  const E0 = 1.1;
  const emf = E0 - ((R * T) / (n * F)) * Math.log(safeZn / safeCu);
  return Number(emf.toFixed(3));
}

export interface EquationSpecies {
  formula: string;
  side: 'reactant' | 'product';
}

export interface EquationBalanceCheck {
  balanced: boolean;
  elements: Array<{
    symbol: string;
    left: number;
    right: number;
    matched: boolean;
  }>;
}

export function checkEquationBalance(
  species: EquationSpecies[],
  coefficients: number[]
): EquationBalanceCheck {
  const leftTotals: Record<string, number> = {};
  const rightTotals: Record<string, number> = {};

  species.forEach((sp, idx) => {
    const coeff = Math.max(1, Math.floor(coefficients[idx] ?? 1));
    const { counts } = parseFormulaCounts(sp.formula);
    const target = sp.side === 'reactant' ? leftTotals : rightTotals;
    for (const [sym, cnt] of Object.entries(counts)) {
      target[sym] = (target[sym] || 0) + cnt * coeff;
    }
  });

  const allSymbols = Array.from(
    new Set([...Object.keys(leftTotals), ...Object.keys(rightTotals)])
  ).sort();

  const elements = allSymbols.map((symbol) => {
    const left = leftTotals[symbol] || 0;
    const right = rightTotals[symbol] || 0;
    return { symbol, left, right, matched: left === right && left > 0 };
  });

  return {
    balanced: elements.length > 0 && elements.every((el) => el.matched),
    elements,
  };
}

export interface QuizQuestionLite {
  id: string;
  unit: string;
  correctIndex: number;
}

export interface QuizAnalytics {
  total: number;
  correct: number;
  percentage: number;
  gradeLabel: string;
  byUnit: Array<{ unit: string; correct: number; total: number; percentage: number }>;
}

export function computeQuizAnalytics(
  questions: QuizQuestionLite[],
  selectedAnswers: Record<string, number>
): QuizAnalytics {
  const total = questions.length;
  let correct = 0;
  const unitMap = new Map<string, { correct: number; total: number }>();

  for (const q of questions) {
    const current = unitMap.get(q.unit) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (selectedAnswers[q.id] === q.correctIndex) {
      correct += 1;
      current.correct += 1;
    }
    unitMap.set(q.unit, current);
  }

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  let gradeLabel = 'يحتاج مراجعة مركّزة';
  if (percentage >= 90) gradeLabel = 'امتياز علمي فائق';
  else if (percentage >= 75) gradeLabel = 'جيد جداً — مستوى متقدم';
  else if (percentage >= 60) gradeLabel = 'جيد — استمر في التدريب';

  const byUnit = Array.from(unitMap.entries()).map(([unit, stats]) => ({
    unit,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  return { total, correct, percentage, gradeLabel, byUnit };
}
