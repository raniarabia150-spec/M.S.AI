import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  History,
  Layers,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ACADEMY_DATA,
  type QuizDifficulty,
  type QuizQuestion,
} from '../data/academyData';
import {
  DEFAULT_ADAPTIVE_CONFIG,
  buildStaticExamSession,
  computeDetailedExamReport,
  computeEliminatedOptions,
  estimateExamDurationSeconds,
  filterCandidateQuestions,
  formatSecondsClock,
  getLessonsForUnit,
  getUnitCatalog,
  pickAdaptiveNextQuestion,
  stepAdaptiveDifficulty,
  type AdaptiveDifficultyOption,
  type AdaptiveExamStyle,
  type AdaptiveQuizConfig,
  type AdaptiveSkillOption,
  type AdaptiveTimerMode,
  type AdaptiveUnitOption,
  type ExamAttemptRecord,
} from '../utils/adaptiveQuizEngine';
import {
  buildMistakeFromQuizQuestion,
  type MistakeInput,
} from '../utils/mistakesEngine';

const HISTORY_STORAGE_KEY = 'chem_adaptive_history';
const MAX_LIFELINES_5050 = 2;
const ARABIC_OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

interface AdaptiveQuizPanelProps {
  onFinishExamScore: (pct: number) => void;
  onRecordMistake: (input: MistakeInput) => void;
  onNotify: (msg: string) => void;
}

function readStoredHistory(): ExamAttemptRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExamAttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function difficultyBadgeStyle(diff: QuizDifficulty): string {
  if (diff === 'سهل') {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  }
  if (diff === 'متوسط') {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  }
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
}

