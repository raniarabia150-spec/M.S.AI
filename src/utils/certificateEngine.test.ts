import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HARD_CERTIFICATE_QUESTIONS,
  evaluateCertificateEligibility,
  generateCertificateSerial,
  validateStudentName,
} from './certificateEngine';

test('evaluateCertificateEligibility grants diamond tier at 100% and gold tier at 80%', () => {
  const allCorrect: Record<string, number> = {};
  HARD_CERTIFICATE_QUESTIONS.forEach((q) => {
    allCorrect[q.id] = q.correctIndex;
  });

  const diamond = evaluateCertificateEligibility(allCorrect);
  assert.equal(diamond.passed, true);
  assert.equal(diamond.percentage, 100);
  assert.equal(diamond.tierRank, 'diamond');

  const fourOfFive = { ...allCorrect, [HARD_CERTIFICATE_QUESTIONS[0].id]: 0 };
  const gold = evaluateCertificateEligibility(fourOfFive);
  assert.equal(gold.passed, true);
  assert.equal(gold.percentage, 80);
  assert.equal(gold.tierRank, 'gold');
});

test('evaluateCertificateEligibility rejects scores below 80%', () => {
  const threeOfFive: Record<string, number> = {
    [HARD_CERTIFICATE_QUESTIONS[0].id]: HARD_CERTIFICATE_QUESTIONS[0].correctIndex,
    [HARD_CERTIFICATE_QUESTIONS[1].id]: HARD_CERTIFICATE_QUESTIONS[1].correctIndex,
    [HARD_CERTIFICATE_QUESTIONS[2].id]: HARD_CERTIFICATE_QUESTIONS[2].correctIndex,
    [HARD_CERTIFICATE_QUESTIONS[3].id]: 0,
    [HARD_CERTIFICATE_QUESTIONS[4].id]: 0,
  };
  const failed = evaluateCertificateEligibility(threeOfFive);
  assert.equal(failed.passed, false);
  assert.equal(failed.percentage, 60);
  assert.equal(failed.tierRank, 'none');
});

test('generateCertificateSerial produces deterministic formatted code', () => {
  const s1 = generateCertificateSerial('أحمد صلاح', 1760000000000);
  const s2 = generateCertificateSerial('أحمد صلاح', 1760000000000);
  assert.equal(s1, s2);
  assert.match(s1, /^CHEM-2026-[A-Z0-9]{6}$/);
});

test('validateStudentName rejects short or empty names and accepts valid names', () => {
  assert.equal(validateStudentName('').valid, false);
  assert.equal(validateStudentName('أب').valid, false);
  assert.equal(validateStudentName('أحمد محمود').valid, true);
});
