import { useEffect, useMemo, useRef, useState } from 'react';
import { Atom, BookMarked, BookOpen, CheckSquare, FlaskConical, Layers, Search, X } from 'lucide-react';
import { ACADEMY_DATA } from '../data/academyData';
import { PERIODIC_ELEMENTS } from '../data/periodicTableData';
import type { AcademyViewId } from '../utils/academyState';

export interface CommandJumpTarget {
  view: AcademyViewId;
  lessonId?: string;
  elementSymbol?: string;
  openBookQuery?: string;
}

interface CommandModalProps {
  open: boolean;
  onClose: () => void;
  onJump: (target: CommandJumpTarget) => void;
}

interface SearchRecord {
  id: string;
  title: string;
  subtitle: string;
  kind: 'درس' | 'عنصر' | 'قانون' | 'بطاقة' | 'سؤال';
  target: CommandJumpTarget;
}

export function CommandModal({ open, onClose, onJump }: CommandModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const records = useMemo<SearchRecord[]>(() => {
    const items: SearchRecord[] = [];
    ACADEMY_DATA.lessons.items.forEach((l) => {
      items.push({
        id: `lesson-${l.id}`,
        title: l.title,
        subtitle: `${l.unitName} · ${l.numberLabel}`,
        kind: 'درس',
        target: { view: 'lessons', lessonId: l.id },
      });
    });
    PERIODIC_ELEMENTS.forEach((el) => {
      items.push({
        id: `el-${el.symbol}`,
        title: `${el.nameAr} (${el.symbol}) — العدد الذري ${el.number}`,
        subtitle: `${el.config} · ${el.highlightAr}`,
        kind: 'عنصر',
        target: { view: 'lab', elementSymbol: el.symbol },
      });
    });
    ACADEMY_DATA.openBook.entries.forEach((ob) => {
      items.push({
        id: `ob-${ob.id}`,
        title: ob.title,
        subtitle: ob.formula,
        kind: 'قانون',
        target: { view: 'openbook', openBookQuery: ob.title },
      });
    });
    ACADEMY_DATA.studio.flashcards.forEach((fc) => {
      items.push({
        id: `fc-${fc.id}`,
        title: fc.front,
        subtitle: fc.unit,
        kind: 'بطاقة',
        target: { view: 'studio' },
      });
    });
    ACADEMY_DATA.quiz.questions.forEach((q) => {
      items.push({
        id: `q-${q.id}`,
        title: q.question,
        subtitle: `${q.unit} · ${q.difficulty}`,
        kind: 'سؤال',
        target: { view: 'quiz' },
      });
    });
    return items;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records.slice(0, 8);
    return records
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q) ||
          r.kind.includes(q)
      )
      .slice(0, 10);
  }, [query, records]);

  const renderIcon = (kind: SearchRecord['kind']) => {
    switch (kind) {
      case 'درس':
        return <BookOpen className="w-4 h-4 theme-text shrink-0" />;
      case 'عنصر':
        return <Atom className="w-4 h-4 theme-text shrink-0" />;
      case 'قانون':
        return <BookMarked className="w-4 h-4 theme-text shrink-0" />;
      case 'بطاقة':
        return <Layers className="w-4 h-4 theme-text shrink-0" />;
      case 'سؤال':
        return <CheckSquare className="w-4 h-4 theme-text shrink-0" />;
      default:
        return <FlaskConical className="w-4 h-4 theme-text shrink-0" />;
    }
  };

  return (
    <div
      id="cmdModal"
      role="dialog"
      aria-modal="true"
      aria-label="البحث السريع والأوامر"
      onClick={onClose}
      className={`${
        open ? '' : 'hidden '
      }fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-20`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن درس، عنصر (مثل Fe أو الحديد)، قانون، أو سؤال..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البحث السريع"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              لا توجد نتائج مطابقة لعبارة "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onJump(item.target);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-right hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderIcon(item.kind)}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{item.kind}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
