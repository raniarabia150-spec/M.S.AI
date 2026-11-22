import { ACADEMY_DATA, type LessonItem, type QuizQuestion } from '../data/academyData';
import type { HardChallengeQuestion } from './certificateEngine';

export type MistakeSource =
  | 'lesson-check'
  | 'question-bank'
  | 'adaptive-quiz'
  | 'certificate-challenge';

export interface MistakeLessonTarget {
  unitId: 'unit1' | 'unit2' | 'unit3';
  unitName: string;
  lessonId: string;
  lessonTitle: string;
  sectionIndex: number;
  sectionTitle: string;
}

export interface MistakeRecord {
  questionId: string;
  source: MistakeSource;
  sourceLabel: string;
  question: string;
  formula?: string;
  options: string[];
  selectedOptionIndex: number;
  correctIndex: number;
  explanation: string;
  difficulty?: string;
  unitId: 'unit1' | 'unit2' | 'unit3';
  unitName: string;
  lessonId: string;
  lessonTitle: string;
  sectionIndex: number;
  sectionTitle: string;
  wrongCount: number;
  resolved: boolean;
  lastMissedAtIso: string;
}

export interface MistakeInput {
  questionId: string;
  source: MistakeSource;
  question: string;
  formula?: string;
  options: string[];
  selectedOptionIndex: number;
  correctIndex: number;
  explanation: string;
  difficulty?: string;
  lessonId?: string;
  sectionIndex?: number;
}

export interface MistakeSummary {
  totalCount: number;
  unresolvedCount: number;
  resolvedCount: number;
  topWeakUnit: { unitName: string; count: number } | null;
}

export const MISTAKE_SOURCE_LABELS: Record<MistakeSource, string> = {
  'lesson-check': 'اختبر فهمك للدرس',
  'question-bank': 'بنك الأسئلة',
  'adaptive-quiz': 'الاختبار التكيّفي الذكي',
  'certificate-challenge': 'تحدي الشهادة الصعب',
};

/**
 * Maps every platform question ID to its exact lesson & section index so
 * clicking "انتقل لشرح السؤال" scrolls directly to the teaching paragraph.
 */
const QUESTION_SECTION_MAP: Record<string, { lessonId: string; sectionIndex: number }> = {
  // Lesson 1
  q1: { lessonId: 'lesson-1', sectionIndex: 0 },
  q2: { lessonId: 'lesson-1', sectionIndex: 1 },
  q3: { lessonId: 'lesson-1', sectionIndex: 0 },
  q4: { lessonId: 'lesson-1', sectionIndex: 1 },
  q5: { lessonId: 'lesson-1', sectionIndex: 1 },
  'lesson-check-lesson-1': { lessonId: 'lesson-1', sectionIndex: 1 },
  // Lesson 2
  q6: { lessonId: 'lesson-2', sectionIndex: 0 },
  q7: { lessonId: 'lesson-2', sectionIndex: 0 },
  q8: { lessonId: 'lesson-2', sectionIndex: 1 },
  q9: { lessonId: 'lesson-2', sectionIndex: 1 },
  q10: { lessonId: 'lesson-2', sectionIndex: 1 },
  'lesson-check-lesson-2': { lessonId: 'lesson-2', sectionIndex: 1 },
  // Lesson 3
  q11: { lessonId: 'lesson-3', sectionIndex: 0 },
  q12: { lessonId: 'lesson-3', sectionIndex: 1 },
  q13: { lessonId: 'lesson-3', sectionIndex: 0 },
  q14: { lessonId: 'lesson-3', sectionIndex: 0 },
  q15: { lessonId: 'lesson-3', sectionIndex: 0 },
  'lesson-check-lesson-3': { lessonId: 'lesson-3', sectionIndex: 0 },
  // Lesson 4
  q16: { lessonId: 'lesson-4', sectionIndex: 0 },
  q17: { lessonId: 'lesson-4', sectionIndex: 0 },
  q18: { lessonId: 'lesson-4', sectionIndex: 1 },
  q19: { lessonId: 'lesson-4', sectionIndex: 1 },
  q20: { lessonId: 'lesson-4', sectionIndex: 0 },
  'lesson-check-lesson-4': { lessonId: 'lesson-4', sectionIndex: 1 },
  // Lesson 5
  q21: { lessonId: 'lesson-5', sectionIndex: 0 },
  q22: { lessonId: 'lesson-5', sectionIndex: 1 },
  q23: { lessonId: 'lesson-5', sectionIndex: 0 },
  q24: { lessonId: 'lesson-5', sectionIndex: 0 },
  q25: { lessonId: 'lesson-5', sectionIndex: 0 },
  'lesson-check-lesson-5': { lessonId: 'lesson-5', sectionIndex: 1 },
  // Lesson 6
  q26: { lessonId: 'lesson-6', sectionIndex: 1 },
  q27: { lessonId: 'lesson-6', sectionIndex: 1 },
  q28: { lessonId: 'lesson-6', sectionIndex: 1 },
  q29: { lessonId: 'lesson-6', sectionIndex: 1 },
  q30: { lessonId: 'lesson-6', sectionIndex: 0 },
  'lesson-check-lesson-6': { lessonId: 'lesson-6', sectionIndex: 1 },
  // Certificate Hard Questions
  'hc-1': { lessonId: 'lesson-1', sectionIndex: 1 },
  'hc-2': { lessonId: 'lesson-3', sectionIndex: 0 },
  'hc-3': { lessonId: 'lesson-3', sectionIndex: 0 },
  'hc-4': { lessonId: 'lesson-4', sectionIndex: 1 },
  'hc-5': { lessonId: 'lesson-5', sectionIndex: 0 },
};

