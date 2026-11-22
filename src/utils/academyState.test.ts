import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_DATA } from '../data/academyData';
import {
  NAV_ITEMS,
  PALETTE_OPTIONS,
  QUIZ_SUB_TABS,
  normalizePalette,
  normalizeQuizSubTab,
  normalizeView,
  shouldAutostart,
} from './academyState';

test('defines all 8 navigation views (with certificates after quiz and mistakes tab), 3 quiz sub-tabs, and 6 color palettes', () => {
  assert.equal(NAV_ITEMS.length, 8);
  assert.equal(NAV_ITEMS[5].id, 'quiz');
  assert.equal(NAV_ITEMS[6].id, 'certificates');
  assert.equal(NAV_ITEMS[7].id, 'mistakes');
  assert.equal(QUIZ_SUB_TABS.length, 3);
  assert.equal(PALETTE_OPTIONS.length, 6);
});

test('normalizeView validates view IDs and falls back to home', () => {
  assert.equal(normalizeView('lessons'), 'lessons');
  assert.equal(normalizeView('openbook'), 'openbook');
  assert.equal(normalizeView('certificates'), 'certificates');
  assert.equal(normalizeView('mistakes'), 'mistakes');
  assert.equal(normalizeView('unknown'), 'home');
  assert.equal(normalizeView(undefined), 'home');
});

test('normalizeQuizSubTab validates quiz sub-tabs and falls back to bank', () => {
  assert.equal(normalizeQuizSubTab('adaptive'), 'adaptive');
  assert.equal(normalizeQuizSubTab('print'), 'print');
  assert.equal(normalizeQuizSubTab('invalid'), 'bank');
});

test('normalizePalette validates palette IDs and falls back to emerald', () => {
  assert.equal(normalizePalette('violet'), 'violet');
  assert.equal(normalizePalette('gold'), 'gold');
  assert.equal(normalizePalette('ocean'), 'ocean');
  assert.equal(normalizePalette('invalid'), 'emerald');
});

test('shouldAutostart detects autostart=1 query param only', () => {
  assert.equal(shouldAutostart('?autostart=1'), true);
  assert.equal(shouldAutostart('?foo=bar&autostart=1'), true);
  assert.equal(shouldAutostart('?autostart=0'), false);
  assert.equal(shouldAutostart(''), false);
});

test('ACADEMY_DATA defines author and designer credits with exact phone numbers', () => {
  const { creators } = ACADEMY_DATA.brand;
  assert.equal(creators.length, 2);

  const author = creators.find((c) => c.id === 'author');
  const designer = creators.find((c) => c.id === 'designer');

  assert.ok(author);
  assert.ok(designer);
  assert.equal(author.name, 'مستر صلاح عيد');
  assert.equal(author.phone, '01007235605');
  assert.equal(author.telHref, 'tel:01007235605');

  assert.equal(designer.name, 'محمد صلاح');
  assert.equal(designer.phone, '01113223341');
  assert.equal(designer.telHref, 'tel:01113223341');
});
