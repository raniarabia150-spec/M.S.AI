import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_DATA } from '../data/academyData';
import { HARD_CERTIFICATE_QUESTIONS } from './certificateEngine';
import {
  buildMistakeFromCertificateQuestion,
  buildMistakeFromLessonCheck,
  buildMistakeFromQuizQuestion,
  computeMistakeSummary,
  filterMistakeRecords,
  markMistakeResolved,
  removeMistakeRecord,
  resolveLessonExplanationTarget,
  upsertMistakeRecord,
} from './mistakesEngine';

test('resolveLessonExplanationTarget maps every quiz, lesson quickCheck, and certificate question to a valid lesson section', () => {
  for (const q of ACADEMY_DATA.quiz.questions) {
    const target = resolveLessonExplanationTarget(q.id, q.lessonId);
    const lesson = ACADEMY_DATA.lessons.items.find((l) => l.id === target.lessonId);
    assert.ok(lesson, `Missing lesson for ${q.id}`);
    assert.ok(lesson.sections[target.sectionIndex], `Invalid sectionIndex for ${q.id}`);
  }

  for (const lesson of ACADEMY_DATA.lessons.items) {
    const target = resolveLessonExplanationTarget(`lesson-check-${lesson.id}`, lesson.id);
    assert.equal(target.lessonId, lesson.id);
    assert.ok(lesson.sections[target.sectionIndex]);
  }

  for (const hq of HARD_CERTIFICATE_QUESTIONS) {
    const target = resolveLessonExplanationTarget(hq.id);
    const lesson = ACADEMY_DATA.lessons.items.find((l) => l.id === target.lessonId);
    assert.ok(lesson, `Missing lesson for ${hq.id}`);
    assert.ok(lesson.sections[target.sectionIndex], `Invalid sectionIndex for ${hq.id}`);
  }
});

test('upsertMistakeRecord records new mistakes, deduplicates by questionId, increments wrongCount, and resets resolved state', () => {
  const q1 = ACADEMY_DATA.quiz.questions[0];
  let list = upsertMistakeRecord(
    [],
    buildMistakeFromQuizQuestion(q1, 0, 'question-bank'),
    '2026-11-22T01:00:00.000Z'
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].wrongCount, 1);
  assert.equal(list[0].resolved, false);
  assert.equal(list[0].lessonId, 'lesson-1');

  list = markMistakeResolved(list, q1.id, true);
  assert.equal(list[0].resolved, true);

  // Missing same question again in adaptive quiz increments count & marks unresolved
  list = upsertMistakeRecord(
    list,
    buildMistakeFromQuizQuestion(q1, 2, 'adaptive-quiz'),
    '2026-11-22T02:00:00.000Z'
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].wrongCount, 2);
  assert.equal(list[0].resolved, false);
  assert.equal(list[0].source, 'adaptive-quiz');
});

test('filterMistakeRecords and computeMistakeSummary aggregate unresolved/resolved counts and topWeakUnit accurately', () => {
  const lesson1 = ACADEMY_DATA.lessons.items[0];
  const hc4 = HARD_CERTIFICATE_QUESTIONS[3]; // Faraday -> unit2
  let list = upsertMistakeRecord([], buildMistakeFromLessonCheck(lesson1, 0));
  list = upsertMistakeRecord(list, buildMistakeFromQuizQuestion(ACADEMY_DATA.quiz.questions[1], 0, 'question-bank'));
  list = upsertMistakeRecord(list, buildMistakeFromCertificateQuestion(hc4, 0));

  const summaryBefore = computeMistakeSummary(list);
  assert.equal(summaryBefore.totalCount, 3);
  assert.equal(summaryBefore.unresolvedCount, 3);
  assert.equal(summaryBefore.resolvedCount, 0);
  assert.equal(summaryBefore.topWeakUnit?.unitName, 'الباب الأول: العناصر الانتقالية');
  assert.equal(summaryBefore.topWeakUnit?.count, 2);

  list = markMistakeResolved(list, hc4.id, true);
  const unresolvedOnly = filterMistakeRecords(list, {
    status: 'unresolved',
    unitId: 'all',
    source: 'all',
  });
  assert.equal(unresolvedOnly.length, 2);

  const certOnly = filterMistakeRecords(list, {
    status: 'all',
    unitId: 'all',
    source: 'certificate-challenge',
  });
  assert.equal(certOnly.length, 1);

  list = removeMistakeRecord(list, hc4.id);
  assert.equal(list.length, 2);
});