export function resolveLessonExplanationTarget(
  questionId: string,
  fallbackLessonId?: string,
  fallbackSectionIndex?: number,
  lessons: readonly LessonItem[] = ACADEMY_DATA.lessons.items
): MistakeLessonTarget {
  const mapped = QUESTION_SECTION_MAP[questionId];
  const targetLessonId = mapped?.lessonId ?? fallbackLessonId ?? lessons[0].id;
  const lesson = lessons.find((l) => l.id === targetLessonId) ?? lessons[0];
  const rawIdx = mapped?.sectionIndex ?? fallbackSectionIndex ?? 0;
  const safeIdx =
    rawIdx >= 0 && rawIdx < lesson.sections.length ? rawIdx : 0;

  return {
    unitId: lesson.unitId,
    unitName: lesson.unitName,
    lessonId: lesson.id,
    lessonTitle: `${lesson.numberLabel}: ${lesson.title}`,
    sectionIndex: safeIdx,
    sectionTitle: lesson.sections[safeIdx]?.title ?? lesson.title,
  };
}

export function buildMistakeFromQuizQuestion(
  q: QuizQuestion,
  selectedOptionIndex: number,
  source: 'question-bank' | 'adaptive-quiz'
): MistakeInput {
  return {
    questionId: q.id,
    source,
    question: q.question,
    formula: q.formula,
    options: [...q.options],
    selectedOptionIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    difficulty: q.difficulty,
    lessonId: q.lessonId,
  };
}

export function buildMistakeFromLessonCheck(
  lesson: LessonItem,
  selectedOptionIndex: number
): MistakeInput {
  return {
    questionId: `lesson-check-${lesson.id}`,
    source: 'lesson-check',
    question: lesson.quickCheck.question,
    options: [...lesson.quickCheck.options],
    selectedOptionIndex,
    correctIndex: lesson.quickCheck.correctIndex,
    explanation: lesson.quickCheck.explanation,
    difficulty: lesson.level,
    lessonId: lesson.id,
  };
}

export function buildMistakeFromCertificateQuestion(
  q: HardChallengeQuestion,
  selectedOptionIndex: number
): MistakeInput {
  return {
    questionId: q.id,
    source: 'certificate-challenge',
    question: q.question,
    formula: q.formula,
    options: [...q.options],
    selectedOptionIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    difficulty: 'متقدم جداً',
  };
}

export function upsertMistakeRecord(
  existing: readonly MistakeRecord[],
  input: MistakeInput,
  nowIso: string = new Date().toISOString()
): MistakeRecord[] {
  const target = resolveLessonExplanationTarget(
    input.questionId,
    input.lessonId,
    input.sectionIndex
  );
  const prev = existing.find((item) => item.questionId === input.questionId);
  const nextRecord: MistakeRecord = {
    questionId: input.questionId,
    source: input.source,
    sourceLabel: MISTAKE_SOURCE_LABELS[input.source],
    question: input.question,
    formula: input.formula,
    options: input.options,
    selectedOptionIndex: input.selectedOptionIndex,
    correctIndex: input.correctIndex,
    explanation: input.explanation,
    difficulty: input.difficulty,
    unitId: target.unitId,
    unitName: target.unitName,
    lessonId: target.lessonId,
    lessonTitle: target.lessonTitle,
    sectionIndex: target.sectionIndex,
    sectionTitle: target.sectionTitle,
    wrongCount: prev ? prev.wrongCount + 1 : 1,
    resolved: false,
    lastMissedAtIso: nowIso,
  };

  return [nextRecord, ...existing.filter((item) => item.questionId !== input.questionId)];
}

export function markMistakeResolved(
  existing: readonly MistakeRecord[],
  questionId: string,
  resolved: boolean
): MistakeRecord[] {
  return existing.map((item) =>
    item.questionId === questionId ? { ...item, resolved } : item
  );
}

export function removeMistakeRecord(
  existing: readonly MistakeRecord[],
  questionId: string
): MistakeRecord[] {
  return existing.filter((item) => item.questionId !== questionId);
}

export function filterMistakeRecords(
  records: readonly MistakeRecord[],
  filters: {
    status: 'all' | 'unresolved' | 'resolved';
    unitId: 'all' | 'unit1' | 'unit2' | 'unit3';
    source: 'all' | MistakeSource;
  }
): MistakeRecord[] {
  return records.filter((item) => {
    const statusOk =
      filters.status === 'all' ||
      (filters.status === 'unresolved' && !item.resolved) ||
      (filters.status === 'resolved' && item.resolved);
    const unitOk = filters.unitId === 'all' || item.unitId === filters.unitId;
    const sourceOk = filters.source === 'all' || item.source === filters.source;
    return statusOk && unitOk && sourceOk;
  });
}

export function computeMistakeSummary(records: readonly MistakeRecord[]): MistakeSummary {
  const totalCount = records.length;
  let unresolvedCount = 0;
  let resolvedCount = 0;
  const unitCounts = new Map<string, number>();

  for (const r of records) {
    if (r.resolved) {
      resolvedCount += 1;
    } else {
      unresolvedCount += 1;
      unitCounts.set(r.unitName, (unitCounts.get(r.unitName) ?? 0) + 1);
    }
  }

  let topWeakUnit: { unitName: string; count: number } | null = null;
  for (const [unitName, count] of unitCounts.entries()) {
    if (!topWeakUnit || count > topWeakUnit.count) {
      topWeakUnit = { unitName, count };
    }
  }

  return {
    totalCount,
    unresolvedCount,
    resolvedCount,
    topWeakUnit,
  };
}
