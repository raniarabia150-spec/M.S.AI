import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Timer,
} from 'lucide-react';
import { ACADEMY_DATA } from '../data/academyData';

interface StudioViewProps {
  active: boolean;
  masteredIds: string[];
  onToggleMastered: (id: string) => void;
  onNotify: (msg: string) => void;
}

export function StudioView({
  active,
  masteredIds,
  onToggleMastered,
  onNotify,
}: StudioViewProps) {
  const { heading, subheading, flashcards } = ACADEMY_DATA.studio;
  const [filterMode, setFilterMode] = useState<'all' | 'review'>('all');
  const [deckOrder, setDeckOrder] = useState<string[]>(() => flashcards.map((f) => f.id));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Pomodoro Focus Study Timer
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          onNotify(
            timerMode === 'focus'
              ? 'انتهت جلسة التركيز! خذ استراحة قصيرة لمدة 5 دقائق.'
              : 'انتهت الاستراحة! مستعد لجلسة مذاكرة جديدة.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMode, onNotify]);

  const deck = useMemo(() => {
    const ordered = deckOrder
      .map((id) => flashcards.find((c) => c.id === id))
      .filter((c): c is (typeof flashcards)[number] => Boolean(c));
    if (filterMode === 'review') {
      return ordered.filter((c) => !masteredIds.includes(c.id));
    }
    return ordered;
  }, [deckOrder, filterMode, flashcards, masteredIds]);

  const safeIdx = deck.length > 0 ? Math.min(currentIdx, deck.length - 1) : 0;
  const currentCard = deck[safeIdx];

  const handleNext = () => {
    if (deck.length === 0) return;
    setFlipped(false);
    setCurrentIdx((safeIdx + 1) % deck.length);
  };

  const handlePrev = () => {
    if (deck.length === 0) return;
    setFlipped(false);
    setCurrentIdx((safeIdx - 1 + deck.length) % deck.length);
  };

  const handleShuffle = () => {
    setDeckOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setCurrentIdx(0);
    setFlipped(false);
    onNotify('تم خلط البطاقات التعليمية عشوائياً');
  };

  const switchTimerPreset = (mode: 'focus' | 'break') => {
    setTimerRunning(false);
    setTimerMode(mode);
    setSecondsLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const masteryPct = Math.round((masteredIds.length / Math.max(1, flashcards.length)) * 100);

  return (
    <section
      id="view-studio"
      className={`app-view ${
        active ? 'view-reveal' : 'hidden'
      } max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black aurora-text">{heading}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subheading}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setFilterMode('all');
                setCurrentIdx(0);
                setFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                filterMode === 'all'
                  ? 'theme-grad-btn text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              جميع البطاقات ({flashcards.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('review');
                setCurrentIdx(0);
                setFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                filterMode === 'review'
                  ? 'theme-grad-btn text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              تحتاج مراجعة ({flashcards.length - masteredIds.length})
            </button>
          </div>
          <button
            type="button"
            onClick={handleShuffle}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 theme-text" />
            <span>خلط</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Flashcard Deck Stage */}
        <div className="lg:col-span-8 space-y-5">
          {!currentCard ? (
            <div className="p-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 theme-text mx-auto" />
              <h3 className="font-extrabold text-lg">أحسنت! أتقنت جميع البطاقات في هذه المجموعة</h3>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="theme-grad-btn px-5 py-2.5 rounded-xl text-white font-bold text-sm cursor-pointer"
              >
                عرض جميع البطاقات للمراجعة
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>{currentCard.unit}</span>
                <span className="tabular-nums">
                  بطاقة {safeIdx + 1} من {deck.length} · اضغط على البطاقة لقلبها
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-pressed={flipped}
                aria-label={`قلب البطاقة التعليمية: ${currentCard.front}`}
                className="flashcard-scene block w-full cursor-pointer text-center"
              >
                <div className={`flashcard-inner relative h-72 sm:h-80${flipped ? ' is-flipped' : ''}`}>
                  {/* Front Face */}
                  <div className="flashcard-face absolute inset-0 glass-panel p-8 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] shadow-md dark:shadow-none flex flex-col items-center justify-center gap-4">
                    <span className="text-xs font-bold theme-text">السؤال / المفهوم</span>
                    <p className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed max-w-xl">
                      {currentCard.front}
                    </p>
                    {currentCard.formulaHint && (
                      <code className="formula-ltr px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/70 text-xs sm:text-sm font-bold theme-text">
                        {currentCard.formulaHint}
                      </code>
                    )}
                    <span className="text-xs text-slate-400 mt-2">انقر لإظهار الإجابة النموذجية</span>
                  </div>

                  {/* Back Face */}
                  <div className="flashcard-face flashcard-back absolute inset-0 glass-panel p-8 rounded-2xl border-2 theme-border bg-white dark:bg-slate-900/95 shadow-xl flex flex-col items-center justify-center gap-4">
                    <span className="text-xs font-bold theme-text">الإجابة والشرح العلمي</span>
                    <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed max-w-xl">
                      {currentCard.back}
                    </p>
                    {currentCard.equation && (
                      <code className="formula-ltr px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-cyan-300">
                        {currentCard.equation}
                      </code>
                    )}
                  </div>
                </div>
              </button>

              {/* Deck Navigation & Mastery Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm font-bold inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابقة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm font-bold inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <span>التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleMastered(currentCard.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition cursor-pointer ${
                    masteredIds.includes(currentCard.id)
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'theme-grad-btn text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {masteredIds.includes(currentCard.id) ? 'بطاقة مُتقنة ✓' : 'تحديد كمُتقنة'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Studio Side Panel: Mastery Progress + Focus Timer */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                تقدم إتقان البطاقات
              </h3>
              <span className="font-black text-lg theme-text tabular-nums">{masteryPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full theme-grad-btn transition-all duration-500"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              أتقنت {masteredIds.length} من أصل {flashcards.length} بطاقة مراجعة أساسية.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-base text-slate-900 dark:text-slate-100">
                <Timer className="w-4 h-4 theme-text" />
                <span>مؤقت التركيز (بومودورو)</span>
              </div>
            </div>

            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              <button
                type="button"
                onClick={() => switchTimerPreset('focus')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  timerMode === 'focus'
                    ? 'theme-grad-btn text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                مذاكرة (25 د)
              </button>
              <button
                type="button"
                onClick={() => switchTimerPreset('break')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  timerMode === 'break'
                    ? 'theme-grad-btn text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                استراحة (5 د)
              </button>
            </div>

            <div className="text-center py-3">
              <div className="formula-ltr text-4xl font-black theme-text tabular-nums">
                {mins}:{secs}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="theme-grad-btn px-5 py-2.5 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'إيقاف مؤقت' : 'ابدأ الجلسة'}</span>
              </button>
              <button
                type="button"
                onClick={() => switchTimerPreset(timerMode)}
                aria-label="إعادة ضبط المؤقت"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
