import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaniellCellEMF,
  calculateMolarMass,
  calculateTitrationPH,
  checkEquationBalance,
  computeQuizAnalytics,
} from './chemistryEngine';

test('calculateMolarMass computes simple and nested formulas accurately', () => {
  const water = calculateMolarMass('H2O');
  assert.equal(water.valid, true);
  assert.ok(Math.abs(water.molarMass - 18.015) < 0.01);

  const caoh2 = calculateMolarMass('Ca(OH)2');
  assert.equal(caoh2.valid, true);
  assert.ok(Math.abs(caoh2.molarMass - 74.092) < 0.02);

  const fe2so43 = calculateMolarMass('Fe2(SO4)3');
  assert.equal(fe2so43.valid, true);
  assert.ok(Math.abs(fe2so43.molarMass - 399.858) < 0.1);
});

test('calculateMolarMass rejects invalid symbols and unbalanced parentheses', () => {
  const badSym = calculateMolarMass('Zz2O');
  assert.equal(badSym.valid, false);
  assert.ok(badSym.error);

  const badParen = calculateMolarMass('Ca(OH2');
  assert.equal(badParen.valid, false);
});

test('calculateTitrationPH gives acidic before, neutral at, and alkaline after equivalence', () => {
  assert.ok(calculateTitrationPH(0) < 1.5);
  assert.equal(calculateTitrationPH(25), 7.0);
  assert.ok(calculateTitrationPH(35) > 12.0);
});

test('calculateDaniellCellEMF equals 1.10V under standard conditions and increases with Cu2+', () => {
  assert.equal(calculateDaniellCellEMF(1, 1, 25), 1.1);
  assert.ok(calculateDaniellCellEMF(0.1, 2.0, 25) > 1.1);
  assert.ok(calculateDaniellCellEMF(2.0, 0.1, 25) < 1.1);
});

test('checkEquationBalance detects unbalanced and balanced stoichiometric states', () => {
  const species = [
    { formula: 'Fe', side: 'reactant' as const },
    { formula: 'O2', side: 'reactant' as const },
    { formula: 'Fe2O3', side: 'product' as const },
  ];
  assert.equal(checkEquationBalance(species, [1, 1, 1]).balanced, false);
  assert.equal(checkEquationBalance(species, [4, 3, 2]).balanced, true);
});

test('computeQuizAnalytics aggregates scores and per-unit breakdown', () => {
  const qs = [
    { id: 'q1', unit: 'العناصر الانتقالية', correctIndex: 1 },
    { id: 'q2', unit: 'العناصر الانتقالية', correctIndex: 0 },
    { id: 'q3', unit: 'الكيمياء العضوية', correctIndex: 2 },
  ];
  const stats = computeQuizAnalytics(qs, { q1: 1, q2: 2, q3: 2 });
  assert.equal(stats.correct, 2);
  assert.equal(stats.total, 3);
  assert.equal(stats.percentage, 67);
  assert.equal(stats.byUnit.length, 2);
});
