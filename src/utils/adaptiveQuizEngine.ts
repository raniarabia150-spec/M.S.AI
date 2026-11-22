import type {
  LessonItem,
  QuizDifficulty,
  QuizQuestion,
  QuizSkillType,
} from '../data/academyData';

export type AdaptiveDifficultyOption = 'adaptive' | 'all' | QuizDifficulty;
export type AdaptiveUnitOption = 'all' | 'unit1' | 'unit2' | 'unit3';
export type AdaptiveSkillOption = 'all' | QuizSkillType;
export type AdaptiveTimerMode = 'total-exam' | 'per-question' | 'none';
export type AdaptiveExamStyle = 'exam' | 'training';

export interface AdaptiveQuizConfig {
  unitId: AdaptiveUnitOption;
  lessonId: string; // 'all' or specific lessonId
  difficulty: AdaptiveDifficultyOption;
  skillType: AdaptiveSkillOption;
  questionCount: number; // 0 means "all matching"
  timerMode: AdaptiveTimerMode;
  secondsPerQuestion: number;
  examStyle: AdaptiveExamStyle;
  shuffleQuestions: boolean;
  enableHints: boolean;
  enableLifeline5050: boolean;
  onlyWeakLessons: boolean;
}

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveQuizConfig = {
  unitId: 'all',
  lessonId: 'all',
  difficulty: 'adaptive',
  skillType: 'all',
  questionCount: 8,
  timerMode: 'total-exam',
  secondsPerQuestion: 45,
  examStyle: 'training',
  shuffleQuestions: true,
  enableHints: true,
  enableLifeline5050: true,
  onlyWeakLessons: false,
};

export interface UnitCatalogItem {
  unitId: 'unit1' | 'unit2' | 'unit3';
  unitName: string;
  questionCount: number;
  lessonCount: number;
}

