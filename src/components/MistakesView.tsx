import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  MISTAKE_SOURCE_LABELS,
  computeMistakeSummary,
  filterMistakeRecords,
  type MistakeRecord,
  type MistakeSource,
} from '../utils/mistakesEngine';
import type { AcademyViewId } from '../utils/academyState';

export interface ExplanationJumpTarget {
  lessonId: string;
  sectionIndex: number;
  sectionTitle: string;
  questionText: string;
}

interface MistakesViewProps {
  active: boolean;
  mistakes: MistakeRecord[];
  onJumpToExplanation: (target: ExplanationJumpTarget) => void;
  onToggleResolved: (questionId: string, resolved: boolean) => void;
  onDeleteMistake: (questionId: string) => void;
  onClearAllMistakes: () => void;
  onNavigate: (view: AcademyViewId) => void;
  onNotify: (msg: string, tone?: 'success' | 'info') => void;
}

export function MistakesView({
  active,
  mistakes,
  onJumpToExplanation,
  onToggleResolved,
  onDeleteMistake,
  onClearAllMistakes,
  onNavigate,
  onNotify,
}: MistakesViewProps) {
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'resolved' | 'all'>('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'unit1' | 'unit2' | 'unit3'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | MistakeSource>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<Record<string, number>>({});

  const summary = useMemo(() => computeMistakeSummary(mistakes), [mistakes]);

  const filtered = useMemo(
    () =>
      filterMistakeRecords(mistakes, {
        status: statusFilter,
        unitId: unitFilter,
        source: sourceFilter,
      }),
    [mistakes, sourceFilter, statusFilter, unitFilter]
  );

  const handleInlineRetryPick = (record: MistakeRecord, optIdx: number) => {
    setRetryFeedback((prev) => ({ ...prev, [record.questionId]: optIdx }));
    if (optIdx === record.correctIndex) {
      onToggleResolved(record.questionId, true);
      onNotify('أحسنت! أجبت بشكل صحيح وتم نقل السؤال إلى قائمة الأسئلة المُتقنة');
    } else {
      onNotify('حاول مرة أخرى أو انتقل لشرح هذا الجزء في الدرس لتثبيت المفهوم', 'info');
    }
  };

  return (
    <section
      id="view-mistakes"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black aurora-text">
            الأسئلة التي أخطأت في حلها
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            يُحفظ هنا تلقائياً كل سؤال تجيبه بشكل خاطئ داخل المنصة مع زر مباشر للانتقال إلى الجزء الخاص بشرحه في الدرس
          </p>
        </div>

        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={onClearAllMistakes}
            className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل بالكامل</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-rose-500/25 bg-white dark:bg-white/[0.04] space-y-1">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>أخطاء قيد المراجعة</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {summary.unresolvedCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            أسئلة تحتاج مراجعة الشرح وإعادة الحل
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/25 bg-white dark:bg-white/[0.04] space-y-1">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>أخطاء تم إتقانها</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {summary.resolvedCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            أسئلة أعدت حلها بنجاح بعد المراجعة
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-1">
          <div className="text-xs font-bold theme-text flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>أكثر باب يحتاج تركيزاً</span>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate pt-1">
            {summary.topWeakUnit ? summary.topWeakUnit.unitName : 'لا توجد نقاط ضعف حالياً'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {summary.topWeakUnit
              ? `${summary.topWeakUnit.count} أسئلة قيد المراجعة في هذا الباب`
              : 'ممتاز! واصل التدريب للحفاظ على مستواك'}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {mistakes.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl theme-bg-soft mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8 theme-text" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              لا توجد أخطاء مسجّلة حتى الآن
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              أي سؤال تجيبه بشكل خاطئ في الدروس أو بنك الأسئلة أو الاختبار التكيّفي أو تحدي الشهادة سيظهر هنا تلقائياً مع رابط مباشر لفقرة شرحه داخل الدرس.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-extrabold cursor-pointer"
            >
              اذهب إلى مركز الاختبارات
            </button>
            <button
              type="button"
              onClick={() => onNavigate('lessons')}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-bold hover:border-slate-400 cursor-pointer"
            >
              تصفّح الدروس والشروحات
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04]">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="تصفية حالة الأخطاء">
              {(
                [
                  { id: 'all', label: `الكل (${summary.totalCount})` },
                  { id: 'unresolved', label: `قيد المراجعة (${summary.unresolvedCount})` },
                  { id: 'resolved', label: `تم إتقانها (${summary.resolvedCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'theme-grad-btn text-white'
                      : 'border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                aria-label="تصفية الأخطاء حسب الباب"
                value={unitFilter}
                onChange={(e) =>
                  setUnitFilter(e.target.value as 'all' | 'unit1' | 'unit2' | 'unit3')
                }
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900 text-xs font-bold cursor-pointer"
              >
                <option value="all">جميع الأبواب</option>
                <option value="unit1">الباب الأول: العناصر الانتقالية</option>
                <option value="unit2">الباب الثاني: الاتزان والكهربية</option>
                <option value="unit3">الباب الثالث: الكيمياء العضوية</option>
              </select>

              <select
                aria-label="تصفية الأخطاء حسب المصدر"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | MistakeSource)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900 text-xs font-bold cursor-pointer"
              >
                <option value="all">جميع مصادر الأسئلة</option>
                {(Object.keys(MISTAKE_SOURCE_LABELS) as MistakeSource[]).map((src) => (
                  <option key={src} value={src}>
                    {MISTAKE_SOURCE_LABELS[src]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mistake Cards */}
          {filtered.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 text-center text-sm font-bold text-slate-500">
              لا توجد أسئلة مطابقة للفلاتر المختارة.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rec) => {
                const isRetrying = retryingId === rec.questionId;
                const retryPick = retryFeedback[rec.questionId];

                return (
                  <article
                    key={rec.questionId}
                    className={`p-5 sm:p-6 rounded-2xl border bg-white dark:bg-white/[0.04] space-y-4 transition ${
                      rec.resolved
                        ? 'border-emerald-500/35'
                        : 'border-rose-500/25'
                    }`}
                  >
                    {/* Top Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                        <span className="px-2.5 py-1 rounded-lg theme-bg-soft theme-text">
                          {rec.sourceLabel}
                        </span>
                        {rec.difficulty && (
                          <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300">
                            {rec.difficulty}
                          </span>
                        )}
                        {rec.wrongCount > 1 && (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 tabular-nums">
                            تكرر الخطأ {rec.wrongCount} مرات
                          </span>
                        )}
                        {rec.resolved && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم الإتقان</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleResolved(rec.questionId, !rec.resolved)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-bold hover:border-emerald-500/50 transition cursor-pointer"
                        >
                          {rec.resolved ? 'إعادة لقائمة المراجعة' : 'تمييز كمُتقن ✓'}
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف السؤال من سجل الأخطاء`}
                          onClick={() => onDeleteMistake(rec.questionId)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-slate-500 hover:text-rose-500 hover:border-rose-500/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Linked Curriculum Location */}
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                      <span>{rec.unitName}</span>
                      <span aria-hidden="true">←</span>
                      <span>{rec.lessonTitle}</span>
                      <span aria-hidden="true">←</span>
                      <span className="theme-text font-extrabold">
                        جزء الشرح: {rec.sectionTitle}
                      </span>
                    </div>

                    {/* Question & Optional Formula */}
                    <div className="space-y-2.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {rec.question}
                      </h3>
                      {rec.formula && (
                        <code className="inline-block formula-ltr px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-xs font-bold theme-text">
                          {rec.formula}
                        </code>
                      )}
                    </div>

                    {/* Wrong vs Right Comparison OR Inline Retry Mode */}
                    {isRetrying ? (
                      <div className="p-4 rounded-xl border theme-border bg-slate-50 dark:bg-slate-950/60 space-y-3">
                        <div className="flex items-center justify-between text-xs font-extrabold theme-text">
                          <span>أعد اختيار الإجابة الصحيحة الآن:</span>
                          <button
                            type="button"
                            onClick={() => setRetryingId(null)}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                          >
                            إغلاق
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {rec.options.map((opt, idx) => {
                            const isPicked = retryPick === idx;
                            const isRight = idx === rec.correctIndex;
                            let cls =
                              'border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-slate-400';
                            if (retryPick !== undefined && isRight) {
                              cls =
                                'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
                            } else if (retryPick !== undefined && isPicked && !isRight) {
                              cls =
                                'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200';
                            }
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleInlineRetryPick(rec, idx)}
                                className={`p-3 rounded-xl border text-right text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition cursor-pointer ${cls}`}
                              >
                                <span>{opt}</span>
                                {retryPick !== undefined && isRight && (
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                )}
                                {retryPick !== undefined && isPicked && !isRight && (
                                  <XCircle className="w-4 h-4 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-bold">
                        <div className="p-3.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[11px] opacity-80 mb-0.5">إجابتك السابقة:</div>
                            <div>{rec.options[rec.selectedOptionIndex] ?? '—'}</div>
                          </div>
                          <XCircle className="w-5 h-5 shrink-0" />
                        </div>

                        <div className="p-3.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[11px] opacity-80 mb-0.5">الإجابة الصحيحة:</div>
                            <div>{rec.options[rec.correctIndex] ?? '—'}</div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                        </div>
                      </div>
                    )}

                    {/* Scientific Explanation */}
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-extrabold theme-text ml-1.5">التفسير العلمي:</span>
                      {rec.explanation}
                    </div>

                    {/* Action Footer: Jump Directly to Lesson Explanation Section */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          onJumpToExplanation({
                            lessonId: rec.lessonId,
                            sectionIndex: rec.sectionIndex,
                            sectionTitle: rec.sectionTitle,
                            questionText: rec.question,
                          })
                        }
                        className="theme-grad-btn px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>انتقل إلى شرح هذا الجزء في الدرس</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRetryingId(isRetrying ? null : rec.questionId);
                          setRetryFeedback((prev) => {
                            const copy = { ...prev };
                            delete copy[rec.questionId];
                            return copy;
                          });
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:border-slate-400 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isRetrying ? 'إخفاء إعادة المحاولة' : 'أعد حل السؤال الآن'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
