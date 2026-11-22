import { useCallback, useEffect, useState } from 'react';
import { ACADEMY_DATA } from './data/academyData';
import { CertificatesView } from './components/CertificatesView';
import { CommandModal, type CommandJumpTarget } from './components/CommandModal';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LabView, type LabToolTab } from './components/LabView';
import {
  LessonsView,
  type HighlightedLessonSection,
} from './components/LessonsView';
import {
  MistakesView,
  type ExplanationJumpTarget,
} from './components/MistakesView';
import { OpenBookView } from './components/OpenBookView';
import { QuizView } from './components/QuizView';
import { SplashGate } from './components/SplashGate';
import { StudioView } from './components/StudioView';
import { ToastStack, type ToastMessage } from './components/ToastStack';
import type { SavedCertificate } from './utils/certificateEngine';
import {
  markMistakeResolved,
  removeMistakeRecord,
  upsertMistakeRecord,
  type MistakeInput,
  type MistakeRecord,
} from './utils/mistakesEngine';
import {
  normalizePalette,
  normalizeQuizSubTab,
  normalizeView,
  shouldAutostart,
  type AcademyViewId,
  type PaletteId,
  type QuizSubTabId,
} from './utils/academyState';

function readStoredArray(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [splashVisible, setSplashVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !shouldAutostart(window.location.search);
  });
  const [splashExiting, setSplashExiting] = useState(false);
  const [activeView, setActiveView] = useState<AcademyViewId>('home');
  const [activeQuizSub, setActiveQuizSub] = useState<QuizSubTabId>('bank');
  const [palette, setPaletteState] = useState<PaletteId>('emerald');
  const [isDark, setIsDark] = useState(true);
  const [cmdModalOpen, setCmdModalOpen] = useState(false);

  // Interactive Academy Persistent State
  const [selectedLessonId, setSelectedLessonId] = useState(ACADEMY_DATA.lessons.items[0].id);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    readStoredArray('chem_completed_lessons')
  );
  const [pinnedOpenBookIds, setPinnedOpenBookIds] = useState<string[]>(() =>
    readStoredArray('chem_pinned_openbook')
  );
  const [masteredCardIds, setMasteredCardIds] = useState<string[]>(() =>
    readStoredArray('chem_mastered_cards')
  );
  const [bestQuizScore, setBestQuizScore] = useState<number | null>(() => {
    try {
      const raw = window.localStorage.getItem('chem_best_quiz');
      const num = raw ? Number(raw) : NaN;
      return Number.isFinite(num) ? num : null;
    } catch {
      return null;
    }
  });
  const [savedCertificates, setSavedCertificates] = useState<SavedCertificate[]>(() => {
    try {
      const raw = window.localStorage.getItem('chem_saved_certificates');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedCertificate[]) : [];
    } catch {
      return [];
    }
  });
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const raw = window.localStorage.getItem('chem_mistake_records');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as MistakeRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [highlightedLessonSection, setHighlightedLessonSection] =
    useState<HighlightedLessonSection | null>(null);

  // Lab & OpenBook deep-link state
  const [labTool, setLabTool] = useState<LabToolTab>('experiments');
  const [selectedElementSymbol, setSelectedElementSymbol] = useState('Fe');
  const [openBookQuery, setOpenBookQuery] = useState('');

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chem_completed_lessons', JSON.stringify(completedLessons));
    } catch {
      // ignore storage quota issues
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chem_pinned_openbook', JSON.stringify(pinnedOpenBookIds));
    } catch {
      // ignore
    }
  }, [pinnedOpenBookIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chem_mastered_cards', JSON.stringify(masteredCardIds));
    } catch {
      // ignore
    }
  }, [masteredCardIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chem_saved_certificates', JSON.stringify(savedCertificates));
    } catch {
      // ignore
    }
  }, [savedCertificates]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chem_mistake_records', JSON.stringify(mistakes));
    } catch {
      // ignore
    }
  }, [mistakes]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdModalOpen((open) => !open);
      } else if (e.key === 'Escape' && cmdModalOpen) {
        setCmdModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cmdModalOpen]);

  const handleEnterPlatform = () => {
    if (splashExiting) return;
    setSplashExiting(true);
    window.setTimeout(() => {
      setSplashVisible(false);
    }, 550);
  };

  const handleSwitchView = (view: AcademyViewId) => {
    setActiveView(normalizeView(view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPalette = (nextPalette: PaletteId) => {
    const valid = normalizePalette(nextPalette);
    setPaletteState(valid);
    notify(`تم تفعيل لوحة الألوان: ${valid}`, 'info');
  };

  const handleToggleLessonComplete = (id: string) => {
    setCompletedLessons((prev) => {
      const exists = prev.includes(id);
      notify(exists ? 'تمت إزالة علامة الإتمام عن الدرس' : 'أحسنت! تم تسجيل إتمام الدرس بنجاح');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const handleTogglePinOpenBook = (id: string) => {
    setPinnedOpenBookIds((prev) => {
      const exists = prev.includes(id);
      notify(exists ? 'تمت إزالة القانون من المفضلة' : 'تم تثبيت القانون في ورقة المراجعة');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const handleToggleMasteredCard = (id: string) => {
    setMasteredCardIds((prev) => {
      const exists = prev.includes(id);
      notify(exists ? 'تمت إعادة البطاقة لقائمة المراجعة' : 'ممتاز! تم تسجيل إتقان البطاقة');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const handleFinishExamScore = (pct: number) => {
    setBestQuizScore((prev) => {
      const next = prev === null ? pct : Math.max(prev, pct);
      try {
        window.localStorage.setItem('chem_best_quiz', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleRecordMistake = useCallback(
    (input: MistakeInput) => {
      setMistakes((prev) => upsertMistakeRecord(prev, input));
      notify('تم حفظ السؤال في تبويب «أخطائي» للعودة إلى شرحه', 'info');
    },
    [notify]
  );

  const handleJumpToExplanation = (target: ExplanationJumpTarget) => {
    setSelectedLessonId(target.lessonId);
    setHighlightedLessonSection(target);
    setActiveView('lessons');
    notify(`تم نقلك إلى شرح: ${target.sectionTitle}`);
  };

  const unresolvedMistakesCount = mistakes.filter((m) => !m.resolved).length;

  const handleCommandJump = (target: CommandJumpTarget) => {
    if (target.lessonId) {
      setSelectedLessonId(target.lessonId);
    }
    if (target.elementSymbol) {
      setSelectedElementSymbol(target.elementSymbol);
      setLabTool('periodic');
    }
    if (target.openBookQuery !== undefined) {
      setOpenBookQuery(target.openBookQuery);
    }
    handleSwitchView(target.view);
  };

  return (
    <>
      <SplashGate
        brand={ACADEMY_DATA.brand}
        visible={splashVisible}
        exiting={splashExiting}
        onEnter={handleEnterPlatform}
      />

      <Header
        brand={ACADEMY_DATA.brand}
        activeView={activeView}
        palette={palette}
        isDark={isDark}
        unresolvedMistakesCount={unresolvedMistakesCount}
        onSwitchView={handleSwitchView}
        onSelectPalette={handleSelectPalette}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenCommand={() => setCmdModalOpen(true)}
      />

      <main className="flex-1">
        <HomeView
          active={activeView === 'home'}
          palette={palette}
          completedLessonsCount={completedLessons.length}
          masteredCardsCount={masteredCardIds.length}
          bestQuizScore={bestQuizScore}
          onSwitchView={handleSwitchView}
          onJumpToLesson={(lessonId) => {
            setSelectedLessonId(lessonId);
            setHighlightedLessonSection(null);
            handleSwitchView('lessons');
          }}
          onOpenLabTool={(tool, elementSymbol) => {
            setLabTool(tool);
            if (elementSymbol) {
              setSelectedElementSymbol(elementSymbol);
            }
            handleSwitchView('lab');
          }}
          onNotify={notify}
        />

        <LessonsView
          active={activeView === 'lessons'}
          selectedLessonId={selectedLessonId}
          completedLessons={completedLessons}
          highlightedSection={highlightedLessonSection}
          onSelectLesson={(id) => {
            setSelectedLessonId(id);
            if (highlightedLessonSection && highlightedLessonSection.lessonId !== id) {
              setHighlightedLessonSection(null);
            }
          }}
          onToggleComplete={handleToggleLessonComplete}
          onRecordMistake={handleRecordMistake}
          onClearHighlightedSection={() => setHighlightedLessonSection(null)}
          onReturnToMistakes={() => handleSwitchView('mistakes')}
          onNotify={notify}
        />

        <LabView
          active={activeView === 'lab'}
          activeTool={labTool}
          selectedElementSymbol={selectedElementSymbol}
          onSelectTool={setLabTool}
          onSelectElementSymbol={setSelectedElementSymbol}
          onNotify={notify}
        />

        <OpenBookView
          active={activeView === 'openbook'}
          initialQuery={openBookQuery}
          pinnedIds={pinnedOpenBookIds}
          onTogglePin={handleTogglePinOpenBook}
          onNotify={notify}
        />

        <StudioView
          active={activeView === 'studio'}
          masteredIds={masteredCardIds}
          onToggleMastered={handleToggleMasteredCard}
          onNotify={notify}
        />

        <QuizView
          active={activeView === 'quiz'}
          activeSubTab={activeQuizSub}
          onSwitchSubTab={(sub) => setActiveQuizSub(normalizeQuizSubTab(sub))}
          onFinishExamScore={handleFinishExamScore}
          onRecordMistake={handleRecordMistake}
          onNotify={notify}
        />

        <CertificatesView
          active={activeView === 'certificates'}
          savedCertificates={savedCertificates}
          onSaveCertificate={(cert) => {
            setSavedCertificates((prev) =>
              prev.some((c) => c.serial === cert.serial) ? prev : [cert, ...prev]
            );
            notify('تم حفظ شهادة التقدير في سجل شهاداتك بنجاح');
          }}
          onDeleteCertificate={(id) => {
            setSavedCertificates((prev) => prev.filter((c) => c.id !== id));
            notify('تم حذف الشهادة من السجل', 'info');
          }}
          onRecordMistake={handleRecordMistake}
          onNotify={notify}
        />

        <MistakesView
          active={activeView === 'mistakes'}
          mistakes={mistakes}
          onJumpToExplanation={handleJumpToExplanation}
          onToggleResolved={(questionId, resolved) => {
            setMistakes((prev) => markMistakeResolved(prev, questionId, resolved));
          }}
          onDeleteMistake={(questionId) => {
            setMistakes((prev) => removeMistakeRecord(prev, questionId));
            notify('تمت إزالة السؤال من سجل أخطائي', 'info');
          }}
          onClearAllMistakes={() => {
            setMistakes([]);
            notify('تم مسح سجل الأخطاء بالكامل', 'info');
          }}
          onNavigate={handleSwitchView}
          onNotify={notify}
        />
      </main>

      <footer className="border-t border-slate-200 dark:border-white/10 py-6 text-center text-xs text-slate-600 dark:text-slate-400">
        {ACADEMY_DATA.brand.footerText}
      </footer>

      <CommandModal
        open={cmdModalOpen}
        onClose={() => setCmdModalOpen(false)}
        onJump={handleCommandJump}
      />

      <ToastStack toasts={toasts} />
    </>
  );
}