export interface BreakdownStat {
  key: string;
  label: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface DetailedExamReport {
  total: number;
  answered: number;
  unanswered: number;
  correct: number;
  wrong: number;
  percentage: number;
  gradeLabel: string;
  masteryTier: string;
  avgSecondsPerQuestion: number;
  hintsUsed: number;
  lifelinesUsed: number;
  byUnit: BreakdownStat[];
  byLesson: BreakdownStat[];
  byDifficulty: BreakdownStat[];
  bySkill: BreakdownStat[];
  strongestUnit: BreakdownStat | null;
  weakestLesson: BreakdownStat | null;
  missedQuestionIds: string[];
  weakLessonIds: string[];
  recommendation: string;
}

export interface ExamAttemptRecord {
  id: string;
  dateIso: string;
  scopeLabel: string;
  difficultyLabel: string;
  examStyle: AdaptiveExamStyle;
  percentage: number;
  correct: number;
  total: number;
  elapsedSec: number;
  weakLessonIds: string[];
}

const DIFFICULTY_RANK: Record<QuizDifficulty, number> = {
  سهل: 0,
  متوسط: 1,
  متقدم: 2,
};

const RANK_TO_DIFFICULTY: QuizDifficulty[] = ['سهل', 'متوسط', 'متقدم'];

export function getUnitCatalog(
  lessons: LessonItem[],
  questions: QuizQuestion[]
): UnitCatalogItem[] {
  const unitOrder: Array<'unit1' | 'unit2' | 'unit3'> = ['unit1', 'unit2', 'unit3'];
  return unitOrder
    .map((unitId) => {
      const unitLessons = lessons.filter((l) => l.unitId === unitId);
      const unitQuestions = questions.filter((q) => q.unitId === unitId);
      const unitName = unitLessons[0]?.unitName ?? unitQuestions[0]?.unit ?? unitId;
      return {
        unitId,
        unitName,
        questionCount: unitQuestions.length,
        lessonCount: unitLessons.length,
      };
    })
    .filter((u) => u.questionCount > 0 || u.lessonCount > 0);
}

export function getLessonsForUnit(
  lessons: LessonItem[],
  unitId: AdaptiveUnitOption
): LessonItem[] {
  if (unitId === 'all') return lessons;
  return lessons.filter((l) => l.unitId === unitId);
}

export function filterCandidateQuestions(
  questions: QuizQuestion[],
  config: AdaptiveQuizConfig,
  weakLessonIds: string[] = []
): QuizQuestion[] {
  const base = questions.filter((q) => {
    const unitMatch = config.unitId === 'all' || q.unitId === config.unitId;
    const lessonMatch = config.lessonId === 'all' || q.lessonId === config.lessonId;
    const diffMatch =
      config.difficulty === 'all' ||
      config.difficulty === 'adaptive' ||
      q.difficulty === config.difficulty;
    const skillMatch = config.skillType === 'all' || q.skillType === config.skillType;
    return unitMatch && lessonMatch && diffMatch && skillMatch;
  });

  if (config.onlyWeakLessons && weakLessonIds.length > 0) {
    const weakSet = new Set(weakLessonIds);
    const weakOnly = base.filter((q) => weakSet.has(q.lessonId));
    if (weakOnly.length > 0) {
      return weakOnly;
    }
  }

  return base;
}

export function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function buildStaticExamSession(
  candidates: QuizQuestion[],
  config: AdaptiveQuizConfig,
  rng: () => number = Math.random
): QuizQuestion[] {
  const ordered = config.shuffleQuestions ? shuffleArray(candidates, rng) : [...candidates];
  if (config.questionCount <= 0 || config.questionCount >= ordered.length) {
    return ordered;
  }
  return ordered.slice(0, config.questionCount);
}

export function stepAdaptiveDifficulty(
  current: QuizDifficulty,
  wasCorrect: boolean,
  consecutiveCorrect: number
): QuizDifficulty {
  const rank = DIFFICULTY_RANK[current];
  if (wasCorrect) {
    // Immediately promote from سهل to متوسط, or promote to متقدم on strong accuracy
    const step = current === 'سهل' || consecutiveCorrect >= 1 ? 1 : 0;
    return RANK_TO_DIFFICULTY[Math.min(2, rank + step)];
  }
  return RANK_TO_DIFFICULTY[Math.max(0, rank - 1)];
}

export function pickAdaptiveNextQuestion(
  pool: QuizQuestion[],
  askedIds: ReadonlySet<string>,
  targetDifficulty: QuizDifficulty,
  rng: () => number = Math.random
): QuizQuestion | null {
  const remaining = pool.filter((q) => !askedIds.has(q.id));
  if (remaining.length === 0) return null;

  const targetRank = DIFFICULTY_RANK[targetDifficulty];
  const exact = remaining.filter((q) => q.difficulty === targetDifficulty);
  if (exact.length > 0) {
    return exact[Math.floor(rng() * exact.length)];
  }

  // Fallback to closest difficulty distance
  const sortedByProximity = [...remaining].sort(
    (a, b) =>
      Math.abs(DIFFICULTY_RANK[a.difficulty] - targetRank) -
      Math.abs(DIFFICULTY_RANK[b.difficulty] - targetRank)
  );
  const bestDist = Math.abs(DIFFICULTY_RANK[sortedByProximity[0].difficulty] - targetRank);
  const closestGroup = sortedByProximity.filter(
    (q) => Math.abs(DIFFICULTY_RANK[q.difficulty] - targetRank) === bestDist
  );
  return closestGroup[Math.floor(rng() * closestGroup.length)];
}

export function computeEliminatedOptions(
  optionsCount: number,
  correctIndex: number,
  seed: number
): number[] {
  const wrongIndices: number[] = [];
  for (let i = 0; i < optionsCount; i += 1) {
    if (i !== correctIndex) wrongIndices.push(i);
  }
  if (wrongIndices.length <= 2) return wrongIndices;
  // Deterministic rotation based on seed
  const offset = Math.abs(seed) % wrongIndices.length;
  const rotated = [...wrongIndices.slice(offset), ...wrongIndices.slice(0, offset)];
  return rotated.slice(0, 2).sort((a, b) => a - b);
}

export function estimateExamDurationSeconds(
  questionCount: number,
  timerMode: AdaptiveTimerMode,
  secondsPerQuestion: number
): number {
  if (timerMode === 'none') return 0;
  return Math.max(0, questionCount * secondsPerQuestion);
}

export function formatSecondsClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeDetailedExamReport(
  questions: QuizQuestion[],
  selectedAnswers: Record<string, number>,
  elapsedSec: number,
  hintsUsed = 0,
  lifelinesUsed = 0
): DetailedExamReport {
  const total = questions.length;
  let answered = 0;
  let correct = 0;
  const missedQuestionIds: string[] = [];

  const unitMap = new Map<string, { label: string; correct: number; total: number }>();
  const lessonMap = new Map<string, { label: string; correct: number; total: number }>();
  const diffMap = new Map<string, { label: string; correct: number; total: number }>();
  const skillMap = new Map<string, { label: string; correct: number; total: number }>();

  for (const q of questions) {
    const picked = selectedAnswers[q.id];
    const isAnswered = picked !== undefined;
    const isCorrect = picked === q.correctIndex;
    if (isAnswered) answered += 1;
    if (isCorrect) {
      correct += 1;
    } else {
      missedQuestionIds.push(q.id);
    }

    const u = unitMap.get(q.unitId) ?? { label: q.unit, correct: 0, total: 0 };
    u.total += 1;
    if (isCorrect) u.correct += 1;
    unitMap.set(q.unitId, u);

    const l = lessonMap.get(q.lessonId) ?? { label: q.lessonTitle, correct: 0, total: 0 };
    l.total += 1;
    if (isCorrect) l.correct += 1;
    lessonMap.set(q.lessonId, l);

    const d = diffMap.get(q.difficulty) ?? { label: q.difficulty, correct: 0, total: 0 };
    d.total += 1;
    if (isCorrect) d.correct += 1;
    diffMap.set(q.difficulty, d);

    const s = skillMap.get(q.skillType) ?? { label: q.skillType, correct: 0, total: 0 };
    s.total += 1;
    if (isCorrect) s.correct += 1;
    skillMap.set(q.skillType, s);
  }

  const toStats = (map: Map<string, { label: string; correct: number; total: number }>): BreakdownStat[] =>
    Array.from(map.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      correct: v.correct,
      total: v.total,
      percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

  const byUnit = toStats(unitMap);
  const byLesson = toStats(lessonMap);
  const byDifficulty = (['سهل', 'متوسط', 'متقدم'] as QuizDifficulty[])
    .filter((d) => diffMap.has(d))
    .map((d) => {
      const v = diffMap.get(d)!;
      return {
        key: d,
        label: `مستوى ${d}`,
        correct: v.correct,
        total: v.total,
        percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      };
    });
  const bySkill = toStats(skillMap);

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrong = total - correct;
  const unanswered = total - answered;
  const avgSecondsPerQuestion = total > 0 ? Math.round(elapsedSec / total) : 0;

  let gradeLabel = 'يحتاج مراجعة مركّزة';
  let masteryTier = 'مستوى التأسيس';
  if (percentage >= 90) {
    gradeLabel = 'امتياز علمي فائق';
    masteryTier = 'نُخبة الكيمياء';
  } else if (percentage >= 75) {
    gradeLabel = 'جيد جداً — مستوى متقدم';
    masteryTier = 'متفوق كيميائياً';
  } else if (percentage >= 60) {
    gradeLabel = 'جيد — استمر في التدريب';
    masteryTier = 'تقدم واعد';
  }

  const strongestUnit =
    byUnit.length > 0
      ? [...byUnit].sort((a, b) => b.percentage - a.percentage || b.correct - a.correct)[0]
      : null;

  const weakestLesson =
    byLesson.length > 0
      ? [...byLesson].sort((a, b) => a.percentage - b.percentage || a.correct - b.correct)[0]
      : null;

  const weakLessonIds = byLesson.filter((l) => l.percentage < 75).map((l) => l.key);

  let recommendation = 'أداء استثنائي! جرّب تحدي المستوى المتقدم أو انتقل إلى تبويب الشهادات لإصدار شهادة التقدير.';
  if (percentage < 100 && weakestLesson && weakestLesson.percentage < 75) {
    recommendation = `أولوية المراجعة المقترحة: "${weakestLesson.label}" (نسبة الإتقان ${weakestLesson.percentage}%). استخدم زر "إعادة اختبار الأخطاء" لتثبيت المفاهيم فوراً.`;
  } else if (percentage < 100) {
    recommendation = 'أداء قوي ومتوازن! يمكنك رفع التحدي باختيار "المستوى المتقدم" وتقليل زمن السؤال إلى 30 ثانية.';
  }

  return {
    total,
    answered,
    unanswered,
    correct,
    wrong,
    percentage,
    gradeLabel,
    masteryTier,
    avgSecondsPerQuestion,
    hintsUsed,
    lifelinesUsed,
    byUnit,
    byLesson,
    byDifficulty,
    bySkill,
    strongestUnit,
    weakestLesson,
    missedQuestionIds,
    weakLessonIds,
    recommendation,
  };
}
