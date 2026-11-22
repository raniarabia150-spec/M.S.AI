import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Play,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { downloadCertificatePng } from '../utils/certificateCanvas';
import {
  CERTIFICATE_PASS_PERCENTAGE,
  HARD_CERTIFICATE_QUESTIONS,
  evaluateCertificateEligibility,
  formatArabicCertificateDate,
  generateCertificateSerial,
  validateStudentName,
  type CertificateEdition,
  type SavedCertificate,
} from '../utils/certificateEngine';
import { CertificateArtworkCard } from './CertificateArtworkCard';
import {
  buildMistakeFromCertificateQuestion,
  type MistakeInput,
} from '../utils/mistakesEngine';

interface CertificatesViewProps {
  active: boolean;
  savedCertificates: SavedCertificate[];
  onSaveCertificate: (cert: SavedCertificate) => void;
  onDeleteCertificate: (id: string) => void;
  onRecordMistake: (input: MistakeInput) => void;
  onNotify: (msg: string, tone?: 'success' | 'info') => void;
}

const EDITION_OPTIONS: ReadonlyArray<{
  id: CertificateEdition;
  label: string;
  desc: string;
  swatch: string;
}> = [
  {
    id: 'royal-gold',
    label: 'الملكي الذهبي',
    desc: 'إطار ذهبي فاخر وخلفية ليلية داكنة',
    swatch: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'emerald-molecular',
    label: 'الزمرد العلمي',
    desc: 'شبكة جزيئية زمردية وهالة سيان',
    swatch: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'platinum-parchment',
    label: 'البلاتين الكلاسيكي',
    desc: 'ورق رسمي عاجي مثالي للطباعة والتأطير',
    swatch: 'from-slate-200 to-amber-200',
  },
];

