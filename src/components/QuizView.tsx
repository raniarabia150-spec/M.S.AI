import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Printer,
  XCircle,
} from 'lucide-react';
import { ACADEMY_DATA } from '../data/academyData';
import { QUIZ_SUB_TABS, type QuizSubTabId } from '../utils/academyState';
import {
  buildMistakeFromQuizQuestion,
  type MistakeInput,
} from '../utils/mistakesEngine';
import { AdaptiveQuizPanel } from './AdaptiveQuizPanel';

interface QuizViewProps {
  active: boolean;
  activeSubTab: QuizSubTabId;
  onSwitchSubTab: (sub: QuizSubTabId) => void;
  onFinishExamScore: (pct: number) => void;
  onRecordMistake: (input: MistakeInput) => void;
  onNotify: (msg: string) => void;
}

export function QuizView({
  active,
  activeSubTab,
  onSwitchSubTab,
  onFinishExamScore,
  onRecordMistake,
  onNotify,
}: QuizViewProps) {
  const { heading, subheading, questions, printButtonLabel, paperTitle, paperSubtitle } =
    ACADEMY_DATA.quiz;

  // --- Sub 1: Question Bank ---
  const [bankUnit, setBankUnit] = useState('الكل');
  const [bankLesson, setBankLesson] = useState('الكل');
  const [bankDiff, setBankDiff] = useState('الكل');
  const [bankAnswers, setBankAnswers] = useState<Record<string, number>>({});

  // --- Sub 3: Print Builder ---
  const [customTitle, setCustomTitle] = useState(paperTitle);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>(() =>
    questions.slice(0, 6).map((q) => q.id)
  );

  const units = useMemo(
    () => ['الكل', ...Array.from(new Set(questions.map((q) => q.unit)))],
    [questions]
  );

  const bankLessons = useMemo(() => {
    const scoped = bankUnit === 'الكل' ? questions : questions.filter((q) => q.unit === bankUnit);
    return ['الكل', ...Array.from(new Set(scoped.map((q) => q.lessonTitle)))];
  }, [bankUnit, questions]);

  const filteredBank = useMemo(
    () =>
      questions.filter((q) => {
        const uOk = bankUnit === 'الكل' || q.unit === bankUnit;
        const lOk = bankLesson === 'الكل' || q.lessonTitle === bankLesson;
        const dOk = bankDiff === 'الكل' || q.difficulty === bankDiff;
        return uOk && lOk && dOk;
      }),
    [bankDiff, bankLesson, bankUnit, questions]
  );

  const printableQuestions = useMemo(
    () => questions.filter((q) => selectedPrintIds.includes(q.id)),
    [questions, selectedPrintIds]
  );

  const togglePrintQuestion = (id: string) => {
    setSelectedPrintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="view-quiz"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      <div className="no-print">
        <h2 className="text-2xl sm:text-3xl font-black aurora-text">{heading}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subheading}</p>
      </div>

      {/* التبويبات الفرعية للاختبارات */}
      <div
        id="quizSubTabsBar"
        role="tablist"
        className="flex flex-wrap gap-2 no-print p-1.5 rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit"
      >
        {QUIZ_SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.id}
            onClick={() => onSwitchSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'theme-grad-btn text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* SUB 1: INTERACTIVE QUESTION BANK                                   */}
      {/* ================================================================= */}
      <div
        id="quizSub-bank"
        className={`quiz-sub ${activeSubTab === 'bank' ? '' : 'hidden'} space-y-5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="تصفية حسب الباب"
              value={bankUnit}
              onChange={(e) => {
                setBankUnit(e.target.value);
                setBankLesson('الكل');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer max-w-full"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select
              aria-label="تصفية حسب الدرس"
              value={bankLesson}
              onChange={(e) => setBankLesson(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer max-w-[260px]"
            >
              {bankLessons.map((l) => (
                <option key={l} value={l}>
                  {l === 'الكل' ? 'جميع الدروس' : l}
                </option>
              ))}
            </select>
            <select
              aria-label="تصفية حسب الصعوبة"
              value={bankDiff}
              onChange={(e) => setBankDiff(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
            >
              <option value="الكل">جميع المستويات</option>
              <option value="سهل">سهل</option>
              <option value="متوسط">متوسط</option>
              <option value="متقدم">متقدم</option>
            </select>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            عدد الأسئلة المعروضة: {filteredBank.length}
          </div>
        </div>

        <div className="space-y-4">
          {filteredBank.map((q, idx) => {
            const picked = bankAnswers[q.id];
            const answered = picked !== undefined;
            return (
              <div
                key={q.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    سؤال {idx + 1} · {q.unit} · {q.lessonTitle} · مستوى {q.difficulty}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                  {q.question}
                </h3>
                {q.formula && (
                  <code className="inline-block formula-ltr px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/70 text-xs font-bold theme-text">
                    {q.formula}
                  </code>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isRight = optIdx === q.correctIndex;
                    const isPicked = picked === optIdx;
                    let cls =
                      'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30';
                    if (answered && isRight) {
                      cls =
                        'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
                    } else if (answered && isPicked && !isRight) {
                      cls = 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200';
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          setBankAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          if (optIdx !== q.correctIndex) {
                            onRecordMistake(
                              buildMistakeFromQuizQuestion(q, optIdx, 'question-bank')
                            );
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-right text-sm font-bold flex items-center justify-between gap-2 transition cursor-pointer ${cls}`}
                      >
                        <span>{opt}</span>
                        {answered && isRight && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {answered && isPicked && !isRight && <XCircle className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-extrabold theme-text ml-1.5">التفسير العلمي:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB 2: ADAPTIVE TIMED EXAM SIMULATOR & ANALYTICS                   */}
      {/* ================================================================= */}
      <div
        id="quizSub-adaptive"
        className={`quiz-sub ${
          activeSubTab === 'adaptive' ? '' : 'hidden'
        } glass-panel p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04]`}
      >
        <AdaptiveQuizPanel
          onFinishExamScore={onFinishExamScore}
          onRecordMistake={onRecordMistake}
          onNotify={onNotify}
        />
      </div>

      {/* ================================================================= */}
      {/* SUB 3: CUSTOM PRINTABLE EXAM PAPER BUILDER                         */}
      {/* ================================================================= */}
      <div
        id="quizSub-print"
        className={`quiz-sub ${activeSubTab === 'print' ? '' : 'hidden'} space-y-5`}
      >
        <div
          id="printBuilderControls"
          className="no-print p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <label htmlFor="print-title-input" className="text-xs font-bold block">
                عنوان ورقة الامتحان
              </label>
              <input
                id="print-title-input"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/60 text-sm font-bold"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              <span>إرفاق نموذج الإجابة في صفحة مستقلة</span>
            </label>

            <button
              type="button"
              onClick={() => window.print()}
              className="theme-grad-btn px-5 py-2.5 rounded-xl text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{printButtonLabel}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
            {questions.map((q, idx) => {
              const checked = selectedPrintIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => togglePrintQuestion(q.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                    checked
                      ? 'theme-border theme-bg-soft theme-text'
                      : 'border-slate-200 dark:border-white/15 text-slate-500'
                  }`}
                >
                  س{idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="printableExamPaper"
          className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-white/15 bg-white text-slate-900 shadow-lg"
        >
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
            <h3 className="text-2xl font-black">{customTitle}</h3>
            <p className="text-sm text-slate-600">{paperSubtitle}</p>
            <div className="flex flex-wrap justify-between text-xs font-bold text-slate-700 pt-3">
              <span>اسم الطالب: ....................................................</span>
              <span>التاريخ: .... / .... / 2026</span>
              <span>الدرجة: ...... / {printableQuestions.length}</span>
            </div>
          </div>

          <div className="space-y-5">
            {printableQuestions.map((q, idx) => (
              <div key={q.id} className="print-avoid-break pb-4 border-b border-slate-200 space-y-2">
                <div className="font-extrabold text-sm sm:text-base">
                  {idx + 1}) {q.question}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-800 pr-4">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx}>
                      ({['أ', 'ب', 'ج', 'د'][optIdx]}) {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {includeAnswerKey && printableQuestions.length > 0 && (
            <div className="print-page-break mt-8 pt-6 border-t-2 border-dashed border-slate-400 space-y-3">
              <h4 className="font-black text-lg text-center">نموذج الإجابة والتفسير العلمي</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {printableQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-lg bg-slate-100">
                    <span className="font-black">س{idx + 1}: </span>
                    <span className="font-bold text-emerald-700">
                      {q.options[q.correctIndex]}
                    </span>{' '}
                    — {q.explanation}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
