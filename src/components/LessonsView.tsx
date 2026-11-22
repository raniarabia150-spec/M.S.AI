import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ACADEMY_DATA, type LessonItem } from '../data/academyData';
import {
  buildMistakeFromLessonCheck,
  type MistakeInput,
} from '../utils/mistakesEngine';

export interface HighlightedLessonSection {
  lessonId: string;
  sectionIndex: number;
  sectionTitle: string;
  questionText: string;
}

interface LessonsViewProps {
  active: boolean;
  selectedLessonId: string;
  completedLessons: string[];
  highlightedSection: HighlightedLessonSection | null;
  onSelectLesson: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onRecordMistake: (input: MistakeInput) => void;
  onClearHighlightedSection: () => void;
  onReturnToMistakes: () => void;
  onNotify: (msg: string) => void;
}

const UNIT_FILTERS = [
  { id: 'all', label: 'جميع الأبواب' },
  { id: 'unit1', label: 'الباب الأول: العناصر الانتقالية' },
  { id: 'unit2', label: 'الباب الثاني: الاتزان والكهربية' },
  { id: 'unit3', label: 'الباب الثالث: الكيمياء العضوية' },
] as const;

export function LessonsView({
  active,
  selectedLessonId,
  completedLessons,
  highlightedSection,
  onSelectLesson,
  onToggleComplete,
  onRecordMistake,
  onClearHighlightedSection,
  onReturnToMistakes,
  onNotify,
}: LessonsViewProps) {
  const { heading, subheading, items } = ACADEMY_DATA.lessons;
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [quickAnswers, setQuickAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!active || !highlightedSection) return;
    if (highlightedSection.lessonId !== selectedLessonId) return;
    setUnitFilter('all');
    setSearch('');
    const timer = window.setTimeout(() => {
      const targetEl = document.getElementById(
        `lesson-section-${highlightedSection.lessonId}-${highlightedSection.sectionIndex}`
      );
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [active, highlightedSection, selectedLessonId]);

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesUnit = unitFilter === 'all' || item.unitId === unitFilter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.unitName.toLowerCase().includes(q);
      return matchesUnit && matchesSearch;
    });
  }, [items, search, unitFilter]);

  const activeLesson: LessonItem =
    items.find((l) => l.id === selectedLessonId) ?? items[0];

  const isCompleted = completedLessons.includes(activeLesson.id);
  const selectedQuickAnswer = quickAnswers[activeLesson.id];

  const copyEquation = (eq: string) => {
    navigator.clipboard?.writeText(eq).catch(() => {});
    onNotify('تم نسخ المعادلة الكيميائية إلى الحافظة');
  };

  return (
    <section
      id="view-lessons"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black aurora-text">{heading}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subheading}</p>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
          الإنجاز: <span className="theme-text">{completedLessons.length}</span> / {items.length} دروس مكتملة
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          {UNIT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setUnitFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                unitFilter === f.id
                  ? 'theme-grad-btn text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث داخل الدروس..."
            aria-label="ابحث داخل الدروس"
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
        </div>
      </div>

      {/* Split Curriculum Grid + Interactive Lesson Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lessons List */}
        <div className="lg:col-span-4 space-y-3">
          {filteredLessons.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-center text-sm text-slate-500">
              لا توجد دروس مطابقة لبحثك.
            </div>
          ) : (
            filteredLessons.map((lesson) => {
              const selected = lesson.id === activeLesson.id;
              const done = completedLessons.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                  className={`bento-card w-full text-right p-4 rounded-2xl border transition-all cursor-pointer ${
                    selected
                      ? 'theme-border bg-white dark:bg-white/[0.08] shadow-md dark:shadow-none'
                      : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="theme-text">{lesson.numberLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lesson.level}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{lesson.durationMin} د</span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {lesson.summary}
                      </p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 theme-text shrink-0 mt-0.5" aria-label="درس مكتمل" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Active Lesson Detailed Reader */}
        <article className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] overflow-hidden shadow-sm dark:shadow-none">
          <div className="relative h-52 sm:h-64 w-full bg-slate-950 overflow-hidden">
            <img
              src={activeLesson.coverImage}
              alt={activeLesson.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-6 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold theme-text flex items-center gap-2">
                  <span>{activeLesson.unitName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLesson.numberLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    {activeLesson.durationMin} دقيقة
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {activeLesson.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onToggleComplete(activeLesson.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                    : 'theme-grad-btn text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'تم إتمام الدرس' : 'تحديد الدرس كمكتمل'}</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Learning Objectives */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 theme-text" />
                <span>نواتج التعلم المستهدفة</span>
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {activeLesson.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold theme-text mt-0.5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structured Content Sections */}
            <div className="space-y-6 border-t border-slate-200 dark:border-white/10 pt-6">
              {activeLesson.sections.map((sec, idx) => {
                const isSpotlit =
                  highlightedSection?.lessonId === activeLesson.id &&
                  highlightedSection.sectionIndex === idx;
                return (
                  <div
                    key={idx}
                    id={`lesson-section-${activeLesson.id}-${idx}`}
                    data-highlighted={isSpotlit ? 'true' : 'false'}
                    className={`space-y-3 transition-all ${
                      isSpotlit
                        ? 'p-5 rounded-2xl border-2 border-amber-500/70 bg-amber-500/[0.08] ring-4 ring-amber-500/15'
                        : ''
                    }`}
                  >
                    {isSpotlit && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-amber-500/30">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>هذا هو الجزء الخاص بشرح السؤال الذي أخطأت في حله</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onReturnToMistakes}
                            className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>العودة إلى أخطائي</span>
                          </button>
                          <button
                            type="button"
                            aria-label="إخفاء تمييز الشرح"
                            onClick={onClearHighlightedSection}
                            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 theme-text shrink-0" />
                      <span>{sec.title}</span>
                    </h4>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      {sec.body}
                    </p>
                    {sec.equation && (
                      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
                        <code className="formula-ltr text-xs sm:text-sm font-bold text-slate-900 dark:text-cyan-300 overflow-x-auto">
                          {sec.equation}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyEquation(sec.equation!)}
                          aria-label="نسخ المعادلة"
                          title="نسخ المعادلة"
                          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Exam Tip */}
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                <Lightbulb className="w-4 h-4" />
                <span>ملاحظة امتحانية هامة</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {activeLesson.examTip}
              </p>
            </div>

            {/* Embedded Quick Comprehension Check */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-6 space-y-4">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                اختبر فهمك للدرس
              </h4>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {activeLesson.quickCheck.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLesson.quickCheck.options.map((opt, optIdx) => {
                  const answered = selectedQuickAnswer !== undefined;
                  const isPicked = selectedQuickAnswer === optIdx;
                  const isRight = optIdx === activeLesson.quickCheck.correctIndex;
                  let btnStyle =
                    'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30 text-slate-800 dark:text-slate-200';
                  if (answered && isRight) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
                  } else if (answered && isPicked && !isRight) {
                    btnStyle = 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200';
                  }
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => {
                        setQuickAnswers((prev) => ({ ...prev, [activeLesson.id]: optIdx }));
                        if (optIdx !== activeLesson.quickCheck.correctIndex) {
                          onRecordMistake(buildMistakeFromLessonCheck(activeLesson, optIdx));
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-right text-sm font-bold transition cursor-pointer ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selectedQuickAnswer !== undefined && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-extrabold theme-text ml-1.5">
                    {selectedQuickAnswer === activeLesson.quickCheck.correctIndex
                      ? 'إجابة صحيحة:'
                      : 'التفسير الصحيح:'}
                  </span>
                  {activeLesson.quickCheck.explanation}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