export function CertificatesView({
  active,
  savedCertificates,
  onSaveCertificate,
  onDeleteCertificate,
  onRecordMistake,
  onNotify,
}: CertificatesViewProps) {
  const [phase, setPhase] = useState<'briefing' | 'challenge' | 'failed' | 'unlocked'>('briefing');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('الصف الثالث الثانوي');
  const [nameError, setNameError] = useState<string | null>(null);
  const [edition, setEdition] = useState<CertificateEdition>('royal-gold');

  // Challenge State
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSec, setElapsedSec] = useState(0);

  // Active Certificate (either newly earned or opened from saved vault)
  const [activeCertificate, setActiveCertificate] = useState<SavedCertificate | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (phase !== 'challenge') return;
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const evaluation = useMemo(() => evaluateCertificateEligibility(answers), [answers]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = HARD_CERTIFICATE_QUESTIONS.length;
  const currentQuestion = HARD_CERTIFICATE_QUESTIONS[qIndex];

  const handleStartChallenge = () => {
    const check = validateStudentName(studentName);
    if (!check.valid) {
      setNameError(check.error ?? 'الرجاء كتابة اسمك الكامل.');
      return;
    }
    setNameError(null);
    setAnswers({});
    setQIndex(0);
    setElapsedSec(0);
    setPhase('challenge');
  };

  const handleSubmitChallenge = () => {
    // Record any wrongly answered challenge questions into the global Mistakes log
    for (const q of HARD_CERTIFICATE_QUESTIONS) {
      const picked = answers[q.id];
      if (picked !== undefined && picked !== q.correctIndex) {
        onRecordMistake(buildMistakeFromCertificateQuestion(q, picked));
      }
    }

    const result = evaluateCertificateEligibility(answers);
    if (!result.passed || result.tierRank === 'none') {
      setPhase('failed');
      onNotify(
        `حصلت على ${result.percentage}% — يلزم ${CERTIFICATE_PASS_PERCENTAGE}% على الأقل لإصدار الشهادة`,
        'info'
      );
      return;
    }

    const now = new Date();
    const serial = generateCertificateSerial(studentName, now.getTime());
    const newCert: SavedCertificate = {
      id: `cert-${now.getTime()}`,
      serial,
      studentName: studentName.trim(),
      studentGrade: studentGrade.trim(),
      edition,
      scoreCorrect: result.correct,
      scoreTotal: result.total,
      percentage: result.percentage,
      tierTitle: result.tierTitle,
      tierRank: result.tierRank,
      issuedDateAr: formatArabicCertificateDate(now),
      createdAtIso: now.toISOString(),
    };
    setActiveCertificate(newCert);
    setPhase('unlocked');
    onNotify(`مبروك! تم تأهيلك وإصدار شهادتك بنسبة ${result.percentage}%`);
  };

  const handleEditionSwitch = (nextEdition: CertificateEdition) => {
    setEdition(nextEdition);
    if (activeCertificate) {
      setActiveCertificate({ ...activeCertificate, edition: nextEdition });
    }
  };

  const handleDownloadPng = async (cert: SavedCertificate) => {
    setDownloading(true);
    try {
      const ok = await downloadCertificatePng(cert);
      if (ok) {
        onNotify('تم حفظ صورة الشهادة عالية الدقة (PNG) على جهازك');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintCertificate = () => {
    document.documentElement.setAttribute('data-print-mode', 'certificate');
    window.print();
    window.setTimeout(() => {
      document.documentElement.removeAttribute('data-print-mode');
    }, 300);
  };

  const isAlreadySaved = activeCertificate
    ? savedCertificates.some((c) => c.serial === activeCertificate.serial)
    : false;

  const formattedTime = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(
    elapsedSec % 60
  ).padStart(2, '0')}`;

  return (
    <section
      id="view-certificates"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8`}
    >
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black aurora-text">
            شهادات التقدير والتفوّق العلمي
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            اجتز تحدي الكيمياء المتقدم (المستوى الصعب بنسبة {CERTIFICATE_PASS_PERCENTAGE}% فأكثر)
            لإصدار شهادتك الفاخرة وحفظها كصورة عالية الدقة
          </p>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
          الشهادات المحفوظة: <span className="theme-text">{savedCertificates.length}</span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PHASE 1: QUALIFICATION BRIEFING & STUDENT REGISTRATION             */}
      {/* ================================================================= */}
      {phase === 'briefing' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl theme-grad-btn flex items-center justify-center text-white shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  تحدي التأهيل للحصول على شهادة التقدير
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  يتكون التحدي من {totalQuestions} أسئلة كيميائية صعبة ومختارة بعناية في التحليل،
                  الاتزان الأيوني، فاراداي، العناصر الانتقالية، والعضوية.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="cert-student-name"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 block"
                >
                  الاسم الكامل (كما سيظهر على الشهادة) *
                </label>
                <input
                  id="cert-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="مثال: أحمد محمود عبد الرحمن"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/60 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
                {nameError && (
                  <p role="alert" className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {nameError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cert-student-grade"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 block"
                >
                  الصف / المرحلة الدراسية (اختياري)
                </label>
                <input
                  id="cert-student-grade"
                  type="text"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  placeholder="مثال: الصف الثالث الثانوي"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/60 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                اختر تصميم إصدار الشهادة المفضّل (يمكنك تغييره لاحقاً أيضاً)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEdition(opt.id)}
                    className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
                      edition === opt.id
                        ? 'theme-border theme-bg-soft'
                        : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-full h-2 rounded-full bg-gradient-to-r ${opt.swatch} mb-2.5`} />
                    <div className="font-extrabold text-xs sm:text-sm">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartChallenge}
              className="theme-grad-btn px-7 py-3.5 rounded-2xl text-white font-extrabold text-sm sm:text-base inline-flex items-center gap-2 transition hover:scale-[1.01] cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>ابدأ تحدي الشهادة الصعب</span>
            </button>
          </div>

          {/* Qualification Rules & Honors Card */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-extrabold text-base">
                <Lock className="w-4 h-4 theme-text" />
                <span>شروط وأوسمة الاستحقاق</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10">
                  <div className="font-extrabold theme-text">100% — وسام التميّز الماسي</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    إجابة صحيحة على جميع الأسئلة الصعبة الخمسة مع ختم التميّز الماسي.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10">
                  <div className="font-extrabold text-amber-600 dark:text-amber-300">
                    80% فأكثر — وسام التفوق الذهبي
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    الإجابة الصحيحة على 4 أسئلة على الأقل لفتح استوديو الشهادة وحفظها.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              تُصدر كل شهادة برمز تحققي فريد (<span className="formula-ltr">CHEM-2026-XXXXXX</span>)
              وتوقيع الإعداد العلمي (<strong className="text-slate-900 dark:text-slate-200">مستر صلاح عيد</strong>)
              وتصميم المنصة (<strong className="text-slate-900 dark:text-slate-200">محمد صلاح</strong>)،
              مع إمكانية التنزيل الفوري كصورة PNG فائقة الدقة والطباعة والحفظ في سجلّك.
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PHASE 2: HARD-LEVEL QUALIFICATION EXAM                             */}
      {/* ================================================================= */}
      {phase === 'challenge' && (
        <div className="no-print max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold">
            <span className="tabular-nums">
              السؤال {qIndex + 1} من {totalQuestions} · {currentQuestion.topic}
            </span>
            <span className="inline-flex items-center gap-1.5 formula-ltr theme-text tabular-nums">
              <Clock className="w-4 h-4" />
              {formattedTime}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full theme-grad-btn transition-all"
              style={{ width: `${((qIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <div className="space-y-4">
            <div className="text-xs font-extrabold text-amber-600 dark:text-amber-300">
              مستوى متقدم · تحدي الشهادة
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold leading-relaxed text-slate-900 dark:text-slate-100">
              {currentQuestion.question}
            </h3>
            {currentQuestion.formula && (
              <code className="inline-block formula-ltr px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold theme-text">
                {currentQuestion.formula}
              </code>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {currentQuestion.options.map((opt, idx) => {
                const picked = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }))
                    }
                    className={`p-4 rounded-xl border text-right text-sm font-bold transition cursor-pointer ${
                      picked
                        ? 'theme-border theme-bg-soft theme-text'
                        : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              disabled={qIndex === 0}
              onClick={() => setQIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-bold disabled:opacity-40 cursor-pointer"
            >
              السابق
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              أجبت عن {answeredCount} / {totalQuestions}
            </span>

            {qIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setQIndex((i) => i + 1)}
                className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer"
              >
                السؤال التالي
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitChallenge}
                className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>اعتماد الإجابات وفحص التأهيل</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PHASE 3A: DID NOT PASS YET — SCIENTIFIC REVIEW & RETRY             */}
      {/* ================================================================= */}
      {phase === 'failed' && (
        <div className="no-print max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-7 h-7 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xl font-black">
                حصلت على {evaluation.percentage}% ({evaluation.correct}/{evaluation.total})
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                يلزم تحقيق نسبة {CERTIFICATE_PASS_PERCENTAGE}% فأكثر في أسئلة المستوى الصعب لإصدار
                شهادة التقدير. راجع التفسيرات العلمية بالأسفل ثم أعد المحاولة!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {HARD_CERTIFICATE_QUESTIONS.map((q, idx) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border space-y-1.5 text-sm ${
                    isCorrect
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : 'border-rose-500/35 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-extrabold">
                    <span>
                      س{idx + 1}: {q.topic}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> صحيحة
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> إجابة خاطئة
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>الإجابة الصحيحة ({q.options[q.correctIndex]}):</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStartChallenge}
              className="theme-grad-btn px-6 py-3 rounded-xl text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة تحدي الشهادة</span>
            </button>
            <button
              type="button"
              onClick={() => setPhase('briefing')}
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-white/15 font-bold text-sm cursor-pointer"
            >
              تعديل بيانات الطالب
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PHASE 3B: CERTIFICATE UNLOCKED STUDIO                              */}
      {/* ================================================================= */}
      {phase === 'unlocked' && activeCertificate && (
        <div className="space-y-6">
          {/* Action & Edition Customization Toolbar */}
          <div className="no-print p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 ml-1">
                تبديل التصميم:
              </span>
              {EDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleEditionSwitch(opt.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    activeCertificate.edition === opt.id
                      ? 'theme-border theme-bg-soft theme-text'
                      : 'border-slate-200 dark:border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isAlreadySaved}
                onClick={() => onSaveCertificate(activeCertificate)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition cursor-pointer ${
                  isAlreadySaved
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'theme-grad-btn text-white'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{isAlreadySaved ? 'محفوظة في سجل شهاداتي ✓' : 'حفظ في سجل شهاداتي'}</span>
              </button>

              <button
                type="button"
                disabled={downloading}
                onClick={() => handleDownloadPng(activeCertificate)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 theme-text" />
                <span>{downloading ? 'جاري التجهيز...' : 'تنزيل الشهادة PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCertificate}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={() => setPhase('briefing')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                إصدار شهادة جديدة
              </button>
            </div>
          </div>

          {/* Live Interactive 3D-Tilt Certificate Preview */}
          <div className="max-w-4xl mx-auto">
            <CertificateArtworkCard certificate={activeCertificate} />
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SAVED CERTIFICATES VAULT                                           */}
      {/* ================================================================= */}
      {savedCertificates.length > 0 && (
        <div className="no-print space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              سجل شهاداتي المحفوظة
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              محفوظة محلياً على جهازك لإعادة العرض أو التنزيل في أي وقت
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCertificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="theme-text">
                      {cert.tierRank === 'diamond' ? 'تميّز ماسي' : 'تفوّق ذهبي'} · {cert.percentage}%
                    </span>
                    <code className="formula-ltr text-[11px] text-slate-400">{cert.serial}</code>
                  </div>
                  <div className="font-black text-base text-slate-900 dark:text-slate-100">
                    {cert.studentName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {cert.issuedDateAr}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCertificate(cert);
                      setEdition(cert.edition);
                      setPhase('unlocked');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 py-2 rounded-xl theme-bg-soft theme-text text-xs font-bold cursor-pointer"
                  >
                    عرض الشهادة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(cert)}
                    aria-label={`تنزيل شهادة ${cert.studentName}`}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCertificate(cert.id)}
                    aria-label={`حذف شهادة ${cert.studentName}`}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/15 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
