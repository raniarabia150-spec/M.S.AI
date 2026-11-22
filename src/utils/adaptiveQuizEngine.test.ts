import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_DATA } from '../data/academyData';
import {
  DEFAULT_ADAPTIVE_CONFIG,
  buildStaticExamSession,
  computeDetailedExamReport,
  computeEliminatedOptions,
  filterCandidateQuestions,
  getLessonsForUnit,
  getUnitCatalog,
  pickAdaptiveNextQuestion,
  stepAdaptiveDifficulty,
} from './adaptiveQuizEngine';

const ALL_QUESTIONS = ACADEMY_DATA.quiz.questions;
const ALL_LESSONS = ACADEMY_DATA.lessons.items;

test('curriculum bank has 30 mapped questions covering all 3 units, 6 lessons, and all 3 difficulties', () => {
  assert.equal(ALL_QUESTIONS.length, 30);
  const catalog = getUnitCatalog(ALL_LESSONS, ALL_QUESTIONS);
  assert.equal(catalog.length, 3);
  for (const unit of catalog) {
    assert.equal(unit.questionCount, 10);
    assert.equal(unit.lessonCount, 2);
  }
  for (const lesson of ALL_LESSONS) {
    const lessonQs = ALL_QUESTIONS.filter((q) => q.lessonId === lesson.id);
    assert.equal(lessonQs.length, 5);
    assert.ok(lessonQs.some((q) => q.difficulty === 'سهل'));
    assert.ok(lessonQs.some((q) => q.difficulty === 'متوسط'));
    assert.ok(lessonQs.some((q) => q.difficulty === 'متقدم'));
  }
});

test('getLessonsForUnit returns all lessons or filters strictly by unitId', () => {
  assert.equal(getLessonsForUnit(ALL_LESSONS, 'all').length, 6);
  const u1 = getLessonsForUnit(ALL_LESSONS, 'unit1');
  assert.equal(u1.length, 2);
  assert.ok(u1.every((l) => l.unitId === 'unit1'));
});

test('filterCandidateQuestions filters accurately by unit, lesson, difficulty, skill, and weak lessons', () => {
  const byUnitAndDiff = filterCandidateQuestions(ALL_QUESTIONS, {
    ...DEFAULT_ADAPTIVE_CONFIG,
    unitId: 'unit2',
    difficulty: 'متقدم',
  });
  assert.ok(byUnitAndDiff.length >= 3);
  assert.ok(byUnitAndDiff.every((q) => q.unitId === 'unit2' && q.difficulty === 'متقدم'));

  const byLesson = filterCandidateQuestions(ALL_QUESTIONS, {
    ...DEFAULT_ADAPTIVE_CONFIG,
    unitId: 'unit3',
    lessonId: 'lesson-6',
    difficulty: 'all',
  });
  assert.equal(byLesson.length, 5);
  assert.ok(byLesson.every((q) => q.lessonId === 'lesson-6'));

  const byWeak = filterCandidateQuestions(
    ALL_QUESTIONS,
    {
      ...DEFAULT_ADAPTIVE_CONFIG,
      onlyWeakLessons: true,
    },
    ['lesson-2']
  );
  assert.equal(byWeak.length, 5);
  assert.ok(byWeak.every((q) => q.lessonId === 'lesson-2'));
});

test('stepAdaptiveDifficulty escalates on correct answers and steps down on wrong answers', () => {
  assert.equal(stepAdaptiveDifficulty('سهل', true, 1), 'متوسط');
  assert.equal(stepAdaptiveDifficulty('متوسط', true, 1), 'متقدم');
  assert.equal(stepAdaptiveDifficulty('متقدم', true, 2), 'متقدم');
  assert.equal(stepAdaptiveDifficulty('متقدم', false, 0), 'متوسط');
  assert.equal(stepAdaptiveDifficulty('متوسط', false, 0), 'سهل');
  assert.equal(stepAdaptiveDifficulty('سهل', false, 0), 'سهل');
});

test('pickAdaptiveNextQuestion selects target difficulty when available and falls back cleanly', () => {
  const asked = new Set<string>();
  const hardPick = pickAdaptiveNextQuestion(ALL_QUESTIONS, asked, 'متقدم', () => 0);
  assert.ok(hardPick);
  assert.equal(hardPick.difficulty, 'متقدم');

  // Exhaust all hard questions and verify fallback picks medium next
  const allHardIds = new Set(
    ALL_QUESTIONS.filter((q) => q.difficulty === 'متقدم').map((q) => q.id)
  );
  const fallbackPick = pickAdaptiveNextQuestion(ALL_QUESTIONS, allHardIds, 'متقدم', () => 0);
  assert.ok(fallbackPick);
  assert.equal(fallbackPick.difficulty, 'متوسط');
});

test('computeEliminatedOptions always eliminates two wrong indices and never the correct answer', () => {
  for (let correct = 0; correct < 4; correct += 1) {
    for (let seed = 0; seed < 5; seed += 1) {
      const eliminated = computeEliminatedOptions(4, correct, seed);
      assert.equal(eliminated.length, 2);
      assert.equal(eliminated.includes(correct), false);
      assert.notEqual(eliminated[0], eliminated[1]);
    }
  }
});

test('buildStaticExamSession clamps questionCount cleanly', () => {
  const candidates = filterCandidateQuestions(ALL_QUESTIONS, {
    ...DEFAULT_ADAPTIVE_CONFIG,
    lessonId: 'lesson-1',
    difficulty: 'all',
  });
  const session = buildStaticExamSession(candidates, {
    ...DEFAULT_ADAPTIVE_CONFIG,
    questionCount: 10,
    shuffleQuestions: false,
  });
  assert.equal(session.length, 5);
});

test('computeDetailedExamReport generates unit, lesson, difficulty, skill breakdowns and missed IDs', () => {
  const subset = [ALL_QUESTIONS[0], ALL_QUESTIONS[5], ALL_QUESTIONS[10], ALL_QUESTIONS[20]];
  const answers: Record<string, number> = {
    [subset[0].id]: subset[0].correctIndex, // right
    [subset[1].id]: (subset[1].correctIndex + 1) % 4, // wrong
    [subset[2].id]: subset[2].correctIndex, // right
    // subset[3] unanswered
  };
  const report = computeDetailedExamReport(subset, answers, 120, 1, 1);
  assert.equal(report.total, 4);
  assert.equal(report.answered, 3);
  assert.equal(report.unanswered, 1);
  assert.equal(report.correct, 2);
  assert.equal(report.wrong, 2);
  assert.equal(report.percentage, 50);
  assert.equal(report.avgSecondsPerQuestion, 30);
  assert.equal(report.missedQuestionIds.length, 2);
  assert.equal(report.byUnit.length, 3);
  assert.equal(report.byLesson.length, 4);
  assert.ok(report.weakestLesson);
  assert.ok(report.strongestUnit);
  assert.ok(report.recommendation.length > 10);
});