export function AdaptiveQuizPanel({
  onFinishExamScore,
  onRecordMistake,
  onNotify,
}: AdaptiveQuizPanelProps) {
  const allQuestions = ACADEMY_DATA.quiz.questions;
  const allLessons = ACADEMY_DATA.lessons.items;

  // --- Configuration & History State ---
  const [config, setConfig] = useState<AdaptiveQuizConfig>(DEFAULT_ADAPTIVE_CONFIG);
  const [history, setHistory] = useState<ExamAttemptRecord[]>(() => readStoredHistory());

  // --- Active Exam Session State ---
  const [phase, setPhase] = useState<'setup' | 'running' | 'results'>('setup');
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [sessionPool, setSessionPool] = useState<QuizQuestion[]>([]);
  const [targetSessionLength, setTargetSessionLength] = useState(0);
  const [isRemedialMode, setIsRemedialMode] = useState(false);

  const [examIdx, setExamIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [eliminatedMap, setEliminatedMap] = useState<Record<string, number[]>>({});
  const [lifelinesRemaining, setLifelinesRemaining] = useState(MAX_LIFELINES_5050);

  // Real-time adaptive tracking
  const [adaptiveLevel, setAdaptiveLevel] = useState<QuizDifficulty>('متوسط');
  const [adaptiveTrend, setAdaptiveTrend] = useState<'up' | 'down' | 'steady'>('steady');
  const [streak, setStreak] = useState(0);

  // Timers
  const [elapsedSec, setElapsedSec] = useState(0);
  const [questionRemainingSec, setQuestionRemainingSec] = useState(0);
  const [examRemainingSec, setExamRemainingSec] = useState(0);
  const [paused, setPaused] = useState(false);

  // Results UI tabs
  const [analyticsTab, setAnalyticsTab] = useState<'unit' | 'lesson' | 'difficulty' | 'skill'>('unit');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'flagged'>('all');

  const finishRef = useRef<() => void>(() => {});

  // Persist history
  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage quota issues
    }
  }, [history]);

  // Derived curriculum catalogs
  const unitCatalog = useMemo(
    () => getUnitCatalog(allLessons, allQuestions),
    [allLessons, allQuestions]
  );

  const availableLessons = useMemo(
    () => getLessonsForUnit(allLessons, config.unitId),
    [allLessons, config.unitId]
  );

  const knownWeakLessonIds = useMemo(() => {
    const ids = new Set<string>();
    history.slice(0, 5).forEach((rec) => rec.weakLessonIds.forEach((id) => ids.add(id)));
    return Array.from(ids);
  }, [history]);

  const matchingQuestions = useMemo(
    () => filterCandidateQuestions(allQuestions, config, knownWeakLessonIds),
    [allQuestions, config, knownWeakLessonIds]
  );

  const effectiveQuestionCount = useMemo(() => {
    if (matchingQuestions.length === 0) return 0;
    if (config.questionCount === 0) return matchingQuestions.length;
    return Math.min(config.questionCount, matchingQuestions.length);
  }, [config.questionCount, matchingQuestions.length]);

  const estimatedSeconds = useMemo(
    () =>
      estimateExamDurationSeconds(
        effectiveQuestionCount,
        config.timerMode,
        config.secondsPerQuestion
      ),
    [config.secondsPerQuestion, config.timerMode, effectiveQuestionCount]
  );

  const currentQuestion = sessionQuestions[examIdx];

  const report = useMemo(() => {
    const hintsUsed = Object.values(revealedHints).filter(Boolean).length;
    const lifelinesUsed = Object.keys(eliminatedMap).length;
    return computeDetailedExamReport(
      sessionQuestions,
      answers,
      elapsedSec,
      hintsUsed,
      lifelinesUsed
    );
  }, [answers, elapsedSec, eliminatedMap, revealedHints, sessionQuestions]);

  const scopeLabel = useMemo(() => {
    if (isRemedialMode) return 'مراجعة أخطاء المحاولة السابقة';
    if (config.lessonId !== 'all') {
      const found = allLessons.find((l) => l.id === config.lessonId);
      return found ? `${found.numberLabel}: ${found.title}` : 'درس محدد';
    }
    if (config.unitId !== 'all') {
      const found = unitCatalog.find((u) => u.unitId === config.unitId);
      return found ? found.unitName : 'وحدة محددة';
    }
    return 'المنهج الشامل (جميع الوحدات)';
  }, [allLessons, config.lessonId, config.unitId, isRemedialMode, unitCatalog]);

  const difficultyLabel = useMemo(() => {
    if (config.difficulty === 'adaptive') return 'تكيّفي ذكي';
    if (config.difficulty === 'all') return 'جميع المستويات';
    return `مستوى ${config.difficulty}`;
  }, [config.difficulty]);

  const finalizeExam = useCallback(
    (finalQuestions: QuizQuestion[], finalAnswers: Record<string, number>, totalSec: number) => {
      const hintsUsed = Object.values(revealedHints).filter(Boolean).length;
      const lifelinesUsed = Object.keys(eliminatedMap).length;
      const stats = computeDetailedExamReport(
        finalQuestions,
        finalAnswers,
        totalSec,
        hintsUsed,
        lifelinesUsed
      );

      setPhase('results');
      setPaused(false);
      setAnalyticsTab('unit');
      setReviewFilter('all');
      onFinishExamScore(stats.percentage);

      // In official exam mode, record all wrongly answered questions upon submission
      if (config.examStyle === 'exam') {
        for (const q of finalQuestions) {
          const picked = finalAnswers[q.id];
          if (picked !== undefined && picked !== q.correctIndex) {
            onRecordMistake(buildMistakeFromQuizQuestion(q, picked, 'adaptive-quiz'));
          }
        }
      }

      const attempt: ExamAttemptRecord = {
        id: `att-${Date.now()}`,
        dateIso: new Date().toISOString(),
        scopeLabel,
        difficultyLabel,
        examStyle: config.examStyle,
        percentage: stats.percentage,
        correct: stats.correct,
        total: stats.total,
        elapsedSec: totalSec,
        weakLessonIds: stats.weakLessonIds,
      };
      setHistory((prev) => [attempt, ...prev].slice(0, 8));
      onNotify(`أنهيت الاختبار بنتيجة ${stats.percentage}% (${stats.correct}/${stats.total})`);
    },
    [
      config.examStyle,
      difficultyLabel,
      eliminatedMap,
      onFinishExamScore,
      onNotify,
      onRecordMistake,
      revealedHints,
      scopeLabel,
    ]
  );

  // Keep latest finalize callback for timers
  useEffect(() => {
    finishRef.current = () => finalizeExam(sessionQuestions, answers, elapsedSec);
  }, [answers, elapsedSec, finalizeExam, sessionQuestions]);

  // Move to next question (handles real-time adaptive question selection)
  const advanceQuestion = useCallback(() => {
    if (!currentQuestion) return;

    // If we are already before the last loaded question, just move index forward
    if (examIdx < sessionQuestions.length - 1) {
      setExamIdx((i) => i + 1);
      if (config.timerMode === 'per-question') {
        setQuestionRemainingSec(config.secondsPerQuestion);
      }
      return;
    }

    // If adaptive mode has more slots to fill, dynamically pick the next question
    if (
      config.difficulty === 'adaptive' &&
      !isRemedialMode &&
      sessionQuestions.length < targetSessionLength
    ) {
      const picked = answers[currentQuestion.id];
      const wasCorrect = picked === currentQuestion.correctIndex;
      const nextStreak = wasCorrect ? streak + 1 : 0;
      const nextLevel = stepAdaptiveDifficulty(adaptiveLevel, wasCorrect, nextStreak);
      const askedIds = new Set(sessionQuestions.map((q) => q.id));
      const nextQ = pickAdaptiveNextQuestion(sessionPool, askedIds, nextLevel);

      if (nextQ) {
        setStreak(nextStreak);
        setAdaptiveLevel(nextLevel);
        setAdaptiveTrend(
          nextLevel === adaptiveLevel ? 'steady' : wasCorrect ? 'up' : 'down'
        );
        setSessionQuestions((prev) => [...prev, nextQ]);
        setExamIdx((i) => i + 1);
        if (config.timerMode === 'per-question') {
          setQuestionRemainingSec(config.secondsPerQuestion);
        }
        return;
      }
    }

    finalizeExam(sessionQuestions, answers, elapsedSec);
  }, [
    adaptiveLevel,
    answers,
    config.difficulty,
    config.secondsPerQuestion,
    config.timerMode,
    currentQuestion,
    elapsedSec,
    examIdx,
    finalizeExam,
    isRemedialMode,
    sessionPool,
    sessionQuestions,
    streak,
    targetSessionLength,
  ]);

  const advanceRef = useRef(advanceQuestion);
  useEffect(() => {
    advanceRef.current = advanceQuestion;
  }, [advanceQuestion]);

  // Active exam timer loop
  useEffect(() => {
    if (phase !== 'running' || paused) return;

    const timerId = window.setInterval(() => {
      setElapsedSec((s) => s + 1);

      if (config.timerMode === 'total-exam') {
        setExamRemainingSec((rem) => {
          if (rem <= 1) {
            window.setTimeout(() => {
              onNotify('انتهى الوقت المحدد للاختبار — تم تسليم إجاباتك تلقائياً');
              finishRef.current();
            }, 0);
            return 0;
          }
          return rem - 1;
        });
      } else if (config.timerMode === 'per-question') {
        setQuestionRemainingSec((rem) => {
          if (rem <= 1) {
            window.setTimeout(() => {
              advanceRef.current();
            }, 0);
            return config.secondsPerQuestion;
          }
          return rem - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [config.secondsPerQuestion, config.timerMode, onNotify, paused, phase]);

  // Keyboard shortcuts during running exam (1-4 select option, Enter next)
  useEffect(() => {
    if (phase !== 'running' || paused || !currentQuestion) return;

    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const keyNum = Number(e.key);
      if (keyNum >= 1 && keyNum <= currentQuestion.options.length) {
        const optIdx = keyNum - 1;
        const eliminated = eliminatedMap[currentQuestion.id] ?? [];
        if (eliminated.includes(optIdx)) return;
        if (config.examStyle === 'training' && answers[currentQuestion.id] !== undefined) {
          return;
        }
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [answers, config.examStyle, currentQuestion, eliminatedMap, paused, phase]);

  const launchSession = (customQuestions?: QuizQuestion[], remedial = false) => {
    const pool = customQuestions ?? matchingQuestions;
    if (pool.length === 0) {
      onNotify('لا توجد أسئلة مطابقة للفلاتر الحالية، جرّب توسيع النطاق');
      return;
    }

    const desiredCount =
      customQuestions !== undefined
        ? customQuestions.length
        : config.questionCount === 0
        ? pool.length
        : Math.min(config.questionCount, pool.length);

    setIsRemedialMode(remedial);
    setSessionPool(pool);
    setTargetSessionLength(desiredCount);
    setAnswers({});
    setFlaggedIds([]);
    setRevealedHints({});
    setEliminatedMap({});
    setLifelinesRemaining(MAX_LIFELINES_5050);
    setElapsedSec(0);
    setPaused(false);
    setStreak(0);
    setAdaptiveTrend('steady');
    setExamIdx(0);

    if (config.difficulty === 'adaptive' && !remedial) {
      const startDiff: QuizDifficulty = 'متوسط';
      setAdaptiveLevel(startDiff);
      const firstQ = pickAdaptiveNextQuestion(pool, new Set(), startDiff) ?? pool[0];
      setSessionQuestions([firstQ]);
    } else {
      const built =
        customQuestions !== undefined
          ? customQuestions
          : buildStaticExamSession(pool, config);
      setSessionQuestions(built);
    }

    if (config.timerMode === 'total-exam') {
      setExamRemainingSec(desiredCount * config.secondsPerQuestion);
    } else if (config.timerMode === 'per-question') {
      setQuestionRemainingSec(config.secondsPerQuestion);
    }

    setPhase('running');
  };

  const applyPreset = (preset: 'quick' | 'elite' | 'comprehensive') => {
    if (preset === 'quick') {
      setConfig({
        ...DEFAULT_ADAPTIVE_CONFIG,
        unitId: 'all',
        lessonId: 'all',
        difficulty: 'adaptive',
        skillType: 'all',
        questionCount: 5,
        timerMode: 'total-exam',
        secondsPerQuestion: 45,
        examStyle: 'training',
      });
      onNotify('تم تطبيق قالب: مراجعة سريعة (5 أسئلة تكيّفية)');
    } else if (preset === 'elite') {
      setConfig({
        ...DEFAULT_ADAPTIVE_CONFIG,
        unitId: 'all',
        lessonId: 'all',
        difficulty: 'متقدم',
        skillType: 'all',
        questionCount: 10,
        timerMode: 'per-question',
        secondsPerQuestion: 30,
        examStyle: 'exam',
        enableHints: false,
        enableLifeline5050: false,
      });
      onNotify('تم تطبيق قالب: تحدي المتفوقين (مستوى متقدم • 30ث لكل سؤال)');
    } else {
      setConfig({
        ...DEFAULT_ADAPTIVE_CONFIG,
        unitId: 'all',
        lessonId: 'all',
        difficulty: 'all',
        skillType: 'all',
        questionCount: 15,
        timerMode: 'total-exam',
        secondsPerQuestion: 60,
        examStyle: 'exam',
      });
      onNotify('تم تطبيق قالب: امتحان شامل للمنهج (15 سؤال)');
    }
  };

  const handleSelectUnit = (unitId: AdaptiveUnitOption) => {
    setConfig((prev) => ({
      ...prev,
      unitId,
      lessonId: 'all',
    }));
  };

  const handleSelectOption = (question: QuizQuestion, optIdx: number) => {
    const eliminated = eliminatedMap[question.id] ?? [];
    if (eliminated.includes(optIdx)) return;

    // In training mode, lock option once answered so feedback is honest
    if (config.examStyle === 'training' && answers[question.id] !== undefined) {
      return;
    }

    setAnswers((prev) => ({ ...prev, [question.id]: optIdx }));

    // Update streak preview & record mistakes immediately in training mode
    if (config.examStyle === 'training') {
      if (optIdx === question.correctIndex) {
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
        onRecordMistake(buildMistakeFromQuizQuestion(question, optIdx, 'adaptive-quiz'));
      }
    }
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleRevealHint = (qId: string) => {
    if (!config.enableHints) return;
    setRevealedHints((prev) => ({ ...prev, [qId]: true }));
  };

  const handleUse5050 = (question: QuizQuestion) => {
    if (!config.enableLifeline5050 || lifelinesRemaining <= 0) return;
    if (eliminatedMap[question.id]) return;
    const eliminated = computeEliminatedOptions(
      question.options.length,
      question.correctIndex,
      examIdx + question.id.length
    );
    setEliminatedMap((prev) => ({ ...prev, [question.id]: eliminated }));
    setLifelinesRemaining((r) => Math.max(0, r - 1));
    onNotify('تم استبعاد خيارين خاطئين بنجاح (50/50)');
  };

  const handleRetryMistakes = () => {
    const missedQs = sessionQuestions.filter((q) => report.missedQuestionIds.includes(q.id));
    if (missedQs.length === 0) return;
    launchSession(missedQs, true);
    onNotify(`بدأ تدريب مركّز على ${missedQs.length} أسئلة من أخطائك`);
  };

  const filteredReviewQuestions = useMemo(() => {
    if (reviewFilter === 'wrong') {
      return sessionQuestions.filter((q) => answers[q.id] !== q.correctIndex);
    }
    if (reviewFilter === 'flagged') {
      return sessionQuestions.filter((q) => flaggedIds.includes(q.id));
    }
    return sessionQuestions;
  }, [answers, flaggedIds, reviewFilter, sessionQuestions]);

  // =========================================================================
  // PHASE 1: SMART CONFIGURATION STUDIO
  // =========================================================================
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        {/* Header & Quick Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl theme-bg-soft flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 theme-text" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                الاختبار التكيّفي الذكي
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                خصّص اختبارك بدقة حسب الوحدة، الدرس، مستوى الصعوبة، نوع المهارة، والمؤقت مع تحليل فوري شامل للأداء
              </p>
            </div>
          </div>

          {/* One-Click Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
              قوالب جاهزة:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('quick')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-emerald-500/50 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 theme-text" />
              <span>سريع (5 أسئلة)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('elite')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-rose-500/50 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>تحدي المتفوقين</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('comprehensive')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-amber-500/50 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>امتحان شامل</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Configuration Controls (Right Column in RTL: 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Unit Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <Layers className="w-4 h-4 theme-text" />
                <span>1. اختيار الوحدة / الباب الدراسي</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={config.unitId === 'all'}
                  onClick={() => handleSelectUnit('all')}
                  className={`p-3.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                    config.unitId === 'all'
                      ? 'theme-border theme-bg-soft theme-text shadow-sm'
                      : 'border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/30'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-sm">جميع الوحدات الدراسية</div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      شامل كامل المنهج (3 أبواب · 6 دروس)
                    </div>
                  </div>
                  <span className="text-xs font-black px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 tabular-nums shrink-0">
                    {allQuestions.length} س
                  </span>
                </button>

                {unitCatalog.map((u) => (
                  <button
                    key={u.unitId}
                    type="button"
                    aria-pressed={config.unitId === u.unitId}
                    onClick={() => handleSelectUnit(u.unitId)}
                    className={`p-3.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                      config.unitId === u.unitId
                        ? 'theme-border theme-bg-soft theme-text shadow-sm'
                        : 'border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-white/[0.03] hover:border-slate-400 dark:hover:border-white/30'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm truncate">{u.unitName}</div>
                      <div className="text-[11px] opacity-75 mt-0.5">
                        {u.lessonCount} دروس منهجية متخصصة
                      </div>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 tabular-nums shrink-0">
                      {u.questionCount} س
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Lesson Selection (Dynamic Cascading) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="adaptive-lesson-select"
                  className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100"
                >
                  <BookOpen className="w-4 h-4 theme-text" />
                  <span>2. اختيار الدرس المحدد</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  يتحدّث تلقائياً حسب الوحدة المختارة
                </span>
              </div>

              <select
                id="adaptive-lesson-select"
                aria-label="اختيار الدرس المحدد"
                value={config.lessonId}
                onChange={(e) => setConfig((prev) => ({ ...prev, lessonId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="all">
                  {config.unitId === 'all'
                    ? `جميع الدروس في المنهج (${availableLessons.length} دروس)`
                    : `جميع دروس هذه الوحدة (${availableLessons.length} دروس)`}
                </option>
                {availableLessons.map((lesson) => {
                  const qCount = allQuestions.filter((q) => q.lessonId === lesson.id).length;
                  return (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.numberLabel}: {lesson.title} ({qCount} أسئلة)
                    </option>
                  );
                })}
              </select>

              {/* Quick Lesson Chips */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, lessonId: 'all' }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    config.lessonId === 'all'
                      ? 'theme-border theme-bg-soft theme-text'
                      : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  كل الدروس
                </button>
                {availableLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, lessonId: lesson.id }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      config.lessonId === lesson.id
                        ? 'theme-border theme-bg-soft theme-text'
                        : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {lesson.numberLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Difficulty Level & Skill Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Target className="w-4 h-4 theme-text" />
                  <span>3. مستوى الصعوبة</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'adaptive', label: 'تكيّفي ذكي', sub: 'يتدرج تلقائياً' },
                      { id: 'all', label: 'متنوع شامل', sub: 'كل المستويات' },
                      { id: 'سهل', label: 'سهل', sub: 'تأسيسي ومباشر' },
                      { id: 'متوسط', label: 'متوسط', sub: 'تطبيق منهجي' },
                      { id: 'متقدم', label: 'متقدم', sub: 'قدرات عليا' },
                    ] as Array<{ id: AdaptiveDifficultyOption; label: string; sub: string }>
                  ).map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={config.difficulty === item.id}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, difficulty: item.id }))
                      }
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer ${
                        idx === 0 ? 'col-span-2' : ''
                      } ${
                        config.difficulty === item.id
                          ? 'theme-border theme-bg-soft theme-text'
                          : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.03]'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.id === 'adaptive' && <Sparkles className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-[11px] opacity-75 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Filter className="w-4 h-4 theme-text" />
                  <span>4. نوع المهارة العلمية</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      { id: 'all', label: 'جميع المهارات الكيميائية' },
                      { id: 'فهم ومفاهيم', label: 'فهم ومفاهيم نظرية' },
                      { id: 'حسابات كيميائية', label: 'مسائل وحسابات كيميائية' },
                      { id: 'معادلات وتفاعلات', label: 'معادلات وتفاعلات مخبرية' },
                    ] as Array<{ id: AdaptiveSkillOption; label: string }>
                  ).map((sk) => (
                    <button
                      key={sk.id}
                      type="button"
                      aria-pressed={config.skillType === sk.id}
                      onClick={() => setConfig((prev) => ({ ...prev, skillType: sk.id }))}
                      className={`px-3 py-2.5 rounded-xl border text-right text-xs font-bold transition cursor-pointer ${
                        config.skillType === sk.id
                          ? 'theme-border theme-bg-soft theme-text'
                          : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.03]'
                      }`}
                    >
                      {sk.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Exam Style, Timer Mode & Question Count */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-5">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Sliders className="w-4 h-4 theme-text" />
                <span>5. أسلوب الاختبار والمؤقت وعدد الأسئلة</span>
              </div>

              {/* Exam Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      id: 'training',
                      title: 'وضع التدريب التفاعلي',
                      desc: 'تصحيح فوري وعرض التفسير العلمي بعد كل سؤال مباشرة',
                    },
                    {
                      id: 'exam',
                      title: 'وضع الامتحان الرسمي',
                      desc: 'يحاكي الاختبار الفعلي وتظهر النتيجة والتفسيرات بعد التسليم',
                    },
                  ] as Array<{ id: AdaptiveExamStyle; title: string; desc: string }>
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={config.examStyle === mode.id}
                    onClick={() => setConfig((prev) => ({ ...prev, examStyle: mode.id }))}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                      config.examStyle === mode.id
                        ? 'theme-border theme-bg-soft theme-text'
                        : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.03]'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-extrabold">{mode.title}</div>
                    <div className="text-[11px] opacity-75 mt-1 leading-relaxed">{mode.desc}</div>
                  </button>
                ))}
              </div>

              {/* Question Count & Timer Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    عدد الأسئلة المطلوبة
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[5, 8, 10, 15, 0].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        aria-pressed={config.questionCount === cnt}
                        onClick={() => setConfig((prev) => ({ ...prev, questionCount: cnt }))}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer tabular-nums ${
                          config.questionCount === cnt
                            ? 'theme-border theme-bg-soft theme-text'
                            : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.03]'
                        }`}
                      >
                        {cnt === 0 ? `الكل (${matchingQuestions.length})` : `${cnt} أسئلة`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    نظام المؤقت الزمني
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'total-exam', label: 'مؤقت شامل' },
                        { id: 'per-question', label: 'مؤقت للسؤال' },
                        { id: 'none', label: 'بدون مؤقت' },
                      ] as Array<{ id: AdaptiveTimerMode; label: string }>
                    ).map((tm) => (
                      <button
                        key={tm.id}
                        type="button"
                        aria-pressed={config.timerMode === tm.id}
                        onClick={() => setConfig((prev) => ({ ...prev, timerMode: tm.id }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          config.timerMode === tm.id
                            ? 'theme-border theme-bg-soft theme-text'
                            : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.03]'
                        }`}
                      >
                        {tm.label}
                      </button>
                    ))}
                  </div>
                  {config.timerMode !== 'none' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500">الزمن لكل سؤال:</span>
                      {[30, 45, 60, 90].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({ ...prev, secondsPerQuestion: sec }))
                          }
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer tabular-nums ${
                            config.secondsPerQuestion === sec
                              ? 'theme-border theme-bg-soft theme-text'
                              : 'border-slate-200 dark:border-white/15'
                          }`}
                        >
                          {sec}ث
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Extra Smart Capabilities Toggles */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.shuffleQuestions}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>خلط عشوائي لترتيب الأسئلة</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.enableHints}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, enableHints: e.target.checked }))
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>تفعيل التلميحات العلمية أثناء الحل</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.enableLifeline5050}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        enableLifeline5050: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>تفعيل وسيلة حذف إجابتين (50/50)</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 text-xs font-bold select-none ${
                    knownWeakLessonIds.length === 0 ? 'opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={knownWeakLessonIds.length === 0}
                    checked={config.onlyWeakLessons}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        onlyWeakLessons: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>
                    التركيز على نقاط الضعف ({knownWeakLessonIds.length} دروس مسجّلة)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Mission Summary Sidebar (Left Column in RTL: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl border theme-border bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.06] dark:to-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold theme-text">ملخص جلسة الاختبار</span>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg theme-bg-soft theme-text tabular-nums">
                  {effectiveQuestionCount} / {matchingQuestions.length} سؤال
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2 py-2 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">النطاق المختار</span>
                  <span className="font-extrabold text-left max-w-[65%]">{scopeLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">المستوى</span>
                  <span className="font-extrabold">{difficultyLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">المهارة</span>
                  <span className="font-extrabold">
                    {config.skillType === 'all' ? 'شاملة' : config.skillType}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">الأسلوب</span>
                  <span className="font-extrabold">
                    {config.examStyle === 'training' ? 'تدريب بالتفسير الفوري' : 'امتحان رسمي'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-slate-500 dark:text-slate-400">الزمن المتوقع</span>
                  <span className="font-extrabold formula-ltr tabular-nums">
                    {config.timerMode === 'none'
                      ? 'مفتوح'
                      : formatSecondsClock(estimatedSeconds)}
                  </span>
                </div>
              </div>

              {matchingQuestions.length === 0 ? (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 font-extrabold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>لا توجد أسئلة تطابق جميع الفلاتر المختارة معاً</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig(DEFAULT_ADAPTIVE_CONFIG)}
                    className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs cursor-pointer"
                  >
                    إعادة ضبط الفلاتر تلقائياً
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => launchSession()}
                  className="w-full theme-grad-btn py-3.5 px-6 rounded-xl text-white font-extrabold text-sm sm:text-base inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  <span>ابدأ الاختبار التكيّفي الآن</span>
                </button>
              )}
            </div>

            {/* Recent Attempts History */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <History className="w-4 h-4 theme-text" />
                  <span>سجل المحاولات السابقة</span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    aria-label="مسح سجل المحاولات"
                    onClick={() => {
                      setHistory([]);
                      onNotify('تم مسح سجل المحاولات السابقة');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-500 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  لم تُسجّل أي محاولة بعد. أكمل أول اختبار لتفعيل تتبع التقدم وتحديد الدروس التي تحتاج مراجعة.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">{item.scopeLabel}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.difficultyLabel} · {item.correct}/{item.total} ·{' '}
                          <span className="formula-ltr">{formatSecondsClock(item.elapsedSec)}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg formula-ltr shrink-0 ${
                          item.percentage >= 80
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : item.percentage >= 60
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 2: ACTIVE INTERACTIVE EXAM SESSION
  // =========================================================================
  if (phase === 'running' && currentQuestion) {
    const pickedIdx = answers[currentQuestion.id];
    const isAnswered = pickedIdx !== undefined;
    const isFlagged = flaggedIds.includes(currentQuestion.id);
    const hintVisible = Boolean(revealedHints[currentQuestion.id]);
    const eliminatedIndices = eliminatedMap[currentQuestion.id] ?? [];
    const totalPlanned = Math.max(targetSessionLength, sessionQuestions.length);

    const activeClockSec =
      config.timerMode === 'total-exam'
        ? examRemainingSec
        : config.timerMode === 'per-question'
        ? questionRemainingSec
        : elapsedSec;
    const isLowTime = config.timerMode !== 'none' && activeClockSec <= 15;
    const isLastSlot = examIdx + 1 >= totalPlanned;

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Live HUD Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs sm:text-sm font-black tabular-nums">
              السؤال {examIdx + 1} من {totalPlanned}
            </span>

            <span
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${difficultyBadgeStyle(
                currentQuestion.difficulty
              )}`}
            >
              {currentQuestion.difficulty}
            </span>

            {config.difficulty === 'adaptive' && !isRemedialMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg theme-bg-soft theme-text text-[11px] font-extrabold">
                {adaptiveTrend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                {adaptiveTrend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                {adaptiveTrend === 'steady' && <Sparkles className="w-3.5 h-3.5" />}
                <span>تكيّفي: {adaptiveLevel}</span>
              </span>
            )}

            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold tabular-nums">
                <Flame className="w-3.5 h-3.5" />
                <span>سلسلة {streak}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-black formula-ltr tabular-nums ${
                isLowTime
                  ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-300 animate-pulse'
                  : 'border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 theme-text'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatSecondsClock(activeClockSec)}</span>
            </span>

            <button
              type="button"
              aria-label={paused ? 'استئناف الاختبار' : 'إيقاف مؤقت للاختبار'}
              onClick={() => setPaused((p) => !p)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-slate-400 cursor-pointer"
            >
              {paused ? <Play className="w-4 h-4 theme-text" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => finalizeExam(sessionQuestions, answers, elapsedSec)}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-extrabold cursor-pointer"
            >
              إنهاء وتسليم
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full theme-grad-btn transition-all duration-300"
            style={{ width: `${Math.min(100, ((examIdx + 1) / totalPlanned) * 100)}%` }}
          />
        </div>

        {/* Question Navigator Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: totalPlanned }).map((_, i) => {
            const loadedQ = sessionQuestions[i];
            const ans = loadedQ ? answers[loadedQ.id] : undefined;
            const flagged = loadedQ ? flaggedIds.includes(loadedQ.id) : false;
            const isCurr = i === examIdx;
            const canJump = Boolean(loadedQ);

            let chipCls =
              'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-500';
            if (isCurr) {
              chipCls = 'theme-border theme-bg-soft theme-text ring-2 ring-emerald-500/25';
            } else if (loadedQ && ans !== undefined) {
              if (config.examStyle === 'training') {
                chipCls =
                  ans === loadedQ.correctIndex
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300';
              } else {
                chipCls = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
              }
            }

            return (
              <button
                key={i}
                type="button"
                disabled={!canJump}
                aria-label={`الانتقال إلى السؤال ${i + 1}`}
                onClick={() => canJump && setExamIdx(i)}
                className={`relative w-8 h-8 rounded-lg border text-xs font-extrabold tabular-nums transition ${
                  canJump ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                } ${chipCls}`}
              >
                {i + 1}
                {flagged && (
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white dark:border-slate-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Paused Overlay Guard */}
        {paused ? (
          <div className="p-10 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-100/90 dark:bg-slate-900/90 text-center space-y-4">
            <Pause className="w-10 h-10 theme-text mx-auto" />
            <h4 className="text-lg font-black">الاختبار متوقف مؤقتاً</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تم إخفاء السؤال وإيقاف المؤقت للحفاظ على نزاهة التقييم.
            </p>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>استئناف الاختبار</span>
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-5">
            {/* Breadcrumb & Smart Tools Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>{currentQuestion.unit}</span>
                <span className="mx-1.5 opacity-50">•</span>
                <span className="theme-text">{currentQuestion.lessonTitle}</span>
                <span className="mx-1.5 opacity-50">•</span>
                <span>{currentQuestion.skillType}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={isFlagged}
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    isFlagged
                      ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-white/15 bg-white dark:bg-white/5'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isFlagged ? 'مُعلّم للمراجعة' : 'تمييز للمراجعة'}</span>
                </button>

                {config.enableHints && (
                  <button
                    type="button"
                    disabled={hintVisible}
                    onClick={() => handleRevealHint(currentQuestion.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-amber-400 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{hintVisible ? 'تم عرض التلميح' : 'تلميح علمي'}</span>
                  </button>
                )}

                {config.enableLifeline5050 && (
                  <button
                    type="button"
                    disabled={
                      lifelinesRemaining <= 0 ||
                      eliminatedIndices.length > 0 ||
                      (config.examStyle === 'training' && isAnswered)
                    }
                    onClick={() => handleUse5050(currentQuestion)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-45 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 theme-text" />
                    <span>حذف إجابتين ({lifelinesRemaining})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Prompt & Formula */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h3>
              {currentQuestion.formula && (
                <code className="inline-block formula-ltr px-3.5 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-950/80 border border-slate-300/60 dark:border-white/10 text-xs sm:text-sm font-bold theme-text">
                  {currentQuestion.formula}
                </code>
              )}
            </div>

            {/* Scientific Hint Callout */}
            {hintVisible && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold ml-1">تلميح علمي:</span>
                  {currentQuestion.hint}
                </div>
              </div>
            )}

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = pickedIdx === idx;
                const isEliminated = eliminatedIndices.includes(idx);
                const isCorrectOpt = idx === currentQuestion.correctIndex;
                const showInstantFeedback = config.examStyle === 'training' && isAnswered;

                let optCls =
                  'border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:border-slate-400 dark:hover:border-white/30';
                if (isEliminated) {
                  optCls =
                    'border-dashed border-slate-200 dark:border-white/10 opacity-35 line-through cursor-not-allowed';
                } else if (showInstantFeedback && isCorrectOpt) {
                  optCls =
                    'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200';
                } else if (showInstantFeedback && isSelected && !isCorrectOpt) {
                  optCls = 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200';
                } else if (isSelected) {
                  optCls = 'theme-border theme-bg-soft theme-text shadow-sm';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isEliminated}
                    onClick={() => handleSelectOption(currentQuestion, idx)}
                    className={`p-4 rounded-xl border text-right font-bold text-sm transition flex items-center justify-between gap-3 ${
                      isEliminated ? '' : 'cursor-pointer'
                    } ${optCls}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-black flex items-center justify-center shrink-0">
                        {ARABIC_OPTION_LETTERS[idx] ?? idx + 1}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>
                    {showInstantFeedback && isCorrectOpt && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    {showInstantFeedback && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Scientific Explanation (Training Mode) */}
            {config.examStyle === 'training' && isAnswered && (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-1">
                <div className="font-extrabold theme-text">
                  {pickedIdx === currentQuestion.correctIndex
                    ? 'إجابة صحيحة! أحسنت التفكير'
                    : 'إجابة غير صحيحة — راجع التفسير العلمي:'}
                </div>
                <p className="leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                disabled={examIdx === 0}
                onClick={() => setExamIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-bold disabled:opacity-40 cursor-pointer"
              >
                السابق
              </button>

              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                اختصار لوحة المفاتيح: المفاتيح 1–4 لاختيار الإجابة
              </span>

              {!isLastSlot ? (
                <button
                  type="button"
                  onClick={advanceQuestion}
                  className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-extrabold cursor-pointer"
                >
                  {isAnswered ? 'السؤال التالي' : 'تخطي للتالي'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => finalizeExam(sessionQuestions, answers, elapsedSec)}
                  className="theme-grad-btn px-6 py-2.5 rounded-xl text-white text-sm font-extrabold cursor-pointer"
                >
                  إنهاء وعرض التحليل الكامل
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PHASE 3: MULTI-DIMENSIONAL ANALYTICS & TARGETED REVIEW
  // =========================================================================
  const activeBreakdown =
    analyticsTab === 'unit'
      ? report.byUnit
      : analyticsTab === 'lesson'
      ? report.byLesson
      : analyticsTab === 'difficulty'
      ? report.byDifficulty
      : report.bySkill;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Result Summary Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
        <div className="space-y-2 text-center sm:text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold theme-text">
            <Award className="w-4 h-4" />
            <span>
              تقرير الأداء التحليلي · {report.masteryTier}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {report.gradeLabel}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            النطاق: <span className="font-bold text-slate-800 dark:text-slate-200">{scopeLabel}</span> ({difficultyLabel})
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1 text-xs font-bold tabular-nums">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              صحيح: {report.correct}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300">
              خطأ/متروك: {report.wrong}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/10 formula-ltr">
              الزمن: {formatSecondsClock(elapsedSec)}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/10">
              متوسط السؤال: {report.avgSecondsPerQuestion}ث
            </span>
          </div>
        </div>

        {/* Circular SVG Ring */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.14"
              strokeWidth="9"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--p-primary)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${report.percentage * 2.64} 264`}
            />
          </svg>
          <span className="absolute formula-ltr text-2xl font-black theme-text">
            {report.percentage}%
          </span>
        </div>
      </div>

      {/* Smart Diagnosis & Recommendation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {report.strongestUnit && (
          <div
            className={`p-4 rounded-xl border space-y-1 ${
              report.strongestUnit.percentage > 0
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04]'
            }`}
          >
            <div
              className={`text-[11px] font-extrabold ${
                report.strongestUnit.percentage > 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {report.strongestUnit.percentage > 0
                ? 'أقوى أداء في هذه المحاولة'
                : 'بداية المسار التدريبي'}
            </div>
            <div className="text-xs sm:text-sm font-black">
              {report.strongestUnit.percentage > 0
                ? report.strongestUnit.label
                : 'لم تتحقق إجابات صحيحة بعد'}
            </div>
            <div className="text-xs font-bold tabular-nums opacity-80">
              {report.strongestUnit.percentage > 0
                ? `نسبة الإتقان: ${report.strongestUnit.percentage}% (${report.strongestUnit.correct}/${report.strongestUnit.total})`
                : 'راجع التفسير العلمي للأسئلة بالأسفل ثم أعد المحاولة'}
            </div>
          </div>
        )}

        {report.weakestLesson && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
            <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
              أولوية المراجعة المقترحة
            </div>
            <div className="text-xs sm:text-sm font-black">{report.weakestLesson.label}</div>
            <div className="text-xs font-bold tabular-nums opacity-80">
              نسبة الإتقان: {report.weakestLesson.percentage}% ({report.weakestLesson.correct}/
              {report.weakestLesson.total})
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] space-y-1">
          <div className="text-[11px] font-extrabold theme-text">توصية المدرب الذكي</div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {report.recommendation}
          </p>
        </div>
      </div>

      {/* Multi-Dimensional Analytics Breakdown */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-extrabold text-sm">التحليل التفصيلي متعدد الأبعاد</h4>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="أبعاد تحليل النتائج">
            {(
              [
                { id: 'unit', label: 'حسب الأبواب' },
                { id: 'lesson', label: 'حسب الدروس' },
                { id: 'difficulty', label: 'حسب الصعوبة' },
                { id: 'skill', label: 'حسب المهارات' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={analyticsTab === tab.id}
                onClick={() => setAnalyticsTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  analyticsTab === tab.id
                    ? 'theme-grad-btn text-white'
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {activeBreakdown.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="truncate">{row.label}</span>
                <span className="tabular-nums shrink-0">
                  {row.correct}/{row.total} ({row.percentage}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full theme-grad-btn transition-all"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {report.missedQuestionIds.length > 0 && (
          <button
            type="button"
            onClick={handleRetryMistakes}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold inline-flex items-center gap-2 transition cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>إعادة اختبار أخطائي فقط ({report.missedQuestionIds.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => launchSession()}
          className="theme-grad-btn px-5 py-2.5 rounded-xl text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة بنفس الإعدادات</span>
        </button>

        <button
          type="button"
          onClick={() => setPhase('setup')}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-bold inline-flex items-center gap-2 hover:border-slate-400 cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>تعديل إعدادات الاختبار</span>
        </button>
      </div>

      {/* Detailed Question-by-Question Review */}
      <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-extrabold text-sm">مراجعة إجابات الاختبار والتفسير العلمي</h4>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `الكل (${sessionQuestions.length})` },
                { id: 'wrong', label: `الأخطاء فقط (${report.missedQuestionIds.length})` },
                { id: 'flagged', label: `المُعلّمة للمراجعة (${flaggedIds.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReviewFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                  reviewFilter === f.id
                    ? 'theme-border theme-bg-soft theme-text'
                    : 'border-slate-200 dark:border-white/15'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReviewQuestions.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center text-xs font-bold text-slate-500">
            لا توجد أسئلة ضمن هذا الفلتر.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviewQuestions.map((q, idx) => {
              const picked = answers[q.id];
              const isCorrect = picked === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                      : 'border-rose-500/30 bg-rose-500/[0.04]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>
                      {idx + 1}. {q.unit} · {q.lessonTitle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border ${difficultyBadgeStyle(
                        q.difficulty
                      )}`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {q.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      إجابتك: {picked !== undefined ? q.options[picked] : 'لم تُجب'}
                    </div>
                    <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                      الإجابة الصحيحة: {q.options[q.correctIndex]}
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                    <span className="font-extrabold theme-text ml-1">التفسير العلمي:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
