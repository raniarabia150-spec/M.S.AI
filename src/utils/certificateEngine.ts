export type CertificateEdition = 'royal-gold' | 'emerald-molecular' | 'platinum-parchment';

export interface HardChallengeQuestion {
  id: string;
  topic: string;
  question: string;
  formula?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CertificateEvaluation {
  correct: number;
  total: number;
  percentage: number;
  passed: boolean;
  tierTitle: string;
  tierRank: 'diamond' | 'gold' | 'none';
}

export interface SavedCertificate {
  id: string;
  serial: string;
  studentName: string;
  studentGrade: string;
  edition: CertificateEdition;
  scoreCorrect: number;
  scoreTotal: number;
  percentage: number;
  tierTitle: string;
  tierRank: 'diamond' | 'gold';
  issuedDateAr: string;
  createdAtIso: string;
}

export const CERTIFICATE_PASS_PERCENTAGE = 80;

export const HARD_CERTIFICATE_QUESTIONS: readonly HardChallengeQuestion[] = [
  {
    id: 'hc-1',
    topic: 'العناصر الانتقالية والعزم المغناطيسي',
    question:
      'أيون عنصر انتقالي ثلاثي الشحنة (X³⁺) يمتلك عزماً مغناطيسياً يساوي 4.90 BM تقريباً (4 إلكترونات مفردة في 3d). ما العدد الذري المحتمل للعنصر X إذا كان أعلى حالات تأكسده +7؟',
    formula: 'μ = √(n(n + 2)) ≈ 4.90 BM  ⇒  n = 4',
    options: ['24 (Cr)', '25 (Mn)', '26 (Fe)', '27 (Co)'],
    correctIndex: 1,
    explanation:
      'العنصر الذي تصل أقصى حالة تأكسد له إلى +7 هو المنجنيز (₂₅Mn: [Ar] 4s² 3d⁵)؛ وعند فقد 3 إلكترونات يصبح Mn³⁺ بتوزيع [Ar] 3d⁴ أي يمتلك 4 إلكترونات مفردة وعزمه المغناطيسي √24 ≈ 4.90 BM.',
  },
  {
    id: 'hc-2',
    topic: 'التحليل الكيميائي والمعايرة الخلفية',
    question:
      'أُذيب 2.0 g من عينة غير نقية من كربونات الصوديوم Na₂CO₃ (M = 106 g/mol) في الماء، فلزم لمعايرتها تماماً 30 mL من حمض HCl تركيزه 1.0 M. ما النسبة المئوية لنقاء Na₂CO₃ في العينة؟',
    formula: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂',
    options: ['53.0%', '79.5%', '84.8%', '92.4%'],
    correctIndex: 1,
    explanation:
      'عدد مولات HCl = 0.03 × 1.0 = 0.03 mol؛ وبالتالي عدد مولات Na₂CO₃ = 0.015 mol، وكتلتها = 0.015 × 106 = 1.59 g، فتكون نسبة النقاء = (1.59 / 2.0) × 100 = 79.5%.',
  },
  {
    id: 'hc-3',
    topic: 'الاتزان الأيوني وحاصل الإذابة Ksp',
    question:
      'إذا كانت درجة ذوبان ملح كرومات الفضة Ag₂CrO₄ في الماء النقي عند 25°C تساوي (s = 1.0 × 10⁻⁴ M)، فما قيمة حاصل الإذابة Ksp لهذا الملح؟',
    formula: 'Ag₂CrO₄(s) ⇌ 2Ag⁺(aq) + CrO₄²⁻(aq)  |  Ksp = 4s³',
    options: ['1.0 × 10⁻⁸', '2.0 × 10⁻¹²', '4.0 × 10⁻¹²', '4.0 × 10⁻⁸'],
    correctIndex: 2,
    explanation:
      'بما أن الملح ثلاثي الأيونات (2Ag⁺ + CrO₄²⁻)، فإن Ksp = (2s)²(s) = 4s³ = 4 × (10⁻⁴)³ = 4.0 × 10⁻¹².',
  },
  {
    id: 'hc-4',
    topic: 'الكيمياء الكهربية وقوانين فاراداي',
    question:
      'مرّ تيار كهربي في خليتين تحليليتين متصلتين على التوالي، الأولى تحتوي على محلول CuSO₄ والثانية على محلول AgNO₃. إذا ترسب 3.175 g من النحاس (Cu = 63.5)، فكم جراماً من الفضة (Ag = 108) تترسب في الخلية الثانية؟',
    formula: 'm₁ / Eq₁ = m₂ / Eq₂',
    options: ['5.40 g', '10.80 g', '16.20 g', '21.60 g'],
    correctIndex: 1,
    explanation:
      'الكتلة المكافئة للنحاس = 63.5 / 2 = 31.75 g، فعدد المكافئات = 3.175 / 31.75 = 0.1 فاراداي؛ وبالتوالي تترسب 0.1 × 108 = 10.80 g من الفضة.',
  },
  {
    id: 'hc-5',
    topic: 'الكيمياء العضوية والأيزوميريزم',
    question:
      'كم عدد الأيزوميرات البنائية الممكنة للألكان الذي كتلته المولية 72 g/mol (علماً بأن C = 12, H = 1)؟',
    formula: 'CₙH₂ₙ₊₂ = 72  ⇒  14n + 2 = 72',
    options: ['2 أيزومير', '3 أيزوميرات', '4 أيزوميرات', '5 أيزوميرات'],
    correctIndex: 1,
    explanation:
      '14n + 2 = 72 تعطي n = 5 أي البنتان C₅H₁₂، وله 3 أيزوميرات بنائية فقط: بنتان عادي، 2-ميثيل بيوتان (أيزوبنتان)، و 2,2-ثنائي ميثيل بروبان (نيوبنتان).',
  },
];

export function evaluateCertificateEligibility(
  selectedAnswers: Record<string, number>,
  questions: readonly HardChallengeQuestion[] = HARD_CERTIFICATE_QUESTIONS
): CertificateEvaluation {
  const total = questions.length;
  let correct = 0;

  for (const q of questions) {
    if (selectedAnswers[q.id] === q.correctIndex) {
      correct += 1;
    }
  }

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = percentage >= CERTIFICATE_PASS_PERCENTAGE;

  if (percentage === 100) {
    return {
      correct,
      total,
      percentage,
      passed: true,
      tierTitle: 'وسام التميّز الماسي — نُخبة الكيمياء',
      tierRank: 'diamond',
    };
  }
  if (passed) {
    return {
      correct,
      total,
      percentage,
      passed: true,
      tierTitle: 'وسام التفوق الذهبي — باحث كيميائي متقدم',
      tierRank: 'gold',
    };
  }
  return {
    correct,
    total,
    percentage,
    passed: false,
    tierTitle: 'لم يتم بلوغ حد التأهيل (80%) بعد',
    tierRank: 'none',
  };
}

export function generateCertificateSerial(studentName: string, timestampMs: number): string {
  const clean = studentName.trim();
  let hash = 2166136261;
  const seed = `${clean}-${timestampMs}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `CHEM-2026-${code}`;
}

export function formatArabicCertificateDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function validateStudentName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'الرجاء كتابة اسمك الكامل (3 أحرف على الأقل) ليُنقش على الشهادة.' };
  }
  if (trimmed.length > 60) {
    return { valid: false, error: 'الاسم طويل جداً، يُرجى اختصاره لأقل من 60 حرفاً.' };
  }
  return { valid: true };
}
