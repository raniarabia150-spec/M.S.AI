import { Moon, Palette, Search, Sun } from 'lucide-react';
import type { ACADEMY_DATA } from '../data/academyData';
import {
  NAV_ITEMS,
  PALETTE_OPTIONS,
  type AcademyViewId,
  type PaletteId,
} from '../utils/academyState';

interface HeaderProps {
  brand: (typeof ACADEMY_DATA)['brand'];
  activeView: AcademyViewId;
  palette: PaletteId;
  isDark: boolean;
  unresolvedMistakesCount: number;
  onSwitchView: (view: AcademyViewId) => void;
  onSelectPalette: (palette: PaletteId) => void;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
}

export function Header({
  brand,
  activeView,
  palette,
  isDark,
  unresolvedMistakesCount,
  onSwitchView,
  onSelectPalette,
  onToggleTheme,
  onOpenCommand,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 glass-panel transition-colors overflow-x-clip">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => onSwitchView('home')}
          className="flex items-center gap-2.5 sm:gap-3 text-right shrink-0 cursor-pointer group min-w-0"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black border border-cyan-400/45 shadow-[0_0_16px_rgba(6,182,212,0.28)] overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:border-cyan-300 shrink-0">
            <img
              src={brand.logoUrl}
              alt={`شعار ${brand.name}`}
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="hidden sm:block">
            <div className="font-extrabold text-sm sm:text-base whitespace-nowrap text-slate-900 dark:text-slate-100">
              {brand.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {brand.credits}
            </div>
          </div>
          <div className="sm:hidden font-extrabold text-xs whitespace-nowrap text-slate-900 dark:text-slate-100">
            {brand.name}
          </div>
        </button>

        {/* أزرار التنقل الرئيسية */}
        <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            const showMistakeBadge = item.id === 'mistakes' && unresolvedMistakesCount > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSwitchView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-btn relative px-2.5 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'theme-bg-soft theme-text'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {showMistakeBadge && (
                  <span
                    aria-label={`${unresolvedMistakesCount} أخطاء قيد المراجعة`}
                    className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black leading-none tabular-nums"
                  >
                    {unresolvedMistakesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* البحث السريع، مبدّل الألوان، والوضع الليلي */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="فتح البحث السريع"
            title="البحث السريع (Ctrl+K)"
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xl:inline whitespace-nowrap">بحث سريع</span>
            <kbd className="hidden xl:inline font-mono text-[10px] opacity-70">Ctrl+K</kbd>
          </button>

          <div className="relative flex items-center">
            <Palette className="w-3.5 h-3.5 absolute right-2 sm:right-2.5 pointer-events-none theme-text" />
            <select
              aria-label="اختيار لوحة الألوان"
              value={palette}
              onChange={(e) => onSelectPalette(e.target.value as PaletteId)}
              className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl pr-7 sm:pr-8 pl-2 sm:pl-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {PALETTE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="تبديل الوضع"
            aria-label="تبديل الوضع"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* شريط تنقل سريع للموبايل والتابلت */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 pb-2.5 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const showMistakeBadge = item.id === 'mistakes' && unresolvedMistakesCount > 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitchView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'theme-border theme-text theme-bg-soft'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{item.label}</span>
              {showMistakeBadge && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-black leading-none tabular-nums">
                  {unresolvedMistakesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
