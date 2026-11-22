export type AcademyViewId =
  | 'home'
  | 'lessons'
  | 'lab'
  | 'openbook'
  | 'studio'
  | 'quiz'
  | 'certificates'
  | 'mistakes';
export type QuizSubTabId = 'bank' | 'adaptive' | 'print';
export type PaletteId = 'emerald' | 'royal' | 'violet' | 'gold' | 'ruby' | 'ocean';

export interface NavItem {
  id: AcademyViewId;
  label: string;
}

export interface PaletteOption {
  id: PaletteId;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'lessons', label: 'الدروس' },
  { id: 'lab', label: 'المختبر' },
  { id: 'openbook', label: 'الكتاب المفتوح' },
  { id: 'studio', label: 'الاستوديو' },
  { id: 'quiz', label: 'الاختبارات' },
  { id: 'certificates', label: 'الشهادات' },
  { id: 'mistakes', label: 'أخطائي' },
];

export const QUIZ_SUB_TABS: readonly { id: QuizSubTabId; label: string }[] = [
  { id: 'bank', label: 'بنك الأسئلة' },
  { id: 'adaptive', label: 'الاختبار التكيّفي' },
  { id: 'print', label: 'نموذج الطباعة' },
];

export const PALETTE_OPTIONS: readonly PaletteOption[] = [
  { id: 'emerald', label: 'Emerald' },
  { id: 'royal', label: 'Royal' },
  { id: 'violet', label: 'Violet' },
  { id: 'gold', label: 'Gold' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'ocean', label: 'Ocean' },
];

const VALID_VIEWS = new Set<string>(NAV_ITEMS.map((item) => item.id));
const VALID_QUIZ_SUBS = new Set<string>(QUIZ_SUB_TABS.map((item) => item.id));
const VALID_PALETTES = new Set<string>(PALETTE_OPTIONS.map((item) => item.id));

export function normalizeView(value: string | null | undefined): AcademyViewId {
  if (value && VALID_VIEWS.has(value)) {
    return value as AcademyViewId;
  }
  return 'home';
}

export function normalizeQuizSubTab(value: string | null | undefined): QuizSubTabId {
  if (value && VALID_QUIZ_SUBS.has(value)) {
    return value as QuizSubTabId;
  }
  return 'bank';
}

export function normalizePalette(value: string | null | undefined): PaletteId {
  if (value && VALID_PALETTES.has(value)) {
    return value as PaletteId;
  }
  return 'emerald';
}

export function shouldAutostart(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('autostart') === '1';
}
