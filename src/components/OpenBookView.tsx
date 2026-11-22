import { useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, Copy, Search, Thermometer } from 'lucide-react';
import { ACADEMY_DATA } from '../data/academyData';

interface OpenBookViewProps {
  active: boolean;
  initialQuery: string;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES = [
  'الكل',
  'المثبتة',
  'الحسابات الكيميائية',
  'العناصر الانتقالية',
  'الاتزان الكيميائي',
  'الكيمياء الكهربية',
  'الكيمياء العضوية',
] as const;

export function OpenBookView({
  active,
  initialQuery,
  pinnedIds,
  onTogglePin,
  onNotify,
}: OpenBookViewProps) {
  const { heading, subheading, entries } = ACADEMY_DATA.openBook;
  const [category, setCategory] = useState<string>('الكل');
  const [query, setQuery] = useState(initialQuery);
  const [celsius, setCelsius] = useState<string>('25');
  const [atm, setAtm] = useState<string>('1');

  const effectiveQuery = query || initialQuery;

  const filtered = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category === 'المثبتة' && !pinnedIds.includes(entry.id)) return false;
      if (category !== 'الكل' && category !== 'المثبتة' && entry.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.formula.toLowerCase().includes(q) ||
        entry.variables.toLowerCase().includes(q) ||
        entry.note.toLowerCase().includes(q)
      );
    });
  }, [category, effectiveQuery, entries, pinnedIds]);

  const parsedC = Number.parseFloat(celsius);
  const kelvinVal = Number.isFinite(parsedC) ? (parsedC + 273.15).toFixed(2) : '—';
  const parsedAtm = Number.parseFloat(atm);
  const kpaVal = Number.isFinite(parsedAtm) ? (parsedAtm * 101.325).toFixed(2) : '—';
  const mmhgVal = Number.isFinite(parsedAtm) ? (parsedAtm * 760).toFixed(1) : '—';

  const copyFormula = (formula: string) => {
    navigator.clipboard?.writeText(formula).catch(() => {});
    onNotify('تم نسخ القانون إلى الحافظة');
  };

  return (
    <section
      id="view-openbook"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black aurora-text">{heading}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subheading}</p>
        </div>
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
          القوانين المثبتة للمراجعة: <span className="theme-text">{pinnedIds.length}</span>
        </div>
      </div>

      {/* Category Filter + Instant Search */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                category === cat
                  ? 'theme-grad-btn text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القوانين والمعادلات..."
            aria-label="ابحث في الكتاب المفتوح"
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
        </div>
      </div>

      {/* Formula Reference Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-center text-sm text-slate-500">
          لا توجد قوانين مطابقة للتصفية الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((entry) => {
            const pinned = pinnedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                className="bento-card glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm dark:shadow-none flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold theme-text mb-1">{entry.category}</div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                        {entry.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyFormula(entry.formula)}
                        aria-label={`نسخ قانون ${entry.title}`}
                        title="نسخ القانون"
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePin(entry.id)}
                        aria-label={pinned ? `إلغاء تثبيت ${entry.title}` : `تثبيت ${entry.title}`}
                        title={pinned ? 'إلغاء التثبيت' : 'تثبيت في ورقتي'}
                        className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer ${
                          pinned ? 'theme-text' : 'text-slate-400'
                        }`}
                      >
                        {pinned ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 overflow-x-auto">
                    <code className="formula-ltr text-xs sm:text-sm font-bold text-slate-900 dark:text-cyan-300">
                      {entry.formula}
                    </code>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {entry.variables}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/10 pt-3">
                  {entry.note}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Scientific Constants & Live Unit Converter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-base text-slate-900 dark:text-slate-100">
            <Thermometer className="w-4 h-4 theme-text" />
            <span>محوّل الوحدات الفوري (الحرارة والضغط)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="celsius-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                درجة الحرارة (°C)
              </label>
              <input
                id="celsius-input"
                type="number"
                value={celsius}
                onChange={(e) => setCelsius(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/60 formula-ltr text-sm font-bold"
              />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                الكلفن (K): <span className="theme-text formula-ltr">{kelvinVal} K</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="atm-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                الضغط الجوي (atm)
              </label>
              <input
                id="atm-input"
                type="number"
                step="0.1"
                value={atm}
                onChange={(e) => setAtm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/60 formula-ltr text-sm font-bold"
              />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                <span className="theme-text formula-ltr">{kpaVal} kPa</span> ·{' '}
                <span className="formula-ltr">{mmhgVal} mmHg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            الثوابت الفيزيائية والكيميائية القياسية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">عدد أفوجادرو</span>
              <span className="formula-ltr font-bold theme-text">6.022 × 10²³ mol⁻¹</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">ثابت فاراداي (F)</span>
              <span className="formula-ltr font-bold theme-text">96,500 C/mol</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">ثابت الغازات (R)</span>
              <span className="formula-ltr font-bold theme-text">0.0821 L·atm/mol·K</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">الحجم المولي (STP)</span>
              <span className="formula-ltr font-bold theme-text">22.4 L/mol</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
