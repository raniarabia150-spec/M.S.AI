import { CheckCircle2, Info } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'success' | 'info';
}

interface ToastStackProps {
  toasts: ToastMessage[];
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div id="toastBox" className="fixed bottom-5 left-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="view-reveal pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-xl glass-panel text-xs sm:text-sm font-bold"
        >
          {toast.tone === 'info' ? (
            <Info className="w-4 h-4 theme-text shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 theme-text shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
